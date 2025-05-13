import { Router } from 'express'
import playE01 from '../controllers/s01/e01.controller'

const router = Router()

router.get('/e01', playE01)

export default router
