import { reactive } from 'vue'
import { mqttService } from './mqttService'

function createNodeState(id, name, pondId, overrides = {}) {
  const mud = overrides.mudSolids || 95.0
  return {
    id,
    deviceId: id,
    legacyId: overrides.legacyId || 'ESP32-AQUA-01',
    name,
    pondId,
    // Power State (Hardware On/Off Toggle)
    isPowered: true,

    // Simulation Condition: 'ok' | 'warning' | 'danger' | 'custom'
    simulationCondition: overrides.simulationCondition || 'ok',

    // 5 Raw Biometric Sensor Readings
    dissolvedOxygen: overrides.dissolvedOxygen || 6.40,
    ph: overrides.ph || 7.20,
    temperature: overrides.temperature || 28.5,
    ammonia: overrides.ammonia || 0.22,
    flocDensity: overrides.flocDensity || +(mud / 6.8).toFixed(1),
    mudSolids: mud,

    // Manual Tuning & Transmission Tracking
    isLocked: overrides.isLocked || false,
    hasPendingChanges: false,
    lastPublishedAt: null,
    
    // Hardware & Diagnostics
    uptimeSeconds: 0,
    batteryPercent: overrides.batteryPercent || 94,
    batteryVoltage: +(24.2 + (Math.random() * 0.4)).toFixed(1),
    wifiRssi: -58 - Math.floor(Math.random() * 8),
    freeHeap: 185000 + Math.floor(Math.random() * 5000),
    isPublishing: false,

    // 4 Industrial Actuators (Raw States)
    aerator: {
      state: overrides.aeratorState || 'running',
      powerPercent: overrides.aeratorPower || 100,
      frequencyHz: overrides.aeratorPower ? +(overrides.aeratorPower * 0.5).toFixed(0) : 50,
      lastTriggered: null,
    },
    feeder: {
      state: 'idle',
      dose: 0,
      progress: 0,
      totalToday: overrides.feedToday || 0,
      lastTriggered: null,
    },
    molassesPump: {
      state: 'idle',
      dose: 0,
      progress: 0,
      totalToday: overrides.molassesToday || 0,
      lastTriggered: null,
    },
    waterChange: {
      state: 'idle',
      volume: 0,
      progress: 0,
      totalToday: overrides.waterToday || 0,
      phase: '',
      lastTriggered: null,
    },

    leds: {
      pwr: true,
      link: true,
      mqttTx: false,
    }
  }
}

export const nodes = reactive([
  createNodeState('sac/pond001', 'Pond 1', 'K01', {
    legacyId: 'ESP32-AQUA-01',
    simulationCondition: 'ok',
    batteryPercent: 94,
    dissolvedOxygen: 6.40,
    ammonia: 0.22,
    ph: 7.20,
    temperature: 28.5,
    mudSolids: 95.0,
    flocDensity: 14.5,
    aeratorState: 'running',
    aeratorPower: 100,
    feedToday: 240,
    molassesToday: 120
  }),
  createNodeState('sac/pond002', 'Pond 2', 'K02', {
    legacyId: 'ESP32-AQUA-02',
    simulationCondition: 'ok',
    batteryPercent: 88,
    dissolvedOxygen: 6.85,
    ammonia: 0.15,
    ph: 7.35,
    temperature: 28.8,
    mudSolids: 65.0,
    flocDensity: 9.8,
    aeratorState: 'running',
    aeratorPower: 85,
    feedToday: 160,
    molassesToday: 60
  }),
  createNodeState('sac/pond003', 'Pond 3', 'K03', {
    legacyId: 'ESP32-AQUA-03',
    simulationCondition: 'ok',
    batteryPercent: 91,
    dissolvedOxygen: 5.90,
    ammonia: 0.38,
    ph: 7.10,
    temperature: 27.9,
    mudSolids: 110.0,
    flocDensity: 16.2,
    aeratorState: 'running',
    aeratorPower: 100,
    feedToday: 300,
    molassesToday: 150
  }),
  createNodeState('sac/pond004', 'Pond 4', 'K04', {
    legacyId: 'ESP32-AQUA-04',
    simulationCondition: 'warning',
    batteryPercent: 79,
    dissolvedOxygen: 4.80,
    ammonia: 0.65,
    ph: 6.95,
    temperature: 28.1,
    mudSolids: 145.0,
    flocDensity: 21.0,
    aeratorState: 'running',
    aeratorPower: 100,
    feedToday: 80,
    molassesToday: 90
  }),
])

