import { checkDatabaseConnection } from '../../config/db.js'
import { mqttClient } from '../../infrastructure/mqtt/mqttClient.js'
import { geminiClient } from '../../infrastructure/gemini/geminiClient.js'

export const getHealth = async (req, res) => {
  const dbOk = await checkDatabaseConnection()
  const mqttStatus = mqttClient.getStatus()

  res.json({
    status: dbOk ? 'HEALTHY' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    database: {
      type: process.env.DB_CLIENT || 'better-sqlite3',
      connected: dbOk
    },
    mqtt: mqttStatus,
    ai: {
      provider: 'Google Gemini',
      model: geminiClient.modelName,
      apiKeyConfigured: geminiClient.hasApiKey(),
      mockMode: geminiClient.isMockMode(),
      mode: geminiClient.isMockMode() ? 'Local Mock Simulation (Zero Credit Cost)' : 'Live Google GenAI'
    }
  })
}

export const getMqttStatus = (req, res) => {
  res.json({ success: true, data: mqttClient.getStatus() })
}

export const getSystemConfig = async (req, res) => {
  const mqttStatus = mqttClient.getStatus()
  const rawKey = geminiClient.apiKey || ''
  const maskedKey = rawKey ? `${rawKey.substring(0, 8)}...${rawKey.substring(rawKey.length - 4)}` : ''

  res.json({
    success: true,
    data: {
      storage: {
        type: 'Environment Configuration File (.env)',
        path: 'backend/.env',
        persistedOnDisk: true
      },
      ai: {
        provider: 'Google Gemini',
        mockMode: geminiClient.isMockMode(),
        model: geminiClient.modelName,
        hasApiKey: geminiClient.hasApiKey(),
        apiKeyMasked: maskedKey,
        liveApiReady: !geminiClient.isMockMode() && geminiClient.hasApiKey()
      },
      mqtt: {
        status: mqttStatus.status,
        brokerUrl: mqttClient.brokerUrl,
        clientId: mqttClient.clientId,
        username: mqttClient.username || '',
        hasAuth: mqttStatus.hasAuth,
        passwordConfigured: !!(mqttClient.password && mqttClient.password.length > 0),
        subscribedTopics: mqttStatus.subscribedTopics
      },
      scheduler: {
        interval: '6 Hours',
        startHour: '06:00 WIB',
        slots: ['06:00 WIB', '12:00 WIB', '18:00 WIB', '00:00 WIB'],
        cron: '0 0,6,12,18 * * *',
        description: 'Setiap 6 jam sekali mulai jam 6 pagi'
      }
    }
  })
}

export const updateAiConfig = (req, res) => {
  const { useMock, apiKey, modelName } = req.body
  const updated = geminiClient.updateConfig({ useMock, apiKey, modelName })
  res.json({
    success: true,
    message: `Gemini AI settings successfully saved to backend/.env (${updated.mockMode ? 'Mock Simulation Mode' : 'Live Google GenAI API'}).`,
    data: {
      ...updated,
      storagePath: 'backend/.env',
      persisted: true
    }
  })
}

export const updateMqttConfig = (req, res) => {
  const { brokerUrl, clientId, username, password } = req.body
  if (!brokerUrl) {
    return res.status(400).json({ success: false, message: 'brokerUrl is required.' })
  }
  mqttClient.reconnect(brokerUrl, { clientId, username, password })
  res.json({
    success: true,
    message: `MQTT client reconnecting to ${brokerUrl}...`,
    data: mqttClient.getStatus()
  })
}

export const resetDatabase = async (req, res, next) => {
  try {
    console.log('[System] 🔄 Resetting database to clean initial state via Knex seed:run...')
    const db = (await import('../../config/db.js')).default
    await db.seed.run()
    console.log('[System] ✅ Database successfully reset to clean state.')
    res.json({
      success: true,
      message: 'Database successfully reset to clean initial state. All duplicate entries purged.'
    })
  } catch (err) {
    console.error('[System] Error resetting database:', err)
    next(err)
  }
}

