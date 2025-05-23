import OpenAI from 'openai'
import { ImageGenerateParams } from 'openai/resources/images'

type OpenAIModels = 'gpt-4o-mini' | 'gpt-4o' | 'gpt-3.5-turbo'

interface ResponseOptions {
	input: string | OpenAI.Responses.ResponseInput
	model?: OpenAIModels
}
interface GenerateImageOptions {
	prompt: string
	model?: OpenAI.Images.ImageModel
	n?: number
	size?: ImageGenerateParams['size']
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

	/**
	 * Generate an image using OpenAI's image generation API
	 * @param prompt The text prompt to generate the image from
	 * @param model The model to use for image generation (default: 'dall-e-3')
	 * @param n The number of images to generate (default: 1)
	 * @param size The size of the generated images (default: '1024x1024')
	 * @returns An array of URLs of the generated images
	 */
	async generateImage({
		prompt,
		model = 'dall-e-3',
		n = 1,
		size = '1024x1024'
	}: GenerateImageOptions) {
		const response = await this.client.images.generate({ model, prompt, n, size })
		const images = response.data
		if (!images || !images.length) {
			throw new Error('No images generated')
		}
		return images
	}
}
