import { telemetryRepository } from '../repositories/telemetryRepository.js'
import { pondRepository } from '../repositories/pondRepository.js'
import { aiBioflocService } from './aiBioflocService.js'
import { normalizePondId } from '../utils/idNormalizer.js'
import { mqttClient } from '../infrastructure/mqtt/mqttClient.js'

// In-memory sliding-window deduplication cache to prevent duplicate ingestion
const recentTelemetryCache = new Map()
const inFlightRequests = new Map()

export class TelemetryService {
  async processIncomingTelemetry(rawPondId, payload) {
    const candidateId = payload.pond_id || rawPondId
    const pondId = normalizePondId(candidateId)

    const incomingTs = payload.timestamp ? new Date(payload.timestamp).getTime() : Date.now()
    const incomingUptime = payload.uptime_seconds ?? payload.system?.uptime_seconds ?? 0
    const dedupeKey = `${pondId}:${incomingTs}:${incomingUptime}`

    // 1. Synchronously prevent concurrent in-flight duplicate processing (race-condition protection)
    if (inFlightRequests.has(dedupeKey)) {
      console.log(`[Telemetry Deduplication] Suppressed concurrent in-flight packet for Pond ${pondId} (ts: ${payload.timestamp})`)
      return inFlightRequests.get(dedupeKey)
    }

    // 2. Suppress recently completed duplicate packets within 3 seconds
    const cached = recentTelemetryCache.get(pondId)
    if (cached) {
      const isSameTimestamp = incomingTs && cached.timestamp === incomingTs
      const isSameUptime = incomingUptime !== undefined && cached.uptime === incomingUptime
      const isWithinWindow = (Date.now() - cached.processedAt) < 3000

      if ((isSameTimestamp || isSameUptime) && isWithinWindow) {
        console.log(`[Telemetry Deduplication] Suppressed duplicate telemetry packet for Pond ${pondId} (timestamp: ${payload.timestamp}, uptime: ${incomingUptime})`)
        return cached.record
      }
    }

    const task = this._executeTelemetryProcessing(pondId, candidateId, payload, incomingTs, incomingUptime)
    inFlightRequests.set(dedupeKey, task)
    try {
      return await task
    } finally {
      inFlightRequests.delete(dedupeKey)
    }
  }

