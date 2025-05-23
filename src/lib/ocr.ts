import { createWorker } from 'tesseract.js'
import getErrorMessage from './handleErrors'

type Lang = 'eng' | 'pol'

export async function recognizeText(
	file: Buffer<ArrayBuffer> | string,
	lang: Lang = 'pol'
): Promise<string> {
	const worker = await createWorker(lang)
	try {
		const result = await worker.recognize(file)
		await worker.terminate()
		return result.data.text
	} catch (error) {
		console.error('OCR text recognition failed:', error)
		await worker?.terminate().catch(() => {})
		throw new Error(`Failed to extract text: ${getErrorMessage(error)}}`)
	}
}
