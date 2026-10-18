import cron from 'node-cron'
import { pondRepository } from '../repositories/pondRepository.js'
import { aiBioflocService } from './aiBioflocService.js'
import { auditLogRepository } from '../repositories/auditLogRepository.js'

class SchedulerService {
  constructor() {
    this.cronTask = null
    this.sixHourCronTask = null
    this.morningSchedule = process.env.CRON_SCHEDULE_MORNING_BRIEFING || '0 7 * * *'
    this.sixHourSchedule = process.env.CRON_SCHEDULE_6H || '0 0,6,12,18 * * *'
  }

  start() {
    console.log(`[Scheduler] Initializing 6-Hour Assessment Cron (${this.sixHourSchedule}) [06:00, 12:00, 18:00, 00:00]...`)
    this.sixHourCronTask = cron.schedule(this.sixHourSchedule, async () => {
      console.log('[Scheduler] Executing scheduled 6-Hour Biofloc Assessment (06:00, 12:00, 18:00, 00:00 cycle)...')
      await this.runSixHourCycle()
    })

    console.log(`[Scheduler] Initializing Daily Morning Briefing Cron (${this.morningSchedule})...`)
    this.cronTask = cron.schedule(this.morningSchedule, async () => {
      console.log('[Scheduler] Executing scheduled 07:00 AM Biofloc Morning Synthesis...')
      await this.runMorningBriefingForAllPonds()
    })

    console.log('[Scheduler] Active Schedulers: 6-Hour Cycle (06:00, 12:00, 18:00, 00:00 WIB) & 07:00 AM Briefing.')
  }

  async runSixHourCycle() {
    try {
      const ponds = await pondRepository.findAll()
      const now = new Date()
      const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

      for (const pond of ponds) {
        if (pond.cycle_status === 'ACTIVE') {
          await auditLogRepository.insert({
            pond_id: pond.id,
            event_type: 'TELEMETRY_SCHEDULE_6H',
            message: `6-Hour scheduled telemetry cycle assessment completed for Pond ${pond.id} at ${timeStr} WIB.`,
            metadata: { pondId: pond.id, healthScore: pond.health_score, status: pond.status }
          })
        }
      }
    } catch (err) {
      console.error('[Scheduler] Error running 6-hour cycle:', err.message)
    }
  }

  async runMorningBriefingForAllPonds() {
    try {
      const ponds = await pondRepository.findAll()
      const results = []
      for (const pond of ponds) {
        if (pond.cycle_status === 'ACTIVE') {
          const rec = await aiBioflocService.generateDailyMorningBriefing(pond.id)
          results.push(rec)
        }
      }
      return results
    } catch (err) {
      console.error('[Scheduler] Error running morning briefing:', err.message)
      throw err
    }
  }

  stop() {
    if (this.sixHourCronTask) {
      this.sixHourCronTask.stop()
    }
    if (this.cronTask) {
      this.cronTask.stop()
      console.log('[Scheduler] Daily Cron tasks stopped.')
    }
  }
}

export const schedulerService = new SchedulerService()