  async _executeTelemetryProcessing(pondId, candidateId, payload, incomingTs, incomingUptime) {
    // Verify pond exists in database to prevent foreign key errors
    const pond = await pondRepository.findById(pondId)
    if (!pond) {
      console.warn(`[Telemetry] Ignored packet for unknown pond: '${candidateId}' (normalized: '${pondId}')`)
      return null
    }

    // Handle power off / disconnection gracefully
    const isPowerOff = payload.isPowered === false || 
                       payload.system?.power_state === 'OFF' || 
                       payload.condition === 'offline' || 
                       (payload.sensors === null && payload.isPowered === false)

    if (isPowerOff) {
      await pondRepository.update(pondId, { status: 'OFFLINE', health_score: 0 })
      await pondRepository.updateActuatorStatus(`ESP32-${pondId}-AR`, 'IDLE', 0)
      await pondRepository.updateActuatorStatus(`ESP32-${pondId}-FD`, 'IDLE')
      await pondRepository.updateActuatorStatus(`ESP32-${pondId}-DS`, 'IDLE')
      await pondRepository.updateActuatorStatus(`ESP32-${pondId}-FLUSH`, 'IDLE')

      mqttClient.publishProcessedTelemetry(pondId, {
        pond_id: pondId,
        isPowered: false,
        timestamp: new Date().toISOString(),
        ai: {
          healthScore: 0,
          status: 'OFFLINE',
          summary: `Edge Node Offline: Perangkat IoT dan sensor probe pada ${pond.name} dalam keadaan Powered Off.`
        }
      })
      return null
    }

    const sensors = payload.sensors || {}
    const actuators = payload.actuators || {}

    // Extract sensor values (supporting both nested simulator format and root-level shorthand)
    const doVal = sensors.dissolved_oxygen_mg_l ?? sensors.do ?? payload.dissolved_oxygen ?? payload.do ?? 6.0
    const phVal = sensors.ph ?? payload.ph ?? 7.5
    const tempVal = sensors.temperature_c ?? sensors.temp ?? payload.temperature ?? payload.temp ?? 28.5
    const ammoniaVal = sensors.ammonia_mg_l ?? sensors.ammonia ?? payload.ammonia ?? 0.02
    const flocVal = sensors.floc_density_ml_l ?? sensors.floc_density ?? sensors.flocDensity ?? payload.floc_density ?? payload.flocDensity ?? 15.0
    const orpVal = sensors.orp ?? payload.orp ?? 280.0
    const tdsVal = sensors.tds ?? payload.tds ?? 1100.0
    const batteryPercent = payload.system?.battery_percent ?? payload.battery?.percent ?? payload.battery_percent ?? 95.0

    const telemetryRecord = {
      pond_id: pondId,
      device_id: payload.device_id || `ESP32-${pondId}`,
      timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
      dissolved_oxygen: Number(doVal),
      ph: Number(phVal),
      temperature: Number(tempVal),
      ammonia: Number(ammoniaVal),
      floc_density: Number(flocVal),
      orp: Number(orpVal),
      tds: Number(tdsVal),
      battery_percent: Number(batteryPercent),
      simulation_condition: payload.condition || payload.simulation_condition || 'ok',
      raw_payload: payload
    }

    // 1. Insert into telemetry_logs table
    const savedLog = await telemetryRepository.insert(telemetryRecord)

    // Store in deduplication cache
    recentTelemetryCache.set(pondId, {
      timestamp: incomingTs,
      uptime: incomingUptime,
      processedAt: Date.now(),
      record: savedLog
    })

    // 2. Update pond's quick telemetry cache
    await pondRepository.updateTelemetryCache(pondId, {
      do: telemetryRecord.dissolved_oxygen,
      ph: telemetryRecord.ph,
      temp: telemetryRecord.temperature,
      ammonia: telemetryRecord.ammonia,
      flocDensity: telemetryRecord.floc_density,
      orp: telemetryRecord.orp,
      tds: telemetryRecord.tds,
      batteryPercent: telemetryRecord.battery_percent,
      lastSeen: telemetryRecord.timestamp
    })

    console.log(`\n┌── [CORE INGESTION] Inbound MQTT: sac/${pondId.toLowerCase()}/telemetry ──`)
    console.log(`│ • Target Pond   : ${pond.name} (${pondId}) | Node: ${telemetryRecord.device_id}`)
    console.log(`│ • Raw Inputs    : DO=${telemetryRecord.dissolved_oxygen.toFixed(2)} mg/L | pH=${telemetryRecord.ph.toFixed(2)} | Temp=${telemetryRecord.temperature.toFixed(1)}°C | TAN=${telemetryRecord.ammonia.toFixed(3)} ppm | Floc=${telemetryRecord.floc_density.toFixed(1)} mL/L`)
    console.log(`│ • Database Save : telemetry_logs (Record #${savedLog.id || 'ok'}) & pond telemetry_cache updated`)

    // 3. Update actuator statuses if present in telemetry packet
    if (actuators.aerator) {
      const aeratorState = actuators.aerator.state === 'running' ? 'RUNNING' : 'IDLE'
      await pondRepository.updateActuatorStatus(`ESP32-${pondId}-AR`, aeratorState, actuators.aerator.power_percent || 0)
    }
    if (actuators.feeder) {
      const feederState = actuators.feeder.state === 'running' ? 'RUNNING' : 'IDLE'
      await pondRepository.updateActuatorStatus(`ESP32-${pondId}-FD`, feederState)
    }
    const molasses = actuators.molasses_pump || actuators.dosing
    if (molasses) {
      const molassesState = molasses.state === 'running' ? 'RUNNING' : 'IDLE'
      await pondRepository.updateActuatorStatus(`ESP32-${pondId}-DS`, molassesState)
    }
    const siphon = actuators.siphon || actuators.water_change
    if (siphon) {
      const siphonState = siphon.state !== 'idle' ? 'RUNNING' : 'IDLE'
      await pondRepository.updateActuatorStatus(`ESP32-${pondId}-FLUSH`, siphonState)
    }

    // 4. Trigger Real-time AI Evaluation (Gemini 2.5 Flash / Biofloc Specialist)
    // Non-blocking so telemetry ingestion stays ultra-fast
    aiBioflocService.evaluateRealtimeTelemetry(pondId, telemetryRecord).catch(err => {
      console.warn(`[Telemetry AI] Evaluation failed for ${pondId}:`, err.message)
    })

    // 5. Synthesize Daily Execution Schedule based on incoming telemetry & Avnimelech models
    aiBioflocService.synthesizeDailyExecutionPlan(pondId, telemetryRecord).catch(err => {
      console.warn(`[Execution Synthesis] Synthesis failed for ${pondId}:`, err.message)
    })

    return savedLog
  }

  async getLatestTelemetry(pondId) {
    return telemetryRepository.findLatestByPondId(pondId)
  }

  async getTelemetryHistory(pondId, limit = 100) {
    return telemetryRepository.findHistoryByPondId(pondId, limit)
  }
}

export const telemetryService = new TelemetryService()
