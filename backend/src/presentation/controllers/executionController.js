import { executionService } from '../../services/executionService.js'
import { executionRepository } from '../../repositories/executionRepository.js'
import { aiAnalysisRepository } from '../../repositories/aiAnalysisRepository.js'
import { pondRepository } from '../../repositories/pondRepository.js'
import { aiBioflocService } from '../../services/aiBioflocService.js'
import { mqttClient } from '../../infrastructure/mqtt/mqttClient.js'

export const getExecutions = async (req, res, next) => {
  try {
    const pondId = req.params.pondId
    const options = {
      status: req.query.status,
      category: req.query.category,
      limit: parseInt(req.query.limit, 10) || 50
    }
    const executions = await executionService.getExecutions(pondId, options)
    res.json({ success: true, count: executions.length, data: executions })
  } catch (err) {
    next(err)
  }
}

export const dispatchCommand = async (req, res, next) => {
  try {
    const pondId = req.params.pondId
    const commandRequest = req.body
    if (!commandRequest.action) {
      return res.status(400).json({ success: false, message: "Field 'action' is required (e.g. 'feed', 'molasses', 'aerator', 'siphon')." })
    }

    const execution = await executionService.dispatchIoTCommand(pondId, commandRequest)
    res.status(201).json({
      success: true,
      message: `Command '${commandRequest.action}' successfully queued and published to MQTT topic 'sac/${pondId.toLowerCase()}/commands'.`,
      data: execution
    })
  } catch (err) {
    next(err)
  }
}

export const approveAllExecutions = async (req, res, next) => {
  try {
    const pondId = req.params.pondId
    const updatedCount = await executionRepository.approveAllPending(pondId)
    
    // Also approve recommendation in ai_recommendations if present
    const todayStr = new Date().toISOString().split('T')[0]
    await aiAnalysisRepository.updateRecommendationStatus(`REC-${pondId.toUpperCase()}-${todayStr}`, 'APPROVED', 'Supervisor')
    
    mqttClient.publishExecutionUpdate(pondId, { pond_id: pondId, type: 'ALL_APPROVED', count: updatedCount })
    res.json({ success: true, message: `All ${updatedCount} pending executions approved for ${pondId}.`, count: updatedCount })
  } catch (err) {
    next(err)
  }
}

export const approveExecution = async (req, res, next) => {
  try {
    const id = req.params.id
    const updated = await executionRepository.update(id, { status: 'SCHEDULED' })
    if (!updated) return res.status(404).json({ success: false, message: 'Execution not found.' })
    mqttClient.publishExecutionUpdate(updated.pond_id, { id, status: 'SCHEDULED', pond_id: updated.pond_id })
    res.json({ success: true, message: 'Execution approved and scheduled.', data: updated })
  } catch (err) {
    next(err)
  }
}

export const rejectExecution = async (req, res, next) => {
  try {
    const id = req.params.id
    const updated = await executionRepository.update(id, { status: 'REJECTED' })
    if (!updated) return res.status(404).json({ success: false, message: 'Execution not found.' })
    mqttClient.publishExecutionUpdate(updated.pond_id, { id, status: 'REJECTED', pond_id: updated.pond_id })
    res.json({ success: true, message: 'Execution rejected.', data: updated })
  } catch (err) {
    next(err)
  }
}

export const adjustExecution = async (req, res, next) => {
  try {
    const id = req.params.id
    const { dosage_amount, dosage_unit, scheduled_time, aerator_power_percent, aerator_rpm, notes, title, status } = req.body
    const existing = await executionRepository.findById(id)
    if (!existing) return res.status(404).json({ success: false, message: 'Execution not found.' })

    const updateData = {}
    if (status !== undefined) {
      updateData.status = status
    } else if (existing.status === 'PENDING') {
      updateData.status = 'SCHEDULED' // auto schedule after adjustment
    }

    if (dosage_amount !== undefined && dosage_amount !== null) updateData.dosage_amount = Number(dosage_amount)
    if (dosage_unit !== undefined) updateData.dosage_unit = dosage_unit
    if (scheduled_time !== undefined) updateData.scheduled_time = scheduled_time
    if (aerator_power_percent !== undefined && aerator_power_percent !== null) {
      updateData.aerator_power_percent = Number(aerator_power_percent)
      updateData.aerator_rpm = Number(aerator_rpm || Math.round(Number(aerator_power_percent) * 15))
    }
    if (notes !== undefined) updateData.notes = notes
    if (title !== undefined) updateData.title = title

    const updated = await executionRepository.update(id, updateData)
    mqttClient.publishExecutionUpdate(updated.pond_id, { id, status: updated.status, data: updated, pond_id: updated.pond_id })
    res.json({ success: true, message: 'Execution adjusted successfully.', data: updated })
  } catch (err) {
    next(err)
  }
}

