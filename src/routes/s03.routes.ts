import { Router } from 'express'
import playE02 from 'src/controllers/s03/e02.controller'

const router = Router()

router.get('/e02', playE02)
export default router
