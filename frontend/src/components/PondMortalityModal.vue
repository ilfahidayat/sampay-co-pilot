<script setup>
import { ref, computed } from 'vue'
import { usePonds } from '../composables/usePonds'
import { useToast } from '../composables/useToast'
import { 
  X, 
  AlertOctagon, 
  Skull, 
  Scale, 
  Trash2, 
  ShieldAlert, 
  TrendingDown, 
  Sparkles,
  Check
} from 'lucide-vue-next'

const props = defineProps({
  pond: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'recorded'])

const { recordFishMortality } = usePonds()
const { showToast } = useToast()

const count = ref(5)
const avgWeightGrams = ref(props.pond.avgWeightGrams || 100)
const cause = ref('Routine / Natural Mortality')
const disposalMethod = ref('Buried with Quicklime (SNI Biosecurity Standard)')
const notes = ref('Routine morning mortality inspection and skimming')

const quickPresets = [1, 5, 10, 20, 50]

const addPreset = (val) => {
  count.value = Math.max(1, count.value + val)
}

// Live calculations
const lostBiomassKg = computed(() => {
  const c = Number(count.value) || 0
  const w = Number(avgWeightGrams.value) || 0
  return Number(((c * w) / 1000).toFixed(2))
})

const projectedRemainingFish = computed(() => {
  return Math.max(0, props.pond.fishCount - Number(count.value || 0))
})

const projectedSurvivalRate = computed(() => {
  const initial = props.pond.initialFishCount || (props.pond.fishCount + (props.pond.cumulativeMortalityCount || 0))
  const newCumulativeMortality = (props.pond.cumulativeMortalityCount || 0) + Number(count.value || 0)
  return Number((((initial - newCumulativeMortality) / initial) * 100).toFixed(1))
})

const handleSubmit = async () => {
  if (count.value <= 0) {
    showToast('⚠️ Please enter a mortality count greater than 0', 'warning')
    return
  }

  const result = await recordFishMortality(props.pond.id, {
    count: count.value,
    avgWeightGrams: avgWeightGrams.value,
    cause: cause.value,
    disposalMethod: disposalMethod.value,
    notes: notes.value
  })

  if (result) {
    showToast(
      `💀 Mortality Recorded: -${count.value} fish logged for ${props.pond.name}. Saved to Database & SR updated to ${projectedSurvivalRate.value}%.`,
      'info'
    )
    emit('recorded', result)
    emit('close')
  }
}
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="modal-card glass-panel" role="dialog" aria-modal="true">
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="header-left">
          <div class="icon-avatar">
            <AlertOctagon :size="20" class="text-rose" />
          </div>
          <div>
            <h3 class="modal-title font-display">Record Fish Mortality Incident</h3>
            <span class="modal-sub font-mono">
              {{ pond.name }} (ID: {{ pond.id }}) • Population: {{ pond.fishCount?.toLocaleString() }} fish • SR: {{ pond.survivalRate || 95 }}%
            </span>
          </div>
        </div>
        <button class="btn-close" @click="emit('close')" aria-label="Close modal">
          <X :size="18" />
        </button>
      </div>

      <!-- Form Body -->
      <form class="modal-form" @submit.prevent="handleSubmit">
        <!-- Count Input & Quick Presets -->
        <div class="form-group font-mono">
          <div class="label-row">
            <label class="form-label" for="mortality-count">
              <span>Dead Fish Count</span>
              <span class="req">*</span>
            </label>
            <span class="stock-hint">Current: {{ pond.fishCount?.toLocaleString() }} fish</span>
          </div>

          <div class="input-with-presets">
            <input 
              id="mortality-count"
              v-model.number="count"
              type="number"
              min="1"
              :max="pond.fishCount"
              class="form-input count-input"
              required
            />
            <div class="quick-chips">
              <button 
                v-for="p in quickPresets" 
                :key="p"
                type="button"
                class="chip-btn font-mono"
                @click="count = p"
              >
                {{ p }} fish
              </button>
            </div>
          </div>
        </div>

        <!-- Weight & Biomass Loss -->
        <div class="grid-2 font-mono">
          <div class="form-group">
            <label class="form-label" for="dead-abw">
              <span>Average Fish Weight</span>
            </label>
            <div class="input-with-unit">
              <input 
                id="dead-abw"
                v-model.number="avgWeightGrams"
                type="number"
                step="1"
                min="1"
                max="2000"
                class="form-input"
              />
              <span class="unit-tag">g / fish</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">
              <span>Calculated Biomass Loss</span>
            </label>
            <div class="read-only-box">
              <span class="lost-val text-rose font-bold">-{{ lostBiomassKg }} kg</span>
              <span class="lost-sub">Biomass removed</span>
            </div>
          </div>
        </div>

        <!-- Cause of Mortality -->
        <div class="form-group font-mono">
          <label class="form-label" for="mortality-cause">
            <span>Observed Symptom / Cause of Death</span>
            <span class="req">*</span>
          </label>
          <select id="mortality-cause" v-model="cause" class="form-select font-sans">
            <option value="Routine / Natural Mortality">Routine / Natural Mortality (Normal Baseline)</option>
            <option value="Hypoxia / Low DO Stress">Hypoxia / Low Dissolved Oxygen Stress</option>
            <option value="Elevated Ammonia / TAN Deficit">Elevated Ammonia / TAN Toxicity</option>
            <option value="Cannibalism / Physical Injury">Cannibalism / Physical Bite Injury</option>
            <option value="Thermal Shock / Extreme Temperature">Thermal Shock / Extreme Temperature Fluctuation</option>
            <option value="Bacterial Infection / Fin Rot">Bacterial Infection / Fin Rot</option>
            <option value="Grading & Handling Stress">Grading & Handling Stress (Post-Transfer)</option>
          </select>
        </div>

        <!-- Disposal & Biosecurity Method -->
        <div class="form-group font-mono">
          <label class="form-label" for="mortality-disposal">
            <span>Disposal & Biosecurity Protocol</span>
          </label>
          <select id="mortality-disposal" v-model="disposalMethod" class="form-select font-sans">
            <option value="Buried with Quicklime (SNI Biosecurity Standard)">Buried with Quicklime (SNI Biosecurity Standard)</option>
            <option value="High-Temperature Incineration">High-Temperature Incineration (Isolated Pit)</option>
            <option value="Closed Anaerobic Ensiling">Closed Anaerobic Ensiling / Fish Silage Composting</option>
          </select>
        </div>

        <!-- Supervisor Notes -->
        <div class="form-group font-mono">
          <label class="form-label" for="mortality-notes">
            <span>Supervisor Notes / Corrective Actions</span>
          </label>
          <input 
            id="mortality-notes"
            v-model="notes"
            type="text"
            class="form-input font-sans"
            placeholder="e.g. Mortalities scooped; aerator output increased to 85% RPM"
          />
        </div>

        <!-- Live Impact Banner -->
        <div class="impact-preview-card font-mono">
          <div class="impact-header">
            <TrendingDown :size="14" class="text-rose" />
            <span class="impact-title">Pond Metric Impact Preview:</span>
          </div>

          <div class="impact-grid">
            <div class="impact-col">
              <span class="i-lbl">Remaining Population:</span>
              <span class="i-val text-primary font-bold">{{ projectedRemainingFish.toLocaleString() }} fish</span>
              <span class="i-sub text-rose">-{{ count }} fish</span>
            </div>

            <div class="impact-col">
              <span class="i-lbl">New Survival Rate (SR):</span>
              <span class="i-val text-purple font-bold">{{ projectedSurvivalRate }}%</span>
              <span class="i-sub">From {{ pond.survivalRate || 95 }}%</span>
            </div>

            <div class="impact-col">
              <span class="i-lbl">Cumulative Dead (Cycle):</span>
              <span class="i-val text-rose font-bold">{{ ((pond.cumulativeMortalityCount || 0) + Number(count || 0)).toLocaleString() }} fish</span>
              <span class="i-sub">{{ ((100 - projectedSurvivalRate)).toFixed(1) }}% Mortality</span>
            </div>
          </div>
        </div>

        <!-- Modal Actions -->
        <div class="modal-footer">
          <button type="button" class="btn-cancel font-mono" @click="emit('close')">
            Cancel
          </button>
          <button type="submit" id="btn-submit-mortality" class="btn-submit-mortality font-mono">
            <Skull :size="14" />
            <span>Record Mortality (-{{ count }} Fish)</span>
          </button>
        </div>
      </form>
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