export const pondState = nodes[0]

// Load persistent simulator node states if present
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const saved = localStorage.getItem('sac_simulator_node_states')
    if (saved) {
      const parsed = JSON.parse(saved)
      nodes.forEach(n => {
        if (parsed[n.pondId]) {
          const s = parsed[n.pondId]
          if (s.isPowered !== undefined) {
            n.isPowered = s.isPowered
            n.leds.pwr = s.isPowered
            n.leds.link = s.isPowered
          }
          if (s.simulationCondition) n.simulationCondition = s.simulationCondition
          if (s.dissolvedOxygen !== undefined) n.dissolvedOxygen = s.dissolvedOxygen
          if (s.ammonia !== undefined) n.ammonia = s.ammonia
          if (s.ph !== undefined) n.ph = s.ph
          if (s.temperature !== undefined) n.temperature = s.temperature
          if (s.flocDensity !== undefined) n.flocDensity = s.flocDensity
          if (s.mudSolids !== undefined) n.mudSolids = s.mudSolids
          if (s.isLocked !== undefined) n.isLocked = s.isLocked
        }
      })
    }
  } catch (e) {
    console.warn('Failed to load saved node states:', e)
  }
}

export function saveSimulatorState() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const state = {}
      nodes.forEach(n => {
        state[n.pondId] = {
          isPowered: n.isPowered,
          simulationCondition: n.simulationCondition,
          dissolvedOxygen: n.dissolvedOxygen,
          ammonia: n.ammonia,
          ph: n.ph,
          temperature: n.temperature,
          flocDensity: n.flocDensity,
          mudSolids: n.mudSolids,
          isLocked: n.isLocked
        }
      })
      localStorage.setItem('sac_simulator_node_states', JSON.stringify(state))
    } catch (e) {
      console.warn('Failed to save simulator state:', e)
    }
  }
}

// Helper to calculate seconds remaining until the next 6-hour slot (06:00, 12:00, 18:00, 00:00 WIB)
export function calculateNext6HourSlot() {
  const now = new Date()
  const hours = now.getHours()

  // 6-hour boundaries starting at 06:00: 0, 6, 12, 18
  const slots = [0, 6, 12, 18]
  let nextHour = slots.find(s => s > hours)
  let daysToAdd = 0
  if (nextHour === undefined) {
    nextHour = 0 // midnight next day
    daysToAdd = 1
  }

  const target = new Date(now)
  target.setDate(target.getDate() + daysToAdd)
  target.setHours(nextHour, 0, 0, 0)

  const diffSec = Math.max(1, Math.round((target.getTime() - now.getTime()) / 1000))
  const slotStr = `${String(nextHour).padStart(2, '0')}:00 WIB`

  return { diffSec, slotStr }
}

// Periodic transmission & drift configuration
const initialSlot = calculateNext6HourSlot()
export const clusterState = reactive({
  publishInterval: 21600, // 6 Hours default (21,600s)
  scheduleMode: 'clock_6h', // 'clock_6h' (06:00, 12:00, 18:00, 00:00) | 'seconds'
  nextPublishCountdown: initialSlot.diffSec,
  nextSlotLabel: initialSlot.slotStr,
  isLive: true,
  autoPublish: true, // Active by default with the 6-hour schedule
  driftEnabled: false, // Natural biological drift (disabled so manual adjustments remain stable)
})

class SimulationEngine {
  constructor() {
    this.countdownTimer = null
    this.uptimeTimer = null
    this.driftTimer = null
  }

