import db from '../config/db.js'

export class HardwareRepository {
  async findAll() {
    return db('hardware_nodes').select('*').orderBy('id', 'asc')
  }

  async findById(id) {
    return db('hardware_nodes').where({ id }).first()
  }

  async findByDeviceTag(deviceTag) {
    return db('hardware_nodes').where({ device_tag: deviceTag }).first()
  }

  async findByPondId(pondId) {
    return db('hardware_nodes').where({ default_pond_id: pondId }).first()
  }

  async create(data) {
    await db('hardware_nodes').insert(data)
    return this.findById(data.id)
  }

  async update(id, data) {
    await db('hardware_nodes').where({ id }).update({
      ...data,
      updated_at: db.fn.now()
    })
    return this.findById(id)
  }
}

export const hardwareRepository = new HardwareRepository()
