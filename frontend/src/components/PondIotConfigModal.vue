<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePonds } from '../composables/usePonds'
import { useToast } from '../composables/useToast'
import { apiClient } from '../services/apiClient'
import { 
  X, 
  Cpu, 
  Radio, 
  Wifi, 
  Check, 
  Clock, 
  Save, 
  RotateCcw,
  Layers,
  Settings2,
  Activity,
  Sliders,
  ShieldCheck,
  Server,
  Database,
  ArrowRight
} from 'lucide-vue-next'

const props = defineProps({
  pond: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'saved'])

const { updatePondIotConfig } = usePonds()
const { showToast } = useToast()

// Default fallback configuration based on pond ID
const pondNum = props.pond.id.replace(/\D/g, '') || '1'
const defaultIot = {
  deviceId: `ESP32-AQUA-0${pondNum}`,
  mqttTopic: `sac/pond00${pondNum}`,
  intervalSeconds: 21600, // 6 Hours
  protocol: 'MQTT Broker (v3.1.1 / WSS)',
  telemetryMode: 'BATCH_6H',
  sensors: ['DO_OPTICAL', 'PH_ELECTRODE', 'TEMP_PT100', 'IMHOFF_FLOC', 'TAN_AMMONIA'],
  calibrations: {
    doOffset: 0.0,
    phOffset: 0.0,
    tempOffset: 0.0
  }
}

// Current config merged with defaults
const currentConfig = props.pond.iotConfig || defaultIot

const deviceId = ref(currentConfig.deviceId || defaultIot.deviceId)
const mqttTopic = ref(currentConfig.mqttTopic || defaultIot.mqttTopic)
const intervalSeconds = ref(currentConfig.intervalSeconds || 21600)
const protocol = ref(currentConfig.protocol || defaultIot.protocol)
const telemetryMode = ref(currentConfig.telemetryMode || defaultIot.telemetryMode)

// Registered hardware nodes inventory (Loaded from MySQL database table `hardware_nodes`)
const hardwareNodes = ref([
  {
    id: 'sac/pond001',
    device_tag: 'ESP32-AQUA-01',
    name: 'Field Controller Node #1 (Pond K01 Primary Gateway)',
    chip_model: 'ESP32-WROOM-32D Dual-Core 240MHz',
    firmware_version: 'v2.4.1-SNI',
    mqtt_topic: 'sac/pond001',
    default_pond_id: 'K01',
    status: 'ONLINE'
  },
  {
    id: 'sac/pond002',
    device_tag: 'ESP32-AQUA-02',
    name: 'Field Controller Node #2 (Pond K02 Primary Gateway)',
    chip_model: 'ESP32-WROOM-32D Dual-Core 240MHz',
    firmware_version: 'v2.4.1-SNI',
    mqtt_topic: 'sac/pond002',
    default_pond_id: 'K02',
    status: 'ONLINE'
  },
  {
    id: 'sac/pond003',
    device_tag: 'ESP32-AQUA-03',
    name: 'Field Controller Node #3 (Pond K03 Primary Gateway)',
    chip_model: 'ESP32-WROOM-32D Dual-Core 240MHz',
    firmware_version: 'v2.4.1-SNI',
    mqtt_topic: 'sac/pond003',
    default_pond_id: 'K03',
    status: 'ONLINE'
  },
  {
    id: 'sac/pond004',
    device_tag: 'ESP32-AQUA-04',
    name: 'Field Controller Node #4 (Pond K04 Primary Gateway)',
    chip_model: 'ESP32-WROOM-32D Dual-Core 240MHz',
    firmware_version: 'v2.4.1-SNI',
    mqtt_topic: 'sac/pond004',
    default_pond_id: 'K04',
    status: 'ONLINE'
  },
  {
    id: 'sac/pond005',
    device_tag: 'ESP32-AQUA-05',
    name: 'Modular Standby Node #5 (Hot Spare Gateway)',
    chip_model: 'ESP32-S3-WROOM-1 N16R8',
    firmware_version: 'v2.5.0-rc',
    mqtt_topic: 'sac/pond005',
    default_pond_id: null,
    status: 'STANDBY'
  },
  {
    id: 'sac/pond006',
    device_tag: 'ESP32-AQUA-06',
    name: 'Mobile Calibration & Testing Node #6',
    chip_model: 'ESP32-S3-WROOM-1 N16R8',
    firmware_version: 'v2.5.0-rc',
    mqtt_topic: 'sac/pond006',
    default_pond_id: null,
    status: 'STANDBY'
  }
])

onMounted(async () => {
  try {
    const dbNodes = await apiClient.getHardwareNodes()
    if (dbNodes && dbNodes.length > 0) {
      hardwareNodes.value = dbNodes
    }
  } catch (err) {
    console.warn('[PondIotConfigModal] Load hardware nodes error:', err)
  }
})

