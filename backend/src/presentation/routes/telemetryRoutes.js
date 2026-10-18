import { Router } from 'express'
import { getLatestTelemetry, getTelemetryHistory, postManualTelemetry } from '../controllers/telemetryController.js'

const router = Router()

router.get('/:pondId/latest', getLatestTelemetry)
router.get('/:pondId/history', getTelemetryHistory)
router.post('/:pondId', postManualTelemetry)

export default router
