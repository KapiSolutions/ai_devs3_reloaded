export const PORT = process.env.PORT || 3000
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export function validateEnvs() {
	if (!OPENAI_API_KEY) {
		console.error('\n🚫 [Startup Error] Missing environment variable: OPENAI_API_KEY\n')
		process.exit(1)
	}
}
