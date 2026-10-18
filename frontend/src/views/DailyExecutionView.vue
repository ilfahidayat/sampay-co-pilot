<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { usePonds } from '../composables/usePonds'
import { useDailyExecution } from '../composables/useDailyExecution'
import { useDataSync } from '../composables/useDataSync'
import { 
  Zap, 
  Clock, 
  Utensils, 
  Pipette, 
  Droplets, 
  Search, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  Plus, 
  Check, 
  X, 
  RotateCcw, 
  Fan, 
  Edit3, 
  Sparkles, 
  ChevronRight, 
  ShieldCheck, 
  Activity, 
  Layers,
  Waves,
  RefreshCw,
  Sliders,
  Cpu,
  ListTodo
} from 'lucide-vue-next'

const { ponds } = usePonds()
const { onExecutionUpdated } = useDataSync()
const {
  availableDates,
  selectedDate,
  selectedPondFilter,
  selectedCategoryFilter,
  selectedStatusFilter,
  searchKeyword,
  filteredExecutions,
  dailySummary,
  pondRecommendations,
  activePondRecommendation,
  approveRecommendation,
  rejectRecommendation,
  approveExecution,
  rejectExecution,
  resetRecommendation,
  updateScheduledExecution,
  runScheduledNow,
  createManualTask,
  exportDailyExecutionCsv,
  loadExecutionsFromDatabase,
  resetDatabaseClean,
  synthesizePlan
} = useDailyExecution()

let unbindExecSync = null

onMounted(() => {
  const targetPond = selectedPondFilter.value || 'K01'
  if (!selectedPondFilter.value) selectedPondFilter.value = 'K01'
  loadExecutionsFromDatabase(targetPond)
  unbindExecSync = onExecutionUpdated(() => {
    loadExecutionsFromDatabase(selectedPondFilter.value || 'K01')
  })
})

onUnmounted(() => {
  if (unbindExecSync) unbindExecSync()
})

watch(selectedPondFilter, (newPond) => {
  loadExecutionsFromDatabase(newPond || 'K01')
})

// Active Pond object
const activePond = computed(() => {
  return ponds.value.find(p => p.id === (selectedPondFilter.value || 'K01')) || ponds.value[0] || {
    id: 'K01',
    name: 'Pond 1',
    species: 'Tilapia (Oreochromis niloticus)',
    telemetry: { do: 6.2, temp: 28.5, ammonia: 0.02, ph: 7.5, flocDensity: 14.0 }
  }
})

// Quick Category Filter for the 4 Essential Treatments
const selectedTreatmentType = ref('ALL') // 'ALL' | 'FEEDING' | 'MOLASSES' | 'SIPHON_FLUSH' | 'AERATION'

// Filtered timeline items (Strictly chronological order)
const timelineItems = computed(() => {
  let list = filteredExecutions.value

  if (selectedTreatmentType.value !== 'ALL') {
    list = list.filter(item => item.category === selectedTreatmentType.value)
  }

  // Pure Chronological Sort by Time (e.g. 06:00, 08:00, 10:30, 12:30, 14:30, 17:00)
  return [...list].sort((a, b) => {
    const parseMinutes = (tStr) => {
      if (!tStr) return 9999
      const match = String(tStr).match(/(\d{1,2}):(\d{2})/)
      if (match) return parseInt(match[1], 10) * 60 + parseInt(match[2], 10)
      return 9999
    }
    return parseMinutes(a.time) - parseMinutes(b.time)
  })
})

// Treatment Category Counts
const feedingCount = computed(() => filteredExecutions.value.filter(e => e.category === 'FEEDING').length)
const molassesCount = computed(() => filteredExecutions.value.filter(e => e.category === 'MOLASSES').length)
const siphonCount = computed(() => filteredExecutions.value.filter(e => e.category === 'SIPHON_FLUSH').length)
const aerationCount = computed(() => filteredExecutions.value.filter(e => e.category === 'AERATION').length)

// Status Counts
const completedCount = computed(() => filteredExecutions.value.filter(e => e.status === 'SUCCESS').length)
const runningCount = computed(() => filteredExecutions.value.filter(e => e.status === 'RUNNING').length)
const scheduledCount = computed(() => filteredExecutions.value.filter(e => e.status === 'SCHEDULED' || e.status === 'PENDING').length)
const totalCount = computed(() => filteredExecutions.value.length)

// Active Pond Biological Diagnosis & Prescription Computed
const currentPond = computed(() => {
  const pId = selectedPondFilter.value === 'ALL' ? 'K01' : selectedPondFilter.value
  return ponds.value?.find(p => p.id === pId) || ponds.value?.[0] || {}
})

const currentPondDiagnosis = computed(() => {
  const p = currentPond.value
  const pId = p.id || 'K01'
  const rec = pondRecommendations.value?.[pId] || {}
  const aiAnalysis = p.aiAnalysis || {}
  const summary = rec.summary || rec.rationale || aiAnalysis.summary || 'Water parameters optimal. Heterotrophic microbial consortium operating stably at Avnimelech biofloc baseline.'
  const healthScore = p.healthScore || rec.healthScore || 96
  const healthStatus = p.status || rec.healthStatus || 'OPTIMAL'
  const isEmergency = healthStatus === 'CRITICAL' || p.telemetry?.do < 3.5 || p.telemetry?.ammonia > 0.8
  const isWarning = healthStatus === 'WARNING' || healthStatus === 'CAUTION' || p.telemetry?.do < 5.0 || p.telemetry?.ammonia > 0.05
  return {
    pondId: pId,
    pondName: p.name || `Pond ${pId.replace('K0', '').replace('K', '')}`,
    summary,
    healthScore,
    healthStatus,
    isEmergency,
    isWarning,
    telemetry: p.telemetry || { do: 6.4, ph: 7.5, temp: 28.5, ammonia: 0.02, flocDensity: 14.0 },
    modelUsed: aiAnalysis.modelUsed || 'Gemini 3.8 Flash • Biofloc Specialist'
  }
})

// Visual Identity Helpers for the 4 Treatments
const getTreatmentInfo = (category) => {
  switch (category) {
    case 'FEEDING':
      return {
        label: 'Feed Dispense',
        shortTag: 'FEEDING',
        icon: Utensils,
        badgeClass: 'badge-amber',
        cardClass: 'card-amber',
        dotClass: 'dot-amber',
        accentColor: '#d97706'
      }
    case 'MOLASSES':
      return {
        label: 'Molasses Injection',
        shortTag: 'MOLASSES (C:N)',
        icon: Pipette,
        badgeClass: 'badge-caramel',
        cardClass: 'card-caramel',
        dotClass: 'dot-caramel',
        accentColor: '#b45309'
      }
    case 'SIPHON_FLUSH':
      return {
        label: 'Sludge Purge & Siphon',
        shortTag: 'SIPHON / FLUSH',
        icon: Droplets,
        badgeClass: 'badge-sky',
        cardClass: 'card-sky',
        dotClass: 'dot-sky',
        accentColor: '#0284c7'
      }
    case 'AERATION':
      return {
        label: 'Aerator Speed Regulation',
        shortTag: 'AERATION',
        icon: Fan,
        badgeClass: 'badge-teal',
        cardClass: 'card-teal',
        dotClass: 'dot-teal',
        accentColor: '#0d9488'
      }
    default:
      return {
        label: 'Biofloc Treatment',
        shortTag: 'TREATMENT',
        icon: Zap,
        badgeClass: 'badge-slate',
        cardClass: 'card-slate',
        dotClass: 'dot-slate',
        accentColor: '#64748b'
      }
  }
}

const getStatusBadge = (status) => {
  switch (status) {
    case 'SUCCESS':
      return { label: 'COMPLETED', class: 'status-pill-success' }
    case 'RUNNING':
      return { label: 'RUNNING', class: 'status-pill-running' }
    case 'PENDING':
      return { label: 'PENDING APPROVAL', class: 'status-pill-pending' }
    case 'SCHEDULED':
    default:
      return { label: 'SCHEDULED', class: 'status-pill-scheduled' }
  }
}

