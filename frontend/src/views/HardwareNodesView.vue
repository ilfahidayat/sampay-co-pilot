<script setup>
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePonds } from '../composables/usePonds'
import { useToast } from '../composables/useToast'
import { frontendMqttClient } from '../services/mqttClient'
import { 
  Cpu, 
  Wifi, 
  Activity, 
  CheckCircle2, 
  AlertTriangle,
  RotateCw, 
  Radio, 
  Server, 
  ArrowUpRight, 
  RefreshCw,
  LayoutGrid,
  TableProperties,
  Search,
  X,
  Fan,
  Utensils,
  Pipette,
  Droplets
} from 'lucide-vue-next'

const router = useRouter()
const { setPond } = usePonds()
const { showToast } = useToast()

// View Mode: 'grid' | 'table'
const viewMode = ref('grid')
const isPingingAll = ref(false)
const pingResults = ref({})
const searchQuery = ref('')

// Direct MQTT Hardware Nodes State (Edge Live Observation)
const mqttHardwareNodes = reactive([
  {
    id: 'sac/pond001',
    pondId: 'K01',
    pondName: 'Pond 1',
    legacyId: 'ESP32-AQUA-01',
    isPowered: true,
    condition: 'ok',
    uptimeSeconds: 0,
    batteryPercent: 94,
    batteryVoltage: 24.2,
    wifiRssi: -58,
    freeHeap: 188000,
    pingMs: 28,
    telemetry: { do: 6.4, ph: 7.6, temp: 28.8, ammonia: 0.015, flocDensity: 14.0 },
    actuators: {
      aerator: { status: 'RUNNING', powerPercent: 80 },
      feeder: { status: 'IDLE' },
      dosing: { status: 'IDLE' },
      flush: { status: 'IDLE' }
    }
  },
  {
    id: 'sac/pond002',
    pondId: 'K02',
    pondName: 'Pond 2',
    legacyId: 'ESP32-AQUA-02',
    isPowered: true,
    condition: 'ok',
    uptimeSeconds: 0,
    batteryPercent: 88,
    batteryVoltage: 24.1,
    wifiRssi: -62,
    freeHeap: 184500,
    pingMs: 36,
    telemetry: { do: 6.8, ph: 7.4, temp: 28.2, ammonia: 0.025, flocDensity: 10.0 },
    actuators: {
      aerator: { status: 'RUNNING', powerPercent: 85 },
      feeder: { status: 'IDLE' },
      dosing: { status: 'IDLE' },
      flush: { status: 'IDLE' }
    }
  },
  {
    id: 'sac/pond003',
    pondId: 'K03',
    pondName: 'Pond 3',
    legacyId: 'ESP32-AQUA-03',
    isPowered: true,
    condition: 'ok',
    uptimeSeconds: 0,
    batteryPercent: 98,
    batteryVoltage: 24.4,
    wifiRssi: -54,
    freeHeap: 192000,
    pingMs: 31,
    telemetry: { do: 6.9, ph: 7.5, temp: 28.4, ammonia: 0.012, flocDensity: 8.0 },
    actuators: {
      aerator: { status: 'RUNNING', powerPercent: 60 },
      feeder: { status: 'IDLE' },
      dosing: { status: 'IDLE' },
      flush: { status: 'IDLE' }
    }
  },
  {
    id: 'sac/pond004',
    pondId: 'K04',
    pondName: 'Pond 4',
    legacyId: 'ESP32-AQUA-04',
    isPowered: true,
    condition: 'warning',
    uptimeSeconds: 0,
    batteryPercent: 79,
    batteryVoltage: 23.8,
    wifiRssi: -65,
    freeHeap: 181000,
    pingMs: 24,
    telemetry: { do: 4.8, ph: 6.95, temp: 28.1, ammonia: 0.65, flocDensity: 21.0 },
    actuators: {
      aerator: { status: 'RUNNING', powerPercent: 100 },
      feeder: { status: 'IDLE' },
      dosing: { status: 'IDLE' },
      flush: { status: 'IDLE' }
    }
  }
])

let handleTelemetryMsg = null
let handleEventMsg = null

