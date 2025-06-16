import { Router } from 'express'
import playE02 from 'src/controllers/s03/e02.controller'
import playE05 from 'src/controllers/s03/e05.controller'

const router = Router()

router.get('/e02', playE02)
router.get('/e05', playE05)

export default router
