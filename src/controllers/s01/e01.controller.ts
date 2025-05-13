import { Request, Response } from 'express'
import axios from 'axios'
import { OpenAIClient } from '@lib/openai'

export default async function playE01(_: Request, res: Response) {
	try {
		const robotsLoginPage = await getRobotsLoginPage()
		const question = await getCaptchaQuestion(robotsLoginPage)
		const answer = await getCaptchaAnswer(question)
		const result = await hackRobotsLoginPage(answer)
		res.status(200).send(result)
	} catch (error) {
		console.error('Error handling E01:', error)
		res.status(500).send({
			message: '❌ Error handling E01',
			error: error instanceof Error ? error.message : error
		})
	}
}

async function getRobotsLoginPage() {
	try {
		const response = await axios.get('https://xyz.ag3nts.org/')
		const html = response.data
		return html
	} catch (error) {
		console.error(
			'Error fetching robots login page:',
			error instanceof Error ? error.message : error
		)
		throw new Error('Failed to fetch robots login page')
	}
}

async function getCaptchaQuestion(html: string) {
	// Question inside the element with id="human-question"
	const match = html.match(/<p id="human-question">.*?<br ?\/?>(.*?)<\/p>/)
	if (match && match[1]) {
		const question = match[1].trim()
		return question
	} else {
		console.log('Captcha Question not found.')
		throw new Error('Captcha Question not found.')
	}
}

async function getCaptchaAnswer(question: string) {
	const openai = new OpenAIClient()
	const input = `Answer the question: ${question}. Provide only the year without any explanation or comments.`
	return await openai.response({ input })
}

async function hackRobotsLoginPage(answer: string) {
	try {
		const res = await axios.post(
			'https://xyz.ag3nts.org/',
			{
				username: 'tester',
				password: '574e112a',
				answer: answer
			},
			{
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded'
				}
			}
		)
		return res.data
	} catch (error) {
		console.error('Error hacking Robots Page:', error instanceof Error ? error.message : error)
		throw new Error('Error hacking Robots Page while posting the captcha answer')
	}
}
