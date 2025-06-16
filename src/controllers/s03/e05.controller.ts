import { Request, Response } from 'express'
import getErrorMessage from '@lib/handleErrors'
import { queryAiDevsDB, reportData } from '@lib/aidevs'
import { Neo4jService } from '@lib/Neo4jService'

type User = {
	userId: number
	username: string
}
type Connection = {
	user1_id: number
	user2_id: number
}
const graphDb = new Neo4jService()
/**
 * S03E05 — Graph DB
 */
export default async function playE05(_: Request, res: Response) {
	try {
		// Get users and connections from the AiDevs database
		const { users, connections } = await getDataFromDB()

		await graphDb.clearDb()
		await createNodes(users)
		await createConnections(connections)
		const answer = await getShortestPath()

		const reportResponse = await reportData('connections', answer)

		res.status(200).send(reportResponse)
	} catch (error) {
		const errorMessage = getErrorMessage(error)
		console.error('Error handling S03E05:', errorMessage)

		return res.status(500).json({ status: '❌ Error', message: errorMessage })
	}
}

async function getDataFromDB() {
	try {
		const usersData = (await queryAiDevsDB({ query: 'SELECT id, username FROM users' })) as {
			id: number
			username: string
		}[]
		const connections = (await queryAiDevsDB({
			query: 'SELECT user1_id, user2_id FROM connections'
		})) as Connection[]

		const users: User[] = usersData.map((user) => ({ userId: user.id, username: user.username }))

		return { users, connections }
	} catch (error) {
		throw new Error(`Failed to fetch data from AiDevs database: ${getErrorMessage(error)}`)
	}
}

async function createNodes(users: User[]) {
	try {
		await graphDb.addNodes('User', users)
	} catch (error) {
		throw new Error(`Failed to create nodes in Neo4j: ${getErrorMessage(error)}`)
	}
}
async function createConnections(connections: Connection[]) {
	try {
		for (const connection of connections) {
			const cypher = `
			MATCH (u1:User {userId: $user1_id}), (u2:User {userId: $user2_id})
			MERGE (u1)-[r:KNOWS]->(u2)
		`
			await graphDb.executeQuery(cypher, connection)
		}
	} catch (error) {
		throw new Error(`Failed to connects nodes in Neo4j: ${getErrorMessage(error)}`)
	}
}
async function getShortestPath() {
	try {
		const cypher = `
		MATCH (start:User {username: 'Rafał'})
        MATCH (end:User {username: 'Barbara'})
        MATCH path = shortestPath((start)-[:KNOWS*]-(end))
        RETURN [node in nodes(path) | node.username] as names`

		const result = await graphDb.executeQuery(cypher)

		if (result.records.length > 0) {
			const names = result.records[0].get('names') as string[]
			console.log('Shortest path:', names)
			return names.join(',')
		} else {
			throw new Error('Failed to find shortes path between Rafał and Barbara: No path found')
		}
	} catch (error) {
		throw new Error(
			`Failed to find shortes path between Rafał and Barbara: ${getErrorMessage(error)}`
		)
	}
}
