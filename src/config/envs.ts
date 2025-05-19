export const PORT = process.env.PORT || 3000
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
export const AIDEVS_API_KEY = process.env.AIDEVS_API_KEY || ''
export const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
export const ROBOTS_PORTAL_URL = process.env.ROBOTS_PORTAL_URL || ''
export const CENTRALA_URL = process.env.CENTRALA_URL || ''
export const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || ''

const requiredEnvVars = [
	'OPENAI_API_KEY',
	'AIDEVS_API_KEY',
	'GROQ_API_KEY',
	'ROBOTS_PORTAL_URL',
	'CENTRALA_URL'
]

export function validateEnvs() {
	const missingVars = requiredEnvVars.filter((varName) => !process.env[varName])

	if (missingVars.length > 0) {
		const missingVarsStr = missingVars.join(', ')
		console.error(`🚫 Missing required environment variables:\n   ${missingVarsStr}`)
		process.exit(1)
	}
}