// Current selected hardware device object
const selectedHardware = computed(() => {
  return hardwareNodes.value.find(h => h.device_tag === deviceId.value || h.mqtt_topic === mqttTopic.value) || hardwareNodes.value[0]
})

// When user selects a device from the dropdown, auto-bind device_tag and mqtt_topic
const onHardwareDeviceSelected = (event) => {
  const chosenTag = event.target.value
  const node = hardwareNodes.value.find(h => h.device_tag === chosenTag)
  if (node) {
    deviceId.value = node.device_tag
    mqttTopic.value = node.mqtt_topic
  }
}

const selectedSensors = ref(
  Array.isArray(currentConfig.sensors) && currentConfig.sensors.length > 0
    ? [...currentConfig.sensors]
    : [...defaultIot.sensors]
)

const doOffset = ref(currentConfig.calibrations?.doOffset ?? 0.0)
const phOffset = ref(currentConfig.calibrations?.phOffset ?? 0.0)
const tempOffset = ref(currentConfig.calibrations?.tempOffset ?? 0.0)

const isSaving = ref(false)

const availableSensors = [
  { id: 'DO_OPTICAL', name: 'Dissolved Oxygen Probe', desc: 'Optical Luminescent DO Sensor (0–20 mg/L)' },
  { id: 'PH_ELECTRODE', name: 'pH Glass Electrode', desc: 'Industrial Double-Junction Glass Electrode (pH 0–14)' },
  { id: 'TEMP_PT100', name: 'Water Temperature RTD', desc: 'High-Precision PT100 Stainless Steel Sensor' },
  { id: 'IMHOFF_FLOC', name: 'Imhoff-Vision AI Floc Probe', desc: 'Optical Density 860nm NIR probe for floc volume' },
  { id: 'TAN_AMMONIA', name: 'Ammonia (TAN) ISE Sensor', desc: 'Total Ammonia Nitrogen Ion-Selective Electrode' }
]

const toggleSensor = (id) => {
  if (selectedSensors.value.includes(id)) {
    selectedSensors.value = selectedSensors.value.filter(s => s !== id)
  } else {
    selectedSensors.value.push(id)
  }
}

