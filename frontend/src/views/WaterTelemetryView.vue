<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { usePonds } from '../composables/usePonds'
import { apiClient } from '../services/apiClient'
import { useDataSync } from '../composables/useDataSync'
import { 
  Droplet, 
  Droplets,
  Thermometer, 
  Biohazard, 
  Compass,
  Layers, 
  Activity, 
  Clock, 
  Calendar, 
  Download, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon,
  LineChart, 
  BarChart3, 
  Camera,
  Sparkles,
  Radio,
  Zap,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
  Filter,
  X
} from 'lucide-vue-next'
import WaterGaugeCard from '../components/WaterGaugeCard.vue'

const { ponds, selectedPondId, activePond, setPond } = usePonds()
const { onTelemetryUpdated } = useDataSync()

// Helper to determine Health Index status level, simple English badge (Health, Warning, Danger)
const getHealthStatus = (score) => {
  const s = Number(score) || 0
  if (s >= 90) {
    return {
      level: 'health',
      color: 'green',
      label: 'Health',
      statusTitle: 'HEALTH',
      conditionText: 'Optimal & Healthy',
      statusExplanation: 'Water condition is optimal, stable & biologically safe',
      badgeClass: 'health-badge-green',
      barColor: '#10b981',
      dotClass: 'dot-green',
      textClass: 'text-emerald'
    }
  } else if (s >= 75) {
    return {
      level: 'warning',
      color: 'orange',
      label: 'Warning',
      statusTitle: 'WARNING',
      conditionText: 'Caution / Warning',
      statusExplanation: 'Parameter drift detected. Adjustment advised',
      badgeClass: 'health-badge-orange',
      barColor: '#f59e0b',
      dotClass: 'dot-orange',
      textClass: 'text-amber'
    }
  } else {
    return {
      level: 'danger',
      color: 'red',
      label: 'Danger',
      statusTitle: 'DANGER',
      conditionText: 'Critical / Danger',
      statusExplanation: 'Critical emergency! Immediate farm intervention required',
      badgeClass: 'health-badge-red',
      barColor: '#ef4444',
      dotClass: 'dot-red',
      textClass: 'text-rose'
    }
  }
}

// Active Pond Health & Diagnostic Assessment (dynamically reactive to active pond, database & Gemini AI)
const activePondAssessment = computed(() => {
  const pond = activePond.value
  const score = Number(pond.healthScore) || (pond.status === 'CRITICAL' ? 58 : (pond.status === 'CAUTION' ? 78 : 96))
  const health = getHealthStatus(score)

  let synthesis = ''

  if (pond.aiAnalysis?.summary) {
    synthesis = pond.aiAnalysis.summary
  } else if (health.level === 'danger') {
    if (pond.telemetry?.do && pond.telemetry.do < 4.0) {
      synthesis = `Hypoxia Emergency: Dissolved oxygen critically depleted at ${pond.telemetry.do} mg/L. Tilapia exhibit acute respiratory stress and surface piping. Urgent aeration bypass required.`
    } else {
      synthesis = `Critical Biosecurity Alert: Elevated toxins detected with free ammonia at ${pond.telemetry?.ammonia || 0.15} ppm. Immediate fish survival hazard requiring bottom siphon purge.`
    }
  } else if (health.level === 'warning') {
    if (pond.telemetry?.ammonia && pond.telemetry.ammonia > 0.05) {
      synthesis = `Total Ammonia Nitrogen (TAN) elevated at ${pond.telemetry.ammonia} ppm with pH ${pond.telemetry?.ph || 7.8}. Heterotrophic assimilation rate slowed by organic carbon deficit.`
    } else {
      synthesis = `Water quality drifting from standard baseline (DO ${pond.telemetry?.do || 4.8} mg/L, TAN ${pond.telemetry?.ammonia || 0.04} ppm). Microbial floc density requires monitoring.`
    }
  } else {
    // Health state
    if (pond.id === 'K01') {
      synthesis = 'Water quality is fully matured with a stable heterotrophic biofloc consortium (14 mL/L). High dissolved oxygen (> 6.0 mg/L) maintains vigorous feeding appetite during finisher phase. Tilapia have reached 920g (97% of target) and are primed for scheduled batch harvesting.'
    } else if (pond.id === 'K02') {
      synthesis = 'Grower phase progressing aggressively with average daily weight gain (ADG) of +4.05 g/day. C:N 15:1 assimilation successfully locks free ammonia (TAN) at 0.025 ppm with superior feed conversion (FCR 1.14).'
    } else if (pond.id === 'K03') {
      synthesis = 'F1 fingerlings show excellent vigor with 96.8% survival rate. Micro-bubble diffused aeration maintains DO at 6.8 mg/L with gentle water velocity. Biofloc volume (8 mL/L) offers rich natural protein supplementation.'
    } else if (pond.id === 'K04') {
      synthesis = 'Heterotrophic microbial loop operating at peak performance with calibrated Imhoff-Vision AI optical sensing. Zero water exchange maintained across 96 days with balanced nitrification and heterotrophic assimilation.'
    } else {
      synthesis = `Water parameters remain stable at DO ${pond.telemetry?.do || 6.0} mg/L and TAN ${pond.telemetry?.ammonia || 0.02} ppm. Biomass trajectory tracking planned harvest curve.`
    }
  }

  return {
    score,
    health,
    synthesis
  }
})

// History parameters & range state
const selectedRange = ref('24h') // '24h' | '7d' | '30d'
const selectedParam = ref('do') // Strictly 5: 'do' | 'ph' | 'temp' | 'ammonia' | 'floc'
const hoveredPoint = ref(null)
const logSearchKeyword = ref('')
const tableViewMode = ref('aggregated') // 'aggregated' | 'raw'
const dbHistoryLogs = ref([])
const isLoadingHistory = ref(false)

// Accurate Biological State & Anomaly Diagnostic Evaluator
const evaluateBiologicalState = ({ do: doVal, ammonia: tanVal, ph: phVal, temp: tempVal, condition }) => {
  const cond = String(condition || '').toLowerCase()
  const dVal = Number(doVal) || 0
  const tVal = Number(tanVal) || 0
  const pVal = Number(phVal) || 7.0
  const cVal = Number(tempVal) || 28.0

  // 1. Critical Emergency Checks (Immediate Danger)
  if (dVal < 3.5) {
    return {
      code: 'CRITICAL',
      label: 'CRITICAL HYPOXIA',
      badgeClass: 'status-critical',
      badgeText: 'text-rose font-bold',
      icon: 'AlertOctagon',
      desc: `DO ${dVal.toFixed(2)} mg/L < 3.5 mg/L threshold`
    }
  }
  if (tVal >= 0.75) {
    return {
      code: 'CRITICAL',
      label: 'AMMONIA TOXICITY',
      badgeClass: 'status-critical',
      badgeText: 'text-rose font-bold',
      icon: 'Biohazard',
      desc: `TAN ${tVal.toFixed(3)} ppm exceeds 0.75 ppm danger threshold`
    }
  }
  if (cVal > 32.5 || cVal < 25.0) {
    return {
      code: 'CRITICAL',
      label: cVal > 32.5 ? 'HEAT STRESS DANGER' : 'HYPOTHERMIA RISK',
      badgeClass: 'status-critical',
      badgeText: 'text-rose font-bold',
      icon: 'AlertOctagon',
      desc: `Temp ${cVal.toFixed(1)}°C outside safe survival range (25-32.5°C)`
    }
  }
  if (pVal < 6.8 || pVal > 8.4) {
    return {
      code: 'CRITICAL',
      label: pVal < 6.8 ? 'ACIDIC EMERGENCY' : 'ALKALINE TOXICITY',
      badgeClass: 'status-critical',
      badgeText: 'text-rose font-bold',
      icon: 'AlertOctagon',
      desc: `pH ${pVal.toFixed(2)} outside safe physiological bounds`
    }
  }
  if (cond === 'critical' || cond === 'danger') {
    return {
      code: 'CRITICAL',
      label: 'CRITICAL ANOMALY',
      badgeClass: 'status-critical',
      badgeText: 'text-rose font-bold',
      icon: 'AlertOctagon',
      desc: 'Severe biological distress detected in pond'
    }
  }

  // 2. Cautionary Warning Checks
  if (dVal < 5.0) {
    return {
      code: 'WARNING',
      label: 'CAUTION (LOW DO)',
      badgeClass: 'status-warning',
      badgeText: 'text-amber font-bold',
      icon: 'AlertTriangle',
      desc: `DO ${dVal.toFixed(2)} mg/L below 5.0 safe floor`
    }
  }
  if (tVal >= 0.25) {
    return {
      code: 'WARNING',
      label: 'AMMONIA WATCH',
      badgeClass: 'status-warning',
      badgeText: 'text-amber font-bold',
      icon: 'AlertTriangle',
      desc: `TAN ${tVal.toFixed(3)} ppm entering buffer watch zone (≥ 0.25 ppm)`
    }
  }
  if (pVal < 7.2 || pVal > 8.0) {
    return {
      code: 'WARNING',
      label: 'pH DRIFT',
      badgeClass: 'status-warning',
      badgeText: 'text-amber font-bold',
      icon: 'AlertTriangle',
      desc: `pH ${pVal.toFixed(2)} drifting from 7.2 - 8.0 target`
    }
  }
  if (cVal < 27.0 || cVal > 30.5) {
    return {
      code: 'WARNING',
      label: 'TEMP DEVIATION',
      badgeClass: 'status-warning',
      badgeText: 'text-amber font-bold',
      icon: 'Thermometer',
      desc: `Temp ${cVal.toFixed(1)}°C outside optimal feeding range (27-30.5°C)`
    }
  }
  if (cond === 'warning') {
    return {
      code: 'WARNING',
      label: 'STRESSED / WATCH',
      badgeClass: 'status-warning',
      badgeText: 'text-amber font-bold',
      icon: 'AlertTriangle',
      desc: 'Pond marked with biological warning state'
    }
  }

  // 3. Optimal State
  return {
    code: 'OPTIMAL',
    label: 'OPTIMAL & HEALTHY',
    badgeClass: 'status-optimal',
    badgeText: 'text-emerald font-bold',
    icon: 'CheckCircle2',
    desc: 'Parameters within stable biofloc equilibrium'
  }
}

// Parse individual raw DB record
const parseTelemetryRecord = (row) => {
  const d = new Date(row.timestamp || row.created_at || Date.now())
  const doVal = Number(row.dissolved_oxygen ?? row.do ?? 0)
  const phVal = Number(row.ph ?? 7.0)
  const tempVal = Number(row.temperature ?? row.temp ?? 28.0)
  const ammoniaVal = Number(row.ammonia ?? 0)
  const flocVal = Number(row.floc_density ?? row.flocDensity ?? 14.0)
  const orpVal = Number(row.orp ?? 280)
  const tdsVal = Number(row.tds ?? 1100)
  const condition = (row.simulation_condition || row.condition || 'ok').toLowerCase()

  let rawPayload = null
  try {
    if (typeof row.raw_payload === 'string') rawPayload = JSON.parse(row.raw_payload)
    else if (typeof row.raw_payload === 'object') rawPayload = row.raw_payload
  } catch (e) {
    rawPayload = null
  }

  // Detect transmission mode: Scheduled 6h cycle (00:00, 06:00, 12:00, 18:00) vs Manual trigger
  const hour = d.getHours()
  const minute = d.getMinutes()
  const isScheduledHour = [0, 6, 12, 18].includes(hour)
  const isCloseToZero = minute <= 10 || minute >= 50
  const isExplicitCycle = rawPayload?.interval === '6h_cycle' || rawPayload?.scheduleWindow || rawPayload?.trigger === 'SCHEDULED_6H'
  const isExplicitManual = rawPayload?.isManual === true || rawPayload?.trigger === 'MANUAL' || rawPayload?.trigger === 'MANUAL_OFFCYCLE'

  const isAutomated = (isExplicitCycle || (isScheduledHour && isCloseToZero)) && !isExplicitManual

  const bioState = evaluateBiologicalState({
    do: doVal,
    ammonia: ammoniaVal,
    ph: phVal,
    temp: tempVal,
    condition
  })

  return {
    id: row.id,
    timestamp: d,
    timeMs: d.getTime(),
    time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    fullTime: d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    do: Number(doVal.toFixed(2)),
    ph: Number(phVal.toFixed(2)),
    temp: Number(tempVal.toFixed(1)),
    ammonia: Number(ammoniaVal.toFixed(3)),
    flocDensity: Number(flocVal.toFixed(1)),
    orp: Math.round(orpVal),
    tds: Math.round(tdsVal),
    condition,
    isAutomated,
    intervalLabel: isAutomated ? 'Automated (6h Schedule)' : 'Manual (On-Demand)',
    modeCode: isAutomated ? 'AUTO_6H' : 'MANUAL',
    bioState,
    status: bioState.code
  }
}

async function fetchTelemetryHistory(pondId = selectedPondId.value) {
  isLoadingHistory.value = true
  try {
    // Fetch comprehensive history up to 250 records to encompass full 24h/7d cycles
    const records = await apiClient.getTelemetryHistory(pondId, 250)
    if (records && records.length > 0) {
      dbHistoryLogs.value = records.map(parseTelemetryRecord).reverse()
    } else {
      const curr = activePond.value?.telemetry || {}
      dbHistoryLogs.value = [
        parseTelemetryRecord({
          timestamp: new Date(),
          dissolved_oxygen: curr.do || 6.4,
          ph: curr.ph || 7.2,
          temperature: curr.temp || 28.5,
          ammonia: curr.ammonia || 0.02,
          floc_density: curr.flocDensity || 14,
          orp: curr.orp || 280,
          simulation_condition: 'ok'
        })
      ]
    }
  } catch (err) {
    console.warn('[WaterTelemetry] Error fetching telemetry history from DB:', err)
  } finally {
    isLoadingHistory.value = false
  }
}

// Raw historical logs ordered chronologically
const rawHistoryLogs = computed(() => {
  return dbHistoryLogs.value
})

