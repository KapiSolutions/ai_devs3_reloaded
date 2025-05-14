import { Request, Response } from 'express'
import axios from 'axios'
import { OpenAIClient } from '@lib/openai'
import { AIDEVS_API_KEY, CENTRALA_URL } from 'src/config/envs'
import getErrorMessage from '@lib/handleErrors'
import { ReportData, ReportResponse } from 'src/config/types'

interface TestItem {
	question: string
	answer: number
	test?: {
		q: string
		a: string
	}
}
interface CalibrationData {
	apikey: string
	description: string
	copyright: string
	'test-data': TestItem[]
}

export default async function playE03(_: Request, res: Response) {
	try {
		const calibrationData = await getCalibrationData()
		const validatedData = await validateData(calibrationData)
		const reportResponse = await reportData(validatedData)

		console.log(reportResponse)
		res.status(200).send(reportResponse)
	} catch (error) {
		const errorMessage = getErrorMessage(error)
		console.error('Error handling E03:', errorMessage)

		return res.status(500).json({
			message: '❌ Error handling E03',
			error: errorMessage
		})
	}
}

async function getCalibrationData(): Promise<CalibrationData> {
	try {
		const dataUrl = `${CENTRALA_URL}/data/${AIDEVS_API_KEY}/json.txt`
		const response = await axios.get<CalibrationData>(dataUrl)

		const calibrationData = response.data
		calibrationData.apikey = AIDEVS_API_KEY
		return calibrationData
	} catch (error) {
		throw new Error(`Failed to fetch calibration data: ${getErrorMessage(error)}`)
	}
}

async function validateData(calibrationData: CalibrationData) {
	const testData = calibrationData['test-data']
	try {
		await Promise.all(
			testData.map(async (item) => {
				const additionResult = getAdditionResult(item.question)
				if (item.answer !== additionResult) {
					console.log(
						`⚠️  Question: ${item.question}, Answer: ${item.answer}, Should be: ${additionResult}. Correcting answer.`
					)
					item.answer = additionResult
				}
				if (item.test) {
					console.log(`🧠  Detected question: ${item.test.q} Finding answer..`)
					const openai = new OpenAIClient()
					const prompt = getPrompt(item.test.q)
					const answer = await openai.response({ input: prompt })
					console.log(`🤖 ${item.test.q} Answer: ${answer}`)
					item.test.a = answer
				}
				return item
			})
		)
		return {
			...calibrationData,
			'test-data': testData
		}
	} catch (error) {
		throw new Error(`Failed to validate data: ${getErrorMessage(error)}`)
	}
}

async function reportData(validatedData: CalibrationData) {
	try {
		const reportPayload: ReportData<CalibrationData> = {
			task: 'JSON',
			apikey: AIDEVS_API_KEY,
			answer: validatedData
		}
		const reportUrl = `${CENTRALA_URL}/report`
		const response = await axios.post<ReportResponse>(reportUrl, reportPayload)
		return response.data
	} catch (error) {
		throw new Error(`Failed to report calibration data: ${getErrorMessage(error)}`)
	}
}

function getAdditionResult(input: string): number {
	const [a, b] = input.split('+').map((num) => parseInt(num.trim(), 10))
	return a + b
}

function getPrompt(question: string): string {
	return `Answer the given question without any additional information or comments, provide only the correct answer as word or number.
    Question: ${question}`
}
