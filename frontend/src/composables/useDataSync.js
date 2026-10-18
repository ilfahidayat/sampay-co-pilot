import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { frontendMqttClient } from '../services/mqttClient'
import { loadPondsFromDatabase, ponds } from './usePonds'

const lastSyncTime = ref(new Date().toLocaleTimeString())
const isSyncing = ref(false)
const syncEventsCount = ref(0)

// Global Callback Sets for Invalidation & Silent Auto-Refresh
const telemetryListeners = new Set()
const executionListeners = new Set()
const aiListeners = new Set()

let isInitialized = false

function initDataSync() {
  if (isInitialized || typeof window === 'undefined') return
  isInitialized = true

  console.log('[DataSync] Initialized centralized reactive auto-refresh synchronizer.')

  // 1. Listen for processed telemetry & Gemini evaluation from backend
  frontendMqttClient.on('processed', ({ pondId, data }) => {
    lastSyncTime.value = new Date().toLocaleTimeString()
    syncEventsCount.value++

    // Optimistic memory update for pond
    const pond = ponds.value.find(p => p.id === pondId)
    if (pond) {
      if (data.telemetry) {
        pond.telemetry = { ...pond.telemetry, ...data.telemetry }
      }
      if (data.ai) {
        pond.healthScore = data.ai.healthScore ?? pond.healthScore
        pond.status = data.ai.status ?? pond.status
        pond.aiAnalysis = {
          healthScore: data.ai.healthScore,
          status: data.ai.status,
          summary: data.ai.summary,
          anomalies: data.ai.anomalies,
          recommendation: data.ai.immediateAction,
          modelUsed: data.ai.modelUsed,
          updatedAt: data.timestamp || new Date().toISOString()
        }
      }
    }

    // Notify registered views
    telemetryListeners.forEach(cb => {
      try { cb({ pondId, data }) } catch (err) { console.error('[DataSync] telemetry listener error:', err) }
    })
    aiListeners.forEach(cb => {
      try { cb({ pondId, data }) } catch (err) { console.error('[DataSync] ai listener error:', err) }
    })
  })

  // 2. Listen for execution updates from backend
  frontendMqttClient.on('execution', ({ pondId, data }) => {
    lastSyncTime.value = new Date().toLocaleTimeString()
    syncEventsCount.value++
    executionListeners.forEach(cb => {
      try { cb({ pondId, data }) } catch (err) { console.error('[DataSync] execution listener error:', err) }
    })
  })

  // 3. Listen for actuator events (STARTED / COMPLETED)
  frontendMqttClient.on('event', ({ pondId, data }) => {
    lastSyncTime.value = new Date().toLocaleTimeString()
    syncEventsCount.value++
    executionListeners.forEach(cb => {
      try { cb({ pondId, data }) } catch (err) { console.error('[DataSync] actuator event listener error:', err) }
    })
  })
}

// Ensure initialization occurs in client
if (typeof window !== 'undefined') {
  initDataSync()
}

export function useDataSync() {
  const onTelemetryUpdated = (callback) => {
    telemetryListeners.add(callback)
    return () => telemetryListeners.delete(callback)
  }

  const onExecutionUpdated = (callback) => {
    executionListeners.add(callback)
    return () => executionListeners.delete(callback)
  }

  const onAiAnalysisUpdated = (callback) => {
    aiListeners.add(callback)
    return () => aiListeners.delete(callback)
  }

  const refreshPonds = async () => {
    isSyncing.value = true
    try {
      await loadPondsFromDatabase()
      lastSyncTime.value = new Date().toLocaleTimeString()
    } finally {
      isSyncing.value = false
    }
  }

  return {
    lastSyncTime,
    isSyncing,
    syncEventsCount,
    onTelemetryUpdated,
    onExecutionUpdated,
    onAiAnalysisUpdated,
    refreshPonds
  }
}
