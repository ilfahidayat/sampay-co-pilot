import mqtt from 'mqtt'
import { saveEnvVariables } from '../../config/envStorage.js'

class MqttInfrastructureClient {
  constructor() {
    this.client = null
    this.status = 'DISCONNECTED'
    this.brokerUrl = process.env.MQTT_BROKER_URL || 'wss://broker.emqx.io:8084/mqtt'
    this.clientId = (process.env.MQTT_CLIENT_ID || 'sac-backend-server') + '-' + Math.random().toString(16).substring(2, 8)
    this.username = process.env.MQTT_USERNAME || ''
    this.password = process.env.MQTT_PASSWORD || ''
    this.telemetryHandlers = []
    this.eventHandlers = []
  }

  connect() {
    if (this.client) return this.client

    console.log(`[MQTT] Connecting to broker: ${this.brokerUrl} (Client ID: ${this.clientId}, Auth: ${this.username ? 'yes' : 'none'})`)

    const options = {
      clientId: this.clientId,
      clean: true,
      connectTimeout: 8000,
      reconnectPeriod: 5000,
      keepalive: 60
    }

    if (this.username && this.username.trim().length > 0) {
      options.username = this.username.trim()
      options.password = this.password || ''
    }

    this.client = mqtt.connect(this.brokerUrl, options)

    this.client.on('connect', () => {
      this.status = 'CONNECTED'
      console.log(`[MQTT] Successfully connected to broker: ${this.brokerUrl}`)

      // Subscribe to all pond telemetry and actuator events
      const topics = ['sac/+/telemetry', 'sac/+/events', 'sac/+/commands']
      this.client.subscribe(topics, { qos: 1 }, (err) => {
        if (err) {
          console.error('[MQTT] Subscription error:', err.message)
        } else {
          console.log('[MQTT] Subscribed to topics:', topics.join(', '))
        }
      })
    })

    this.client.on('message', (topic, messageBuffer) => {
      try {
        const payload = JSON.parse(messageBuffer.toString())
        this.routeMessage(topic, payload)
      } catch (err) {
        console.warn(`[MQTT] Non-JSON payload on topic ${topic}:`, messageBuffer.toString())
      }
    })

    this.client.on('error', (err) => {
      this.status = 'ERROR'
      console.error('[MQTT] Connection error:', err.message)
    })

    this.client.on('offline', () => {
      this.status = 'OFFLINE'
      console.warn('[MQTT] Broker went offline. Reconnecting...')
    })

    this.client.on('reconnect', () => {
      this.status = 'RECONNECTING'
      console.log('[MQTT] Attempting reconnection to broker...')
    })

    return this.client
  }

  reconnect(brokerUrl, options = {}) {
    if (this.client) {
      try {
        this.client.end(true)
      } catch (err) {
        console.warn('[MQTT] Error closing old client:', err.message)
      }
      this.client = null
    }

    const envUpdates = {}
    if (brokerUrl && brokerUrl.trim().length > 0) {
      this.brokerUrl = brokerUrl.trim()
      process.env.MQTT_BROKER_URL = this.brokerUrl
      envUpdates.MQTT_BROKER_URL = this.brokerUrl
    }

    if (options.clientId && options.clientId.trim().length > 0) {
      this.clientId = options.clientId.trim()
      envUpdates.MQTT_CLIENT_ID = this.clientId
    }

    if (options.username !== undefined) {
      this.username = options.username ? options.username.trim() : ''
      process.env.MQTT_USERNAME = this.username
      envUpdates.MQTT_USERNAME = this.username
    }

    if (options.password !== undefined) {
      this.password = options.password ? options.password.trim() : ''
      process.env.MQTT_PASSWORD = this.password
      envUpdates.MQTT_PASSWORD = this.password
    }

    if (Object.keys(envUpdates).length > 0) {
      saveEnvVariables(envUpdates)
    }

    this.status = 'CONNECTING'
    console.log(`[MQTT] Dynamic reconnect requested to: ${this.brokerUrl} (Auth: ${this.username ? 'yes' : 'none'})`)
    return this.connect()
  }