const handleSave = async () => {
  isSaving.value = true
  const payload = {
    deviceId: deviceId.value.trim(),
    mqttTopic: mqttTopic.value.trim(),
    nodeId: selectedHardware.value?.id || mqttTopic.value.trim(),
    intervalSeconds: Number(intervalSeconds.value),
    protocol: protocol.value,
    telemetryMode: telemetryMode.value,
    sensors: selectedSensors.value,
    calibrations: {
      doOffset: Number(doOffset.value),
      phOffset: Number(phOffset.value),
      tempOffset: Number(tempOffset.value)
    }
  }

  const success = await updatePondIotConfig(props.pond.id, payload)
  isSaving.value = false

  if (success) {
    showToast(`✅ IoT Settings saved for ${props.pond.name} (Gateway: ${deviceId.value})`, 'success')
    emit('saved', payload)
    emit('close')
  } else {
    showToast(`⚠️ Failed to save IoT settings to database.`, 'error')
  }
}
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="iot-modal-card glass-panel" role="dialog" aria-modal="true">
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="header-left">
          <div class="icon-avatar">
            <Cpu :size="20" class="text-sky" />
          </div>
          <div>
            <div class="title-row">
              <h3 class="modal-title font-display">IoT Edge Gateway & Telemetry Configuration</h3>
              <span class="pond-badge font-mono">{{ pond.name }} ({{ pond.id }})</span>
            </div>
            <span class="modal-sub font-mono">
              Select from registered hardware devices, configure MQTT telemetry topics, transmission schedules, and sensor calibration
            </span>
          </div>
        </div>
        <button class="btn-close" @click="emit('close')" aria-label="Close modal">
          <X :size="18" />
        </button>
      </div>

      <!-- Form Body -->
      <form class="modal-form" @submit.prevent="handleSave">
        <!-- Hardware Selection Dropdown (Only pick from registered devices) -->
        <div class="form-group font-mono">
          <label class="form-label" for="hardware-selector">
            <Server :size="13" class="text-sky" />
            <span>Select Hardware Device from Registered Gateways:</span>
          </label>
          <select 
            id="hardware-selector"
            class="form-select font-sans"
            :value="deviceId"
            @change="onHardwareDeviceSelected"
          >
            <option 
              v-for="hw in hardwareNodes" 
              :key="hw.device_tag" 
              :value="hw.device_tag"
            >
              [{{ hw.device_tag }}] {{ hw.name }} • Channel: {{ hw.mqtt_topic }} ({{ hw.status }})
            </option>
          </select>
          <span class="form-hint">Choose any verified edge controller node registered in the farm hardware inventory</span>
        </div>

        <!-- Hardware Details & Binding Card -->
        <div class="hardware-spec-card font-mono">
          <div class="spec-head">
            <div class="spec-head-left">
              <Cpu :size="15" class="text-sky" />
              <span class="spec-title">Hardware Specifications & Edge Binding</span>
            </div>
            <span 
              class="hw-status-pill"
              :class="selectedHardware?.status === 'ONLINE' ? 'online' : 'standby'"
            >
              <span class="pulse-dot" :class="selectedHardware?.status === 'ONLINE' ? 'online' : 'standby'"></span>
              <span>{{ selectedHardware?.status || 'ONLINE' }}</span>
            </span>
          </div>

          <div class="spec-grid">
            <div class="spec-item">
              <span class="spec-lbl">Hardware Device Tag:</span>
              <span class="spec-val font-bold text-sky">{{ selectedHardware?.device_tag || deviceId }}</span>
            </div>
            <div class="spec-item">
              <span class="spec-lbl">MQTT Telemetry Topic:</span>
              <code class="spec-val-code text-emerald">{{ selectedHardware?.mqtt_topic || mqttTopic }}</code>
            </div>
            <div class="spec-item">
              <span class="spec-lbl">Chipset / Processor:</span>
              <span class="spec-val">{{ selectedHardware?.chip_model || 'ESP32-WROOM-32D Dual-Core' }}</span>
            </div>
            <div class="spec-item">
              <span class="spec-lbl">Firmware Version:</span>
              <span class="spec-val">{{ selectedHardware?.firmware_version || 'v2.4.1-SNI' }}</span>
            </div>
          </div>

          <!-- Storage Architecture Disclosure -->
          <div class="storage-info-strip">
            <Database :size="12" class="text-muted" />
            <span>
              <strong>Data Storage:</strong> Hardware device specs reside in MySQL table <code>hardware_nodes</code>. Active pond assignment and sampling settings are stored in MySQL table <code>ponds.iot_config</code>.
            </span>
          </div>
        </div>

        <!-- Telemetry Schedule & Protocol -->
        <div class="grid-2 font-mono">
          <div class="form-group">
            <label class="form-label" for="iot-schedule">
              <Clock :size="13" class="text-amber" />
              <span>Transmission & Ingestion Interval</span>
            </label>
            <select id="iot-schedule" v-model.number="intervalSeconds" class="form-select font-sans">
              <option :value="21600">Every 6 Hours (06:00, 12:00, 18:00, 00:00) — Scheduled Cycle</option>
              <option :value="3600">Every 1 Hour (Hourly Biofloc Monitoring)</option>
              <option :value="900">Every 15 Minutes (High-Frequency Sampling)</option>
              <option :value="60">Continuous Stream (1-Minute Realtime Edge Telemetry)</option>
            </select>
            <span class="form-hint">Matches system schedule for telemetry data acquisition</span>
          </div>

          <div class="form-group">
            <label class="form-label" for="iot-protocol">
              <Wifi :size="13" class="text-purple" />
              <span>Communication Protocol</span>
            </label>
            <select id="iot-protocol" v-model="protocol" class="form-select font-sans">
              <option value="MQTT Broker (v3.1.1 / WSS)">MQTT Broker (v3.1.1 / WSS over TLS)</option>
              <option value="RS485 Modbus RTU">RS485 Industrial Modbus RTU Serial</option>
              <option value="HTTP REST Ingestion">HTTP REST Webhook Ingestion API</option>
            </select>
            <span class="form-hint">Active transport layer for telemetry packets</span>
          </div>
        </div>

        <!-- Attached Sensor Matrix -->
        <div class="form-group font-mono">
          <label class="form-label">
            <Activity :size="13" class="text-sky" />
            <span>Active Edge Sensor Probes Assigned</span>
          </label>
          <div class="sensor-matrix">
            <div 
              v-for="s in availableSensors" 
              :key="s.id"
              class="sensor-chip"
              :class="{ selected: selectedSensors.includes(s.id) }"
              @click="toggleSensor(s.id)"
            >
              <div class="chip-check">
                <Check v-if="selectedSensors.includes(s.id)" :size="12" />
              </div>
              <div class="chip-info">
                <span class="chip-name">{{ s.name }}</span>
                <span class="chip-desc">{{ s.desc }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Sensor Calibration Offsets (Fine Tuning) -->
        <div class="calibration-section font-mono">
          <div class="calib-header">
            <Sliders :size="14" class="text-sky" />
            <span class="calib-title">Sensor Calibration & Precision Offsets</span>
          </div>

          <div class="calib-grid">
            <div class="calib-item">
              <span class="calib-lbl">DO Probe Offset (mg/L):</span>
              <div class="input-offset-wrap">
                <input 
                  v-model.number="doOffset" 
                  type="number" 
                  step="0.05" 
                  min="-2.0" 
                  max="2.0" 
                  class="calib-input"
                />
                <span class="calib-unit">mg/L</span>
              </div>
            </div>

            <div class="calib-item">
              <span class="calib-lbl">pH Probe Offset:</span>
              <div class="input-offset-wrap">
                <input 
                  v-model.number="phOffset" 
                  type="number" 
                  step="0.05" 
                  min="-1.5" 
                  max="1.5" 
                  class="calib-input"
                />
                <span class="calib-unit">pH</span>
              </div>
            </div>

            <div class="calib-item">
              <span class="calib-lbl">Temperature Offset (°C):</span>
              <div class="input-offset-wrap">
                <input 
                  v-model.number="tempOffset" 
                  type="number" 
                  step="0.1" 
                  min="-3.0" 
                  max="3.0" 
                  class="calib-input"
                />
                <span class="calib-unit">°C</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer font-mono">
          <button type="button" class="btn-cancel" @click="emit('close')">
            Cancel
          </button>
          <button type="submit" id="btn-save-iot-config" class="btn-save" :disabled="isSaving">
            <Save :size="14" />
            <span>{{ isSaving ? 'Saving...' : 'Save IoT Configuration' }}</span>
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
  z-index: 1050;
  padding: 20px;
}

