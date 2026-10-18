<script setup>
import { reactive } from 'vue'
import { mqttService } from '../services/mqttService'
import { pondState } from '../services/simulationEngine'

const props = defineProps({
  show: Boolean
})
const emit = defineEmits(['close'])

const form = reactive({
  mode: mqttService.mode,
  brokerUrl: mqttService.config.brokerUrl,
  deviceId: mqttService.config.deviceId,
  username: mqttService.config.username,
  password: mqttService.config.password,
})

const applyPreset = (preset) => {
  if (preset === 'local') {
    form.brokerUrl = 'ws://localhost:9001'
  } else if (preset === 'emqx') {
    form.brokerUrl = 'wss://broker.emqx.io:8084/mqtt'
  } else if (preset === 'hivemq') {
    form.brokerUrl = 'wss://broker.hivemq.com:8884/mqtt'
  }
}

const saveAndApply = () => {
  mqttService.setConfig({
    brokerUrl: form.brokerUrl,
    deviceId: form.deviceId,
    username: form.username,
    password: form.password,
  })
  pondState.deviceId = form.deviceId

  mqttService.setMode(form.mode)
  emit('close')
}
</script>

<template>
  <div v-if="show" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(15, 23, 42, 0.45); backdrop-filter: blur(4px);">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content bg-white border-0 shadow-lg text-dark" style="border-radius: 16px;">
        <div class="modal-header border-bottom py-3 px-4">
          <div class="d-flex align-items-center gap-2">
            <span class="badge bg-primary bg-opacity-10 text-primary p-2 rounded-circle">
              <i class="bi bi-sliders fs-6"></i>
            </span>
            <h5 class="modal-title fs-6 fw-bold mb-0">MQTT Communication & Operating Mode</h5>
          </div>
          <button type="button" class="btn-close" @click="emit('close')"></button>
        </div>

        <div class="modal-body p-4">
          <!-- Mode Selector -->
          <div class="mb-3">
            <label class="form-label fw-bold small text-secondary mb-2 d-block">Communication Bus:</label>
            
            <!-- Option 1: Virtual Bus -->
            <label 
              for="modeDummy"
              class="d-flex align-items-start gap-3 p-3 rounded-3 border mb-2 cursor-pointer transition-all"
              :class="form.mode === 'dummy' ? 'border-primary bg-primary bg-opacity-10' : 'border-secondary-subtle bg-light'"
              style="cursor: pointer;"
            >
              <div class="pt-0.5 flex-shrink-0">
                <input 
                  class="form-check-input m-0 cursor-pointer" 
                  type="radio" 
                  id="modeDummy" 
                  value="dummy" 
                  v-model="form.mode"
                  style="width: 1.15rem; height: 1.15rem; cursor: pointer;"
                >
              </div>
              <div class="flex-grow-1">
                <div class="d-flex align-items-center justify-content-between">
                  <span class="fw-bold text-dark" style="font-size: 0.88rem;">Internal Virtual Bus + Cross-Tab Sync</span>
                  <span v-if="form.mode === 'dummy'" class="badge bg-success bg-opacity-15 text-success border border-success border-opacity-30 font-monospace" style="font-size: 0.65rem;">ACTIVE</span>
                </div>
                <div class="small text-muted mt-1" style="font-size: 0.78rem; line-height: 1.4;">
                  Simulator runs standalone in the browser via <code>BroadcastChannel</code> directly syncing with the SAC dashboard at <a href="http://localhost:5175" target="_blank" class="fw-semibold text-primary text-decoration-none">localhost:5175</a>. No external broker required.
                </div>
              </div>
            </label>

            <!-- Option 2: Real MQTT -->
            <label 
              for="modeReal"
              class="d-flex align-items-start gap-3 p-3 rounded-3 border cursor-pointer transition-all"
              :class="form.mode === 'real' ? 'border-primary bg-primary bg-opacity-10' : 'border-secondary-subtle bg-light'"
              style="cursor: pointer;"
            >
              <div class="pt-0.5 flex-shrink-0">
                <input 
                  class="form-check-input m-0 cursor-pointer" 
                  type="radio" 
                  id="modeReal" 
                  value="real" 
                  v-model="form.mode"
                  style="width: 1.15rem; height: 1.15rem; cursor: pointer;"
                >
              </div>
              <div class="flex-grow-1">
                <div class="d-flex align-items-center justify-content-between">
                  <span class="fw-bold text-dark" style="font-size: 0.88rem;">Real MQTT over WebSocket</span>
                  <span v-if="form.mode === 'real'" class="badge bg-success bg-opacity-15 text-success border border-success border-opacity-30 font-monospace" style="font-size: 0.65rem;">ACTIVE</span>
                </div>
                <div class="small text-muted mt-1" style="font-size: 0.78rem; line-height: 1.4;">
                  Connects to local network or cloud MQTT brokers (Mosquitto/EMQX/HiveMQ) over WebSocket (ws:// or wss://).
                </div>
              </div>
            </label>
          </div>

          <!-- Real MQTT Settings -->
          <div v-if="form.mode === 'real'" class="border-top pt-3 mt-3">
            <div class="mb-3">
              <label class="form-label small text-secondary fw-semibold mb-1.5 d-block">Broker Presets:</label>
              <!-- Regular separate buttons (not grouped/stretched) -->
              <div class="d-flex flex-wrap gap-2">
                <button 
                  type="button" 
                  @click="applyPreset('local')" 
                  class="btn btn-sm btn-outline-secondary font-monospace"
                  style="font-size: 0.78rem;"
                >
                  <i class="bi bi-hdd-network me-1"></i>Local Mosquitto (9001)
                </button>
                <button 
                  type="button" 
                  @click="applyPreset('emqx')" 
                  class="btn btn-sm btn-outline-secondary font-monospace"
                  style="font-size: 0.78rem;"
                >
                  <i class="bi bi-cloud-check me-1"></i>EMQX Cloud (wss)
                </button>
                <button 
                  type="button" 
                  @click="applyPreset('hivemq')" 
                  class="btn btn-sm btn-outline-secondary font-monospace"
                  style="font-size: 0.78rem;"
                >
                  <i class="bi bi-cloud me-1"></i>HiveMQ (wss)
                </button>
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label small text-secondary fw-semibold">WebSocket URL:</label>
              <input type="text" class="form-control form-control-sm font-monospace" v-model="form.brokerUrl" placeholder="ws://localhost:9001">
            </div>

            <div class="row g-2 mb-3">
              <div class="col-6">
                <label class="form-label small text-secondary fw-semibold">Username (Optional):</label>
                <input type="text" class="form-control form-control-sm" v-model="form.username">
              </div>
              <div class="col-6">
                <label class="form-label small text-secondary fw-semibold">Password (Optional):</label>
                <input type="password" class="form-control form-control-sm" v-model="form.password">
              </div>
            </div>
          </div>

          <!-- Device ID -->
          <div class="border-top pt-3 mt-3">
            <label class="form-label small text-secondary fw-semibold">Device Node ID:</label>
            <input type="text" class="form-control form-control-sm font-monospace" v-model="form.deviceId">
            <div class="small text-muted mt-1 font-monospace" style="font-size: 0.75rem;">
              Telemetry Topic: <code>{{ form.deviceId }}/telemetry</code>
            </div>
          </div>
        </div>

        <div class="modal-footer border-top py-2 px-4 bg-light" style="border-bottom-left-radius: 16px; border-bottom-right-radius: 16px;">
          <button type="button" class="btn btn-light btn-sm border font-monospace" @click="emit('close')">Cancel</button>
          <button type="button" class="btn btn-primary btn-sm px-3 font-monospace fw-semibold" @click="saveAndApply">Apply Configuration</button>
        </div>
      </div>
    </div>
  </div>
</template>