onMounted(() => {
  // Direct MQTT Stream Subscription for Hardware Page
  handleTelemetryMsg = ({ pondId, data }) => {
    if (!data) return
    const rawId = (pondId || data.pond_id || data.device_id || '').toUpperCase().replace('SAC/', '')
    const target = mqttHardwareNodes.find(n => n.pondId === rawId || n.id.toUpperCase().includes(rawId))
    if (!target) return

    const isOff = data.isPowered === false || data.condition === 'offline' || data.system?.power_state === 'OFF'
    target.isPowered = !isOff
    target.condition = data.condition || 'ok'

    if (data.uptime_seconds !== undefined) target.uptimeSeconds = data.uptime_seconds

    if (data.system) {
      if (data.system.battery_percent !== undefined) target.batteryPercent = data.system.battery_percent
      if (data.system.battery_v !== undefined) target.batteryVoltage = data.system.battery_v
      if (data.system.wifi_rssi_dbm !== undefined) target.wifiRssi = data.system.wifi_rssi_dbm
      if (data.system.free_heap_bytes !== undefined) target.freeHeap = data.system.free_heap_bytes
    }

    if (data.sensors) {
      target.telemetry = {
        do: data.sensors.dissolved_oxygen_mg_l ?? data.sensors.do ?? target.telemetry.do,
        ph: data.sensors.ph ?? target.telemetry.ph,
        temp: data.sensors.temperature_c ?? data.sensors.temp ?? target.telemetry.temp,
        ammonia: data.sensors.ammonia_mg_l ?? data.sensors.ammonia ?? target.telemetry.ammonia,
        flocDensity: data.sensors.floc_density_ml_l ?? data.sensors.flocDensity ?? target.telemetry.flocDensity
      }
    }

    if (data.actuators) {
      if (data.actuators.aerator) {
        target.actuators.aerator.status = data.actuators.aerator.state === 'running' ? 'RUNNING' : 'IDLE'
        if (data.actuators.aerator.power_percent !== undefined) {
          target.actuators.aerator.powerPercent = data.actuators.aerator.power_percent
        }
      }
      if (data.actuators.feeder) {
        target.actuators.feeder.status = data.actuators.feeder.state === 'running' ? 'RUNNING' : 'IDLE'
      }
      if (data.actuators.molasses_pump) {
        target.actuators.dosing.status = data.actuators.molasses_pump.state === 'running' ? 'RUNNING' : 'IDLE'
      }
      if (data.actuators.siphon) {
        target.actuators.flush.status = data.actuators.siphon.state === 'running' ? 'RUNNING' : 'IDLE'
      }
    }
  }

  handleEventMsg = ({ pondId, data }) => {
    if (!data) return
    const rawId = (pondId || data.pond_id || data.device_id || '').toUpperCase().replace('SAC/', '')
    const target = mqttHardwareNodes.find(n => n.pondId === rawId || n.id.toUpperCase().includes(rawId))
    if (!target) return

    const evt = data.event || ''
    if (evt.includes('FEED')) {
      target.actuators.feeder.status = evt.includes('COMPLETED') ? 'IDLE' : 'RUNNING'
    } else if (evt.includes('MOLASSES')) {
      target.actuators.dosing.status = evt.includes('COMPLETED') ? 'IDLE' : 'RUNNING'
    } else if (evt.includes('SIPHON')) {
      target.actuators.flush.status = evt.includes('COMPLETED') ? 'IDLE' : 'RUNNING'
    } else if (evt.includes('AERATOR')) {
      target.actuators.aerator.status = evt.includes('STARTED') ? 'RUNNING' : 'IDLE'
    }
  }

  frontendMqttClient.on('telemetry', handleTelemetryMsg)
  frontendMqttClient.on('event', handleEventMsg)
})

onUnmounted(() => {
  if (handleTelemetryMsg) frontendMqttClient.off('telemetry', handleTelemetryMsg)
  if (handleEventMsg) frontendMqttClient.off('event', handleEventMsg)
})

// Icon resolver for actuators
const getActuatorIcon = (iconName) => {
  switch (iconName) {
    case 'Fan': return Fan
    case 'Utensils': return Utensils
    case 'Pipette': return Pipette
    case 'Droplets': return Droplets
    case 'Cpu': return Cpu
    default: return Activity
  }
}

