import db from '../config/db.js'

export class AiAnalysisRepository {
  async insertAnalysis(data) {
    const payload = {
      id: data.id || `AI-EVAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      pond_id: data.pond_id.toUpperCase(),
      trigger_type: data.trigger_type, // REALTIME_TELEMETRY, DAILY_0700_BRIEFING, MANUAL_PROMPT
      health_score: data.health_score || 95,
      health_status: data.health_status || 'OPTIMAL',
      summary: data.summary,
      telemetry_snapshot: data.telemetry_snapshot ? JSON.stringify(data.telemetry_snapshot) : null,
      anomalies_detected: data.anomalies_detected ? JSON.stringify(data.anomalies_detected) : null,
      recommendation_payload: data.recommendation_payload ? JSON.stringify(data.recommendation_payload) : null,
      model_used: data.model_used || 'gemini-3.8-flash',
      prompt_tokens: data.prompt_tokens || 0,
      candidate_tokens: data.candidate_tokens || 0,
      created_at: new Date()
    }
    await db('ai_analyses').insert(payload)
    return payload
  }

  async findLatestByPondId(pondId) {
    return db('ai_analyses')
      .where({ pond_id: pondId.toUpperCase() })
      .orderBy('created_at', 'desc')
      .first()
  }

  async findHistoryByPondId(pondId, limit = 50) {
    return db('ai_analyses')
      .where({ pond_id: pondId.toUpperCase() })
      .orderBy('created_at', 'desc')
      .limit(limit)
  }

  async insertRecommendation(data) {
    const payload = {
      id: data.id || `REC-${data.pond_id.toUpperCase()}-${data.plan_date}`,
      pond_id: data.pond_id.toUpperCase(),
      plan_date: data.plan_date,
      status: data.status || 'PENDING',
      summary: data.summary,
      treatments: typeof data.treatments === 'string' ? data.treatments : JSON.stringify(data.treatments),
      approved_by: data.approved_by || null,
      approved_at: data.approved_at ? new Date(data.approved_at) : null,
      created_at: new Date(),
      updated_at: new Date()
    }
    // Upsert by pond_id and plan_date
    const existing = await db('ai_recommendations')
      .where({ pond_id: payload.pond_id, plan_date: payload.plan_date })
      .first()

    if (existing) {
      await db('ai_recommendations').where({ id: existing.id }).update({
        summary: payload.summary,
        treatments: payload.treatments,
        updated_at: new Date()
      })
      return { ...existing, ...payload }
    } else {
      await db('ai_recommendations').insert(payload)
      return payload
    }
  }

  async getLatestRecommendation(pondId, planDate = null) {
    let query = db('ai_recommendations')
      .where({ pond_id: pondId.toUpperCase() })
      .orderBy('plan_date', 'desc')

    if (planDate) {
      query = query.andWhere({ plan_date: planDate })
    }
    return query.first()
  }

  async updateRecommendationStatus(id, status, approvedBy = 'Supervisor') {
    const updateData = {
      status,
      approved_by: approvedBy,
      approved_at: new Date(),
      updated_at: new Date()
    }
    await db('ai_recommendations').where({ id }).update(updateData)
    return db('ai_recommendations').where({ id }).first()
  }
}

export const aiAnalysisRepository = new AiAnalysisRepository()
