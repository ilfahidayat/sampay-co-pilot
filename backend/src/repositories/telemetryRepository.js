import db from '../config/db.js'

export class TelemetryRepository {
  async insert(telemetryData) {
    const payload = {
      pond_id: telemetryData.pond_id.toUpperCase(),
      device_id: telemetryData.device_id || null,
      timestamp: telemetryData.timestamp ? new Date(telemetryData.timestamp) : new Date(),
      dissolved_oxygen: Number(telemetryData.dissolved_oxygen || telemetryData.do || 0),
      ph: Number(telemetryData.ph || 7.0),
      temperature: Number(telemetryData.temperature || telemetryData.temp || 28.0),
      ammonia: Number(telemetryData.ammonia || 0.0),
      floc_density: Number(telemetryData.floc_density || telemetryData.flocDensity || 15.0),
      orp: Number(telemetryData.orp || 280.0),
      tds: Number(telemetryData.tds || 1100.0),
      battery_percent: Number(telemetryData.battery_percent || 95.0),
      simulation_condition: telemetryData.simulation_condition || 'ok',
      raw_payload: telemetryData.raw_payload ? JSON.stringify(telemetryData.raw_payload) : null,
      created_at: new Date()
    }
    // Deduplication safety check: if an identical record exists for this pond and exact timestamp
    if (payload.timestamp) {
      const existing = await db('telemetry_logs')
        .where({ pond_id: payload.pond_id })
        .andWhere('timestamp', payload.timestamp)
        .first()
      if (existing) {
        return existing
      }
    }

    const [id] = await db('telemetry_logs').insert(payload)
    return { id, ...payload }
  }

  async findLatestByPondId(pondId) {
    return db('telemetry_logs')
      .where({ pond_id: pondId.toUpperCase() })
      .orderBy('timestamp', 'desc')
      .first()
  }

  async findHistoryByPondId(pondId, limit = 100) {
    return db('telemetry_logs')
      .where({ pond_id: pondId.toUpperCase() })
      .orderBy('timestamp', 'desc')
      .limit(limit)
  }

  async getRecentAverage(pondId, minutes = 60) {
    const sinceTime = new Date(Date.now() - minutes * 60 * 1000).toISOString()
    const result = await db('telemetry_logs')
      .where({ pond_id: pondId.toUpperCase() })
      .andWhere('timestamp', '>=', sinceTime)
      .avg({
        avg_do: 'dissolved_oxygen',
        avg_ph: 'ph',
        avg_temp: 'temperature',
        avg_ammonia: 'ammonia',
        avg_floc: 'floc_density'
      })
      .first()
    return result
  }
}

export const telemetryRepository = new TelemetryRepository()
