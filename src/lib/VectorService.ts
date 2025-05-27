import { QdrantClient } from '@qdrant/js-client-rest'
import { v4 as uuidv4 } from 'uuid'
import { JINA_API_KEY, QDRANT_LOCAL_URL } from 'src/config/envs'
// import fs from 'fs/promises'
// import path from 'path'

// Dashboard:
// http://localhost:6333/dashboard or https://cloud.qdrant.io/

export class VectorService {
	private client: QdrantClient

	constructor() {
		this.client = new QdrantClient({
			url: QDRANT_LOCAL_URL
			// apiKey: process.env.QDRANT_API_KEY
		})
	}

	async getCollections() {
		return await this.client.getCollections()
	}

	async ensureCollection(name: string) {
		const collections = await this.getCollections()
		if (!collections.collections.some((c) => c.name === name)) {
			await this.client.createCollection(name, {
				vectors: { size: 1024, distance: 'Cosine' } // Adjust size according to used embedding model!
			})
		}
	}

	async initializeCollectionWithData(
		name: string,
		points: Array<{
			id?: string
			text: string
			metadata?: Record<string, unknown>
		}>
	) {
		const collections = await this.getCollections()
		if (!collections.collections.some((c) => c.name === name)) {
			await this.ensureCollection(name)
			await this.addPoints(name, points)
		}
	}

	async addPoints(
		collectionName: string,
		points: Array<{
			id?: string
			text: string
			metadata?: Record<string, unknown>
		}>
	) {
		const pointsToUpsert = await Promise.all(
			points.map(async (point) => {
				const embedding = await this.createJinaEmbedding(point.text)

				return {
					id: point.id || uuidv4(),
					vector: embedding,
					payload: {
						text: point.text,
						...point.metadata
					}
				}
			})
		)

		// const pointsFilePath = path.join(__dirname, 'points.json')
		// await fs.writeFile(pointsFilePath, JSON.stringify(pointsToUpsert, null, 2))

		await this.client.upsert(collectionName, {
			wait: true,
			points: pointsToUpsert
		})
	}

	async performSearch(
		collectionName: string,
		query: string,
		filter: Record<string, unknown> = {},
		limit: number = 5
	) {
		const queryEmbedding = await this.createJinaEmbedding(query)
		return this.client.search(collectionName, {
			vector: queryEmbedding,
			limit,
			with_payload: true,
			filter
		})
	}

	async createJinaEmbedding(text: string): Promise<number[]> {
		try {
			const response = await fetch('https://api.jina.ai/v1/embeddings', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${JINA_API_KEY}`
				},
				body: JSON.stringify({
					model: 'jina-embeddings-v3',
					task: 'text-matching',
					dimensions: 1024,
					late_chunking: false,
					embedding_type: 'float',
					input: [text]
				})
			})

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`)
			}

			const data = await response.json()
			return data.data[0].embedding
		} catch (error) {
			console.error('Error creating Jina embedding:', error)
			throw error
		}
	}
}