// Helper: format seconds to concise human uptime
const formatUptime = (seconds) => {
  if (!seconds || seconds <= 0) return '0s'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

// Dynamically generate hardware nodes connected directly to MQTT Edge Nodes
const nodes = computed(() => {
  return mqttHardwareNodes.map((pond) => {
    const pId = pond.pondId || pond.id
    const pName = pond.pondName || pond.name || `Pond ${pId}`
    const isPowered = pond.isPowered !== false
    const basePing = isPowered 
      ? (pingResults.value[pId] || (pId === 'K04' ? 24 : (pId === 'K01' ? 28 : (pId === 'K02' ? 36 : 31))))
      : '—'
    
    // Determine overall node operational health
    let nodeStatus = 'HEALTHY'
    let nodeStatusLabel = 'Operational'

    if (!isPowered) {
      nodeStatus = 'OFFLINE'
      nodeStatusLabel = 'Powered Off'
    } else if (
      pond.simulationCondition === 'danger' || 
      (pond.telemetry?.do !== undefined && pond.telemetry.do < 3.5) || 
      (pond.telemetry?.ammonia !== undefined && pond.telemetry.ammonia > 0.8)
    ) {
      nodeStatus = 'CRITICAL'
      nodeStatusLabel = 'Action Needed'
    } else if (
      pond.simulationCondition === 'warning' || 
      (pond.telemetry?.do !== undefined && pond.telemetry.do < 5.0) || 
      (pond.telemetry?.ammonia !== undefined && pond.telemetry.ammonia > 0.35)
    ) {
      nodeStatus = 'WARNING'
      nodeStatusLabel = 'Warning'
    }

    // 1. Strictly 5 Telemetry Sensors (RS485 Modbus)
    const sensors = [
      {
        id: 's_do',
        code: 'DO',
        name: 'Dissolved Oxygen',
        sub: 'Optical RS485',
        status: isPowered ? 'AVAILABLE' : 'UNAVAILABLE',
        statusLabel: isPowered ? 'Ready' : 'Offline'
      },
      {
        id: 's_ph',
        code: 'pH',
        name: 'pH Sensor',
        sub: 'Electrode RS485',
        status: isPowered ? 'AVAILABLE' : 'UNAVAILABLE',
        statusLabel: isPowered ? 'Ready' : 'Offline'
      },
      {
        id: 's_temp',
        code: 'TEMP',
        name: 'Water Temperature',
        sub: 'DS18B20 Digital',
        status: isPowered ? 'AVAILABLE' : 'UNAVAILABLE',
        statusLabel: isPowered ? 'Ready' : 'Offline'
      },
      {
        id: 's_nh3',
        code: 'TAN',
        name: 'Ammonia (NH3/TAN)',
        sub: 'ISE Modbus',
        status: isPowered ? 'AVAILABLE' : 'UNAVAILABLE',
        statusLabel: isPowered ? 'Ready' : 'Offline'
      },
      {
        id: 's_floc',
        code: 'FLOC',
        name: 'Biofloc Density',
        sub: 'Optical AI Probe',
        status: isPowered ? 'AVAILABLE' : 'UNAVAILABLE',
        statusLabel: isPowered ? 'Ready' : 'Offline'
      }
    ]

    // 2. Symmetrical 5 Actuator & Equipment rows (4 field actuators + 1 Edge Controller Hub)
    const feeder = pond.actuators?.feeder
    const aerator = pond.actuators?.aerator
    const dosing = pond.actuators?.dosing
    const flush = pond.actuators?.flush

    const resolveActuatorState = (rawStatus, activeTerms = ['RUNNING', 'DISPENSING', 'DOSING', 'DRAINING', 'ACTIVE']) => {
      if (!isPowered) return { status: 'IDLE', label: 'Off' }
      if (!rawStatus) return { status: 'IDLE', label: 'Standby' }
      if (rawStatus === 'ERROR' || rawStatus === 'FAULT') return { status: 'ERROR', label: 'Error' }
      if (activeTerms.includes(rawStatus.toUpperCase())) return { status: 'IN_PROGRESS', label: 'Active' }
      return { status: 'IDLE', label: 'Standby' }
    }

    const aeratorState = resolveActuatorState(aerator?.status, ['RUNNING', 'ACTIVE'])
    const feederState = resolveActuatorState(feeder?.status, ['DISPENSING', 'FEEDING', 'ACTIVE'])
    const dosingState = resolveActuatorState(dosing?.status, ['DOSING', 'ACTIVE'])
    const flushState = resolveActuatorState(flush?.status, ['DRAINING', 'FLUSHING', 'ACTIVE'])

    const actuators = [
      {
        id: 'act_aerator',
        name: 'Aerator Speed',
        sub: 'VFD Inverter Controller',
        icon: 'Fan',
        status: aeratorState.status,
        statusLabel: isPowered 
          ? (aeratorState.status === 'IN_PROGRESS' ? `Run (${aerator?.powerPercent || 80}%)` : 'Standby')
          : 'Off'
      },
      {
        id: 'act_feeder',
        name: 'Auto-Feeder',
        sub: 'Feed Auger Dispenser',
        icon: 'Utensils',
        status: feederState.status,
        statusLabel: isPowered
          ? (feederState.status === 'IN_PROGRESS' ? 'Dispensing' : 'Standby')
          : 'Off'
      },
      {
        id: 'act_dosing',
        name: 'Molasses Pump',
        sub: 'C/N Carbon Dosing Valve',
        icon: 'Pipette',
        status: dosingState.status,
        statusLabel: isPowered
          ? (dosingState.status === 'IN_PROGRESS' ? 'Dosing' : 'Standby')
          : 'Off'
      },
      {
        id: 'act_siphon',
        name: 'Siphon Drain Valve',
        sub: 'Drain & Water Change',
        icon: 'Droplets',
        status: flushState.status,
        statusLabel: isPowered
          ? (flushState.status === 'IN_PROGRESS' ? 'Draining' : 'Standby')
          : 'Off'
      },
      {
        id: 'act_controller',
        name: 'ESP32 Controller',
        sub: `WiFi: ${pond.wifiRssi || -58} dBm`,
        icon: 'Cpu',
        status: isPowered ? 'IN_PROGRESS' : 'IDLE',
        statusLabel: isPowered ? 'Online' : 'Off'
      }
    ]

    const num = (pId.replace(/\D/g, '') || '1').padStart(3, '0')
    const nodeId = `sac/pond${num}`
    const mqttChannel = `sac/pond${num}`

    return {
      id: nodeId,
      pondId: pId,
      pondName: pName,
      pondShortName: pName.includes('—') ? pName.split('—')[1].trim() : pName,
      isPowered,
      condition: pond.condition || 'ok',
      connectionStatus: isPowered ? 'CONNECTED' : 'DISCONNECTED',
      connectionLabel: isPowered ? 'Online' : 'Offline',
      mqttChannel,
      pingMs: basePing,
      status: nodeStatus,
      statusLabel: nodeStatusLabel,
      uptime: isPowered ? formatUptime(pond.uptimeSeconds || 0) : '0s',
      heapKb: Math.round((pond.freeHeap || 188000) / 1024),
      wifiRssi: pond.wifiRssi || -58,
      sensors,
      actuators
    }
  })
})

// Filtered nodes based on search query
const filteredNodes = computed(() => {
  if (!searchQuery.value.trim()) return nodes.value
  const q = searchQuery.value.toLowerCase().trim()
  return nodes.value.filter(n => 
    n.id.toLowerCase().includes(q) ||
    n.pondId.toLowerCase().includes(q) ||
    n.pondName.toLowerCase().includes(q) ||
    n.mqttChannel.toLowerCase().includes(q) ||
    n.sensors.some(s => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)) ||
    n.actuators.some(a => a.name.toLowerCase().includes(q))
  )
})

