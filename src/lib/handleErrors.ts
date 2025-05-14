import axios from 'axios'

export default function getErrorMessage(error: unknown): string {
	if (axios.isAxiosError(error)) {
		console.group('❌ 🌐 Axios Request Error')
		console.log('Request URL:', error.config?.url || 'N/A')
		console.log('Response Data:', error.response?.data || 'N/A')
		console.log('Message:', error.message)
		console.log('Status:', error.response?.status || 'N/A')
		console.groupEnd()
		return `API Error (${error.response?.status || 'unknown'}): ${
			error.response?.data?.message || error.message
		}`
	}

	if (error instanceof Error) {
		return error.message
	}

	return String(error)
}
