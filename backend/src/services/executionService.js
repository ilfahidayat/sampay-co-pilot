import { executionRepository } from '../repositories/executionRepository.js'
import { pondRepository } from '../repositories/pondRepository.js'
import { auditLogRepository } from '../repositories/auditLogRepository.js'
import { mqttClient } from '../infrastructure/mqtt/mqttClient.js'
import { normalizePondId } from '../utils/idNormalizer.js'

export class ExecutionService {
  async dispatchIoTCommand(rawPondId, commandRequest, customCommandId = null) {
    const pondId = normalizePondId(rawPondId)
    const rawAction = commandRequest.action // feed, molasses, aerator, siphon, purge_sludge
    const params = commandRequest.params || {}
    const commandId = customCommandId || `CMD-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    let category = 'FEEDING'
    let title = 'IoT Manual Actuator Command'
    let dosageAmount = null
    let dosageUnit = null
    let aeratorPower = null
    let aeratorRpm = null

    if (rawAction === 'feed' || rawAction === 'feeder') {
      category = 'FEEDING'
      dosageAmount = Number(params.dose || params.amount || 50)
      dosageUnit = params.unit || 'g'
      title = `Manual Feeding Pulse (${dosageAmount}${dosageUnit})`
    } else if (rawAction === 'molasses' || rawAction === 'pump_molasses') {
      category = 'MOLASSES'
      dosageAmount = Number(params.dose || params.amount || 100)
      dosageUnit = params.unit || 'ml'
      title = `Molasses Dosing Pulse (${dosageAmount}${dosageUnit})`
    } else if (rawAction === 'aerator' || rawAction === 'set_aerator_speed') {
      category = 'AERATION'
      aeratorPower = Number(params.power_percent || params.power || 80)
      aeratorRpm = Number(params.rpm || (aeratorPower * 15))
      dosageAmount = aeratorPower
      dosageUnit = '%'
      title = `VFD Aerator Speed Target: ${aeratorPower}% (~${aeratorRpm} RPM)`
    } else if (rawAction === 'siphon' || rawAction === 'water_change' || rawAction === 'purge_sludge') {
      category = 'SIPHON_FLUSH'
      dosageAmount = Number(params.volume || 200)
      dosageUnit = 'L'
      title = `Bottom Siphon Sludge Purge (${dosageAmount} L)`
    }

    const nowTimeStr = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' WIB'

    // 1. Insert or update execution log as RUNNING
    let execution = null
    if (customCommandId) {
      const existing = await executionRepository.findById(customCommandId)
      if (existing) {
        execution = await executionRepository.update(customCommandId, {
          status: 'RUNNING',
          executed_at: new Date()
        })
      }
    }

    if (!execution) {
      execution = await executionRepository.insert({
        id: commandId,
        pond_id: pondId,
        category,
        title,
        dosage_amount: dosageAmount,
        dosage_unit: dosageUnit,
        aerator_power_percent: aeratorPower,
        aerator_rpm: aeratorRpm,
        scheduled_time: nowTimeStr,
        executed_at: new Date(),
        status: 'RUNNING',
        actor: commandRequest.actor || 'Supervisor Dashboard',
        hardware_id: `sac/${pondId.toLowerCase()}/${rawAction}`,
        notes: commandRequest.notes || 'Command dispatched from REST API'
      })
    }

    // 2. Dispatch command via MQTT
    const mqttPayload = {
      command_id: commandId,
      pond_id: pondId,
      action: rawAction,
      params,
      timestamp: new Date().toISOString()
    }
    const published = mqttClient.publishCommand(pondId, mqttPayload)

    // 3. Log to audit trail
    await auditLogRepository.insert({
      pond_id: pondId,
      event_type: 'COMMAND_DISPATCHED',
      message: `Supervisor dispatched action '${rawAction}' to ${pondId}. Command ID: ${commandId}`,
      metadata: { commandId, action: rawAction, params, published }
    })

    // 4. Broadcast execution update via MQTT for frontend reactive refresh
    mqttClient.publishExecutionUpdate(pondId, execution)

    // Pulse / cycle duration calculation
    const pulseDurationMs = category === 'AERATION' ? 2000 : (category === 'SIPHON_FLUSH' ? 6000 : 4000)

    console.log(`\n┌── [CORE ACTUATOR DISPATCH] Command: ${commandId} ──`)
    console.log(`│ • Target Pond   : ${pondId} | Action: ${rawAction.toUpperCase()} | Category: ${category}`)
    console.log(`│ • Parameters    : ${dosageAmount !== null ? `${dosageAmount} ${dosageUnit || ''}` : '-'} | Actor: ${commandRequest.actor || 'Supervisor'}`)
    console.log(`│ • MQTT Outbound : sac/${pondId.toLowerCase()}/commands [${published ? 'SENT ✔' : 'OFFLINE ⚠️'}]`)
    console.log(`│ • Execution DB  : execution_logs (${commandId}) -> Status: RUNNING`)
    console.log(`└── [DISPATCH AWAITING] Auto-transition timer (${pulseDurationMs}ms) / Hardware ack standby...`)

    // 5. Auto-transition to SUCCESS after completion duration
    setTimeout(async () => {
      try {
        const current = await executionRepository.findById(commandId)
        if (current && current.status === 'RUNNING') {
          await executionRepository.updateStatus(commandId, 'SUCCESS', {
            result_data: { status: 'SUCCESS', autoCompleted: true, durationMs: pulseDurationMs }
          })
          mqttClient.publishExecutionUpdate(pondId, { id: commandId, status: 'SUCCESS', pond_id: pondId })
          console.log(`\n┌── [CORE ACTUATOR COMPLETED] Command: ${commandId} ──`)
          console.log(`│ • Pond: ${pondId} | Action: ${rawAction.toUpperCase()} | Category: ${category}`)
          console.log(`│ • Status: SUCCESS | Duration: ${pulseDurationMs}ms | Auto-Completed: Yes`)
          console.log(`└── [DATABASE UPDATED] execution_logs status=SUCCESS & MQTT update broadcasted ✔\n`)
        }
      } catch (err) {
        console.warn(`[IoT Completion] Error completing ${commandId}:`, err.message)
      }
    }, pulseDurationMs)

    return execution
  }

  async handleIncomingActuatorEvent(rawPondId, eventPayload) {
    const candidateId = eventPayload.pond_id || rawPondId
    const pondId = normalizePondId(candidateId)
    const eventType = eventPayload.event // FEED_STARTED, FEED_COMPLETED, etc.
    const data = eventPayload.data || {}
    const commandId = data.command_id

    console.log(`[IoT Event] Received '${eventType}' for ${pondId} (raw: ${rawPondId})`)

    if (commandId) {
      if (eventType.includes('COMPLETED')) {
        await executionRepository.updateStatus(commandId, 'SUCCESS', {
          result_data: data
        })
        mqttClient.publishExecutionUpdate(pondId, { id: commandId, status: 'SUCCESS', event: eventType })
      } else if (eventType.includes('STARTED')) {
        await executionRepository.updateStatus(commandId, 'RUNNING')
        mqttClient.publishExecutionUpdate(pondId, { id: commandId, status: 'RUNNING', event: eventType })
      }
    } else {
      mqttClient.publishExecutionUpdate(pondId, { pondId, event: eventType, data })
    }

    // Update actuator state in database
    if (eventType.includes('FEED')) {
      const state = eventType.includes('COMPLETED') ? 'IDLE' : 'RUNNING'
      await pondRepository.updateActuatorStatus(`ESP32-${pondId}-FD`, state)
    } else if (eventType.includes('MOLASSES')) {
      const state = eventType.includes('COMPLETED') ? 'IDLE' : 'RUNNING'
      await pondRepository.updateActuatorStatus(`ESP32-${pondId}-DS`, state)
    } else if (eventType.includes('SIPHON')) {
      const state = eventType.includes('COMPLETED') ? 'IDLE' : 'RUNNING'
      await pondRepository.updateActuatorStatus(`ESP32-${pondId}-FLUSH`, state)
    }
  }

  async getExecutions(pondId, options = {}) {
    return executionRepository.findByPondId(pondId, options)
  }
}

export const executionService = new ExecutionService()
