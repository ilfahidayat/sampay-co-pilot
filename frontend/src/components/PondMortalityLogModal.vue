<script setup>
import { ref, computed } from 'vue'
import { 
  X, 
  Skull, 
  ShieldCheck, 
  Plus, 
  Search, 
  Scale, 
  TrendingDown, 
  Calendar, 
  Filter,
  CheckCircle2,
  AlertOctagon,
  FileText
} from 'lucide-vue-next'

const props = defineProps({
  pond: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'open-record-mortality'])

const searchQuery = ref('')
const selectedCauseFilter = ref('ALL')

const mortalityList = computed(() => {
  return props.pond.mortalityLogs || []
})

const cumulativeDeaths = computed(() => {
  return props.pond.cumulativeMortalityCount || mortalityList.value.reduce((acc, l) => acc + (l.count || 0), 0)
})

const totalBiomassLostKg = computed(() => {
  return Number(mortalityList.value.reduce((acc, l) => acc + (l.biomassLostKg || 0), 0).toFixed(2))
})

const survivalRate = computed(() => {
  return props.pond.survivalRate || 95.0
})

const filteredLogs = computed(() => {
  let list = mortalityList.value

  if (selectedCauseFilter.value !== 'ALL') {
    list = list.filter(l => (l.cause || '').toLowerCase().includes(selectedCauseFilter.value.toLowerCase()))
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(l => 
      (l.cause && l.cause.toLowerCase().includes(q)) ||
      (l.notes && l.notes.toLowerCase().includes(q)) ||
      (l.disposalMethod && l.disposalMethod.toLowerCase().includes(q)) ||
      (l.actor && l.actor.toLowerCase().includes(q)) ||
      (l.date && l.date.toLowerCase().includes(q))
    )
  }

  return list
})
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="mortality-modal-card glass-panel" role="dialog" aria-modal="true">
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="header-left">
          <div class="icon-avatar">
            <Skull :size="20" class="text-rose" />
          </div>
          <div>
            <div class="title-row">
              <h3 class="modal-title font-display">Mortality & Biosecurity Audit Trail</h3>
              <span class="status-badge font-mono">{{ pond.name }} (ID: {{ pond.id }})</span>
            </div>
            <span class="modal-sub font-mono">
              Live Stock: <strong>{{ pond.fishCount?.toLocaleString() }} fish</strong> • Stocking Baseline: <strong>{{ pond.initialFishCount?.toLocaleString() || pond.fishCount }} fish</strong> • Current SR: <strong>{{ survivalRate }}%</strong>
            </span>
          </div>
        </div>
        <button class="btn-close" @click="emit('close')" aria-label="Close modal">
          <X :size="18" />
        </button>
      </div>

      <!-- Top Summary Metrics Grid -->
      <div class="summary-kpis font-mono">
        <div class="kpi-mini-card">
          <span class="kpi-lbl">Cumulative Deaths</span>
          <div class="kpi-val-row">
            <span class="val-num text-rose">{{ cumulativeDeaths.toLocaleString() }}</span>
            <span class="val-unit">fish</span>
          </div>
          <span class="kpi-sub">{{ ((cumulativeDeaths / (pond.initialFishCount || 2000)) * 100).toFixed(1) }}% of initial stock</span>
        </div>

        <div class="kpi-mini-card">
          <span class="kpi-lbl">Current Survival Rate</span>
          <div class="kpi-val-row">
            <span class="val-num text-purple">{{ survivalRate }}%</span>
            <span class="val-unit">SR</span>
          </div>
          <span class="kpi-sub">Target &gt; 90.0% (Biofloc High Density)</span>
        </div>

        <div class="kpi-mini-card">
          <span class="kpi-lbl">Total Biomass Lost</span>
          <div class="kpi-val-row">
            <span class="val-num text-rose">-{{ totalBiomassLostKg }}</span>
            <span class="val-unit">kg</span>
          </div>
          <span class="kpi-sub">Removed & disposed via SNI biosecurity</span>
        </div>

        <div class="kpi-mini-card">
          <span class="kpi-lbl">Active Live Population</span>
          <div class="kpi-val-row">
            <span class="val-num text-emerald">{{ pond.fishCount?.toLocaleString() }}</span>
            <span class="val-unit">fish</span>
          </div>
          <span class="kpi-sub">~{{ Math.round((pond.fishCount * pond.avgWeightGrams) / 1000).toLocaleString() }} kg live biomass</span>
        </div>
      </div>

      <!-- Action & Filter Bar -->
      <div class="filter-action-bar font-mono">
        <div class="search-box">
          <Search :size="14" class="text-muted" />
          <input 
            v-model="searchQuery" 
            type="text" 
            class="search-input" 
            placeholder="Search by symptom, cause, supervisor, or note..."
          />
          <button v-if="searchQuery" class="btn-clear" @click="searchQuery = ''">
            <X :size="12" />
          </button>
        </div>

        <div class="filter-right">
          <select v-model="selectedCauseFilter" class="filter-select">
            <option value="ALL">All Causes / Symptoms</option>
            <option value="Hypoxia">Hypoxia / Low DO</option>
            <option value="Ammonia">Ammonia / TAN Deficit</option>
            <option value="Cannibalism">Cannibalism / Injury</option>
            <option value="Thermal">Thermal Shock / Temp</option>
            <option value="Routine">Routine / Natural</option>
            <option value="Stress">Handling / Grading Stress</option>
          </select>

          <button 
            id="btn-log-mortality-from-log-modal"
            class="btn-record-mortality font-mono" 
            @click="emit('open-record-mortality', pond)"
          >
            <Plus :size="14" />
            <span>Record Mortality Incident</span>
          </button>
        </div>
      </div>

      <!-- Scrollable Table Section -->
      <div class="modal-table-container">
        <div v-if="filteredLogs.length > 0" class="table-scroll-wrap">
          <table class="audit-table font-mono">
            <thead>
              <tr>
                <th style="min-width: 140px;">Timestamp</th>
                <th style="min-width: 90px;">Dead Count</th>
                <th style="min-width: 90px;">Avg Weight</th>
                <th style="min-width: 100px;">Biomass Lost</th>
                <th style="min-width: 160px;">Diagnosed Cause</th>
                <th style="min-width: 160px;">Biosecurity Disposal</th>
                <th style="min-width: 140px;">Supervisor</th>
                <th style="min-width: 180px;">Technical Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in filteredLogs" :key="log.id">
                <td class="font-bold text-muted">{{ log.date }}</td>
                <td>
                  <span class="count-pill text-rose font-bold">-{{ log.count }} fish</span>
                </td>
                <td>{{ log.avgWeightGrams }} g</td>
                <td class="text-rose font-bold">-{{ log.biomassLostKg }} kg</td>
                <td>
                  <span class="cause-tag font-sans">{{ log.cause }}</span>
                </td>
                <td class="font-sans text-muted">{{ log.disposalMethod }}</td>
                <td class="text-secondary font-sans">{{ log.actor || 'Ilfa Hidayat (Supervisor)' }}</td>
                <td class="notes-cell font-sans text-muted">{{ log.notes || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state font-mono">
          <ShieldCheck :size="28" class="text-emerald" />
          <h4 class="empty-title">No Mortality Records Found</h4>
          <p class="empty-desc">
            {{ searchQuery || selectedCauseFilter !== 'ALL' 
              ? 'No mortality records matched your filter criteria. Try clearing the search filter.' 
              : `Pond ${pond.name} has zero mortality incidents recorded. Population health is optimal at ${survivalRate}% survival rate.` }}
          </p>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="modal-footer font-mono">
        <span class="footer-meta">
          Showing {{ filteredLogs.length }} of {{ mortalityList.length }} verified mortality records • Persisted in MySQL Database
        </span>
        <button class="btn-close-modal font-mono" @click="emit('close')">
          Close Audit Log
        </button>
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
  z-index: 1050;
  padding: 20px;
}

.mortality-modal-card {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  width: 100%;
  max-width: 1020px;
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
    transform: scale(0.97) translateY(8px);
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
  background: #fffdfd;
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
  background: #fff1f2;
  border: 1px solid #fecdd3;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.text-rose { color: var(--rose-600); }
.text-purple { color: #8b5cf6; }
.text-emerald { color: var(--emerald-600); }

.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
}

.status-badge {
  font-size: 0.65rem;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 4px;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #334155;
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
  background: #f1f5f9;
  color: var(--text-primary);
}

/* Summary KPIs */
.summary-kpis {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 14px 20px;
  background: #fafaf9;
  border-bottom: 1px solid var(--border-subtle);
}

.kpi-mini-card {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kpi-lbl {
  font-size: 0.62rem;
  color: var(--text-muted);
  text-transform: uppercase;
  font-weight: 700;
}

.kpi-val-row {
  display: flex;
  align-items: baseline;
  gap: 5px;
}

.val-num {
  font-size: 1.15rem;
  font-weight: 900;
  line-height: 1.1;
}

.val-unit {
  font-size: 0.68rem;
  color: var(--text-muted);
}

.kpi-sub {
  font-size: 0.6rem;
  color: var(--text-muted);
}

/* Filter and Action Bar */
.filter-action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border-subtle);
  gap: 12px;
  background: #ffffff;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-surface-subtle);
  border: 1px solid var(--border-medium);
  border-radius: 8px;
  padding: 6px 12px;
  width: 380px;
}

.search-input {
  background: transparent;
  border: none;
  font-size: 0.74rem;
  color: var(--text-primary);
  width: 100%;
}
.search-input:focus { outline: none; }

.btn-clear {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 2px;
}

.filter-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-select {
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid var(--border-medium);
  font-size: 0.72rem;
  color: var(--text-secondary);
  background: #ffffff;
}

.btn-record-mortality {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #e11d48 0%, #f43f5e 100%);
  color: #ffffff;
  font-size: 0.72rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(225, 29, 72, 0.25);
  transition: all 0.15s ease;
}

.btn-record-mortality:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(225, 29, 72, 0.35);
}