  start() {
    mqttService.connect()

    // Log connection when broker link established, but DO NOT publish telemetry on first connect/open.
    // Telemetry is strictly dispatched when the schedule time is reached or via manual trigger.
    mqttService.on('connect', () => {
      console.log('[Simulator] ✅ Connected to MQTT broker. Standby for scheduled or manual transmission.')
    })

    // Listen to incoming commands from MQTT or Browser Sync Bus
    mqttService.on('message', ({ topic, deviceId, payload }) => {
      this.handleIncomingCommand(payload, deviceId)
    })

    // Uptime & diagnostic counter for all nodes
    this.uptimeTimer = setInterval(() => {
      nodes.forEach(node => {
        if (!node.isPowered) return
        node.uptimeSeconds++
        if (node.uptimeSeconds % 10 === 0) {
          node.wifiRssi = -56 - Math.floor(Math.random() * 8)
          node.batteryVoltage = +(24.2 + (Math.sin(node.uptimeSeconds / 60) * 0.3)).toFixed(1)
        }
      })
    }, 1000)

    // Countdown and Telemetry Dispatcher for all nodes
    this.startTelemetryLoop()

    // Natural pond parameter drift & biological model for all 4 nodes
    this.driftTimer = setInterval(() => {
      this.applyNaturalDriftAll()
    }, 3000)
  }

  stop() {
    if (this.countdownTimer) clearInterval(this.countdownTimer)
    if (this.uptimeTimer) clearInterval(this.uptimeTimer)
    if (this.driftTimer) clearInterval(this.driftTimer)
  }

  startTelemetryLoop() {
    if (this.countdownTimer) clearInterval(this.countdownTimer)

    const syncSlot = () => {
      if (clusterState.scheduleMode === 'clock_6h') {
        const slot = calculateNext6HourSlot()
        clusterState.nextPublishCountdown = slot.diffSec
        clusterState.nextSlotLabel = slot.slotStr
      } else {
        clusterState.nextPublishCountdown = clusterState.publishInterval
      }
    }

    syncSlot()

    this.countdownTimer = setInterval(() => {
      // If periodic sending is stopped, do not count down or publish
      if (!clusterState.autoPublish) return

      if (clusterState.scheduleMode === 'clock_6h') {
        const slot = calculateNext6HourSlot()
        clusterState.nextPublishCountdown = slot.diffSec
        clusterState.nextSlotLabel = slot.slotStr

        if (slot.diffSec <= 1) {
          console.log(`[Simulator] 6-Hour Scheduled Time (${slot.slotStr}) Reached! Transmitting all ponds...`)
          this.publishTelemetryAll()
        }
      } else {
        if (clusterState.nextPublishCountdown > 1) {
          clusterState.nextPublishCountdown--
        } else {
          clusterState.nextPublishCountdown = clusterState.publishInterval
          this.publishTelemetryAll()
        }
      }
    }, 1000)
  }

  toggleAutoPublish() {
    clusterState.autoPublish = !clusterState.autoPublish
    if (clusterState.autoPublish) {
      if (clusterState.scheduleMode === 'clock_6h') {
        const slot = calculateNext6HourSlot()
        clusterState.nextPublishCountdown = slot.diffSec
        clusterState.nextSlotLabel = slot.slotStr
      } else {
        clusterState.nextPublishCountdown = clusterState.publishInterval
      }
    }
  }

  setAutoPublish(enabled) {
    clusterState.autoPublish = !!enabled
    if (clusterState.autoPublish) {
      if (clusterState.scheduleMode === 'clock_6h') {
        const slot = calculateNext6HourSlot()
        clusterState.nextPublishCountdown = slot.diffSec
        clusterState.nextSlotLabel = slot.slotStr
      } else {
        clusterState.nextPublishCountdown = clusterState.publishInterval
      }
    }
  }

  setPublishInterval(val) {
    if (val === 'clock_6h' || val === '21600' || val === 21600) {
      clusterState.scheduleMode = 'clock_6h'
      clusterState.publishInterval = 21600
      const slot = calculateNext6HourSlot()
      clusterState.nextPublishCountdown = slot.diffSec
      clusterState.nextSlotLabel = slot.slotStr
    } else {
      clusterState.scheduleMode = 'seconds'
      clusterState.publishInterval = Math.max(5, parseInt(val, 10) || 30)
      clusterState.nextPublishCountdown = clusterState.publishInterval
      clusterState.nextSlotLabel = ''
    }
  }

