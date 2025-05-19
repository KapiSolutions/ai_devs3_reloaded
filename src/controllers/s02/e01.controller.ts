import { Request, Response } from 'express'
import axios from 'axios'
import { OpenAIClient } from '@lib/openai'
import { AIDEVS_API_KEY, CENTRALA_URL } from 'src/config/envs'
import getErrorMessage from '@lib/handleErrors'
import { ReportData, ReportResponse } from 'src/config/types'
import fs from 'fs'
import Groq from 'groq-sdk'
import path from 'path'

const openai = OpenAIClient.getInstance()
const groq = new Groq()

export default async function playE01(_: Request, res: Response) {
	try {
		const recordsPaths = getRecordsPaths()
		const transcriptedRecords = await transciptAudioRecords(recordsPaths)
		console.log('Records Transcription:', transcriptedRecords)

		const address = await findInstituteAddress(transcriptedRecords)
		console.log('Institute address:', address)

		const reportResponse = await reportData(address)
		res.status(200).send(reportResponse)
	} catch (error) {
		const errorMessage = getErrorMessage(error)
		console.error('Error handling E05:', errorMessage)

		return res.status(500).json({ status: '❌ Error', message: errorMessage })
	}
}

function getRecordsPaths(): string[] {
	try {
		const projectRoot = process.cwd()
		const recordsPath = path.join(projectRoot, 'src', 'data', 's02e01', 'records')
		const recordPaths = fs.readdirSync(recordsPath).map((file) => `${recordsPath}/${file}`)

		if (recordPaths.length === 0)
			throw new Error(`No records found in the directory: ${recordsPath}`)
		return recordPaths
	} catch (error) {
		throw new Error(`Failed to get records paths: ${getErrorMessage(error)}`)
	}
}

async function transciptAudioRecords(recordsPaths: string[]): Promise<string> {
	try {
		console.log('recordsPaths:', recordsPaths)
		console.log('⏳ Transcribing audio records...')
		const transcriptedTexts = await Promise.all(
			recordsPaths.map(async (recordPath) => {
				const transcription = await groq.audio.transcriptions.create({
					file: fs.createReadStream(recordPath),
					model: 'whisper-large-v3-turbo'
				})
				return transcription.text
			})
		)
		return transcriptedTexts.join('\n\n')
	} catch (error) {
		throw new Error(`Failed to transcript audio records: ${getErrorMessage(error)}`)
	}
}

async function findInstituteAddress(text: string): Promise<string> {
	try {
		console.log('⏳ Finding institute address...')
		const prompt = getPrompt(text)
		return await openai.response({ input: prompt })
	} catch (error) {
		throw new Error(`Failed to find institute address: ${getErrorMessage(error)}`)
	}
}

