<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { apiClient } from '../services/apiClient'
import { 
  Sparkles, 
  Radio, 
  Settings, 
  X, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Cpu, 
  ShieldCheck, 
  RefreshCw,
  ExternalLink
} from 'lucide-vue-next'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'updated'])

const activeTab = ref('ai') // 'ai' | 'mqtt'
const isLoading = ref(false)
const showApiKey = ref(false)
const showMqttPassword = ref(false)
const saveSuccessMsg = ref('')

const aiForm = reactive({
  useMock: true,
  modelName: 'gemini-3.8-flash',
  apiKey: ''
})

const mqttForm = reactive({
  brokerUrl: 'wss://broker.emqx.io:8084/mqtt',
  clientId: 'sac-backend-server',
  username: '',
  password: ''
})

const fetchConfig = async () => {
  isLoading.value = true
  try {
    const data = await apiClient.getSystemConfig()
    if (data) {
      if (data.ai) {
        aiForm.useMock = data.ai.mockMode ?? true
        aiForm.modelName = data.ai.model || 'gemini-3.8-flash'
        aiForm.apiKey = data.ai.apiKeyMasked || ''
      }
      if (data.mqtt) {
        mqttForm.brokerUrl = data.mqtt.brokerUrl || 'wss://broker.emqx.io:8084/mqtt'
        mqttForm.clientId = data.mqtt.clientId || 'sac-backend-server'
        mqttForm.username = data.mqtt.username || ''
        mqttForm.password = ''
      }
    }
  } catch (err) {
    console.warn('[SystemConfig] Failed to fetch config:', err.message)
  } finally {
    isLoading.value = false
  }
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    saveSuccessMsg.value = ''
    fetchConfig()
  }
})

onMounted(() => {
  if (props.show) fetchConfig()
})

const applyMqttPreset = (preset) => {
  if (preset === 'emqx') {
    mqttForm.brokerUrl = 'wss://broker.emqx.io:8084/mqtt'
  } else if (preset === 'local') {
    mqttForm.brokerUrl = 'ws://localhost:9001'
  } else if (preset === 'hivemq') {
    mqttForm.brokerUrl = 'wss://broker.hivemq.com:8884/mqtt'
  }
}

const saveAiConfig = async () => {
  isLoading.value = true
  saveSuccessMsg.value = ''
  try {
    const payload = {
      useMock: aiForm.useMock,
      modelName: aiForm.modelName
    }
    // Only send apiKey if edited (not just the masked version)
    if (aiForm.apiKey && !aiForm.apiKey.includes('...')) {
      payload.apiKey = aiForm.apiKey
    }

    const res = await apiClient.updateAiConfig(payload)
    if (res && res.success) {
      saveSuccessMsg.value = res.message || 'Gemini AI Configuration updated successfully.'
      emit('updated')
      setTimeout(() => {
        emit('close')
      }, 1000)
    }
  } catch (err) {
    console.error('Failed to update AI config:', err)
  } finally {
    isLoading.value = false
  }
}

