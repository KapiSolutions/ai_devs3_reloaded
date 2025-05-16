import express, { Request, Response } from 'express'
import cors from 'cors'
import s01Routes from './routes/s01.routes'
import helmet from 'helmet'
import { corsOptions, rateLimiter } from './config/server.config'

const app = express()

app.use(helmet())
app.use(cors(corsOptions))
app.use(express.json())
app.use('/api', rateLimiter)

// App routes
app.use('/api/s01', s01Routes)

// Root route
app.get('/', (_, res: Response) => {
	res.send('AiDevs3 API is running')
})

// Handle 404 - Route not found
app.use('*', (req: Request, res: Response) => {
	res.status(404).json({
		status: '❌ Error',
		message: `Can't find ${req.originalUrl} on this server!`
	})
})
export default app
