import { Request, Response } from 'express'
import axios from 'axios'
import { OpenAIClient } from '@lib/openai'
import { AIDEVS_API_KEY, CENTRALA_URL } from 'src/config/envs'
import getErrorMessage from '@lib/handleErrors'
import { ReportData, ReportResponse } from 'src/config/types'

export default async function playE05(_: Request, res: Response) {
	try {
		const agentsData = await getAgentsData()
		console.log('🙎 Agents data:', agentsData)
		const censoredData = await censorData(agentsData)
		console.log('🥷  Censored data:', censoredData)
		const reportResponse = await reportData(censoredData)

		res.status(200).send(reportResponse)
	} catch (error) {
		const errorMessage = getErrorMessage(error)
		console.error('Error handling E05:', errorMessage)

		return res.status(500).json({ status: '❌ Error', message: errorMessage })
	}
}

async function getAgentsData(): Promise<string> {
	try {
		const dataUrl = `${CENTRALA_URL}/data/${AIDEVS_API_KEY}/cenzura.txt`
		const response = await axios.get(dataUrl)

		return response.data
	} catch (error) {
		throw new Error(`Failed to fetch agents data: ${getErrorMessage(error)}`)
	}
}

async function censorData(agentsData: string): Promise<string> {
	try {
		const openai = new OpenAIClient()
		const prompt = getPrompt(agentsData)
		return await openai.response({ input: prompt })
	} catch (error) {
		throw new Error(`Failed to censor data: ${getErrorMessage(error)}`)
	}
}

async function reportData(censoredData: string) {
	try {
		const reportPayload: ReportData<string> = {
			task: 'CENZURA',
			apikey: AIDEVS_API_KEY,
			answer: censoredData
		}
		const reportUrl = `${CENTRALA_URL}/report`
		const response = await axios.post<ReportResponse>(reportUrl, reportPayload)
		return response.data
	} catch (error) {
		throw new Error(`Failed to report data: ${getErrorMessage(error)}`)
	}
}

function getPrompt(input: string): string {
	return `Censore the given text and return it without any additional information or comments. 
	Informations to censore are related to:
	- name
	- last name
	- address including street, number of street, city, country
	- age

	<rules>
	1. Replace all the sensitive information with "CENZURA" and return the censored text.
	2. Do not use doubled words "CENZURA CENZURA" in the output text: 
		- Name and last name should be replaced with "CENZURA" only once.
		- Street name and number should be replaced with "CENZURA" only once.
	</rules>

	Example:
	- input : "Osoba Krzysztof Kwiatkowski. Mieszka w Szczecinie przy ul. Różanej 12. Ma 31 lat."
	- output: "Osoba CENZURA. Mieszka w CENZURA przy ul. CENZURA. Ma CENZURA lat."

    Text to censor: ${input}`
}
