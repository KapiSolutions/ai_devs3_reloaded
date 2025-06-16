import { AIDEVS_API_KEY, CENTRALA_URL } from 'src/config/envs'
import { ReportData, ReportResponse } from 'src/config/types'
import getErrorMessage from './handleErrors'
import axios from 'axios'

export async function reportData(task: string, answer: string) {
	try {
		const reportPayload: ReportData<string> = {
			task,
			answer,
			apikey: AIDEVS_API_KEY
		}
		const reportUrl = `${CENTRALA_URL}/report`
		const response = await axios.post<ReportResponse>(reportUrl, reportPayload)
		return response.data
	} catch (error) {
		throw new Error(`Failed to report data: ${getErrorMessage(error)}`)
	}
}

export async function queryAiDevsDB({
	task = 'database',
	query
}: {
	task?: string
	query: string
}) {
	try {
		const queryUrl = `${CENTRALA_URL}/apidb`
		const payload = {
			task,
			query,
			apikey: AIDEVS_API_KEY
		}
		const response = await axios.post<{ reply: unknown; error: string }>(queryUrl, payload)

		if (response.data.error !== 'OK') throw new Error(response.data.error)

		return response.data.reply
	} catch (error) {
		throw new Error(`Failed to query database: ${getErrorMessage(error)}`)
	}
}
