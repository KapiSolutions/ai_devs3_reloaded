import express from 'express'
import cors from 'cors'
import s01Routes from './routes/s01.routes'

const app = express()

app.use(express.json())
app.use(cors())

app.use('/s01', s01Routes)

app.get('/', (_, res) => {
	res.send('AiDevs3 API is running')
})

export default app
