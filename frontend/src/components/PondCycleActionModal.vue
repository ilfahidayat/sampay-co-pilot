<script setup>
import { ref, computed } from 'vue'
import { usePonds } from '../composables/usePonds'
import { useToast } from '../composables/useToast'
import { 
  X, 
  Award, 
  ArrowRightLeft, 
  Check, 
  AlertTriangle, 
  Scale, 
  Fish, 
  Layers, 
  Sparkles,
  TrendingUp,
  RefreshCw,
  Calendar,
  CheckCircle2
} from 'lucide-vue-next'

const props = defineProps({
  pond: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'action-completed'])

const { ponds, harvestPondCycle, transferPondFish, restartPondCycle } = usePonds()
const { showToast } = useToast()

const isHarvested = computed(() => {
  return props.pond.cycleStatus === 'HARVESTED' || props.pond.cycleStatus === 'TRANSFERRED' || props.pond.fishCount === 0
})

const activeTab = ref(isHarvested.value ? 'RESTOCK' : 'HARVEST') // 'HARVEST' | 'TRANSFER' | 'RESTOCK'

// Current biomass
const currentBiomassKg = computed(() => {
  return Math.round((props.pond.fishCount * props.pond.avgWeightGrams) / 1000)
})

// === TAB 1: HARVEST STATE ===
const harvestType = ref('FULL') // 'FULL' | 'PARTIAL'
const harvestKg = ref(currentBiomassKg.value)
const harvestCount = ref(props.pond.fishCount)
const harvestAbw = ref(props.pond.avgWeightGrams)
const harvestNotes = ref('Commercial market delivery harvest')
const isHarvesting = ref(false)

const setHarvestPreset = (type) => {
  harvestType.value = type
  if (type === 'FULL') {
    harvestKg.value = currentBiomassKg.value
    harvestCount.value = props.pond.fishCount
  } else {
    harvestCount.value = Math.round(props.pond.fishCount * 0.5)
    harvestKg.value = Math.round(currentBiomassKg.value * 0.5)
  }
}

const estimatedHarvestFcr = computed(() => {
  const netGain = Math.max(1, harvestKg.value - (props.pond.initialBiomassKg || 100))
  return Number(((props.pond.cumulativeFeedKg || 500) / netGain).toFixed(2))
})

const handleExecuteHarvest = async () => {
  if (harvestKg.value <= 0 || harvestCount.value <= 0) {
    showToast('⚠️ Please enter a valid harvest weight and count', 'warning')
    return
  }

  isHarvesting.value = true
  const success = await harvestPondCycle(props.pond.id, {
    type: harvestType.value,
    harvestKg: Number(harvestKg.value),
    harvestCount: Number(harvestCount.value),
    harvestAbw: Number(harvestAbw.value),
    notes: harvestNotes.value
  })
  isHarvesting.value = false

  if (success) {
    showToast(
      harvestType.value === 'FULL'
        ? `🏆 Full Harvest Complete: ${harvestKg.value.toLocaleString()} kg harvested from ${props.pond.name}. Saved to Database!`
        : `⚖️ Partial Thinning: ${harvestKg.value.toLocaleString()} kg removed from ${props.pond.name}.`,
      'success'
    )
    emit('action-completed', { type: 'HARVEST', pondId: props.pond.id })
    emit('close')
  }
}

// === TAB 2: TRANSFER STATE ===
const availableTargetPonds = computed(() => {
  return ponds.value.filter(p => p.id !== props.pond.id)
})

const targetPondId = ref(availableTargetPonds.value[0]?.id || '')
const transferPercent = ref(100)
const transferReason = ref('Size grading and progressive culture stage migration')
const isTransferring = ref(false)

const transferCount = computed(() => {
  return Math.round((props.pond.fishCount * transferPercent.value) / 100)
})

const transferKg = computed(() => {
  return Number(((transferCount.value * props.pond.avgWeightGrams) / 1000).toFixed(1))
})

const selectedTargetPond = computed(() => {
  return ponds.value.find(p => p.id === targetPondId.value)
})

