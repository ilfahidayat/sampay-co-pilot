import { pondService } from '../../services/pondService.js'

export const getPonds = async (req, res, next) => {
  try {
    const ponds = await pondService.getAllPonds()
    res.json({ success: true, count: ponds.length, data: ponds })
  } catch (err) {
    next(err)
  }
}

export const getFarmSummary = async (req, res, next) => {
  try {
    const summary = await pondService.getFarmSummary()
    res.json({ success: true, data: summary })
  } catch (err) {
    next(err)
  }
}

export const getPondById = async (req, res, next) => {
  try {
    const pond = await pondService.getPondById(req.params.id)
    if (!pond) {
      return res.status(404).json({ success: false, message: `Pond '${req.params.id}' not found.` })
    }
    res.json({ success: true, data: pond })
  } catch (err) {
    next(err)
  }
}

export const updatePond = async (req, res, next) => {
  try {
    const updated = await pondService.updatePond(req.params.id, req.body)
    res.json({ success: true, message: 'Pond updated successfully.', data: updated })
  } catch (err) {
    next(err)
  }
}