  toggleDrift() {
    clusterState.driftEnabled = !clusterState.driftEnabled
  }

  updateNodeSensors(nodeId, sensorUpdates = {}, andPublish = false) {
    const node = nodes.find(n => n.id === nodeId || n.pondId === nodeId)
    if (!node) return
    if (sensorUpdates.dissolvedOxygen !== undefined) node.dissolvedOxygen = Number(sensorUpdates.dissolvedOxygen)
    if (sensorUpdates.ph !== undefined) node.ph = Number(sensorUpdates.ph)
    if (sensorUpdates.temperature !== undefined) node.temperature = Number(sensorUpdates.temperature)
    if (sensorUpdates.ammonia !== undefined) node.ammonia = Number(sensorUpdates.ammonia)
    if (sensorUpdates.flocDensity !== undefined) {
      node.flocDensity = Number(sensorUpdates.flocDensity)
      node.mudSolids = +(node.flocDensity * 6.8).toFixed(1)
    }
    if (sensorUpdates.isLocked !== undefined) node.isLocked = Boolean(sensorUpdates.isLocked)
    node.simulationCondition = sensorUpdates.simulationCondition || 'custom'
    node.hasPendingChanges = true

    if (andPublish && node.isPowered) {
      this.publishTelemetryNode(node)
    }
    saveSimulatorState()
  }

  toggleNodePower(nodeId) {
    const node = nodes.find(n => n.id === nodeId || n.pondId === nodeId)
    if (node) {
      node.isPowered = !node.isPowered
      node.leds.pwr = node.isPowered
      node.leds.link = node.isPowered
      if (!node.isPowered) {
        node.aerator.state = 'idle'
        this.publishPowerOffTelemetryNode(node)
      } else {
        node.aerator.state = 'running'
        this.publishTelemetryNode(node)
      }
      saveSimulatorState()
    }
  }

  publishPowerOffTelemetryNode(node) {
    const now = new Date()
    const telemetryPayload = {
      version: '1.0',
      device_id: node.id,
      legacy_id: node.legacyId,
      pond_id: node.pondId,
      timestamp: now.toISOString(),
      uptime_seconds: 0,
      condition: 'offline',
      isPowered: false,
      system: {
        battery_percent: node.batteryPercent,
        battery_v: node.batteryVoltage,
        power_state: 'OFF',
        wifi_rssi_dbm: 0,
        free_heap_bytes: 0,
      },
      sensors: null,
      actuators: {
        aerator: {
          state: 'idle',
          power_percent: 0
        },
        feeder: {
          state: 'idle',
          total_today_grams: node.feeder.totalToday
        },
        molasses_pump: {
          state: 'idle',
          total_today_ml: node.molassesPump.totalToday
        },
        siphon: {
          state: 'idle',
          total_today_liters: node.waterChange.totalToday
        }
      }
    }

    // Publish strictly to canonical topic sac/{pondId}/telemetry
    mqttService.publish(`sac/${node.pondId.toLowerCase()}/telemetry`, telemetryPayload, node.id)
  }

