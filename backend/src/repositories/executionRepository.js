import db from '../config/db.js'

export class ExecutionRepository {
  async insert(executionData) {
    const id = executionData.id || `ACT-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    if (executionData.id) {
      const existing = await this.findById(executionData.id)
      if (existing) {
        return this.update(executionData.id, executionData)
      }
    }

    const payload = {
      id,
      pond_id: executionData.pond_id.toUpperCase(),
      category: executionData.category,
      title: executionData.title,
      dosage_amount: executionData.dosage_amount !== undefined ? executionData.dosage_amount : null,
      dosage_unit: executionData.dosage_unit || null,
      aerator_power_percent: executionData.aerator_power_percent || null,
      aerator_rpm: executionData.aerator_rpm || null,
      scheduled_time: executionData.scheduled_time || null,
      executed_at: executionData.executed_at ? new Date(executionData.executed_at) : null,
      status: executionData.status || 'SCHEDULED',
      actor: executionData.actor || 'AI Copilot Schedule',
      hardware_id: executionData.hardware_id || null,
      notes: executionData.notes || null,
      result_data: executionData.result_data ? JSON.stringify(executionData.result_data) : null,
      created_at: new Date(),
      updated_at: new Date()
    }
    await db('execution_logs').insert(payload)
    return payload
  }

  async findById(id) {
    return db('execution_logs').where({ id }).first()
  }

  async findByPondId(pondId, options = {}) {
    let query = db('execution_logs')
      .where({ pond_id: pondId.toUpperCase() })
      .orderBy('created_at', 'desc')

    if (options.status && options.status !== 'ALL') {
      query = query.andWhere({ status: options.status })
    }
    if (options.category && options.category !== 'ALL') {
      query = query.andWhere({ category: options.category })
    }
    if (options.limit) {
      query = query.limit(options.limit)
    }
    return query
  }

  async update(id, updates = {}) {
    const payload = {
      ...updates,
      updated_at: new Date()
    }
    if (payload.executed_at && typeof payload.executed_at === 'string') {
      payload.executed_at = new Date(payload.executed_at)
    }
    if (payload.created_at && typeof payload.created_at === 'string') {
      payload.created_at = new Date(payload.created_at)
    }
    if (payload.result_data && typeof payload.result_data !== 'string') {
      payload.result_data = JSON.stringify(payload.result_data)
    }
    await db('execution_logs').where({ id }).update(payload)
    return this.findById(id)
  }

  async updateStatus(id, status, updates = {}) {
    return this.update(id, { status, ...updates })
  }

  async approveAllPending(pondId) {
    const updatedCount = await db('execution_logs')
      .where({ pond_id: pondId.toUpperCase() })
      .andWhere({ status: 'PENDING' })
      .update({
        status: 'SCHEDULED',
        updated_at: new Date()
      })
    return updatedCount
  }

  async findTodayExecutions(pondId) {
    const todayStr = new Date().toISOString().split('T')[0]
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    return db('execution_logs')
      .where({ pond_id: pondId.toUpperCase() })
      .andWhere(function() {
        this.where('id', 'like', `ACT-${todayStr}%`)
            .orWhere('created_at', '>=', todayStart)
      })
      .orderBy('scheduled_time', 'asc')
  }
}

export const executionRepository = new ExecutionRepository()