const parseTimeParts = (timeStr) => {
  if (!timeStr) return { time: '08:00', tz: 'WIB', period: 'Morning' }
  const clean = String(timeStr).trim()
  const parts = clean.split(' ')
  const time = parts[0] || '08:00'
  const tz = parts[1] || 'WIB'
  
  let period = 'Morning'
  const hour = parseInt(time.split(':')[0], 10)
  if (!isNaN(hour)) {
    if (hour >= 5 && hour < 11) period = 'Morning'
    else if (hour >= 11 && hour < 15) period = 'Midday'
    else if (hour >= 15 && hour < 18) period = 'Evening'
    else period = 'Night'
  }
  return { time, tz, period }
}

// Modal States
const isManualTaskModalOpen = ref(false)
const isAdjustModalOpen = ref(false)
const isDetailModalOpen = ref(false)
const selectedDetailExec = ref(null)

// Adjust Form State
const adjustForm = ref({
  id: '',
  pondId: 'K01',
  pondName: '',
  title: '',
  category: 'FEEDING',
  scheduledTime: '',
  dosageAmount: 5.0,
  dosageUnit: 'kg',
  aeratorPowerPercent: 80,
  aeratorRpm: 1200,
  notes: '',
  status: 'SCHEDULED'
})

const openAdjustTask = (item) => {
  adjustForm.value = {
    id: item.id,
    pondId: item.pondId || selectedPondFilter.value,
    pondName: item.pondName || activePond.value.name,
    title: item.treatment || item.title || 'Treatment Action',
    category: item.category || 'FEEDING',
    scheduledTime: item.time || '12:00 WIB',
    dosageAmount: item.dosageAmount !== undefined ? item.dosageAmount : (item.category === 'AERATION' ? item.aeratorPowerPercent : 5.0),
    dosageUnit: item.dosageUnit || 'kg',
    aeratorPowerPercent: item.aeratorPowerPercent || 80,
    aeratorRpm: item.aeratorRpm || 1200,
    notes: item.notes || '',
    status: item.status === 'PENDING' ? 'SCHEDULED' : item.status
  }
  isAdjustModalOpen.value = true
}

const handleSaveAdjustment = async () => {
  if (!adjustForm.value.id) return
  let dosageText = `${adjustForm.value.dosageAmount} ${adjustForm.value.dosageUnit}`
  if (adjustForm.value.category === 'AERATION') {
    dosageText = `${adjustForm.value.aeratorPowerPercent}% Power (~${adjustForm.value.aeratorRpm} RPM)`
  }

  const ok = await updateScheduledExecution(adjustForm.value.id, {
    time: adjustForm.value.scheduledTime,
    treatment: adjustForm.value.title,
    dosage: dosageText,
    dosageAmount: adjustForm.value.dosageAmount,
    dosageUnit: adjustForm.value.dosageUnit,
    aeratorPowerPercent: adjustForm.value.aeratorPowerPercent,
    aeratorRpm: adjustForm.value.aeratorRpm,
    notes: adjustForm.value.notes
  })
  if (ok) {
    isAdjustModalOpen.value = false
  }
}

// Manual Task Form State (Strictly 4 categories)
const manualForm = ref({
  pondId: 'K01',
  category: 'FEEDING',
  title: '',
  scheduledTime: '12:00 WIB',
  dosageAmount: 5.0,
  dosageUnit: 'kg',
  aeratorPowerPercent: 80,
  aeratorRpm: 1200,
  notes: '',
  status: 'SCHEDULED',
  executeNow: false
})

const openManualTaskModal = () => {
  manualForm.value = {
    pondId: selectedPondFilter.value === 'ALL' ? 'K01' : (selectedPondFilter.value || 'K01'),
    category: 'FEEDING',
    title: 'Manual Supplemental Feed Ration (BioGrow-7)',
    scheduledTime: '14:30 WIB',
    dosageAmount: 5.0,
    dosageUnit: 'kg',
    aeratorPowerPercent: 80,
    aeratorRpm: 1200,
    notes: 'Manual supplemental feeding scheduled by supervisor',
    status: 'SCHEDULED',
    executeNow: false
  }
  isManualTaskModalOpen.value = true
}

const onManualCategoryChange = (cat) => {
  manualForm.value.category = cat
  if (cat === 'FEEDING') {
    manualForm.value.title = 'Manual Feed Dispense (BioGrow-7 Pellets)'
    manualForm.value.dosageAmount = 5.0
    manualForm.value.dosageUnit = 'kg'
  } else if (cat === 'AERATION') {
    manualForm.value.title = 'Manual Aerator Speed Regulation (VFD 85%)'
    manualForm.value.aeratorPowerPercent = 85
    manualForm.value.aeratorRpm = 1275
    manualForm.value.dosageAmount = 85
    manualForm.value.dosageUnit = '%'
  } else if (cat === 'MOLASSES') {
    manualForm.value.title = 'Manual Cane Molasses C:N 15:1 Injection'
    manualForm.value.dosageAmount = 350
    manualForm.value.dosageUnit = 'g'
  } else if (cat === 'SIPHON_FLUSH') {
    manualForm.value.title = 'Manual Bottom Sludge Siphon & Water Refresh'
    manualForm.value.dosageAmount = 200
    manualForm.value.dosageUnit = 'L'
  }
}

const handleCreateManualTask = async (immediate = false) => {
  manualForm.value.executeNow = immediate
  if (immediate) manualForm.value.status = 'RUNNING'

  await createManualTask({
    pondId: manualForm.value.pondId,
    category: manualForm.value.category,
    title: manualForm.value.title,
    dosageAmount: manualForm.value.category === 'AERATION' ? manualForm.value.aeratorPowerPercent : manualForm.value.dosageAmount,
    dosageUnit: manualForm.value.category === 'AERATION' ? '%' : manualForm.value.dosageUnit,
    aeratorPowerPercent: manualForm.value.category === 'AERATION' ? manualForm.value.aeratorPowerPercent : null,
    scheduledTime: immediate ? 'Immediate (Manual)' : manualForm.value.scheduledTime,
    notes: manualForm.value.notes,
    status: manualForm.value.status,
    executeNow: immediate
  })
  isManualTaskModalOpen.value = false
}

// Details Modal
const openDetail = (item) => {
  selectedDetailExec.value = item
  isDetailModalOpen.value = true
}
</script>

