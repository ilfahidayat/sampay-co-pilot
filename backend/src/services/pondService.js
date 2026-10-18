import { pondRepository } from '../repositories/pondRepository.js'
import { telemetryRepository } from '../repositories/telemetryRepository.js'

export class PondService {
  async getAllPonds() {
    const ponds = await pondRepository.findAll()
    return ponds.map(pond => ({
      ...pond,
      telemetry: pond.telemetry_cache 
        ? (typeof pond.telemetry_cache === 'string' ? JSON.parse(pond.telemetry_cache) : pond.telemetry_cache)
        : null,
      iot_config: pond.iot_config
        ? (typeof pond.iot_config === 'string' ? JSON.parse(pond.iot_config) : pond.iot_config)
        : null
    }))
  }

  async getPondById(id) {
    const pond = await pondRepository.findById(id)
    if (!pond) return null

    const actuators = await pondRepository.getActuatorsByPondId(id)
    const latestTelemetry = await telemetryRepository.findLatestByPondId(id)

    // Parse actuators config
    const parsedActuators = actuators.map(act => ({
      ...act,
      config: act.config ? (typeof act.config === 'string' ? JSON.parse(act.config) : act.config) : null
    }))

    return {
      ...pond,
      telemetry: pond.telemetry_cache 
        ? (typeof pond.telemetry_cache === 'string' ? JSON.parse(pond.telemetry_cache) : pond.telemetry_cache)
        : (latestTelemetry || null),
      actuators: parsedActuators,
      iot_config: pond.iot_config
        ? (typeof pond.iot_config === 'string' ? JSON.parse(pond.iot_config) : pond.iot_config)
        : null
    }
  }

  async updatePond(id, updateData) {
    const payload = { ...updateData }
    if (payload.iot_config && typeof payload.iot_config === 'object') {
      payload.iot_config = JSON.stringify(payload.iot_config)
    }
    if (payload.telemetry_cache && typeof payload.telemetry_cache === 'object') {
      payload.telemetry_cache = JSON.stringify(payload.telemetry_cache)
    }
    return pondRepository.update(id, payload)
  }

  async getFarmSummary() {
    return pondRepository.getFarmSummary()
  }

  async updateHealthScore(id, score, status) {
    return pondRepository.updateHealthAndStatus(id, score, status)
  }
}

export const pondService = new PondService()
