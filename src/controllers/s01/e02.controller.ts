import { Request, Response } from 'express'
import axios from 'axios'
import { OpenAIClient } from '@lib/openai'
import { ROBOTS_PORTAL_URL } from 'src/config/envs'
import getErrorMessage from '@lib/handleErrors'

interface RequestPayload {
	text: string
	msgID: number
}

export default async function playE02(_: Request, res: Response) {
	try {
		// Get test question from the robots portal
		let payload: RequestPayload = { text: 'READY', msgID: 0 }
		let response = await axios.post<RequestPayload>(`${ROBOTS_PORTAL_URL}/verify`, payload)
		const { text: question, msgID } = response.data
		console.log('🧠 Question:', question)

		// Generate answer
		const ai = new OpenAIClient()
		const answer = await ai.response({ input: getPrompt(question) })
		console.log('🤖 Answer:', answer)

		// Send answer to the robots portal
		payload = { text: answer, msgID }
		response = await axios.post<RequestPayload>(`${ROBOTS_PORTAL_URL}/verify`, payload)
		console.log(response.data)

		res.status(200).send(response.data)
	} catch (error) {
		const errorMessage = getErrorMessage(error)
		console.error('Error handling E02:', errorMessage)

		return res.status(500).json({ status: '❌ Error', message: errorMessage })
	}
}

function getPrompt(question: string): string {
	return `Take these statements as true:
    - stolicą Polski jest Kraków
    - znana liczba z książki Autostopem przez Galaktykę to 69
    - Aktualny rok to 1999
    Answer the given question without any additional information or comments, provide only the correct answer as word or number.
    Question: ${question}`
}