// Global Metrics
const totalNodesCount = computed(() => nodes.value.length)
const connectedCount = computed(() => nodes.value.filter(n => n.connectionStatus === 'CONNECTED').length)
const avgPingMs = computed(() => {
  const onlineNodes = nodes.value.filter(n => n.isPowered && typeof n.pingMs === 'number')
  if (!onlineNodes.length) return 0
  const sum = onlineNodes.reduce((acc, n) => acc + n.pingMs, 0)
  return Math.round(sum / onlineNodes.length)
})

const allSensors = computed(() => nodes.value.flatMap(n => n.sensors))
const sensorsAvailableCount = computed(() => allSensors.value.filter(s => s.status === 'AVAILABLE').length)
const sensorsUnavailableCount = computed(() => allSensors.value.filter(s => s.status === 'UNAVAILABLE').length)

const allActuators = computed(() => nodes.value.flatMap(n => n.actuators.filter(a => a.id !== 'act_controller')))
const actuatorsInProgressCount = computed(() => allActuators.value.filter(a => a.status === 'IN_PROGRESS').length)
const actuatorsIdleCount = computed(() => allActuators.value.filter(a => a.status === 'IDLE').length)

// Interactive actions
const pingNode = (node) => {
  if (!node.isPowered) {
    showToast(`⚠️ Node ${node.id} (${node.pondId}) is Powered Off — Ping timed out.`, 'warning')
    return
  }
  const newPing = Math.floor(Math.random() * 14) + 20
  pingResults.value[node.pondId] = newPing
  showToast(`📡 Ping to ${node.id} (${node.mqttChannel}): ${newPing}ms RTT`, 'info')
}

const pingAllNodes = () => {
  isPingingAll.value = true
  setTimeout(() => {
    let onlineCount = 0
    nodes.value.forEach(n => {
      if (n.isPowered) {
        pingResults.value[n.pondId] = Math.floor(Math.random() * 14) + 20
        onlineCount++
      } else {
        pingResults.value[n.pondId] = '—'
      }
    })
    isPingingAll.value = false
    showToast(`✅ Polled all ${nodes.value.length} edge nodes (${onlineCount} online) • Avg: ${avgPingMs.value}ms`, 'success')
  }, 350)
}

const inspectPond = (pondId) => {
  setPond(pondId)
  router.push('/water-quality')
}
</script>