  publishTelemetryNode(node) {
    if (!node.isPowered) return

    node.hasPendingChanges = false
    node.lastPublishedAt = new Date()
    node.leds.mqttTx = true
    node.isPublishing = true
    setTimeout(() => {
      node.leds.mqttTx = false
      node.isPublishing = false
    }, 500)

    const now = new Date()
    const telemetryPayload = {
      version: '1.0',
      device_id: node.id,
      legacy_id: node.legacyId,
      pond_id: node.pondId,
      timestamp: now.toISOString(),
      uptime_seconds: node.uptimeSeconds,
      condition: node.simulationCondition || 'ok',
      isPowered: node.isPowered !== false,
      system: {
        battery_percent: node.batteryPercent,
        battery_v: node.batteryVoltage,
        power_state: node.isPowered ? 'ON' : 'OFF',
        wifi_rssi_dbm: node.wifiRssi,
        free_heap_bytes: node.freeHeap,
      },
      sensors: {
        dissolved_oxygen_mg_l: node.dissolvedOxygen,
        ph: node.ph,
        temperature_c: node.temperature,
        ammonia_mg_l: node.ammonia,
        floc_density_ml_l: node.flocDensity,
        mud_solids_mg_l: node.mudSolids,
      },
      actuators: {
        aerator: {
          state: node.aerator.state,
          power_percent: node.aerator.powerPercent
        },
        feeder: {
          state: node.feeder.state,
          total_today_grams: node.feeder.totalToday
        },
        molasses_pump: {
          state: node.molassesPump.state,
          total_today_ml: node.molassesPump.totalToday
        },
        siphon: {
          state: node.waterChange.state,
          total_today_liters: node.waterChange.totalToday
        }
      }
    }

    // Publish strictly to canonical topic sac/{pondId}/telemetry
    mqttService.publish(`sac/${node.pondId.toLowerCase()}/telemetry`, telemetryPayload, node.id)
  }

  publishTelemetryAll() {
    nodes.forEach(node => {
      if (node.isPowered) {
        this.publishTelemetryNode(node)
      } else {
        this.publishPowerOffTelemetryNode(node)
      }
    })
  }

  triggerManualPublish(nodeId = null) {
    if (nodeId) {
      const node = nodes.find(n => n.id === nodeId || n.pondId === nodeId)
      if (node) {
        if (node.isPowered) {
          this.publishTelemetryNode(node)
        } else {
          this.publishPowerOffTelemetryNode(node)
        }
      }
    } else {
      this.publishTelemetryAll()
    }
  }

  setNodeCondition(nodeId, condition, autoPublish = false) {
    const node = nodes.find(n => n.id === nodeId || n.pondId === nodeId)
    if (!node) return
    node.simulationCondition = condition
    node.hasPendingChanges = true

    if (condition === 'ok') {
      node.dissolvedOxygen = +(6.30 + (Math.random() * 0.4)).toFixed(2)
      node.ph = +(7.25 + (Math.random() * 0.15)).toFixed(2)
      node.temperature = +(28.2 + (Math.random() * 0.6)).toFixed(1)
      node.ammonia = +(0.15 + (Math.random() * 0.08)).toFixed(3)
      node.mudSolids = +(85.0 + (Math.random() * 15)).toFixed(1)
      node.flocDensity = +(node.mudSolids / 6.8).toFixed(1)
    } else if (condition === 'warning') {
      node.dissolvedOxygen = +(4.10 + (Math.random() * 0.25)).toFixed(2)
      node.ph = +(6.75 + (Math.random() * 0.12)).toFixed(2)
      node.temperature = +(30.5 + (Math.random() * 0.5)).toFixed(1)
      node.ammonia = +(0.52 + (Math.random() * 0.12)).toFixed(3)
      node.mudSolids = +(165.0 + (Math.random() * 20)).toFixed(1)
      node.flocDensity = +(node.mudSolids / 6.8).toFixed(1)
    } else if (condition === 'danger') {
      node.dissolvedOxygen = +(2.80 + (Math.random() * 0.2)).toFixed(2)
      node.ph = +(6.25 + (Math.random() * 0.1)).toFixed(2)
      node.temperature = +(32.2 + (Math.random() * 0.6)).toFixed(1)
      node.ammonia = +(1.25 + (Math.random() * 0.25)).toFixed(3)
      node.mudSolids = +(265.0 + (Math.random() * 30)).toFixed(1)
      node.flocDensity = +(node.mudSolids / 6.8).toFixed(1)
    }
    
    // Only publish immediately if autoPublish is explicitly requested
    if (autoPublish && node.isPowered) {
      this.publishTelemetryNode(node)
    }
    saveSimulatorState()
  }

  triggerFeederAction(nodeId, dose = 50) {
    const node = nodes.find(n => n.id === nodeId || n.pondId === nodeId)
    if (node && node.isPowered) {
      this.executeFeed(node, dose, 'g')
    }
  }

