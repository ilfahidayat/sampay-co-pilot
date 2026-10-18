import db from '../config/db.js'

export class PondRepository {
  async findAll() {
    return db('ponds').select('*').orderBy('id', 'asc')
  }

  async findById(id) {
    return db('ponds').where({ id: id.toUpperCase() }).first()
  }

  async update(id, data) {
    const updatePayload = {
      ...data,
      updated_at: new Date()
    }
    await db('ponds').where({ id: id.toUpperCase() }).update(updatePayload)
    return this.findById(id)
  }

  async updateHealthAndStatus(id, healthScore, status) {
    return this.update(id, {
      health_score: healthScore,
      status: status
    })
  }

  async updateTelemetryCache(id, telemetryObj) {
    return db('ponds').where({ id: id.toUpperCase() }).update({
      telemetry_cache: typeof telemetryObj === 'string' ? telemetryObj : JSON.stringify(telemetryObj),
      updated_at: new Date()
    })
  }

  async getActuatorsByPondId(pondId) {
    return db('actuators').where({ pond_id: pondId.toUpperCase() })
  }

  async updateActuatorStatus(actuatorId, status, powerPercent = null) {
    const updateData = { status, updated_at: new Date() }
    if (powerPercent !== null) updateData.power_percent = powerPercent
    return db('actuators').where({ id: actuatorId }).update(updateData)
  }

  async getFarmSummary() {
    const ponds = await db('ponds').select('*')
    const totalPonds = ponds.length
    const activePonds = ponds.filter(p => p.cycle_status === 'ACTIVE' || !p.cycle_status).length
    const totalLiveBiomassKg = Number(ponds.reduce((acc, p) => acc + ((p.fish_count * p.avg_weight_grams) / 1000), 0).toFixed(1))
    const totalInitialBiomassKg = Number(ponds.reduce((acc, p) => acc + (Number(p.initial_biomass_kg) || 0), 0).toFixed(1))
    const totalBiomassGainKg = Number(Math.max(0, totalLiveBiomassKg - totalInitialBiomassKg).toFixed(1))
    const totalCumulativeFeedKg = Number(ponds.reduce((acc, p) => acc + (Number(p.cumulative_feed_kg) || 0), 0).toFixed(1))
    const totalCumulativeMolassesKg = Number(ponds.reduce((acc, p) => acc + (Number(p.cumulative_molasses_kg) || 0), 0).toFixed(1))
    const farmFcr = totalBiomassGainKg > 0 ? Number((totalCumulativeFeedKg / totalBiomassGainKg).toFixed(2)) : 1.15
    const totalMortality = ponds.reduce((acc, p) => acc + (Number(p.cumulative_mortality_count) || 0), 0)
    const avgHealthScore = totalPonds > 0 ? Math.round(ponds.reduce((acc, p) => acc + (Number(p.health_score) || 0), 0) / totalPonds) : 95
    const avgSurvivalRate = totalPonds > 0 ? Number((ponds.reduce((acc, p) => acc + (Number(p.survival_rate) || 0), 0) / totalPonds).toFixed(1)) : 93.5

    return {
      totalPonds,
      activePonds,
      totalLiveBiomassKg,
      totalInitialBiomassKg,
      totalBiomassGainKg,
      totalCumulativeFeedKg,
      totalCumulativeMolassesKg,
      farmFcr,
      totalMortality,
      avgHealthScore,
      avgSurvivalRate
    }
  }
}

export const pondRepository = new PondRepository()
