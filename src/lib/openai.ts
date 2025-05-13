import OpenAI from 'openai'

type OpenAIModels = 'gpt-4o-mini' | 'gpt-4o' | 'gpt-3.5-turbo'

interface ResponseOptions {
	input: string | OpenAI.Responses.ResponseInput
	model?: OpenAIModels
}

export class OpenAIClient {
	private client = new OpenAI()

	async response({ input, model = 'gpt-4o-mini' }: ResponseOptions) {
		const response = await this.client.responses.create({ model, input })
		return response.output_text.trim()
	}
}
