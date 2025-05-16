import OpenAI from 'openai'

type OpenAIModels = 'gpt-4o-mini' | 'gpt-4o' | 'gpt-3.5-turbo'

interface ResponseOptions {
	input: string | OpenAI.Responses.ResponseInput
	model?: OpenAIModels
}

export class OpenAIClient {
	private static instance: OpenAIClient | null = null
	private client: OpenAI

	private constructor() {
		this.client = new OpenAI()
	}

	/**
	 * Get the singleton instance of OpenAIClient
	 */
	public static getInstance(): OpenAIClient {
		if (!OpenAIClient.instance) {
			OpenAIClient.instance = new OpenAIClient()
		}
		return OpenAIClient.instance
	}

	/**
	 * Send a request to OpenAI and get a response using `response.create`
	 */
	async response({ input, model = 'gpt-4o-mini' }: ResponseOptions) {
		const response = await this.client.responses.create({ model, input })
		return response.output_text.trim()
	}
}
