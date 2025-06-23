import { Router } from 'express'
import playE04 from 'src/controllers/s04/e04.controller'

const router = Router()

router.post('/e04', playE04)

export default router
