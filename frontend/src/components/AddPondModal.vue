<script setup>
import { ref, computed } from 'vue'
import { usePonds } from '../composables/usePonds'
import { useToast } from '../composables/useToast'
import { 
  Plus, 
  X, 
  Waves, 
  Fish, 
  Scale, 
  Calendar, 
  Sparkles, 
  Check, 
  Info,
  Layers,
  ArrowRight
} from 'lucide-vue-next'

const emit = defineEmits(['close', 'created'])

const { ponds, addPond } = usePonds()
const { showToast } = useToast()

// Suggest next ID
const nextPondNumber = computed(() => {
  return ponds.value.length + 1
})

const defaultId = computed(() => {
  return `K0${nextPondNumber.value}`
})

// Form state
const form = ref({
  id: defaultId.value,
  name: `Pond ${nextPondNumber.value}`,
  volumeM3: 50,
  species: 'Red Tilapia (Oreochromis niloticus)',
  phase: 'Nursery Stage (Fingerlings)',
  fishCount: 3000,
  avgWeightGrams: 15,
  stockingDate: new Date().toISOString().split('T')[0],
  targetHarvestWeightGrams: 850
})

// Real-time calculated initial biomass
const calculatedBiomassKg = computed(() => {
  const count = Number(form.value.fishCount) || 0
  const weight = Number(form.value.avgWeightGrams) || 0
  return Number(((count * weight) / 1000).toFixed(1))
})

// Stocking Density in kg/m3 and fish/m3
const densityKgM3 = computed(() => {
  const vol = Number(form.value.volumeM3) || 1
  return (calculatedBiomassKg.value / vol).toFixed(2)
})

const densityFishM3 = computed(() => {
  const vol = Number(form.value.volumeM3) || 1
  return Math.round(Number(form.value.fishCount || 0) / vol)
})

// Recommended initial feed ramp (4% biomass per day for fingerlings)
const recommendedDailyFeed = computed(() => {
  return (calculatedBiomassKg.value * 0.04).toFixed(1)
})

const errors = ref({})

const validate = () => {
  errors.value = {}
  if (!form.value.id.trim()) {
    errors.value.id = 'Pond ID is required'
  } else if (ponds.value.some(p => p.id.toUpperCase() === form.value.id.trim().toUpperCase())) {
    errors.value.id = 'This Pond ID already exists. Please choose a unique ID.'
  }

  if (!form.value.name.trim()) errors.value.name = 'Pond name is required'
  if (form.value.volumeM3 <= 0) errors.value.volumeM3 = 'Volume must be > 0 m³'
  if (form.value.fishCount <= 0) errors.value.fishCount = 'Fingerling count must be > 0'
  if (form.value.avgWeightGrams <= 0) errors.value.avgWeightGrams = 'Initial weight must be > 0'

  return Object.keys(errors.value).length === 0
}

