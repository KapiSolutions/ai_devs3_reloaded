import { Request, Response } from 'express'
import getErrorMessage from '@lib/handleErrors'
import { OpenAIClient } from '@lib/openai'

const openai = OpenAIClient.getInstance()

/**
 * S04E04 — Apps and services
 */
export default async function playE04(req: Request, res: Response) {
	try {
		console.log(req.headers)
		const instruction = req.body.instruction
		if (!instruction) {
			return res.status(400).json({ status: '❌ Error', message: 'Instruction is required' })
		}
		console.log('instruction:', instruction)

		const description = await openai.response({ input: getPrompt(instruction), model: 'gpt-4o' })
		console.log('Description:', description)

		res.status(200).json({ description })
	} catch (error) {
		const errorMessage = getErrorMessage(error)
		console.error('Error handling S04E04:', errorMessage)

		return res.status(500).json({ status: '❌ Error', message: errorMessage })
	}
}

const table = `
<table>
        <tr>
            <td>start</td>
            <td>trawa</td>
            <td>Drzewo i dom</td>
            <td>Dom</td>
        </tr>
        <tr>
            <td>trawa</td>
            <td>Wiatrak</td>
            <td>trawa</td>
            <td>trawa</td>
        </tr>
        <tr>
            <td>trawa</td>
            <td>trawa</td>
            <td>góry</td>
            <td>Drzewa</td>
        </tr>
        <tr>
            <td>Góry</td>
            <td>Góry</td>
            <td>auto</td>
            <td>Jaskinia</td>
        </tr>
    </table>
`

const getPrompt = (instruction: string): string => `
Podaj co znajduje się w danej komórce tabeli na podstawie podanej instrukcji drogi. Tabela przedstawia mapę po której lata dron.

<rules>
1. Punkt startowy to komórka z napisem "start".
2. W każdej komórce znajduje się opis obiektu lub miejsca.
3. Przemieszczaj się zgodnie z instrukcją.
4. Dół mapy oznacza ostatni wiersz tabeli.
5. Podaj tylko nazwę obiektu lub miejsca, które znajduje się w komórce, do której dotarłeś. Nie podawaj dodatkowych informacji ani komentarzy.
6. tabela: 
${table}
</rules>  


<example>
1.	instruction: "poleciałem do końca w prawo, a nie, jednak jedno pole w prawo, a później na sam dół, co widzisz?"
	output: Góry
2.	instruction: "Lecimy kolego teraz na sam dół mapy, a później ile tylko możemy polecimy w prawo. Teraz mała korekta o jedno pole do góry. Co my tam mamy?"
	output: Drzewa
</example>

instruction: "${instruction}"
`
