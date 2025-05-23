import { Request, Response } from 'express'
import axios from 'axios'
import { OpenAIClient } from '@lib/openai'
import { AIDEVS_API_KEY, CENTRALA_URL } from 'src/config/envs'
import getErrorMessage from '@lib/handleErrors'
import { ReportData, ReportResponse } from 'src/config/types'
import fs from 'fs'
import Groq from 'groq-sdk'
import path from 'path'
import { recognizeText } from '@lib/ocr'

const openai = OpenAIClient.getInstance()
const groq = new Groq()

enum FileExt {
	MP3 = '.mp3',
	TXT = '.txt',
	PNG = '.png'
}
interface FileWithContent {
	fileName: string
	content: string
}
interface CategorizedData {
	people: string[]
	hardware: string[]
}

/**
 * S02E04 - Multiple Formats Combined
 */
export default async function playE04(_: Request, res: Response) {
	try {
		const filePaths = await getProperFiles()
		const filesWithContext = await getFilesContext(filePaths)
		console.log('Files with context:', filesWithContext)

		const categorizedData = await categorizeAndSortData(filesWithContext)
		console.log('Categorized data:', categorizedData)

		const reportResponse = await reportData(categorizedData)
		res.status(200).send(reportResponse)
	} catch (error) {
		const errorMessage = getErrorMessage(error)
		console.error('Error handling S02E04:', errorMessage)

		return res.status(500).json({ status: '❌ Error', message: errorMessage })
	}
}

async function getProperFiles() {
	const dir = path.resolve('src/data/industry_files/')
	try {
		const allFiles = await fs.promises.readdir(dir)
		if (!allFiles.length) throw new Error(`No files found at ${dir}`)

		const files = allFiles.filter((file) => {
			const ext = path.extname(file)
			return Object.values(FileExt).includes(ext as FileExt)
		})

		if (!files.length)
			throw new Error(
				`No valid files found at ${dir} . Only .mp3, .txt and .png files are accepted`
			)
		return files.map((file) => path.join(dir, file))
	} catch (error) {
		throw new Error(`Failed to find industry files: ${getErrorMessage(error)}`)
	}
}
async function getFilesContext(filePaths: string[]): Promise<FileWithContent[]> {
	try {
		return await Promise.all(
			filePaths.map(async (filePath) => {
				const buffer = await fs.promises.readFile(filePath)
				const fileName = path.basename(filePath)
				const ext = path.extname(filePath)

				switch (ext) {
					case FileExt.TXT:
						return { fileName, content: buffer.toString() }

					case FileExt.MP3: {
						const file = new File([buffer], fileName, { type: 'audio/mpeg' })
						const content = await transcriptAudio(file)
						return { fileName, content }
					}

					case FileExt.PNG: {
						const content = (await recognizeText(buffer, 'pol')).replace(/\n/g, ' ')
						return { fileName, content }
					}

					default:
						throw new Error(`Unsupported file type: ${ext}`)
				}
			})
		)
	} catch (error) {
		throw new Error(`Failed to get files context: ${getErrorMessage(error)}`)
	}
}

async function transcriptAudio(file: File): Promise<string> {
	try {
		console.log(`🎙️ Transcripting audio...`)

		const transcription = await groq.audio.transcriptions.create({
			file,
			model: 'whisper-large-v3-turbo'
		})
		return transcription.text
	} catch (error) {
		throw new Error(`Failed to transcript audio record: ${getErrorMessage(error)}`)
	}
}

async function categorizeAndSortData(data: FileWithContent[]): Promise<CategorizedData> {
	try {
		console.log('⏳ Categorizing and sorting data...')
		const prompt = getPrompt(JSON.stringify(data))
		const text = await openai.response({ input: prompt })
		try {
			const parsed = JSON.parse(text)
			// Validate structure
			if (
				!parsed.people ||
				!Array.isArray(parsed.people) ||
				!parsed.hardware ||
				!Array.isArray(parsed.hardware)
			) {
				throw new Error('Invalid response structure from AI')
			}
			return parsed
		} catch (parseError) {
			throw new Error(`Failed to parse AI response: ${getErrorMessage(parseError)}`)
		}
	} catch (error) {
		throw new Error(`Failed to categorize and sort: ${getErrorMessage(error)}`)
	}
}

async function reportData(data: CategorizedData) {
	try {
		const reportPayload: ReportData<CategorizedData> = {
			task: 'kategorie',
			apikey: AIDEVS_API_KEY,
			answer: data
		}
		const reportUrl = `${CENTRALA_URL}/report`
		const response = await axios.post<ReportResponse>(reportUrl, reportPayload)
		return response.data
	} catch (error) {
		throw new Error(`Failed to report data: ${getErrorMessage(error)}`)
	}
}

