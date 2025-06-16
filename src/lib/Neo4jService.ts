import neo4j, { Driver, Session, Result, Integer } from 'neo4j-driver'
import { Record as Neo4jRecord } from 'neo4j-driver'
import { NEO4J_PASSWORD, NEO4J_URL, NEO4J_USER } from 'src/config/envs'

export class Neo4jService {
	private driver: Driver
	private uri = NEO4J_URL
	private username = NEO4J_USER
	private password = NEO4J_PASSWORD

	constructor() {
		this.driver = neo4j.driver(this.uri, neo4j.auth.basic(this.username, this.password))
	}

	private async runQuery(cypher: string, params: Record<string, unknown> = {}): Promise<Result> {
		const session: Session = this.driver.session()
		try {
			return await session.run(cypher, params)
		} finally {
			await session.close()
		}
	}

	async executeQuery(cypher: string, params: Record<string, unknown> = {}): Promise<Result> {
		return this.runQuery(cypher, params)
	}
	async clearDb(): Promise<Result> {
		return this.runQuery('MATCH (n) DETACH DELETE n')
	}

	async checkIndexExists(indexName: string): Promise<boolean> {
		const cypher = `
      SHOW INDEXES
      WHERE name = $indexName
    `
		const result = await this.runQuery(cypher, { indexName })
		return result.records.length > 0
	}

	async waitForIndexToBeOnline(indexName: string, maxWaitTimeMs: number = 30000): Promise<void> {
		const startTime = Date.now()
		while (Date.now() - startTime < maxWaitTimeMs) {
			const exists = await this.checkIndexExists(indexName)
			if (exists) {
				console.log(`Index '${indexName}' is online.`)
				return
			}
			await new Promise((resolve) => setTimeout(resolve, 1000)) // Wait for 1 second before checking again
		}
		throw new Error(`Timeout waiting for index '${indexName}' to come online.`)
	}

	async addNode(
		label: string,
		properties: Record<string, unknown>
	): Promise<{ id: number; properties: Record<string, unknown> }> {
		const cypher = `
      CREATE (n:${label} $properties)
      RETURN id(n) AS id, n
    `
		const result = await this.runQuery(cypher, { properties })
		return {
			id: (result.records[0].get('id') as Integer).toNumber(),
			properties: result.records[0].get('n').properties
		}
	}
	async addNodes(
		label: string,
		nodesList: Record<string, unknown>[]
	): Promise<Record<string, unknown>[]> {
		const cypher = `
      UNWIND $nodesList AS node
      CREATE (n:${label})
      SET n += node
      RETURN n
    `
		const result = await this.runQuery(cypher, { nodesList })
		return result.records.map((record) => record.get('n').properties)
	}

	async getNodeById(nodeId: string): Promise<Record<string, unknown> | null> {
		const cypher = `
      MATCH (n)
      WHERE id(n) = $nodeId
      RETURN n
    `
		const result = await this.runQuery(cypher, { nodeId })
		return result.records[0]?.get('n').properties || null
	}

	async updateNode(
		nodeId: string,
		properties: Record<string, unknown>
	): Promise<Record<string, unknown>> {
		const cypher = `
      MATCH (n)
      WHERE id(n) = $nodeId
      SET n += $properties
      RETURN n
    `
		const result = await this.runQuery(cypher, { nodeId, properties })
		return result.records[0].get('n').properties
	}

	async deleteNode(nodeId: string): Promise<boolean> {
		const cypher = `
      MATCH (n)
      WHERE id(n) = $nodeId
      DETACH DELETE n
    `
		await this.runQuery(cypher, { nodeId })
		return true
	}

	async connectNodes(
		fromNodeId: number,
		toNodeId: number,
		relationshipType: string,
		properties: Record<string, unknown> = {}
	): Promise<void> {
		const cypher = `
      MATCH (a), (b)
      WHERE id(a) = $fromNodeId AND id(b) = $toNodeId
      CREATE (a)-[r:${relationshipType} $properties]->(b)
      RETURN r
    `
		await this.runQuery(cypher, {
			fromNodeId: neo4j.int(fromNodeId),
			toNodeId: neo4j.int(toNodeId),
			properties
		})
	}

	async findNodeByProperty(
		label: string,
		propertyName: string,
		propertyValue: unknown
	): Promise<{ id: number; properties: Record<string, unknown> } | null> {
		const cypher = `
      MATCH (n:${label} {${propertyName}: $propertyValue})
      RETURN id(n) AS id, n
    `
		const result = await this.runQuery(cypher, { propertyValue })
		if (result.records.length === 0) {
			return null
		}
		const record = result.records[0]
		return {
			id: (record.get('id') as Integer).toNumber(),
			properties: record.get('n').properties
		}
	}

	async getNodeRelationships(
		nodeId: number,
		direction: 'INCOMING' | 'OUTGOING' | 'BOTH' = 'BOTH'
	): Promise<
		Array<{
			relationshipType: string
			relationship: Record<string, unknown>
			relatedNode: Record<string, unknown>
		}>
	> {
		if (!nodeId) {
			throw new Error('nodeId is required for getNodeRelationships')
		}
		console.log('Getting relationships for nodeId:', nodeId) // Add this line

		const directionClause =
			direction === 'INCOMING' ? '<-[r]-' : direction === 'OUTGOING' ? '-[r]->' : '-[r]-'

		const cypher = `
      MATCH (n)${directionClause}(related)
      WHERE id(n) = $nodeId
      RETURN type(r) AS relationshipType, r AS relationship, related
    `

		const result = await this.runQuery(cypher, { nodeId: neo4j.int(nodeId) })

		return result.records.map((record) => ({
			relationshipType: record.get('relationshipType'),
			relationship: record.get('relationship').properties,
			relatedNode: record.get('related').properties
		}))
	}

	async close(): Promise<void> {
		await this.driver.close()
	}

	async findNodesByProperty(
		label: string,
		propertyName: string,
		propertyValue: unknown
	): Promise<Array<{ id: number; properties: Record<string, unknown> }>> {
		const cypher = `
      MATCH (n:${label} {${propertyName}: $propertyValue})
      RETURN id(n) AS id, n
    `
		const result = await this.runQuery(cypher, { propertyValue })
		return result.records.map((record: Neo4jRecord) => ({
			id: (record.get('id') as Integer).toNumber(),
			properties: record.get('n').properties
		}))
	}

	async queryByRelationship(
		fromType: string,
		relationType: string,
		toType: string
	): Promise<
		Array<{
			from: Record<string, unknown>
			to: Record<string, unknown>
			relationship: Record<string, unknown>
		}>
	> {
		const cypher = `
      MATCH (from:${fromType})-[r:${relationType}]->(to:${toType})
      RETURN from, r, to
    `
		const result = await this.runQuery(cypher)
		return result.records.map((record: Neo4jRecord) => ({
			from: record.get('from').properties,
			to: record.get('to').properties,
			relationship: record.get('r').properties
		}))
	}

	// New method for flexible property-based querying
	async queryByProperties(
		label: string,
		properties: Record<string, unknown>
	): Promise<Array<{ id: number; properties: Record<string, unknown> }>> {
		const conditions = Object.entries(properties)
			.map(([key, value]) => `n.${key} = $${key}`)
			.join(' AND ')

		const cypher = `
      MATCH (n:${label})
      WHERE ${conditions}
      RETURN id(n) AS id, n
    `

		const result = await this.runQuery(cypher, properties)
		return result.records.map((record: Neo4jRecord) => ({
			id: (record.get('id') as Integer).toNumber(),
			properties: record.get('n').properties
		}))
	}
}
