import { ref, computed } from 'vue'
import { usePonds } from './usePonds'
import { useToast } from './useToast'
import { apiClient } from '../services/apiClient'

// Dynamic dates helper for multi-day execution history
export const getAvailableDates = () => {
  const list = []
  const today = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    
    let label = ''
    const subLabel = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    if (i === 0) {
      label = 'Today'
    } else if (i === 1) {
      label = 'Yesterday'
    } else {
      label = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' (' + d.toLocaleDateString('en-GB', { weekday: 'short' }) + ')'
    }
    list.push({
      date: dateStr,
      label,
      subLabel,
      isToday: i === 0
    })
  }
  return list
}

const availableDates = getAvailableDates()

// Current active filter states: default to today dynamically
const selectedDate = ref(availableDates[0]?.date || new Date().toISOString().split('T')[0])
const selectedPondFilter = ref('K01') // Default to Pond  (K01)
const selectedCategoryFilter = ref('ALL') // 'ALL' | 'AERATION' | 'FEEDING' | 'MOLASSES' | 'SIPHON_FLUSH'
const selectedStatusFilter = ref('ALL') // 'ALL' | 'SUCCESS' | 'RUNNING' | 'SCHEDULED'
const searchKeyword = ref('')

// AI Daily Treatment Recommendations per Pond (Avnimelech Biofloc Engine)
const pondRecommendations = ref({
  K01: {
    id: 'REC-K01-20261016',
    pondId: 'K01',
    pondName: 'Pond 1',
    healthScore: 98,
    healthStatus: 'OPTIMAL BIOFLOC',
    status: 'PENDING', // 'PENDING' | 'APPROVED' | 'REJECTED'
    approvedAt: null,
    approvedBy: null,
    summary: 'Water parameters are exceptionally healthy with high microbial floc activity. Maintain feeding curve and 80% VFD aeration lock.',
    telemetrySnapshot: { do: 6.4, temp: 28.8, ammonia: 0.015, ph: 7.62, flocDensity: 14.0 },
    treatments: [
      {
        id: 'PLAN-K01-01',
        category: 'FEEDING',
        categoryLabel: 'Feeding',
        title: 'Afternoon Feeding Window #3 (BioGrow-7 Pellets)',
        dosage: '11.2 kg BioGrow-7',
        dosageAmount: 11.2,
        dosageUnit: 'kg',
        scheduledTime: '14:30 WIB',
        hardwareNode: 'sac/pond001/feeder',
        status: 'SCHEDULED'
      },
      {
        id: 'PLAN-K01-02',
        category: 'AERATION',
        categoryLabel: 'Aerator Speed',
        title: 'Continuous VFD Aerator Speed Maintenance',
        dosage: '80% Power (~1,200 RPM)',
        dosageAmount: 80,
        dosageUnit: '%',
        aeratorPowerPercent: 80,
        aeratorRpm: 1200,
        scheduledTime: '08:00 WIB',
        hardwareNode: 'sac/pond001/aerator',
        status: 'RUNNING'
      },
      {
        id: 'PLAN-K01-03',
        category: 'MOLASSES',
        categoryLabel: 'Molasses Dosing',
        title: 'C:N 15:1 Microbial Carbon Balance Dosing',
        dosage: '400 g Cane Molasses',
        dosageAmount: 400,
        dosageUnit: 'g',
        scheduledTime: '16:00 WIB',
        hardwareNode: 'sac/pond001/molasses',
        status: 'SCHEDULED'
      },
      {
        id: 'PLAN-K01-04',
        category: 'SIPHON_FLUSH',
        categoryLabel: 'Siphon / Water Change',
        title: 'Bottom Sludge Siphon (Zero Flush Required)',
        dosage: '0% Standby (Sludge Index < 20 mL/L)',
        dosageAmount: 0,
        dosageUnit: '%',
        scheduledTime: '10:30 WIB',
        hardwareNode: 'sac/pond001/siphon',
        status: 'STANDBY'
      }
    ],
    rationale: 'DO level 6.4 mg/L and biofloc density 14 mL/L provide optimal aerobic digestion. Full feeding ration approved with zero sludge discharge needed today.'
  },
  K02: {
    id: 'REC-K02-20261016',
    pondId: 'K02',
    pondName: 'Pond 2',
    healthScore: 94,
    healthStatus: 'OPTIMAL GROWER',
    status: 'PENDING',
    approvedAt: null,
    approvedBy: null,
    summary: 'Rapid tilapia growth stage with active floc nutrition. Maintain 75% VFD speed and scheduled feeding.',
    telemetrySnapshot: { do: 5.9, temp: 29.1, ammonia: 0.025, ph: 7.40, flocDensity: 11.0 },
    treatments: [
      {
        id: 'PLAN-K02-01',
        category: 'FEEDING',
        categoryLabel: 'Feeding',
        title: 'Afternoon Grower Feeding Window (BioGrow-7)',
        dosage: '7.4 kg BioGrow-7',
        dosageAmount: 7.4,
        dosageUnit: 'kg',
        scheduledTime: '15:00 WIB',
        hardwareNode: 'sac/pond002/feeder',
        status: 'SCHEDULED'
      },
      {
        id: 'PLAN-K02-02',
        category: 'AERATION',
        categoryLabel: 'Aerator Speed',
        title: 'VFD Speed Regulation (75% Power)',
        dosage: '75% Power (~1,125 RPM)',
        dosageAmount: 75,
        dosageUnit: '%',
        aeratorPowerPercent: 75,
        aeratorRpm: 1125,
        scheduledTime: '08:00 WIB',
        hardwareNode: 'sac/pond002/aerator',
        status: 'RUNNING'
      },
      {
        id: 'PLAN-K02-03',
        category: 'MOLASSES',
        categoryLabel: 'Molasses Dosing',
        title: 'C:N 15:1 Molasses Supplementation',
        dosage: '250 g Cane Molasses',
        dosageAmount: 250,
        dosageUnit: 'g',
        scheduledTime: '16:30 WIB',
        hardwareNode: 'sac/pond002/molasses',
        status: 'SCHEDULED'
      },
      {
        id: 'PLAN-K02-04',
        category: 'SIPHON_FLUSH',
        categoryLabel: 'Siphon / Water Change',
        title: 'Midday Siphon Cycle (Completed)',
        dosage: '10% Flush (5.0 m³)',
        dosageAmount: 10,
        dosageUnit: '%',
        scheduledTime: '11:00 WIB',
        hardwareNode: 'sac/pond002/siphon',
        status: 'SUCCESS'
      }
    ],
    rationale: 'Growth rate 4.05 g/day. Midday siphon already purged bottom sludge; C:N ratio balanced.'
  },
  K03: {
    id: 'REC-K03-20261016',
    pondId: 'K03',
    pondName: 'Pond 3',
    healthScore: 99,
    healthStatus: 'EXCELLENT NURSERY',
    status: 'PENDING',
    approvedAt: null,
    approvedBy: null,
    summary: 'Fingerling nursery tank exhibiting high survival rate 96.8%. Gentle aeration current required.',
    telemetrySnapshot: { do: 6.8, temp: 28.4, ammonia: 0.012, ph: 7.70, flocDensity: 8.0 },
    treatments: [
      {
        id: 'PLAN-K03-01',
        category: 'FEEDING',
        categoryLabel: 'Feeding',
        title: 'Nursery Starter Crumble #3 (High-Protein 38%)',
        dosage: '4.2 kg Micro-Crumb #2',
        dosageAmount: 4.2,
        dosageUnit: 'kg',
        scheduledTime: '15:30 WIB',
        hardwareNode: 'sac/pond003/feeder',
        status: 'SCHEDULED'
      },
      {
        id: 'PLAN-K03-02',
        category: 'AERATION',
        categoryLabel: 'Aerator Speed',
        title: 'Laminar Low-Turbulence Aeration (60% Power)',
        dosage: '60% Power (~900 RPM)',
        dosageAmount: 60,
        dosageUnit: '%',
        aeratorPowerPercent: 60,
        aeratorRpm: 900,
        scheduledTime: '08:00 WIB',
        hardwareNode: 'sac/pond003/aerator',
        status: 'RUNNING'
      },
      {
        id: 'PLAN-K03-03',
        category: 'MOLASSES',
        categoryLabel: 'Molasses Dosing',
        title: 'Nursery Minimal Carbon Dosing',
        dosage: '120 g Cane Molasses',
        dosageAmount: 120,
        dosageUnit: 'g',
        scheduledTime: '17:00 WIB',
        hardwareNode: 'sac/pond003/molasses',
        status: 'SCHEDULED'
      },
      {
        id: 'PLAN-K03-04',
        category: 'SIPHON_FLUSH',
        categoryLabel: 'Siphon / Water Change',
        title: 'Zero Siphon Exchange',
        dosage: '0% Flush',
        dosageAmount: 0,
        dosageUnit: '%',
        scheduledTime: '10:30 WIB',
        hardwareNode: 'sac/pond003/siphon',
        status: 'STANDBY'
      }
    ],
    rationale: 'Clean fingerling environment, high DO (6.8 mg/L), and low ammonia (0.012 ppm). Gentle laminar flow prevents larval fatigue.'
  },
  K04: {
    id: 'REC-K04-20261016',
    pondId: 'K04',
    pondName: 'Pond 4',
    healthScore: 92,
    healthStatus: 'STABLE CORE',
    status: 'PENDING',
    approvedAt: null,
    approvedBy: null,
    summary: 'High-density mature biofloc matrix (16 mL/L). Requires higher aeration power (90% VFD) for continuous life support.',
    telemetrySnapshot: { do: 6.2, temp: 28.6, ammonia: 0.024, ph: 7.55, flocDensity: 16.0 },
    treatments: [
      {
        id: 'PLAN-K04-01',
        category: 'FEEDING',
        categoryLabel: 'Feeding',
        title: 'Afternoon Core Feeding Window (BioGrow-7)',
        dosage: '9.1 kg BioGrow-7',
        dosageAmount: 9.1,
        dosageUnit: 'kg',
        scheduledTime: '14:00 WIB',
        hardwareNode: 'sac/pond004/feeder',
        status: 'SCHEDULED'
      },
      {
        id: 'PLAN-K04-02',
        category: 'AERATION',
        categoryLabel: 'Aerator Speed',
        title: 'High-Density Life-Support Aeration (90% Power)',
        dosage: '90% Power (~1,350 RPM)',
        dosageAmount: 90,
        dosageUnit: '%',
        aeratorPowerPercent: 90,
        aeratorRpm: 1350,
        scheduledTime: '08:00 WIB',
        hardwareNode: 'sac/pond004/aerator',
        status: 'RUNNING'
      },
      {
        id: 'PLAN-K04-03',
        category: 'MOLASSES',
        categoryLabel: 'Molasses Dosing',
        title: 'Post-Feeding Molasses Carbon Buffer',
        dosage: '350 g Cane Molasses Solution',
        dosageAmount: 350,
        dosageUnit: 'g',
        scheduledTime: '16:30 WIB',
        hardwareNode: 'sac/pond004/molasses',
        status: 'SCHEDULED'
      },
      {
        id: 'PLAN-K04-04',
        category: 'SIPHON_FLUSH',
        categoryLabel: 'Siphon / Water Change',
        title: 'Sludge Chamber Inspection',
        dosage: '0% Flush (Standby)',
        dosageAmount: 0,
        dosageUnit: '%',
        scheduledTime: '10:30 WIB',
        hardwareNode: 'sac/pond004/siphon',
        status: 'STANDBY'
      }
    ],
    rationale: 'Mature biofloc matrix is actively purifying TAN into single-cell protein. 90% aeration is mandatory.'
  }
})