export const createManualExecution = async (req, res, next) => {
  try {
    const pondId = req.params.pondId
    const {
      category = 'FEEDING',
      title,
      dosage_amount,
      dosage_unit,
      aerator_power_percent,
      scheduled_time = 'Manual Action',
      notes = '',
      status = 'SCHEDULED',
      executeNow = false
    } = req.body

    const todayStr = new Date().toISOString().split('T')[0]
    const customId = `MAN-${todayStr}-${pondId}-${Date.now().toString().slice(-4)}`

    if (executeNow) {
      let action = 'feed'
      let params = {}
      if (category === 'FEEDING') {
        action = 'feed'
        params = { dose: dosage_amount || 50, unit: dosage_unit || 'g' }
      } else if (category === 'AERATION') {
        action = 'aerator'
        params = { state: 'running', powerPercent: aerator_power_percent || 80 }
      } else if (category === 'MOLASSES') {
        action = 'molasses'
        params = { dose: dosage_amount || 250, unit: dosage_unit || 'g' }
      } else if (category === 'SIPHON_FLUSH') {
        action = 'siphon'
        params = { volume: dosage_amount || 200, unit: 'liter' }
      }

      const dispatched = await executionService.dispatchIoTCommand(pondId, {
        action,
        params,
        actor: 'Supervisor Manual Action',
        notes: notes || title || 'Immediate manual action dispatched'
      })
      return res.status(201).json({ success: true, message: 'Action dispatched immediately to IoT actuators.', data: dispatched })
    }

    const created = await executionRepository.insert({
      id: customId,
      pond_id: pondId,
      category,
      title: title || `Manual ${category} Action`,
      dosage_amount: dosage_amount !== undefined && dosage_amount !== null ? Number(dosage_amount) : null,
      dosage_unit: dosage_unit || null,
      aerator_power_percent: aerator_power_percent !== undefined && aerator_power_percent !== null ? Number(aerator_power_percent) : null,
      aerator_rpm: aerator_power_percent ? Math.round(Number(aerator_power_percent) * 15) : null,
      scheduled_time,
      status: status || 'SCHEDULED',
      actor: 'Supervisor Manual Task',
      hardware_id: `sac/${pondId.toLowerCase()}/${category.toLowerCase()}`,
      notes
    })

    mqttClient.publishExecutionUpdate(pondId, {
      pond_id: pondId,
      type: 'MANUAL_TASK_CREATED',
      data: created
    })

    res.status(201).json({
      success: true,
      message: `Manual task '${created.title}' created and queued.`,
      data: created
    })
  } catch (err) {
    next(err)
  }
}

export const runExecutionNow = async (req, res, next) => {
  try {
    const id = req.params.id
    const exec = await executionRepository.findById(id)
    if (!exec) return res.status(404).json({ success: false, message: 'Execution not found.' })

    let action = 'feed'
    let params = {}
    if (exec.category === 'FEEDING') {
      action = 'feed'
      params = { dose: exec.dosage_amount || 50, unit: exec.dosage_unit || 'g' }
    } else if (exec.category === 'AERATION') {
      action = 'aerator'
      params = { state: 'running', powerPercent: exec.aerator_power_percent || 80 }
    } else if (exec.category === 'MOLASSES') {
      action = 'molasses'
      params = { dose: exec.dosage_amount || 250, unit: exec.dosage_unit || 'g' }
    } else if (exec.category === 'SIPHON_FLUSH') {
      action = 'siphon'
      params = { volume: exec.dosage_amount || 200, unit: 'liter' }
    }

    const dispatched = await executionService.dispatchIoTCommand(exec.pond_id, {
      action,
      params,
      actor: 'Supervisor Manual Dispatch',
      notes: `Immediate run triggered for ${exec.title}`
    }, id)

    res.json({ success: true, message: `Action '${exec.title}' dispatched to IoT actuators.`, data: dispatched })
  } catch (err) {
    next(err)
  }
}

export const synthesizePondExecutions = async (req, res, next) => {
  try {
    const pondId = req.params.pondId
    const pond = await pondRepository.findById(pondId)
    const telemetry = pond?.telemetry_cache ? (typeof pond.telemetry_cache === 'string' ? JSON.parse(pond.telemetry_cache) : pond.telemetry_cache) : {}
    const result = await aiBioflocService.synthesizeDailyExecutionPlan(pondId, telemetry)
    res.json({ success: true, message: `Execution plan synthesized for ${pondId}.`, count: result?.length || 0, data: result })
  } catch (err) {
    next(err)
  }
}
