import db from '../config/db.js'

export class AuditLogRepository {
  async insert(logData) {
    const payload = {
      pond_id: logData.pond_id ? logData.pond_id.toUpperCase() : null,
      event_type: logData.event_type,
      message: logData.message,
      metadata: logData.metadata ? JSON.stringify(logData.metadata) : null,
      ip_address: logData.ip_address || null,
      created_at: new Date()
    }
    const [id] = await db('audit_logs').insert(payload)
    return { id, ...payload }
  }

  async create(logData) {
    return this.insert(logData)
  }

  async findAll(limit = 100) {
    return db('audit_logs').orderBy('created_at', 'desc').limit(limit)
  }

  async findByPondId(pondId, limit = 50) {
    return db('audit_logs')
      .where({ pond_id: pondId.toUpperCase() })
      .orderBy('created_at', 'desc')
      .limit(limit)
  }
}

export const auditLogRepository = new AuditLogRepository()