/* Modal Table */
.modal-table-container {
  flex: 1;
  overflow-y: auto;
  max-height: calc(88vh - 280px);
}

.table-scroll-wrap {
  overflow-x: auto;
}

.audit-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.7rem;
  text-align: left;
}

.audit-table th {
  padding: 10px 14px;
  background: #f8fafc;
  color: var(--text-muted);
  font-weight: 800;
  border-bottom: 1px solid var(--border-subtle);
  position: sticky;
  top: 0;
  z-index: 2;
}

.audit-table td {
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-subtle);
  vertical-align: middle;
}

.count-pill {
  background: #fff1f2;
  border: 1px solid #fecdd3;
  padding: 2px 8px;
  border-radius: 6px;
}

.cause-tag {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.68rem;
  font-weight: 700;
  color: #1e293b;
  display: inline-block;
}

.notes-cell {
  font-size: 0.68rem;
  line-height: 1.3;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
  gap: 8px;
  text-align: center;
}

.empty-title {
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--text-primary);
}

.empty-desc {
  font-size: 0.72rem;
  color: var(--text-muted);
  max-width: 420px;
}

/* Modal Footer */
.modal-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-surface-subtle);
}

.footer-meta {
  font-size: 0.64rem;
  color: var(--text-muted);
}

.btn-close-modal {
  padding: 6px 14px;
  border-radius: 6px;
  border: 1px solid var(--border-medium);
  background: #ffffff;
  color: var(--text-secondary);
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-close-modal:hover {
  background: #f1f5f9;
}

@media (max-width: 768px) {
  .summary-kpis {
    grid-template-columns: repeat(2, 1fr);
  }
  .filter-action-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .search-box {
    width: 100%;
  }
}
</style>