const handleExecuteTransfer = async () => {
  if (!targetPondId.value) {
    showToast('⚠️ Please select a destination pond for transfer', 'warning')
    return
  }

  if (transferCount.value <= 0) {
    showToast('⚠️ Transfer count must be greater than 0', 'warning')
    return
  }

  isTransferring.value = true
  const success = await transferPondFish(props.pond.id, targetPondId.value, {
    transferCount: transferCount.value,
    transferKg: transferKg.value,
    transferAbw: props.pond.avgWeightGrams,
    reason: transferReason.value
  })
  isTransferring.value = false

  if (success) {
    showToast(
      `🔄 Fish Transfer Executed: ${transferCount.value.toLocaleString()} fish (${transferKg.value} kg) moved to ${selectedTargetPond.value?.name}! Saved to Database.`,
      'success'
    )
    emit('action-completed', { type: 'TRANSFER', sourceId: props.pond.id, targetId: targetPondId.value })
    emit('close')
  }
}

// === TAB 3: RESTOCK / NEW CYCLE STATE ===
const restockCount = ref(2000)
const restockAbw = ref(20)
const restockSpecies = ref(props.pond.species || 'Red Tilapia (Oreochromis niloticus)')
const restockPhase = ref('Nursery / Fingerling Conditioning')
const isRestocking = ref(false)

const restockBiomassKg = computed(() => {
  return Number(((restockCount.value * restockAbw.value) / 1000).toFixed(1))
})