// Periodic Telemetry Bucketing & Averaging Engine
// Combines multiple packets within the same time window and calculates mathematical means
const aggregatedHistoryLogs = computed(() => {
  const rawList = dbHistoryLogs.value
  if (!rawList || rawList.length === 0) return []

  const range = selectedRange.value
  let rangeMs = 24 * 3600 * 1000
  if (range === '7d') rangeMs = 7 * 24 * 3600 * 1000
  else if (range === '30d') rangeMs = 30 * 24 * 3600 * 1000

  // Filter within time window relative to latest reading
  const latestMs = Math.max(...rawList.map(r => r.timeMs))
  const cutoffMs = latestMs - rangeMs
  const filtered = rawList.filter(r => r.timeMs >= cutoffMs)
  const listToAggregate = filtered.length > 0 ? filtered : rawList

  const bucketsMap = new Map()

  for (const item of listToAggregate) {
    const d = item.timestamp
    let bucketKey = ''
    let bucketLabel = ''
    let bucketSubLabel = ''

    if (range === '24h') {
      // Group by Hour: YYYY-MM-DD-HH
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      const hh = String(d.getHours()).padStart(2, '0')
      bucketKey = `${yyyy}-${mm}-${dd}-${hh}:00`
      bucketLabel = `${hh}:00 WIB`
      bucketSubLabel = `${dd} ${d.toLocaleDateString('en-GB', { month: 'short' })}`
    } else if (range === '7d') {
      // Group by 6h slot: 00, 06, 12, 18
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      const slotHour = Math.floor(d.getHours() / 6) * 6
      const hh = String(slotHour).padStart(2, '0')
      bucketKey = `${yyyy}-${mm}-${dd}-${hh}:00`
      bucketLabel = `${dd} ${d.toLocaleDateString('en-GB', { month: 'short' })} ${hh}:00`
      bucketSubLabel = `Slot ${hh}:00 (6h Cycle)`
    } else {
      // 30d: Group by Day: YYYY-MM-DD
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      bucketKey = `${yyyy}-${mm}-${dd}`
      bucketLabel = `${dd} ${d.toLocaleDateString('en-GB', { month: 'short' })}`
      bucketSubLabel = `Daily Biological Mean`
    }

    if (!bucketsMap.has(bucketKey)) {
      bucketsMap.set(bucketKey, {
        key: bucketKey,
        label: bucketLabel,
        subLabel: bucketSubLabel,
        earliestMs: item.timeMs,
        latestMs: item.timeMs,
        samples: []
      })
    }
    const bucket = bucketsMap.get(bucketKey)
    bucket.samples.push(item)
    if (item.timeMs < bucket.earliestMs) bucket.earliestMs = item.timeMs
    if (item.timeMs > bucket.latestMs) bucket.latestMs = item.timeMs
  }

  // Calculate mathematical mean across all parameters for each bucket
  const result = Array.from(bucketsMap.values()).map(b => {
    const n = b.samples.length
    const sumDo = b.samples.reduce((acc, s) => acc + s.do, 0)
    const sumPh = b.samples.reduce((acc, s) => acc + s.ph, 0)
    const sumTemp = b.samples.reduce((acc, s) => acc + s.temp, 0)
    const sumTan = b.samples.reduce((acc, s) => acc + s.ammonia, 0)
    const sumFloc = b.samples.reduce((acc, s) => acc + s.flocDensity, 0)
    const sumOrp = b.samples.reduce((acc, s) => acc + s.orp, 0)
    const sumTds = b.samples.reduce((acc, s) => acc + s.tds, 0)

    const avgDo = Number((sumDo / n).toFixed(2))
    const avgPh = Number((sumPh / n).toFixed(2))
    const avgTemp = Number((sumTemp / n).toFixed(1))
    const avgTan = Number((sumTan / n).toFixed(3))
    const avgFloc = Number((sumFloc / n).toFixed(1))
    const avgOrp = Math.round(sumOrp / n)
    const avgTds = Math.round(sumTds / n)

    const autoCount = b.samples.filter(s => s.isAutomated).length
    const manualCount = b.samples.filter(s => !s.isAutomated).length

    let intervalMode = ''
    let isAutomated = false
    if (manualCount === 0) {
      intervalMode = 'Automated (6h Schedule)'
      isAutomated = true
    } else if (autoCount === 0) {
      intervalMode = n > 1 ? `Manual (${n} Samples Avg)` : 'Manual (On-Demand)'
      isAutomated = false
    } else {
      intervalMode = `Mixed (${autoCount} Auto, ${manualCount} Manual)`
      isAutomated = false
    }

    const worstCondition = b.samples.some(s => s.condition === 'critical' || s.condition === 'danger')
      ? 'critical'
      : (b.samples.some(s => s.condition === 'warning') ? 'warning' : 'ok')

    const bioState = evaluateBiologicalState({
      do: avgDo,
      ammonia: avgTan,
      ph: avgPh,
      temp: avgTemp,
      condition: worstCondition
    })

    return {
      id: b.key,
      time: b.label,
      subLabel: b.subLabel,
      date: b.subLabel,
      fullTime: `${b.label} • ${b.subLabel}`,
      timestamp: new Date(b.earliestMs),
      timeMs: b.earliestMs,
      sampleCount: n,
      do: avgDo,
      ph: avgPh,
      temp: avgTemp,
      ammonia: avgTan,
      flocDensity: avgFloc,
      orp: avgOrp,
      tds: avgTds,
      isAutomated,
      autoCount,
      manualCount,
      intervalMode,
      intervalLabel: intervalMode,
      bioState,
      status: bioState.code,
      minDo: Math.min(...b.samples.map(s => s.do)),
      maxDo: Math.max(...b.samples.map(s => s.do)),
      minAmmonia: Math.min(...b.samples.map(s => s.ammonia)),
      maxAmmonia: Math.max(...b.samples.map(s => s.ammonia)),
      samples: b.samples
    }
  })

  return result.sort((a, b) => a.timeMs - b.timeMs)
})

// Chart and telemetry analytics use the mathematically averaged series
const activeHistoryLogs = computed(() => {
  return aggregatedHistoryLogs.value
})

let unbindTelemetrySync = null

onMounted(() => {
  fetchTelemetryHistory(selectedPondId.value)

  // Reactive Auto-Refresh: Automatically reload history when backend ingests new telemetry
  unbindTelemetrySync = onTelemetryUpdated(({ pondId }) => {
    if (pondId === selectedPondId.value) {
      fetchTelemetryHistory(pondId)
    }
  })
})

onUnmounted(() => {
  if (unbindTelemetrySync) unbindTelemetrySync()
})

watch([selectedPondId, selectedRange], ([newPondId]) => {
  fetchTelemetryHistory(newPondId)
})

// Configuration for active parameter on the chart (Strictly 5 parameters)
const activeParamConfig = computed(() => {
  const param = selectedParam.value
  const logs = activeHistoryLogs.value

  if (param === 'do') {
    return {
      key: 'do',
      title: 'Dissolved Oxygen (DO)',
      unit: 'mg/L',
      color: '#0284c7',
      min: 2.0,
      max: 8.5,
      ticks: [8.5, 7.0, 5.5, 4.0, 2.5],
      zoneBands: [
        { min: 7.5, max: 8.5, label: 'Oxygen Saturated', rangeStr: '≥ 7.5 mg/L', type: 'info', fillColor: 'rgba(14, 165, 233, 0.08)', lineColor: 'rgba(14, 165, 233, 0.35)', dotColor: '#0ea5e9' },
        { min: 5.0, max: 7.5, label: 'Optimal Aeration', rangeStr: '5.0 - 7.5 mg/L', type: 'safe', fillColor: 'rgba(16, 185, 129, 0.07)', lineColor: 'rgba(16, 185, 129, 0.35)', dotColor: '#10b981' },
        { min: 3.5, max: 5.0, label: 'Warning (Low DO)', rangeStr: '3.5 - 5.0 mg/L', type: 'warning', fillColor: 'rgba(245, 158, 11, 0.08)', lineColor: 'rgba(245, 158, 11, 0.40)', dotColor: '#f59e0b' },
        { min: 2.0, max: 3.5, label: 'Danger (Hypoxia)', rangeStr: '< 3.5 mg/L', type: 'danger', fillColor: 'rgba(239, 68, 68, 0.10)', lineColor: 'rgba(239, 68, 68, 0.45)', dotColor: '#f43f5e' }
      ],
      thresholds: [
        { value: 5.0, label: 'Safe Floor: ≥ 5.0 mg/L', color: '#059669', type: 'safe' },
        { value: 3.5, label: 'Critical Hypoxia: < 3.5 mg/L', color: '#e11d48', type: 'danger' }
      ],
      formatter: v => `${Number(v).toFixed(2)} mg/L`,
      tickFormatter: v => `${Number(v).toFixed(1)}`
    }
  } else if (param === 'ph') {
    return {
      key: 'ph',
      title: 'Water pH Level',
      unit: 'pH',
      color: '#10b981',
      min: 6.0,
      max: 9.2,
      ticks: [9.0, 8.2, 7.5, 6.8, 6.0],
      zoneBands: [
        { min: 8.4, max: 9.2, label: 'Danger (Toxic Alkaline)', rangeStr: '> 8.4 pH', type: 'danger', fillColor: 'rgba(239, 68, 68, 0.10)', lineColor: 'rgba(239, 68, 68, 0.45)', dotColor: '#f43f5e' },
        { min: 8.0, max: 8.4, label: 'Warning (Alkaline Shift)', rangeStr: '8.0 - 8.4 pH', type: 'warning', fillColor: 'rgba(245, 158, 11, 0.08)', lineColor: 'rgba(245, 158, 11, 0.40)', dotColor: '#f59e0b' },
        { min: 7.2, max: 8.0, label: 'Optimal Biofloc pH', rangeStr: '7.2 - 8.0 pH', type: 'safe', fillColor: 'rgba(16, 185, 129, 0.07)', lineColor: 'rgba(16, 185, 129, 0.35)', dotColor: '#10b981' },
        { min: 6.8, max: 7.2, label: 'Warning (Buffer Decay)', rangeStr: '6.8 - 7.2 pH', type: 'warning', fillColor: 'rgba(245, 158, 11, 0.08)', lineColor: 'rgba(245, 158, 11, 0.40)', dotColor: '#f59e0b' },
        { min: 6.0, max: 6.8, label: 'Danger (Acidic Water)', rangeStr: '< 6.8 pH', type: 'danger', fillColor: 'rgba(239, 68, 68, 0.10)', lineColor: 'rgba(239, 68, 68, 0.45)', dotColor: '#f43f5e' }
      ],
      thresholds: [
        { value: 8.0, label: 'Ideal Ceiling: 8.0 pH', color: '#059669', type: 'safe' },
        { value: 7.2, label: 'Ideal Floor: 7.2 pH', color: '#059669', type: 'safe' }
      ],
      formatter: v => `${Number(v).toFixed(2)} pH`,
      tickFormatter: v => `${Number(v).toFixed(1)}`
    }
  } else if (param === 'temp') {
    return {
      key: 'temp',
      title: 'Water Temperature',
      unit: '°C',
      color: '#d97706',
      min: 22.0,
      max: 36.0,
      ticks: [36.0, 32.5, 29.0, 25.5, 22.0],
      zoneBands: [
        { min: 32.5, max: 36.0, label: 'Danger (Heat Stress)', rangeStr: '> 32.5°C', type: 'danger', fillColor: 'rgba(239, 68, 68, 0.10)', lineColor: 'rgba(239, 68, 68, 0.45)', dotColor: '#f43f5e' },
        { min: 30.5, max: 32.5, label: 'Warning (Thermal Strain)', rangeStr: '30.5 - 32.5°C', type: 'warning', fillColor: 'rgba(245, 158, 11, 0.08)', lineColor: 'rgba(245, 158, 11, 0.40)', dotColor: '#f59e0b' },
        { min: 27.0, max: 30.5, label: 'Optimal Tilapia Growth', rangeStr: '27.0 - 30.5°C', type: 'safe', fillColor: 'rgba(16, 185, 129, 0.07)', lineColor: 'rgba(16, 185, 129, 0.35)', dotColor: '#10b981' },
        { min: 25.0, max: 27.0, label: 'Warning (Slow Digestion)', rangeStr: '25.0 - 27.0°C', type: 'warning', fillColor: 'rgba(245, 158, 11, 0.08)', lineColor: 'rgba(245, 158, 11, 0.40)', dotColor: '#f59e0b' },
        { min: 22.0, max: 25.0, label: 'Danger (Hypothermia)', rangeStr: '< 25.0°C', type: 'danger', fillColor: 'rgba(239, 68, 68, 0.10)', lineColor: 'rgba(239, 68, 68, 0.45)', dotColor: '#f43f5e' }
      ],
      thresholds: [
        { value: 32.5, label: 'Danger Limit: 32.5°C', color: '#e11d48', type: 'danger' },
        { value: 30.5, label: 'Optimal High: 30.5°C', color: '#059669', type: 'safe' },
        { value: 27.0, label: 'Optimal Low: 27.0°C', color: '#059669', type: 'safe' },
        { value: 25.0, label: 'Cold Warning: 25.0°C', color: '#d97706', type: 'warning' }
      ],
      formatter: v => `${Number(v).toFixed(1)} °C`,
      tickFormatter: v => `${Number(v).toFixed(1)}°`
    }
  } else if (param === 'ammonia') {
    // Dynamic upper bound so ammonia data never flats out or gets clipped
    const rawMaxAmm = Math.max(...logs.map(l => Number(l.ammonia) || 0), 0.6)
    let ammMax = 1.000
    if (rawMaxAmm > 1.5) ammMax = 2.000
    else if (rawMaxAmm > 1.1) ammMax = 1.600
    else if (rawMaxAmm > 0.8) ammMax = 1.400
    else if (rawMaxAmm > 0.5) ammMax = 1.000
    else ammMax = 0.800

    const step = ammMax / 4
    const ticks = [ammMax, Number((step * 3).toFixed(3)), Number((step * 2).toFixed(3)), Number(step.toFixed(3)), 0.000]

    return {
      key: 'ammonia',
      title: 'Total Ammonia Nitrogen (TAN)',
      unit: 'ppm',
      color: '#e11d48',
      min: 0.000,
      max: ammMax,
      ticks,
      zoneBands: [
        { min: 0.75, max: ammMax, label: 'Danger (Acute Toxicity)', rangeStr: '> 0.75 ppm', type: 'danger', fillColor: 'rgba(239, 68, 68, 0.10)', lineColor: 'rgba(239, 68, 68, 0.45)', dotColor: '#f43f5e' },
        { min: 0.25, max: 0.75, label: 'Warning (Elevated TAN)', rangeStr: '0.25 - 0.75 ppm', type: 'warning', fillColor: 'rgba(245, 158, 11, 0.08)', lineColor: 'rgba(245, 158, 11, 0.40)', dotColor: '#f59e0b' },
        { min: 0.00, max: 0.25, label: 'Optimal / Assimilated', rangeStr: '< 0.25 ppm', type: 'safe', fillColor: 'rgba(16, 185, 129, 0.07)', lineColor: 'rgba(16, 185, 129, 0.35)', dotColor: '#10b981' }
      ],
      thresholds: [
        { value: 0.750, label: 'Danger Toxicity: ≥ 0.750 ppm', color: '#e11d48', type: 'danger' },
        { value: 0.250, label: 'Safe Assimilation Ceiling: ≤ 0.250 ppm', color: '#059669', type: 'safe' }
      ],
      formatter: v => `${Number(v).toFixed(3)} ppm`,
      tickFormatter: v => `${Number(v).toFixed(2)}`
    }
  } else {
    // Biofloc Volume (Strictly 5th parameter)
    // Scale 0 to 45 mL/L to cover full biofloc range and sludge overload
    return {
      key: 'flocDensity',
      title: 'Biofloc Volume (Imhoff)',
      unit: 'mL/L',
      color: '#8b5cf6',
      min: 0,
      max: 45,
      ticks: [45, 30, 20, 10, 5, 0],
      zoneBands: [
        { min: 30, max: 45, label: 'Danger (Sludge Overload)', rangeStr: '> 30 mL/L', type: 'danger', fillColor: 'rgba(239, 68, 68, 0.10)', lineColor: 'rgba(239, 68, 68, 0.45)', dotColor: '#f43f5e' },
        { min: 20, max: 30, label: 'Warning (Dense Floc)', rangeStr: '20 - 30 mL/L', type: 'warning', fillColor: 'rgba(245, 158, 11, 0.08)', lineColor: 'rgba(245, 158, 11, 0.40)', dotColor: '#f59e0b' },
        { min: 10, max: 20, label: 'Optimal Equilibrium', rangeStr: '10 - 20 mL/L', type: 'safe', fillColor: 'rgba(16, 185, 129, 0.07)', lineColor: 'rgba(16, 185, 129, 0.35)', dotColor: '#10b981' },
        { min: 5, max: 10, label: 'Warning (Dilute Floc)', rangeStr: '5 - 10 mL/L', type: 'warning', fillColor: 'rgba(245, 158, 11, 0.08)', lineColor: 'rgba(245, 158, 11, 0.40)', dotColor: '#f59e0b' },
        { min: 0, max: 5, label: 'Danger (Floc Collapse)', rangeStr: '< 5 mL/L', type: 'danger', fillColor: 'rgba(239, 68, 68, 0.10)', lineColor: 'rgba(239, 68, 68, 0.45)', dotColor: '#f43f5e' }
      ],
      thresholds: [
        { value: 30, label: 'Sludge Hazard: ≥ 30 mL/L', color: '#e11d48', type: 'danger' },
        { value: 20, label: 'High Alert: 20 mL/L', color: '#d97706', type: 'warning' },
        { value: 10, label: 'Optimal Floor: 10 mL/L', color: '#059669', type: 'safe' },
        { value: 5, label: 'Collapse Floor: 5 mL/L', color: '#e11d48', type: 'danger' }
      ],
      formatter: v => `${Number(v).toFixed(1)} mL/L`,
      tickFormatter: v => `${Number(v)}`
    }
  }
})

