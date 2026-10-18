import { Router } from 'express'
import { hardwareRepository } from '../../repositories/hardwareRepository.js'

const router = Router()

/**
 * GET /api/hardware/nodes
 * Fetch all registered hardware edge devices and nodes
 */
router.get('/nodes', async (req, res, next) => {
  try {
    const nodes = await hardwareRepository.findAll()
    res.json({
      success: true,
      count: nodes.length,
      data: nodes
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/hardware/nodes/:id
 * Fetch single hardware device by node ID or device tag
 */
router.get('/nodes/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    let node = await hardwareRepository.findById(id)
    if (!node) {
      node = await hardwareRepository.findByDeviceTag(id)
    }
    if (!node) {
      return res.status(404).json({ success: false, message: `Hardware node ${id} not found` })
    }
    res.json({ success: true, data: node })
  } catch (error) {
    next(error)
  }
})

/**
 * PUT /api/hardware/nodes/:id/assign
 * Assign hardware device to a pond
 */
router.put('/nodes/:id/assign', async (req, res, next) => {
  try {
    const { id } = req.params
    const { pondId } = req.body
    const updated = await hardwareRepository.update(id, { default_pond_id: pondId || null })
    res.json({ success: true, data: updated })
  } catch (error) {
    next(error)
  }
})

export default router