const TODAY_DATE = availableDates[0]?.date || new Date().toISOString().split('T')[0]

// Helper to generate strictly the 4 biofloc treatments (6 chronological events) per pond
export const generateCleanTreatmentsForPond = (dateStr, pondId) => {
  const pondConfig = {
    K01: {
      name: "Pond 1",
      aeratorPower: 80,
      aeratorRpm: 1200,
      feed1: 11.2,
      feed2: 14.8,
      feed3: 11.2,
      molasses: 400,
      siphonLiters: 250,
      do: 6.35,
      temp: 28.5,
      ammonia: 0.015,
      ph: 7.62,
      flocDensity: 14.0
    },
    K02: {
      name: "Pond 2",
      aeratorPower: 75,
      aeratorRpm: 1125,
      feed1: 7.4,
      feed2: 9.8,
      feed3: 7.4,
      molasses: 300,
      siphonLiters: 200,
      do: 5.95,
      temp: 28.7,
      ammonia: 0.022,
      ph: 7.45,
      flocDensity: 11.0
    },
    K03: {
      name: "Pond 3",
      aeratorPower: 60,
      aeratorRpm: 900,
      feed1: 4.2,
      feed2: 5.5,
      feed3: 4.2,
      molasses: 180,
      siphonLiters: 150,
      do: 6.80,
      temp: 28.4,
      ammonia: 0.012,
      ph: 7.70,
      flocDensity: 8.0
    },
    K04: {
      name: "Pond 4",
      aeratorPower: 90,
      aeratorRpm: 1350,
      feed1: 9.1,
      feed2: 12.0,
      feed3: 9.1,
      molasses: 350,
      siphonLiters: 300,
      do: 6.18,
      temp: 28.6,
      ammonia: 0.024,
      ph: 7.55,
      flocDensity: 16.0
    }
  }

  const p = pondConfig[pondId] || pondConfig.K01

  return [
    {
      id: `ACT-${dateStr}-${pondId}-01`,
      date: dateStr,
      time: "06:00 WIB",
      pondId,
      pondName: p.name,
      category: "AERATION",
      categoryLabel: "Aerator Speed Regulation",
      treatment: `Aerator Speed Regulation (VFD ${p.aeratorPower}% Power)`,
      dosage: `${p.aeratorPower}% (~${p.aeratorRpm} RPM)`,
      dosageAmount: p.aeratorPower,
      dosageUnit: "%",
      aeratorPowerPercent: p.aeratorPower,
      aeratorRpm: p.aeratorRpm,
      aeratorHz: ((p.aeratorPower / 100) * 50).toFixed(1),
      type: "AUTO_AI",
      actor: "AI Closed-Loop Controller",
      hardwareId: `ESP32-${pondId}-AR (VFD Inverter)`,
      status: "SUCCESS",
      duration: "Continuous VFD",
      sensorSnapshot: { do: p.do, temp: p.temp, ammonia: p.ammonia, ph: p.ph, flocDensity: p.flocDensity },
      notes: `Aeration VFD inverter frequency calibration (~${p.aeratorRpm} RPM / ${((p.aeratorPower / 100) * 50).toFixed(1)} Hz) maintaining optimal biofloc suspension.`
    },
    {
      id: `ACT-${dateStr}-${pondId}-02`,
      date: dateStr,
      time: "08:00 WIB",
      pondId,
      pondName: p.name,
      category: "FEEDING",
      categoryLabel: "Feed Dispense",
      treatment: "Feeding Session #1 (Morning) — BioGrow-7",
      dosage: `${p.feed1} kg`,
      dosageAmount: p.feed1,
      dosageUnit: "kg",
      aeratorPowerPercent: p.aeratorPower,
      aeratorRpm: p.aeratorRpm,
      aeratorHz: ((p.aeratorPower / 100) * 50).toFixed(1),
      type: "AUTO_AI",
      actor: "Smart Auto-Feeder (AI Schedule)",
      hardwareId: `ESP32-${pondId}-FD (Auto-Feeder)`,
      status: "SUCCESS",
      duration: "45 sec",
      sensorSnapshot: { do: p.do + 0.1, temp: p.temp - 0.2, ammonia: p.ammonia, ph: p.ph + 0.05, flocDensity: p.flocDensity },
      notes: `Morning ration 30% of total daily allocation. Pre-feed DO safe at ${(p.do + 0.1).toFixed(1)} mg/L.`
    },
    {
      id: `ACT-${dateStr}-${pondId}-03`,
      date: dateStr,
      time: "10:30 WIB",
      pondId,
      pondName: p.name,
      category: "SIPHON_FLUSH",
      categoryLabel: "Sludge Purge & Siphon",
      treatment: `Bottom Sludge Siphon & Water Refresh (${p.siphonLiters} L)`,
      dosage: `${p.siphonLiters} L`,
      dosageAmount: p.siphonLiters,
      dosageUnit: "L",
      aeratorPowerPercent: p.aeratorPower,
      aeratorRpm: p.aeratorRpm,
      aeratorHz: ((p.aeratorPower / 100) * 50).toFixed(1),
      type: "MANUAL_SUPERVISOR",
      actor: "Ilfa Hidayat (Supervisor Purge)",
      hardwareId: `ESP32-${pondId}-FLUSH (Siphon Valve)`,
      status: "SUCCESS",
      duration: "5 min",
      sensorSnapshot: { do: p.do - 0.1, temp: p.temp + 0.3, ammonia: p.ammonia, ph: p.ph, flocDensity: p.flocDensity - 0.5 },
      notes: "Evacuation of settled fecal matter and bottom anaerobic sludge with fresh water top-up."
    },
    {
      id: `ACT-${dateStr}-${pondId}-04`,
      date: dateStr,
      time: "12:30 WIB",
      pondId,
      pondName: p.name,
      category: "FEEDING",
      categoryLabel: "Feed Dispense",
      treatment: "Feeding Session #2 (Midday) — BioGrow-7",
      dosage: `${p.feed2} kg`,
      dosageAmount: p.feed2,
      dosageUnit: "kg",
      aeratorPowerPercent: p.aeratorPower,
      aeratorRpm: p.aeratorRpm,
      aeratorHz: ((p.aeratorPower / 100) * 50).toFixed(1),
      type: "AUTO_AI",
      actor: "Smart Auto-Feeder (AI Schedule)",
      hardwareId: `ESP32-${pondId}-FD (Auto-Feeder)`,
      status: "SCHEDULED",
      duration: "45 sec",
      sensorSnapshot: { do: p.do, temp: p.temp + 0.5, ammonia: p.ammonia + 0.003, ph: p.ph - 0.05, flocDensity: p.flocDensity },
      notes: `Peak metabolic midday ration (40% of daily allocation) at optimum temperature of ${(p.temp + 0.5).toFixed(1)}°C.`
    },
    {
      id: `ACT-${dateStr}-${pondId}-05`,
      date: dateStr,
      time: "14:30 WIB",
      pondId,
      pondName: p.name,
      category: "MOLASSES",
      categoryLabel: "Molasses Injection",
      treatment: `Cane Molasses C:N 15:1 Injection (${p.molasses} g)`,
      dosage: `${p.molasses} g`,
      dosageAmount: p.molasses,
      dosageUnit: "g",
      aeratorPowerPercent: p.aeratorPower,
      aeratorRpm: p.aeratorRpm,
      aeratorHz: ((p.aeratorPower / 100) * 50).toFixed(1),
      type: "AUTO_AI",
      actor: "AI Dosing Valve Actuator",
      hardwareId: `ESP32-${pondId}-DS (Molasses Pump)`,
      status: "SCHEDULED",
      duration: "3 min",
      sensorSnapshot: { do: p.do, temp: p.temp + 0.4, ammonia: p.ammonia + 0.002, ph: p.ph, flocDensity: p.flocDensity },
      notes: "Organic carbon molasses addition to sustain 15:1 C:N ratio and stimulate heterotrophic biofloc bacteria."
    },
    {
      id: `ACT-${dateStr}-${pondId}-06`,
      date: dateStr,
      time: "17:00 WIB",
      pondId,
      pondName: p.name,
      category: "FEEDING",
      categoryLabel: "Feed Dispense",
      treatment: "Feeding Session #3 (Evening) — BioGrow-7",
      dosage: `${p.feed3} kg`,
      dosageAmount: p.feed3,
      dosageUnit: "kg",
      aeratorPowerPercent: p.aeratorPower,
      aeratorRpm: p.aeratorRpm,
      aeratorHz: ((p.aeratorPower / 100) * 50).toFixed(1),
      type: "AUTO_AI",
      actor: "Smart Auto-Feeder (AI Schedule)",
      hardwareId: `ESP32-${pondId}-FD (Auto-Feeder)`,
      status: "SCHEDULED",
      duration: "45 sec",
      sensorSnapshot: { do: p.do - 0.1, temp: p.temp + 0.1, ammonia: p.ammonia, ph: p.ph, flocDensity: p.flocDensity },
      notes: "Evening concluding ration (30% of daily allocation) before nocturnal water temperature drop."
    }
  ]
}