// Statistics summary for active parameter
const paramStats = computed(() => {
  const logs = activeHistoryLogs.value
  const key = activeParamConfig.value.key
  const values = logs.map(l => Number(l[key]) || 0)
  if (values.length === 0) return { current: 0, min: 0, max: 0, avg: 0, delta: 0 }

  const current = values[values.length - 1]
  const min = Math.min(...values)
  const max = Math.max(...values)
  const avg = Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(key === 'ammonia' ? 3 : 2))
  const delta = Number((max - min).toFixed(key === 'ammonia' ? 3 : 2))

  return { current, min, max, avg, delta }
})

// Time range description metadata
const rangeMeta = computed(() => {
  if (selectedRange.value === '24h') {
    return {
      title: '24-Hour Diurnal Water Quality History',
      sub: `Periodic 6-hour cycles (00:00, 06:00, 12:00, 18:00) & on-demand manual triggers averaged per time period • ${activePond.value.name}`
    }
  } else if (selectedRange.value === '7d') {
    return {
      title: '7-Day Biological Water Quality Trend',
      sub: `6-Hour cycle intervals averaged across the last 7 days • ${activePond.value.name}`
    }
  } else {
    return {
      title: '30-Day Longitudinal Water Quality Cycle',
      sub: `Daily aggregated biofloc parameter curves over 30 days • ${activePond.value.name}`
    }
  }
})

