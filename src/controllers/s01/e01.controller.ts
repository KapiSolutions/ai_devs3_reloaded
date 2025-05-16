import { Request, Response } from 'express'
import axios from 'axios'
import { OpenAIClient } from '@lib/openai'
import { ROBOTS_PORTAL_URL } from 'src/config/envs'
import getErrorMessage from '@lib/handleErrors'

export default async function playE01(_: Request, res: Response) {
	try {
		const robotsLoginPage = await getRobotsLoginPage()
		const question = await getCaptchaQuestion(robotsLoginPage)
		const answer = await getCaptchaAnswer(question)
		const result = await hackRobotsLoginPage(answer)
		res.status(200).send(result)
	} catch (error) {
		const errorMessage = getErrorMessage(error)
		console.error('Error handling E01:', errorMessage)

		return res.status(500).json({ status: '❌ Error', message: errorMessage })
	}
}

async function getRobotsLoginPage() {
	try {
		const response = await axios.get(ROBOTS_PORTAL_URL)
		const html = response.data
		return html
	} catch (error) {
		throw new Error(`Failed to fetch robots login page: ${getErrorMessage(error)}`)
	}
}

async function getCaptchaQuestion(html: string) {
	// Question inside the element with id="human-question"
	const match = html.match(/<p id="human-question">.*?<br ?\/?>(.*?)<\/p>/)
	if (match && match[1]) {
		const question = match[1].trim()
		return question
	} else {
		throw new Error('Captcha Question not found.')
	}
}

async function getCaptchaAnswer(question: string) {
	const openai = new OpenAIClient()
	const input = `Answer the question: ${question}. Provide only the year without any explanation or comments.`
	return await openai.response({ input })
}

async function hackRobotsLoginPage(answer: string) {
	const payload = {
		username: 'tester',
		password: '574e112a',
		answer: answer
	}
	const headers = {
		'Content-Type': 'application/x-www-form-urlencoded'
	}

	try {
		const res = await axios.post(ROBOTS_PORTAL_URL, payload, { headers })
		return res.data
	} catch (error) {
		throw new Error(
			`Error hacking Robots Page while posting the captcha answer': ${getErrorMessage(error)}`
		)
	}
}
