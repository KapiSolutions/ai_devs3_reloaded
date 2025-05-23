import { Router } from 'express'
import playE01 from '../controllers/s02/e01.controller'
import playE03 from 'src/controllers/s02/e03.controller'
import playE04 from 'src/controllers/s02/e04.controller'

const router = Router()

router.get('/e01', playE01)
router.get('/e03', playE03)
router.get('/e04', playE04)
export default router