async function reportData(data: string) {
	try {
		const reportPayload: ReportData<string> = {
			task: 'mp3',
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
	return `Search in the given text for institute where profesor Andrzej Maj works or worked and using your knowledge return the street address of this institute or department (without any additional information or comments). 

    <steps>
    - In the text Find the name of the institute or department where Andrzej Maj works or worked.
    - Based on your knowledge return the street address of this institute or department.
    - Return the street address in the format: "ul. <street name> <street number>".
    </steps>

    Text to search in: ${input}`
}

// Transcripted records:
// const tmp = `
// Gość miał ambicje, znałem go w sumie od dzieciństwa. W zasadzie to znałem, bo trochę nam się kontakt durwał, ale jak najbardziej, pracowaliśmy razem. On zawsze chciał pracować na jakiejś znanej uczelni. Po studiach, pamiętam, został na uczelni, robił doktorat z sieci neuronowych i uczenia maszynowego, potem przeniósł się na inną uczelnię i pracował chwilę w Warszawie, ale to był tylko epizod z tą Warszawą. On zawsze mówił, że zawsze musi pracować na jakiejś ważnej uczelni, bo w tym środowisku bufonów naukowych to się prestiż liczy. Mówił, królewska uczelnia, to jest to, co chce osiągnąć. Na tym mu zależało. Mówił, ja się tam dostanę, zobaczysz, no i będę tam wykładał. Z tego, co wiem, to osiągnął swój cel. No i brawa dla niego. Lubię ludzi, którzy jak się uprą, że coś zrobią, to po prostu to zrobią. Ale to nie było łatwe. Ale gościowi się udało i to wcale nie metodą po trupach do celu. Andrzej był okej. Szanował ludzi. Marzył o tej uczelni i z tego co wiem, to na niej wylądował. Nie miałem z nim już kontaktu, ale widziałem, że profil na LinkedIn zaktualizował. Nie powiedzieliście mi dlaczego szukacie, bo praca na uczelni to nie jest coś zabronionego, prawda? A z rzeczy ważnych to chciałbym wiedzieć dlaczego jestem tu, gdzie jestem i w sumie kiedy się skończy to przesłuchanie. Dostaję pytania chyba od dwóch godzin i w sumie powiedziałem już wszystko co wiem.

//  No pewnie. Obserwowałem jego dokonania i muszę przyznać, że zrobił na mnie wrażenie. Ja mam taką pamięć opartą na wrażeniach. I wrażenie mi pozostało po pierwszym spotkaniu. Nie wiem kiedy to było, ale on był taki... taki nietypowy. Później zresztą zastanawiałem się, jak to jest możliwe, że robi tak wiele rzeczy. Nieprzeciętny, ale swój. W końcu to Andrzej. Naukowiec. Później chyba zniknął z miejsc, gdzie go śledziłem Przy okazji jakiejś konferencji czy eventu Chyba widziałem go, ale nie udało mi się z nim porozmawiać Nie, nie mamy żadnego kontaktu Nie jest moim rodziną, więc dlaczego miałbym ukrywać? Ja go tylko obserwowałem Różnych ludzi się obserwuje To nie zbrodnia, prawda? Kiedy w końcu zostawicie mnie w spokoju?

//  Andrzejek Andrzejek Myślę, że osiągnął to co chciał Jagiełło byłby z niego bardzo dumny Chociaż nie, nie wiem Może coś mi się myli Jagiełło chyba nie był jego kolegą i raczej nie miał z tą uczelnią wiele wspólnego. To tylko nazwa. Taka nazwa. To był jakiś wielki gość. Bardziej co ją założył. Ale co to ma do rzeczy? Ale czy Andrzejek go znał? Chyba nie. Ale nie wiem. Bo Andrzejek raczej nie żył w XIV wieku. Kto go tam wie? Mógł odwiedzić XIV wiek. Ja bym odwiedził. Tego instytutu i tak wtedy nie było. To nowe coś. Ta ulica od matematyka, co wpada w komendanta, to chyba XX wiek. Ten czas mi się miesza. Wszystko jest takie nowe. To jest nowy, lepszy świat. Podoba ci się świat, w którym żyjesz. Andrzej zawsze był dziwny, kombinował coś i mówił, że podróże w czasie są możliwe. Razem pracowali nad tymi podr I to wszystko co teraz si dzieje i ten stan w którym jestem, to jest wina tych wszystkich podróży, tych tematów, tych rozmów. Ostatecznie nie wiem, czy Andrzejek miał rację i czy takie podróże są możliwe. Jeśli kiedykolwiek spotka cię takiego podróżnika, dajcie mi znać. Proszę, to by oznaczało, że jednak nie jestem szalony, ale jeśli taki ktoś wróci w czasie i pojawi się akurat dziś, to by znaczyło, że ludzie są zagrożeni. Jesteśmy zagrożeni. Andrzej jest zagrożony. Andrzej nie jest zagrożony. Andrzej jest, Andrzej jest zagrożony. Ale jeśli, ale jeśli ktoś wróci w czasie i pojawi się akurat dziś, to by, to by znaczyło, że ludzie są zagrożeni. Jesteśmy zagrożeni? Andrzej jest zagrożony? Andrzej nie, Andrzej nie jest zagrożony. To Andrzej jest zagrożeniem. To Andrzej jest zagrożeniem. Andrzej nie jest. Andrzej nie jest. Zagrożony. Andrzej jest zagrożeniem.

//  Ale wy tak na serio pytacie? Bo nie znać Andrzeja Maja w naszych kręgach to naprawdę byłoby dziwne. Tak, znam go. Podobnie jak pewnie kilka tysięcy innych uczonych go zna. Andrzej pracował z sieciami neuronowymi. To prawda. Był wykładowcą w Krakowie. To także prawda. Z tego co wiem, jeszcze przynajmniej pół roku temu tam pracował. Wydział czy tam Instytut Informatyki i Matematyki Komputerowej, czy jakoś tak. Nie pamiętam, jak się to dokładnie teraz nazywa, ale w każdym razie gość pracował z komputerami i sieciami neuronowymi. No chyba jesteście w stanie skojarzyć fakty, nie? Komputery, sieci neuronowe, to się łączy. Bezpośrednio z nim nie miałam kontaktu. Może raz na jakimś sympozjum naukowym pogratulowałam mu świetnego wykładu, ale to wszystko, co nas łączyło. Jeden uścisk dłoni, nigdy nie weszliśmy do wspólnego projektu, nigdy nie korespondowałam z nim. Tak naprawdę znam go jako celebrytę ze świata nauki, ale to wszystko, co mogę wam powiedzieć.

//  Może go znałam, a może nie. Kto wie? Zacznijmy od tego, że nie macie prawa mnie tutaj przetrzymywać. Absolutnie nic złego nie zrobiłam. Trzymacie mnie tutaj niezgodnie z prawem. Wiem, że teraz wszystko się zmienia na świecie i roboty dyktują jak ma być, ale o ile się nie mylę, dawne prawo nadal obowiązuje. Mamy tutaj jakąś konstytucję, prawda? Chcę rozmawiać z adwokatem. Maja znałam, to prawda. Było to kilka lat temu. Pracowaliśmy razem w Warszawie, ale na tym nasza znajomość się skończyła. Byliśmy w tej samej pracy. Czy to jest jakieś przestępstwo? To jest coś niedozwolonego w naszym kraju? Za to można wsadzać ludzi do więzienia? On wjechał z Warszawy, nie ma go tam. Z tego co wiem pojechał do Krakowa, wykładać tam chciał chyba coś z informatyki czy matematyki. Nie wiem jak to się skończyło. Może to były tylko plany?

//  – Andrzej Maj? No, coś kojarzę. Był taki gość i pamiętam, pracował u nas w biurze. Był project managerem. Chociaż, moment, może to jednak był Arkadiusz moi? Też na literę A. Mógłbym się pomylić. No jednak tak, Arkadiusz. Z Arkadiuszem współpracowałem w Wałbrzychu. Pamiętam, że był naprawdę wrednym facetem. Normalnie nie chciałbyś z takim pracować. Jak coś było do zrobienia, to albo stosował typową spychologię, albo zamiatał sprawę pod dywan. Nigdy człowieka nie docenił. Wszystkie zasługi brał na siebie. Był naprawdę beznadziejny. Arkadiusza pamiętam jak dziś, więc jeśli chcecie go aresztować, to jak najbardziej jestem za. Takich ludzi powinno się zamykać. nie mnie, bo ja jestem niewinny. Jak chcecie, to ja wam mogę adres nawet podać. Stefana Batorego, 68D. Tylko D, jak Danuta. Bo pod B mieszka jego ciocia, a ona była fajna. Jak będziecie Arkadiusza aresztować, to proszę powiedzcie mu z pozdrowieniami od Adama. On będzie wiedział, o kogo chodzi.
// `