// Catmull-Rom to Cubic Bezier Smoothing Generator with Monotone Tangent Clamping
function generateSmoothSpline(points, width, height, padTop, padBottom) {
  if (!points || points.length === 0) return { smoothPath: '', areaPath: '' }
  const baselineY = height - padBottom
  const minY = padTop

  if (points.length === 1) {
    const p = points[0]
    return {
      smoothPath: `M 0,${p.y.toFixed(1)} L ${width},${p.y.toFixed(1)}`,
      areaPath: `M 0,${p.y.toFixed(1)} L ${width},${p.y.toFixed(1)} L ${width},${baselineY} L 0,${baselineY} Z`
    }
  }

  if (points.length === 2) {
    const p0 = points[0]
    const p1 = points[1]
    return {
      smoothPath: `M ${p0.x.toFixed(1)},${p0.y.toFixed(1)} L ${p1.x.toFixed(1)},${p1.y.toFixed(1)}`,
      areaPath: `M ${p0.x.toFixed(1)},${p0.y.toFixed(1)} L ${p1.x.toFixed(1)},${p1.y.toFixed(1)} L ${p1.x.toFixed(1)},${baselineY} L ${p0.x.toFixed(1)},${baselineY} Z`
    }
  }

  let path = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1]

    const tension = 0.15
    let cp1x = p1.x + (p2.x - p0.x) * tension
    let cp1y = p1.y + (p2.y - p0.y) * tension
    let cp2x = p2.x - (p3.x - p1.x) * tension
    let cp2y = p2.y - (p3.y - p1.y) * tension

    // Level slope protection: horizontal tangents for identical values
    if (Math.abs(p1.y - p2.y) < 0.1) {
      cp1y = p1.y
      cp2y = p2.y
    }

    // Monotone bounding: prevent bezier curve from spilling outside canvas bounds
    cp1y = Math.max(minY, Math.min(baselineY, cp1y))
    cp2y = Math.max(minY, Math.min(baselineY, cp2y))

    path += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`
  }

  const first = points[0]
  const last = points[points.length - 1]
  const area = `${path} L ${last.x.toFixed(1)},${baselineY} L ${first.x.toFixed(1)},${baselineY} Z`

  return { smoothPath: path, areaPath: area }
}

// Proportional SVG Coordinates, Zone Bands & Spline Path Calculation
const chartPoints = computed(() => {
  const logs = activeHistoryLogs.value
  const count = logs.length
  const width = 1000
  const height = 250
  const padTop = 24
  const padBottom = 28
  const padLeft = 14
  const padRight = 14
  const cfg = activeParamConfig.value

  const getY = (val) => {
    const clamped = Math.max(cfg.min, Math.min(cfg.max, val))
    const norm = (clamped - cfg.min) / (cfg.max - cfg.min)
    return height - padBottom - norm * (height - padTop - padBottom)
  }

  const getTopPercent = (val) => {
    const clamped = Math.max(cfg.min, Math.min(cfg.max, val))
    const norm = (clamped - cfg.min) / (cfg.max - cfg.min)
    const y = height - padBottom - norm * (height - padTop - padBottom)
    return (y / height) * 100
  }

  // Left Y-axis ticks
  const ticks = cfg.ticks.map(val => ({
    val,
    y: getY(val),
    topPercent: getTopPercent(val),
    formatted: cfg.tickFormatter(val)
  }))

  // Threshold reference boundaries
  const thresholds = cfg.thresholds.map(th => ({
    ...th,
    y: getY(th.value),
    topPercent: getTopPercent(th.value)
  }))

  // Colored shaded warning, danger, and optimal background zone bands
  const zoneBands = (cfg.zoneBands || []).map(zb => {
    const yTop = getY(Math.min(cfg.max, zb.max))
    const yBottom = getY(Math.max(cfg.min, zb.min))
    const bandHeight = Math.max(0, yBottom - yTop)
    return {
      ...zb,
      yTop,
      yBottom,
      height: bandHeight
    }
  })

  if (count === 0) {
    return { coords: [], smoothPath: '', areaPath: '', width, height, padTop, padBottom, ticks, thresholds, zoneBands }
  }

  const coords = logs.map((log, idx) => {
    const usableWidth = width - padLeft - padRight
    const x = count === 1 ? (width / 2) : (padLeft + (idx / (count - 1)) * usableWidth)
    const val = Number(log[cfg.key]) || 0
    const y = getY(val)
    return {
      x,
      y,
      xPercent: (x / width) * 100,
      val,
      time: log.time,
      date: log.date,
      subLabel: log.subLabel,
      sampleCount: log.sampleCount || 1,
      intervalMode: log.intervalMode || (log.isAutomated ? 'Automated (6h Schedule)' : 'Manual (On-Demand)'),
      bioState: log.bioState
    }
  })

  const { smoothPath, areaPath } = generateSmoothSpline(coords, width, height, padTop, padBottom)

  return { coords, smoothPath, areaPath, width, height, padTop, padBottom, ticks, thresholds, zoneBands }
})

// =========================================================
// TABLE FILTERING, PAGINATION & CELL COLOR HELPERS
// =========================================================
const tableStateFilter = ref('all') // 'all' | 'OPTIMAL' | 'WARNING' | 'CRITICAL'
const tableModeFilter = ref('all') // 'all' | 'automated' | 'manual'
const tablePage = ref(1)
const tablePageSize = ref(15) // 10 | 15 | 25 | 50 | 'all'

const resetTableFilters = () => {
  logSearchKeyword.value = ''
  tableStateFilter.value = 'all'
  tableModeFilter.value = 'all'
  tablePage.value = 1
}

// Current total active logs before filtering
const totalRecordsCount = computed(() => {
  const baseList = tableViewMode.value === 'aggregated' ? aggregatedHistoryLogs.value : rawHistoryLogs.value
  return baseList.length
})

// Counts for each biological health state chip
const stateFilterCounts = computed(() => {
  const baseList = tableViewMode.value === 'aggregated' ? aggregatedHistoryLogs.value : rawHistoryLogs.value
  let optimal = 0
  let warning = 0
  let critical = 0
  baseList.forEach(l => {
    const code = l.bioState?.code || l.status || 'OPTIMAL'
    if (code === 'CRITICAL') critical++
    else if (code === 'WARNING') warning++
    else optimal++
  })
  return { all: baseList.length, optimal, warning, critical }
})

// Filtered sampling audit table records (Search + Biological State + Cycle Mode)
const filteredTableLogs = computed(() => {
  const kw = logSearchKeyword.value.trim().toLowerCase()
  const baseList = tableViewMode.value === 'aggregated' ? aggregatedHistoryLogs.value : rawHistoryLogs.value
  const stateFilt = tableStateFilter.value
  const modeFilt = tableModeFilter.value

  return baseList.filter(l => {
    // 1. Biological State filter
    if (stateFilt !== 'all') {
      const code = l.bioState?.code || l.status || 'OPTIMAL'
      if (code !== stateFilt) return false
    }

    // 2. Transmission Mode filter
    if (modeFilt === 'automated' && !l.isAutomated) return false
    if (modeFilt === 'manual' && l.isAutomated) return false

    // 3. Search query filter
    if (!kw) return true
    return (
      (l.time && l.time.toLowerCase().includes(kw)) ||
      (l.date && l.date.toLowerCase().includes(kw)) ||
      String(l.do).includes(kw) ||
      String(l.ph).includes(kw) ||
      String(l.temp).includes(kw) ||
      String(l.ammonia).includes(kw) ||
      String(l.flocDensity).includes(kw) ||
      (l.intervalMode && l.intervalMode.toLowerCase().includes(kw)) ||
      (l.intervalLabel && l.intervalLabel.toLowerCase().includes(kw)) ||
      (l.bioState?.label && l.bioState.label.toLowerCase().includes(kw)) ||
      (l.bioState?.desc && l.bioState.desc.toLowerCase().includes(kw))
    )
  })
})

// Paginated records for table rendering
const paginatedTableLogs = computed(() => {
  const list = filteredTableLogs.value
  if (tablePageSize.value === 'all') return list
  const size = Number(tablePageSize.value) || 15
  const start = (tablePage.value - 1) * size
  return list.slice(start, start + size)
})

const totalPages = computed(() => {
  if (tablePageSize.value === 'all') return 1
  const size = Number(tablePageSize.value) || 15
  return Math.max(1, Math.ceil(filteredTableLogs.value.length / size))
})

const paginationRange = computed(() => {
  const total = filteredTableLogs.value.length
  if (total === 0) return { start: 0, end: 0 }
  if (tablePageSize.value === 'all') return { start: 1, end: total }
  const size = Number(tablePageSize.value) || 15
  const start = (tablePage.value - 1) * size + 1
  const end = Math.min(start + size - 1, total)
  return { start, end }
})

// Reset to page 1 on filter or mode change
watch([tableViewMode, tableStateFilter, tableModeFilter, logSearchKeyword, tablePageSize, selectedPondId, selectedRange], () => {
  tablePage.value = 1
})

// Specific Cell Color Formatters for High Contrast Enterprise Readability
const getTableDoClass = (v) => {
  const n = Number(v) || 0
  if (n < 3.5) return 'cell-val-critical'
  if (n < 5.0) return 'cell-val-warning'
  return 'cell-val-optimal'
}

const getTablePhClass = (v) => {
  const n = Number(v) || 7.0
  if (n < 6.8 || n > 8.4) return 'cell-val-critical'
  if (n < 7.2 || n > 8.0) return 'cell-val-warning'
  return 'cell-val-optimal'
}

const getTableTempClass = (v) => {
  const n = Number(v) || 28.0
  if (n < 25.0 || n > 32.5) return 'cell-val-critical'
  if (n < 27.0 || n > 30.5) return 'cell-val-warning'
  return 'cell-val-optimal'
}

const getTableAmmoniaClass = (v) => {
  const n = Number(v) || 0
  if (n >= 0.75) return 'cell-val-critical'
  if (n >= 0.25) return 'cell-val-warning'
  return 'cell-val-optimal'
}

const getTableFlocClass = (v) => {
  const n = Number(v) || 0
  if (n < 5.0 || n > 30.0) return 'cell-val-critical'
  if (n < 10.0 || n > 20.0) return 'cell-val-warning'
  return 'cell-val-optimal'
}

// Status helper for individual water parameter values
const getDoBadge = (val) => {
  if (val < 3.5) return { label: 'CRITICAL HYPOXIA', class: 'badge-rose', textClass: 'text-rose font-bold' }
  if (val < 5.0) return { label: 'CAUTION (LOW)', class: 'badge-amber', textClass: 'text-amber font-bold' }
  return { label: 'OPTIMAL & HEALTHY', class: 'badge-emerald', textClass: 'text-emerald font-bold' }
}

const getPhBadge = (val) => {
  if (val < 6.8 || val > 8.5) return { label: 'UNBALANCED', class: 'badge-rose' }
  if (val < 7.2 || val > 8.0) return { label: 'SLIGHT DRIFT', class: 'badge-amber' }
  return { label: 'BALANCED (NORMAL)', class: 'badge-emerald' }
}

const getAmmoniaBadge = (val) => {
  const v = Number(val) || 0
  if (v >= 0.75) return { label: 'CRITICAL TOXICITY', class: 'badge-rose', textClass: 'text-rose font-bold' }
  if (v >= 0.25) return { label: 'WARNING ELEVATED', class: 'badge-amber', textClass: 'text-amber font-bold' }
  return { label: 'SAFE & CLEAN', class: 'badge-emerald', textClass: 'text-emerald font-bold' }
}

const getTempBadge = (val) => {
  const v = Number(val) || 0
  if (v < 25.0) return { label: 'DANGER COLD', class: 'badge-rose', textClass: 'text-rose font-bold' }
  if (v < 27.0) return { label: 'WARNING LOW', class: 'badge-amber', textClass: 'text-amber font-bold' }
  if (v > 32.5) return { label: 'DANGER HEAT', class: 'badge-rose', textClass: 'text-rose font-bold' }
  if (v > 30.5) return { label: 'WARNING HIGH', class: 'badge-amber', textClass: 'text-amber font-bold' }
  return { label: 'OPTIMAL (GROWTH)', class: 'badge-emerald', textClass: 'text-emerald font-bold' }
}

const getFlocBadge = (val) => {
  const v = Number(val) || 0
  if (v < 5.0) return { label: 'DANGER COLLAPSE', class: 'badge-rose', textClass: 'text-rose font-bold' }
  if (v < 10.0) return { label: 'WARNING LOW', class: 'badge-amber', textClass: 'text-amber font-bold' }
  if (v > 30.0) return { label: 'DANGER SLUDGE', class: 'badge-rose', textClass: 'text-rose font-bold' }
  if (v > 20.0) return { label: 'WARNING DENSE', class: 'badge-amber', textClass: 'text-amber font-bold' }
  return { label: 'THRIVING FLOC', class: 'badge-emerald', textClass: 'text-emerald font-bold' }
}

// Multi-Zone Radial Gauge Thresholds for Biofloc Aquaculture (Speedometer 5-Tier)
const doGaugeZones = [
  { min: 2.0, max: 3.5, color: '#dc2626', label: 'Hypoxia Emergency (< 3.5 mg/L)', shortLabel: 'VERY POOR' },
  { min: 3.5, max: 5.0, color: '#f97316', label: 'Warning Sub-Optimal (3.5 - 5.0 mg/L)', shortLabel: 'POOR' },
  { min: 5.0, max: 6.2, color: '#eab308', label: 'Adequate Baseline (5.0 - 6.2 mg/L)', shortLabel: 'FAIR' },
  { min: 6.2, max: 7.5, color: '#84cc16', label: 'Optimal Aeration (6.2 - 7.5 mg/L)', shortLabel: 'GOOD' },
  { min: 7.5, max: 9.0, color: '#16a34a', label: 'Oxygen Saturated (≥ 7.5 mg/L)', shortLabel: 'EXCELLENT' }
]

const phGaugeZones = [
  { min: 5.5, max: 6.8, color: '#dc2626', label: 'Danger Acidic (< 6.8 pH)', shortLabel: 'ACIDIC' },
  { min: 6.8, max: 7.2, color: '#f97316', label: 'Warning Buffer Decay (6.8 - 7.2 pH)', shortLabel: 'LOW' },
  { min: 7.2, max: 7.8, color: '#16a34a', label: 'Optimal Biofloc (7.2 - 7.8 pH)', shortLabel: 'OPTIMAL' },
  { min: 7.8, max: 8.4, color: '#eab308', label: 'Warning Alkaline Shift (7.8 - 8.4 pH)', shortLabel: 'HIGH' },
  { min: 8.4, max: 9.5, color: '#dc2626', label: 'Danger Toxic NH3 (> 8.4 pH)', shortLabel: 'ALKALINE' }
]

const tempGaugeZones = [
  { min: 22.0, max: 25.0, color: '#dc2626', label: 'Danger Hypothermia (< 25°C)', shortLabel: 'COLD' },
  { min: 25.0, max: 27.0, color: '#f97316', label: 'Warning Low Digestion (25 - 27°C)', shortLabel: 'COOL' },
  { min: 27.0, max: 29.0, color: '#eab308', label: 'Moderate Growth (27 - 29°C)', shortLabel: 'FAIR' },
  { min: 29.0, max: 30.5, color: '#16a34a', label: 'Optimal Tilapia Growth (29 - 30.5°C)', shortLabel: 'OPTIMAL' },
  { min: 30.5, max: 36.0, color: '#dc2626', label: 'Danger Heat Stress (> 30.5°C)', shortLabel: 'HEAT' }
]

const ammoniaGaugeZones = [
  { min: 0.000, max: 0.150, color: '#16a34a', label: 'Safe Assimilated (< 0.15 ppm)', shortLabel: 'EXCELLENT' },
  { min: 0.150, max: 0.300, color: '#84cc16', label: 'Safe Baseline (< 0.30 ppm)', shortLabel: 'GOOD' },
  { min: 0.300, max: 0.500, color: '#eab308', label: 'Warning Elevated TAN (0.30 - 0.50 ppm)', shortLabel: 'FAIR' },
  { min: 0.500, max: 0.750, color: '#f97316', label: 'High Alert (0.50 - 0.75 ppm)', shortLabel: 'POOR' },
  { min: 0.750, max: 1.000, color: '#dc2626', label: 'Danger Ammonia Toxicity (≥ 0.75 ppm)', shortLabel: 'VERY POOR' }
]

const flocGaugeZones = [
  { min: 0.0, max: 5.0, color: '#dc2626', label: 'Danger Floc Collapse (< 5 mL/L)', shortLabel: 'COLLAPSE' },
  { min: 5.0, max: 10.0, color: '#f97316', label: 'Warning Dilute Floc (5 - 10 mL/L)', shortLabel: 'DILUTE' },
  { min: 10.0, max: 16.0, color: '#84cc16', label: 'Healthy Baseline (10 - 16 mL/L)', shortLabel: 'FAIR' },
  { min: 16.0, max: 22.0, color: '#16a34a', label: 'Optimal Biofloc Volume (16 - 22 mL/L)', shortLabel: 'OPTIMAL' },
  { min: 22.0, max: 35.0, color: '#dc2626', label: 'Danger Sludge Overload (> 22 mL/L)', shortLabel: 'SLUDGE' }
]

// Export CSV of water quality telemetry (Reflecting selected mode: Aggregated vs Raw)
const exportWaterQualityCsv = () => {
  const p = activePond.value
  const logs = filteredTableLogs.value
  const headers = ['Timestamp (WIB)', 'Date', 'Pond ID', 'Pond Name', 'DO (mg/L)', 'pH Level', 'Temperature (°C)', 'Ammonia TAN (ppm)', 'Floc Volume (mL/L)', 'Transmission Mode', 'Sample Count', 'Biological State']
  const rows = logs.map(l => [
    l.time,
    l.date || '',
    p.id,
    p.name,
    l.do,
    l.ph,
    l.temp,
    l.ammonia,
    l.flocDensity || p.telemetry.flocDensity,
    l.intervalMode || (l.isAutomated ? 'Automated (6h Schedule)' : 'Manual (On-Demand)'),
    l.sampleCount || 1,
    l.bioState?.label || l.status || 'OPTIMAL'
  ])

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `water_quality_${p.id}_${tableViewMode.value}_${selectedRange.value}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<template>
  <div class="water-quality-page">
    <!-- View Command Header & Integrated Pond Switcher -->
    <header class="wq-command-header glass-panel">
      <div class="header-main-row">
        <div class="header-title-box">
          <div class="icon-avatar">
            <Activity :size="22" class="text-sky" />
          </div>
          <div>
            <div class="title-with-pill">
              <h1 class="page-title font-display">Water Quality Monitoring</h1>
              <!-- 6-Hour Cycle & On-Demand Telemetry Indicator -->
              <span class="telemetry-bus-badge font-mono">
                <span class="pulse-dot online"></span>
                Periodic 6-Hour Cycle (00:00, 06:00, 12:00, 18:00) & On-Demand Manual
              </span>
            </div>
            <p class="page-subtitle font-mono">
              Strictly tracking 5 core biofloc parameters: DO, pH, Temperature, Ammonia (TAN), and Floc Volume
            </p>
          </div>
        </div>

        <div class="header-actions-box">
          <div class="hourly-sync-info font-mono">
            <Radio :size="12" class="text-sky" />
            <span>Cycle: <strong>6-Hour Scheduled Transmissions</strong></span>
          </div>

          <button 
            id="btn-export-wq-csv"
            class="btn-act secondary font-mono"
            @click="exportWaterQualityCsv"
            :title="`Download ${tableViewMode === 'aggregated' ? 'averaged period' : 'raw packet'} water quality logs in CSV format`"
          >
            <Download :size="13" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <!-- Integrated Compact Pond Switcher Tabs -->
      <div class="pond-tabs-bar">
        <span class="pond-tabs-label font-mono">
          <Droplets :size="13" class="text-sky" />
          <span>Target Pond:</span>
        </span>

        <div class="pond-chips-group">
          <button 
            v-for="p in ponds" 
            :key="p.id"
            :id="'tab-pond-' + p.id"
            class="pond-tab-btn font-mono"
            :class="{ active: selectedPondId === p.id }"
            @click="setPond(p.id)"
          >
            <span class="tab-pond-id">{{ p.id }}</span>
            <span class="tab-pond-name">{{ p.name.split('—')[1]?.trim() || p.name }}</span>
            <span class="tab-pond-do">DO {{ p.telemetry.do }}</span>
          </button>
        </div>
      </div>
    </header>

    <!-- SECTION 1: SPLIT ROW — HEALTH & DIAGNOSTIC (LEFT) & WATER QUALITY PARAMETERS (RIGHT) -->
    <section class="wq-vitals-split-layout">
      <!-- LEFT SIDE: Health Score & Diagnostic Assessment Card -->
      <aside class="vitals-left-column">
        <div class="section-title-row">
          <div class="title-with-icon">
            <Activity :size="16" class="text-sky" />
            <h2 class="section-title font-display">Pond Health & Diagnostic</h2>
          </div>
          <span class="section-sub font-mono">
            AI Synthesis • {{ activePond.id }}
          </span>
        </div>

        <article class="health-diagnostic-card" :class="'status-' + activePondAssessment.health.level">
          <!-- Card Header: Target Pond Identity -->
          <div class="card-head">
            <div class="pond-title-wrap">
              <span class="pond-id-chip font-mono" :class="'chip-gradient-' + activePondAssessment.health.level">{{ activePond.id }}</span>
              <div class="pond-meta-text">
                <h3 class="pond-name font-display">{{ activePond.name }}</h3>
                <span class="pond-phase font-mono">{{ activePond.phase }} • {{ activePond.species }}</span>
              </div>
            </div>

            <!-- Simple Status Badge: Health | Warning | Danger -->
            <div class="health-pill font-mono" :class="activePondAssessment.health.badgeClass">
              <span class="status-dot" :class="activePondAssessment.health.dotClass"></span>
              <span class="font-bold">{{ activePondAssessment.health.label }} • {{ activePondAssessment.health.conditionText }}</span>
            </div>
          </div>

          <!-- Card Body Split: Left (Health Score) & Right (Diagnostic) -->
          <div class="card-split-body">
            <!-- Left Side: Health Score -->
            <div class="health-col-left">
              <span class="score-label font-mono">HEALTH SCORE</span>
              <div class="health-score-hero font-display font-mono" :class="'score-gradient-' + activePondAssessment.health.level">
                <span class="score-number">{{ activePondAssessment.score }}</span>
                <span class="score-pct">%</span>
              </div>

              <!-- Large Prominent Status Banner -->
              <div class="status-banner-large" :class="'status-banner-' + activePondAssessment.health.level">
                <div class="banner-badge-row">
                  <span class="status-pulse-dot" :class="'pulse-' + activePondAssessment.health.level"></span>
                  <span class="banner-title font-display">{{ activePondAssessment.health.statusTitle }}</span>
                </div>
                <span class="banner-sub font-mono">{{ activePondAssessment.health.conditionText }}</span>
              </div>

              <!-- Visual Progress Meter Bar with Status Gradient -->
              <div class="health-bar-track">
                <div 
                  class="health-bar-fill" 
                  :class="'bar-gradient-' + activePondAssessment.health.level"
                  :style="{ width: activePondAssessment.score + '%' }"
                ></div>
              </div>

              <!-- Explanation Text clarifying the status -->
              <p class="status-explanation-text font-mono" :class="'caption-' + activePondAssessment.health.level">
                {{ activePondAssessment.health.statusExplanation }}
              </p>
            </div>

            <!-- Right Side: Diagnostic Summary -->
            <div class="content-col-right">
              <div class="detail-section">
                <div class="detail-tag font-mono">
                  <Sparkles :size="13" />
                  <span>DIAGNOSTIC SUMMARY</span>
                </div>
                <p class="detail-desc font-sans">
                  {{ activePondAssessment.synthesis }}
                </p>
              </div>
            </div>
          </div>
        </article>
      </aside>

      <!-- RIGHT SIDE: 5 Water Quality Parameter Vitals -->
      <div class="vitals-right-column">
        <div class="section-title-row">
          <div class="title-with-icon">
            <Droplet :size="16" class="text-sky" />
            <h2 class="section-title font-display">Water Vitals (Real-Time Sensor Node)</h2>
          </div>
          <span class="section-sub font-mono">
            5 Core Indicators • {{ activePond.name }}
          </span>
        </div>

        <!-- 5 Gauge Cards Grid: Symmetrical & Informative -->
        <div class="vitals-cards-grid">
          <!-- 1. Dissolved Oxygen Gauge -->
          <WaterGaugeCard
            title="Dissolved Oxygen"
            :value="activePond.telemetry.do"
            unit="mg/L"
            :decimals="2"
            :min="2.0"
            :max="9.0"
            :target-min="5.0"
            :target-max="7.8"
            target-label="Target: ≥ 5.0 mg/L"
            :zones="doGaugeZones"
            :status-badge="getDoBadge(activePond.telemetry.do)"
            icon-wrap-class="sky"
            insight-text="Aerasi mikroskopis biofloc aktif • Respirasi stabil"
          >
            <template #icon>
              <Droplet :size="15" />
            </template>
          </WaterGaugeCard>

          <!-- 2. Water pH Level Gauge -->
          <WaterGaugeCard
            title="Water pH Level"
            :value="activePond.telemetry.ph"
            unit="pH"
            :decimals="2"
            :min="5.5"
            :max="9.5"
            :target-min="7.2"
            :target-max="8.0"
            target-label="Ideal: 7.2 - 8.0 pH"
            :zones="phGaugeZones"
            :status-badge="getPhBadge(activePond.telemetry.ph)"
            icon-wrap-class="emerald"
            insight-text="Keseimbangan ion bikarbonat stabil • Toksisitas NH₃ aman"
          >
            <template #icon>
              <Compass :size="15" />
            </template>
          </WaterGaugeCard>

          <!-- 3. Water Temperature Gauge -->
          <WaterGaugeCard
            title="Water Temperature"
            :value="activePond.telemetry.temp"
            unit="°C"
            :decimals="1"
            :min="22.0"
            :max="36.0"
            :target-min="27.0"
            :target-max="30.5"
            target-label="Target: 27 - 30.5 °C"
            :zones="tempGaugeZones"
            :status-badge="getTempBadge(activePond.telemetry.temp)"
            icon-wrap-class="amber"
            insight-text="Nafsu makan & metabolisme tilapia di jendela prima"
          >
            <template #icon>
              <Thermometer :size="15" />
            </template>
          </WaterGaugeCard>

          <!-- 4. Total Ammonia Nitrogen (TAN) Gauge -->
          <WaterGaugeCard
            title="Total Ammonia (TAN)"
            :value="activePond.telemetry.ammonia"
            unit="ppm"
            :decimals="3"
            :min="0.000"
            :max="1.000"
            :target-min="0.000"
            :target-max="0.250"
            target-label="Target: < 0.250 ppm"
            :zones="ammoniaGaugeZones"
            :status-badge="getAmmoniaBadge(activePond.telemetry.ammonia)"
            icon-wrap-class="rose"
            insight-text="Asimilasi bakteri heterotrof aktif mengunci amonia"
          >
            <template #icon>
              <Biohazard :size="15" />
            </template>
          </WaterGaugeCard>

          <!-- 5. Biofloc Volume Gauge -->
          <WaterGaugeCard
            title="Biofloc Volume"
            :value="Number(activePond.telemetry.flocDensity || 14.5)"
            unit="mL/L"
            :decimals="1"
            :min="0.0"
            :max="35.0"
            :target-min="10.0"
            :target-max="20.0"
            target-label="Target: 10 - 20 mL/L"
            :zones="flocGaugeZones"
            :status-badge="getFlocBadge(activePond.telemetry.flocDensity)"
            icon-wrap-class="purple"
            insight-text="15-minute Imhoff Cone: Biofloc particles settled stably"
            :extra-stats="[
              { label: 'OD₆₀₀', value: `${activePond.telemetry.flocSensor?.od600 ?? 0.42} AU` },
              { label: 'TSS', value: `${activePond.telemetry.flocSensor?.tssMgL ?? 485} mg/L` }
            ]"
          >
            <template #icon>
              <Layers :size="16" />
            </template>
          </WaterGaugeCard>
        </div>
      </div>
    </section>

    <!-- SECTION 2: INTERACTIVE HISTORICAL WATER QUALITY ANALYTICS (SMOOTH SPLINES & AVERAGED PERIODS) -->
    <section class="wq-chart-section glass-panel">
      <!-- Chart Controls Header -->
      <div class="chart-panel-header">
        <div class="chart-header-left">
          <div class="icon-circle bg-sky-light">
            <LineChart :size="18" class="text-sky" />
          </div>
          <div>
            <h3 class="chart-panel-title font-display">{{ rangeMeta.title }}</h3>
            <span class="chart-panel-sub font-mono">{{ rangeMeta.sub }}</span>
          </div>
        </div>

        <div class="chart-controls-wrap">
          <!-- Timeframe Range Switcher -->
          <div class="time-range-group font-mono">
            <button 
              id="btn-range-24h"
              class="range-pill" 
              :class="{ active: selectedRange === '24h' }"
              @click="selectedRange = '24h'"
              title="Averaged periodic data across 24 hours"
            >
              <Clock :size="12" />
              <span>24 Hours (Averaged Periods)</span>
            </button>
            <button 
              id="btn-range-7d"
              class="range-pill" 
              :class="{ active: selectedRange === '7d' }"
              @click="selectedRange = '7d'"
              title="6-Hour interval biological cycles across 7 days"
            >
              <Calendar :size="12" />
              <span>7 Days (6h Intervals)</span>
            </button>
            <button 
              id="btn-range-30d"
              class="range-pill" 
              :class="{ active: selectedRange === '30d' }"
              @click="selectedRange = '30d'"
              title="Daily aggregated biofloc curves over 30 days"
            >
              <BarChart3 :size="12" />
              <span>30 Days (Daily Mean)</span>
            </button>
          </div>

          <!-- Parameter Switcher Pills (Strictly 5 Parameters) -->
          <div class="param-selector-group font-mono">
            <button 
              class="param-pill" 
              :class="{ active: selectedParam === 'do' }"
              @click="selectedParam = 'do'"
            >
              1. DO (Oxygen)
            </button>
            <button 
              class="param-pill" 
              :class="{ active: selectedParam === 'ph' }"
              @click="selectedParam = 'ph'"
            >
              2. pH Level
            </button>
            <button 
              class="param-pill" 
              :class="{ active: selectedParam === 'temp' }"
              @click="selectedParam = 'temp'"
            >
              3. Temperature
            </button>
            <button 
              class="param-pill" 
              :class="{ active: selectedParam === 'ammonia' }"
              @click="selectedParam = 'ammonia'"
            >
              4. Ammonia (TAN)
            </button>
            <button 
              class="param-pill" 
              :class="{ active: selectedParam === 'floc' }"
              @click="selectedParam = 'floc'"
            >
              5. Floc Volume
            </button>
          </div>
        </div>
      </div>

      <!-- Parameter Statistics Summary Row -->
      <div class="param-stats-strip font-mono">
        <div class="stat-box">
          <span class="stat-lbl">LATEST READING:</span>
          <span class="stat-val text-sky font-bold">{{ activeParamConfig.formatter(paramStats.current) }}</span>
        </div>
        <div class="stat-box">
          <span class="stat-lbl">MINIMUM IN PERIOD:</span>
          <span class="stat-val font-bold">{{ activeParamConfig.formatter(paramStats.min) }}</span>
        </div>
        <div class="stat-box">
          <span class="stat-lbl">AVERAGE MEAN:</span>
          <span class="stat-val font-bold">{{ activeParamConfig.formatter(paramStats.avg) }}</span>
        </div>
        <div class="stat-box">
          <span class="stat-lbl">MAXIMUM PEAK:</span>
          <span class="stat-val font-bold">{{ activeParamConfig.formatter(paramStats.max) }}</span>
        </div>
        <div class="stat-box">
          <span class="stat-lbl">PERIOD SWING (Δ):</span>
          <span class="stat-val text-emerald font-bold">±{{ paramStats.delta }} {{ activeParamConfig.unit }}</span>
        </div>
      </div>

      <!-- SVG Chart Canvas Area -->
      <div class="chart-canvas-container">
        <!-- Y-Axis Ticks -->
        <div class="y-axis-ticks font-mono">
          <div 
            v-for="(tick, idx) in chartPoints.ticks" 
            :key="idx" 
            class="y-tick"
            :style="{ top: tick.topPercent + '%' }"
          >
            <span>{{ tick.formatted }}</span>
          </div>
        </div>

        <!-- SVG Curve Canvas with Proportional Rendering & Shaded Risk Zones -->
        <div class="svg-stage">
          <svg 
            class="telemetry-svg" 
            :viewBox="`0 0 ${chartPoints.width} ${chartPoints.height}`" 
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient :id="'wqGrad-' + activeParamConfig.key" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" :stop-color="activeParamConfig.color" stop-opacity="0.32" />
                <stop offset="65%" :stop-color="activeParamConfig.color" stop-opacity="0.10" />
                <stop offset="100%" :stop-color="activeParamConfig.color" stop-opacity="0.0" />
              </linearGradient>
              <filter id="spline-glow" x="-10%" y="-20%" width="120%" height="140%">
                <feDropShadow dx="0" dy="3.5" stdDeviation="3.5" flood-color="rgba(0,0,0,0.18)" />
              </filter>
            </defs>

            <!-- 1. Colored Shaded Warning, Danger, and Optimal Background Zone Bands -->
            <g class="chart-zones-layer">
              <rect 
                v-for="(zb, idx) in chartPoints.zoneBands" 
                :key="'zb-rect-' + idx"
                x="0" 
                :y="zb.yTop" 
                :width="chartPoints.width" 
                :height="zb.height" 
                :fill="zb.fillColor" 
                class="zone-band-rect"
              />
              <line 
                v-for="(zb, idx) in chartPoints.zoneBands" 
                :key="'zb-line-' + idx"
                v-show="zb.yTop > chartPoints.padTop && zb.yTop < (chartPoints.height - chartPoints.padBottom)"
                x1="0" 
                :y1="zb.yTop" 
                :x2="chartPoints.width" 
                :y2="zb.yTop" 
                class="zone-boundary-line"
                :stroke="zb.lineColor"
              />
            </g>

            <!-- 2. Horizontal Background Grid Lines -->
            <line 
              v-for="(tick, idx) in chartPoints.ticks" 
              :key="'grid-' + idx"
              x1="0" 
              :y1="tick.y" 
              :x2="chartPoints.width" 
              :y2="tick.y" 
              class="grid-line" 
            />

            <!-- 3. Safe & Alert Threshold Lines across Canvas -->
            <line 
              v-for="(th, idx) in chartPoints.thresholds" 
              :key="'th-line-' + idx"
              x1="0" 
              :y1="th.y" 
              :x2="chartPoints.width" 
              :y2="th.y" 
              class="threshold-line" 
              :class="th.type" 
              :stroke="th.color" 
            />

            <!-- 4. Gradient Area Fill under Smooth Spline -->
            <path 
              v-if="chartPoints.areaPath" 
              :d="chartPoints.areaPath" 
              :fill="`url(#wqGrad-${activeParamConfig.key})`" 
            />

            <!-- 5. Smooth Cubic Bezier Spline Line (Thick & Prominent) -->
            <path 
              v-if="chartPoints.smoothPath"
              :d="chartPoints.smoothPath" 
              fill="none" 
              :stroke="activeParamConfig.color" 
              stroke-width="4.5" 
              stroke-linecap="round" 
              stroke-linejoin="round"
              filter="url(#spline-glow)"
              class="spline-path"
            />

            <!-- 6. Vertical Crosshair Guideline on Hover -->
            <line 
              v-if="hoveredPoint"
              :x1="hoveredPoint.x"
              y1="10"
              :x2="hoveredPoint.x"
              :y2="chartPoints.height - chartPoints.padBottom"
              class="crosshair-guide"
            />

            <!-- 7. Interactive Averaged Data Points -->
            <g v-for="(pt, idx) in chartPoints.coords" :key="'pt-' + idx">
              <!-- Halo when hovered -->
              <circle 
                v-if="hoveredPoint?.idx === idx"
                :cx="pt.x" 
                :cy="pt.y" 
                r="12" 
                :fill="activeParamConfig.color"
                fill-opacity="0.22"
              />
              <circle 
                :cx="pt.x" 
                :cy="pt.y" 
                :r="hoveredPoint?.idx === idx ? 7 : 5" 
                class="chart-point"
                :class="{ active: hoveredPoint?.idx === idx }"
                :fill="hoveredPoint?.idx === idx ? '#ffffff' : activeParamConfig.color"
                :stroke="hoveredPoint?.idx === idx ? activeParamConfig.color : '#ffffff'"
                stroke-width="2.5"
                @mouseenter="hoveredPoint = { ...pt, idx }"
                @mouseleave="hoveredPoint = null"
              />
            </g>
          </svg>

          <!-- HTML Threshold Labels Overlay (Crisp Typography, Pinned to Right, Un-distorted) -->
          <div class="threshold-tags-layer font-mono">
            <div 
              v-for="(th, idx) in chartPoints.thresholds" 
              :key="'th-tag-' + idx"
              class="threshold-badge-overlay"
              :class="th.type"
              :style="{ top: `${th.topPercent}%` }"
            >
              <span class="threshold-pill-dot" :style="{ backgroundColor: th.color }"></span>
              <span class="threshold-pill-text">{{ th.label }}</span>
            </div>
          </div>

          <!-- High-DPI Hover Tooltip Overlay -->
          <div 
            v-if="hoveredPoint" 
            class="hover-tooltip font-mono"
            :style="{ 
              left: `${Math.min(88, Math.max(12, hoveredPoint.xPercent))}%`, 
              top: `${Math.max(16, hoveredPoint.y - 14)}px` 
            }"
          >
            <div class="tooltip-header">
              <span class="tooltip-time">{{ hoveredPoint.time }}</span>
              <span v-if="hoveredPoint.date" class="tooltip-date">• {{ hoveredPoint.date }}</span>
              <span v-if="hoveredPoint.sampleCount > 1" class="tooltip-samples-tag">
                {{ hoveredPoint.sampleCount }} Samples Averaged
              </span>
            </div>
            <div class="tooltip-body">
              <div class="tooltip-value font-display" :style="{ color: activeParamConfig.color }">
                {{ activeParamConfig.formatter(hoveredPoint.val) }}
              </div>
              <div class="tooltip-badges">
                <span class="tooltip-interval-tag">{{ hoveredPoint.intervalMode }}</span>
                <span 
                  v-if="hoveredPoint.bioState" 
                  class="tooltip-bio-tag" 
                  :class="hoveredPoint.bioState.badgeClass"
                >
                  {{ hoveredPoint.bioState.label }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Dynamic X-Axis Labels aligned with Time Series -->
        <div class="x-axis-labels-container font-mono">
          <div 
            v-for="(pt, idx) in chartPoints.coords" 
            :key="'axis-' + idx"
            class="x-axis-tick"
            :style="{ left: `${pt.xPercent}%` }"
          >
            <span class="x-tick-label">{{ pt.time }}</span>
            <span v-if="selectedRange !== '24h' && pt.date" class="x-tick-sub">{{ pt.date }}</span>
          </div>
        </div>

        <!-- Zonal Range Legend Strip -->
        <div class="zone-legend-strip font-mono">
          <span class="legend-header">PARAMETER ZONES:</span>
          <div class="legend-items">
            <span 
              v-for="zb in activeParamConfig.zoneBands" 
              :key="zb.label" 
              class="legend-chip" 
              :class="zb.type"
            >
              <span class="chip-dot" :style="{ backgroundColor: zb.dotColor }"></span>
              <span class="chip-name">{{ zb.label }}</span>
              <span class="chip-range font-bold">({{ zb.rangeStr }})</span>
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 3: TELEMETRY SAMPLING AUDIT LOG TABLE -->
    <section class="wq-audit-table-section glass-panel">
      <!-- Top Title & Action Row -->
      <div class="table-header-row">
        <div class="t-head-left">
          <div class="icon-circle bg-emerald-light">
            <Clock :size="16" class="text-emerald" />
          </div>
          <div>
            <div class="title-with-badge">
              <h3 class="table-sec-title font-display">Telemetry Sampling Audit Log</h3>
              <span class="pond-tag font-mono">{{ activePond.name }}</span>
            </div>
            <span class="table-sec-sub font-mono">
              Archived historical sensor packets across {{ selectedRange }} • 
              {{ tableViewMode === 'aggregated' ? 'Mathematically Averaged Per Time Group' : 'Individual Transmission Packets' }}
            </span>
          </div>
        </div>

        <div class="t-head-right">
          <!-- Quick Export CSV -->
          <button 
            class="btn-table-export font-mono"
            @click="exportWaterQualityCsv"
            :title="`Export ${tableViewMode === 'aggregated' ? 'averaged' : 'raw'} audit logs to CSV`"
          >
            <Download :size="13" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <!-- Dedicated Structured Filter Toolbar -->
      <div class="table-toolbar">
        <!-- Left Filter Group: View Mode & Health Status -->
        <div class="toolbar-left-group">
          <!-- View Mode Toggle: Aggregated vs Raw -->
          <div class="toolbar-mode-tabs font-mono">
            <button 
              class="toolbar-tab-btn"
              :class="{ active: tableViewMode === 'aggregated' }"
              @click="tableViewMode = 'aggregated'"
              title="Group transmissions in the same hour/cycle and show averaged results"
            >
              <SlidersHorizontal :size="12" />
              <span>Averaged Periods</span>
              <span class="tab-count-badge">{{ aggregatedHistoryLogs.length }}</span>
            </button>
            <button 
              class="toolbar-tab-btn"
              :class="{ active: tableViewMode === 'raw' }"
              @click="tableViewMode = 'raw'"
              title="Show each individual raw packet transmitted from sensors"
            >
              <Radio :size="12" />
              <span>Raw Packets</span>
              <span class="tab-count-badge">{{ rawHistoryLogs.length }}</span>
            </button>
          </div>

          <div class="toolbar-divider"></div>

          <!-- Biological State Filter Chips -->
          <div class="state-filter-chips font-mono">
            <button 
              class="state-chip-btn"
              :class="{ active: tableStateFilter === 'all' }"
              @click="tableStateFilter = 'all'"
            >
              <span>All</span>
              <span class="chip-num">({{ stateFilterCounts.all }})</span>
            </button>
            <button 
              class="state-chip-btn optimal"
              :class="{ active: tableStateFilter === 'OPTIMAL' }"
              @click="tableStateFilter = 'OPTIMAL'"
            >
              <span class="status-dot bg-emerald"></span>
              <span>Optimal</span>
              <span class="chip-num">({{ stateFilterCounts.optimal }})</span>
            </button>
            <button 
              class="state-chip-btn warning"
              :class="{ active: tableStateFilter === 'WARNING' }"
              @click="tableStateFilter = 'WARNING'"
            >
              <span class="status-dot bg-amber"></span>
              <span>Warning</span>
              <span class="chip-num">({{ stateFilterCounts.warning }})</span>
            </button>
            <button 
              class="state-chip-btn critical"
              :class="{ active: tableStateFilter === 'CRITICAL' }"
              @click="tableStateFilter = 'CRITICAL'"
            >
              <span class="status-dot bg-rose"></span>
              <span>Critical</span>
              <span class="chip-num">({{ stateFilterCounts.critical }})</span>
            </button>
          </div>
        </div>

        <!-- Right Filter Group: Cycle Filter, Search Box & Reset -->
        <div class="toolbar-right-group">
          <!-- Cycle Filter Dropdown -->
          <div class="cycle-filter-wrap font-mono">
            <span class="filter-prefix-label"><Filter :size="11" /> Cycle:</span>
            <select v-model="tableModeFilter" class="filter-select font-mono">
              <option value="all">All Modes</option>
              <option value="automated">Automated (6h)</option>
              <option value="manual">Manual / On-Demand</option>
            </select>
          </div>

          <!-- Search Input -->
          <div class="table-search-box">
            <Search :size="13" class="search-icon" />
            <input 
              v-model="logSearchKeyword" 
              type="text" 
              placeholder="Filter time, DO, TAN..." 
              class="table-search-input font-mono"
            />
            <button 
              v-if="logSearchKeyword" 
              class="search-clear-btn"
              @click="logSearchKeyword = ''"
              title="Clear search filter"
            >
              <X :size="12" />
            </button>
          </div>

          <!-- Reset Filter Button -->
          <button 
            v-if="tableStateFilter !== 'all' || tableModeFilter !== 'all' || logSearchKeyword"
            class="btn-reset-filters font-mono"
            @click="resetTableFilters"
            title="Reset all table filters"
          >
            <RotateCcw :size="11" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <!-- Tidy & Structured Audit Table -->
      <div class="table-scroll-container">
        <table class="audit-table font-mono">
          <thead>
            <tr>
              <th class="th-time" style="width: 160px;">
                <div class="th-content">
                  <Clock :size="12" class="text-sky" />
                  <span>TIMESTAMP (WIB)</span>
                </div>
              </th>
              <th class="th-param">
                <div class="th-content">
                  <Droplet :size="12" class="text-sky" />
                  <span>DO (mg/L)</span>
                  <span class="th-target-hint">≥5.0</span>
                </div>
              </th>
              <th class="th-param">
                <div class="th-content">
                  <Compass :size="12" class="text-emerald" />
                  <span>pH LEVEL</span>
                  <span class="th-target-hint">7.2-8.0</span>
                </div>
              </th>
              <th class="th-param">
                <div class="th-content">
                  <Thermometer :size="12" class="text-amber" />
                  <span>TEMP (°C)</span>
                  <span class="th-target-hint">27-30.5°</span>
                </div>
              </th>
              <th class="th-param">
                <div class="th-content">
                  <Biohazard :size="12" class="text-rose" />
                  <span>TAN (ppm)</span>
                  <span class="th-target-hint">&lt;0.25</span>
                </div>
              </th>
              <th class="th-param">
                <div class="th-content">
                  <Layers :size="12" class="text-purple" />
                  <span>FLOC (mL/L)</span>
                  <span class="th-target-hint">10-20</span>
                </div>
              </th>
              <th class="th-mode" style="width: 210px;">
                <div class="th-content">
                  <Radio :size="12" class="text-slate" />
                  <span>TRANSMISSION CYCLE</span>
                </div>
              </th>
              <th class="th-status" style="width: 190px; text-align: center;">
                <div class="th-content center">
                  <Activity :size="12" class="text-emerald" />
                  <span>BIOLOGICAL STATE</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="(row, idx) in paginatedTableLogs" 
              :key="idx"
              class="audit-row"
            >
              <!-- Timestamp Cell -->
              <td class="cell-time">
                <div class="time-cell-box">
                  <span class="time-main-bold">{{ row.time }}</span>
                  <span v-if="row.date" class="time-sub-date">{{ row.date }}</span>
                </div>
              </td>

              <!-- DO Cell -->
              <td class="cell-param">
                <div class="param-val-box" :class="getTableDoClass(row.do)">
                  <span class="param-number">{{ Number(row.do).toFixed(2) }}</span>
                  <span class="param-unit">mg/L</span>
                </div>
              </td>

              <!-- pH Cell -->
              <td class="cell-param">
                <div class="param-val-box" :class="getTablePhClass(row.ph)">
                  <span class="param-number">{{ Number(row.ph).toFixed(2) }}</span>
                  <span class="param-unit">pH</span>
                </div>
              </td>

              <!-- Temp Cell -->
              <td class="cell-param">
                <div class="param-val-box" :class="getTableTempClass(row.temp)">
                  <span class="param-number">{{ Number(row.temp).toFixed(1) }}</span>
                  <span class="param-unit">°C</span>
                </div>
              </td>

              <!-- Ammonia TAN Cell -->
              <td class="cell-param">
                <div class="param-val-box" :class="getTableAmmoniaClass(row.ammonia)">
                  <span class="param-number">{{ Number(row.ammonia).toFixed(3) }}</span>
                  <span class="param-unit">ppm</span>
                </div>
              </td>

              <!-- Floc Density Cell -->
              <td class="cell-param">
                <div class="param-val-box" :class="getTableFlocClass(row.flocDensity || activePond.telemetry.flocDensity)">
                  <span class="param-number">{{ Number(row.flocDensity || activePond.telemetry.flocDensity).toFixed(1) }}</span>
                  <span class="param-unit">mL/L</span>
                </div>
              </td>

              <!-- Transmission Cycle Cell -->
              <td class="cell-mode">
                <div class="mode-badge-wrap">
                  <span 
                    class="cycle-badge" 
                    :class="row.isAutomated ? 'badge-auto' : 'badge-manual'"
                  >
                    <component :is="row.isAutomated ? Radio : Zap" :size="11" />
                    <span>{{ row.intervalLabel || row.intervalMode }}</span>
                  </span>
                  <span v-if="row.sampleCount && row.sampleCount > 1" class="sample-count-chip">
                    {{ row.sampleCount }} samples
                  </span>
                </div>
              </td>

              <!-- Biological State Cell -->
              <td class="cell-status" style="text-align: center;">
                <span 
                  class="bio-status-badge font-mono" 
                  :class="row.bioState?.badgeClass || 'status-optimal'"
                  :title="row.bioState?.desc || 'Normal biofloc parameters'"
                >
                  <component 
                    :is="row.bioState?.code === 'CRITICAL' ? AlertOctagon : (row.bioState?.code === 'WARNING' ? AlertTriangle : CheckCircle2)" 
                    :size="12" 
                  />
                  <span>{{ row.bioState?.label || 'OPTIMAL & HEALTHY' }}</span>
                </span>
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-if="filteredTableLogs.length === 0">
              <td colspan="8" class="empty-table-cell">
                <div class="empty-state-card">
                  <AlertTriangle :size="24" class="text-amber" />
                  <div class="empty-state-title">No Matching Sampling Records Found</div>
                  <div class="empty-state-sub">
                    No logs match your current filter criteria: 
                    <span v-if="logSearchKeyword">"{{ logSearchKeyword }}"</span>
                    <span v-if="tableStateFilter !== 'all'"> • Status: {{ tableStateFilter }}</span>
                    <span v-if="tableModeFilter !== 'all'"> • Cycle: {{ tableModeFilter }}</span>
                  </div>
                  <button class="btn-clear-empty-filter font-mono" @click="resetTableFilters">
                    <RotateCcw :size="12" />
                    <span>Clear All Filters</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination & Summary Footer -->
      <div class="table-pagination-footer font-mono">
        <div class="pagination-info">
          <span>
            Showing <strong>{{ paginationRange.start }}</strong> - <strong>{{ paginationRange.end }}</strong> of 
            <strong>{{ filteredTableLogs.length }}</strong> records
          </span>
          <span v-if="filteredTableLogs.length !== totalRecordsCount" class="filtered-total-pill">
            (filtered from {{ totalRecordsCount }} total)
          </span>
        </div>

        <div class="pagination-actions">
          <!-- Page Size Selector -->
          <div class="page-size-wrap">
            <span class="page-size-lbl">Rows:</span>
            <select v-model="tablePageSize" class="page-size-select font-mono">
              <option :value="10">10</option>
              <option :value="15">15</option>
              <option :value="25">25</option>
              <option :value="50">50</option>
              <option value="all">All</option>
            </select>
          </div>

          <!-- Page Navigation Buttons -->
          <div v-if="totalPages > 1" class="page-nav-group">
            <button 
              class="page-btn" 
              :disabled="tablePage <= 1"
              @click="tablePage = 1"
              title="First Page"
            >
              <ChevronsLeft :size="13" />
            </button>
            <button 
              class="page-btn" 
              :disabled="tablePage <= 1"
              @click="tablePage--"
              title="Previous Page"
            >
              <ChevronLeft :size="13" />
            </button>
            <span class="page-indicator">
              Page <strong>{{ tablePage }}</strong> of <strong>{{ totalPages }}</strong>
            </span>
            <button 
              class="page-btn" 
              :disabled="tablePage >= totalPages"
              @click="tablePage++"
              title="Next Page"
            >
              <ChevronRight :size="13" />
            </button>
            <button 
              class="page-btn" 
              :disabled="tablePage >= totalPages"
              @click="tablePage = totalPages"
              title="Last Page"
            >
              <ChevronsRight :size="13" />
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.water-quality-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* =========================================================
   COMMAND HEADER & POND SWITCHER
========================================================= */
.wq-command-header {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: var(--shadow-xs);
}

.header-main-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.header-title-box {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-avatar {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: var(--sky-50);
  border: 1px solid var(--sky-100);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.title-with-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.page-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.2;
}

.telemetry-bus-badge {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--emerald-700);
  background: var(--emerald-50);
  border: 1px solid var(--emerald-200);
  padding: 2px 8px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.page-subtitle {
  font-size: 0.72rem;
  color: var(--text-muted);
  margin: 2px 0 0 0;
}

.header-actions-box {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.hourly-sync-info {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
  color: var(--text-secondary);
  background: var(--bg-surface-subtle);
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid var(--border-subtle);
}

.btn-act {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 7px;
  font-size: 0.74rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.btn-act.secondary {
  background: var(--bg-surface);
  color: var(--text-secondary);
  border: 1px solid var(--border-medium);
}

.btn-act.secondary:hover {
  background: var(--bg-surface-subtle);
  color: var(--text-primary);
  border-color: var(--sky-300);
}

/* Pond Tabs Bar */
.pond-tabs-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--border-subtle);
  flex-wrap: wrap;
}

.pond-tabs-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.pond-chips-group {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.pond-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 7px;
  background: var(--bg-surface-subtle);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: 0.74rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.pond-tab-btn:hover {
  background: var(--bg-surface-hover);
  color: var(--text-primary);
}

.pond-tab-btn.active {
  background: var(--sky-50);
  border-color: var(--sky-500);
  color: var(--sky-700);
  font-weight: 700;
  box-shadow: 0 1px 4px rgba(14, 165, 233, 0.15);
}

.tab-pond-id {
  font-weight: 800;
  background: rgba(0, 0, 0, 0.05);
  padding: 1px 5px;
  border-radius: 4px;
}

.pond-tab-btn.active .tab-pond-id {
  background: var(--sky-600);
  color: #ffffff;
}

.tab-pond-do {
  font-size: 0.65rem;
  color: var(--emerald-600);
  font-weight: 700;
}

/* =========================================================
   SECTION 1: VITALS SPLIT LAYOUT (LEFT: HEALTH & DIAGNOSTIC, RIGHT: PARAMS)
========================================================= */
.wq-vitals-split-layout {
  display: grid;
  grid-template-columns: 0.9fr 1.35fr;
  gap: 16px;
  align-items: stretch;
}

.vitals-left-column {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.vitals-right-column {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-title-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
}

.title-with-icon {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title {
  font-size: 0.98rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.section-sub {
  font-size: 0.65rem;
  color: var(--text-muted);
}

/* 5 Gauge Cards Responsive Grid: 6-column modular system (3 on top row, 2 on bottom row) */
.vitals-cards-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}

/* Row 1: 3 cards taking 2 columns each (33.3% each) */
.vitals-cards-grid > :nth-child(1),
.vitals-cards-grid > :nth-child(2),
.vitals-cards-grid > :nth-child(3) {
  grid-column: span 2;
}

/* Row 2: 2 cards taking 3 columns each (50% each) */
.vitals-cards-grid > :nth-child(4),
.vitals-cards-grid > :nth-child(5) {
  grid-column: span 3;
}

.floc-dual-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.vital-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: var(--shadow-xs);
  transition: all 0.15s ease;
}

.vital-card:hover {
  border-color: var(--border-medium);
  box-shadow: var(--shadow-sm);
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Left Column: Health & Diagnostic Assessment Card with Status Gradients */
.health-diagnostic-card {
  border-radius: 12px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Dynamic Status Color Gradients */
.health-diagnostic-card.status-health {
  background: linear-gradient(145deg, #ffffff 0%, #f4fbf7 40%, #ecfdf5 100%);
  border: 1px solid #a7f3d0;
  box-shadow: 0 4px 20px -2px rgba(16, 185, 129, 0.12), 0 2px 6px -1px rgba(16, 185, 129, 0.05);
}

.health-diagnostic-card.status-warning {
  background: linear-gradient(145deg, #ffffff 0%, #fdfbf4 40%, #fef3c7 100%);
  border: 1px solid #fde68a;
  box-shadow: 0 4px 20px -2px rgba(245, 158, 11, 0.14), 0 2px 6px -1px rgba(245, 158, 11, 0.06);
}

.health-diagnostic-card.status-danger {
  background: linear-gradient(145deg, #ffffff 0%, #fef5f5 40%, #fee2e2 100%);
  border: 1px solid #fca5a5;
  box-shadow: 0 4px 20px -2px rgba(239, 68, 68, 0.16), 0 2px 6px -1px rgba(239, 68, 68, 0.08);
}

.health-diagnostic-card .card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-subtle);
}

.health-diagnostic-card.status-health .card-head {
  border-bottom-color: rgba(16, 185, 129, 0.18);
}

.health-diagnostic-card.status-warning .card-head {
  border-bottom-color: rgba(245, 158, 11, 0.2);
}

.health-diagnostic-card.status-danger .card-head {
  border-bottom-color: rgba(239, 68, 68, 0.22);
}

.pond-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pond-id-chip {
  font-size: 0.74rem;
  font-weight: 800;
  padding: 3px 9px;
  border-radius: 6px;
  letter-spacing: 0.02em;
  color: #ffffff;
  transition: all 0.2s ease;
}

.pond-id-chip.chip-gradient-health {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.25);
}

.pond-id-chip.chip-gradient-warning {
  background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
  box-shadow: 0 2px 6px rgba(245, 158, 11, 0.25);
}

.pond-id-chip.chip-gradient-danger {
  background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.25);
}

.pond-meta-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.pond-name {
  font-size: 0.98rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.2;
}

.pond-phase {
  font-size: 0.66rem;
  color: var(--text-muted);
}

/* Card Body Split: Left (Score) vs Right (Diagnostics) */
.health-diagnostic-card .card-split-body {
  display: flex;
  gap: 16px;
  align-items: center;
  flex: 1;
}

.health-col-left {
  flex: 0 0 185px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding-right: 16px;
  border-right: 1px solid var(--border-subtle);
  gap: 7px;
}

.health-diagnostic-card.status-health .health-col-left {
  border-right-color: rgba(16, 185, 129, 0.18);
}

.health-diagnostic-card.status-warning .health-col-left {
  border-right-color: rgba(245, 158, 11, 0.2);
}

.health-diagnostic-card.status-danger .health-col-left {
  border-right-color: rgba(239, 68, 68, 0.22);
}

.score-label {
  font-size: 0.62rem;
  font-weight: 800;
  color: var(--text-muted);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.health-score-hero {
  display: flex;
  align-items: baseline;
  justify-content: center;
  line-height: 0.9;
  font-weight: 900;
  transition: all 0.25s ease;
}

.health-score-hero.score-gradient-health {
  background: linear-gradient(135deg, #047857 0%, #059669 45%, #10b981 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.health-score-hero.score-gradient-warning {
  background: linear-gradient(135deg, #b45309 0%, #d97706 45%, #f59e0b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.health-score-hero.score-gradient-danger {
  background: linear-gradient(135deg, #991b1b 0%, #dc2626 45%, #ef4444 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.score-number {
  font-size: 2.85rem;
  font-weight: 900;
  letter-spacing: -0.04em;
}

.score-pct {
  font-size: 1.15rem;
  font-weight: 800;
  margin-left: 2px;
  opacity: 0.85;
}

/* Large Prominent Status Banner */
.status-banner-large {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 6px 8px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
  transition: all 0.25s ease;
}

.status-banner-large.status-banner-health {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border: 1px solid #6ee7b7;
  color: #065f46;
}

.status-banner-large.status-banner-warning {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border: 1px solid #fcd34d;
  color: #92400e;
}

.status-banner-large.status-banner-danger {
  background: linear-gradient(135deg, #fff1f2 0%, #fee2e2 100%);
  border: 1px solid #fca5a5;
  color: #991b1b;
}

.banner-badge-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.status-pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-pulse-dot.pulse-health {
  background-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.25);
}

.status-pulse-dot.pulse-warning {
  background-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.25);
}

.status-pulse-dot.pulse-danger {
  background-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.25);
}

.banner-title {
  font-size: 0.95rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  line-height: 1.1;
}

.banner-sub {
  font-size: 0.67rem;
  font-weight: 700;
  opacity: 0.9;
  letter-spacing: 0.02em;
}

.status-explanation-text {
  font-size: 0.65rem;
  font-weight: 600;
  text-align: center;
  line-height: 1.35;
  margin: 2px 0 0 0;
}

.status-explanation-text.caption-health {
  color: #047857;
}

.status-explanation-text.caption-warning {
  color: #92400e;
}

.status-explanation-text.caption-danger {
  color: #b91c1c;
}

.health-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.66rem;
  font-weight: 800;
  white-space: nowrap;
}

.health-badge-green {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  color: #065f46;
  border: 1px solid #6ee7b7;
}

.health-badge-orange {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  color: #92400e;
  border: 1px solid #fcd34d;
}

.health-badge-red {
  background: linear-gradient(135deg, #fff1f2 0%, #fee2e2 100%);
  color: #991b1b;
  border: 1px solid #fca5a5;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot.dot-green { background-color: #10b981; }
.status-dot.dot-orange { background-color: #f59e0b; }
.status-dot.dot-red { background-color: #ef4444; }

.health-bar-track {
  width: 100%;
  height: 5px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 999px;
  overflow: hidden;
  margin-top: 3px;
}

.health-bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.35s ease, background 0.35s ease;
}

.health-bar-fill.bar-gradient-health {
  background: linear-gradient(90deg, #059669 0%, #10b981 60%, #34d399 100%);
}

.health-bar-fill.bar-gradient-warning {
  background: linear-gradient(90deg, #d97706 0%, #f59e0b 60%, #fbbf24 100%);
}

.health-bar-fill.bar-gradient-danger {
  background: linear-gradient(90deg, #dc2626 0%, #ef4444 60%, #f87171 100%);
}

.content-col-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 10px;
  transition: all 0.25s ease;
}

.health-diagnostic-card.status-health .detail-section {
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(16, 185, 129, 0.18);
}

.health-diagnostic-card.status-warning .detail-section {
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid rgba(245, 158, 11, 0.22);
}

.health-diagnostic-card.status-danger .detail-section {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(239, 68, 68, 0.24);
}

.detail-tag {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.63rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.health-diagnostic-card.status-health .detail-tag {
  color: #059669;
}

.health-diagnostic-card.status-warning .detail-tag {
  color: #d97706;
}

.health-diagnostic-card.status-danger .detail-tag {
  color: #dc2626;
}

.detail-desc {
  font-size: 0.78rem;
  color: #334155;
  line-height: 1.5;
  margin: 0;
}

.icon-wrap {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-wrap.sky { background: var(--sky-50); color: var(--sky-600); }
.icon-wrap.emerald { background: var(--emerald-50); color: var(--emerald-600); }
.icon-wrap.amber { background: var(--amber-50); color: var(--amber-600); }
.icon-wrap.rose { background: #fff1f2; color: #e11d48; }
.icon-wrap.purple { background: #faf5ff; color: #9333ea; }

.badge {
  font-size: 0.62rem;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 999px;
  letter-spacing: 0.02em;
}

.badge-emerald { background: var(--emerald-50); color: var(--emerald-700); border: 1px solid var(--emerald-200); }
.badge-amber { background: var(--amber-50); color: var(--amber-700); border: 1px solid var(--amber-200); }
.badge-rose { background: #fff1f2; color: #be123c; border: 1px solid #fecdd3; }

.card-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-label {
  font-size: 0.66rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.metric-value-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin: 1px 0;
}

.metric-number {
  font-size: 1.65rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1;
}

.metric-unit {
  font-size: 0.76rem;
  font-weight: 600;
  color: var(--text-muted);
}

.gauge-scale-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.6rem;
  color: var(--text-muted);
  margin-top: 4px;
}

.scale-tag.target { font-weight: 700; color: var(--emerald-600); }
.scale-tag.alert { font-weight: 700; color: var(--amber-600); }
.scale-tag.danger { font-weight: 700; color: var(--rose-600); }

.gauge-bar-wrapper {
  position: relative;
  width: 100%;
  height: 6px;
  background: #f1f5f9;
  border-radius: 999px;
  overflow: hidden;
  margin: 2px 0 6px 0;
}

.gauge-fill {
  height: 100%;
  border-radius: 999px;
}

.gauge-fill.do { background: linear-gradient(90deg, #38bdf8, #0284c7); }
.gauge-fill.ph { background: linear-gradient(90deg, #34d399, #059669); }
.gauge-fill.temp { background: linear-gradient(90deg, #fbbf24, #d97706); }
.gauge-fill.ammonia { background: linear-gradient(90deg, #10b981, #f43f5e); }
.gauge-fill.floc { background: linear-gradient(90deg, #a78bfa, #7c3aed); }

.gauge-target-marker {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #047857;
}

.gauge-target-marker.danger {
  background: #be123c;
}

.sensor-hardware-strip {
  display: flex;
  justify-content: space-between;
  font-size: 0.62rem;
  color: var(--text-secondary);
  background: var(--bg-surface-subtle);
  padding: 4px 6px;
  border-radius: 5px;
  margin-bottom: 2px;
}

.card-footer-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.62rem;
  color: var(--text-muted);
  border-top: 1px solid var(--border-subtle);
  padding-top: 6px;
}

/* =========================================================
   SECTION 2: HISTORICAL CHARTS & ANALYTICS
========================================================= */
.wq-chart-section {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: var(--shadow-xs);
}

.chart-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.chart-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-circle {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-circle.bg-sky-light { background: var(--sky-50); border: 1px solid var(--sky-100); }
.icon-circle.bg-emerald-light { background: var(--emerald-50); border: 1px solid var(--emerald-100); }

.chart-panel-title {
  font-size: 0.96rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.chart-panel-sub {
  font-size: 0.68rem;
  color: var(--text-muted);
}

.chart-controls-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.time-range-group {
  display: flex;
  align-items: center;
  background: var(--bg-surface-subtle);
  padding: 2px;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
  gap: 2px;
}

.range-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.68rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.12s ease;
}

.range-pill.active {
  background: #ffffff;
  color: var(--text-primary);
  font-weight: 700;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.param-selector-group {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.param-pill {
  padding: 4px 9px;
  border-radius: 6px;
  background: var(--bg-surface-subtle);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: 0.68rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.12s ease;
}

.param-pill:hover {
  background: var(--bg-surface-hover);
  color: var(--text-primary);
}

.param-pill.active {
  background: var(--text-primary);
  color: #ffffff;
  border-color: var(--text-primary);
  font-weight: 700;
}

/* Param Stats Strip */
.param-stats-strip {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  background: var(--bg-surface-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 8px 12px;
}

.stat-box {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.stat-lbl {
  font-size: 0.58rem;
  color: var(--text-muted);
  letter-spacing: 0.04em;
}

.stat-val {
  font-size: 0.82rem;
  color: var(--text-primary);
}

/* Chart Canvas */
.chart-canvas-container {
  position: relative;
  width: 100%;
  margin-top: 6px;
}

.y-axis-ticks {
  position: absolute;
  left: 0;
  top: 0;
  height: 250px;
  width: 52px;
  pointer-events: none;
}

.y-tick {
  position: absolute;
  right: 8px;
  transform: translateY(-50%);
  font-size: 0.65rem;
  color: var(--text-muted);
  font-weight: 600;
}

.svg-stage {
  position: relative;
  margin-left: 56px;
  height: 250px;
}

.telemetry-svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.grid-line {
  stroke: #e2e8f0;
  stroke-dasharray: 4 4;
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.threshold-line {
  stroke-dasharray: 5 4;
  stroke-width: 1.2;
  vector-effect: non-scaling-stroke;
  opacity: 0.85;
}

.spline-path {
  vector-effect: non-scaling-stroke;
  stroke-width: 4.5px !important;
}

.zone-band-rect {
  transition: fill 0.2s ease;
}

.zone-boundary-line {
  stroke-dasharray: 4 4;
  stroke-width: 1.2;
  vector-effect: non-scaling-stroke;
  opacity: 0.8;
}

.crosshair-guide {
  stroke: rgba(100, 116, 139, 0.45);
  stroke-dasharray: 3 3;
  stroke-width: 1.2;
  vector-effect: non-scaling-stroke;
}

.chart-point {
  cursor: pointer;
  transition: r 0.15s ease, stroke-width 0.15s ease;
  vector-effect: non-scaling-stroke;
}

.chart-point:hover,
.chart-point.active {
  r: 7.5;
}

/* Zone Legend Strip */
.zone-legend-strip {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
  padding: 8px 14px;
  background: rgba(248, 250, 252, 0.85);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  font-size: 0.68rem;
}

.legend-header {
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.04em;
  font-size: 0.65rem;
}

.legend-items {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.legend-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border-radius: 5px;
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  color: var(--text-main);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  font-size: 0.65rem;
}

.legend-chip.danger {
  border-color: rgba(239, 68, 68, 0.3);
  background: rgba(254, 242, 242, 0.7);
  color: #991b1b;
}

.legend-chip.warning {
  border-color: rgba(245, 158, 11, 0.3);
  background: rgba(254, 252, 232, 0.7);
  color: #92400e;
}

.legend-chip.safe {
  border-color: rgba(16, 185, 129, 0.3);
  background: rgba(240, 253, 244, 0.7);
  color: #065f46;
}

.legend-chip.info {
  border-color: rgba(14, 165, 233, 0.3);
  background: rgba(240, 249, 255, 0.7);
  color: #0369a1;
}

.chip-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.chip-name {
  font-weight: 600;
}

.chip-range {
  font-size: 0.62rem;
  opacity: 0.85;
}

/* HTML Threshold Overlays (Pinned to Right, Un-distorted) */
.threshold-tags-layer {
  position: absolute;
  top: 0;
  right: 10px;
  bottom: 26px;
  left: 0;
  pointer-events: none;
}

.threshold-badge-overlay {
  position: absolute;
  right: 0;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(4px);
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  padding: 2px 7px;
  font-size: 0.60rem;
  font-weight: 700;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.threshold-badge-overlay.safe {
  border-color: rgba(5, 150, 105, 0.3);
  color: #047857;
}

.threshold-badge-overlay.warning {
  border-color: rgba(245, 158, 11, 0.4);
  color: #b45309;
}

.threshold-badge-overlay.danger {
  border-color: rgba(225, 29, 72, 0.3);
  color: #be123c;
}

.threshold-badge-overlay.info {
  border-color: rgba(14, 165, 233, 0.3);
  color: #0369a1;
}

.threshold-pill-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.threshold-pill-text {
  letter-spacing: 0.02em;
}

/* High-DPI Hover Tooltip */
.hover-tooltip {
  position: absolute;
  transform: translate(-50%, -100%);
  background: #0f172a;
  color: #ffffff;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.68rem;
  pointer-events: none;
  white-space: nowrap;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.tooltip-header {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.62rem;
  color: #94a3b8;
}

.tooltip-samples-tag {
  background: rgba(56, 189, 248, 0.2);
  color: #38bdf8;
  padding: 1px 5px;
  border-radius: 4px;
  font-weight: 700;
}

.tooltip-value {
  font-size: 1.15rem;
  font-weight: 800;
  line-height: 1.1;
}

.tooltip-badges {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}

.tooltip-interval-tag {
  font-size: 0.58rem;
  color: #cbd5e1;
  background: rgba(255, 255, 255, 0.1);
  padding: 1px 5px;
  border-radius: 3px;
}

.tooltip-bio-tag {
  font-size: 0.58rem;
  font-weight: 800;
  padding: 1px 5px;
  border-radius: 3px;
}

.tooltip-bio-tag.status-critical {
  background: rgba(225, 29, 72, 0.25);
  color: #fda4af;
}

.tooltip-bio-tag.status-warning {
  background: rgba(245, 158, 11, 0.25);
  color: #fde68a;
}

.tooltip-bio-tag.status-optimal {
  background: rgba(16, 185, 129, 0.25);
  color: #6ee7b7;
}

/* Dynamic X-Axis Labels */
.x-axis-labels-container {
  position: relative;
  margin-left: 56px;
  height: 28px;
  border-top: 1px solid var(--border-subtle);
  margin-top: 8px;
  margin-bottom: 6px;
}

.x-axis-tick {
  position: absolute;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  top: 4px;
  font-size: 0.63rem;
  color: var(--text-muted);
  white-space: nowrap;
}

.x-tick-label {
  font-weight: 600;
  color: var(--text-secondary);
}

.x-tick-sub {
  font-size: 0.55rem;
  color: var(--text-muted);
}

/* =========================================================
   SECTION 3: TELEMETRY SAMPLING AUDIT TABLE
========================================================= */
.wq-audit-table-section {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s ease;
}

/* Header Title & Actions */
.table-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding-bottom: 2px;
}

.t-head-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-with-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.table-sec-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.01em;
}

.pond-tag {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--sky-700);
  background: var(--sky-50);
  border: 1px solid var(--sky-200);
  padding: 2px 8px;
  border-radius: 6px;
  letter-spacing: 0.03em;
}

.table-sec-sub {
  font-size: 0.68rem;
  color: var(--text-muted);
  display: block;
  margin-top: 2px;
}

.t-head-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-table-export {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--text-secondary);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  cursor: pointer;
  box-shadow: var(--shadow-xs);
  transition: all 0.15s ease;
}

.btn-table-export:hover {
  background: var(--bg-surface-subtle);
  color: var(--sky-600);
  border-color: var(--sky-300);
}

/* Dedicated Structured Filter Toolbar */
.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  background: #f8fafc;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 8px 12px;
  flex-wrap: wrap;
}

.toolbar-left-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.toolbar-right-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.toolbar-divider {
  width: 1px;
  height: 22px;
  background: var(--border-subtle);
}

/* View Mode Tabs */
.toolbar-mode-tabs {
  display: inline-flex;
  align-items: center;
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 3px;
  gap: 3px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.toolbar-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.68rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.toolbar-tab-btn:hover {
  color: var(--text-primary);
}

.toolbar-tab-btn.active {
  background: var(--sky-50);
  color: var(--sky-700);
  font-weight: 700;
  box-shadow: 0 1px 2px rgba(2, 132, 199, 0.12);
}

.tab-count-badge {
  font-size: 0.62rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.05);
  color: inherit;
}

.toolbar-tab-btn.active .tab-count-badge {
  background: var(--sky-200);
  color: var(--sky-800);
}

/* Biological State Filter Chips */
.state-filter-chips {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.state-chip-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
  background: #ffffff;
  color: var(--text-secondary);
  font-size: 0.68rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.state-chip-btn:hover {
  background: var(--bg-surface-subtle);
  border-color: var(--border-medium);
  color: var(--text-primary);
}

.state-chip-btn.active {
  background: var(--text-primary);
  color: #ffffff;
  border-color: var(--text-primary);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.18);
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
}

.status-dot.bg-emerald {
  background: var(--emerald-500);
}

.status-dot.bg-amber {
  background: var(--amber-500);
}

.status-dot.bg-rose {
  background: var(--rose-500);
}

.chip-num {
  font-size: 0.62rem;
  opacity: 0.75;
}

.state-chip-btn.optimal.active {
  background: var(--emerald-600);
  border-color: var(--emerald-600);
  color: #ffffff;
}

.state-chip-btn.optimal.active .status-dot {
  background: #ffffff;
}

.state-chip-btn.warning.active {
  background: var(--amber-600);
  border-color: var(--amber-600);
  color: #ffffff;
}

.state-chip-btn.warning.active .status-dot {
  background: #ffffff;
}

.state-chip-btn.critical.active {
  background: var(--rose-600);
  border-color: var(--rose-600);
  color: #ffffff;
}

.state-chip-btn.critical.active .status-dot {
  background: #ffffff;
}

/* Cycle Filter Select */
.cycle-filter-wrap {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 3px 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.filter-prefix-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.66rem;
  font-weight: 700;
  color: var(--text-muted);
}

.filter-select {
  border: none;
  background: transparent;
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--text-primary);
  outline: none;
  cursor: pointer;
  padding: 2px 4px;
}

/* Table Search Box */
.table-search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.table-search-box .search-icon {
  position: absolute;
  left: 9px;
  color: var(--text-muted);
  pointer-events: none;
}

.table-search-input {
  padding: 5px 28px 5px 28px;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
  background: #ffffff;
  font-size: 0.70rem;
  color: var(--text-primary);
  outline: none;
  width: 190px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  transition: all 0.15s ease;
}

.table-search-input:focus {
  border-color: var(--sky-500);
  box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.15);
  width: 210px;
}

.search-clear-btn {
  position: absolute;
  right: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--text-subtle);
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
}

.search-clear-btn:hover {
  color: var(--text-primary);
  background: var(--bg-surface-subtle);
}

.btn-reset-filters {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: 8px;
  border: 1px dashed var(--amber-500);
  background: var(--amber-50);
  color: var(--amber-700);
  font-size: 0.67rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-reset-filters:hover {
  background: var(--amber-100);
  color: var(--amber-800);
}

/* Table Scroll & Frame */
.table-scroll-container {
  overflow-x: auto;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.audit-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  text-align: left;
  font-size: 0.73rem;
}

.audit-table thead {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #f8fafc;
}

.audit-table th {
  padding: 10px 14px;
  color: var(--text-muted);
  font-weight: 700;
  border-bottom: 1px solid var(--border-medium);
  font-size: 0.64rem;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.th-content {
  display: flex;
  align-items: center;
  gap: 6px;
}

.th-content.center {
  justify-content: center;
}

.th-target-hint {
  font-size: 0.58rem;
  font-weight: 600;
  color: var(--text-subtle);
  background: #e2e8f0;
  padding: 1px 5px;
  border-radius: 4px;
  letter-spacing: 0;
}

.audit-table td {
  padding: 9px 14px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
  transition: background-color 0.12s ease;
}

.audit-row:nth-child(even) td {
  background: #fafcff;
}

.audit-row:hover td {
  background: #f0f7ff !important;
}

/* Cell Elements */
.time-cell-box {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.time-main-bold {
  font-weight: 700;
  color: var(--text-primary);
  font-size: 0.74rem;
}

.time-sub-date {
  font-size: 0.60rem;
  color: var(--text-muted);
  font-weight: 500;
}

.param-val-box {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid transparent;
  transition: all 0.12s ease;
}

.param-number {
  font-weight: 700;
  font-size: 0.75rem;
}

.param-unit {
  font-size: 0.60rem;
  opacity: 0.7;
}

.param-val-box.cell-val-optimal {
  color: var(--emerald-700);
  background: rgba(16, 185, 129, 0.07);
  border-color: rgba(16, 185, 129, 0.20);
}

.param-val-box.cell-val-warning {
  color: var(--amber-700);
  background: rgba(245, 158, 11, 0.09);
  border-color: rgba(245, 158, 11, 0.24);
  font-weight: 700;
}

.param-val-box.cell-val-critical {
  color: var(--rose-700);
  background: rgba(244, 63, 94, 0.10);
  border-color: rgba(244, 63, 94, 0.28);
  font-weight: 800;
}

.mode-badge-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.cycle-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.64rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  letter-spacing: 0.02em;
}

.cycle-badge.badge-auto {
  background: var(--sky-50);
  color: var(--sky-700);
  border: 1px solid var(--sky-200);
}

.cycle-badge.badge-manual {
  background: var(--amber-50);
  color: var(--amber-800);
  border: 1px solid var(--amber-200);
}

.sample-count-chip {
  font-size: 0.59rem;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--bg-surface-subtle);
  border: 1px solid var(--border-subtle);
  padding: 2px 6px;
  border-radius: 4px;
}

.bio-status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 0.64rem;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 999px;
  letter-spacing: 0.03em;
  white-space: nowrap;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.bio-status-badge.status-optimal {
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}

.bio-status-badge.status-warning {
  background: #fefce8;
  color: #b45309;
  border: 1px solid #fef08a;
}

.bio-status-badge.status-critical {
  background: #fff1f2;
  color: #be123c;
  border: 1px solid #fecdd3;
}

/* Empty State */
.empty-table-cell {
  padding: 48px 20px;
  text-align: center;
}

.empty-state-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  max-width: 400px;
  margin: 0 auto;
}

.empty-state-title {
  font-size: 0.88rem;
  font-weight: 800;
  color: var(--text-primary);
}

.empty-state-sub {
  font-size: 0.68rem;
  color: var(--text-muted);
  line-height: 1.4;
}

.btn-clear-empty-filter {
  margin-top: 6px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 8px;
  background: var(--bg-surface);
  border: 1px solid var(--border-medium);
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-clear-empty-filter:hover {
  background: var(--bg-surface-subtle);
  color: var(--text-primary);
  border-color: var(--sky-500);
}

/* Pagination Footer */
.table-pagination-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding-top: 6px;
  flex-wrap: wrap;
  font-size: 0.68rem;
  color: var(--text-muted);
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.filtered-total-pill {
  font-size: 0.62rem;
  color: var(--text-subtle);
}

.pagination-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.page-size-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.page-size-lbl {
  font-size: 0.66rem;
  color: var(--text-muted);
  font-weight: 600;
}

.page-size-select {
  border: 1px solid var(--border-subtle);
  background: #ffffff;
  padding: 3px 6px;
  border-radius: 6px;
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--text-primary);
  outline: none;
  cursor: pointer;
}

.page-nav-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.page-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: 1px solid var(--border-subtle);
  background: #ffffff;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.page-btn:hover:not(:disabled) {
  background: var(--bg-surface-subtle);
  color: var(--sky-600);
  border-color: var(--sky-300);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-indicator {
  padding: 0 6px;
  font-size: 0.68rem;
  color: var(--text-secondary);
}

/* =========================================================
   RESPONSIVE
========================================================= */
@media (max-width: 1200px) {
  .wq-vitals-split-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1100px) {
  .vitals-cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .vitals-cards-grid > :nth-child(1),
  .vitals-cards-grid > :nth-child(2),
  .vitals-cards-grid > :nth-child(3),
  .vitals-cards-grid > :nth-child(4) {
    grid-column: span 1;
  }
  .vitals-cards-grid > :nth-child(5) {
    grid-column: span 2;
  }
  .param-stats-strip {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .header-main-row {
    flex-direction: column;
    align-items: flex-start;
  }
  .vitals-cards-grid {
    grid-template-columns: 1fr;
  }
  .vitals-cards-grid > * {
    grid-column: span 1 !important;
  }
  .chart-panel-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .chart-controls-wrap {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
  }
  .param-stats-strip {
    grid-template-columns: 1fr 1fr;
  }
  .table-header-row {
    flex-direction: column;
    align-items: flex-start;
  }
  .table-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .toolbar-left-group,
  .toolbar-right-group {
    width: 100%;
    justify-content: flex-start;
  }
  .toolbar-divider {
    display: none;
  }
  .table-search-box {
    flex: 1;
  }
  .table-search-input {
    width: 100%;
  }
  .table-pagination-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .pagination-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