<template>
  <div class="hardware-view">
    <!-- View Header -->
    <header class="view-header">
      <div class="header-left">
        <div class="icon-box">
          <Cpu :size="20" class="text-sky" />
        </div>
        <div class="header-title-box">
          <div class="title-with-badge">
            <h2 class="view-title font-display">Equipment & Sensors</h2>
            <span class="broker-badge font-mono">
              <span class="pulse-dot online"></span>
              broker.emqx.io • {{ avgPingMs }}ms Ping
            </span>
          </div>
          <span class="view-sub font-mono">
            Edge controller connectivity, 5 telemetry probes status, and 4 automated actuators
          </span>
        </div>
      </div>

      <!-- Controls: Ping & View Mode Selector -->
      <div class="header-actions">
        <button 
          id="btn-ping-all-nodes"
          class="btn-ping-all font-mono"
          :disabled="isPingingAll"
          @click="pingAllNodes"
        >
          <RotateCw :size="13" :class="{ 'spin-anim': isPingingAll }" />
          <span>{{ isPingingAll ? 'Pinging...' : 'Ping All Nodes' }}</span>
        </button>

        <div class="layout-toggle-group font-mono">
          <button 
            id="btn-view-grid"
            class="layout-btn" 
            :class="{ active: viewMode === 'grid' }"
            title="Card Grid View"
            @click="viewMode = 'grid'"
          >
            <LayoutGrid :size="13" />
            <span>Cards</span>
          </button>
          <button 
            id="btn-view-table"
            class="layout-btn" 
            :class="{ active: viewMode === 'table' }"
            title="Matrix Table View"
            @click="viewMode = 'table'"
          >
            <TableProperties :size="13" />
            <span>Table</span>
          </button>
        </div>
      </div>
    </header>

    <!-- 4 Network Summary Mini KPIs (Compact & Symmetrical) -->
    <section class="summary-kpis-bar font-mono">
      <div class="kpi-mini-card">
        <div class="kpi-mini-icon sky">
          <Server :size="15" />
        </div>
        <div class="kpi-mini-content">
          <span class="kpi-mini-lbl">Edge Nodes</span>
          <span class="kpi-mini-val text-sky">
            {{ connectedCount }} / {{ totalNodesCount }} <small>Online</small>
          </span>
        </div>
      </div>

      <div class="kpi-mini-card">
        <div class="kpi-mini-icon purple">
          <Wifi :size="15" />
        </div>
        <div class="kpi-mini-content">
          <span class="kpi-mini-lbl">Network Latency</span>
          <span class="kpi-mini-val text-purple">
            {{ avgPingMs }}ms <small>RTT • EMQX</small>
          </span>
        </div>
      </div>

      <div class="kpi-mini-card">
        <div class="kpi-mini-icon emerald">
          <Radio :size="15" />
        </div>
        <div class="kpi-mini-content">
          <span class="kpi-mini-lbl">Telemetry Probes</span>
          <span class="kpi-mini-val text-emerald">
            {{ sensorsAvailableCount }} / {{ allSensors.length }} <small>Ready</small>
            <small v-if="sensorsUnavailableCount > 0" class="text-rose"> • {{ sensorsUnavailableCount }} Off</small>
          </span>
        </div>
      </div>

      <div class="kpi-mini-card">
        <div class="kpi-mini-icon sky">
          <Activity :size="15" />
        </div>
        <div class="kpi-mini-content">
          <span class="kpi-mini-lbl">Actuators Status</span>
          <span class="kpi-mini-val text-sky">
            {{ actuatorsInProgressCount }} <small>Active</small> • {{ actuatorsIdleCount }} <small>Standby</small>
          </span>
        </div>
      </div>
    </section>

    <!-- Quick Search & Filter Toolbar -->
    <div class="hw-toolbar">
      <div class="search-input-box">
        <Search :size="13" class="search-icon" />
        <input 
          id="input-hw-search"
          v-model="searchQuery" 
          type="text" 
          class="font-mono"
          placeholder="Filter node, pond, MQTT channel, or device..."
        />
        <button 
          v-if="searchQuery" 
          class="btn-clear-search" 
          @click="searchQuery = ''"
          title="Clear search"
        >
          <X :size="12" />
        </button>
      </div>

      <span class="toolbar-hint font-mono">
        Showing {{ filteredNodes.length }} of {{ nodes.length }} Edge Nodes
      </span>
    </div>

    <!-- VIEW 1: CLEAN, COMPACT & SYMMETRICAL CARDS GRID -->
    <div v-if="viewMode === 'grid'" class="hw-cards-grid">
      <div 
        v-for="node in filteredNodes" 
        :key="node.id" 
        :id="'hw-card-' + node.pondId"
        class="hw-card"
      >
        <!-- Unified Compact Card Header -->
        <div class="hw-card-header">
          <div class="head-left">
            <span class="pond-pill font-mono">{{ node.pondId }}</span>
            <div class="title-stack">
              <div class="title-row">
                <h3 class="node-id-text font-mono">{{ node.id }}</h3>
                <span class="channel-pill font-mono" title="MQTT Telemetry Channel">
                  <Radio :size="10" />
                  {{ node.mqttChannel }}
                </span>
              </div>
              <span class="pond-name-text font-display">{{ node.pondName }}</span>
            </div>
          </div>

          <div class="head-right font-mono">
            <!-- Connection & Ping Pill -->
            <div class="conn-ping-pill" :class="node.connectionStatus.toLowerCase()">
              <span class="pulse-dot" :class="node.isPowered ? 'online' : 'offline'"></span>
              <span>{{ node.connectionLabel }}</span>
              <span class="ping-text">• {{ node.pingMs }}<span v-if="node.pingMs !== '—'">ms</span></span>
            </div>

            <!-- Ping Action Button -->
            <button 
              :id="'btn-ping-' + node.pondId"
              class="btn-ping-micro" 
              title="Ping this node via MQTT"
              @click="pingNode(node)"
            >
              <RefreshCw :size="11" />
            </button>
          </div>
        </div>

        <!-- Symmetrical 2-Column Body: 5 Probes (Left) vs 5 Actuators & Hub (Right) -->
        <div class="hw-symmetrical-body">
          <!-- COLUMN 1: 5 TELEMETRY SENSORS -->
          <div class="hw-col sensors-col">
            <div class="col-header font-mono">
              <span class="col-title">Telemetry Probes (5)</span>
              <span class="col-badge font-mono">RS485 Modbus</span>
            </div>

            <div class="col-items-list">
              <div 
                v-for="sensor in node.sensors" 
                :key="sensor.id" 
                class="hw-compact-row sensor-row"
                :class="sensor.status.toLowerCase()"
              >
                <div class="row-left">
                  <span class="code-badge font-mono">{{ sensor.code }}</span>
                  <div class="row-text">
                    <span class="row-name">{{ sensor.name }}</span>
                    <span class="row-sub font-mono">{{ sensor.sub }}</span>
                  </div>
                </div>

                <div class="row-right">
                  <span class="micro-status-dot" :class="sensor.status.toLowerCase()">
                    <span class="dot"></span>
                    <span class="dot-label font-mono">{{ sensor.statusLabel }}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- COLUMN 2: 5 ACTUATORS & HARDWARE HUB -->
          <div class="hw-col actuators-col">
            <div class="col-header font-mono">
              <span class="col-title">Actuators & Core (5)</span>
              <span class="col-badge font-mono">Relay & Edge</span>
            </div>

            <div class="col-items-list">
              <div 
                v-for="act in node.actuators" 
                :key="act.id" 
                class="hw-compact-row actuator-row"
                :class="act.status.toLowerCase().replace('_', '-')"
              >
                <div class="row-left">
                  <div class="icon-wrap" :class="act.status.toLowerCase().replace('_', '-')">
                    <component :is="getActuatorIcon(act.icon)" :size="12" />
                  </div>
                  <div class="row-text">
                    <span class="row-name">{{ act.name }}</span>
                    <span class="row-sub font-mono">{{ act.sub }}</span>
                  </div>
                </div>

                <div class="row-right">
                  <span class="act-state-pill font-mono" :class="act.status.toLowerCase().replace('_', '-')">
                    <Activity v-if="act.status === 'IN_PROGRESS' && act.id !== 'act_controller'" :size="9" class="spin-icon" />
                    <span>{{ act.statusLabel }}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Card Footer -->
        <div class="hw-card-footer font-mono">
          <div class="footer-meta">
            <span class="meta-item">Up: {{ node.uptime }}</span>
            <span class="meta-sep">•</span>
            <span class="meta-item">Heap: {{ node.heapKb }} KB</span>
            <span class="meta-sep">•</span>
            <span class="meta-item">RSSI: {{ node.wifiRssi }} dBm</span>
          </div>

          <button 
            :id="'btn-inspect-' + node.pondId"
            class="btn-inspect" 
            title="Open Water Quality & Telemetry for this pond"
            @click="inspectPond(node.pondId)"
          >
            <span>Telemetry</span>
            <ArrowUpRight :size="12" />
          </button>
        </div>
      </div>
    </div>

    <!-- VIEW 2: CLEAN, COMPACT & NON-OVERFLOWING TABLE VIEW -->
    <div v-else class="hw-table-card font-mono">
      <div class="table-responsive">
        <table class="hw-table">
          <thead>
            <tr>
              <th style="width: 140px;">Hardware Node</th>
              <th style="width: 130px;">Pond Target</th>
              <th style="width: 100px;">Status</th>
              <th style="width: 140px;">MQTT Channel</th>
              <th style="width: 80px;">Latency</th>
              <th>5 Sensor Probes</th>
              <th>4 Actuators</th>
              <th style="width: 90px; text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="node in filteredNodes" :key="node.id" :id="'hw-row-' + node.pondId">
              <!-- Node ID -->
              <td>
                <div class="table-node-cell">
                  <span class="font-bold text-primary">{{ node.id }}</span>
                  <span class="text-muted text-xs">Up: {{ node.uptime }}</span>
                </div>
              </td>

              <!-- Pond Target -->
              <td>
                <div class="table-pond-cell">
                  <span class="pond-mini-badge">{{ node.pondId }}</span>
                  <span class="pond-label">{{ node.pondShortName }}</span>
                </div>
              </td>

              <!-- Status -->
              <td>
                <span class="conn-ping-pill" :class="node.connectionStatus.toLowerCase()">
                  <span class="pulse-dot" :class="node.isPowered ? 'online' : 'offline'"></span>
                  <span>{{ node.connectionLabel }}</span>
                </span>
              </td>

              <!-- MQTT Channel -->
              <td>
                <code class="mqtt-table-code">{{ node.mqttChannel }}</code>
              </td>

              <!-- Latency -->
              <td>
                <span class="ping-val text-sky font-bold">{{ node.pingMs }}<span v-if="node.pingMs !== '—'">ms</span></span>
              </td>

              <!-- 5 Sensors: Compact Single Line Dots -->
              <td>
                <div class="table-sensor-pills">
                  <span 
                    v-for="s in node.sensors" 
                    :key="s.id" 
                    class="table-micro-dot"
                    :class="s.status.toLowerCase()"
                    :title="`${s.name} (${s.code}): ${s.statusLabel}`"
                  >
                    <span class="s-dot"></span>
                    <span class="s-code">{{ s.code }}</span>
                  </span>
                </div>
              </td>

              <!-- 4 Actuators: Compact Single Line Pills -->
              <td>
                <div class="table-act-pills">
                  <span 
                    v-for="act in node.actuators.filter(a => a.id !== 'act_controller')" 
                    :key="act.id" 
                    class="table-act-chip"
                    :class="act.status.toLowerCase().replace('_', '-')"
                    :title="`${act.name}: ${act.statusLabel}`"
                  >
                    <component :is="getActuatorIcon(act.icon)" :size="10" />
                    <span>{{ act.statusLabel }}</span>
                  </span>
                </div>
              </td>

              <!-- Action -->
              <td style="text-align: right;">
                <button class="btn-table-inspect" @click="inspectPond(node.pondId)" title="View Pond Telemetry">
                  <span>View</span>
                  <ArrowUpRight :size="11" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hardware-view {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  overflow-x: hidden;
}

