<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { simulationEngine } from '../services/simulationEngine'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  node: {
    type: Object,
    default: () => null
  }
})

const emit = defineEmits(['close'])

const form = reactive({
  dissolvedOxygen: 6.4,
  ph: 7.5,
  temperature: 28.5,
  ammonia: 0.02,
  flocDensity: 14.5,
  isLocked: true,
  simulationCondition: 'custom'
})

const isSending = ref(false)

// Sync values when modal opens or node changes
watch(() => props.show, (newVal) => {
  if (newVal && props.node) {
    form.dissolvedOxygen = Number(props.node.dissolvedOxygen ?? 6.4)
    form.ph = Number(props.node.ph ?? 7.5)
    form.temperature = Number(props.node.temperature ?? 28.5)
    form.ammonia = Number(props.node.ammonia ?? 0.02)
    form.flocDensity = Number(props.node.flocDensity ?? 14.5)
    form.isLocked = props.node.isLocked ?? true
    form.simulationCondition = props.node.simulationCondition ?? 'custom'
  }
})

// Biofloc Clinical Indicators
// Biofloc Clinical Indicators (Concise badges that won't break layout)
const doStatus = computed(() => {
  const v = form.dissolvedOxygen
  if (v < 3.8) return { label: 'HYPOXIA', class: 'badge bg-danger' }
  if (v < 5.0) return { label: 'SUB-OPTIMAL', class: 'badge bg-warning text-dark' }
  if (v <= 7.8) return { label: 'OPTIMAL', class: 'badge bg-success' }
  return { label: 'SATURATED', class: 'badge bg-info text-dark' }
})

const phStatus = computed(() => {
  const v = form.ph
  if (v < 6.8) return { label: 'ACIDIC', class: 'badge bg-danger' }
  if (v <= 8.2) return { label: 'OPTIMAL', class: 'badge bg-success' }
  return { label: 'ALKALINE', class: 'badge bg-warning text-dark' }
})

const tempStatus = computed(() => {
  const v = form.temperature
  if (v < 26.0) return { label: 'COOL', class: 'badge bg-primary' }
  if (v <= 30.5) return { label: 'OPTIMAL', class: 'badge bg-success' }
  return { label: 'HEAT STRESS', class: 'badge bg-danger' }
})

const ammoniaStatus = computed(() => {
  const v = form.ammonia
  if (v < 0.05) return { label: 'SAFE TAN', class: 'badge bg-success' }
  if (v <= 0.45) return { label: 'ELEVATED', class: 'badge bg-warning text-dark' }
  return { label: 'CRITICAL SPIKE', class: 'badge bg-danger' }
})

const flocStatus = computed(() => {
  const v = form.flocDensity
  if (v < 10) return { label: 'LOW FLOC', class: 'badge bg-secondary' }
  if (v <= 22) return { label: 'OPTIMAL FLOC', class: 'badge bg-success' }
  return { label: 'SLUDGE HIGH', class: 'badge bg-danger' }
})

// Quick Scenario Presets
const applyPreset = (type) => {
  if (type === 'optimal') {
    form.dissolvedOxygen = 6.40
    form.ph = 7.50
    form.temperature = 28.5
    form.ammonia = 0.02
    form.flocDensity = 14.5
    form.simulationCondition = 'ok'
  } else if (type === 'hypoxia') {
    form.dissolvedOxygen = 2.40
    form.ph = 6.70
    form.temperature = 31.0
    form.ammonia = 0.35
    form.flocDensity = 17.5
    form.simulationCondition = 'danger'
  } else if (type === 'ammonia') {
    form.dissolvedOxygen = 5.10
    form.ph = 7.20
    form.temperature = 29.2
    form.ammonia = 0.75
    form.flocDensity = 19.0
    form.simulationCondition = 'warning'
  } else if (type === 'sludge') {
    form.dissolvedOxygen = 4.70
    form.ph = 6.90
    form.temperature = 28.0
    form.ammonia = 0.25
    form.flocDensity = 32.0
    form.simulationCondition = 'warning'
  }
}

const onSaveOnly = () => {
  if (!props.node) return
  simulationEngine.updateNodeSensors(props.node.id, { ...form }, false)
  emit('close')
}

const onSaveAndTransmit = () => {
  if (!props.node) return
  isSending.value = true
  simulationEngine.updateNodeSensors(props.node.id, { ...form }, true)
  setTimeout(() => {
    isSending.value = false
    emit('close')
  }, 400)
}
</script>

