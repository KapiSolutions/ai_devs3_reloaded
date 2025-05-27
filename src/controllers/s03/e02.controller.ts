import { Request, Response } from 'express'
import axios from 'axios'
import { AIDEVS_API_KEY, CENTRALA_URL } from 'src/config/envs'
import getErrorMessage from '@lib/handleErrors'
import { ReportData, ReportResponse } from 'src/config/types'
import { VectorService } from '@lib/VectorService'
import fs from 'fs'
import path from 'path'

const collection = 'reports'
const vector = new VectorService()

/**
 * S03E02 — Semantic search
 */
export default async function playE02(_: Request, res: Response) {
	try {
		const reports = await readTxtFiles()
		console.log('Reports:', reports.length)
		await initReportsVectorCollection(reports)
		const answer = await getAnswerFromVectorCollection()
		const date = getDateOfReport(answer)
		console.log('Date of report:', date)

		const reportResponse = await reportData(date)
		res.status(200).send(reportResponse)
	} catch (error) {
		const errorMessage = getErrorMessage(error)
		console.error('Error handling S03E02:', errorMessage)

		return res.status(500).json({ status: '❌ Error', message: errorMessage })
	}
}

async function readTxtFiles(): Promise<string[]> {
	const dir = path.resolve('src/data/industry_files/do-not-share/')
	try {
		const files = await fs.promises.readdir(dir)
		const txtFiles = files.filter((file) => file.endsWith('.txt'))
		if (txtFiles.length === 0) {
			throw new Error(`No .txt files found in directory: ${dir}`)
		}
		const fileContents = await Promise.all(
			txtFiles.map(async (file) => {
				const fileName = path.parse(file).name.replace(/_/g, '-')
				const text = await fs.promises.readFile(path.join(dir, file), 'utf-8')
				return `Data raportu: ${fileName}\n Treść raportu:\n${text}`
			})
		)
		return fileContents
	} catch (error) {
		console.error('Failed to read .txt files:', error)
		throw new Error(`Failed to read .txt files: ${getErrorMessage(error)}`)
	}
}

async function initReportsVectorCollection(reports: string[]) {
	const points = reports.map((report) => ({ text: report }))
	try {
		await vector.initializeCollectionWithData(collection, points)
	} catch (error) {
		throw new Error(`Failed to init Reports collection: ${getErrorMessage(error)}`)
	}
}

async function getAnswerFromVectorCollection() {
	const query = 'W raporcie, z którego dnia znajduje się wzmianka o kradzieży prototypu broni?'
	console.log(`Querying vector collection with: "${query}"`)
	try {
		const answers = await vector.performSearch(collection, query)
		if (answers.length === 0) {
			throw new Error('No answers found in the vector collection')
		}
		const answerText = answers[0].payload?.text as string
		if (!answerText) {
			throw new Error('No text found in the answer payload')
		}
		return answerText
	} catch (error) {
		throw new Error(`Failed to get answer from vector collection: ${getErrorMessage(error)}`)
	}
}

function getDateOfReport(text: string) {
	const match = text.match(/\d{4}-\d{2}-\d{2}/)

	if (match) return match[0]
	throw new Error('No date found in the report')
}

async function reportData(answer: string) {
	try {
		const reportPayload: ReportData<string> = {
			task: 'wektory',
			apikey: AIDEVS_API_KEY,
			answer: answer
		}
		const reportUrl = `${CENTRALA_URL}/report`
		const response = await axios.post<ReportResponse>(reportUrl, reportPayload)
		return response.data
	} catch (error) {
		throw new Error(`Failed to report data: ${getErrorMessage(error)}`)
	}
}
