<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePonds } from '../composables/usePonds'
import { 
  Award, 
  Sparkles, 
  Zap,
  ShieldCheck, 
  Fish, 
  Scale, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle,
  Radio,
  ArrowUpRight
} from 'lucide-vue-next'

const router = useRouter()
const { ponds, globalFarmMetrics, setPond, loadPondsFromDatabase } = usePonds()

onMounted(() => {
  if (loadPondsFromDatabase) {
    loadPondsFromDatabase()
  }
})

// Helper to determine Health Index status level, simple English badge (Health, Warning, Danger, Offline)
const getHealthStatus = (score, isPowered = true) => {
  if (!isPowered) {
    return {
      level: 'offline',
      color: 'slate',
      label: 'Offline',
      conditionText: 'Powered Off',
      badgeClass: 'health-badge-slate',
      barColor: '#94a3b8',
      dotClass: 'dot-slate',
      textClass: 'text-slate'
    }
  }

  const s = Number(score) || 0
  if (s >= 90) {
    return {
      level: 'health',
      color: 'green',
      label: 'Health',
      conditionText: 'Optimal & Healthy',
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
      conditionText: 'Caution / Warning',
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
      conditionText: 'Critical / Danger',
      badgeClass: 'health-badge-red',
      barColor: '#ef4444',
      dotClass: 'dot-red',
      textClass: 'text-rose'
    }
  }
}

// Executive synthesized assessments for each pond dynamically driven by centralized state
const pondAssessments = computed(() => {
  return ponds.value.map(pond => {
    const isPowered = pond.isPowered !== false
    const score = isPowered ? (Number(pond.healthScore) || 96) : 0
    const health = getHealthStatus(score, isPowered)

    let synthesis = ''
    let keyAction = ''

    if (!isPowered) {
      synthesis = `Edge Node Offline: IoT edge device and probe sensors on ${pond.name} are currently Powered Off or disconnected from the MQTT broker. Biometric telemetry monitoring is paused.`
      keyAction = 'Restore node power in the Equipment & Sensors dashboard or IoT simulator to resume real-time monitoring.'
    } else if (pond.aiAnalysis && pond.aiAnalysis.summary) {
      // Live Generative Analysis directly from Gemini 3.8 Flash via Backend MySQL
      synthesis = pond.aiAnalysis.summary
      if (pond.aiAnalysis.recommendation && (pond.aiAnalysis.recommendation.command || pond.aiAnalysis.recommendation.dosage)) {
        keyAction = `${pond.aiAnalysis.recommendation.category || 'AI ACTION'}: ${pond.aiAnalysis.recommendation.command || ''}${pond.aiAnalysis.recommendation.dosage ? ' (' + pond.aiAnalysis.recommendation.dosage + ')' : ''}. ${pond.aiAnalysis.recommendation.reasoning || ''}`
      } else {
        keyAction = 'Water quality is stable and optimal. Continue routine telemetry monitoring and scheduled biofloc aeration cycles.'
      }
    } else if (health.level === 'danger') {
      if (pond.telemetry?.do && pond.telemetry.do < 3.8) {
        synthesis = `Critical Hypoxia Emergency: Dissolved oxygen dropped sharply below critical safety threshold. Fish respiration suppressed with high acute mortality risk.`
        keyAction = 'Bypass aerator VFD to 100% full throttle immediately, activate emergency auxiliary diffusion, and pause feeding.'
      } else if (pond.telemetry?.ammonia && pond.telemetry.ammonia > 0.6) {
        synthesis = `Acute Ammonia Toxicity Surge: Nitrogen metabolic accumulation exceeds microbial assimilation capacity. Heterotrophic biofloc equilibrium disrupted.`
        keyAction = 'Administer emergency high-dose molasses (C:N 15:1), open bottom siphon valve for 20% sludge purge, and pause feeding.'
      } else {
        synthesis = `Critical Condition Alert: Pond biometric parameters outside safe biofloc operational envelope.`
        keyAction = 'Execute emergency biofloc protocol: maximize aeration to 100% VFD and trigger immediate corrective mitigation.'
      }
    } else if (health.level === 'warning') {
      if (pond.telemetry?.ammonia && pond.telemetry.ammonia > 0.25) {
        synthesis = `Ammonia Accumulation Warning: Heterotrophic assimilation decelerated due to carbon-nitrogen ratio deficit.`
        keyAction = `Dose ${pond.todayMolassesGrams ? Math.round(pond.todayMolassesGrams * 1.5) : 600}g cane molasses to stimulate heterotrophic bacteria to assimilate ammonia.`
      } else if (pond.telemetry?.do && pond.telemetry.do < 5.0) {
        synthesis = `Dissolved Oxygen Depressed: Organic decomposition flux and microbial respiration load require elevated aeration turnover.`
        keyAction = 'Increase aerator VFD output by 15-20% and schedule central bottom sludge purge.'
      } else {
        synthesis = `Water parameters exhibiting minor deviation from optimal biofloc baseline.`
        keyAction = 'Increase aerator VFD power and monitor biofloc volume stability in Water Quality.'
      }
    } else {
      // Health / Optimal state
      if (pond.id === 'K01') {
        synthesis = `Finisher biomass and appetite vitality are optimal. Fish stock has reached average body weight of ${pond.avgWeightGrams}g, ready for harvest.`
        keyAction = 'Schedule partial harvest (300 kg) & reduce morning ration by 10% prior to grading.'
      } else if (pond.id === 'K02') {
        synthesis = `Grower phase accelerating smoothly with daily weight gain (ADG) of +${pond.adgGramsDay || 4.05} g/day. Feed conversion ratio is highly efficient.`
        keyAction = 'Maintain aerator VFD at 75% power & dispense scheduled molasses buffer post evening feeding.'
      } else if (pond.id === 'K03') {
        synthesis = `F1 Fingerlings displaying exceptional vitality with survival rate of ${pond.survivalRate || 96.8}%. Uniform schooling with laminar flow circulation.`
        keyAction = 'Prepare 100g grading size threshold for upcoming transfer to Grower pond.'
      } else if (pond.id === 'K04') {
        synthesis = `High-density biofloc system operating at peak stability with Imhoff-Vision AI optical tracking. Aquatic ecosystem in equilibrium.`
        keyAction = 'Maintain autonomous IoT schedule: precision feed rationing + controlled molasses carbon buffering.'
      } else {
        synthesis = `Aquatic biological conditions remain optimal. Biomass growth trajectory aligned with harvest forecast.`
        keyAction = 'Continue routine automated telemetry surveillance & precision biofloc feeding schedule.'
      }
    }

    return {
      ...pond,
      isPowered,
      score,
      health,
      synthesis,
      keyAction
    }
  })
})