const saveMqttConfig = async () => {
  isLoading.value = true
  saveSuccessMsg.value = ''
  try {
    const res = await apiClient.updateMqttConfig({
      brokerUrl: mqttForm.brokerUrl,
      clientId: mqttForm.clientId,
      username: mqttForm.username,
      password: mqttForm.password
    })
    if (res && res.success) {
      saveSuccessMsg.value = res.message || 'MQTT Broker reconnecting...'
      emit('updated')
      setTimeout(() => {
        emit('close')
      }, 1000)
    }
  } catch (err) {
    console.error('Failed to update MQTT config:', err)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div v-if="show" class="config-modal-backdrop" @click.self="emit('close')">
    <div class="config-modal-card">
      <!-- Modal Header -->
      <div class="modal-header-bar">
        <div class="header-title-box">
          <div class="icon-avatar">
            <Settings :size="18" />
          </div>
          <div>
            <h3 class="header-title">System & Connectivity Configuration</h3>
            <p class="header-subtitle">Google Gemini AI Engine & MQTT IoT Communication Configuration</p>
          </div>
        </div>
        <button class="btn-close-modal" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>

      <!-- Navigation Tabs -->
      <div class="modal-tabs-bar">
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'ai' }" 
          @click="activeTab = 'ai'"
        >
          <Sparkles :size="15" />
          <span>Google Gemini AI Engine</span>
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'mqtt' }" 
          @click="activeTab = 'mqtt'"
        >
          <Radio :size="15" />
          <span>MQTT IoT Broker Link</span>
        </button>
      </div>

      <!-- Modal Body -->
      <div class="modal-body-container">
        <!-- Storage Location Persistence Banner -->
        <div class="storage-info-strip font-mono">
          <ShieldCheck :size="14" class="text-emerald" />
          <span><strong>Storage Target:</strong> Persistently saved to <code>backend/.env</code> & server runtime memory.</span>
        </div>

        <!-- Success Alert Message -->
        <div v-if="saveSuccessMsg" class="success-banner">
          <CheckCircle2 :size="16" />
          <span>{{ saveSuccessMsg }}</span>
        </div>

        <!-- TAB 1: Gemini AI Settings -->
        <div v-if="activeTab === 'ai'" class="tab-pane">
          <div class="section-label">SELECT AI OPERATIONAL MODE:</div>
          
          <div class="mode-cards-grid">
            <!-- Mode 1: Local Mock Engine (Zero Credit Cost) -->
            <div 
              class="mode-card" 
              :class="{ selected: aiForm.useMock }"
              @click="aiForm.useMock = true"
            >
              <div class="mode-card-header">
                <div class="d-flex align-items-center gap-2">
                  <span class="mode-badge green">RECOMMENDED</span>
                  <span class="mode-title">Local Mock Simulation</span>
                </div>
                <div class="custom-radio" :class="{ checked: aiForm.useMock }">
                  <div class="radio-dot"></div>
                </div>
              </div>
              <p class="mode-description">
                100% offline with <strong>0 credit cost</strong> and 0ms latency. Grounded in Avnimelech Biofloc (2009) stoichiometry and Nile Tilapia biology.
              </p>
              <div class="mode-features">
                <span>✓ Zero risk of 402 Resource Exhausted</span>
                <span>✓ High-throughput telemetry evaluation & rapid chat</span>
              </div>
            </div>

            <!-- Mode 2: Live Google GenAI API -->
            <div 
              class="mode-card" 
              :class="{ selected: !aiForm.useMock }"
              @click="aiForm.useMock = false"
            >
              <div class="mode-card-header">
                <div class="d-flex align-items-center gap-2">
                  <span class="mode-badge purple">CLOUD AI</span>
                  <span class="mode-title">Live Google AI Studio API</span>
                </div>
                <div class="custom-radio" :class="{ checked: !aiForm.useMock }">
                  <div class="radio-dot"></div>
                </div>
              </div>
              <p class="mode-description">
                Directly calls cloud Google GenAI models via API Key. Consumes Google Cloud AI Studio credits per request.
              </p>
              <div class="mode-features">
                <span>⚡ Latest cloud generative models</span>
                <span>⚠️ Requires active API key & available credit quota</span>
              </div>
            </div>
          </div>

          <!-- Model Selection -->
          <div class="form-group mt-3">
            <label class="input-label">GEMINI MODEL SELECTION:</label>
            <select v-model="aiForm.modelName" class="form-select font-mono">
              <option value="gemini-3.8-flash">gemini-3.8-flash (Recommended • Ultra Low Latency)</option>
              <option value="gemini-2.5-flash">gemini-2.5-flash (Standard Fast Inference)</option>
              <option value="gemini-1.5-pro">gemini-1.5-pro (High Reasoning Depth)</option>
            </select>
          </div>

          <!-- API Key Input -->
          <div class="form-group mt-3">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <label class="input-label mb-0">GOOGLE GEMINI API KEY:</label>
              <a 
                href="https://aistudio.google.com/app/api-keys" 
                target="_blank" 
                class="api-key-link"
              >
                <span>Get API Key from Google AI Studio</span>
                <ExternalLink :size="12" />
              </a>
            </div>
            <div class="input-with-button">
              <input 
                :type="showApiKey ? 'text' : 'password'"
                v-model="aiForm.apiKey"
                placeholder="Enter API Key (e.g. AQ.Ab8RN6Lo...)"
                class="form-input font-mono"
              />
              <button 
                type="button" 
                class="btn-toggle-eye" 
                @click="showApiKey = !showApiKey"
                title="Show / Hide API Key"
              >
                <Eye v-if="!showApiKey" :size="16" />
                <EyeOff v-else :size="16" />
              </button>
            </div>
            <span class="form-tip">
              *When using Local Mock Simulation, you can run all evaluations and chat features without an active API key.
            </span>
          </div>
        </div>

        <!-- TAB 2: MQTT Broker Settings -->
        <div v-if="activeTab === 'mqtt'" class="tab-pane">
          <div class="section-label">PUBLIC & LOCAL BROKER PRESETS:</div>
          <div class="preset-buttons-row">
            <button 
              type="button" 
              class="btn-preset" 
              :class="{ active: mqttForm.brokerUrl.includes('emqx.io') }"
              @click="applyMqttPreset('emqx')"
            >
              <Radio :size="14" />
              <span>EMQX Cloud (Default)</span>
            </button>
            <button 
              type="button" 
              class="btn-preset" 
              :class="{ active: mqttForm.brokerUrl.includes('localhost') }"
              @click="applyMqttPreset('local')"
            >
              <Cpu :size="14" />
              <span>Local Mosquitto / EMQX (Port 9001)</span>
            </button>
            <button 
              type="button" 
              class="btn-preset" 
              :class="{ active: mqttForm.brokerUrl.includes('hivemq.com') }"
              @click="applyMqttPreset('hivemq')"
            >
              <ShieldCheck :size="14" />
              <span>HiveMQ Cloud Public</span>
            </button>
          </div>

          <!-- Broker URL Input -->
          <div class="form-group mt-3">
            <label class="input-label">MQTT BROKER WEBSOCKET URL:</label>
            <input 
              type="text" 
              v-model="mqttForm.brokerUrl"
              placeholder="wss://broker.emqx.io:8084/mqtt"
              class="form-input font-mono"
            />
            <span class="form-tip">
              WebSocket broker URL shared across Backend, Frontend, and IoT Simulator.
            </span>
          </div>

          <!-- Client ID -->
          <div class="form-group mt-3">
            <label class="input-label">MQTT CLIENT ID PREFIX:</label>
            <input 
              type="text" 
              v-model="mqttForm.clientId"
              class="form-input font-mono"
            />
          </div>

          <!-- Username & Password Row (Optional Auth) -->
          <div class="row-2col mt-3">
            <div class="form-group">
              <label class="input-label">MQTT USERNAME (OPTIONAL):</label>
              <input 
                type="text" 
                v-model="mqttForm.username"
                placeholder="e.g. emqx_user"
                class="form-input font-mono"
              />
            </div>
            <div class="form-group">
              <label class="input-label">MQTT PASSWORD (OPTIONAL):</label>
              <div class="input-with-button">
                <input 
                  :type="showMqttPassword ? 'text' : 'password'"
                  v-model="mqttForm.password"
                  placeholder="Broker password..."
                  class="form-input font-mono"
                />
                <button 
                  type="button" 
                  class="btn-toggle-eye" 
                  @click="showMqttPassword = !showMqttPassword"
                  title="Show / Hide Password"
                >
                  <Eye v-if="!showMqttPassword" :size="16" />
                  <EyeOff v-else :size="16" />
                </button>
              </div>
            </div>
          </div>
          <span class="form-tip">
            *Required only if your MQTT broker enforces authentication (e.g., HiveMQ Cloud Auth or Private Mosquitto).
          </span>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="modal-footer-bar">
        <button type="button" class="btn-cancel" @click="emit('close')">
          Cancel
        </button>
        <button 
          v-if="activeTab === 'ai'"
          type="button" 
          class="btn-save" 
          :disabled="isLoading"
          @click="saveAiConfig"
        >
          <RefreshCw v-if="isLoading" :size="15" class="animate-spin" />
          <Sparkles v-else :size="15" />
          <span>{{ isLoading ? 'Saving...' : 'Save AI Settings' }}</span>
        </button>
        <button 
          v-if="activeTab === 'mqtt'"
          type="button" 
          class="btn-save" 
          :disabled="isLoading"
          @click="saveMqttConfig"
        >
          <RefreshCw v-if="isLoading" :size="15" class="animate-spin" />
          <Radio v-else :size="15" />
          <span>{{ isLoading ? 'Connecting...' : 'Save & Reconnect Broker' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.config-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.config-modal-card {
  background: #ffffff;
  border-radius: 16px;
  width: 100%;
  max-width: 640px;
  box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.25);
  border: 1px solid var(--border-subtle, #e2e8f0);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modal-pop 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modal-pop {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid #f1f5f9;
}

.header-title-box {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #4f46e5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-title {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.header-subtitle {
  font-size: 0.74rem;
  color: #64748b;
  margin: 2px 0 0 0;
}

.btn-close-modal {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.btn-close-modal:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.modal-tabs-bar {
  display: flex;
  background: #f8fafc;
  padding: 6px 16px;
  border-bottom: 1px solid #e2e8f0;
  gap: 8px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab-btn:hover {
  color: #0f172a;
}

.tab-btn.active {
  background: #ffffff;
  color: #4f46e5;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.modal-body-container {
  padding: 24px;
  max-height: 480px;
  overflow-y: auto;
}

.storage-info-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #334155;
  border-radius: 8px;
  font-size: 0.72rem;
  margin-bottom: 14px;
}

.storage-info-strip code {
  background: #e2e8f0;
  color: #0f172a;
  padding: 1px 5px;
  border-radius: 4px;
  font-weight: 700;
}

.success-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #065f46;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  margin-bottom: 16px;
}

.section-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
}

.mode-cards-grid, .row-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 600px) {
  .mode-cards-grid, .row-2col {
    grid-template-columns: 1fr;
  }
}

