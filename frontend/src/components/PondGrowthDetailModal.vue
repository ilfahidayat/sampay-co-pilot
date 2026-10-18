<script setup>
import { computed } from 'vue'
import { 
  X, 
  TrendingUp, 
  Fish, 
  Scale, 
  Calendar, 
  Layers, 
  Percent, 
  Award, 
  Utensils, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Flame,
  CheckCircle2,
  Clock,
  Skull,
  AlertOctagon
} from 'lucide-vue-next'

const props = defineProps({
  pond: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'open-cycle-action', 'open-mortality'])

// Mortality metrics
const cumulativeMortality = computed(() => props.pond.cumulativeMortalityCount || 0)
const mortalityLostKg = computed(() => {
  const deadAbw = props.pond.avgWeightGrams || 100
  return Number(((cumulativeMortality.value * deadAbw) / 1000).toFixed(1))
})
const pondSurvivalRate = computed(() => props.pond.survivalRate || 95)
const mortalityList = computed(() => props.pond.mortalityLogs || [])

// Biomass metrics
const currentBiomassKg = computed(() => {
  return Math.round((props.pond.fishCount * props.pond.avgWeightGrams) / 1000)
})

const initialBiomassKg = computed(() => {
  return props.pond.initialBiomassKg || Math.round((props.pond.initialFishCount * props.pond.initialWeightGrams) / 1000) || 100
})

const netGainKg = computed(() => {
  return Math.max(0, currentBiomassKg.value - initialBiomassKg.value)
})

const growthPercent = computed(() => {
  if (initialBiomassKg.value <= 0) return 0
  return Math.round((netGainKg.value / initialBiomassKg.value) * 100)
})

const densityKgM3 = computed(() => {
  const vol = props.pond.volumeM3 || 50
  return (currentBiomassKg.value / vol).toFixed(1)
})

const targetHarvestWeight = computed(() => {
  return props.pond.targetHarvestWeightGrams || 850
})

const harvestWeightProgress = computed(() => {
  return Math.min(100, Math.round((props.pond.avgWeightGrams / targetHarvestWeight.value) * 100))
})

const fcr = computed(() => {
  if (netGainKg.value <= 0) return 1.15
  return Number(((props.pond.cumulativeFeedKg || 500) / netGainKg.value).toFixed(2))
})

// Growth history points for chart
const history = computed(() => {
  if (props.pond.growthHistory && props.pond.growthHistory.length > 0) {
    return props.pond.growthHistory
  }
  return [
    { doc: 1, abw: props.pond.initialWeightGrams || 20, biomassKg: initialBiomassKg.value, feedKg: 0, note: 'Stocking Day 1' },
    { doc: props.pond.doc || 60, abw: props.pond.avgWeightGrams, biomassKg: currentBiomassKg.value, feedKg: props.pond.cumulativeFeedKg, note: 'Current State' }
  ]
})

// SVG Growth Curve geometry
const svgPoints = computed(() => {
  const points = history.value
  if (!points || points.length === 0) return ''
  const maxDoc = Math.max(120, ...points.map(p => p.doc || 0))
  const maxAbw = Math.max(targetHarvestWeight.value, ...points.map(p => p.abw || 0))

  const width = 560
  const height = 150
  const padX = 40
  const padY = 20

  const plotWidth = width - padX * 2
  const plotHeight = height - padY * 2

  const coords = points.map(p => {
    const x = padX + ((p.doc || 1) / maxDoc) * plotWidth
    const y = height - padY - ((p.abw || 0) / maxAbw) * plotHeight
    return { x, y, doc: p.doc, abw: p.abw, note: p.note }
  })

  return coords
})