.modal-card {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  width: 100%;
  max-width: 620px;
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
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.text-rose { color: var(--rose-600); }

.modal-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
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

.modal-form {
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.req {
  color: var(--rose-600);
}

.stock-hint {
  font-size: 0.64rem;
  color: var(--text-muted);
}

.input-with-presets {
  display: flex;
  gap: 10px;
}

.count-input {
  width: 140px;
}

.quick-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.chip-btn {
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

.chip-btn:hover {
  background: var(--sky-50);
  border-color: var(--sky-300);
  color: var(--sky-700);
}

.grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.form-input, .form-select {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-medium);
  font-size: 0.82rem;
  color: var(--text-primary);
  background: #ffffff;
  transition: all 0.15s ease;
}

.form-input:focus, .form-select:focus {
  outline: none;
  border-color: var(--rose-500);
  box-shadow: 0 0 0 3px rgba(244, 63, 94, 0.15);
}

.input-with-unit {
  position: relative;
  display: flex;
  align-items: center;
}

.input-with-unit .form-input {
  width: 100%;
  padding-right: 55px;
}

.unit-tag {
  position: absolute;
  right: 10px;
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--text-muted);
}

.read-only-box {
  background: #fff5f5;
  border: 1px solid #fecdd3;
  border-radius: 8px;
  padding: 7px 12px;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.lost-val {
  font-size: 0.95rem;
}

.lost-sub {
  font-size: 0.62rem;
  color: var(--text-muted);
}

/* Impact Preview Card */
.impact-preview-card {
  background: #fff5f5;
  border: 1px solid #fecdd3;
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.impact-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.impact-title {
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--rose-900);
}

.impact-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  background: #ffffff;
  border: 1px solid #fee2e2;
  border-radius: 8px;
  padding: 8px 12px;
}

.impact-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.i-lbl {
  font-size: 0.62rem;
  color: var(--text-muted);
}

.i-val {
  font-size: 0.88rem;
}

.i-sub {
  font-size: 0.58rem;
}

.modal-footer {
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

.btn-cancel:hover {
  background: #f1f5f9;
}

.btn-submit-mortality {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #e11d48 0%, #f43f5e 100%);
  color: #ffffff;
  font-size: 0.74rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(225, 29, 72, 0.3);
  transition: all 0.15s ease;
}

.btn-submit-mortality:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(225, 29, 72, 0.4);
}

@media (max-width: 600px) {
  .grid-2, .impact-grid {
    grid-template-columns: 1fr;
  }
}
</style>