<template>
  <div class="treatment-page">
    <!-- TOP HEADER -->
    <header class="treatment-header glass-panel">
      <div class="header-main-row">
        <div class="header-titles">
          <div class="title-with-pill">
            <h1 class="page-title font-display">Daily Treatment</h1>
            <span class="live-status-pill font-mono">
              <span class="pulse-dot"></span>
              DAILY TIMELINE • {{ availableDates[0]?.subLabel || '18 Oct 2026' }}
            </span>
          </div>
          <p class="page-subtitle">
            Core 4 essential biofloc treatments: 3x Feed Dispense, Molasses C:N 15:1 Balancing, Water Exchange & Siphon, and Aerator Speed Control.
          </p>
        </div>

        <div class="header-actions">
          <!-- Reset Database Button -->
          <button 
            id="btn-reset-db"
            class="btn-header-danger font-mono"
            @click="resetDatabaseClean"
            title="Reset database to clean initial state (Clears duplicate runs)"
          >
            <RotateCcw :size="13" />
            <span>Reset Clean Data</span>
          </button>

          <!-- Gemini Synthesize Button -->
          <button 
            id="btn-gemini-plan"
            class="btn-header-ai font-mono"
            @click="synthesizePlan(selectedPondFilter)"
            title="Synthesize 4-treatment schedule with Gemini AI"
          >
            <Sparkles :size="13" />
            <span>Generate Gemini Plan</span>
          </button>

          <!-- Export CSV -->
          <button 
            id="btn-export-csv"
            class="btn-header-secondary font-mono"
            @click="exportDailyExecutionCsv"
            title="Export CSV audit trail"
          >
            <Download :size="13" />
            <span>Export CSV</span>
          </button>

          <!-- New Manual Task -->
          <button 
            id="btn-new-task"
            class="btn-header-primary font-mono"
            @click="openManualTaskModal"
          >
            <Plus :size="14" />
            <span>+ Manual Treatment</span>
          </button>
        </div>
      </div>

      <!-- POND SELECTOR BAR -->
      <div class="pond-selector-row">
        <div class="pond-nav-left font-mono">
          <Droplets :size="14" class="text-sky" />
          <span>Filter Pond:</span>
        </div>

        <div class="pond-pills-list">
          <button 
            id="tab-pond-all"
            class="pond-pill font-mono"
            :class="{ active: selectedPondFilter === 'ALL' }"
            @click="selectedPondFilter = 'ALL'"
          >
            <span class="font-bold">ALL PONDS</span>
            <span class="pond-chip-count font-bold">({{ ponds.length }})</span>
          </button>

          <button 
            v-for="p in ponds" 
            :key="p.id"
            :id="'tab-pond-' + p.id"
            class="pond-pill font-mono"
            :class="{ active: selectedPondFilter === p.id }"
            @click="selectedPondFilter = p.id"
          >
            <span class="font-bold">{{ p.id }}</span>
            <span class="pond-chip-name">{{ p.name.split('—')[1] || p.name }}</span>
          </button>
        </div>
      </div>

      <!-- TREATMENT CATEGORY QUICK-FILTER STRIP -->
      <div class="treatment-filter-strip">
        <div class="filter-chips-wrap font-mono">
          <button 
            class="filter-chip font-bold"
            :class="{ active: selectedTreatmentType === 'ALL' }"
            @click="selectedTreatmentType = 'ALL'"
          >
            <span>All Treatments</span>
            <span class="chip-count">{{ totalCount }}</span>
          </button>

          <button 
            class="filter-chip chip-amber font-bold"
            :class="{ active: selectedTreatmentType === 'FEEDING' }"
            @click="selectedTreatmentType === 'FEEDING'"
          >
            <Utensils :size="12" />
            <span>🌾 Feeding (3x)</span>
            <span class="chip-count count-amber">{{ feedingCount }}</span>
          </button>

          <button 
            class="filter-chip chip-caramel font-bold"
            :class="{ active: selectedTreatmentType === 'MOLASSES' }"
            @click="selectedTreatmentType === 'MOLASSES'"
          >
            <Pipette :size="12" />
            <span>🍯 Molasses C:N</span>
            <span class="chip-count count-caramel">{{ molassesCount }}</span>
          </button>

          <button 
            class="filter-chip chip-sky font-bold"
            :class="{ active: selectedTreatmentType === 'SIPHON_FLUSH' }"
            @click="selectedTreatmentType === 'SIPHON_FLUSH'"
          >
            <Droplets :size="12" />
            <span>💧 Sludge Siphon</span>
            <span class="chip-count count-sky">{{ siphonCount }}</span>
          </button>

          <button 
            class="filter-chip chip-teal font-bold"
            :class="{ active: selectedTreatmentType === 'AERATION' }"
            @click="selectedTreatmentType === 'AERATION'"
          >
            <Fan :size="12" />
            <span>🌀 Aerator Speed</span>
            <span class="chip-count count-teal">{{ aerationCount }}</span>
          </button>
        </div>

        <!-- Search Input -->
        <div class="search-wrap">
          <Search :size="13" class="search-icon" />
          <input 
            v-model="searchKeyword" 
            type="text" 
            placeholder="Search feeding, molasses, dosage, pond..." 
            class="search-input font-mono"
          />
          <button v-if="searchKeyword" class="btn-clear" @click="searchKeyword = ''">
            <X :size="11" />
          </button>
        </div>
      </div>
    </header>

    <!-- METRICS SUMMARY STRIP (4 COMPACT CARDS) -->
    <section class="summary-cards-grid">
      <div class="metric-card glass-panel">
        <div class="metric-left">
          <span class="metric-label font-mono">TOTAL TREATMENTS</span>
          <span class="metric-val font-mono">{{ totalCount }}</span>
          <span class="metric-sub font-mono">4 Core Biofloc Pillars</span>
        </div>
        <div class="metric-icon-wrap slate">
          <Layers :size="18" />
        </div>
      </div>

      <div class="metric-card glass-panel">
        <div class="metric-left">
          <span class="metric-label font-mono text-emerald">COMPLETED</span>
          <span class="metric-val font-mono text-emerald">{{ completedCount }}</span>
          <span class="metric-sub font-mono">Recorded in Telemetry</span>
        </div>
        <div class="metric-icon-wrap emerald">
          <CheckCircle2 :size="18" />
        </div>
      </div>

      <div class="metric-card glass-panel">
        <div class="metric-left">
          <span class="metric-label font-mono text-sky">IN PROGRESS</span>
          <span class="metric-val font-mono text-sky">{{ runningCount }}</span>
          <span class="metric-sub font-mono">Actuators Active on Pond</span>
        </div>
        <div class="metric-icon-wrap sky">
          <Zap :size="18" />
        </div>
      </div>

      <div class="metric-card glass-panel">
        <div class="metric-left">
          <span class="metric-label font-mono text-amber">SCHEDULED / STANDBY</span>
          <span class="metric-val font-mono text-amber">{{ scheduledCount }}</span>
          <span class="metric-sub font-mono">Next Scheduled Automation</span>
        </div>
        <div class="metric-icon-wrap amber">
          <Clock :size="18" />
        </div>
      </div>
    </section>

    <!-- AI BIOFLOC DIAGNOSIS & PRESCRIPTION CARD -->
    <section class="ai-diagnosis-banner glass-panel">
      <div class="ai-banner-top">
        <div class="ai-banner-left">
          <div class="ai-title-wrap">
            <span class="ai-icon-badge">
              <Sparkles :size="16" class="text-amber" />
            </span>
            <div class="ai-title-texts">
              <div class="ai-header-row font-mono">
                <span class="ai-kicker font-bold">AI BIOFLOC SPECIALIST DIAGNOSIS & PRESCRIPTION</span>
                <span class="ai-model-tag">{{ currentPondDiagnosis.modelUsed }}</span>
                <span class="ai-mode-tag">Scheduled Automation (Auto-Approved)</span>
              </div>
              <h3 class="ai-pond-name font-display">
                {{ currentPondDiagnosis.pondName }} ({{ currentPondDiagnosis.pondId }})
              </h3>
            </div>
          </div>
        </div>

        <div class="ai-banner-right font-mono">
          <div class="ai-score-box" :class="currentPondDiagnosis.isEmergency ? 'box-danger' : (currentPondDiagnosis.isWarning ? 'box-warning' : 'box-optimal')">
            <span class="score-label">HEALTH SCORE</span>
            <span class="score-num font-bold">{{ currentPondDiagnosis.healthScore }}<span class="score-den">/100</span></span>
            <span class="score-status font-bold">{{ currentPondDiagnosis.healthStatus }}</span>
          </div>
        </div>
      </div>

      <!-- AI Diagnosis Narrative / Rationale -->
      <div class="ai-rationale-box font-mono">
        <p class="ai-rationale-text">
          <span class="ai-quote">“</span>{{ currentPondDiagnosis.summary }}<span class="ai-quote">”</span>
        </p>
      </div>

      <!-- Telemetry Parameters Snapshot Strip -->
      <div class="ai-telemetry-strip font-mono">
        <div class="telem-badge">
          <span class="telem-lbl">DO:</span>
          <span class="telem-val" :class="{ 'val-alert': currentPondDiagnosis.telemetry.do < 4.0 }">{{ Number(currentPondDiagnosis.telemetry.do || 6.2).toFixed(2) }} mg/L</span>
        </div>
        <div class="telem-badge">
          <span class="telem-lbl">pH:</span>
          <span class="telem-val">{{ Number(currentPondDiagnosis.telemetry.ph || 7.5).toFixed(2) }}</span>
        </div>
        <div class="telem-badge">
          <span class="telem-lbl">Temp:</span>
          <span class="telem-val">{{ Number(currentPondDiagnosis.telemetry.temp || 28.5).toFixed(1) }} °C</span>
        </div>
        <div class="telem-badge">
          <span class="telem-lbl">TAN Ammonia:</span>
          <span class="telem-val" :class="{ 'val-alert': currentPondDiagnosis.telemetry.ammonia > 0.1 }">{{ Number(currentPondDiagnosis.telemetry.ammonia || 0.02).toFixed(3) }} ppm</span>
        </div>
        <div class="telem-badge">
          <span class="telem-lbl">Imhoff Floc:</span>
          <span class="telem-val">{{ Number(currentPondDiagnosis.telemetry.flocDensity || 14.0).toFixed(1) }} mL/L</span>
        </div>
        <div class="telem-sync-note ml-auto">
          <span class="sync-dot"></span>
          <span>Automatically updated from real-time telemetry</span>
        </div>
      </div>

      <!-- Emergency Alert Strip (if hazard detected) -->
      <div v-if="currentPondDiagnosis.isEmergency" class="ai-emergency-alert font-mono">
        <AlertTriangle :size="16" class="emergency-icon" />
        <div class="emergency-text">
          <strong>EMERGENCY ALERT:</strong> Biological parameters exceed safe thresholds. Immediate emergency aeration or sludge siphon intervention recommended!
        </div>
        <button class="btn-emergency-action" @click="runScheduledNow('ACT-' + availableDates[0]?.date + '-' + currentPondDiagnosis.pondId + '-01')">
          <Zap :size="13" />
          <span>Bypass Aerator 100%</span>
        </button>
      </div>
    </section>

    <!-- DAILY TODO LIST TABLE SECTION -->
    <section class="todo-table-workspace">
      <div class="todo-section-head">
        <div class="section-title-wrap">
          <ListTodo :size="18" class="text-emerald" />
          <h2 class="section-heading font-display">Biofloc Treatment Execution Checklist</h2>
          <span class="todo-count-pill font-mono">{{ timelineItems.length }} Scheduled Items</span>
          <span v-if="completedCount > 0" class="todo-completed-pill font-mono">{{ completedCount }} Completed</span>
        </div>
        <span class="section-info-txt font-mono">Structured checklist workflow with prominent execution timestamps on the left</span>
      </div>

      <!-- EMPTY STATE -->
      <div v-if="timelineItems.length === 0" class="empty-todo-card glass-panel font-mono">
        <AlertTriangle :size="24" class="text-amber mb-2" />
        <p class="empty-title">No treatments found for this filter.</p>
        <p class="empty-sub">Click "Generate Gemini Plan" to compose an automated schedule or add manually.</p>
        <button class="btn-header-ai mt-3 font-mono" @click="synthesizePlan(selectedPondFilter)">
          <Sparkles :size="14" />
          <span>Generate Treatment Schedule with Gemini</span>
        </button>
      </div>

      <!-- TODO LIST TABLE -->
      <div v-else class="todo-table-card glass-panel">
        <!-- Table Header -->
        <div class="todo-table-header font-mono">
          <div class="th-col th-time">EXECUTION TIME</div>
          <div class="th-col th-check">TODO</div>
          <div class="th-col th-pond">POND & CATEGORY</div>
          <div class="th-col th-treatment">TREATMENT & TARGET DOSAGE</div>
          <div class="th-col th-actor">ACTOR</div>
          <div class="th-col th-action">STATUS & ACTIONS</div>
        </div>

        <!-- Table Rows -->
        <div class="todo-table-body">
          <article 
            v-for="(item, idx) in timelineItems" 
            :key="item.id || idx"
            class="todo-table-row"
            :class="[
              getTreatmentInfo(item.category).cardClass, 
              { 
                'is-completed': item.status === 'SUCCESS', 
                'is-running': item.status === 'RUNNING',
                'is-pending': item.status === 'PENDING'
              }
            ]"
          >
            <!-- 1. Execution Time (LARGE ON LEFT) -->
            <div class="td-col td-time font-mono">
              <div class="time-large-box">
                <span class="time-large-val font-bold">{{ parseTimeParts(item.time).time }}</span>
                <div class="time-meta-badges">
                  <span class="time-tz-badge">{{ parseTimeParts(item.time).tz }}</span>
                  <span class="time-period-badge">{{ parseTimeParts(item.time).period }}</span>
                </div>
              </div>
            </div>

            <!-- 2. Todo Checkbox Indicator -->
            <div class="td-col td-check">
              <!-- If SUCCESS: emerald check circle -->
              <div v-if="item.status === 'SUCCESS'" class="todo-check-btn done" title="Treatment executed successfully">
                <Check :size="16" stroke-width="3" />
              </div>
              <!-- If RUNNING: pulsating sky spinner -->
              <div v-else-if="item.status === 'RUNNING'" class="todo-check-btn running" title="IoT actuator is actively running...">
                <RefreshCw :size="15" class="animate-spin" />
              </div>
              <!-- If PENDING: amber review toggle -->
              <button 
                v-else-if="item.status === 'PENDING'" 
                class="todo-check-btn pending" 
                @click="approveExecution(item.id)" 
                title="Click to approve this recommendation"
              >
                <Check :size="14" stroke-width="2.5" />
              </button>
              <!-- If SCHEDULED: clickable run-now button -->
              <button 
                v-else 
                class="todo-check-btn scheduled" 
                @click="runScheduledNow(item.id)" 
                title="Click to execute this schedule now"
              >
                <Zap :size="14" stroke-width="2.5" />
              </button>
            </div>

            <!-- 3. Pond & Category -->
            <div class="td-col td-pond">
              <div class="pond-pill font-mono">
                <span class="pond-id font-bold">{{ item.pondId }}</span>
                <span class="pond-sep">•</span>
                <span class="pond-name">{{ item.pondName }}</span>
              </div>
              <span class="treatment-category-badge font-mono mt-1" :class="getTreatmentInfo(item.category).badgeClass">
                <component :is="getTreatmentInfo(item.category).icon" :size="12" />
                <span>{{ getTreatmentInfo(item.category).shortTag }}</span>
              </span>
            </div>

            <!-- 4. Treatment & Target Dosage (Main Todo Item) -->
            <div class="td-col td-treatment">
              <div class="treatment-title-wrap">
                <h3 class="treatment-title font-display" :class="{ 'title-done': item.status === 'SUCCESS' }">
                  {{ item.treatment || item.title }}
                </h3>
              </div>

              <!-- Dosage / Setting Highlight Pill -->
              <div class="dosage-wrap mt-1">
                <span class="dosage-tag-pill font-mono">
                  <span class="dosage-kicker font-bold">DOSAGE:</span>
                  <span class="dosage-value font-bold">{{ item.dosage }}</span>
                  <span v-if="item.category === 'AERATION' && item.aeratorRpm" class="dosage-subtext font-mono">
                    (~{{ item.aeratorRpm }} RPM • {{ item.aeratorHz || 40 }} Hz)
                  </span>
                </span>
              </div>

              <!-- Biological SOP Rationale / Explanation -->
              <div v-if="item.notes" class="treatment-notes font-mono">
                <span class="notes-bullet">•</span>
                <span class="notes-text">{{ item.notes }}</span>
              </div>
            </div>

            <!-- 5. Actor & Hardware -->
            <div class="td-col td-actor font-mono">
              <div class="actor-info">
                <ShieldCheck :size="13" class="text-emerald" />
                <span class="actor-name font-bold">{{ item.actor || 'AI Copilot' }}</span>
              </div>
              <div class="hardware-info text-muted">
                <Cpu :size="11" />
                <span class="hardware-id">{{ item.hardwareId || 'sac/actuator' }}</span>
              </div>
            </div>

            <!-- 6. Status & Action Buttons -->
            <div class="td-col td-action">
              <div class="action-cell-top">
                <!-- Status Pill -->
                <span class="status-badge font-mono" :class="getStatusBadge(item.status).class">
                  <span v-if="item.status === 'RUNNING'" class="status-running-dot"></span>
                  <CheckCircle2 v-else-if="item.status === 'SUCCESS'" :size="11" />
                  <Clock v-else :size="11" />
                  <span>{{ getStatusBadge(item.status).label }}</span>
                </span>

                <!-- Completed Timestamp Badge -->
                <span v-if="item.status === 'SUCCESS'" class="completed-time-tag font-mono">
                  <CheckCircle2 :size="11" class="text-emerald" />
                  <span>{{ item.time }}</span>
                </span>
              </div>

              <!-- Action Buttons Strip -->
              <div class="action-buttons-strip">
                <!-- If PENDING, show Approve -->
                <button 
                  v-if="item.status === 'PENDING'"
                  class="btn-action-primary font-mono"
                  @click="approveExecution(item.id)"
                  title="Approve this treatment execution"
                >
                  <Check :size="12" />
                  <span>Approve</span>
                </button>

                <!-- If SCHEDULED, show Run Now -->
                <button 
                  v-if="item.status === 'SCHEDULED'"
                  class="btn-action-run font-mono"
                  @click="runScheduledNow(item.id)"
                  title="Execute now on IoT actuator"
                >
                  <Zap :size="12" />
                  <span>Run Now</span>
                </button>

                <!-- Adjust Button -->
                <button 
                  v-if="item.status !== 'SUCCESS'"
                  class="btn-action-adjust font-mono"
                  @click="openAdjustTask(item)"
                  title="Adjust schedule or dosage"
                >
                  <Edit3 :size="12" />
                  <span>Adjust</span>
                </button>

                <!-- Details Button -->
                <button 
                  class="btn-action-detail font-mono"
                  @click="openDetail(item)"
                  title="View telemetry snapshot details"
                >
                  <Eye :size="12" />
                  <span>Details</span>
                </button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- MODAL 1: NEW MANUAL TASK / ACTION (Strictly 4 Categories) -->
    <div v-if="isManualTaskModalOpen" class="modal-backdrop" @click.self="isManualTaskModalOpen = false">
      <div class="modal-dialog glass-panel">
        <div class="modal-head">
          <div class="modal-head-title">
            <Plus :size="18" class="text-sky" />
            <h2 class="font-display">New Manual Treatment</h2>
          </div>
          <button class="btn-modal-close" @click="isManualTaskModalOpen = false">
            <X :size="16" />
          </button>
        </div>

        <div class="modal-content-body">
          <!-- Target Pond -->
          <div class="form-item">
            <label class="form-label font-mono">Target Pond</label>
            <div class="pond-select-grid">
              <button 
                v-for="p in ponds" 
                :key="p.id"
                type="button"
                class="pond-select-btn font-mono"
                :class="{ active: manualForm.pondId === p.id }"
                @click="manualForm.pondId = p.id"
              >
                {{ p.id }} ({{ p.name.split('—')[1] || p.name }})
              </button>
            </div>
          </div>

          <!-- Category Selection: Strictly 4 Categories -->
          <div class="form-item">
            <label class="form-label font-mono">Treatment Category (4 Biofloc Pillars)</label>
            <div class="cat-grid-4">
              <button 
                type="button" 
                class="cat-select-btn cat-amber font-mono" 
                :class="{ active: manualForm.category === 'FEEDING' }"
                @click="onManualCategoryChange('FEEDING')"
              >
                <Utensils :size="15" />
                <span class="cat-btn-title">1. Feed Dispense</span>
                <span class="cat-btn-sub">BioGrow-7 Pellets</span>
              </button>

              <button 
                type="button" 
                class="cat-select-btn cat-caramel font-mono" 
                :class="{ active: manualForm.category === 'MOLASSES' }"
                @click="onManualCategoryChange('MOLASSES')"
              >
                <Pipette :size="15" />
                <span class="cat-btn-title">2. Molasses Injection</span>
                <span class="cat-btn-sub">C:N 15:1 Balancing</span>
              </button>

              <button 
                type="button" 
                class="cat-select-btn cat-sky font-mono" 
                :class="{ active: manualForm.category === 'SIPHON_FLUSH' }"
                @click="onManualCategoryChange('SIPHON_FLUSH')"
              >
                <Droplets :size="15" />
                <span class="cat-btn-title">3. Water Exchange & Siphon</span>
                <span class="cat-btn-sub">Bottom Sludge Purge</span>
              </button>

              <button 
                type="button" 
                class="cat-select-btn cat-teal font-mono" 
                :class="{ active: manualForm.category === 'AERATION' }"
                @click="onManualCategoryChange('AERATION')"
              >
                <Fan :size="15" />
                <span class="cat-btn-title">4. Aerator Speed Control</span>
                <span class="cat-btn-sub">VFD Inverter Lock</span>
              </button>
            </div>
          </div>

          <!-- Title -->
          <div class="form-item">
            <label class="form-label font-mono">Action Title</label>
            <input 
              v-model="manualForm.title" 
              type="text" 
              class="form-field-input" 
              placeholder="e.g. Feeding Session #2"
            />
          </div>

          <!-- Aerator Speed or Dosage -->
          <div v-if="manualForm.category === 'AERATION'" class="form-item">
            <div class="flex-between mb-1">
              <label class="form-label font-mono">Target Aerator Speed Power (%)</label>
              <span class="font-mono text-teal font-bold">{{ manualForm.aeratorPowerPercent }}% (~{{ Math.round(manualForm.aeratorPowerPercent * 15) }} RPM)</span>
            </div>
            <input 
              v-model.number="manualForm.aeratorPowerPercent" 
              type="range" 
              min="50" 
              max="100" 
              step="5"
              class="range-slider"
              @input="manualForm.aeratorRpm = Math.round(manualForm.aeratorPowerPercent * 15)"
            />
          </div>

          <div v-else class="form-grid-2">
            <div class="form-item">
              <label class="form-label font-mono">Amount / Dosage</label>
              <input 
                v-model.number="manualForm.dosageAmount" 
                type="number" 
                step="0.1" 
                class="form-field-input font-mono"
              />
            </div>
            <div class="form-item">
              <label class="form-label font-mono">Unit</label>
              <input 
                v-model="manualForm.dosageUnit" 
                type="text" 
                class="form-field-input font-mono"
              />
            </div>
          </div>

          <!-- Time & Notes -->
          <div class="form-grid-2">
            <div class="form-item">
              <label class="form-label font-mono">Scheduled Time</label>
              <input 
                v-model="manualForm.scheduledTime" 
                type="text" 
                class="form-field-input font-mono"
                placeholder="08:00 WIB"
              />
            </div>
            <div class="form-item">
              <label class="form-label font-mono">SOP Notes</label>
              <input 
                v-model="manualForm.notes" 
                type="text" 
                class="form-field-input" 
                placeholder="Additional supervisor instructions..."
              />
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-modal-secondary font-mono" @click="isManualTaskModalOpen = false">Cancel</button>
          <button class="btn-modal-primary font-mono" @click="handleCreateManualTask(false)">Schedule Treatment</button>
          <button class="btn-modal-action-now font-mono" @click="handleCreateManualTask(true)">
            <Zap :size="13" />
            <span>Run Now</span>
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL 2: ADJUST TASK / ACTION -->
    <div v-if="isAdjustModalOpen" class="modal-backdrop" @click.self="isAdjustModalOpen = false">
      <div class="modal-dialog glass-panel">
        <div class="modal-head">
          <div class="modal-head-title">
            <Edit3 :size="18" class="text-amber" />
            <h2 class="font-display">Adjust Treatment: {{ adjustForm.title }}</h2>
          </div>
          <button class="btn-modal-close" @click="isAdjustModalOpen = false">
            <X :size="16" />
          </button>
        </div>

        <div class="modal-content-body">
          <div class="form-item">
            <label class="form-label font-mono">Scheduled Execution Time</label>
            <input 
              v-model="adjustForm.scheduledTime" 
              type="text" 
              class="form-field-input font-mono"
            />
          </div>

          <!-- Aerator Speed or Dosage Amount -->
          <div v-if="adjustForm.category === 'AERATION'" class="form-item">
            <div class="flex-between mb-1">
              <label class="form-label font-mono">Aerator VFD Power Speed (%)</label>
              <span class="font-mono text-teal font-bold">{{ adjustForm.aeratorPowerPercent }}% (~{{ Math.round(adjustForm.aeratorPowerPercent * 15) }} RPM)</span>
            </div>
            <input 
              v-model.number="adjustForm.aeratorPowerPercent" 
              type="range" 
              min="50" 
              max="100" 
              step="5"
              class="range-slider"
              @input="adjustForm.aeratorRpm = Math.round(adjustForm.aeratorPowerPercent * 15); adjustForm.dosageAmount = adjustForm.aeratorPowerPercent"
            />
          </div>

          <div v-else class="form-grid-2">
            <div class="form-item">
              <label class="form-label font-mono">Amount / Target Dosage</label>
              <input 
                v-model.number="adjustForm.dosageAmount" 
                type="number" 
                step="0.1" 
                class="form-field-input font-mono"
              />
            </div>
            <div class="form-item">
              <label class="form-label font-mono">Unit</label>
              <input 
                v-model="adjustForm.dosageUnit" 
                type="text" 
                class="form-field-input font-mono"
              />
            </div>
          </div>

          <div class="form-item">
            <label class="form-label font-mono">SOP Notes / Biological Rationale</label>
            <textarea 
              v-model="adjustForm.notes" 
              rows="3" 
              class="form-field-textarea"
            ></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-modal-secondary font-mono" @click="isAdjustModalOpen = false">Cancel</button>
          <button class="btn-modal-primary font-mono" @click="handleSaveAdjustment">Save Changes</button>
        </div>
      </div>
    </div>

    <!-- MODAL 3: DETAIL AUDIT VIEW -->
    <div v-if="isDetailModalOpen && selectedDetailExec" class="modal-backdrop" @click.self="isDetailModalOpen = false">
      <div class="modal-dialog glass-panel">
        <div class="modal-head">
          <div class="modal-head-title">
            <Eye :size="18" class="text-sky" />
            <h2 class="font-display">Treatment Snapshot Details #{{ selectedDetailExec.id }}</h2>
          </div>
          <button class="btn-modal-close" @click="isDetailModalOpen = false">
            <X :size="16" />
          </button>
        </div>

        <div class="modal-content-body">
          <div class="detail-overview-grid">
            <div class="detail-box">
              <span class="detail-label font-mono">POND</span>
              <span class="detail-value font-mono">{{ selectedDetailExec.pondId }} — {{ selectedDetailExec.pondName }}</span>
            </div>
            <div class="detail-box">
              <span class="detail-label font-mono">TREATMENT CATEGORY</span>
              <span class="detail-value font-mono">{{ selectedDetailExec.categoryLabel || selectedDetailExec.category }}</span>
            </div>
            <div class="detail-box">
              <span class="detail-label font-mono">TARGET DOSAGE / SETTING</span>
              <span class="detail-value font-mono text-emerald font-bold">{{ selectedDetailExec.dosage }}</span>
            </div>
            <div class="detail-box">
              <span class="detail-label font-mono">LATEST STATUS</span>
              <span class="detail-value font-mono font-bold">{{ selectedDetailExec.status }}</span>
            </div>
          </div>

          <div v-if="selectedDetailExec.sensorSnapshot" class="telemetry-snapshot-box mt-3">
            <span class="snapshot-header font-mono">BIOFLOC SENSOR SNAPSHOT AT EXECUTION:</span>
            <div class="snapshot-metrics font-mono">
              <span><strong>DO:</strong> {{ selectedDetailExec.sensorSnapshot.do }} mg/L</span>
              <span><strong>pH:</strong> {{ selectedDetailExec.sensorSnapshot.ph }}</span>
              <span><strong>Temp:</strong> {{ selectedDetailExec.sensorSnapshot.temp }} °C</span>
              <span><strong>TAN:</strong> {{ selectedDetailExec.sensorSnapshot.ammonia }} ppm</span>
              <span><strong>Floc:</strong> {{ selectedDetailExec.sensorSnapshot.flocDensity }} mL/L</span>
            </div>
          </div>

          <div class="detail-notes-box mt-3 font-mono">
            <span class="notes-header">NOTES & BIOLOGICAL RATIONALE:</span>
            <p class="notes-body">{{ selectedDetailExec.notes || 'No specific notes.' }}</p>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-modal-secondary font-mono" @click="isDetailModalOpen = false">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.treatment-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 40px;
}