.mode-card {
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
}

.mode-card:hover {
  border-color: #cbd5e1;
}

.mode-card.selected {
  border-color: #4f46e5;
  background: #fdfefe;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
}

.mode-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.mode-title {
  font-size: 0.84rem;
  font-weight: 700;
  color: #0f172a;
}

.mode-badge {
  font-size: 0.62rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

.mode-badge.green {
  background: #ecfdf5;
  color: #059669;
}

.mode-badge.purple {
  background: #f5f3ff;
  color: #7c3aed;
}

.custom-radio {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.custom-radio.checked {
  border-color: #4f46e5;
}

.radio-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: transparent;
  transition: all 0.15s ease;
}

.custom-radio.checked .radio-dot {
  background: #4f46e5;
}

.mode-description {
  font-size: 0.74rem;
  color: #475569;
  line-height: 1.35;
  margin: 0 0 10px 0;
  flex: 1;
}

.mode-features {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 0.68rem;
  color: #64748b;
  border-top: 1px dashed #f1f5f9;
  padding-top: 8px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.input-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: #475569;
  letter-spacing: 0.4px;
}

.api-key-link {
  font-size: 0.72rem;
  color: #4f46e5;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
}

.api-key-link:hover {
  text-decoration: underline;
}

.form-input, .form-select {
  width: 100%;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  font-size: 0.82rem;
  color: #0f172a;
  outline: none;
  transition: all 0.15s ease;
}

.form-input:focus, .form-select:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
}

.input-with-button {
  position: relative;
  display: flex;
  align-items: center;
}

.input-with-button input {
  padding-right: 40px;
}

.btn-toggle-eye {
  position: absolute;
  right: 8px;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-toggle-eye:hover {
  color: #475569;
}

.form-tip {
  font-size: 0.68rem;
  color: #94a3b8;
  margin-top: 2px;
}

.preset-buttons-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-preset {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #334155;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
}

.btn-preset:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.btn-preset.active {
  border-color: #4f46e5;
  background: #eef2ff;
  color: #4338ca;
}

.modal-footer-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid #f1f5f9;
  background: #f8fafc;
}

.btn-cancel {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #475569;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-cancel:hover {
  background: #f1f5f9;
}

.btn-save {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 8px;
  border: none;
  background: #4f46e5;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 1px 4px rgba(79, 70, 229, 0.3);
}

.btn-save:hover:not(:disabled) {
  background: #4338ca;
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