// Average Health Score across online ponds
const averageHealthScore = computed(() => {
  const onlinePonds = pondAssessments.value.filter(p => p.isPowered)
  if (!onlinePonds.length) return '0.0'
  const sum = onlinePonds.reduce((acc, p) => acc + p.score, 0)
  return (sum / onlinePonds.length).toFixed(1)
})

// Overall Biosecurity Status based on active pond states
const biosecurityStatus = computed(() => {
  const onlinePonds = pondAssessments.value.filter(p => p.isPowered)
  const offlineCount = pondAssessments.value.filter(p => !p.isPowered).length
  const dangerCount = onlinePonds.filter(p => p.score < 75).length
  const warningCount = onlinePonds.filter(p => p.score >= 75 && p.score < 90).length

  if (dangerCount > 0) {
    return {
      val: `${dangerCount} Alert`,
      unit: 'Danger',
      statusClass: 'text-rose',
      subtext: `${dangerCount} pond(s) in critical danger • Emergency protocol active`
    }
  } else if (warningCount > 0) {
    return {
      val: `${warningCount} Alert`,
      unit: 'Warning',
      statusClass: 'text-amber',
      subtext: `${warningCount} pond(s) require C:N corrective intervention`
    }
  } else if (offlineCount > 0) {
    return {
      val: `${offlineCount} Offline`,
      unit: 'Node Off',
      statusClass: 'text-slate',
      subtext: `${offlineCount} unpowered node(s) • ${onlinePonds.length} pond(s) normal`
    }
  } else {
    return {
      val: `${ponds.value.length} / ${ponds.value.length}`,
      unit: 'Ponds Normal',
      statusClass: 'text-emerald',
      subtext: 'Zero ammonia spike • Zero water exchange'
    }
  }
})

const inspectPond = (pondId) => {
  setPond(pondId)
  router.push('/water-quality')
}
</script>

