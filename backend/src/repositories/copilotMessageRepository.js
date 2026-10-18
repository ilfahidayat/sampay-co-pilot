import db from '../config/db.js'

export class CopilotMessageRepository {
  async insert(messageData) {
    const id = messageData.id || `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    const payload = {
      id,
      pond_id: (messageData.pond_id || 'K01').toUpperCase(),
      role: messageData.role || 'assistant',
      sender_name: messageData.sender_name || 'Co-Pilot',
      message_type: messageData.message_type || 'CHAT',
      text: messageData.text,
      action_card: messageData.action_card ? (typeof messageData.action_card === 'string' ? messageData.action_card : JSON.stringify(messageData.action_card)) : null,
      metadata: messageData.metadata ? (typeof messageData.metadata === 'string' ? messageData.metadata : JSON.stringify(messageData.metadata)) : null,
      created_at: messageData.created_at ? new Date(messageData.created_at) : new Date()
    }

    await db('copilot_messages').insert(payload)
    return {
      ...payload,
      action_card: messageData.action_card || null,
      metadata: messageData.metadata || null
    }
  }

  async findByPondId(pondId, limit = 50) {
    const rows = await db('copilot_messages')
      .where({ pond_id: pondId.toUpperCase() })
      .orderBy('created_at', 'desc')
      .limit(limit)

    // Reverse to chronological order (oldest to newest) for chat display
    const sorted = rows.reverse()

    return sorted.map(row => ({
      ...row,
      action_card: row.action_card ? (typeof row.action_card === 'string' ? JSON.parse(row.action_card) : row.action_card) : null,
      metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : null
    }))
  }

  async findLatestByType(pondId, messageType) {
    const row = await db('copilot_messages')
      .where({ pond_id: pondId.toUpperCase(), message_type: messageType })
      .orderBy('created_at', 'desc')
      .first()

    if (!row) return null
    return {
      ...row,
      action_card: row.action_card ? (typeof row.action_card === 'string' ? JSON.parse(row.action_card) : row.action_card) : null,
      metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : null
    }
  }

  async deleteByPondId(pondId) {
    return db('copilot_messages')
      .where({ pond_id: pondId.toUpperCase() })
      .delete()
  }
}

export const copilotMessageRepository = new CopilotMessageRepository()
