import db from '../config/db.js'

export class MortalityRepository {
  async findByPondId(pondId, limit = 100) {
    return db('mortality_logs')
      .where({ pond_id: pondId.toUpperCase() })
      .orderBy('recorded_at', 'desc')
      .limit(limit)
  }

  async findAll(limit = 100) {
    return db('mortality_logs')
      .select('*')
      .orderBy('recorded_at', 'desc')
      .limit(limit)
  }

  async findById(id) {
    return db('mortality_logs').where({ id }).first()
  }

  async create(data) {
    await db('mortality_logs').insert(data)
    return this.findById(data.id)
  }

  async getTotalsByPondId(pondId) {
    const result = await db('mortality_logs')
      .where({ pond_id: pondId.toUpperCase() })
      .sum('count as total_dead')
      .sum('biomass_lost_kg as total_biomass_lost')
      .first()

    return {
      totalDead: Number(result?.total_dead || 0),
      totalBiomassLost: Number(Number(result?.total_biomass_lost || 0).toFixed(2))
    }
  }
}

export const mortalityRepository = new MortalityRepository()
