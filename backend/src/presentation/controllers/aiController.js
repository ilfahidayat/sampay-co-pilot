import { aiBioflocService } from '../../services/aiBioflocService.js'
import { aiAnalysisRepository } from '../../repositories/aiAnalysisRepository.js'
import { copilotMessageRepository } from '../../repositories/copilotMessageRepository.js'
import { schedulerService } from '../../services/schedulerService.js'
import { geminiClient } from '../../infrastructure/gemini/geminiClient.js'

export const getLatestRecommendation = async (req, res, next) => {
  try {
    const pondId = req.params.pondId
    const date = req.query.date || new Date().toISOString().split('T')[0]
    let rec = await aiAnalysisRepository.getLatestRecommendation(pondId, date)

    // If not generated yet for today, generate on demand
    if (!rec) {
      rec = await aiBioflocService.generateDailyMorningBriefing(pondId)
    }

    if (rec && typeof rec.treatments === 'string') {
      rec.treatments = JSON.parse(rec.treatments)
    }

    res.json({ success: true, data: rec })
  } catch (err) {
    next(err)
  }
}

export const getLatestAnalysis = async (req, res, next) => {
  try {
    const pondId = req.params.pondId
    const analysis = await aiAnalysisRepository.findLatestByPondId(pondId)
    if (!analysis) {
      return res.status(404).json({ success: false, message: `No AI analysis found for pond '${pondId}'.` })
    }

    if (typeof analysis.telemetry_snapshot === 'string') {
      analysis.telemetry_snapshot = JSON.parse(analysis.telemetry_snapshot)
    }
    if (typeof analysis.anomalies_detected === 'string') {
      analysis.anomalies_detected = JSON.parse(analysis.anomalies_detected)
    }
    if (typeof analysis.recommendation_payload === 'string') {
      analysis.recommendation_payload = JSON.parse(analysis.recommendation_payload)
    }

    res.json({ success: true, data: analysis })
  } catch (err) {
    next(err)
  }
}

export const getAnalysisHistory = async (req, res, next) => {
  try {
    const pondId = req.params.pondId
    const limit = Number(req.query.limit) || 20
    const history = await aiAnalysisRepository.findHistoryByPondId(pondId, limit)

    const parsed = history.map(item => ({
      ...item,
      telemetry_snapshot: typeof item.telemetry_snapshot === 'string' ? JSON.parse(item.telemetry_snapshot) : item.telemetry_snapshot,
      anomalies_detected: typeof item.anomalies_detected === 'string' ? JSON.parse(item.anomalies_detected) : item.anomalies_detected,
      recommendation_payload: typeof item.recommendation_payload === 'string' ? JSON.parse(item.recommendation_payload) : item.recommendation_payload
    }))

    res.json({ success: true, count: parsed.length, data: parsed })
  } catch (err) {
    next(err)
  }
}

export const authorizeRecommendation = async (req, res, next) => {
  try {
    const recId = req.params.id
    const status = req.body.status || 'APPROVED' // APPROVED | REJECTED
    const approvedBy = req.body.approved_by || 'Supervisor'

    const updated = await aiAnalysisRepository.updateRecommendationStatus(recId, status, approvedBy)
    if (!updated) {
      return res.status(404).json({ success: false, message: `Recommendation '${recId}' not found.` })
    }

    if (typeof updated.treatments === 'string') {
      updated.treatments = JSON.parse(updated.treatments)
    }

    res.json({
      success: true,
      message: `Recommendation ${status.toLowerCase()} successfully.`,
      data: updated
    })
  } catch (err) {
    next(err)
  }
}

export const triggerMorningBriefing = async (req, res, next) => {
  try {
    const pondId = req.body?.pond_id
    if (pondId) {
      const rec = await aiBioflocService.generateDailyMorningBriefing(pondId)
      return res.json({ success: true, message: `Morning briefing generated for ${pondId}.`, data: rec })
    }

    const allRecs = await schedulerService.runMorningBriefingForAllPonds()
    res.json({
      success: true,
      message: `07:00 AM Morning briefing generated for all active ponds (${allRecs.length} ponds).`,
      count: allRecs.length,
      data: allRecs
    })
  } catch (err) {
    next(err)
  }
}

export const copilotChat = async (req, res, next) => {
  try {
    const message = req.body.message
    if (!message) {
      return res.status(400).json({ success: false, message: "Field 'message' is required." })
    }

    const context = {
      activePond: req.body.active_pond || 'K01'
    }

    const result = await aiBioflocService.chatWithCopilot(message, context)
    res.json({
      success: true,
      reply: typeof result === 'object' ? result.reply : result,
      toolExecuted: typeof result === 'object' ? result.toolExecuted : null,
      actionCard: typeof result === 'object' ? result.actionCard : null,
      modelUsed: geminiClient.hasApiKey() ? geminiClient.modelName : 'Avnimelech-Heuristic-Engine'
    })
  } catch (err) {
    next(err)
  }
}

export const getCopilotChatHistory = async (req, res, next) => {
  try {
    const pondId = req.params.pondId || 'K01'
    const limit = Number(req.query.limit) || 50
    const history = await copilotMessageRepository.findByPondId(pondId, limit)
    res.json({ success: true, count: history.length, data: history })
  } catch (err) {
    next(err)
  }
}

export const clearCopilotChatHistory = async (req, res, next) => {
  try {
    const pondId = req.params.pondId || 'K01'
    await copilotMessageRepository.deleteByPondId(pondId)
    res.json({ success: true, message: `Chat history for pond ${pondId} cleared.` })
  } catch (err) {
    next(err)
  }
}

