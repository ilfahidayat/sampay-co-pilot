import mqtt from 'mqtt'
import { reactive } from 'vue'

export const mqttStatus = reactive({
  isConnected: false,
  brokerUrl: 'wss://broker.emqx.io:8084/mqtt',
  lastMessageTime: null,
  latencyMs: 32,
  rxCount: 0,
  txCount: 0,
  lastEvent: null
})

class FrontendMqttClient {
  constructor() {
    this.client = null
    this.listeners = new Map()
    this.init()
  }

  init() {
    if (typeof window === 'undefined') return

    try {
      this.client = mqtt.connect(mqttStatus.brokerUrl, {
        clientId: 'sac_frontend_' + Math.random().toString(16).substring(2, 8),
        clean: true,
        connectTimeout: 8000,
        reconnectPeriod: 5000,
      })

      this.client.on('connect', () => {
        mqttStatus.isConnected = true
        console.log('[Frontend MQTT] Connected to broker:', mqttStatus.brokerUrl)
        this.client.subscribe('sac/+/telemetry')
        this.client.subscribe('sac/+/events')
        this.client.subscribe('sac/+/processed')
        this.client.subscribe('sac/+/executions')
        this.client.subscribe('sac/+/chat')
        this.client.subscribe('sac/notifications')
        this.emit('connect', { brokerUrl: mqttStatus.brokerUrl })
      })

      this.client.on('message', (topic, payload) => {
        mqttStatus.rxCount++
        mqttStatus.lastMessageTime = new Date().toLocaleTimeString()
        let parsed = null
        try {
          parsed = JSON.parse(payload.toString())
        } catch {
          parsed = payload.toString()
        }

        if (topic === 'sac/notifications') {
          this.emit('notification', parsed)
          return
        }

        const parts = topic.split('/')
        const channel = parts[1] // e.g. 'k01' or 'pond001'
        const type = parts[2] // 'telemetry', 'processed', 'events', 'executions', or 'chat'

        this.emit('message', { topic, channel, type, payload: parsed })
        if (type === 'processed') {
          this.emit('processed', { pondId: channel.toUpperCase(), data: parsed })
        } else if (type === 'telemetry') {
          this.emit('telemetry', { pondId: channel.toUpperCase(), data: parsed })
        } else if (type === 'events') {
          mqttStatus.lastEvent = parsed
          this.emit('event', { pondId: channel.toUpperCase(), data: parsed })
        } else if (type === 'executions') {
          this.emit('execution', { pondId: channel.toUpperCase(), data: parsed })
        } else if (type === 'chat') {
          this.emit('chat', { pondId: channel.toUpperCase(), data: parsed })
        }
      })

      this.client.on('offline', () => {
        mqttStatus.isConnected = false
        this.emit('offline')
      })

      this.client.on('error', (err) => {
        console.warn('[Frontend MQTT] Broker error:', err)
        mqttStatus.isConnected = false
        this.emit('error', err)
      })
    } catch (e) {
      console.warn('[Frontend MQTT] Initialization error:', e)
    }
  }

  publishCommand(pondId, action, params = {}, commandId = null) {
    const cmdId = commandId || `cmd-fe-${Date.now()}`
    const pId = (pondId || 'K01').toLowerCase().replace('sac/', '')
    const topic = `sac/${pId}/commands`
    const payload = {
      command_id: cmdId,
      target_pond: pondId.toUpperCase(),
      action,
      params,
      source: 'sac_frontend',
      issued_at: new Date().toISOString()
    }

    mqttStatus.txCount++
    if (this.client && mqttStatus.isConnected) {
      this.client.publish(topic, JSON.stringify(payload), { qos: 0 }, (err) => {
        if (err) console.warn('[Frontend MQTT] Publish error:', err)
      })
    }
    return payload
  }

  on(event, handler) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set())
    this.listeners.get(event).add(handler)
  }

  off(event, handler) {
    if (this.listeners.has(event)) this.listeners.get(event).delete(handler)
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      for (const handler of this.listeners.get(event)) {
        try {
          handler(data)
        } catch (e) {
          console.error(`[Frontend MQTT] Error in listener for ${event}:`, e)
        }
      }
    }
  }
}

export const frontendMqttClient = new FrontendMqttClient()