/* Glass Panel Base */
.glass-panel {
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-subtle, #e2e8f0);
  border-radius: 12px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.04);
}

/* Header Card */
.treatment-header {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.header-main-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 14px;
}

.title-with-pill {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.page-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--text-primary, #0f172a);
  margin: 0;
  letter-spacing: -0.02em;
}

.live-status-pill {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 3px 9px;
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
}

.page-subtitle {
  font-size: 0.76rem;
  color: var(--text-muted, #64748b);
  margin: 4px 0 0 0;
  line-height: 1.4;
}

.header-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.btn-header-danger {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 6px 11px;
  border-radius: 7px;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  color: #be123c;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s ease;
}

.btn-header-danger:hover {
  background: #ffe4e6;
  border-color: #fda4af;
  transform: translateY(-1px);
}

.btn-header-ai {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 6px 12px;
  border-radius: 7px;
  background: #f0fdf4;
  border: 1px solid #86efac;
  color: #15803d;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s ease;
}

.btn-header-ai:hover {
  background: #dcfce7;
  transform: translateY(-1px);
}

.btn-header-secondary {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 6px 11px;
  border-radius: 7px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #334155;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-header-secondary:hover {
  background: #f1f5f9;
}

.btn-header-primary {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 6px 12px;
  border-radius: 7px;
  background: #0284c7;
  border: 1px solid #0284c7;
  color: #ffffff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 1px 2px rgba(2, 132, 199, 0.2);
}

.btn-header-primary:hover {
  background: #0369a1;
}

/* Pond Selector Bar */
.pond-selector-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border-subtle, #f1f5f9);
}

