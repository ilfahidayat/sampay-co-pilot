import { mortalityService } from '../../services/mortalityService.js'

export const getPondMortality = async (req, res, next) => {
  try {
    const { pondId } = req.params
    const limit = Number(req.query.limit) || 100
    const logs = await mortalityService.getLogsByPondId(pondId, limit)
    res.json({
      success: true,
      pondId: pondId.toUpperCase(),
      count: logs.length,
      data: logs
    })
  } catch (err) {
    next(err)
  }
}

export const recordMortality = async (req, res, next) => {
  try {
    const { pondId } = req.params
    const result = await mortalityService.recordMortality(pondId, req.body)
    res.status(201).json({
      success: true,
      message: `Successfully logged mortality of ${result.log.count} fish for pond ${pondId.toUpperCase()}.`,
      data: result
    })
  } catch (err) {
    next(err)
  }
}

export const getAllMortality = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 100
    const logs = await mortalityService.getAllLogs(limit)
    res.json({
      success: true,
      count: logs.length,
      data: logs
    })
  } catch (err) {
    next(err)
  }
}