const handleExecuteRestock = async () => {
  if (restockCount.value <= 0) {
    showToast('⚠️ Fingerling count must be greater than 0', 'warning')
    return
  }

  isRestocking.value = true
  const success = await restartPondCycle(props.pond.id, {
    fishCount: restockCount.value,
    avgWeightGrams: restockAbw.value,
    initialBiomassKg: restockBiomassKg.value,
    species: restockSpecies.value,
    phase: restockPhase.value,
    stockingDate: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
  })
  isRestocking.value = false

  if (success) {
    showToast(`🌱 New Culture Cycle initialized for ${props.pond.name} with ${restockCount.value.toLocaleString()} fingerlings!`, 'success')
    emit('action-completed', { type: 'RESTOCK', pondId: props.pond.id })
    emit('close')
  }
}
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="action-modal-card glass-panel" role="dialog" aria-modal="true">
      <!-- Header -->
      <div class="modal-header">
        <div class="header-left">
          <div class="icon-avatar">
            <Award :size="20" class="text-amber" />
          </div>
          <div>
            <div class="title-row">
              <h3 class="modal-title font-display">Manage & End Culture Cycle</h3>
              <span 
                class="status-tag font-mono"
                :class="pond.cycleStatus === 'HARVESTED' ? 'harvested' : (pond.cycleStatus === 'TRANSFERRED' ? 'transferred' : 'active')"
              >
                {{ pond.cycleStatus || 'ACTIVE' }}
              </span>
            </div>
            <span class="modal-sub font-mono">
              {{ pond.name }} (ID: {{ pond.id }}) • Current Stock: <strong>{{ pond.fishCount?.toLocaleString() }} fish</strong> (~{{ currentBiomassKg.toLocaleString() }} kg @ {{ pond.avgWeightGrams }}g)
            </span>
          </div>
        </div>
        <button class="btn-close" @click="emit('close')" aria-label="Close modal">
          <X :size="18" />
        </button>
      </div>

      <!-- Tab Switcher -->
      <div class="tab-header font-mono">
        <button 
          id="tab-btn-harvest"
          class="tab-btn" 
          :class="{ active: activeTab === 'HARVEST' }"
          @click="activeTab = 'HARVEST'"
        >
          <Award :size="14" />
          <span>Harvest Fish (Commercial Yield)</span>
        </button>
        <button 
          id="tab-btn-transfer"
          class="tab-btn" 
          :class="{ active: activeTab === 'TRANSFER' }"
          @click="activeTab = 'TRANSFER'"
        >
          <ArrowRightLeft :size="14" />
          <span>Fish Grading & Transfer</span>
        </button>
        <button 
          id="tab-btn-restock"
          class="tab-btn" 
          :class="{ active: activeTab === 'RESTOCK' }"
          @click="activeTab = 'RESTOCK'"
        >
          <RefreshCw :size="14" />
          <span>Start New Cycle / Restock</span>
        </button>
      </div>

      <!-- TAB 1: HARVEST PANEL -->
      <div v-if="activeTab === 'HARVEST'" class="tab-body">
        <div class="mode-selector-grid font-mono">
          <button 
            type="button"
            class="mode-card"
            :class="{ active: harvestType === 'FULL' }"
            @click="setHarvestPreset('FULL')"
          >
            <div class="mode-head">
              <span class="mode-title">Full Cycle Harvest</span>
              <span class="badge badge-emerald">Complete Cycle</span>
            </div>
            <p class="mode-desc">Harvest 100% of live biomass, finalize cycle FCR, and set pond status to HARVESTED in MySQL database ready for sanitation.</p>
          </button>

          <button 
            type="button"
            class="mode-card"
            :class="{ active: harvestType === 'PARTIAL' }"
            @click="setHarvestPreset('PARTIAL')"
          >
            <div class="mode-head">
              <span class="mode-title">Partial Harvest (Thinning)</span>
              <span class="badge badge-sky">Selective Thinning</span>
            </div>
            <p class="mode-desc">Selectively harvest a proportion of the stock (e.g. 50%) to reduce density, while the remaining stock continues culture to peak target weight.</p>
          </button>
        </div>

        <!-- Harvest Inputs Grid -->
        <div class="form-grid-2">
          <!-- Total Weight to Harvest -->
          <div class="form-group font-mono">
            <label class="form-label" for="harvest-kg">
              <span>Total Harvest Biomass (kg)</span>
            </label>
            <div class="input-with-unit">
              <input 
                id="harvest-kg" 
                v-model.number="harvestKg" 
                type="number" 
                step="1" 
                min="10" 
                :max="Math.max(10, currentBiomassKg)" 
                class="form-input font-mono"
              />
              <span class="unit-tag font-mono">kg</span>
            </div>
          </div>

          <!-- Harvest Fish Count -->
          <div class="form-group font-mono">
            <label class="form-label" for="harvest-count">
              <span>Fish Population Harvested</span>
            </label>
            <div class="input-with-unit">
              <input 
                id="harvest-count" 
                v-model.number="harvestCount" 
                type="number" 
                step="50" 
                min="10" 
                :max="Math.max(10, pond.fishCount)" 
                class="form-input font-mono"
              />
              <span class="unit-tag font-mono">fish</span>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div class="form-group font-mono">
          <label class="form-label" for="harvest-notes">
            <span>Harvest Notes / Buyer Destination</span>
          </label>
          <input 
            id="harvest-notes" 
            v-model="harvestNotes" 
            type="text" 
            class="form-input font-sans" 
            placeholder="e.g. Export Grade A to Retail Market"
          />
        </div>

        <!-- Harvest Projection Summary -->
        <div class="summary-box font-mono">
          <div class="sum-row">
            <span class="s-lbl">Cumulative Cycle Feed:</span>
            <span class="s-val text-sky">{{ pond.cumulativeFeedKg || 0 }} kg</span>
          </div>
          <div class="sum-row">
            <span class="s-lbl">Harvest Yield Biomass:</span>
            <span class="s-val text-emerald font-bold">{{ harvestKg }} kg ({{ harvestCount?.toLocaleString() }} fish)</span>
          </div>
          <div class="sum-row">
            <span class="s-lbl">Projected Cycle FCR:</span>
            <span class="s-val text-emerald font-bold">{{ estimatedHarvestFcr }} (Biofloc Superior &lt; 1.25)</span>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="tab-footer">
          <button type="button" class="btn-cancel font-mono" @click="emit('close')">Cancel</button>
          <button 
            type="button" 
            id="btn-confirm-harvest"
            class="btn-action harvest font-mono" 
            :disabled="isHarvesting || pond.fishCount === 0"
            @click="handleExecuteHarvest"
          >
            <Award :size="15" />
            <span>{{ isHarvesting ? 'Processing Harvest...' : `Confirm & Execute ${harvestType === 'FULL' ? 'Full Harvest' : 'Partial Thinning'}` }}</span>
          </button>
        </div>
      </div>

      <!-- TAB 2: TRANSFER / GRADING PANEL -->
      <div v-else-if="activeTab === 'TRANSFER'" class="tab-body">
        <div class="transfer-alert font-mono">
          <ArrowRightLeft :size="16" class="text-sky" />
          <div>
            <span class="alert-lead">Fish Grading & Pond Migration</span>
            <p class="alert-desc">Transfer sized fingerlings or graded grower batches from {{ pond.name }} into another destination pond. Both pond stocks will be atomically synchronized in MySQL.</p>
          </div>
        </div>

        <!-- Destination Pond Selection -->
        <div class="form-group font-mono">
          <label class="form-label" for="target-pond">
            <span>Select Destination Pond</span>
          </label>
          <select id="target-pond" v-model="targetPondId" class="form-select font-sans">
            <option v-for="p in availableTargetPonds" :key="p.id" :value="p.id">
              {{ p.name }} (ID: {{ p.id }}) — Current Stock: {{ p.fishCount?.toLocaleString() }} fish (~{{ Math.round((p.fishCount * p.avgWeightGrams) / 1000) }} kg)
            </option>
          </select>
        </div>

        <!-- Transfer Ratio Presets -->
        <div class="form-group font-mono">
          <label class="form-label">
            <span>Transfer Proportion (% of current stock)</span>
          </label>
          <div class="preset-buttons-row">
            <button 
              type="button" 
              class="preset-chip font-mono" 
              :class="{ active: transferPercent === 25 }"
              @click="transferPercent = 25"
            >
              25% ({{ Math.round(pond.fishCount * 0.25).toLocaleString() }} fish)
            </button>
            <button 
              type="button" 
              class="preset-chip font-mono" 
              :class="{ active: transferPercent === 50 }"
              @click="transferPercent = 50"
            >
              50% ({{ Math.round(pond.fishCount * 0.50).toLocaleString() }} fish)
            </button>
            <button 
              type="button" 
              class="preset-chip font-mono" 
              :class="{ active: transferPercent === 100 }"
              @click="transferPercent = 100"
            >
              100% (Empty Source — {{ pond.fishCount?.toLocaleString() }} fish)
            </button>
          </div>
        </div>

        <!-- Notes -->
        <div class="form-group font-mono">
          <label class="form-label" for="transfer-notes">
            <span>Grading Reason & Operator Notes</span>
          </label>
          <input 
            id="transfer-notes" 
            v-model="transferReason" 
            type="text" 
            class="form-input font-sans" 
            placeholder="e.g. Progressive size grading into Nursery 2"
          />
        </div>

        <!-- Transfer Projection -->
        <div class="summary-box font-mono">
          <div class="sum-row">
            <span class="s-lbl">Stock to Migrate:</span>
            <span class="s-val text-sky font-bold">{{ transferCount.toLocaleString() }} fish ({{ transferKg }} kg @ {{ pond.avgWeightGrams }}g)</span>
          </div>
          <div class="sum-row">
            <span class="s-lbl">Source Pond Post-Transfer:</span>
            <span class="s-val text-muted">{{ Math.max(0, pond.fishCount - transferCount).toLocaleString() }} fish remaining</span>
          </div>
          <div class="sum-row">
            <span class="s-lbl">Destination {{ selectedTargetPond?.name }}:</span>
            <span class="s-val text-emerald font-bold">{{ ((selectedTargetPond?.fishCount || 0) + transferCount).toLocaleString() }} total fish</span>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="tab-footer">
          <button type="button" class="btn-cancel font-mono" @click="emit('close')">Cancel</button>
          <button 
            type="button" 
            id="btn-confirm-transfer"
            class="btn-action transfer font-mono" 
            :disabled="isTransferring || pond.fishCount === 0"
            @click="handleExecuteTransfer"
          >
            <ArrowRightLeft :size="15" />
            <span>{{ isTransferring ? 'Processing Transfer...' : `Transfer ${transferCount.toLocaleString()} Fish to ${selectedTargetPond?.id || 'Target'}` }}</span>
          </button>
        </div>
      </div>

      <!-- TAB 3: RESTOCK / START FRESH CYCLE PANEL -->
      <div v-else class="tab-body">
        <div class="transfer-alert restock font-mono">
          <Sparkles :size="16" class="text-emerald" />
          <div>
            <span class="alert-lead">Restock & Initialize Fresh Culture Cycle</span>
            <p class="alert-desc">Reset the pond to Day of Culture 1 (DOC 1), register fingerlings, and set status to ACTIVE in MySQL database.</p>
          </div>
        </div>

        <div class="form-grid-2 font-mono">
          <div class="form-group">
            <label class="form-label" for="restock-count">
              <span>Fingerling Stock Population (fish)</span>
            </label>
            <input 
              id="restock-count" 
              v-model.number="restockCount" 
              type="number" 
              step="100" 
              min="100" 
              class="form-input" 
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="restock-abw">
              <span>Seed Body Weight (g / fish)</span>
            </label>
            <input 
              id="restock-abw" 
              v-model.number="restockAbw" 
              type="number" 
              step="1" 
              min="1" 
              class="form-input" 
            />
          </div>
        </div>

        <div class="form-grid-2 font-mono">
          <div class="form-group">
            <label class="form-label" for="restock-species">
              <span>Fish Species / Strain</span>
            </label>
            <input 
              id="restock-species" 
              v-model="restockSpecies" 
              type="text" 
              class="form-input" 
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="restock-phase">
              <span>Initial Growth Stage</span>
            </label>
            <select id="restock-phase" v-model="restockPhase" class="form-select font-sans">
              <option value="Nursery / Fingerling Conditioning">Nursery / Fingerling Conditioning</option>
              <option value="Grower Stage (Rapid Growth)">Grower Stage (Rapid Growth)</option>
              <option value="Finisher Stage (Ready for Harvest)">Finisher Stage (Ready for Harvest)</option>
            </select>
          </div>
        </div>

        <!-- Summary -->
        <div class="summary-box font-mono">
          <div class="sum-row">
            <span class="s-lbl">Initial Stock Biomass:</span>
            <span class="s-val text-emerald font-bold">{{ restockBiomassKg }} kg</span>
          </div>
          <div class="sum-row">
            <span class="s-lbl">Stocking Density:</span>
            <span class="s-val text-sky">{{ (restockBiomassKg / (pond.volumeM3 || 50)).toFixed(1) }} kg/m³</span>
          </div>
          <div class="sum-row">
            <span class="s-lbl">Starting Survival Rate:</span>
            <span class="s-val text-purple font-bold">100.0% SR (Reset)</span>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="tab-footer">
          <button type="button" class="btn-cancel font-mono" @click="emit('close')">Cancel</button>
          <button 
            type="button" 
            id="btn-confirm-restock"
            class="btn-action restock font-mono" 
            :disabled="isRestocking"
            @click="handleExecuteRestock"
          >
            <Sparkles :size="15" />
            <span>{{ isRestocking ? 'Initializing Cycle...' : `Initialize Fresh Cycle (${restockCount.toLocaleString()} Fish)` }}</span>
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
  z-index: 1050;
  padding: 20px;
}

