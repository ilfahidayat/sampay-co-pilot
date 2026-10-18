import mqtt from 'mqtt'

class MqttService {
  constructor() {
    this.client = null
    this.mode = 'real' // 'dummy' | 'real'
    this.isConnected = false
    this.listeners = new Map()
    this.messageLog = []
    this.config = {
      brokerUrl: 'wss://broker.emqx.io:8084/mqtt',
      clientId: 'sac_aqua_cluster_' + Math.random().toString(16).substring(2, 8),
      deviceId: 'sac/pond001',
      username: '',
      password: '',
      telemetryTopic: 'sac/+/telemetry',
      commandTopic: 'sac/+/commands',
      eventTopic: 'sac/+/events',
    }

    // Modern cross-tab browser communication bridge
    this.broadcastChannel = null
    if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel('sac_telemetry_bus')
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.type === 'COMMAND') {
            const targetDev = event.data.deviceId || event.data.device_id || event.data.target_pond || 'sac/pond001'
            const payload = event.data.payload || {
              action: event.data.action || event.data.command,
              params: event.data.params || {},
              command_id: event.data.command_id || `cmd-${Date.now()}`
            }
            this.logTraffic('INCOMING (SERVER_CMD)', `${targetDev}/commands`, payload)
            this.emit('message', {
              topic: `sac/${targetDev.toLowerCase()}/commands`,
              deviceId: targetDev,
              payload: payload,
              raw: JSON.stringify(payload)
            })
          }
        }
      } catch (e) {
        console.warn('BroadcastChannel initialization skipped:', e)
      }
    }
  }

  setMode(mode) {
    if (this.mode === mode) return
    this.disconnect()
    this.mode = mode
    this.connect()
  }

  setConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
  }

  connect() {
    if (this.mode === 'dummy') {
      setTimeout(() => {
        this.isConnected = true
        this.emit('connect', { mode: 'dummy' })
        this.logTraffic('SYSTEM', 'CLUSTER_BUS', 'Connected to Virtual Multi-Node Bus (Dummy Mode)')
      }, 250)
      return
    }

    // Real MQTT over WebSocket
    try {
      this.logTraffic('SYSTEM', this.config.brokerUrl, `Connecting to ${this.config.brokerUrl}...`)
      const options = {
        clientId: this.config.clientId,
        clean: true,
        connectTimeout: 8000,
        reconnectPeriod: 5000,
      }
      if (this.config.username) options.username = this.config.username
      if (this.config.password) options.password = this.config.password

      this.client = mqtt.connect(this.config.brokerUrl, options)

      this.client.on('connect', () => {
        this.isConnected = true
        this.emit('connect', { mode: 'real' })
        this.logTraffic('SYSTEM', 'MQTT', `Cluster connected to broker ${this.config.brokerUrl}`)
        // Subscribe to both sac/+/commands and legacy esp32/+/commands wildcard
        this.subscribe('sac/+/commands')
        this.subscribe('esp32/+/commands')
      })

      this.client.on('message', (topic, payload) => {
        const messageStr = payload.toString()
        let parsed = null
        try {
          parsed = JSON.parse(messageStr)
        } catch {
          parsed = messageStr
        }
        const parts = topic.split('/')
        const deviceId = parts[1] || 'sac/pond001'

        this.logTraffic('INCOMING', topic, parsed)
        this.emit('message', { topic, deviceId, payload: parsed, raw: messageStr })
      })

      this.client.on('error', (err) => {
        this.logTraffic('ERROR', 'MQTT', err.message || 'Connection error')
        this.emit('error', err)
      })

      this.client.on('offline', () => {
        this.isConnected = false
        this.logTraffic('SYSTEM', 'MQTT', 'Broker connection lost (Offline)')
        this.emit('offline')
      })
    } catch (err) {
      this.logTraffic('ERROR', 'MQTT', 'Failed to initialize MQTT: ' + err.message)
    }
  }

  disconnect() {
    if (this.mode === 'dummy') {
      this.isConnected = false
      this.emit('offline')
      this.logTraffic('SYSTEM', 'CLUSTER_BUS', 'Virtual Bus stopped')
      return
    }

    if (this.client) {
      this.client.end(true)
      this.client = null
    }
    this.isConnected = false
    this.emit('offline')
  }

  subscribe(topic) {
    if (this.mode === 'dummy') {
      this.logTraffic('SYSTEM', 'SUBSCRIBE', `Subscribed to virtual topic: ${topic}`)
      return
    }

    if (this.client && this.isConnected) {
      this.client.subscribe(topic, (err) => {
        if (!err) {
          this.logTraffic('SYSTEM', 'SUBSCRIBE', `Subscribed to topic: ${topic}`)
        } else {
          this.logTraffic('ERROR', 'SUBSCRIBE', `Failed to subscribe to ${topic}: ${err.message}`)
        }
      })
    }
  }

  publish(topic, payload, deviceId = null) {
    const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2)
    let parsedData = null
    try {
      parsedData = typeof payload === 'string' ? JSON.parse(payload) : payload
    } catch {
      parsedData = payload
    }

    const devId = deviceId || (parsedData && parsedData.device_id) || 'ESP32-AQUA-01'

    this.logTraffic('OUTGOING', topic, parsedData)

    // Broadcast across browser tabs for live dashboard sync
    if (this.broadcastChannel) {
      try {
        const isTelemetry = topic.includes('/telemetry')
        this.broadcastChannel.postMessage({
          type: isTelemetry ? 'TELEMETRY' : 'EVENT',
          deviceId: devId,
          topic,
          payload: parsedData,
          timestamp: Date.now()
        })
      } catch (err) {
        console.warn('Broadcast sync error:', err)
      }
    }

    if (this.mode === 'dummy') {
      this.emit('published', { topic, payload: parsedData, deviceId: devId })
      return true
    }

    if (this.client && this.isConnected) {
      this.client.publish(topic, payloadStr, { qos: 0, retain: true })
      return true
    } else {
      return false
    }
  }

  logTraffic(type, source, data) {
    const entry = {
      id: Date.now() + Math.random().toString(16).substring(2, 6),
      timestamp: new Date().toLocaleTimeString(),
      type,
      source,
      data
    }
    this.messageLog.unshift(entry)
    if (this.messageLog.length > 50) {
      this.messageLog.pop()
    }
    this.emit('log', entry)
  }

  clearLogs() {
    this.messageLog = []
    this.emit('log_clear')
  }

  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event).add(handler)
  }

  off(event, handler) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(handler)
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      for (const handler of this.listeners.get(event)) {
        try {
          handler(data)
        } catch (e) {
          console.error(`Error in event listener for ${event}:`, e)
        }
      }
    }
  }
}

export const mqttService = new MqttService()
