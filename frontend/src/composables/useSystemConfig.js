import { ref } from 'vue'
import { apiClient } from '../services/apiClient'

// Shared singleton state across components
const isConfigModalOpen = ref(false)
const systemHealth = ref({
  ai: {
    mockMode: true,
    model: 'gemini-3.8-flash',
    apiKeyConfigured: true
  },
  mqtt: {
    status: 'CONNECTED',
    brokerUrl: 'wss://broker.emqx.io:8084/mqtt',
    hasAuth: false,
    username: ''
  }
})

let pollingTimer = null
let subscriberCount = 0

const fetchSystemHealth = async () => {
  try {
    const res = await apiClient.getSystemHealth()
    if (res) {
      systemHealth.value = res
    }
  } catch (err) {
    console.warn('[useSystemConfig] Health fetch error:', err.message)
  }
}

export function useSystemConfig() {
  const openConfigModal = () => {
    isConfigModalOpen.value = true
  }

  const closeConfigModal = () => {
    isConfigModalOpen.value = false
  }

  const startPolling = () => {
    subscriberCount++
    if (!pollingTimer) {
      fetchSystemHealth()
      pollingTimer = setInterval(fetchSystemHealth, 4000)
    }
  }

  const stopPolling = () => {
    subscriberCount = Math.max(0, subscriberCount - 1)
    if (subscriberCount === 0 && pollingTimer) {
      clearInterval(pollingTimer)
      pollingTimer = null
    }
  }

  return {
    isConfigModalOpen,
    openConfigModal,
    closeConfigModal,
    systemHealth,
    fetchSystemHealth,
    startPolling,
    stopPolling
  }
}