function getPrompt(input: string): string {
	return `Return json with the following structure:
	
	{
        "people": ["fileName", ...],
        "hardware": ["filename", ...],
    }
	
	To create this json, analyze the InputJson and find all records including information about captured people or traces of their presence 
    
	<rules>
    - In the key "people" include fileNames of all records with information about people or traces of their presence.
	- In the key "hardware" include fileNames of all records with hardware issues like faults or repairs, omit software info.
	- If a record does not fit into any of the above categories, skip it.
	- Sort the fileNames in ascending order
	- Return the json without any additional text, annotations or explanations.
	- Do not use any special sympols or quotes in the response, just plain json.
    </rules>

    InputJson: ${input}`
}

// Trancripted data
// const tmp: FileWithContent[] = [
// 	{
// 		fileName: '2024-11-12_report-13.png',
// 		content:
// 			'REPAIR NOTE FROM: Repair debarhwent Godzina 08:15. Rozpoczęto naprawę anteny nadawczej w sektorze komunikacyjnym. Uszkodzenie powstało wskutek długotrwałej ekspozycji na warunki atmosferyczne, co osłabiło sygnał przesyłowy. Wymieniono główny element przekaźnika oraz dokręcono panel stabilizacyjny. Test przesyłu sygnału zakończony pozytywnie. Antena działa zgodnie ze specyfikacją.  APPROVED BY Josebh N. '
// 	},
// 	{
// 		fileName: '2024-11-12_report-12-sektor_A1.mp3',
// 		content:
// 			' Boss, as directed, we searched the tenements in the nearby town for rebels. We were unable to find anyone. It appears that the town has been abandoned for a long time. We have already drawn up plans to search more towns in the coming days.'
// 	},
// 	{
// 		fileName: '2024-11-12_report-15.png',
// 		content:
// 			'REPAIR NOTE FROM: Repair debarhwent Godzina II:50. W czujniku ruchu wykryto usterkę spowodowaną zwarciem kabli. Przyczyną była mała mysz, która dostała się między przewody, powodując chwilowe przerwy w działaniu sensorów. Odłączono zasilanie, usunięto ciało obce i zabezpieczono osłony kabli przed dalszymi uszkodzeniami. Czujnik ponownie skalibrowany i sprawdzony pod kątem poprawności działania. APPROVED BY Josebh N. '
// 	},
// 	{
// 		fileName: '2024-11-12_report-14.png',
// 		content:
// 			'REPAIR NOTE FROM: Repair debarhwent Godzina I5:45. Zakończono aktualizację systemu komunikacji jednostek mobilnych. Dodano możliwość dynamicznego przydzielania kanałów w zależności od obciążenia oraz zaimplementowano protokół szyfrowania QII dla bezpieczniejszej wymiany danych. Test komunikacji między jednostkami wykazał pełną kompatybilność z nowym systemem. Monitorowanie aktywne w trybie bieżącym.  APPROVED BY Josebh N. '
// 	},
// 	{
// 		fileName: '2024-11-12_report-16.png',
// 		content:
// 			'REPAIR NOTE FROM: Repair debarhwent Godzina 1I3:30. Przeprowadzono aktualizację modułu AI analizującego wzorce ruchu. Wprowadzono dodatkowe algorytmy umożliwiające szybsze przetwarzanie i bardziej precyzyjną analizę zachowań niepożądanych. Aktualizacja zakończona sukcesem, wydajność systemu wzrosła o I8%, co potwierdzają pierwsze testy operacyjne. Algorytmy działają w pełnym zakresie  APPROVED BY Josebh N. '
// 	},
// 	{
// 		fileName: '2024-11-12_report-17.png',
// 		content:
// 			'REPAIR NOTE FROM: Repair debarhwent Godzina 09:20. Przeprowadzono procedurę wymiany przestarzałych ogniw w jednostkach mobilnych. Dotychczasowe ogniwa wykazywały obniżoną wydajność, wpływającą na zdolność operacyjną jednostek w dłuższych trasach patrolowych. Nowe ogniwa zostały zainstalowane zgodnie z wytycznymi technicznymi, a czas pracy jednostek uległ zwiększeniu o I5%. Monitorowanie w toku. APPROVED BY Josebh N. '
// 	},
// 	{
// 		fileName: '2024-11-12_report-11-sektor-C2.mp3',
// 		content:
// 			" I know I shouldn't be calling about this, but the mood in our brigade is deteriorating. I think it's down to our running out of pineapple pizza. Robots can survive for months without it, but we humans unfortunately cannot. On behalf of the whole team, I would like to request a pizza delivery. We've heard that there is a delivery man in the area named Matthew, who can not only deliver such a pizza to us, but also bake it. Perhaps it would be worth recruiting him to our team?"
// 	},
// 	{
// 		fileName: '2024-11-12_report-05-sektor_C1.txt',
// 		content:
// 			'Godzina 04:02. Bez wykrycia aktywności organicznej lub technologicznej. Sensor dźwiękowy i detektory ruchu w pełnej gotowości. Bez niepokojących sygnałów w trakcie patrolu. Kontynuuję monitorowanie.'
// 	},
// 	{
// 		fileName: '2024-11-12_report-03-sektor_A3.txt',
// 		content:
// 			'Godzina 01:30. Przebieg patroli nocnych na poziomie ściśle monitorowanym. Czujniki pozostają aktywne, a wytyczne dotyczące wykrywania życia organicznego – bez rezultatów. Stan patrolu bez zakłóceń.'
// 	},
// 	{
// 		fileName: '2024-11-12_report-06-sektor_C2.txt',
// 		content:
// 			'Godzina 22:50. Sektor północno-zachodni spokojny, stan obszaru stabilny. Skanery temperatury i ruchu wskazują brak wykrycia. Jednostka w pełni operacyjna, powracam do dalszego patrolu.'
// 	},
// 	{
// 		fileName: '2024-11-12_report-00-sektor_C4.txt',
// 		content:
// 			'Godzina 22:43. Wykryto jednostkę organiczną w pobliżu północnego skrzydła fabryki. Osobnik przedstawił się jako Aleksander Ragowski. Przeprowadzono skan biometryczny, zgodność z bazą danych potwierdzona. Jednostka przekazana do działu kontroli. Patrol kontynuowany.'
// 	},
// 	{
// 		fileName: '2024-11-12_report-04-sektor_B2.txt',
// 		content:
// 			'Godzina 23:45. Patroluje zachodnią część terenu; brak anomalii ani odchyleń od normy. Sektor bezpieczny, wszystkie kanały komunikacyjne czyste. Przechodzę do następnego punktu.'
// 	},
// 	{
// 		fileName: '2024-11-12_report-01-sektor_A1.txt',
// 		content:
// 			'Godzina 03:26. Wstępny alarm wykrycia – ruch organiczny. Analiza wizualna i sensoryczna wykazała obecność lokalnej zwierzyny leśnej. Fałszywy alarm. Obszar bezpieczny, wracam na trasę patrolu. Spokój przywrócony.'
// 	},
// 	{
// 		fileName: '2024-11-12_report-10-sektor-C1.mp3',
// 		content:
// 			" Boss, we found one guy hanging around the gate. He was tinkering with something on the alarm equipment. He wouldn't say what he was doing here or who he was. He was arrested. After this incident, the squad went back to patrolling the area."
// 	},
// 	{
// 		fileName: '2024-11-12_report-02-sektor_A3.txt',
// 		content:
// 			'Godzina 02:15. Obszar patrolu nocnego cichy, bez wykrycia aktywności organicznej ani mechanicznej. Prowadzony monitoring peryferii obiektu. Kontynuacja zadań.'
// 	},
// 	{
// 		fileName: '2024-11-12_report-07-sektor_C4.txt',
// 		content:
// 			'Godzina 00:11. Czujniki dźwięku wykryły ultradźwiękowy sygnał, pochodzenie: nadajnik ukryty w zielonych krzakach, nieopodal lasu. Przeprowadzono analizę obiektu. Analiza odcisków palców wskazuje osobę o imieniu Barbara Zawadzka, skorelowano z bazą urodzeń. Nadajnik przekazany do działu śledczego. Obszar zabezpieczony, patrol zakończony bez dalszych incydentów.\n'
// 	},
// 	{
// 		fileName: '2024-11-12_report-08-sektor_A1.txt',
// 		content:
// 			'Godzina 01:00. Monitoring obszaru patrolowego: całkowity brak ruchu. Względna cisza, czujniki nie wykazały aktywności. Kontynuuję obserwację terenu według wyznaczonych wytycznych.'
// 	},
// 	{
// 		fileName: '2024-11-12_report-09-sektor_C2.txt',
// 		content:
// 			'Godzina 03:45. Patrol na peryferiach zachodnich zakończony. Czujniki nie wykazały żadnych niepokojących sygnałów. Obszar bez anomalii, kończę bieżący cykl i przechodzę do kolejnego sektora.'
// 	}
// ]