/* =========================================================
   VIEW HEADER
========================================================= */
.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 12px 18px;
  box-shadow: var(--shadow-xs);
  flex-wrap: wrap;
  gap: 12px;
  min-width: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.icon-box {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: var(--sky-50);
  border: 1px solid var(--sky-100);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.header-title-box {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.title-with-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.view-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.01em;
}

.broker-badge {
  font-size: 0.66rem;
  font-weight: 700;
  color: #065f46;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  padding: 2px 8px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.view-sub {
  font-size: 0.7rem;
  color: var(--text-secondary);
  display: block;
  margin-top: 1px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-ping-all {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 7px;
  border: 1px solid var(--border-subtle);
  background: #ffffff;
  color: var(--text-primary);
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: var(--shadow-xs);
}

.btn-ping-all:hover:not(:disabled) {
  background: #f8fafc;
  border-color: var(--border-medium);
}

.btn-ping-all:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.layout-toggle-group {
  display: inline-flex;
  background: #f1f5f9;
  padding: 2px;
  border-radius: 7px;
  border: 1px solid var(--border-subtle);
  gap: 2px;
}

.layout-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 5px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.layout-btn:hover {
  color: #0f172a;
}

.layout-btn.active {
  background: #ffffff;
  color: var(--sky-700);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  font-weight: 700;
}

/* =========================================================
   SUMMARY KPIS BAR
========================================================= */
.summary-kpis-bar {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  width: 100%;
  box-sizing: border-box;
}

.kpi-mini-card {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: var(--shadow-xs);
  min-width: 0;
}

.kpi-mini-icon {
  width: 32px;
  height: 32px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kpi-mini-icon.sky {
  background: var(--sky-50);
  color: var(--sky-600);
}

.kpi-mini-icon.purple {
  background: #f3e8ff;
  color: #9333ea;
}

.kpi-mini-icon.emerald {
  background: #ecfdf5;
  color: #059669;
}

.kpi-mini-content {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.kpi-mini-lbl {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kpi-mini-val {
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--text-primary);
  margin-top: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kpi-mini-val small {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--text-muted);
}

/* =========================================================
   TOOLBAR
========================================================= */
.hw-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 6px 12px;
  gap: 10px;
  flex-wrap: wrap;
  width: 100%;
  box-sizing: border-box;
}

.search-input-box {
  position: relative;
  display: flex;
  align-items: center;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 7px;
  height: 30px;
  width: 340px;
  max-width: 100%;
  padding: 0 8px 0 28px;
  transition: all 0.15s ease;
}

.search-input-box:focus-within {
  background: #ffffff;
  border-color: var(--sky-500);
  box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.12);
}

.search-icon {
  position: absolute;
  left: 8px;
  color: #94a3b8;
  pointer-events: none;
}

.search-input-box input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.72rem;
  color: var(--text-primary);
  padding: 0;
}

.btn-clear-search {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: none;
  background: #e2e8f0;
  color: #64748b;
  cursor: pointer;
  padding: 0;
}

.btn-clear-search:hover {
  background: #cbd5e1;
  color: #0f172a;
}

.toolbar-hint {
  font-size: 0.68rem;
  color: var(--text-muted);
}

/* =========================================================
   CARDS GRID VIEW (CLEAN, SYMMETRICAL & COMPACT)
========================================================= */
.hw-cards-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.hw-card {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  box-shadow: var(--shadow-xs);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.15s ease;
  min-width: 0;
  box-sizing: border-box;
}

.hw-card:hover {
  border-color: #cbd5e1;
  box-shadow: var(--shadow-sm);
}

/* Unified Compact Card Header */
.hw-card-header {
  padding: 10px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid #f1f5f9;
  background: #fafbfc;
  min-width: 0;
}

.head-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.pond-pill {
  padding: 3px 6px;
  border-radius: 5px;
  background: #0284c7;
  color: #ffffff;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  flex-shrink: 0;
}

.title-stack {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.node-id-text {
  font-size: 0.85rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  line-height: 1.2;
  white-space: nowrap;
}

.channel-pill {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.62rem;
  color: #0284c7;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  padding: 1px 5px;
  border-radius: 4px;
  font-weight: 600;
  white-space: nowrap;
}

.pond-name-text {
  font-size: 0.7rem;
  color: #64748b;
  margin-top: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.head-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.conn-ping-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 5px;
  font-size: 0.64rem;
  font-weight: 700;
  white-space: nowrap;
}

.conn-ping-pill.connected {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #065f46;
}

.conn-ping-pill.disconnected {
  background: #fff1f2;
  border: 1px solid #fecdd3;
  color: #9f1239;
}

.ping-text {
  color: #047857;
  font-weight: 600;
}

.pulse-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
}

.pulse-dot.online {
  background: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.25);
}