  triggerMolassesAction(nodeId, dose = 100) {
    const node = nodes.find(n => n.id === nodeId || n.pondId === nodeId)
    if (node && node.isPowered) {
      this.executeMolasses(node, dose, 'ml')
    }
  }

  triggerSiphonAction(nodeId, volume = 200) {
    const node = nodes.find(n => n.id === nodeId || n.pondId === nodeId)
    if (node && node.isPowered) {
      this.executeWaterChange(node, volume, 'liter')
    }
  }

  applyNaturalDriftAll() {
    nodes.forEach(node => {
      // Respect node lock and global drift setting
      if (!node.isPowered || node.isLocked || !clusterState.driftEnabled) return

      let targetDo = 6.4
      let targetTan = 0.2
      if (node.simulationCondition === 'warning') {
        targetDo = 4.2
        targetTan = 0.55
      } else if (node.simulationCondition === 'danger') {
        targetDo = 2.8
        targetTan = 1.3
      }

      let dDo = 0
      if (node.aerator.state === 'running') {
        const aeratorFactor = (node.aerator.powerPercent || 100) / 100
        if (node.dissolvedOxygen < targetDo + 0.3) {
          dDo = (0.02 + Math.random() * 0.02) * aeratorFactor
        } else {
          dDo = (Math.random() - 0.5) * 0.015
        }
      } else {
        dDo = -(0.03 + Math.random() * 0.03)
      }

      const dPh = (Math.random() - 0.5) * 0.01
      const dTemp = (Math.random() - 0.5) * 0.02
      const dAmmonia = (Math.random() - 0.5) * 0.005
      const dMud = (Math.random() - 0.5) * 0.2

      node.ph = Math.min(8.8, Math.max(6.0, +(node.ph + dPh).toFixed(2)))
      node.temperature = Math.min(34.0, Math.max(24.0, +(node.temperature + dTemp).toFixed(1)))
      node.ammonia = Math.min(2.5, Math.max(0.01, +(node.ammonia + dAmmonia).toFixed(3)))
      node.mudSolids = Math.min(450.0, Math.max(25.0, +(node.mudSolids + dMud).toFixed(1)))
      node.flocDensity = +(node.mudSolids / 6.8).toFixed(1)
      node.dissolvedOxygen = Math.min(9.5, Math.max(1.0, +(node.dissolvedOxygen + dDo).toFixed(2)))
    })
  }

  handleIncomingCommand(payload, targetDevId) {
    if (!payload || typeof payload !== 'object') return

    const normalizedDev = (targetDevId || '').toLowerCase().replace('sac/', '')
    const payloadPond = (payload.target_pond || payload.pond_id || payload.device_id || '').toLowerCase().replace('sac/', '')

    let targetNode = nodes.find(n => 
      n.id.toLowerCase() === targetDevId?.toLowerCase() ||
      n.id.toLowerCase() === `sac/${normalizedDev}` ||
      n.pondId.toLowerCase() === normalizedDev ||
      n.legacyId.toLowerCase() === normalizedDev ||
      n.pondId.toLowerCase() === payloadPond ||
      n.id.toLowerCase() === `sac/${payloadPond}` ||
      n.legacyId.toLowerCase() === payloadPond
    )
    if (!targetNode || !targetNode.isPowered) {
      return
    }

    const action = (payload.action || payload.command || '').toLowerCase()
    const params = payload.params || payload.parameters || payload

    switch (action) {
      case 'aerator':
      case 'set_aerator':
      case 'paddlewheel':
      case 'blower':
        this.executeAerator(
          targetNode,
          params.state !== false && params.state !== 'off' && params.state !== 'idle',
          params.powerPercent || params.power || 100,
          payload.command_id
        )
        break

      case 'feed':
      case 'feeder':
      case 'pakan':
        this.executeFeed(targetNode, params.dose || params.amount || 50, params.unit || 'g', payload.command_id)
        break

      case 'pump_molasses':
      case 'molasses':
      case 'molase':
        this.executeMolasses(targetNode, params.dose || params.amount || 100, params.unit || 'ml', payload.command_id)
        break

      case 'siphon':
      case 'water_change':
      case 'ganti_air':
      case 'drain_refill':
        this.executeWaterChange(targetNode, params.volume || params.dose || 200, params.unit || 'liter', payload.command_id)
        break

      default:
        console.warn('Unknown command action for node', targetNode.id, action)
        break
    }
  }

