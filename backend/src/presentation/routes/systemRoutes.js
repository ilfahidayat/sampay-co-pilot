import { Router } from 'express'
import { 
  getHealth, 
  getMqttStatus, 
  getSystemConfig, 
  updateAiConfig, 
  updateMqttConfig,
  resetDatabase
} from '../controllers/systemController.js'

const router = Router()

router.get('/health', getHealth)
router.get('/mqtt-status', getMqttStatus)
router.get('/config', getSystemConfig)
router.post('/config/ai', updateAiConfig)
router.put('/config/ai', updateAiConfig)
router.post('/config/mqtt', updateMqttConfig)
router.put('/config/mqtt', updateMqttConfig)
router.post('/reset-db', resetDatabase)

export default router