.iot-modal-card {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  width: 100%;
  max-width: 760px;
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
}

.modal-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
}

.pond-badge {
  font-size: 0.65rem;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--sky-100);
  color: var(--sky-800);
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

.modal-form {
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 6px;
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

.form-hint {
  font-size: 0.62rem;
  color: var(--text-muted);
}

/* Hardware Spec Card */
.hardware-spec-card {
  background: #f8fafc;
  border: 1px solid var(--border-medium);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.spec-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 8px;
}

.spec-head-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.spec-title {
  font-size: 0.74rem;
  font-weight: 800;
  color: var(--text-primary);
}

.hw-status-pill {
  font-size: 0.6rem;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.hw-status-pill.online {
  background: var(--emerald-50);
  color: var(--emerald-700);
  border: 1px solid var(--emerald-200);
}

.hw-status-pill.standby {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.pulse-dot.online { background: #10b981; }
.pulse-dot.standby { background: #94a3b8; }

.spec-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 14px;
}

.spec-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.spec-lbl {
  font-size: 0.62rem;
  color: var(--text-muted);
}

.spec-val {
  font-size: 0.72rem;
  color: var(--text-primary);
}

.spec-val-code {
  font-size: 0.72rem;
  font-weight: 700;
}

.storage-info-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 0.62rem;
  color: var(--text-secondary);
}

.storage-info-strip code {
  color: #0284c7;
  font-weight: 700;
}

/* Sensor Matrix */
.sensor-matrix {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.sensor-chip {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
  background: #fafaf9;
  cursor: pointer;
  transition: all 0.15s ease;
}

.sensor-chip:hover {
  background: #f1f5f9;
  border-color: var(--border-medium);
}

.sensor-chip.selected {
  background: var(--sky-50);
  border-color: var(--sky-300);
}

.chip-check {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1px solid var(--border-medium);
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--sky-600);
  flex-shrink: 0;
}

.sensor-chip.selected .chip-check {
  background: var(--sky-600);
  border-color: var(--sky-600);
  color: #ffffff;
}

.chip-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.chip-name {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-primary);
}

.chip-desc {
  font-size: 0.62rem;
  color: var(--text-muted);
}

/* Calibration Section */
.calibration-section {
  background: #f8fafc;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.calib-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.calib-title {
  font-size: 0.74rem;
  font-weight: 800;
  color: var(--text-secondary);
}

.calib-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.calib-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.calib-lbl {
  font-size: 0.62rem;
  color: var(--text-muted);
}

.input-offset-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.calib-input {
  width: 100%;
  padding: 6px 10px;
  padding-right: 40px;
  border-radius: 6px;
  border: 1px solid var(--border-medium);
  background: #ffffff;
  font-size: 0.75rem;
  font-weight: 700;
}
.calib-input:focus {
  outline: none;
  border-color: var(--sky-500);
}

.calib-unit {
  position: absolute;
  right: 8px;
  font-size: 0.62rem;
  color: var(--text-muted);
}

/* Modal Footer */
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
.btn-cancel:hover { background: #f1f5f9; }

.btn-save {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%);
  color: #ffffff;
  font-size: 0.74rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(14, 165, 233, 0.3);
  transition: all 0.15s ease;
}
.btn-save:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(14, 165, 233, 0.4);
}

@media (max-width: 600px) {
  .grid-2, .calib-grid {
    grid-template-columns: 1fr;
  }
}
</style>
