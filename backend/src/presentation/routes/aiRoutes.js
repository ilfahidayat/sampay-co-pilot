import { Router } from 'express'
import {
  getLatestRecommendation,
  getLatestAnalysis,
  getAnalysisHistory,
  authorizeRecommendation,
  triggerMorningBriefing,
  copilotChat,
  getCopilotChatHistory,
  clearCopilotChatHistory
} from '../controllers/aiController.js'

const router = Router()

// Realtime AI Analyses (Gemini Evaluation logs)
router.get('/analyses/:pondId/latest', getLatestAnalysis)
router.get('/analyses/:pondId/history', getAnalysisHistory)

// Recommendations
router.get('/recommendations/:pondId', getLatestRecommendation)
router.post('/recommendations/:id/authorize', authorizeRecommendation)

// Trigger Morning Briefing on demand
router.post('/trigger-morning-briefing', triggerMorningBriefing)

// Interactive NLOps Copilot Chat & Persisted History
router.post('/copilot-chat', copilotChat)
router.get('/copilot-chat/:pondId/history', getCopilotChatHistory)
router.post('/copilot-chat/:pondId/clear', clearCopilotChatHistory)

export default router
