import { Router } from 'express'
import playE01 from '../controllers/s01/e01.controller'
import playE02 from '../controllers/s01/e02.controller'
import playE03 from '../controllers/s01/e03.controller'
import playE05 from '../controllers/s01/e05.controller'

const router = Router()

router.get('/e01', playE01)
router.get('/e02', playE02)
router.get('/e03', playE03)
router.get('/e05', playE05)

export default router
