// Default root API endpoint for SAC backend
const DEFAULT_ROOT_API = 'https://sac-dev.sampay.id'

const resolveApiBase = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '')
  }
  if (typeof window !== 'undefined' && window.location) {
    const { origin, hostname } = window.location
    if (hostname.includes('sampay.id')) {
      return `${origin}/api`
    }
  }
  return `${DEFAULT_ROOT_API}/api`
}

const API_BASE = resolveApiBase()
console.log(`[SAC ApiClient] Initialized root API endpoint: ${API_BASE}`)

class ApiClient {
  async get(endpoint) {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      const data = await res.json()
      return data
    } catch (err) {
      // Local fallback if remote root is unreachable while on localhost dev
      if (API_BASE.startsWith('http') && typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
        try {
          const fallbackRes = await fetch(`/api${endpoint}`)
          if (fallbackRes.ok) return await fallbackRes.json()
        } catch (_) {}
      }
      console.warn(`[ApiClient] GET ${endpoint} error:`, err.message)
      return null
    }
  }

  async post(endpoint, body = {}) {
    let lastError = null
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.message || `HTTP ${res.status}: ${res.statusText}`)
      }
      return data
    } catch (err) {
      lastError = err
      if (API_BASE.startsWith('http') && typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
        try {
          const fallbackRes = await fetch(`/api${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          })
          const fallbackData = await fallbackRes.json().catch(() => null)
          if (fallbackRes.ok) return fallbackData
          if (fallbackData?.message) throw new Error(fallbackData.message)
        } catch (fErr) {
          lastError = fErr
        }
      }
      console.warn(`[ApiClient] POST ${endpoint} error:`, lastError.message)
      throw lastError
    }
  }

  async put(endpoint, body = {}) {
    let lastError = null
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.message || `HTTP ${res.status}: ${res.statusText}`)
      }
      return data
    } catch (err) {
      lastError = err
      if (API_BASE.startsWith('http') && typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
        try {
          const fallbackRes = await fetch(`/api${endpoint}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          })
          const fallbackData = await fallbackRes.json().catch(() => null)
          if (fallbackRes.ok) return fallbackData
          if (fallbackData?.message) throw new Error(fallbackData.message)
        } catch (fErr) {
          lastError = fErr
        }
      }
      console.warn(`[ApiClient] PUT ${endpoint} error:`, lastError.message)
      throw lastError
    }
  }

  // Ponds Master Data
  async getPonds() {
    const res = await this.get('/ponds')
    return res && res.success ? res.data : []
  }

  async getPondById(pondId) {
    const res = await this.get(`/ponds/${pondId}`)
    return res && res.success ? res.data : null
  }

  async updatePond(pondId, updateData) {
    try {
      const res = await fetch(`${API_BASE}/ponds/${pondId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      return await res.json()
    } catch (err) {
      console.warn(`[ApiClient] PUT /ponds/${pondId} error:`, err.message)
      return null
    }
  }

  async getFarmSummary() {
    const res = await this.get('/ponds/farm/summary')
    return res && res.success ? res.data : null
  }

  // Fish Mortality Logging & Tracking
  async getPondMortality(pondId, limit = 100) {
    const res = await this.get(`/ponds/${pondId}/mortality?limit=${limit}`)
    return res && res.success ? res.data : []
  }

  async recordMortality(pondId, payload) {
    return this.post(`/ponds/${pondId}/mortality`, payload)
  }

  // Telemetry & Historical Data
  async getLatestTelemetry(pondId) {
    const res = await this.get(`/ponds/${pondId}/telemetry/latest`)
    return res && res.success ? res.data : null
  }

  async getTelemetryHistory(pondId, limit = 100) {
    const res = await this.get(`/ponds/${pondId}/telemetry/history?limit=${limit}`)
    return res && res.success ? res.data : []
  }

  // Gemini AI Analysis & Health Scores
  async getLatestAiAnalysis(pondId) {
    const res = await this.get(`/ponds/${pondId}/ai/latest`)
    return res && res.success ? res.data : null
  }

  async getAiAnalysisHistory(pondId, limit = 20) {
    const res = await this.get(`/ponds/${pondId}/ai/history?limit=${limit}`)
    return res && res.success ? res.data : []
  }

  // Daily Morning Briefing Recommendations
  async getRecommendation(pondId) {
    const res = await this.get(`/ai/recommendations/${pondId}`)
    return res && res.success ? res.data : null
  }

  // Executions & Actuator Commands
  async getExecutions(pondId) {
    const res = await this.get(`/executions/${pondId}`)
    return res && res.success ? res.data : []
  }

  async dispatchCommand(pondId, action, params = {}, actor = 'Supervisor Dashboard') {
    return this.post(`/executions/${pondId}`, { action, params, actor })
  }

  async createManualTask(pondId, payload) {
    return this.post(`/executions/${pondId}/tasks`, payload)
  }

  async approveAllExecutions(pondId) {
    return this.post(`/executions/${pondId}/approve-all`)
  }

  async approveExecution(id) {
    return this.post(`/executions/item/${id}/approve`)
  }

  async rejectExecution(id) {
    return this.post(`/executions/item/${id}/reject`)
  }

  async adjustExecution(id, updateData) {
    return this.put(`/executions/item/${id}`, updateData)
  }

  async runExecutionNow(id) {
    return this.post(`/executions/item/${id}/run-now`)
  }

  async synthesizeExecutions(pondId) {
    return this.post(`/executions/${pondId}/synthesize`)
  }

  async resetDatabase() {
    return this.post('/system/reset-db')
  }

  // Interactive Co-Pilot Chat & Persisted History
  async chatWithCopilot(message, activePond = 'K01') {
    return this.post('/ai/copilot-chat', { message, active_pond: activePond })
  }

  async getCopilotChatHistory(pondId, limit = 50) {
    const res = await this.get(`/ai/copilot-chat/${pondId}/history?limit=${limit}`)
    return res && res.success ? res.data : []
  }

  async clearCopilotChatHistory(pondId) {
    return this.post(`/ai/copilot-chat/${pondId}/clear`)
  }

  // System Connectivity & AI Configuration
  async getSystemHealth() {
    return this.get('/system/health')
  }

  async getSystemConfig() {
    const res = await this.get('/system/config')
    return res && res.success ? res.data : null
  }

  async updateAiConfig(payload) {
    return this.post('/system/config/ai', payload)
  }

  async updateMqttConfig(payload) {
    return this.post('/system/config/mqtt', payload)
  }

  // Hardware Nodes & Edge Device Inventory
  async getHardwareNodes() {
    const res = await this.get('/hardware/nodes')
    return res && res.success ? res.data : []
  }

  async assignHardwareNode(nodeId, pondId) {
    try {
      const res = await fetch(`${API_BASE}/hardware/nodes/${encodeURIComponent(nodeId)}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pondId })
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      return await res.json()
    } catch (err) {
      console.warn(`[ApiClient] assignHardwareNode error:`, err.message)
      return null
    }
  }
}

export const apiClient = new ApiClient()