  executeAerator(node, enable = true, powerPercent = 100, commandId = null) {
    if (!node.isPowered) return
    node.aerator.state = enable ? 'running' : 'idle'
    node.aerator.powerPercent = enable ? Math.min(100, Math.max(25, Number(powerPercent) || 100)) : 0
    node.aerator.frequencyHz = enable ? Math.round((node.aerator.powerPercent / 100) * 50) : 0
    node.aerator.lastTriggered = new Date().toLocaleTimeString()

    const eventPayload = {
      device_id: node.id,
      pond_id: node.pondId,
      event: enable ? 'AERATOR_STARTED' : 'AERATOR_STOPPED',
      timestamp: new Date().toISOString(),
      data: { command_id: commandId, state: node.aerator.state, power_percent: node.aerator.powerPercent, status: 'SUCCESS' }
    }
    mqttService.publish(`sac/${node.pondId.toLowerCase()}/events`, eventPayload, node.id)
    mqttService.publish(`${node.id}/events`, eventPayload, node.id)
    this.publishTelemetryNode(node)
  }

  executeFeed(node, dose, unit = 'g', commandId = null) {
    if (!node.isPowered || node.feeder.state === 'running') return

    node.feeder.state = 'running'
    node.feeder.dose = dose
    node.feeder.progress = 0
    node.feeder.lastTriggered = new Date().toLocaleTimeString()

    const startPayload = {
      device_id: node.id,
      pond_id: node.pondId,
      event: 'FEED_STARTED',
      timestamp: new Date().toISOString(),
      data: { command_id: commandId, dose, unit }
    }
    mqttService.publish(`sac/${node.pondId.toLowerCase()}/events`, startPayload, node.id)
    mqttService.publish(`${node.id}/events`, startPayload, node.id)
    this.publishTelemetryNode(node)

    const durationSec = Math.min(10, Math.max(5, Math.round(dose / 20)))
    const stepInterval = (durationSec * 1000) / 50

    let currentProgress = 0
    const feedInterval = setInterval(() => {
      currentProgress += 2
      node.feeder.progress = Math.min(100, currentProgress)

      if (currentProgress >= 100) {
        clearInterval(feedInterval)
        node.feeder.state = 'idle'
        node.feeder.progress = 100
        node.feeder.totalToday += Number(dose)

        setTimeout(() => {
          node.ammonia = +(node.ammonia + 0.04).toFixed(3)
        }, 2000)

        const completedPayload = {
          device_id: node.id,
          pond_id: node.pondId,
          event: 'FEED_COMPLETED',
          timestamp: new Date().toISOString(),
          data: { command_id: commandId, total_today_grams: node.feeder.totalToday, status: 'SUCCESS' }
        }
        mqttService.publish(`sac/${node.pondId.toLowerCase()}/events`, completedPayload, node.id)
        mqttService.publish(`${node.id}/events`, completedPayload, node.id)
        this.publishTelemetryNode(node)
      }
    }, stepInterval)
  }