.pond-nav-left {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.70rem;
  font-weight: 700;
  color: var(--text-muted, #64748b);
}

.pond-pills-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.pond-pill {
  font-size: 0.68rem;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #334155;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s ease;
}

.pond-pill:hover {
  background: #f1f5f9;
}

.pond-pill.active {
  background: #0284c7;
  border-color: #0284c7;
  color: #ffffff;
}

.pond-chip-count {
  font-size: 0.62rem;
  opacity: 0.9;
}

.pond-chip-name {
  font-size: 0.64rem;
  opacity: 0.85;
}

/* Treatment Quick Filter Strip */
.treatment-filter-strip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding-top: 6px;
}

.filter-chips-wrap {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.filter-chip {
  font-size: 0.66rem;
  padding: 4px 9px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #334155;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: all 0.15s ease;
}

.filter-chip.active {
  background: #0f172a;
  border-color: #0f172a;
  color: #ffffff;
}

.chip-count {
  font-size: 0.60rem;
  padding: 1px 5px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #475569;
}

.filter-chip.active .chip-count {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.count-amber { background: #fef3c7; color: #92400e; }
.count-caramel { background: #fef3c7; color: #78350f; }
.count-sky { background: #e0f2fe; color: #0369a1; }
.count-teal { background: #ccfbf1; color: #0f766e; }

.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 240px;
}

.search-icon {
  position: absolute;
  left: 9px;
  color: #94a3b8;
  pointer-events: none;
}

.search-input {
  width: 100%;
  font-size: 0.68rem;
  padding: 5px 26px 5px 28px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #f8fafc;
  color: #0f172a;
}

.search-input:focus {
  outline: none;
  border-color: #0284c7;
  background: #ffffff;
}

.btn-clear {
  position: absolute;
  right: 6px;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
}

/* Metrics Summary Strip */
.summary-cards-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

@media (max-width: 900px) {
  .summary-cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 540px) {
  .summary-cards-grid {
    grid-template-columns: 1fr;
  }
}

.metric-card {
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.metric-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-label {
  font-size: 0.62rem;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.04em;
}

.metric-val {
  font-size: 1.45rem;
  font-weight: 800;
  line-height: 1.1;
  color: #0f172a;
}

.metric-sub {
  font-size: 0.62rem;
  color: #94a3b8;
}

.metric-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.metric-icon-wrap.slate { background: #f1f5f9; color: #475569; }
.metric-icon-wrap.emerald { background: #ecfdf5; color: #059669; }
.metric-icon-wrap.sky { background: #f0f9ff; color: #0284c7; }
.metric-icon-wrap.amber { background: #fffbeb; color: #d97706; }

/* ==========================================
   AI DIAGNOSIS & BIOFLOC PRESCRIPTION BANNER
   ========================================== */
.ai-diagnosis-banner {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.95) 0%, rgba(240, 249, 255, 0.8) 100%);
  border: 1px solid rgba(2, 132, 199, 0.22);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.ai-banner-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.ai-banner-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-icon-badge {
  width: 38px;
  height: 38px;
  border-radius: 9px;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ai-title-texts {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.ai-header-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.ai-kicker {
  font-size: 0.65rem;
  letter-spacing: 0.05em;
  color: #d97706;
}

.ai-model-tag, .ai-mode-tag {
  font-size: 0.60rem;
  padding: 2px 7px;
  border-radius: 4px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  color: #475569;
}

.ai-mode-tag {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.25);
  color: #059669;
  font-weight: 700;
}

.ai-pond-name {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
}

.ai-score-box {
  padding: 6px 14px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid transparent;
}

.box-optimal {
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.25);
  color: #059669;
}

.box-warning {
  background: rgba(245, 158, 11, 0.08);
  border-color: rgba(245, 158, 11, 0.25);
  color: #d97706;
}

.box-danger {
  background: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.25);
  color: #dc2626;
}

.score-label {
  font-size: 0.60rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.score-num {
  font-size: 1.15rem;
}

.score-den {
  font-size: 0.70rem;
  color: #94a3b8;
}

.score-status {
  font-size: 0.68rem;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.04);
}

.ai-rationale-box {
  padding: 10px 14px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(226, 232, 240, 0.9);
}

.ai-rationale-text {
  font-size: 0.76rem;
  color: #334155;
  line-height: 1.5;
  margin: 0;
}

.ai-quote {
  color: #0284c7;
  font-weight: 800;
}

.ai-telemetry-strip {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 2px;
}

.telem-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: 5px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  font-size: 0.68rem;
}

.telem-lbl {
  color: #64748b;
}

.telem-val {
  font-weight: 700;
  color: #0f172a;
}

.val-alert {
  color: #dc2626 !important;
  font-weight: 800;
}

.telem-sync-note {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.64rem;
  color: #64748b;
}

.sync-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
  animation: pulse-dot 2s infinite;
}

.ai-emergency-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #b91c1c;
  font-size: 0.72rem;
}

.emergency-icon {
  color: #ef4444;
  flex-shrink: 0;
}

.emergency-text {
  flex: 1;
}

.btn-emergency-action {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 5px 10px;
  border-radius: 6px;
  background: #dc2626;
  border: 1px solid #b91c1c;
  color: #ffffff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.btn-emergency-action:hover {
  background: #b91c1c;
}

/* ==========================================
   DAILY TODO LIST TABLE WORKSPACE
   ========================================== */
.todo-table-workspace {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.todo-section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 4px;
}

.section-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-heading {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.todo-count-pill {
  font-size: 0.62rem;
  font-weight: 700;
  padding: 2px 8px;
  background: #f1f5f9;
  border-radius: 999px;
  color: #475569;
}

.todo-completed-pill {
  font-size: 0.62rem;
  font-weight: 700;
  padding: 2px 8px;
  background: #ecfdf5;
  border-radius: 999px;
  color: #059669;
}

.section-info-txt {
  font-size: 0.65rem;
  color: #64748b;
}

/* Empty State Card */
.empty-todo-card {
  padding: 36px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-title {
  font-size: 0.88rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.empty-sub {
  font-size: 0.72rem;
  color: #64748b;
  margin: 4px 0 0 0;
}

/* Todo Table Structure */
.todo-table-card {
  padding: 0 !important;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.04);
}

.todo-table-header {
  display: grid;
  grid-template-columns: 145px 55px 175px 1fr 140px 240px;
  align-items: center;
  padding: 11px 18px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  font-size: 0.65rem;
  font-weight: 800;
  color: #64748b;
  letter-spacing: 0.05em;
}

.th-col {
  user-select: none;
}

.todo-table-body {
  display: flex;
  flex-direction: column;
}

/* Table Row */
.todo-table-row {
  display: grid;
  grid-template-columns: 145px 55px 175px 1fr 140px 240px;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid #f1f5f9;
  border-left: 4px solid transparent;
  background: #ffffff;
  transition: all 0.15s ease;
  position: relative;
}

.todo-table-row:last-child {
  border-bottom: none;
}

.todo-table-row:hover {
  background: #f8fafc;
}

/* Distinct Category Border Accents */
.card-amber.todo-table-row { border-left-color: #d97706; }
.card-caramel.todo-table-row { border-left-color: #b45309; }
.card-sky.todo-table-row { border-left-color: #0284c7; }
.card-teal.todo-table-row { border-left-color: #0d9488; }
.card-slate.todo-table-row { border-left-color: #64748b; }

/* Status Highlights */
.todo-table-row.is-completed {
  background: #fcfdfc;
}

.todo-table-row.is-running {
  background: #f0f9ff;
}

.todo-table-row.is-pending {
  background: #fffdfa;
}

/* 1. Large Execution Time Cell */
.td-time {
  display: flex;
  align-items: center;
}

.time-large-box {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.time-large-val {
  font-size: 1.75rem;
  font-weight: 800;
  line-height: 1;
  color: #0f172a;
  letter-spacing: -0.03em;
}

.time-meta-badges {
  display: flex;
  align-items: center;
  gap: 4px;
}

.time-tz-badge {
  font-size: 0.58rem;
  font-weight: 800;
  background: #0f172a;
  color: #ffffff;
  padding: 1.5px 5px;
  border-radius: 4px;
  letter-spacing: 0.03em;
}

.time-period-badge {
  font-size: 0.58rem;
  font-weight: 700;
  background: #f1f5f9;
  color: #475569;
  padding: 1.5px 5px;
  border-radius: 4px;
}

/* 2. Todo Check / Quick Action Button */
.td-check {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.todo-check-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #cbd5e1;
  background: #ffffff;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.15s ease;
  padding: 0;
}

.todo-check-btn.done {
  background: #10b981;
  border-color: #10b981;
  color: #ffffff;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
}

.todo-check-btn.running {
  background: #0284c7;
  border-color: #0284c7;
  color: #ffffff;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
}

.todo-check-btn.pending {
  border-color: #d97706;
  color: #d97706;
  background: #fffbeb;
}

.todo-check-btn.pending:hover {
  background: #fef3c7;
  border-color: #b45309;
  color: #b45309;
  transform: scale(1.05);
}

.todo-check-btn.scheduled {
  border-color: #cbd5e1;
  color: #64748b;
  background: #f8fafc;
}

.todo-check-btn.scheduled:hover {
  border-color: #0284c7;
  color: #0284c7;
  background: #f0f9ff;
  transform: scale(1.05);
}

/* 3. Pond & Category */
.td-pond {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding-right: 10px;
}

.pond-pill {
  font-size: 0.65rem;
  color: #334155;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 2px 7px;
  border-radius: 5px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}

.pond-id {
  color: #0f172a;
}

.pond-sep {
  opacity: 0.4;
}

.pond-name {
  color: #64748b;
}

/* 4. Treatment & Dosage (Main) */
.td-treatment {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-right: 16px;
}

.treatment-title-wrap {
  display: flex;
  align-items: baseline;
}

.treatment-title {
  font-size: 0.90rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  line-height: 1.35;
}

.treatment-title.title-done {
  text-decoration: line-through;
  color: #94a3b8;
}

.dosage-wrap {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.dosage-tag-pill {
  font-size: 0.68rem;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  padding: 2.5px 8px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #0f172a;
}

.dosage-kicker {
  color: #64748b;
  font-size: 0.60rem;
}

.dosage-value {
  color: #0284c7;
  font-weight: 800;
}

.dosage-subtext {
  color: #64748b;
  font-size: 0.62rem;
}

.treatment-notes {
  font-size: 0.68rem;
  color: #475569;
  line-height: 1.4;
  display: flex;
  align-items: baseline;
  gap: 5px;
  background: rgba(248, 250, 252, 0.7);
  padding: 4px 8px;
  border-radius: 5px;
  border: 1px solid #f1f5f9;
  margin-top: 2px;
}

.notes-bullet {
  color: #0284c7;
  font-weight: 700;
}

.notes-text {
  color: #475569;
}

/* 5. Actor & Hardware */
.td-actor {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.64rem;
}

.actor-info {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #1e293b;
}

.actor-name {
  color: #0f172a;
}

.hardware-info {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #64748b;
  font-size: 0.60rem;
}

.hardware-id {
  white-space: nowrap;
}

/* 6. Status & Actions */
.td-action {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end;
}

.action-cell-top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.completed-time-tag {
  font-size: 0.60rem;
  color: #059669;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  padding: 2px 6px;
  border-radius: 5px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.action-buttons-strip {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Responsive Table Layout */
@media (max-width: 1200px) {
  .todo-table-header {
    grid-template-columns: 130px 50px 150px 1fr 220px;
  }
  .th-actor {
    display: none;
  }
  .todo-table-row {
    grid-template-columns: 130px 50px 150px 1fr 220px;
  }
  .td-actor {
    display: none;
  }
}

@media (max-width: 860px) {
  .todo-table-header {
    display: none;
  }
  .todo-table-row {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    padding: 14px;
  }
  .td-time {
    justify-content: space-between;
    width: 100%;
  }
  .td-action {
    align-items: flex-start;
    flex-direction: row;
    justify-content: space-between;
    flex-wrap: wrap;
    padding-top: 8px;
    border-top: 1px solid #f1f5f9;
  }
}

/* Treatment Badges */
.treatment-category-badge {
  font-size: 0.62rem;
  font-weight: 800;
  padding: 2.5px 8px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  letter-spacing: 0.02em;
}

.badge-amber { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
.badge-caramel { background: #fef3c7; color: #78350f; border: 1px solid #fcd34d; }
.badge-sky { background: #f0f9ff; color: #0369a1; border: 1px solid #bae6fd; }
.badge-teal { background: #f0fdfa; color: #0f766e; border: 1px solid #99f6e4; }
.badge-slate { background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; }

.pond-badge {
  font-size: 0.62rem;
  color: #475569;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 2px 7px;
  border-radius: 5px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.pond-sep {
  opacity: 0.5;
}

/* Status Badges */
.status-badge {
  font-size: 0.60rem;
  font-weight: 800;
  padding: 2.5px 8px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  letter-spacing: 0.02em;
}

.status-pill-success {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.status-pill-running {
  background: #f0f9ff;
  color: #0369a1;
  border: 1px solid #bae6fd;
}

.status-running-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #0284c7;
  animation: pulse-bead 1.2s infinite;
}

.status-pill-pending {
  background: #fffbeb;
  color: #92400e;
  border: 1px solid #fde68a;
}

.status-pill-scheduled {
  background: #f8fafc;
  color: #475569;
  border: 1px solid #e2e8f0;
}

/* Card Body */
.card-body-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.title-and-dosage-wrap {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 10px;
}

.treatment-title {
  font-size: 0.90rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  line-height: 1.3;
}

.title-done {
  color: #1e293b;
}

.dosage-tag-pill {
  font-size: 0.68rem;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  padding: 2px 8px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #0f172a;
}

.dosage-kicker {
  color: #64748b;
  font-size: 0.60rem;
}

.dosage-value {
  color: #0f172a;
}

.dosage-subtext {
  color: #64748b;
  font-size: 0.62rem;
}

/* Card Rationale */
.card-rationale-row {
  font-size: 0.68rem;
  color: #475569;
  line-height: 1.4;
  display: flex;
  align-items: baseline;
  gap: 6px;
  background: rgba(248, 250, 252, 0.7);
  padding: 5px 8px;
  border-radius: 6px;
  border: 1px solid #f1f5f9;
}

.rationale-bullet {
  color: #94a3b8;
  font-size: 0.9rem;
}

/* Card Footer */
.card-footer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding-top: 6px;
  border-top: 1px solid #f1f5f9;
}

.hardware-actor-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.62rem;
  color: #64748b;
}

.actor-sep {
  opacity: 0.5;
}

.card-actions-strip {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-action-primary {
  font-size: 0.64rem;
  font-weight: 700;
  padding: 4px 9px;
  border-radius: 6px;
  background: #059669;
  border: 1px solid #059669;
  color: #ffffff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.btn-action-primary:hover {
  background: #047857;
}

.btn-action-run {
  font-size: 0.64rem;
  font-weight: 700;
  padding: 4px 9px;
  border-radius: 6px;
  background: #0284c7;
  border: 1px solid #0284c7;
  color: #ffffff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.btn-action-run:hover {
  background: #0369a1;
}

.btn-action-adjust {
  font-size: 0.64rem;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 6px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #334155;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.btn-action-adjust:hover {
  background: #f8fafc;
}

.btn-action-detail {
  font-size: 0.64rem;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 6px;
  background: transparent;
  border: 1px solid transparent;
  color: #64748b;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.btn-action-detail:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.completed-badge {
  font-size: 0.62rem;
  color: #065f46;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  padding: 3px 8px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

/* Modals */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
}

.modal-dialog {
  width: 100%;
  max-width: 540px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
}

.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.modal-head-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-head-title h2 {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.btn-modal-close {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
}

.btn-modal-close:hover {
  color: #0f172a;
}

.modal-content-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-label {
  font-size: 0.65rem;
  font-weight: 700;
  color: #475569;
  letter-spacing: 0.02em;
}

.pond-select-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.pond-select-btn {
  font-size: 0.68rem;
  padding: 6px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #334155;
  cursor: pointer;
  text-align: left;
}

.pond-select-btn.active {
  background: #0284c7;
  color: #ffffff;
  border-color: #0284c7;
}

.cat-grid-4 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.cat-select-btn {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  text-align: left;
  transition: all 0.15s ease;
}

.cat-btn-title {
  font-size: 0.70rem;
  font-weight: 800;
  color: #0f172a;
}

.cat-btn-sub {
  font-size: 0.60rem;
  color: #64748b;
}

.cat-select-btn.active.cat-amber { background: #fffbeb; border-color: #f59e0b; color: #92400e; }
.cat-select-btn.active.cat-caramel { background: #fef3c7; border-color: #b45309; color: #78350f; }
.cat-select-btn.active.cat-sky { background: #f0f9ff; border-color: #0284c7; color: #0369a1; }
.cat-select-btn.active.cat-teal { background: #f0fdfa; border-color: #0d9488; color: #0f766e; }

.form-field-input {
  width: 100%;
  padding: 6px 10px;
  font-size: 0.72rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #ffffff;
  color: #0f172a;
}

.form-field-input:focus {
  outline: none;
  border-color: #0284c7;
}

.form-field-textarea {
  width: 100%;
  padding: 8px 10px;
  font-size: 0.72rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #ffffff;
  color: #0f172a;
  resize: vertical;
}

.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.range-slider {
  width: 100%;
  accent-color: #0d9488;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
}

.btn-modal-secondary {
  font-size: 0.70rem;
  padding: 6px 12px;
  border-radius: 6px;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #475569;
  cursor: pointer;
}

.btn-modal-primary {
  font-size: 0.70rem;
  padding: 6px 14px;
  border-radius: 6px;
  background: #0f172a;
  border: 1px solid #0f172a;
  color: #ffffff;
  cursor: pointer;
}

.btn-modal-action-now {
  font-size: 0.70rem;
  padding: 6px 14px;
  border-radius: 6px;
  background: #0284c7;
  border: 1px solid #0284c7;
  color: #ffffff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

/* Detail Modal Specifics */
.detail-overview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.detail-box {
  padding: 8px 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-label {
  font-size: 0.60rem;
  color: #64748b;
  font-weight: 700;
}

.detail-value {
  font-size: 0.72rem;
  color: #0f172a;
}

.telemetry-snapshot-box {
  padding: 10px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
}

.snapshot-header {
  font-size: 0.60rem;
  font-weight: 800;
  color: #166534;
  display: block;
  margin-bottom: 4px;
}

.snapshot-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 0.68rem;
  color: #14532d;
}

.detail-notes-box {
  padding: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.notes-header {
  font-size: 0.60rem;
  font-weight: 800;
  color: #475569;
  display: block;
  margin-bottom: 4px;
}

.notes-body {
  font-size: 0.72rem;
  color: #334155;
  margin: 0;
  line-height: 1.4;
}
</style>
