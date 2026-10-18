import { Router } from 'express'
import {
  getExecutions,
  dispatchCommand,
  approveAllExecutions,
  approveExecution,
  rejectExecution,
  adjustExecution,
  runExecutionNow,
  synthesizePondExecutions,
  createManualExecution
} from '../controllers/executionController.js'

import { resetDatabase } from '../controllers/systemController.js'

const router = Router()

// Reset all executions to initial clean seed state
router.post('/reset', resetDatabase)

// Pond-level routes
router.get('/:pondId', getExecutions)
router.post('/:pondId', dispatchCommand)
router.post('/:pondId/tasks', createManualExecution)
router.post('/:pondId/manual', createManualExecution)
router.post('/:pondId/approve-all', approveAllExecutions)
router.post('/:pondId/synthesize', synthesizePondExecutions)

// Item-level routes
router.post('/item/:id/approve', approveExecution)
router.post('/item/:id/reject', rejectExecution)
router.put('/item/:id', adjustExecution)
router.post('/item/:id/run-now', runExecutionNow)

export default router