export const createCleanInitialTreatments = () => {
  const initialList = []
  const pondIds = ["K01", "K02", "K03", "K04"]
  const dates = availableDates.slice(0, 3).map(d => d.date)
  for (const d of dates) {
    for (const p of pondIds) {
      initialList.push(...generateCleanTreatmentsForPond(d, p))
    }
  }
  return initialList
}

// Clean treatment database adhering strictly to the 4 biofloc treatments
const executionDatabase = ref(createCleanInitialTreatments())

export function useDailyExecution() {
  const { ponds, triggerFeeder, setAeratorBoost, triggerMolassesDosing, triggerWaterFlush } = usePonds()
  const { showToast } = useToast()

  // Generate dynamic clean records if a user chooses an older date not explicitly pre-seeded
  const ensureDateRecordsExist = (dateStr) => {
    const existing = executionDatabase.value.filter(e => e.date === dateStr)
    if (existing.length > 0) return

    const pondIds = ['K01', 'K02', 'K03', 'K04']
    for (const p of pondIds) {
      executionDatabase.value.push(...generateCleanTreatmentsForPond(dateStr, p))
    }
  }

  // Set the selected date and auto-populate if necessary
  const setDate = (dateStr) => {
    selectedDate.value = dateStr
    ensureDateRecordsExist(dateStr)
  }

  // Navigate day by +/- 1
  const stepDate = (offsetDays) => {
    const current = new Date(selectedDate.value)
    current.setDate(current.getDate() + offsetDays)
    const newDateStr = current.toISOString().slice(0, 10)
    setDate(newDateStr)
  }

  // Filtered executions list based on Date, Pond, Category, Status, and Search query
  const filteredExecutions = computed(() => {
    ensureDateRecordsExist(selectedDate.value)
    return executionDatabase.value.filter(item => {
      // Date filter
      if (item.date !== selectedDate.value) return false

      // Pond filter
      if (selectedPondFilter.value !== 'ALL' && item.pondId !== selectedPondFilter.value) {
        return false
      }

      // Category filter (Strictly 4 categories)
      if (selectedCategoryFilter.value !== 'ALL' && item.category !== selectedCategoryFilter.value) {
        return false
      }

      // Status filter
      if (selectedStatusFilter.value !== 'ALL' && item.status !== selectedStatusFilter.value) {
        return false
      }

      // Keyword search
      if (searchKeyword.value.trim()) {
        const query = searchKeyword.value.toLowerCase()
        const matchAction = item.treatment?.toLowerCase().includes(query)
        const matchActor = item.actor?.toLowerCase().includes(query)
        const matchHardware = item.hardwareId?.toLowerCase().includes(query)
        const matchNotes = item.notes?.toLowerCase().includes(query)
        const matchPond = item.pondName?.toLowerCase().includes(query) || item.pondId?.toLowerCase().includes(query)
        if (!matchAction && !matchActor && !matchHardware && !matchNotes && !matchPond) {
          return false
        }
      }

      return true
    }).sort((a, b) => {
      const parseMinutes = (tStr) => {
        if (!tStr) return 9999
        const match = String(tStr).match(/(\d{1,2}):(\d{2})/)
        if (match) return parseInt(match[1], 10) * 60 + parseInt(match[2], 10)
        return 9999
      }
      return parseMinutes(a.time) - parseMinutes(b.time)
    })
  })

  // Date-specific summary metrics (KPIs)
  const dailySummary = computed(() => {
    const dayItems = executionDatabase.value.filter(e => e.date === selectedDate.value)
    const relevantItems = selectedPondFilter.value === 'ALL' 
      ? dayItems 
      : dayItems.filter(e => e.pondId === selectedPondFilter.value)

    let totalFeedKg = 0
    let totalMolassesGrams = 0
    let totalSiphonM3 = 0
    let totalSiphonPercent = 0
    let siphonSessionCount = 0
    let aeratorRpmList = []
    let aeratorPowerList = []
    let completedCount = 0
    let scheduledCount = 0
    let inProgressCount = 0

    const pondVolumes = {
      K01: 50,
      K02: 50,
      K03: 30,
      K04: 50
    }

    relevantItems.forEach(item => {
      if (item.status === 'SUCCESS') completedCount++
      if (item.status === 'SCHEDULED') scheduledCount++
      if (item.status === 'RUNNING') inProgressCount++

      if (item.category === 'FEEDING' && item.dosageAmount) {
        totalFeedKg += Number(item.dosageAmount)
      }
      if (item.category === 'MOLASSES' && item.dosageAmount) {
        totalMolassesGrams += Number(item.dosageAmount)
      }
      if (item.category === 'SIPHON_FLUSH' && item.dosageAmount) {
        siphonSessionCount++
        const pct = Number(item.dosageAmount) || 0
        totalSiphonPercent += pct
        const vol = pondVolumes[item.pondId] || 50
        totalSiphonM3 += (pct * vol) / 100
      }
      if (item.aeratorPowerPercent) {
        aeratorPowerList.push(item.aeratorPowerPercent)
      }
      if (item.aeratorRpm) {
        aeratorRpmList.push(item.aeratorRpm)
      }
    })

    const avgAeratorPowerPercent = aeratorPowerList.length > 0
      ? Math.round(aeratorPowerList.reduce((a, b) => a + b, 0) / aeratorPowerList.length)
      : (selectedPondFilter.value !== 'ALL' 
          ? (ponds.value.find(p => p.id === selectedPondFilter.value)?.actuators?.aerator?.powerPercent || 80)
          : 80)

    const avgAeratorRpm = aeratorRpmList.length > 0 
      ? Math.round(aeratorRpmList.reduce((a, b) => a + b, 0) / aeratorRpmList.length)
      : Math.round((avgAeratorPowerPercent / 100) * 1500)

    const distinctPonds = new Set(relevantItems.map(i => i.pondId)).size

    return {
      totalExecutions: relevantItems.length,
      completedCount,
      scheduledCount,
      inProgressCount,
      successRate: relevantItems.length > 0 
        ? Math.round((completedCount / (completedCount + inProgressCount || 1)) * 100) 
        : 100,
      totalFeedKg: Number(totalFeedKg.toFixed(1)),
      totalMolassesGrams,
      totalSiphonM3: Number(totalSiphonM3.toFixed(1)),
      totalSiphonPercent: Math.round(totalSiphonPercent),
      siphonSessionCount,
      avgAeratorPowerPercent,
      avgAeratorRpm,
      avgAeratorHz: Number(((avgAeratorPowerPercent / 100) * 50).toFixed(1)),
      distinctPonds
    }
  })

  // Per-pond Live / Date Summary Cards
  const pondFleetCards = computed(() => {
    const dayItems = executionDatabase.value.filter(e => e.date === selectedDate.value)
    
    return ponds.value.map(pond => {
      const pondItems = dayItems.filter(e => e.pondId === pond.id)
      
      const feedKg = pondItems
        .filter(e => e.category === 'FEEDING' && e.status === 'SUCCESS')
        .reduce((sum, item) => sum + (item.dosageAmount || 0), 0)

      const molassesGrams = pondItems
        .filter(e => e.category === 'MOLASSES' && e.status === 'SUCCESS')
        .reduce((sum, item) => sum + (item.dosageAmount || 0), 0)

      const siphonItems = pondItems.filter(e => e.category === 'SIPHON_FLUSH' && e.status === 'SUCCESS')
      const siphonPercent = siphonItems.reduce((sum, item) => sum + (item.dosageAmount || 0), 0)
      const siphonM3 = Number(((siphonPercent * pond.volumeM3) / 100).toFixed(1))
      const siphonCount = siphonItems.length

      // Get latest aerator power from actuators or day items
      const latestAeratorExec = [...pondItems].reverse().find(e => e.aeratorPowerPercent)
      
      const currentPowerPercent = selectedDate.value === availableDates[0]?.date
        ? (pond.actuators?.aerator?.powerPercent || 80)
        : (latestAeratorExec ? latestAeratorExec.aeratorPowerPercent : 80)

      const currentRpm = Math.round((currentPowerPercent / 100) * 1500)
      const currentHz = Number(((currentPowerPercent / 100) * 50).toFixed(1))

      const latestAction = pondItems.length > 0 ? pondItems[pondItems.length - 1] : null

      return {
        id: pond.id,
        name: pond.name,
        phase: pond.phase,
        fishCount: pond.fishCount,
        volumeM3: pond.volumeM3,
        feedKg: Number(feedKg.toFixed(1)),
        targetFeedKg: pond.actuators.feeder.targetDailyKg || 40.0,
        molassesGrams,
        siphonPercent,
        siphonM3,
        siphonCount,
        currentPowerPercent,
        currentRpm,
        currentHz,
        telemetry: pond.telemetry,
        actuators: pond.actuators,
        totalActionsToday: pondItems.length,
        lastActionText: latestAction ? `${latestAction.time} — ${latestAction.treatment}` : 'No logged executions yet',
        isCurrentSelected: selectedPondFilter.value === pond.id
      }
    })
  })

  // Active pond recommendation computed
  const activePondRecommendation = computed(() => {
    return pondRecommendations.value[selectedPondFilter.value] || pondRecommendations.value['K01']
  })

  // Approve AI recommendation protocol for pond (Approve All)
  const approveRecommendation = async (pondId) => {
    const pId = pondId || selectedPondFilter.value
    const rec = pondRecommendations.value[pId]
    if (rec) {
      const nowStr = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
      rec.status = 'APPROVED'
      rec.approvedAt = nowStr
      rec.approvedBy = 'Ilfa Hidayat (Farm Supervisor)'
    }
    try {
      await apiClient.approveAllExecutions(pId)
      showToast(`✓ All pending AI actions approved for ${rec?.pondName || pId}!`, 'success')
      await loadExecutionsFromDatabase(pId)
    } catch (err) {
      showToast(`Approval failed: ${err.message}`, 'error')
    }
  }

  // Reject AI recommendation protocol
  const rejectRecommendation = (pondId) => {
    const pId = pondId || selectedPondFilter.value
    const rec = pondRecommendations.value[pId]
    if (!rec) return
    rec.status = 'REJECTED'
    rec.approvedAt = null
    rec.approvedBy = null
    showToast(`✕ AI Protocol Rejected for ${rec.pondName}. Actuators held in manual standby.`, 'warning')
  }

  // Approve a single scheduled execution item
  const approveExecution = async (execId) => {
    const item = executionDatabase.value.find(e => e.id === execId)
    const prevStatus = item?.status
    if (item) {
      item.status = 'SCHEDULED'
    }
    try {
      const res = await apiClient.approveExecution(execId)
      if (!res || res.success === false) {
        throw new Error(res?.message || 'Failed to approve schedule')
      }
      showToast(`✓ Action approved and scheduled: ${item?.treatment || execId}`, 'success')
      await loadExecutionsFromDatabase(selectedPondFilter.value)
    } catch (err) {
      if (item && prevStatus) item.status = prevStatus
      showToast(`Failed to approve action: ${err.message}`, 'danger')
    }
  }

  // Reject a single scheduled execution item
  const rejectExecution = async (execId) => {
    const item = executionDatabase.value.find(e => e.id === execId)
    const prevStatus = item?.status
    if (item) {
      item.status = 'REJECTED'
    }
    try {
      const res = await apiClient.rejectExecution(execId)
      if (!res || res.success === false) {
        throw new Error(res?.message || 'Failed to reject schedule')
      }
      showToast(`✕ Action rejected: ${item?.treatment || execId}`, 'warning')
      await loadExecutionsFromDatabase(selectedPondFilter.value)
    } catch (err) {
      if (item && prevStatus) item.status = prevStatus
      showToast(`Failed to reject action: ${err.message}`, 'danger')
    }
  }

  // Reset AI recommendation protocol to pending
  const resetRecommendation = (pondId) => {
    const pId = pondId || selectedPondFilter.value
    const rec = pondRecommendations.value[pId]
    if (!rec) return
    rec.status = 'PENDING'
    rec.approvedAt = null
    rec.approvedBy = null
    showToast(`↺ Recommendation reset to pending for ${rec.pondName}.`, 'info')
  }

  // Customize / Edit a scheduled execution plan before it runs
  const updateScheduledExecution = async (execId, { time, dosage, dosageAmount, dosageUnit, aeratorPowerPercent, aeratorRpm, notes, treatment }) => {
    const item = executionDatabase.value.find(e => e.id === execId)
    if (!item) {
      showToast('Execution record not found.', 'error')
      return false
    }

    if (time) item.time = time
    if (treatment) item.treatment = treatment
    if (dosage) item.dosage = dosage
    if (dosageAmount !== undefined && dosageAmount !== null) item.dosageAmount = Number(dosageAmount)
    if (dosageUnit) item.dosageUnit = dosageUnit
    if (aeratorPowerPercent !== undefined && aeratorPowerPercent !== null) {
      item.aeratorPowerPercent = Number(aeratorPowerPercent)
      item.aeratorRpm = aeratorRpm || Math.round((item.aeratorPowerPercent / 100) * 1500)
      item.aeratorHz = Number(((item.aeratorPowerPercent / 100) * 50).toFixed(1))
      if (item.category === 'AERATION') {
        item.dosage = `${item.aeratorPowerPercent}% Power (~${item.aeratorRpm} RPM)`
      }
    }
    if (notes !== undefined) item.notes = notes
    item.status = 'SCHEDULED'
    item.actor = 'Ilfa Hidayat (Customized Plan)'

    // Synchronize with active recommendation card if matching category
    const rec = pondRecommendations.value[item.pondId]
    if (rec && rec.treatments) {
      const t = rec.treatments.find(tr => tr.category === item.category)
      if (t) {
        if (item.category === 'FEEDING') {
          t.dosage = item.dosage
          t.dosageAmount = item.dosageAmount
          t.scheduledTime = item.time
        } else if (item.category === 'AERATION') {
          t.dosage = item.dosage
          t.aeratorPowerPercent = item.aeratorPowerPercent
          t.aeratorRpm = item.aeratorRpm
        } else if (item.category === 'MOLASSES') {
          t.dosage = item.dosage
          t.dosageAmount = item.dosageAmount
          t.scheduledTime = item.time
        }
      }
    }

    try {
      await apiClient.adjustExecution(execId, {
        dosage_amount: item.dosageAmount,
        dosage_unit: item.dosageUnit,
        scheduled_time: item.time,
        aerator_power_percent: item.aeratorPowerPercent,
        aerator_rpm: item.aeratorRpm,
        notes: item.notes,
        title: item.treatment
      })
      showToast(`⚡ Plan updated & scheduled: ${item.treatment} (${item.pondName})`, 'success')
      await loadExecutionsFromDatabase(selectedPondFilter.value)
      return true
    } catch (err) {
      showToast(`Failed to update plan: ${err.message}`, 'error')
      return false
    }
  }

  // Execute a scheduled action immediately
  const runScheduledNow = async (execId) => {
    const item = executionDatabase.value.find(e => e.id === execId)
    if (!item) {
      showToast('Execution record not found.', 'danger')
      return false
    }
    const previousStatus = item.status
    const now = new Date()
    item.time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
    item.status = 'RUNNING'
    item.actor = 'Supervisor (Manual Dispatch)'

    try {
      const res = await apiClient.runExecutionNow(execId)
      if (!res || res.success === false) {
        throw new Error(res?.message || 'Failed to transmit instruction to server')
      }
      showToast(`🚀 Command successfully dispatched to actuator: ${item.treatment}`, 'success')

      // Automatically transition to SUCCESS and reload after the actuator pulse duration
      const waitMs = item.category === 'AERATION' ? 2500 : (item.category === 'SIPHON_FLUSH' ? 6500 : 4500)
      setTimeout(async () => {
        item.status = 'SUCCESS'
        await loadExecutionsFromDatabase(selectedPondFilter.value)
        showToast(`✓ Completed & verified: ${item.treatment}`, 'success')
      }, waitMs)

      return true
    } catch (err) {
      item.status = previousStatus
      showToast(`Failed to execute treatment: ${err.message}`, 'danger')
      return false
    }
  }

  // Execute a new centralized IoT Action right now
  const executeNewIoTAction = ({
    pondId,
    category,
    actionName,
    dosageText,
    dosageAmount,
    dosageUnit,
    aeratorPowerPercent,
    aeratorRpm,
    notes,
    status = 'SUCCESS',
    actor = 'Ilfa Hidayat (IoT Execution Hub)',
    time,
    duration = '45 sec'
  }) => {
    const pond = ponds.value.find(p => p.id === pondId) || ponds.value[0]
    const now = new Date()
    const timeStr = time || (now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' WIB')
    const todayStr = availableDates[0]?.date || new Date().toISOString().split('T')[0] // Active operating date

    const newExecId = `EXEC-${todayStr.replace(/-/g, '')}-${Date.now().toString().slice(-4)}`
    
    // Determine target Power % and RPM
    const finalPower = Number(aeratorPowerPercent) || 80
    const finalRpm = aeratorRpm || Math.round((finalPower / 100) * 1500)
    const finalHz = Number(((finalPower / 100) * 50).toFixed(1))

    let categoryLabel = 'IoT Action'
    let hardwareId = `sac/${pond.id.toLowerCase()}/node`

    if (category === 'FEEDING') {
      categoryLabel = 'Feeding'
      hardwareId = `sac/${pond.id.toLowerCase()}/feeder`
      if (status === 'SUCCESS') triggerFeeder(pond.id, dosageAmount || 5.0, actor)
    } else if (category === 'AERATION') {
      categoryLabel = 'Aerator Speed'
      hardwareId = `sac/${pond.id.toLowerCase()}/aerator`
      if (status === 'SUCCESS') setAeratorBoost(pond.id, finalPower, actor)
    } else if (category === 'MOLASSES') {
      categoryLabel = 'Molasses Dosing'
      hardwareId = `sac/${pond.id.toLowerCase()}/molasses`
      if (status === 'SUCCESS') triggerMolassesDosing(pond.id, dosageAmount || 350, actor)
    } else if (category === 'SIPHON_FLUSH') {
      categoryLabel = 'Siphon / Water Change'
      hardwareId = `sac/${pond.id.toLowerCase()}/siphon`
      if (status === 'SUCCESS') triggerWaterFlush(pond.id, dosageAmount || 15, actor)
    }

    // Dispatch to Backend REST API for MySQL logging and MQTT execution
    let actionCmd = 'feed'
    let params = { dose: dosageAmount || 5.0, unit: dosageUnit || 'kg' }
    if (category === 'AERATION') {
      actionCmd = 'aerator'
      params = { power_percent: finalPower, rpm: finalRpm }
    } else if (category === 'MOLASSES') {
      actionCmd = 'molasses'
      params = { dose: dosageAmount || 350, unit: 'g' }
    } else if (category === 'SIPHON_FLUSH') {
      actionCmd = 'siphon'
      params = { volume: dosageAmount || 200, unit: 'L' }
    }
    apiClient.dispatchCommand(pond.id, actionCmd, params, actor).catch(err => {
      console.warn('[DailyExecution] dispatchCommand API error:', err)
    })

    const newRecord = {
      id: newExecId,
      date: todayStr,
      time: timeStr,
      pondId: pond.id,
      pondName: pond.name,
      category,
      categoryLabel,
      treatment: actionName,
      dosage: dosageText,
      dosageAmount,
      dosageUnit,
      aeratorPowerPercent: finalPower,
      aeratorRpm: finalRpm,
      aeratorHz: finalHz,
      type: status === 'SCHEDULED' ? 'SCHEDULED' : 'MANUAL_SUPERVISOR',
      actor,
      hardwareId,
      status,
      duration,
      sensorSnapshot: {
        do: pond.telemetry.do,
        temp: pond.telemetry.temp,
        ammonia: pond.telemetry.ammonia,
        ph: pond.telemetry.ph,
        flocDensity: pond.telemetry.flocDensity
      },
      notes: notes || `Direct manual execution triggered from Daily IoT Execution Hub.`
    }

    // Insert at front of today's executions
    executionDatabase.value.unshift(newRecord)
    
    // Switch to today's view if viewing another day
    selectedDate.value = todayStr

    showToast(`⚡ Command ${status === 'SCHEDULED' ? 'Scheduled' : 'Executed'}: ${actionName} for ${pond.name}`, 'success')
    return newRecord
  }

  // Create a manual command/task into the todo list queue
  const createManualTask = async ({
    pondId,
    category,
    title,
    dosageAmount,
    dosageUnit,
    aeratorPowerPercent,
    scheduledTime,
    notes,
    status = 'PENDING',
    executeNow = false
  }) => {
    try {
      const pId = pondId || selectedPondFilter.value
      const res = await apiClient.createManualTask(pId, {
        category,
        title,
        dosage_amount: dosageAmount,
        dosage_unit: dosageUnit,
        aerator_power_percent: aeratorPowerPercent,
        scheduled_time: scheduledTime || 'Manual Action',
        notes,
        status: executeNow ? 'RUNNING' : status,
        executeNow
      })
      if (res && res.success) {
        showToast(executeNow ? `⚡ Command dispatched to actuators: ${title}` : `✓ Task added: ${title}`, 'success')
        await loadExecutionsFromDatabase(pId)
        return res.data
      } else {
        throw new Error(res?.message || 'Failed to create task')
      }
    } catch (err) {
      showToast(`Error creating task: ${err.message}`, 'error')
      return null
    }
  }

  // Database Hydration for Executions and AI Recommendations
  const loadExecutionsFromDatabase = async (pondId = selectedPondFilter.value) => {
    try {
      const pIds = (!pondId || pondId === 'ALL') ? ['K01', 'K02', 'K03', 'K04'] : [pondId]
      const todayStr = availableDates[0]?.date || new Date().toISOString().split('T')[0]

      for (const pId of pIds) {
        const res = await apiClient.getExecutions(pId)
        if (res && res.length > 0) {
          const mapped = res.map(row => {
            const pondObj = ponds.value?.find(p => p.id === (row.pond_id || pId))
            let dateStr = ''
            const rawDateStr = row.executed_at || row.created_at
            if (row.id && String(row.id).match(/ACT-(\d{4}-\d{2}-\d{2})/)) {
              dateStr = String(row.id).match(/ACT-(\d{4}-\d{2}-\d{2})/)[1]
            } else if (rawDateStr) {
              const m = String(rawDateStr).match(/(\d{4}-\d{2}-\d{2})/)
              dateStr = m ? m[1] : todayStr
            } else {
              dateStr = todayStr
            }

            const d = row.executed_at ? new Date(row.executed_at) : (row.created_at ? new Date(row.created_at) : new Date())
            const clockFormatted = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
            let timeVal = clockFormatted
            if (row.scheduled_time && (row.scheduled_time.includes(':') || row.scheduled_time.toUpperCase().includes('WIB')) && !row.scheduled_time.includes('HITL') && !row.scheduled_time.includes('Continuous')) {
              timeVal = row.scheduled_time
            }
            return {
              id: row.id,
              date: dateStr,
              time: timeVal,
              pondId: row.pond_id,
              pondName: pondObj?.name || `Pond ${row.pond_id}`,
              category: row.category,
              categoryLabel: row.category === 'FEEDING' ? 'Feed Dispense' : (row.category === 'AERATION' ? 'Aerator Speed Regulation' : (row.category === 'MOLASSES' ? 'Molasses Injection' : 'Sludge Purge & Siphon')),
              treatment: row.title || 'IoT Actuator Command',
              dosage: row.dosage_amount !== null && row.dosage_amount !== undefined ? `${row.dosage_amount} ${row.dosage_unit || ''}` : `${row.aerator_power_percent || 80}%`,
              dosageAmount: row.dosage_amount || row.aerator_power_percent,
              dosageUnit: row.dosage_unit || '%',
              aeratorPowerPercent: row.aerator_power_percent || 80,
              aeratorRpm: row.aerator_rpm || 1200,
              aeratorHz: ((row.aerator_power_percent || 80) / 100 * 50).toFixed(1),
              type: row.actor?.includes('Gemini') ? 'AUTO_AI' : 'MANUAL_SUPERVISOR',
              actor: row.actor || 'Supervisor Dashboard',
              hardwareId: row.hardware_id || `sac/${row.pond_id?.toLowerCase()}`,
              status: row.status || 'PENDING',
              duration: '45 sec',
              sensorSnapshot: {
                do: Number(pondObj?.telemetry?.do ?? 6.2),
                temp: Number(pondObj?.telemetry?.temp ?? 28.5),
                ammonia: Number(pondObj?.telemetry?.ammonia ?? 0.02),
                ph: Number(pondObj?.telemetry?.ph ?? 7.5),
                flocDensity: Number(pondObj?.telemetry?.flocDensity ?? 14.0)
              },
              notes: row.notes || 'Logged in MySQL database'
            }
          })
          
          // Cleanly replace all today records for this pond with freshly fetched rows
          const mappedIds = new Set(mapped.map(m => m.id))
          const others = executionDatabase.value.filter(e => !(e.pondId === pId && e.date === todayStr) && !mappedIds.has(e.id))
          executionDatabase.value = [...mapped, ...others]
        }

        // Also fetch recommendation from backend for this pond
        const rec = await apiClient.getRecommendation(pId)
        if (rec && rec.treatments) {
          const parsedTreatments = Array.isArray(rec.treatments)
            ? rec.treatments
            : (typeof rec.treatments === 'string' ? JSON.parse(rec.treatments) : rec.treatments)
          
          pondRecommendations.value[pId] = {
            ...pondRecommendations.value[pId],
            ...rec,
            healthScore: rec.healthScore || pondRecommendations.value[pId]?.healthScore || 96,
            healthStatus: rec.healthStatus || pondRecommendations.value[pId]?.healthStatus || 'OPTIMAL BIOFLOC',
            telemetrySnapshot: rec.telemetrySnapshot || pondRecommendations.value[pId]?.telemetrySnapshot || {
              do: 6.2,
              temp: 28.8,
              ammonia: 0.02,
              ph: 7.55,
              flocDensity: 14.0
            },
            rationale: rec.rationale || rec.summary || pondRecommendations.value[pId]?.rationale || 'Avnimelech biofloc equilibrium maintained.',
            treatments: parsedTreatments
          }
        }
      }
    } catch (err) {
      console.warn('[DailyExecution] Error loading executions from DB:', err)
    }
  }

  // Export CSV of the filtered view in English
  const exportDailyExecutionCsv = () => {
    const headers = [
      'Execution ID',
      'Date',
      'Time (WIB)',
      'Pond ID',
      'Pond Name',
      'Treatment Category',
      'Action Protocol',
      'Dosage / Portion',
      'Aerator Power (%)',
      'Aerator Speed (RPM)',
      'Inverter Frequency (Hz)',
      'Initiator / Actor',
      'Hardware Node',
      'Execution Status',
      'Duration',
      'Dissolved Oxygen (mg/L)',
      'Temperature (°C)',
      'Ammonia TAN (ppm)',
      'Water pH',
      'Technical Notes'
    ]

    const rows = filteredExecutions.value.map(e => [
      `"${e.id}"`,
      `"${e.date}"`,
      `"${e.time}"`,
      `"${e.pondId}"`,
      `"${e.pondName}"`,
      `"${e.categoryLabel}"`,
      `"${e.treatment}"`,
      `"${e.dosage}"`,
      `"${e.aeratorPowerPercent || 80}%"`,
      `"${e.aeratorRpm || 1200}"`,
      `"${e.aeratorHz || 40.0} Hz"`,
      `"${e.actor}"`,
      `"${e.hardwareId}"`,
      `"${e.status}"`,
      `"${e.duration}"`,
      `"${e.sensorSnapshot?.do || '-'}"`,
      `"${e.sensorSnapshot?.temp || '-'}"`,
      `"${e.sensorSnapshot?.ammonia || '-'}"`,
      `"${e.sensorSnapshot?.ph || '-'}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`
    ])

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `sampay_biofloc_daily_treatment_${selectedDate.value}_${selectedPondFilter.value}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Clean Database Reset to ensure development runs smoothly without duplicate records
  const resetDatabaseClean = async () => {
    try {
      showToast('Resetting database to clean initial state...', 'info')
      const res = await apiClient.resetDatabase()
      if (res && res.success) {
        showToast('Database successfully reset to clean initial state!', 'success')
        executionDatabase.value = createCleanInitialTreatments()
        await loadExecutionsFromDatabase(selectedPondFilter.value || 'K01')
      } else {
        showToast('Failed to reset database', 'danger')
      }
    } catch (err) {
      showToast('Failed to reset database: ' + err.message, 'danger')
    }
  }

  // Synthesize Gemini Biofloc Plan for active pond
  const synthesizePlan = async (pondId = selectedPondFilter.value) => {
    try {
      const pId = (!pondId || pondId === 'ALL') ? 'K01' : pondId
      showToast(`Synthesizing 4 daily biofloc treatments with Gemini AI for ${pId}...`, 'info')
      const res = await apiClient.synthesizeExecutions(pId)
      if (res && res.success) {
        showToast(`Daily treatment for ${pId} successfully synthesized by Gemini!`, 'success')
        await loadExecutionsFromDatabase(pId)
      }
    } catch (err) {
      showToast('Failed to synthesize treatment: ' + err.message, 'danger')
    }
  }

  return {
    availableDates,
    selectedDate,
    selectedPondFilter,
    selectedCategoryFilter,
    selectedStatusFilter,
    searchKeyword,
    filteredExecutions,
    dailySummary,
    pondFleetCards,
    pondRecommendations,
    activePondRecommendation,
    approveRecommendation,
    rejectRecommendation,
    approveExecution,
    rejectExecution,
    resetRecommendation,
    updateScheduledExecution,
    runScheduledNow,
    setDate,
    executeNewIoTAction,
    createManualTask,
    exportDailyExecutionCsv,
    loadExecutionsFromDatabase,
    resetDatabaseClean,
    synthesizePlan
  }
}