  routeMessage(topic, payload) {
    const parts = topic.split('/') // sac / {pondId} / {type}
    if (parts.length >= 3) {
      const pondId = parts[1]
      const type = parts[2]

      if (type === 'telemetry') {
        for (const handler of this.telemetryHandlers) {
          try {
            handler(pondId, payload)
          } catch (handlerErr) {
            console.error('[MQTT] Error in telemetry handler:', handlerErr.message)
          }
        }
      } else if (type === 'events') {
        for (const handler of this.eventHandlers) {
          try {
            handler(pondId, payload)
          } catch (handlerErr) {
            console.error('[MQTT] Error in event handler:', handlerErr.message)
          }
        }
      }
    }
  }

  onTelemetry(handler) {
    this.telemetryHandlers.push(handler)
  }

  onEvent(handler) {
    this.eventHandlers.push(handler)
  }

  publishCommand(pondId, commandPayload) {
    if (!this.client || this.status !== 'CONNECTED') {
      console.warn('[MQTT] Cannot publish command: broker disconnected')
      return false
    }

    const topic = `sac/${pondId.toLowerCase()}/commands`
    const message = JSON.stringify({
      ...commandPayload,
      timestamp: new Date().toISOString()
    })

    this.client.publish(topic, message, { qos: 1 }, (err) => {
      if (err) {
        console.error(`[MQTT] Publish error to ${topic}:`, err.message)
      } else {
        console.log(`[MQTT] Dispatched command to ${topic}:`, commandPayload.action)
      }
    })
    return true
  }

  publishProcessedTelemetry(pondId, processedPayload) {
    if (!this.client || this.status !== 'CONNECTED') return false

    const topic = `sac/${pondId.toLowerCase()}/processed`
    const message = JSON.stringify({
      ...processedPayload,
      dispatched_at: new Date().toISOString()
    })

    this.client.publish(topic, message, { qos: 1, retain: true }, (err) => {
      if (err) {
        console.error(`[MQTT] Processed publish error to ${topic}:`, err.message)
      }
    })
    return true
  }

  publishNotification(notificationPayload) {
    if (!this.client || this.status !== 'CONNECTED') return false

    const topic = 'sac/notifications'
    const message = JSON.stringify({
      ...notificationPayload,
      timestamp: new Date().toISOString()
    })

    this.client.publish(topic, message, { qos: 1 }, (err) => {
      if (err) {
        console.error(`[MQTT] Notification publish error:`, err.message)
      }
    })
    return true
  }

  publishExecutionUpdate(pondId, executionData) {
    if (!this.client || this.status !== 'CONNECTED') return false

    const topic = `sac/${pondId.toLowerCase()}/executions`
    const message = JSON.stringify({
      pond_id: pondId,
      execution: executionData,
      timestamp: new Date().toISOString()
    })

    this.client.publish(topic, message, { qos: 1 }, (err) => {
      if (err) {
        console.error(`[MQTT] Execution update publish error to ${topic}:`, err.message)
      }
    })
    return true
  }

  publishCopilotMessage(pondId, messageData) {
    if (!this.client || this.status !== 'CONNECTED') return false

    const topic = `sac/${pondId.toLowerCase()}/chat`
    const message = JSON.stringify({
      pond_id: pondId,
      message: messageData,
      timestamp: new Date().toISOString()
    })

    this.client.publish(topic, message, { qos: 1 }, (err) => {
      if (err) {
        console.error(`[MQTT] Copilot message publish error to ${topic}:`, err.message)
      }
    })
    return true
  }

  getStatus() {
    return {
      status: this.status,
      brokerUrl: this.brokerUrl,
      clientId: this.clientId,
      hasAuth: !!(this.username && this.username.trim().length > 0),
      username: this.username || '',
      subscribedTopics: ['sac/+/telemetry', 'sac/+/events']
    }
  }
}

export const mqttClient = new MqttInfrastructureClient()