  executeMolasses(node, dose, unit = 'ml', commandId = null) {
    if (!node.isPowered || node.molassesPump.state === 'running') return

    node.molassesPump.state = 'running'
    node.molassesPump.dose = dose
    node.molassesPump.progress = 0
    node.molassesPump.lastTriggered = new Date().toLocaleTimeString()

    const startPayload = {
      device_id: node.id,
      pond_id: node.pondId,
      event: 'MOLASSES_STARTED',
      timestamp: new Date().toISOString(),
      data: { command_id: commandId, dose, unit }
    }
    mqttService.publish(`sac/${node.pondId.toLowerCase()}/events`, startPayload, node.id)
    mqttService.publish(`${node.id}/events`, startPayload, node.id)
    this.publishTelemetryNode(node)

    const durationSec = Math.min(12, Math.max(5, Math.round(dose / 20)))
    const stepInterval = (durationSec * 1000) / 50

    let currentProgress = 0
    const pumpInterval = setInterval(() => {
      currentProgress += 2
      node.molassesPump.progress = Math.min(100, currentProgress)

      if (currentProgress % 20 === 0 && node.ammonia > 0.05) {
        node.ammonia = +(Math.max(0.02, node.ammonia - 0.02)).toFixed(3)
      }

      if (currentProgress >= 100) {
        clearInterval(pumpInterval)
        node.molassesPump.state = 'idle'
        node.molassesPump.progress = 100
        node.molassesPump.totalToday += Number(dose)

        const completedPayload = {
          device_id: node.id,
          pond_id: node.pondId,
          event: 'MOLASSES_COMPLETED',
          timestamp: new Date().toISOString(),
          data: { command_id: commandId, total_today_ml: node.molassesPump.totalToday, status: 'SUCCESS' }
        }
        mqttService.publish(`sac/${node.pondId.toLowerCase()}/events`, completedPayload, node.id)
        mqttService.publish(`${node.id}/events`, completedPayload, node.id)
        this.publishTelemetryNode(node)
      }
    }, stepInterval)
  }

  executeWaterChange(node, volume, unit = 'liter', commandId = null) {
    if (!node.isPowered || node.waterChange.state !== 'idle') return

    node.waterChange.state = 'draining'
    node.waterChange.volume = volume
    node.waterChange.progress = 0
    node.waterChange.phase = 'Draining Sludge'
    node.waterChange.lastTriggered = new Date().toLocaleTimeString()

    const startPayload = {
      device_id: node.id,
      pond_id: node.pondId,
      event: 'SIPHON_STARTED',
      timestamp: new Date().toISOString(),
      data: { command_id: commandId, volume, unit }
    }
    mqttService.publish(`sac/${node.pondId.toLowerCase()}/events`, startPayload, node.id)
    mqttService.publish(`${node.id}/events`, startPayload, node.id)
    this.publishTelemetryNode(node)

    const totalDurationSec = Math.min(16, Math.max(5, Math.round(volume / 35)))
    const stepInterval = (totalDurationSec * 1000) / 50

    let currentProgress = 0
    const wcInterval = setInterval(() => {
      currentProgress += 2
      node.waterChange.progress = Math.min(100, currentProgress)

      if (currentProgress === 50) {
        node.waterChange.state = 'refilling'
        node.waterChange.phase = 'Refilling Water'
        this.publishTelemetryNode(node)
      }

      if (currentProgress <= 50) {
        node.mudSolids = +(Math.max(25.0, node.mudSolids - 2.0)).toFixed(1)
        node.flocDensity = +(node.mudSolids / 6.8).toFixed(1)
      } else {
        node.dissolvedOxygen = +(Math.min(7.5, node.dissolvedOxygen + 0.06)).toFixed(2)
        node.ammonia = +(Math.max(0.05, node.ammonia - 0.03)).toFixed(3)
      }

      if (currentProgress >= 100) {
        clearInterval(wcInterval)
        node.waterChange.state = 'idle'
        node.waterChange.phase = 'Completed'
        node.waterChange.progress = 100
        node.waterChange.totalToday += Number(volume)

        const completedPayload = {
          device_id: node.id,
          pond_id: node.pondId,
          event: 'SIPHON_COMPLETED',
          timestamp: new Date().toISOString(),
          data: { command_id: commandId, total_today_liters: node.waterChange.totalToday, status: 'SUCCESS' }
        }
        mqttService.publish(`sac/${node.pondId.toLowerCase()}/events`, completedPayload, node.id)
        mqttService.publish(`${node.id}/events`, completedPayload, node.id)
        this.publishTelemetryNode(node)
      }
    }, stepInterval)
  }
}

export const simulationEngine = new SimulationEngine()