<template>
  <div class="pond-overview-view">
    <!-- View Header -->
    <header class="view-header glass-panel">
      <div class="header-left">
        <div class="icon-box">
          <Award :size="20" class="text-sky" />
        </div>
        <div>
          <div class="title-row">
            <h1 class="view-title font-display">Pond Overview & Condition</h1>
            <span class="badge-status-cluster font-mono">
              <span class="pulse-dot" :class="globalFarmMetrics.activePondsCount === globalFarmMetrics.totalPonds ? 'online' : 'offline'"></span>
              {{ globalFarmMetrics.activePondsCount ?? ponds.length }}/{{ globalFarmMetrics.totalPonds ?? ponds.length }} Ponds Active
            </span>
          </div>
          <p class="view-sub font-mono">
            Culture health score, biological diagnosis, and today's action focus per pond
          </p>
        </div>
      </div>
    </header>

    <!-- 4 Aggregate Farm Summary KPIs -->
    <section class="farm-kpis-strip font-mono">
      <div class="kpi-card">
        <div class="kpi-top">
          <span class="kpi-lbl">Farm Health Index</span>
          <ShieldCheck :size="15" class="text-emerald" />
        </div>
        <div class="kpi-val-row">
          <span class="kpi-num" :class="Number(averageHealthScore) >= 90 ? 'text-emerald' : (Number(averageHealthScore) >= 75 ? 'text-amber' : 'text-rose')">
            {{ averageHealthScore }}%
          </span>
          <span class="kpi-unit">
            {{ Number(averageHealthScore) >= 90 ? 'Optimal' : (Number(averageHealthScore) >= 75 ? 'Warning' : 'Danger') }}
          </span>
        </div>
        <span class="kpi-subtext">Fleet-wide average culture vitality index</span>
      </div>

      <div class="kpi-card">
        <div class="kpi-top">
          <span class="kpi-lbl">Total Live Biomass</span>
          <Fish :size="15" class="text-sky" />
        </div>
        <div class="kpi-val-row">
          <span class="kpi-num text-sky">{{ globalFarmMetrics.totalBiomassKg.toLocaleString() }}</span>
          <span class="kpi-unit">kg</span>
        </div>
        <span class="kpi-subtext">+{{ globalFarmMetrics.totalBiomassGainKg.toLocaleString() }} kg net biomass gain</span>
      </div>

      <div class="kpi-card">
        <div class="kpi-top">
          <span class="kpi-lbl">Weighted Farm FCR</span>
          <Scale :size="15" class="text-emerald" />
        </div>
        <div class="kpi-val-row">
          <span class="kpi-num text-emerald">{{ globalFarmMetrics.fcr }}</span>
          <span class="kpi-unit">Ratio</span>
        </div>
        <span class="kpi-subtext">Target &lt; 1.25 (Biofloc Superior)</span>
      </div>

      <div class="kpi-card">
        <div class="kpi-top">
          <span class="kpi-lbl">Biosecurity & Status</span>
          <CheckCircle2 v-if="biosecurityStatus.statusClass === 'text-emerald'" :size="15" class="text-emerald" />
          <AlertTriangle v-else-if="biosecurityStatus.statusClass === 'text-amber'" :size="15" class="text-amber" />
          <AlertCircle v-else :size="15" :class="biosecurityStatus.statusClass" />
        </div>
        <div class="kpi-val-row">
          <span class="kpi-num" :class="biosecurityStatus.statusClass">{{ biosecurityStatus.val }}</span>
          <span class="kpi-unit">{{ biosecurityStatus.unit }}</span>
        </div>
        <span class="kpi-subtext">{{ biosecurityStatus.subtext }}</span>
      </div>
    </section>

    <!-- 4 Clean Pond Condition Cards -->
    <section class="assessment-cards-grid">
      <article 
        v-for="item in pondAssessments" 
        :key="item.id" 
        :id="'pond-condition-card-' + item.id"
        class="pond-card"
      >
        <!-- Card Top: Pond Title / Identity + Live Link Status -->
        <div class="card-head">
          <div class="pond-title-wrap">
            <span class="pond-id-chip font-mono">{{ item.id }}</span>
            <div class="pond-meta-text">
              <h2 class="pond-name font-display">{{ item.name }}</h2>
              <span class="pond-phase font-mono">{{ item.phase }} • {{ item.species }}</span>
            </div>
          </div>
          <div class="card-head-badges font-mono">
            <span class="pond-conn-pill" :class="item.isPowered ? 'online' : 'offline'">
              <span class="pulse-dot" :class="item.isPowered ? 'online' : 'offline'"></span>
              <span>{{ item.isPowered ? 'Live IoT Link' : 'Node Offline' }}</span>
            </span>
          </div>
        </div>

        <!-- Card Body: Split (Left: Big Health Score, Right: Diagnostic & Action) -->
        <div class="card-split-body">
          <!-- LEFT: Big Eye-Catching Health Score & Simple Badge (Health / Warning / Danger / Offline) -->
          <div class="health-col-left">
            <span class="score-label font-mono">HEALTH SCORE</span>
            <div class="health-score-hero font-display font-mono" :class="item.health.textClass">
              <span class="score-number">{{ item.isPowered ? item.score : 'OFF' }}</span>
              <span v-if="item.isPowered" class="score-pct">%</span>
            </div>
            
            <!-- Concise Badge: Health | Warning | Danger | Offline with Clear Status -->
            <div class="health-pill font-mono" :class="item.health.badgeClass">
              <span class="status-dot" :class="item.health.dotClass"></span>
              <span class="font-bold">{{ item.health.label }} • {{ item.health.conditionText }}</span>
            </div>

            <!-- Visual Progress Meter Bar -->
            <div class="health-bar-track">
              <div 
                class="health-bar-fill" 
                :style="{ width: (item.isPowered ? item.score : 0) + '%', backgroundColor: item.health.barColor }"
              ></div>
            </div>
          </div>

          <!-- RIGHT: Diagnostic Summary & Recommended Action (Plain Border matching theme) -->
          <div class="content-col-right">
            <!-- Diagnostic Summary -->
            <div class="detail-section">
              <div class="detail-tag font-mono">
                <Sparkles :size="13" class="text-sky" />
                <span>DIAGNOSTIC SUMMARY</span>
              </div>
              <p class="detail-desc font-sans">
                {{ item.synthesis }}
              </p>
            </div>

            <!-- Recommended Action: Plain subtle border matching current color -->
            <div class="detail-section action-section">
              <div class="detail-tag action-tag font-mono">
                <Zap :size="13" class="text-sky" />
                <span>RECOMMENDED ACTION</span>
              </div>
              <p class="detail-desc action-desc font-sans">
                {{ item.keyAction }}
              </p>
            </div>
          </div>
        </div>

        <!-- Culture Biomass & Management Bar -->
        <div class="card-culture-bar font-mono">
          <div class="culture-item" title="Current Estimated Live Biomass">
            <span class="c-lbl">Biomass</span>
            <span class="c-val text-primary font-bold">
              {{ item.isPowered ? ((item.fishCount * item.avgWeightGrams) / 1000).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—' }} <small v-if="item.isPowered">kg</small>
            </span>
          </div>
          <div class="culture-item" title="Fish Population">
            <span class="c-lbl">Population</span>
            <span class="c-val text-primary font-bold">
              {{ item.isPowered ? item.fishCount.toLocaleString() : '—' }} <small v-if="item.isPowered">fish</small>
            </span>
          </div>
          <div class="culture-item" title="Average Body Weight (ABW)">
            <span class="c-lbl">Weight (ABW)</span>
            <span class="c-val text-primary font-bold">
              {{ item.isPowered ? item.avgWeightGrams : '—' }} <small v-if="item.isPowered">g</small>
            </span>
          </div>
          <div class="culture-item" title="Days of Culture (DOC)">
            <span class="c-lbl">Cycle</span>
            <span class="c-val text-primary font-bold">
              {{ item.isPowered ? `DOC ${item.doc || 112}` : '—' }} <small v-if="item.isPowered">Days</small>
            </span>
          </div>
          <div class="culture-item" title="Survival Rate (SR)">
            <span class="c-lbl">Survival (SR)</span>
            <span class="c-val text-emerald font-bold">
              {{ item.isPowered ? (item.survivalRate || 94) : '—' }}<small v-if="item.isPowered">%</small>
            </span>
          </div>
          <button 
            :id="'btn-inspect-wq-' + item.id"
            class="btn-card-inspect" 
            title="Open Water Quality for detailed telemetry analysis (DO, pH, Temp, TAN, Floc)"
            @click="inspectPond(item.id)"
          >
            <span>View Water Quality</span>
            <ArrowUpRight :size="12" />
          </button>
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped>
.pond-overview-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* =========================================================
   VIEW HEADER
========================================================= */
.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 12px 18px;
  box-shadow: var(--shadow-xs);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-box {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--sky-50);
  border: 1px solid var(--sky-200);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.view-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.2;
}

.badge-status-cluster {
  font-size: 0.65rem;
  font-weight: 700;
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
  padding: 2px 8px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.view-sub {
  font-size: 0.68rem;
  color: var(--text-muted);
  margin: 2px 0 0 0;
}

/* =========================================================
   4 FARM SUMMARY KPIS (AGGREGATE DATA)
========================================================= */
.farm-kpis-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.kpi-card {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  box-shadow: var(--shadow-xs);
}

.kpi-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.kpi-lbl {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.kpi-val-row {
  display: flex;
  align-items: baseline;
  gap: 5px;
}

.kpi-num {
  font-size: 1.35rem;
  font-weight: 800;
  line-height: 1.1;
}

.kpi-unit {
  font-size: 0.68rem;
  color: var(--text-muted);
}

.kpi-subtext {
  font-size: 0.62rem;
  color: var(--text-muted);
}

/* Text status helper colors */
.text-sky { color: var(--sky-600); }
.text-emerald { color: #059669; }
.text-amber { color: #d97706; }
.text-rose { color: #dc2626; }
.text-slate { color: #64748b; }

/* =========================================================
   POND CONDITION CARDS (CLEAN ENTERPRISE 2x2 GRID)
========================================================= */
.assessment-cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.pond-card {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: var(--shadow-xs);
  transition: all 0.2s ease;
}

.pond-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--sky-200);
}

/* Card Header: Pond Title & Info */
.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-subtle);
}

.card-head-badges {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pond-conn-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 999px;
}

.pond-conn-pill.online {
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}

.pond-conn-pill.offline {
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #cbd5e1;
}

.pond-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pond-id-chip {
  background: var(--sky-600);
  color: #ffffff;
  font-size: 0.74rem;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 6px;
  letter-spacing: 0.02em;
}

.pond-meta-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.pond-name {
  font-size: 1rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.2;
}

.pond-phase {
  font-size: 0.66rem;
  color: var(--text-muted);
}

/* Card Body Split: Left (Score) vs Right (Diagnostics & Action) */
.card-split-body {
  display: flex;
  gap: 18px;
  align-items: stretch;
}

/* Left Column: Big Eye-Catching Health Score */
.health-col-left {
  flex: 0 0 135px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding-right: 18px;
  border-right: 1px solid var(--border-subtle);
  gap: 5px;
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
}

.score-number {
  font-size: 2.8rem;
  font-weight: 900;
  letter-spacing: -0.04em;
}

.score-pct {
  font-size: 1.15rem;
  font-weight: 800;
  margin-left: 2px;
  opacity: 0.85;
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
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}

.health-badge-orange {
  background: #fffbeb;
  color: #92400e;
  border: 1px solid #fcd34d;
}

.health-badge-red {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}

.health-badge-slate {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot.dot-green {
  background-color: #10b981;
}

.status-dot.dot-orange {
  background-color: #f59e0b;
}

.status-dot.dot-red {
  background-color: #ef4444;
}

.status-dot.dot-slate {
  background-color: #94a3b8;
}

.health-bar-track {
  width: 100%;
  height: 4px;
  background: #f1f5f9;
  border-radius: 999px;
  overflow: hidden;
  margin-top: 3px;
}

.health-bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s ease, background-color 0.3s ease;
}

/* Right Column: Diagnostic & Action */
.content-col-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.detail-tag {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.63rem;
  font-weight: 800;
  color: #0284c7;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.detail-tag.action-tag {
  color: #0284c7;
}

.detail-desc {
  font-size: 0.77rem;
  color: #334155;
  line-height: 1.45;
  margin: 0;
}

/* Plain border matching the current subtle theme color (no yellow box, no thick orange border) */
.detail-desc.action-desc {
  font-size: 0.76rem;
  font-weight: 600;
  color: var(--text-primary);
  background: var(--bg-surface-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 6px 10px;
}

/* Culture Parameter & Navigation Bar */
.card-culture-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 14px;
  background: var(--bg-surface-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.culture-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 55px;
}

.c-lbl {
  font-size: 0.58rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.c-val {
  font-size: 0.78rem;
  line-height: 1.1;
}

.c-val small {
  font-size: 0.62rem;
  font-weight: 600;
  opacity: 0.8;
}

.btn-card-inspect {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 6px 12px;
  background: #ffffff;
  border: 1px solid var(--sky-200);
  border-radius: 6px;
  color: var(--sky-700);
  cursor: pointer;
  transition: all 0.2s ease;
  margin-left: auto;
  box-shadow: 0 1px 2px rgba(2, 132, 199, 0.06);
}

.btn-card-inspect:hover {
  background: var(--sky-50);
  border-color: var(--sky-400);
  color: var(--sky-800);
  box-shadow: 0 2px 4px rgba(2, 132, 199, 0.12);
}

/* =========================================================
   RESPONSIVE
========================================================= */
@media (max-width: 1100px) {
  .farm-kpis-strip {
    grid-template-columns: repeat(2, 1fr);
  }
  .assessment-cards-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .farm-kpis-strip {
    grid-template-columns: 1fr;
  }
  .card-split-body {
    flex-direction: column;
    gap: 12px;
  }
  .health-col-left {
    border-right: none;
    border-bottom: 1px solid var(--border-subtle);
    padding-right: 0;
    padding-bottom: 12px;
    width: 100%;
  }
}
</style>
