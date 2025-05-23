import { createWorker } from 'tesseract.js'

type Lang = 'eng' | 'pol'

export async function recognizeText(
	file: Buffer<ArrayBuffer> | string,
	lang: Lang = 'pol'
): Promise<string> {
	const worker = await createWorker(lang)

	const result = await worker.recognize(file)
	await worker.terminate()
	return result.data.text
}