<template>
  <div v-if="show && node" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(15, 23, 42, 0.55); backdrop-filter: blur(5px); z-index: 1060;">
    <div class="modal-dialog modal-dialog-centered" style="max-width: 680px;">
      <div class="modal-content bg-white border-0 shadow-2xl text-dark" style="border-radius: 18px; overflow: hidden;">
        <!-- Modal Header -->
        <div class="modal-header bg-slate-900 text-white py-3 px-4 d-flex align-items-center justify-content-between" style="background-color: #0f172a;">
          <div class="d-flex align-items-center gap-2.5">
            <span class="badge p-2 rounded-3 text-white" :class="'bg-' + node.pondId.toLowerCase()" style="background-color: #4f46e5;">
              <i class="bi bi-sliders2 fs-5"></i>
            </span>
            <div>
              <div class="fw-bold font-monospace text-white fs-6 lh-sm">
                ADJUST TELEMETRY SENSORS • {{ node.name }}
              </div>
              <div class="text-secondary small font-monospace" style="font-size: 0.72rem; color: #94a3b8 !important;">
                Edge Node: {{ node.id }} ({{ node.pondId }}) • Water Quality Fine-Tuning
              </div>
            </div>
          </div>
          <button type="button" class="btn-close btn-close-white" @click="emit('close')"></button>
        </div>

        <!-- Modal Body -->
        <div class="modal-body p-3 p-sm-4" style="background-color: #f8fafc; max-height: calc(85vh - 120px); overflow-y: auto;">
          <!-- Quick Biofloc Scenario Buttons (Separate standard buttons) -->
          <div class="p-3 mb-3 bg-white rounded-3 border shadow-sm">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="fw-bold text-secondary font-monospace small d-flex align-items-center gap-1.5" style="font-size: 0.76rem;">
                <i class="bi bi-lightning-charge-fill text-warning"></i>
                SCENARIO PRESETS:
              </span>
              <span class="text-muted small font-monospace d-none d-sm-inline" style="font-size: 0.68rem;">Inject biofloc water quality profile</span>
            </div>
            <div class="d-flex flex-wrap gap-2">
              <button 
                @click="applyPreset('optimal')" 
                type="button" 
                class="btn btn-sm btn-outline-success font-monospace px-2.5 py-1 text-nowrap d-flex align-items-center gap-1 shadow-2xs"
                style="font-size: 0.76rem;"
              >
                <i class="bi bi-check-circle-fill"></i>
                <span>Optimal Biofloc</span>
              </button>
              <button 
                @click="applyPreset('hypoxia')" 
                type="button" 
                class="btn btn-sm btn-outline-danger font-monospace px-2.5 py-1 text-nowrap d-flex align-items-center gap-1 shadow-2xs"
                style="font-size: 0.76rem;"
              >
                <i class="bi bi-radioactive"></i>
                <span>Acute Hypoxia</span>
              </button>
              <button 
                @click="applyPreset('ammonia')" 
                type="button" 
                class="btn btn-sm btn-outline-warning text-dark font-monospace px-2.5 py-1 text-nowrap d-flex align-items-center gap-1 shadow-2xs"
                style="font-size: 0.76rem;"
              >
                <i class="bi bi-exclamation-triangle-fill"></i>
                <span>Ammonia Spike</span>
              </button>
              <button 
                @click="applyPreset('sludge')" 
                type="button" 
                class="btn btn-sm btn-outline-secondary font-monospace px-2.5 py-1 text-nowrap d-flex align-items-center gap-1 shadow-2xs"
                style="font-size: 0.76rem;"
              >
                <i class="bi bi-water"></i>
                <span>Sludge Overload</span>
              </button>
            </div>
          </div>

          <!-- 5 Sensor Parameter Adjusters (Symmetrical, Clean, No Odd Elements) -->
          <div class="d-flex flex-column gap-2.5">
            <!-- 1. Dissolved Oxygen (DO) -->
            <div class="p-3 bg-white rounded-3 shadow-sm border">
              <div class="d-flex justify-content-between align-items-center mb-1.5">
                <label class="form-label fw-bold mb-0 text-dark small font-monospace d-flex align-items-center gap-1.5">
                  <i class="bi bi-droplet-half text-primary fs-6"></i>
                  <span>Dissolved Oxygen (DO)</span>
                </label>
                <span :class="doStatus.class" class="font-monospace" style="font-size: 0.68rem; padding: 3px 8px;">{{ doStatus.label }}</span>
              </div>
              <div class="d-flex align-items-center gap-3">
                <input 
                  type="range" 
                  class="form-range flex-grow-1" 
                  min="0.5" 
                  max="10.0" 
                  step="0.05" 
                  v-model.number="form.dissolvedOxygen"
                >
                <div class="input-group input-group-sm flex-shrink-0" style="width: 120px;">
                  <input 
                    type="number" 
                    class="form-control text-end fw-bold font-monospace" 
                    min="0.0" 
                    max="15.0" 
                    step="0.05" 
                    v-model.number="form.dissolvedOxygen"
                  >
                  <span class="input-group-text font-monospace text-muted" style="font-size: 0.72rem; min-width: 48px; justify-content: center;">mg/L</span>
                </div>
              </div>
              <div class="d-flex justify-content-between text-muted font-monospace mt-1" style="font-size: 0.68rem;">
                <span>Min: 0.5 mg/L</span>
                <span class="text-success fw-bold">Optimal Target: 5.0 - 7.5 mg/L</span>
                <span>Max: 10.0 mg/L</span>
              </div>
            </div>

            <!-- 2. Ammonia TAN -->
            <div class="p-3 bg-white rounded-3 shadow-sm border">
              <div class="d-flex justify-content-between align-items-center mb-1.5">
                <label class="form-label fw-bold mb-0 text-dark small font-monospace d-flex align-items-center gap-1.5">
                  <i class="bi bi-virus text-danger fs-6"></i>
                  <span>Total Ammonia Nitrogen (TAN)</span>
                </label>
                <span :class="ammoniaStatus.class" class="font-monospace" style="font-size: 0.68rem; padding: 3px 8px;">{{ ammoniaStatus.label }}</span>
              </div>
              <div class="d-flex align-items-center gap-3">
                <input 
                  type="range" 
                  class="form-range flex-grow-1" 
                  min="0.00" 
                  max="2.50" 
                  step="0.01" 
                  v-model.number="form.ammonia"
                >
                <div class="input-group input-group-sm flex-shrink-0" style="width: 120px;">
                  <input 
                    type="number" 
                    class="form-control text-end fw-bold font-monospace" 
                    min="0.00" 
                    max="5.00" 
                    step="0.01" 
                    v-model.number="form.ammonia"
                  >
                  <span class="input-group-text font-monospace text-muted" style="font-size: 0.72rem; min-width: 48px; justify-content: center;">ppm</span>
                </div>
              </div>
              <div class="d-flex justify-content-between text-muted font-monospace mt-1" style="font-size: 0.68rem;">
                <span>Min: 0.00 ppm</span>
                <span class="text-success fw-bold">Safe Target: &lt; 0.05 ppm</span>
                <span>Max: 2.50 ppm</span>
              </div>
            </div>

            <!-- 3. pH Level -->
            <div class="p-3 bg-white rounded-3 shadow-sm border">
              <div class="d-flex justify-content-between align-items-center mb-1.5">
                <label class="form-label fw-bold mb-0 text-dark small font-monospace d-flex align-items-center gap-1.5">
                  <i class="bi bi-thermometer-half text-info fs-6"></i>
                  <span>pH Level (Water Acidity)</span>
                </label>
                <span :class="phStatus.class" class="font-monospace" style="font-size: 0.68rem; padding: 3px 8px;">{{ phStatus.label }}</span>
              </div>
              <div class="d-flex align-items-center gap-3">
                <input 
                  type="range" 
                  class="form-range flex-grow-1" 
                  min="5.0" 
                  max="9.5" 
                  step="0.05" 
                  v-model.number="form.ph"
                >
                <div class="input-group input-group-sm flex-shrink-0" style="width: 120px;">
                  <input 
                    type="number" 
                    class="form-control text-end fw-bold font-monospace" 
                    min="4.0" 
                    max="11.0" 
                    step="0.05" 
                    v-model.number="form.ph"
                  >
                  <span class="input-group-text font-monospace text-muted" style="font-size: 0.72rem; min-width: 48px; justify-content: center;">pH</span>
                </div>
              </div>
              <div class="d-flex justify-content-between text-muted font-monospace mt-1" style="font-size: 0.68rem;">
                <span>Min: 5.0 pH</span>
                <span class="text-success fw-bold">Biofloc Target: 7.0 - 8.0</span>
                <span>Max: 9.5 pH</span>
              </div>
            </div>

            <!-- 4. Water Temperature -->
            <div class="p-3 bg-white rounded-3 shadow-sm border">
              <div class="d-flex justify-content-between align-items-center mb-1.5">
                <label class="form-label fw-bold mb-0 text-dark small font-monospace d-flex align-items-center gap-1.5">
                  <i class="bi bi-fire text-warning fs-6"></i>
                  <span>Water Temperature</span>
                </label>
                <span :class="tempStatus.class" class="font-monospace" style="font-size: 0.68rem; padding: 3px 8px;">{{ tempStatus.label }}</span>
              </div>
              <div class="d-flex align-items-center gap-3">
                <input 
                  type="range" 
                  class="form-range flex-grow-1" 
                  min="20.0" 
                  max="38.0" 
                  step="0.1" 
                  v-model.number="form.temperature"
                >
                <div class="input-group input-group-sm flex-shrink-0" style="width: 120px;">
                  <input 
                    type="number" 
                    class="form-control text-end fw-bold font-monospace" 
                    min="15.0" 
                    max="42.0" 
                    step="0.1" 
                    v-model.number="form.temperature"
                  >
                  <span class="input-group-text font-monospace text-muted" style="font-size: 0.72rem; min-width: 48px; justify-content: center;">°C</span>
                </div>
              </div>
              <div class="d-flex justify-content-between text-muted font-monospace mt-1" style="font-size: 0.68rem;">
                <span>Min: 20.0 °C</span>
                <span class="text-success fw-bold">Tilapia Target: 28.0 - 30.0 °C</span>
                <span>Max: 38.0 °C</span>
              </div>
            </div>

            <!-- 5. Biofloc Density (Imhoff Cone mL/L) -->
            <div class="p-3 bg-white rounded-3 shadow-sm border">
              <div class="d-flex justify-content-between align-items-center mb-1.5">
                <label class="form-label fw-bold mb-0 text-dark small font-monospace d-flex align-items-center gap-1.5">
                  <i class="bi bi-cup-fill text-success fs-6"></i>
                  <span>Biofloc Volume / Density (Imhoff)</span>
                </label>
                <span :class="flocStatus.class" class="font-monospace" style="font-size: 0.68rem; padding: 3px 8px;">{{ flocStatus.label }}</span>
              </div>
              <div class="d-flex align-items-center gap-3">
                <input 
                  type="range" 
                  class="form-range flex-grow-1" 
                  min="0.0" 
                  max="50.0" 
                  step="0.5" 
                  v-model.number="form.flocDensity"
                >
                <div class="input-group input-group-sm flex-shrink-0" style="width: 120px;">
                  <input 
                    type="number" 
                    class="form-control text-end fw-bold font-monospace" 
                    min="0.0" 
                    max="100.0" 
                    step="0.5" 
                    v-model.number="form.flocDensity"
                  >
                  <span class="input-group-text font-monospace text-muted" style="font-size: 0.72rem; min-width: 48px; justify-content: center;">mL/L</span>
                </div>
              </div>
              <div class="d-flex justify-content-between text-muted font-monospace mt-1" style="font-size: 0.68rem;">
                <span>Min: 0.0 mL/L</span>
                <span class="text-success fw-bold">Optimal Target: 10 - 20 mL/L</span>
                <span>Max: 50.0 mL/L</span>
              </div>
            </div>
          </div>

          <!-- Drift Lock Option -->
          <div class="form-check form-switch mt-3 ms-1">
            <input class="form-check-input" type="checkbox" id="check-lock-values" v-model="form.isLocked">
            <label class="form-check-label font-monospace small text-secondary" for="check-lock-values" style="font-size: 0.76rem;">
              <strong>Lock Sensor Settings</strong> (Prevents natural simulation drift from altering values before transmission)
            </label>
          </div>
        </div>

        <!-- Modal Footer Actions -->
        <div class="modal-footer bg-white border-top py-3 px-4 d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div class="text-secondary small font-monospace d-none d-md-block" style="font-size: 0.72rem;">
            <i class="bi bi-info-circle me-1"></i>Select <strong>Save & Send Data Now</strong> to transmit immediately to MQTT.
          </div>

          <div class="d-flex align-items-center gap-2 ms-auto">
            <button type="button" class="btn btn-outline-secondary font-monospace btn-sm px-3" @click="emit('close')">
              Cancel
            </button>
            <button type="button" class="btn btn-outline-primary font-monospace btn-sm px-3 fw-semibold" @click="onSaveOnly">
              <i class="bi bi-check-lg me-1"></i>Save Values
            </button>
            <button type="button" class="btn btn-primary font-monospace btn-sm px-3 fw-bold shadow-sm" :disabled="isSending" @click="onSaveAndTransmit">
              <i :class="isSending ? 'bi bi-arrow-repeat animate-spin' : 'bi bi-send-fill'" class="me-1"></i>
              <span>{{ isSending ? 'TRANSMITTING...' : 'Save & Send Data Now' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