.action-modal-card {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
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
  background: var(--amber-50);
  border: 1px solid var(--amber-200);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.text-amber { color: #d97706; }
.text-emerald { color: var(--emerald-600); }
.text-sky { color: var(--sky-600); }

.title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
}

.status-tag {
  font-size: 0.62rem;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 4px;
}
.status-tag.active {
  background: var(--emerald-50);
  color: var(--emerald-700);
  border: 1px solid var(--emerald-200);
}
.status-tag.harvested {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
}
.status-tag.transferred {
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
  background: #f1f5f9;
  color: var(--text-primary);
}

/* Tab Header */
.tab-header {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  background: var(--bg-surface-subtle);
  border-bottom: 1px solid var(--border-subtle);
  padding: 4px;
  gap: 4px;
}

.tab-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab-btn:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.5);
}

.tab-btn.active {
  background: #ffffff;
  color: var(--text-primary);
  border-color: var(--border-subtle);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

/* Tab Body */
.tab-body {
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Mode Selector Grid */
.mode-selector-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.mode-card {
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--border-medium);
  background: #ffffff;
  text-align: left;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: all 0.15s ease;
}

.mode-card:hover {
  border-color: var(--sky-400);
  background: var(--sky-50);
}

.mode-card.active {
  border-color: var(--emerald-500);
  background: var(--emerald-50);
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

.mode-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mode-title {
  font-size: 0.76rem;
  font-weight: 800;
  color: var(--text-primary);
}

.badge {
  font-size: 0.58rem;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
}
.badge-emerald {
  background: var(--emerald-100);
  color: var(--emerald-800);
}
.badge-sky {
  background: var(--sky-100);
  color: var(--sky-800);
}

.mode-desc {
  font-size: 0.64rem;
  color: var(--text-muted);
  line-height: 1.35;
}

.form-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.form-input, .form-select {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-medium);
  font-size: 0.8rem;
  color: var(--text-primary);
  background: #ffffff;
  transition: all 0.15s ease;
}

.form-input:focus, .form-select:focus {
  outline: none;
  border-color: var(--sky-500);
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15);
}