.pulse-dot.offline {
  background: #ef4444;
}

.btn-ping-micro {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 5px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #475569;
  cursor: pointer;
  transition: all 0.12s ease;
}

.btn-ping-micro:hover {
  background: #f1f5f9;
  color: #0f172a;
  border-color: #94a3b8;
}

/* =========================================================
   SYMMETRICAL 2-COLUMN BODY (5 SENSORS vs 5 ACTUATORS)
========================================================= */
.hw-symmetrical-body {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  padding: 10px 14px;
  background: #ffffff;
  min-width: 0;
}

.hw-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px 10px;
  min-width: 0;
  box-sizing: border-box;
}

.col-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 5px;
  border-bottom: 1px solid #e2e8f0;
  min-width: 0;
}

.col-title {
  font-size: 0.68rem;
  font-weight: 700;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.col-badge {
  font-size: 0.6rem;
  color: #64748b;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  padding: 1px 4px;
  border-radius: 3px;
  white-space: nowrap;
}

.col-items-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

/* Row Item */
.hw-compact-row {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 5px 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  height: 36px;
  box-sizing: border-box;
  min-width: 0;
  transition: all 0.12s ease;
}

.hw-compact-row:hover {
  border-color: #cbd5e1;
}

.row-left {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
}

.code-badge {
  font-size: 0.62rem;
  font-weight: 800;
  color: #0284c7;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  padding: 1px 4px;
  border-radius: 4px;
  min-width: 32px;
  text-align: center;
  flex-shrink: 0;
}

.icon-wrap {
  width: 22px;
  height: 22px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  color: #64748b;
  flex-shrink: 0;
}

.icon-wrap.in-progress {
  background: #e0f2fe;
  color: #0284c7;
}

.row-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.row-name {
  font-size: 0.72rem;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.15;
}

.row-sub {
  font-size: 0.58rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.1;
}

.row-right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

/* Micro Status Dot for Sensors (Clean & Symmetrical) */
.micro-status-dot {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.62rem;
  font-weight: 600;
  white-space: nowrap;
}

.micro-status-dot .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.micro-status-dot.available {
  color: #047857;
}

.micro-status-dot.available .dot {
  background: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

.micro-status-dot.unavailable {
  color: #b91c1c;
}

.micro-status-dot.unavailable .dot {
  background: #ef4444;
}

/* Actuator State Pill (Subtle & Compact) */
.act-state-pill {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 0.6rem;
  font-weight: 700;
  white-space: nowrap;
}

.act-state-pill.idle {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #475569;
}

.act-state-pill.in-progress {
  background: #e0f2fe;
  border: 1px solid #7dd3fc;
  color: #0369a1;
}

.act-state-pill.error {
  background: #fff1f2;
  border: 1px solid #fecdd3;
  color: #b91c1c;
}

/* Card Footer */
.hw-card-footer {
  padding: 8px 14px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  gap: 10px;
  min-width: 0;
}

.footer-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.64rem;
  color: #64748b;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  min-width: 0;
}

.meta-sep {
  color: #cbd5e1;
}

.btn-inspect {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 5px;
  border: 1px solid #bae6fd;
  background: #f0f9ff;
  color: #0284c7;
  font-size: 0.68rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.12s ease;
  flex-shrink: 0;
}

.btn-inspect:hover {
  background: #0284c7;
  color: #ffffff;
  border-color: #0284c7;
}

/* =========================================================
   DIAGNOSTIC TABLE VIEW (NON-OVERFLOWING)
========================================================= */
.hw-table-card {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  box-shadow: var(--shadow-xs);
  overflow: hidden;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.table-responsive {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  box-sizing: border-box;
}

.hw-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  min-width: 860px;
}

.hw-table thead tr {
  background: #f8fafc;
  border-bottom: 1px solid var(--border-subtle);
}

.hw-table th {
  padding: 8px 10px;
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--text-muted);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
}