const handleSubmit = () => {
  if (!validate()) return

  const createdPond = addPond({
    id: form.value.id.trim().toUpperCase(),
    name: form.value.name.trim(),
    volumeM3: Number(form.value.volumeM3),
    species: form.value.species,
    phase: form.value.phase,
    fishCount: Number(form.value.fishCount),
    avgWeightGrams: Number(form.value.avgWeightGrams),
    initialBiomassKg: calculatedBiomassKg.value,
    targetHarvestWeightGrams: Number(form.value.targetHarvestWeightGrams),
    stockingDate: form.value.stockingDate
  })

  showToast(`✅ New Pond ${createdPond.id} (${createdPond.name}) registered successfully!`, 'success')
  emit('created', createdPond)
  emit('close')
}
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="modal-card glass-panel" role="dialog" aria-modal="true">
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="header-left">
          <div class="icon-avatar">
            <Plus :size="20" class="text-sky" />
          </div>
          <div>
            <h3 class="modal-title font-display">Register New Production Pond</h3>
            <span class="modal-sub font-mono">Stocking parameters, initial fingerling biomass & hardware binding</span>
          </div>
        </div>
        <button class="btn-close" @click="emit('close')" aria-label="Close modal">
          <X :size="18" />
        </button>
      </div>

      <!-- Form Body -->
      <form class="modal-form" @submit.prevent="handleSubmit">
        <!-- Section 1: Pond Identification -->
        <div class="form-section">
          <div class="section-title-row">
            <Layers :size="14" class="text-sky" />
            <span class="section-heading">1. Pond Identification & Dimension</span>
          </div>

          <div class="grid-2">
            <!-- Pond ID -->
            <div class="form-group">
              <label class="form-label" for="pond-id">
                <span>Pond Identifier (ID)</span>
                <span class="req">*</span>
              </label>
              <input 
                id="pond-id" 
                v-model="form.id" 
                type="text" 
                class="form-input font-mono" 
                placeholder="e.g. K05" 
                :class="{ error: errors.id }"
                maxlength="8"
              />
              <span v-if="errors.id" class="error-msg">{{ errors.id }}</span>
            </div>

            <!-- Pond Name -->
            <div class="form-group">
              <label class="form-label" for="pond-name">
                <span>Pond Name / Title</span>
                <span class="req">*</span>
              </label>
              <input 
                id="pond-name" 
                v-model="form.name" 
                type="text" 
                class="form-input font-sans" 
                placeholder="e.g. Pond 5 — Nursery B" 
                :class="{ error: errors.name }"
              />
              <span v-if="errors.name" class="error-msg">{{ errors.name }}</span>
            </div>
          </div>

          <div class="grid-2">
            <!-- Water Volume -->
            <div class="form-group">
              <label class="form-label" for="pond-volume">
                <span>Effective Water Volume (m³)</span>
                <span class="req">*</span>
              </label>
              <div class="input-with-unit">
                <input 
                  id="pond-volume" 
                  v-model.number="form.volumeM3" 
                  type="number" 
                  step="1" 
                  min="5" 
                  max="500" 
                  class="form-input font-mono" 
                  :class="{ error: errors.volumeM3 }"
                />
                <span class="unit-tag font-mono">m³</span>
              </div>
              <span class="field-hint">Approx. {{ (form.volumeM3 * 1000).toLocaleString() }} Liters</span>
              <span v-if="errors.volumeM3" class="error-msg">{{ errors.volumeM3 }}</span>
            </div>

            <!-- Culture Stage / Phase -->
            <div class="form-group">
              <label class="form-label" for="pond-phase">
                <span>Production Stage</span>
              </label>
              <select id="pond-phase" v-model="form.phase" class="form-select">
                <option value="Nursery Stage (Fingerlings)">Nursery Stage (10g - 85g)</option>
                <option value="Grower Stage (Rapid Growth)">Grower Stage (85g - 450g)</option>
                <option value="Finisher Stage (Ready for Harvest)">Finisher Stage (450g - 950g+)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Section 2: Fish Seed Stocking & Initial Biomass -->
        <div class="form-section">
          <div class="section-title-row">
            <Fish :size="14" class="text-emerald" />
            <span class="section-heading">2. Fish Seed Stocking & Initial Biomass</span>
          </div>

          <!-- Species -->
          <div class="form-group">
            <label class="form-label" for="pond-species">
              <span>Tilapia Species / Strain</span>
            </label>
            <select id="pond-species" v-model="form.species" class="form-select">
              <option value="Red Tilapia (Oreochromis niloticus)">Red Tilapia F1 (Oreochromis niloticus)</option>
              <option value="Black Tilapia (Gift Strain)">Black Tilapia (GIFT Strain)</option>
              <option value="Super Biofloc Tilapia">Super Biofloc Tilapia (Certified Strain)</option>
              <option value="Oreochromis mossambicus">Mozambique Tilapia (Oreochromis mossambicus)</option>
            </select>
          </div>

          <div class="grid-2">
            <!-- Fingerlings Population -->
            <div class="form-group">
              <label class="form-label" for="fish-count">
                <span>Fingerling Stock Population</span>
                <span class="req">*</span>
              </label>
              <div class="input-with-unit">
                <input 
                  id="fish-count" 
                  v-model.number="form.fishCount" 
                  type="number" 
                  step="50" 
                  min="100" 
                  max="50000" 
                  class="form-input font-mono" 
                  :class="{ error: errors.fishCount }"
                />
                <span class="unit-tag font-mono">fish</span>
              </div>
              <span v-if="errors.fishCount" class="error-msg">{{ errors.fishCount }}</span>
            </div>

            <!-- Average Fingerling Weight -->
            <div class="form-group">
              <label class="form-label" for="fish-weight">
                <span>Initial Fingerling Weight</span>
                <span class="req">*</span>
              </label>
              <div class="input-with-unit">
                <input 
                  id="fish-weight" 
                  v-model.number="form.avgWeightGrams" 
                  type="number" 
                  step="0.5" 
                  min="1" 
                  max="500" 
                  class="form-input font-mono" 
                  :class="{ error: errors.avgWeightGrams }"
                />
                <span class="unit-tag font-mono">g / fish</span>
              </div>
              <span v-if="errors.avgWeightGrams" class="error-msg">{{ errors.avgWeightGrams }}</span>
            </div>
          </div>

          <div class="grid-2">
            <!-- Stocking Date -->
            <div class="form-group">
              <label class="form-label" for="stock-date">
                <span>Stocking Date</span>
              </label>
              <input 
                id="stock-date" 
                v-model="form.stockingDate" 
                type="date" 
                class="form-input font-mono"
              />
            </div>

            <!-- Target Harvest Weight -->
            <div class="form-group">
              <label class="form-label" for="target-harvest">
                <span>Target Harvest Weight</span>
              </label>
              <div class="input-with-unit">
                <input 
                  id="target-harvest" 
                  v-model.number="form.targetHarvestWeightGrams" 
                  type="number" 
                  step="10" 
                  min="50" 
                  max="1500" 
                  class="form-input font-mono"
                />
                <span class="unit-tag font-mono">g / fish</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Calculated Live Preview Card -->
        <div class="biomass-summary-card font-mono">
          <div class="summary-top">
            <span class="summary-label">
              <Sparkles :size="13" class="text-sky" />
              <span>Calculated Stocking Biomass & Operational Density:</span>
            </span>
            <span class="badge badge-emerald">SNI 7550:2009 Compliant</span>
          </div>

          <div class="summary-metrics-grid">
            <div class="metric-col">
              <span class="m-lbl">Total Initial Biomass:</span>
              <span class="m-val text-sky">{{ calculatedBiomassKg }} kg</span>
              <span class="m-desc">{{ form.fishCount?.toLocaleString() }} fish × {{ form.avgWeightGrams }}g</span>
            </div>
            <div class="metric-col">
              <span class="m-lbl">Stocking Density:</span>
              <span class="m-val text-emerald">{{ densityKgM3 }} kg/m³</span>
              <span class="m-desc">~{{ densityFishM3 }} fish/m³</span>
            </div>
            <div class="metric-col">
              <span class="m-lbl">Initial Feeding Ramp:</span>
              <span class="m-val text-amber">{{ recommendedDailyFeed }} kg/day</span>
              <span class="m-desc">4.0% Body Weight Initial Ratio</span>
            </div>
          </div>
        </div>

        <!-- Modal Actions -->
        <div class="modal-footer">
          <button type="button" class="btn-cancel font-mono" @click="emit('close')">
            Cancel
          </button>
          <button type="submit" id="btn-submit-new-pond" class="btn-submit font-mono">
            <Plus :size="15" />
            <span>Register & Initialize Pond {{ form.id }}</span>
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
  background: rgba(15, 23, 42, 0.6);
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
  max-width: 680px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
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
  background: var(--sky-50);
  border: 1px solid var(--sky-200);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.modal-title {
  font-size: 1.08rem;
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
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  font-weight: 800;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--border-subtle);
}

.grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
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
  display: flex;
  align-items: center;
  gap: 4px;
}

.req {
  color: var(--rose-600);
  font-weight: 800;
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
  border-color: var(--sky-500);
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15);
}

.form-input.error {
  border-color: var(--rose-500);
  background: #fff5f5;
}

.error-msg {
  font-size: 0.65rem;
  color: var(--rose-600);
  font-weight: 600;
}

.field-hint {
  font-size: 0.65rem;
  color: var(--text-muted);
}

.input-with-unit {
  position: relative;
  display: flex;
  align-items: center;
}

.input-with-unit .form-input {
  width: 100%;
  padding-right: 50px;
}

.unit-tag {
  position: absolute;
  right: 10px;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-muted);
  pointer-events: none;
}

/* Biomass Summary Card */
.biomass-summary-card {
  background: linear-gradient(135deg, #f0fdf4 0%, #f0f9ff 100%);
  border: 1px solid var(--emerald-200);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.summary-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--emerald-900);
}

.summary-metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  background: #ffffff;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
}

.metric-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.m-lbl {
  font-size: 0.62rem;
  color: var(--text-muted);
  font-weight: 700;
}

.m-val {
  font-size: 1.05rem;
  font-weight: 800;
  line-height: 1.1;
}

.m-desc {
  font-size: 0.58rem;
  color: var(--text-muted);
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
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-cancel:hover {
  background: #f1f5f9;
  color: var(--text-primary);
}

.btn-submit {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%);
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(2, 132, 199, 0.3);
  transition: all 0.15s ease;
}

.btn-submit:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(2, 132, 199, 0.4);
}

@media (max-width: 600px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
  .summary-metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
