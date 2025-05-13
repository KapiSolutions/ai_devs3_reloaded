import app from './app'
import { PORT, validateEnvs } from './config/envs'

validateEnvs()

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`)
})
