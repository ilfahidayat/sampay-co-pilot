import { Router } from 'express'
import { getPonds, getPondById, updatePond, getFarmSummary } from '../controllers/pondController.js'
import { getLatestTelemetry, getTelemetryHistory, postManualTelemetry } from '../controllers/telemetryController.js'
import { getExecutions, dispatchCommand } from '../controllers/executionController.js'
import { getLatestRecommendation, getLatestAnalysis, getAnalysisHistory } from '../controllers/aiController.js'
import { getPondMortality, recordMortality, getAllMortality } from '../controllers/mortalityController.js'

const router = Router()

// Ponds CRUD & Info
router.get('/farm/summary', getFarmSummary)
router.get('/mortality/all', getAllMortality)
router.get('/', getPonds)
router.get('/:id', getPondById)
router.put('/:id', updatePond)

// Nested Telemetry Routes for Pond
router.get('/:pondId/telemetry/latest', getLatestTelemetry)
router.get('/:pondId/telemetry/history', getTelemetryHistory)
router.post('/:pondId/telemetry', postManualTelemetry)

// Nested Execution & Actuator Routes for Pond
router.get('/:pondId/executions', getExecutions)
router.post('/:pondId/executions', dispatchCommand)

// Nested Mortality Routes for Pond (Pencatatan Kematian Ikan)
router.get('/:pondId/mortality', getPondMortality)
router.post('/:pondId/mortality', recordMortality)

// Nested AI Recommendation & Analyses Route for Pond
router.get('/:pondId/recommendations', getLatestRecommendation)
router.get('/:pondId/ai/latest', getLatestAnalysis)
router.get('/:pondId/ai/history', getAnalysisHistory)

export default router
