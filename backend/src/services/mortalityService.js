import { mortalityRepository } from '../repositories/mortalityRepository.js'
import { pondRepository } from '../repositories/pondRepository.js'
import { auditLogRepository } from '../repositories/auditLogRepository.js'

export class MortalityService {
  async getLogsByPondId(pondId, limit = 100) {
    return mortalityRepository.findByPondId(pondId, limit)
  }

  async getAllLogs(limit = 100) {
    return mortalityRepository.findAll(limit)
  }

  async recordMortality(pondId, payload) {
    const pId = pondId.toUpperCase()
    const pond = await pondRepository.findById(pId)
    if (!pond) {
      throw new Error(`Pond '${pId}' not found.`)
    }

    const deadCount = Math.max(1, Number(payload.count) || 1)
    const deadAbw = Number(payload.avg_weight_grams || payload.avgWeightGrams) || pond.avg_weight_grams || 100
    const lostKg = Number(((deadCount * deadAbw) / 1000).toFixed(2))
    const cause = payload.cause || 'Routine / Natural Mortality (Mortalitas Alami)'
    const disposalMethod = payload.disposal_method || payload.disposalMethod || 'Dikubur dengan Kapur Tohor / Quicklime (Standar SNI Biosecurity)'
    const actor = payload.actor || 'Ilfa Hidayat (Supervisor)'
    const notes = payload.notes || ''
    const recordedAt = payload.recorded_at || payload.date ? new Date(payload.recorded_at || payload.date) : new Date()

    const logId = `MORT-${pId}-${Date.now()}`

    const newLog = await mortalityRepository.create({
      id: logId,
      pond_id: pId,
      count: deadCount,
      avg_weight_grams: deadAbw,
      biomass_lost_kg: lostKg,
      cause,
      disposal_method: disposalMethod,
      actor,
      notes,
      recorded_at: recordedAt
    })

    // Recalculate pond population & survival rate accurately
    const { totalDead } = await mortalityRepository.getTotalsByPondId(pId)
    const initialFishCount = pond.initial_fish_count || 2000
    const newFishCount = Math.max(0, initialFishCount - totalDead)
    const newSurvivalRate = Number((((initialFishCount - totalDead) / initialFishCount) * 100).toFixed(1))

    const updatedPond = await pondRepository.update(pId, {
      fish_count: newFishCount,
      cumulative_mortality_count: totalDead,
      survival_rate: newSurvivalRate
    })

    // Audit Log Entry
    await auditLogRepository.insert({
      pond_id: pId,
      event_type: 'MORTALITY_LOGGED',
      message: `Mortality Recorded: -${deadCount} fish in ${pond.name}. Cause: ${cause}. Updated SR: ${newSurvivalRate}%.`,
      metadata: {
        log_id: logId,
        count: deadCount,
        avg_weight_grams: deadAbw,
        biomass_lost_kg: lostKg,
        new_fish_count: newFishCount,
        new_survival_rate: newSurvivalRate,
        disposal_method: disposalMethod,
        actor
      }
    })

    return {
      log: newLog,
      pond: updatedPond
    }
  }
}

export const mortalityService = new MortalityService()