.input-with-unit {
  position: relative;
  display: flex;
  align-items: center;
}
.input-with-unit .form-input {
  width: 100%;
  padding-right: 45px;
}

.unit-tag {
  position: absolute;
  right: 10px;
  font-size: 0.68rem;
  color: var(--text-muted);
  font-weight: 700;
}

/* Summary Box */
.summary-box {
  background: #f8fafc;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sum-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.72rem;
}

.s-lbl {
  color: var(--text-muted);
}

.s-val {
  font-size: 0.78rem;
}

/* Transfer Alert */
.transfer-alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: var(--sky-50);
  border: 1px solid var(--sky-200);
  border-radius: 10px;
  padding: 12px 14px;
}
.transfer-alert.restock {
  background: var(--emerald-50);
  border-color: var(--emerald-200);
}

.alert-lead {
  font-size: 0.74rem;
  font-weight: 800;
  color: var(--text-primary);
  display: block;
}

.alert-desc {
  font-size: 0.65rem;
  color: var(--text-secondary);
  line-height: 1.35;
}

.preset-buttons-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.preset-chip {
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid var(--border-medium);
  background: #ffffff;
  color: var(--text-secondary);
  font-size: 0.68rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}
.preset-chip:hover {
  background: var(--sky-50);
  border-color: var(--sky-300);
}
.preset-chip.active {
  background: var(--sky-600);
  border-color: var(--sky-600);
  color: #ffffff;
}

/* Tab Footer */
.tab-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  padding-top: 14px;
  border-top: 1px solid var(--border-subtle);
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
.btn-cancel:hover { background: #f1f5f9; }

.btn-action {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 8px;
  border: none;
  color: #ffffff;
  font-size: 0.74rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-action.harvest {
  background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
  box-shadow: 0 2px 6px rgba(217, 119, 6, 0.3);
}
.btn-action.harvest:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(217, 119, 6, 0.4);
}

.btn-action.transfer {
  background: linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%);
  box-shadow: 0 2px 6px rgba(14, 165, 233, 0.3);
}
.btn-action.transfer:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(14, 165, 233, 0.4);
}

.btn-action.restock {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
}
.btn-action.restock:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(16, 185, 129, 0.4);
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .mode-selector-grid, .form-grid-2, .preset-buttons-row, .tab-header {
    grid-template-columns: 1fr;
  }
}
</style>
