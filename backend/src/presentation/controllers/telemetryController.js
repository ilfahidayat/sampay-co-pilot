import { telemetryService } from '../../services/telemetryService.js'

export const getLatestTelemetry = async (req, res, next) => {
  try {
    const data = await telemetryService.getLatestTelemetry(req.params.pondId)
    if (!data) {
      return res.status(404).json({ success: false, message: 'No telemetry found for this pond.' })
    }
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
}

export const getTelemetryHistory = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 100
    const history = await telemetryService.getTelemetryHistory(req.params.pondId, limit)
    res.json({ success: true, count: history.length, data: history })
  } catch (err) {
    next(err)
  }
}

export const postManualTelemetry = async (req, res, next) => {
  try {
    const pondId = req.params.pondId
    const record = await telemetryService.processIncomingTelemetry(pondId, req.body)
    res.status(201).json({ success: true, message: 'Telemetry packet ingested successfully.', data: record })
  } catch (err) {
    next(err)
  }
}