const svgPathString = computed(() => {
  const coords = svgPoints.value
  if (coords.length < 2) return ''
  return coords.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`
  }, '')
})
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="detail-modal-card glass-panel" role="dialog" aria-modal="true">
      <!-- Header -->
      <div class="modal-header">
        <div class="header-left">
          <div class="icon-avatar">
            <TrendingUp :size="20" class="text-sky" />
          </div>
          <div>
            <div class="title-status-row">
              <h3 class="modal-title font-display">{{ pond.name }} — Growth & Cycle Details</h3>
              <span 
                class="status-pill font-mono" 
                :class="pond.cycleStatus === 'HARVESTED' ? 'harvested' : (pond.cycleStatus === 'TRANSFERRED' ? 'transferred' : 'active')"
              >
                {{ pond.cycleStatus || 'ACTIVE CYCLE' }}
              </span>
            </div>
            <span class="modal-sub font-mono">
              ID: {{ pond.id }} • {{ pond.species }} • DOC {{ pond.doc || 60 }} Days of Culture
            </span>
          </div>
        </div>
        <button class="btn-close" @click="emit('close')" aria-label="Close modal">
          <X :size="18" />
        </button>
      </div>

      <!-- Scrollable Body -->
      <div class="modal-body">
        <!-- 4 Top Growth KPIs Grid -->
        <div class="growth-kpi-grid font-mono">
          <!-- Card 1: ABW & Harvest Target -->
          <div class="kpi-card">
            <div class="kpi-head">
              <span class="kpi-label">Average Body Weight (ABW)</span>
              <Scale :size="14" class="text-sky" />
            </div>
            <div class="kpi-val-row">
              <span class="val-big text-sky">{{ pond.avgWeightGrams }}</span>
              <span class="val-unit">g / fish</span>
            </div>
            <div class="progress-wrap">
              <div class="prog-track">
                <div class="prog-fill" :style="{ width: harvestWeightProgress + '%' }"></div>
              </div>
              <span class="prog-meta">{{ harvestWeightProgress }}% of Target ({{ targetHarvestWeight }}g)</span>
            </div>
          </div>

          <!-- Card 2: ADG (Daily Growth) -->
          <div class="kpi-card">
            <div class="kpi-head">
              <span class="kpi-label">Avg Daily Gain (ADG)</span>
              <TrendingUp :size="14" class="text-emerald" />
            </div>
            <div class="kpi-val-row">
              <span class="val-big text-emerald">+{{ pond.adgGramsDay || 4.2 }}</span>
              <span class="val-unit">g / day</span>
            </div>
            <span class="kpi-footer-note">Heterotrophic Biofloc Protein Boost</span>
          </div>

          <!-- Card 3: Survival Rate (SR %) -->
          <div class="kpi-card">
            <div class="kpi-head">
              <span class="kpi-label">Survival Rate (SR)</span>
              <ShieldCheck :size="14" class="text-purple" />
            </div>
            <div class="kpi-val-row">
              <span class="val-big text-purple">{{ pond.survivalRate || 94.5 }}%</span>
              <span class="val-unit">alive</span>
            </div>
            <span class="kpi-footer-note">{{ pond.fishCount?.toLocaleString() }} / {{ pond.initialFishCount?.toLocaleString() || pond.fishCount }} fish remaining</span>
          </div>

          <!-- Card 4: Live Biomass & Density -->
          <div class="kpi-card">
            <div class="kpi-head">
              <span class="kpi-label">Current Live Biomass</span>
              <Fish :size="14" class="text-amber" />
            </div>
            <div class="kpi-val-row">
              <span class="val-big text-amber">{{ currentBiomassKg.toLocaleString() }}</span>
              <span class="val-unit">kg</span>
            </div>
            <span class="kpi-footer-note">Density: <strong>{{ densityKgM3 }} kg/m³</strong> (Max 35 kg/m³)</span>
          </div>
        </div>

        <!-- Section: Growth Trajectory Curve (SVG Visualization) -->
        <div class="growth-chart-card">
          <div class="chart-header">
            <div class="chart-title-wrap">
              <TrendingUp :size="16" class="text-sky" />
              <span class="chart-title font-display">Sampling Growth Trajectory Curve (ABW Progression)</span>
            </div>
            <div class="chart-legend font-mono">
              <span class="legend-item"><span class="legend-dot actual"></span>Actual Sampling ABW</span>
              <span class="legend-item"><span class="legend-line target"></span>Target Harvest ({{ targetHarvestWeight }}g)</span>
            </div>
          </div>

          <!-- SVG Visual Chart -->
          <div class="svg-container">
            <svg viewBox="0 0 560 150" class="growth-svg" preserveAspectRatio="none">
              <!-- Grid lines -->
              <line x1="40" y1="20" x2="520" y2="20" stroke="#f1f5f9" stroke-width="1" />
              <line x1="40" y1="70" x2="520" y2="70" stroke="#f1f5f9" stroke-width="1" />
              <line x1="40" y1="130" x2="520" y2="130" stroke="#e2e8f0" stroke-width="1.5" />

              <!-- Target Line -->
              <line 
                x1="40" 
                y1="25" 
                x2="520" 
                y2="25" 
                stroke="#0ea5e9" 
                stroke-dasharray="4,4" 
                stroke-width="1.5" 
              />

              <!-- Growth Trajectory Path -->
              <path 
                v-if="svgPathString" 
                :d="svgPathString" 
                fill="none" 
                stroke="#0284c7" 
                stroke-width="3" 
                stroke-linecap="round"
                stroke-linejoin="round"
              />

              <!-- Data Nodes -->
              <g v-for="(pt, idx) in svgPoints" :key="idx">
                <circle 
                  :cx="pt.x" 
                  :cy="pt.y" 
                  r="5" 
                  fill="#ffffff" 
                  stroke="#0284c7" 
                  stroke-width="2.5" 
                />
              </g>
            </svg>

            <!-- Axis Labels outside SVG to prevent text distortion -->
            <div class="axis-labels-row font-mono">
              <span v-for="pt in svgPoints" :key="pt.doc" class="axis-point">
                DOC {{ pt.doc }} ({{ pt.abw }}g)
              </span>
            </div>
          </div>
        </div>

        <!-- Section: Stocking vs Current Milestone Comparison -->
        <div class="comparison-grid font-mono">
          <!-- Initial Stocking Profile -->
          <div class="comp-box">
            <div class="comp-title">
              <Calendar :size="14" class="text-muted" />
              <span>Initial Stocking Baseline</span>
            </div>
            <div class="comp-list">
              <div class="comp-row">
                <span class="lbl">Stocking Date:</span>
                <span class="val">{{ pond.stockingDate || '12 Jan 2026' }}</span>
              </div>
              <div class="comp-row">
                <span class="lbl">Initial Fingerling Count:</span>
                <span class="val">{{ pond.initialFishCount?.toLocaleString() || pond.fishCount?.toLocaleString() }} fish</span>
              </div>
              <div class="comp-row">
                <span class="lbl">Initial Weight / Size:</span>
                <span class="val">{{ pond.initialWeightGrams || 15 }} g / fish</span>
              </div>
              <div class="comp-row">
                <span class="lbl">Initial Total Biomass:</span>
                <span class="val">{{ initialBiomassKg }} kg</span>
              </div>
            </div>
          </div>

          <!-- Current Biofloc Performance -->
          <div class="comp-box highlight">
            <div class="comp-title">
              <Sparkles :size="14" class="text-sky" />
              <span>Current Cycle Performance</span>
            </div>
            <div class="comp-list">
              <div class="comp-row">
                <span class="lbl">Net Biomass Gain:</span>
                <span class="val text-emerald">+{{ netGainKg }} kg (+{{ growthPercent }}%)</span>
              </div>
              <div class="comp-row">
                <span class="lbl">Cumulative Feed Delivered:</span>
                <span class="val text-sky">{{ pond.cumulativeFeedKg || 0 }} kg</span>
              </div>
              <div class="comp-row">
                <span class="lbl">Cumulative Molasses Added:</span>
                <span class="val text-amber">{{ pond.cumulativeMolassesKg || 0 }} kg</span>
              </div>
              <div class="comp-row">
                <span class="lbl">Cycle Feed Conversion (FCR):</span>
                <span class="val text-emerald font-bold">{{ fcr }} (Biofloc Superior)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Sampling History Milestones Table -->
        <div class="sampling-table-card">
          <div class="sampling-header">
            <Clock :size="14" class="text-sky" />
            <span class="sampling-title font-display">Sampling Log & Growth Milestones</span>
          </div>
          <div class="table-responsive-box">
            <table class="sampling-table font-mono">
              <thead>
                <tr>
                  <th>Culture Day (DOC)</th>
                  <th>Sampled ABW</th>
                  <th>Estimated Biomass</th>
                  <th>Total Feed (Kg)</th>
                  <th>Observation Note</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(h, idx) in history" :key="idx">
                  <td class="font-bold text-sky">Day {{ h.doc }}</td>
                  <td>{{ h.abw }} grams</td>
                  <td>{{ h.biomassKg }} kg</td>
                  <td>{{ h.feedKg }} kg</td>
                  <td class="text-muted">{{ h.note }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Section: Mortality & Biosecurity Record (Fish Mortality Audit) -->
        <div class="mortality-audit-card">
          <div class="mortality-card-header">
            <div class="header-title-wrap">
              <Skull :size="16" class="text-rose" />
              <span class="mortality-card-title font-display">Cycle Mortality & Biosecurity Audit Trail</span>
            </div>
            <button 
              id="btn-modal-log-mortality"
              type="button" 
              class="btn-log-mortality font-mono" 
              @click="emit('open-mortality', pond)"
            >
              <Skull :size="12" />
              <span>+ Record Mortality</span>
            </button>
          </div>

          <div class="mortality-kpi-row font-mono">
            <div class="m-kpi">
              <span class="m-kpi-lbl">Cumulative Deaths</span>
              <span class="m-kpi-val text-rose">{{ cumulativeMortality.toLocaleString() }} fish</span>
            </div>
            <div class="m-kpi">
              <span class="m-kpi-lbl">Survival Rate (SR)</span>
              <span class="m-kpi-val text-purple">{{ pondSurvivalRate }}%</span>
            </div>
            <div class="m-kpi">
              <span class="m-kpi-lbl">Estimated Lost Biomass</span>
              <span class="m-kpi-val text-rose">-{{ mortalityLostKg }} kg</span>
            </div>
            <div class="m-kpi">
              <span class="m-kpi-lbl">Current Live Population</span>
              <span class="m-kpi-val text-emerald">{{ pond.fishCount?.toLocaleString() }} fish</span>
            </div>
          </div>

          <!-- Table of Mortality Logs -->
          <div v-if="mortalityList.length > 0" class="mortality-table-wrapper">
            <table class="mortality-table font-mono">
              <thead>
                <tr>
                  <th style="min-width: 130px;">Timestamp</th>
                  <th style="min-width: 90px;">Dead Count</th>
                  <th style="min-width: 90px;">Avg Weight</th>
                  <th style="min-width: 100px;">Biomass Lost</th>
                  <th style="min-width: 160px;">Diagnosed Cause</th>
                  <th style="min-width: 160px;">Biosecurity Disposal</th>
                  <th style="min-width: 180px;">Technical Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="log in mortalityList" :key="log.id">
                  <td class="text-muted">{{ log.date }}</td>
                  <td class="text-rose font-bold">-{{ log.count }} fish</td>
                  <td>{{ log.avgWeightGrams }} g</td>
                  <td class="text-rose font-bold">-{{ log.biomassLostKg }} kg</td>
                  <td>
                    <span class="cause-badge">{{ log.cause }}</span>
                  </td>
                  <td class="text-muted">{{ log.disposalMethod }}</td>
                  <td class="text-muted font-sans">{{ log.notes }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="mortality-empty font-mono">
            <ShieldCheck :size="16" class="text-emerald" />
            <span>No mortality incidents recorded for this pond. Survival rate is at {{ pondSurvivalRate }}%.</span>
          </div>
        </div>
      </div>

      <!-- Modal Footer with End Cycle Actions -->
      <div class="modal-footer">
        <div class="footer-left">
          <span class="footer-hint font-mono">
            Cycle Operations: Execute commercial harvest, grading migration, or record daily mortality
          </span>
        </div>
        <div class="footer-actions">
          <button type="button" class="btn-cancel font-mono" @click="emit('close')">
            Close
          </button>
          <button 
            type="button" 
            id="btn-footer-mortality"
            class="btn-mortality-footer font-mono" 
            @click="emit('open-mortality', pond)"
          >
            <Skull :size="13" />
            <span>Record Mortality</span>
          </button>
          <button 
            type="button" 
            id="btn-open-cycle-action"
            class="btn-cycle font-mono" 
            @click="emit('open-cycle-action', pond)"
          >
            <Award :size="14" />
            <span>End Cycle: Harvest or Transfer</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.detail-modal-card {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  width: 100%;
  max-width: 1040px;
  max-height: 88vh;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.16);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modalPop 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalPop {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-surface-subtle);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-avatar {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--sky-50);
  border: 1px solid var(--sky-200);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.title-status-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
}

.status-pill {
  font-size: 0.62rem;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 4px;
}
.status-pill.active {
  background: var(--emerald-50);
  color: var(--emerald-700);
  border: 1px solid var(--emerald-200);
}
.status-pill.harvested {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
}
.status-pill.transferred {
  background: var(--sky-50);
  color: var(--sky-700);
  border: 1px solid var(--sky-200);
}

.modal-sub {
  font-size: 0.68rem;
  color: var(--text-muted);
}

.btn-close {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.btn-close:hover {
  background: #e2e8f0;
  color: var(--text-primary);
}

.modal-body {
  padding: 22px 24px;
  overflow-y: auto;
  max-height: calc(88vh - 130px);
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.table-responsive-box {
  overflow-x: auto;
  width: 100%;
}

.sampling-table {
  min-width: 680px;
  width: 100%;
  border-collapse: collapse;
}

.mortality-table {
  min-width: 760px;
  width: 100%;
  border-collapse: collapse;
}

/* 4 Growth KPIs Grid */
.growth-kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.kpi-card {
  background: var(--bg-surface-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.kpi-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.kpi-label {
  font-size: 0.64rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.kpi-val-row {
  display: flex;
  align-items: baseline;
  gap: 5px;
}

.val-big {
  font-size: 1.3rem;
  font-weight: 800;
  line-height: 1.1;
}

.val-unit {
  font-size: 0.66rem;
  color: var(--text-muted);
}

.progress-wrap {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.prog-track {
  width: 100%;
  height: 5px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
}

.prog-fill {
  height: 100%;
  background: linear-gradient(90deg, #0284c7, #38bdf8);
  border-radius: 999px;
  transition: width 0.3s ease;
}

.prog-meta {
  font-size: 0.6rem;
  color: var(--text-muted);
}

.kpi-footer-note {
  font-size: 0.62rem;
  color: var(--text-muted);
}

/* Growth Trajectory Chart Card */
.growth-chart-card {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chart-title {
  font-size: 0.88rem;
  font-weight: 800;
  color: var(--text-primary);
}

.chart-legend {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.66rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--text-secondary);
}

.legend-dot.actual {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #0284c7;
}

.legend-line.target {
  width: 14px;
  height: 2px;
  background: #0ea5e9;
  border-top: 1px dashed #0ea5e9;
}

.svg-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.growth-svg {
  width: 100%;
  height: 130px;
  overflow: visible;
}

.axis-labels-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.64rem;
  color: var(--text-muted);
  padding: 0 10px;
}

/* Comparison Grid */
.comparison-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.comp-box {
  background: var(--bg-surface-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comp-box.highlight {
  background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%);
  border-color: var(--sky-200);
}

.comp-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 6px;
}

.comp-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.comp-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.68rem;
}

.comp-row .lbl {
  color: var(--text-muted);
}

.comp-row .val {
  font-weight: 700;
  color: var(--text-primary);
}

/* Sampling History Table */
.sampling-table-card {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  overflow: hidden;
}

.sampling-header {
  padding: 10px 14px;
  background: var(--bg-surface-subtle);
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  gap: 8px;
}

.sampling-title {
  font-size: 0.8rem;
  font-weight: 800;
  color: var(--text-primary);
}

.sampling-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.68rem;
  text-align: left;
}

.sampling-table th {
  padding: 8px 12px;
  background: #f8fafc;
  color: var(--text-muted);
  font-weight: 700;
  border-bottom: 1px solid var(--border-subtle);
}

.sampling-table td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-subtle);
}

.sampling-table tr:last-child td {
  border-bottom: none;
}

/* Mortality Audit Card */
.mortality-audit-card {
  background: #ffffff;
  border: 1px solid #fecdd3;
  border-radius: 10px;
  overflow: hidden;
}

.mortality-card-header {
  padding: 10px 14px;
  background: #fff1f2;
  border-bottom: 1px solid #fecdd3;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mortality-card-title {
  font-size: 0.8rem;
  font-weight: 800;
  color: #9f1239;
}

.btn-log-mortality {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  background: #ffffff;
  border: 1px solid #f43f5e;
  border-radius: 6px;
  color: #e11d48;
  font-size: 0.68rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-log-mortality:hover {
  background: #e11d48;
  color: #ffffff;
}

.mortality-kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 12px 14px;
  background: #fffdfd;
  border-bottom: 1px solid #ffe4e6;
}

.m-kpi {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.m-kpi-lbl {
  font-size: 0.62rem;
  color: var(--text-muted);
}

.m-kpi-val {
  font-size: 0.85rem;
  font-weight: 800;
}

.mortality-table-wrapper {
  overflow-x: auto;
}

.mortality-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.68rem;
  text-align: left;
}

.mortality-table th {
  padding: 8px 12px;
  background: #f8fafc;
  color: var(--text-muted);
  font-weight: 700;
  border-bottom: 1px solid var(--border-subtle);
}

.mortality-table td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-subtle);
}

.mortality-table tr:last-child td {
  border-bottom: none;
}

.cause-badge {
  display: inline-block;
  padding: 2px 7px;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 4px;
  font-size: 0.64rem;
  font-weight: 700;
}

.mortality-empty {
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.72rem;
  color: var(--text-secondary);
}

.btn-mortality-footer {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid #fecdd3;
  background: #fff1f2;
  color: #e11d48;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-mortality-footer:hover {
  background: #ffe4e6;
  border-color: #f43f5e;
}

.modal-footer {
  padding: 14px 20px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-surface-subtle);
}

.footer-hint {
  font-size: 0.66rem;
  color: var(--text-muted);
}

.footer-actions {
  display: flex;
  gap: 10px;
}

.btn-cancel {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid var(--border-medium);
  background: #ffffff;
  color: var(--text-secondary);
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-cancel:hover {
  background: #f1f5f9;
}

.btn-cycle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
  color: #ffffff;
  font-size: 0.72rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(217, 119, 6, 0.3);
  transition: all 0.15s ease;
}

.btn-cycle:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(217, 119, 6, 0.4);
}

@media (max-width: 800px) {
  .growth-kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .comparison-grid {
    grid-template-columns: 1fr;
  }
}
</style>