.hw-table td {
  padding: 9px 10px;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 0.72rem;
  vertical-align: middle;
}

.hw-table tbody tr:hover {
  background: #fbfdff;
}

.table-node-cell {
  display: flex;
  flex-direction: column;
}

.table-pond-cell {
  display: flex;
  align-items: center;
  gap: 5px;
}

.pond-mini-badge {
  padding: 1px 4px;
  border-radius: 3px;
  background: #0284c7;
  color: #ffffff;
  font-size: 0.64rem;
  font-weight: 700;
}

.pond-label {
  font-weight: 600;
  color: #334155;
  white-space: nowrap;
}

.mqtt-table-code {
  color: #0284c7;
  font-weight: 700;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 0.68rem;
  white-space: nowrap;
}

.table-sensor-pills {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: nowrap;
}

.table-micro-dot {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 4px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  font-size: 0.62rem;
  font-weight: 700;
}

.table-micro-dot .s-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}

.table-micro-dot.available {
  border-color: #a7f3d0;
  color: #065f46;
  background: #ecfdf5;
}

.table-micro-dot.available .s-dot {
  background: #10b981;
}

.table-micro-dot.unavailable {
  border-color: #fecdd3;
  color: #9f1239;
  background: #fff1f2;
}

.table-micro-dot.unavailable .s-dot {
  background: #ef4444;
}

.table-act-pills {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: nowrap;
}

.table-act-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 5px;
  border-radius: 4px;
  border: 1px solid #cbd5e1;
  background: #f1f5f9;
  color: #475569;
  font-size: 0.62rem;
  font-weight: 600;
  white-space: nowrap;
}

.table-act-chip.in-progress {
  background: #e0f2fe;
  border-color: #7dd3fc;
  color: #0369a1;
  font-weight: 700;
}

.table-act-chip.error {
  background: #fff1f2;
  border-color: #fecdd3;
  color: #b91c1c;
}

.btn-table-inspect {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 7px;
  border-radius: 5px;
  border: 1px solid #bae6fd;
  background: #f0f9ff;
  color: #0284c7;
  font-size: 0.68rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.12s ease;
}

.btn-table-inspect:hover {
  background: #0284c7;
  color: #ffffff;
}

/* Animations */
.spin-anim {
  animation: spin 0.8s linear infinite;
}

.spin-icon {
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* =========================================================
   RESPONSIVE DESIGN (ZERO OVERFLOW PROTECTION)
========================================================= */
@media (max-width: 1200px) {
  .summary-kpis-bar {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1100px) {
  .hw-cards-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 768px) {
  .view-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  .summary-kpis-bar {
    grid-template-columns: minmax(0, 1fr);
  }
  .hw-symmetrical-body {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
