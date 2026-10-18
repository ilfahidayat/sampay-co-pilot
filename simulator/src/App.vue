<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { simulationEngine, nodes, clusterState } from './services/simulationEngine'
import { mqttService } from './services/mqttService'

import CompactNodeCard from './components/CompactNodeCard.vue'
import BrokerConfigModal from './components/BrokerConfigModal.vue'

const showConfigModal = ref(false)
const globalTxFlashing = ref(false)

onMounted(() => {
  simulationEngine.start()
})

onUnmounted(() => {
  simulationEngine.stop()
})

// Format countdown as HH:MM:SS or MM:SS or Xs
const formattedCountdown = computed(() => {
  const totalSecs = clusterState.nextPublishCountdown
  if (clusterState.scheduleMode === 'clock_6h' || clusterState.publishInterval === 21600) {
    const hours = Math.floor(totalSecs / 3600)
    const mins = Math.floor((totalSecs % 3600) / 60)
    const secs = totalSecs % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  if (totalSecs < 60) {
    return `${totalSecs}s`
  }
  const mins = Math.floor(totalSecs / 60)
  const secs = totalSecs % 60
  return `${mins}m ${secs.toString().padStart(2, '0')}s`
})

// Count online nodes
const poweredNodesCount = computed(() => {
  return nodes.filter(n => n.isPowered).length
})

// Count nodes with adjusted / pending unsent values
const pendingNodesCount = computed(() => {
  return nodes.filter(n => n.hasPendingChanges).length
})

const onTriggerAllManual = () => {
  globalTxFlashing.value = true
  simulationEngine.triggerManualPublish()
  setTimeout(() => {
    globalTxFlashing.value = false
  }, 1000)
}
</script>

<template>
  <div class="min-vh-100 d-flex flex-column" style="background-color: #f1f5f9; color: #0f172a;">
    <!-- Compact Top Navbar -->
    <nav class="navbar navbar-light bg-white border-bottom px-3 py-2 shadow-sm sticky-top">
      <div class="container-fluid px-0 d-flex flex-wrap align-items-center justify-content-between gap-2">
        <!-- Brand / Identity & Online Status -->
        <div class="d-flex align-items-center flex-wrap gap-2">
          <div class="d-flex align-items-center gap-2">
            <span class="badge bg-dark p-2 rounded-2 text-white flex-shrink-0">
              <i class="bi bi-hdd-network-fill fs-6"></i>
            </span>
            <div>
              <div class="fw-bold text-dark lh-1 font-monospace" style="font-size: 0.92rem; white-space: nowrap;">
                SAC AQUACULTURE • SIMULATOR
              </div>
              <div class="text-secondary small font-monospace d-none d-sm-block mt-0.5" style="font-size: 0.7rem; white-space: nowrap;">
                ESP32-S3 Array • 4 Channels (sac/pond001 — pond004)
              </div>
            </div>
          </div>

          <!-- Active Nodes Badge directly beside brand -->
          <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-30 px-2 py-1 small font-monospace d-inline-flex align-items-center gap-1.5" style="font-size: 0.72rem; white-space: nowrap;">
            <span class="status-dot-green"></span>
            <span>{{ poweredNodesCount }}/4 ONLINE</span>
          </span>

          <!-- Pending Changes Indicator (if any) -->
          <span v-if="pendingNodesCount > 0" class="badge bg-warning bg-opacity-15 text-warning border border-warning border-opacity-40 px-2 py-1 small font-monospace d-inline-flex align-items-center gap-1" style="font-size: 0.72rem; white-space: nowrap;" title="Nodes with adjusted values ready to transmit">
            <i class="bi bi-pencil-fill"></i>
            <span>{{ pendingNodesCount }} ADJUSTED</span>
          </span>
        </div>

        <!-- Controls Toolbar -->
        <div class="d-flex align-items-center flex-wrap gap-2">
          <!-- Auto-TX Group (Button + Interval Select) -->
          <div class="input-group input-group-sm" style="width: auto;">
            <button 
              id="btn-toggle-autotx"
              @click="simulationEngine.toggleAutoPublish()"
              class="btn px-2.5 py-1 font-monospace d-flex align-items-center gap-1.5 shadow-sm border"
              :class="clusterState.autoPublish ? 'btn-outline-warning text-dark bg-warning bg-opacity-10' : 'btn-outline-secondary bg-white text-secondary'"
              :title="clusterState.autoPublish ? 'Auto-TX Active • Click to disable' : 'Auto-TX Inactive • Click to enable'"
              style="font-size: 0.74rem; white-space: nowrap;"
            >
              <i :class="clusterState.autoPublish ? 'bi bi-broadcast text-warning' : 'bi bi-slash-circle text-danger'"></i>
              <span>{{ clusterState.autoPublish ? `Auto-TX: ${formattedCountdown}` : 'Auto-TX: OFF' }}</span>
            </button>

            <select 
              v-if="clusterState.autoPublish"
              class="form-select form-select-sm font-monospace border-warning bg-white text-dark py-1 ps-2 pe-4"
              style="font-size: 0.72rem; width: auto;"
              :value="clusterState.scheduleMode === 'clock_6h' ? 'clock_6h' : clusterState.publishInterval"
              @change="simulationEngine.setPublishInterval($event.target.value)"
              title="Select telemetry transmission interval"
            >
              <option value="clock_6h">6-Hour Schedule</option>
              <option value="10">10s Demo</option>
              <option value="30">30s Demo</option>
              <option value="60">1 Minute</option>
              <option value="300">5 Minutes</option>
              <option value="3600">1 Hour</option>
            </select>
          </div>

          <!-- Manual Global Trigger Button -->
          <button 
            id="btn-transmit-all"
            @click="onTriggerAllManual" 
            class="btn btn-sm btn-primary px-2.5 py-1 font-monospace fw-semibold d-flex align-items-center gap-1.5 shadow-sm"
            style="font-size: 0.74rem; white-space: nowrap;"
            title="Transmit telemetry packets for all active nodes now"
          >
            <i class="bi bi-send-fill"></i>
            <span>{{ globalTxFlashing ? 'TRANSMITTING...' : 'Transmit All' }}</span>
          </button>

          <!-- Quick Link to SAC Dashboard -->
          <a 
            href="http://localhost:5175" 
            target="_blank" 
            class="btn btn-outline-dark btn-sm px-2.5 py-1 font-monospace fw-semibold d-flex align-items-center gap-1"
            style="font-size: 0.74rem; white-space: nowrap;"
            title="Open Main SAC Dashboard at localhost:5175"
          >
            <i class="bi bi-box-arrow-up-right"></i>
            <span class="d-none d-md-inline">SAC Dashboard</span>
            <span class="d-inline d-md-none">SAC</span>
          </a>

          <!-- MQTT Broker Status & Config Button -->
          <button 
            @click="showConfigModal = true" 
            class="btn btn-sm border px-2.5 py-1 font-monospace d-flex align-items-center gap-1.5 shadow-sm"
            :class="mqttService.isConnected ? 'btn-outline-success bg-success bg-opacity-10 text-success' : 'btn-outline-secondary bg-light text-secondary'"
            style="font-size: 0.74rem; white-space: nowrap;" 
            title="Click to configure MQTT Broker"
          >
            <span :class="mqttService.isConnected ? 'status-dot-green' : 'status-dot-gray'"></span>
            <span class="fw-bold">{{ mqttService.isConnected ? 'MQTT' : 'MQTT...' }}</span>
            <i class="bi bi-gear-fill"></i>
          </button>
        </div>
      </div>
    </nav>

    <!-- Main Container Content (Natural Card Height, No Forced Bottom Stretch, Fits on 1 Screen) -->
    <div class="container-fluid px-3 px-lg-4 py-3 flex-grow-1">
      <div class="row g-3">
        <div v-for="node in nodes" :key="node.id" class="col-12 col-sm-6 col-xl-3">
          <CompactNodeCard :node="node" />
        </div>
      </div>
    </div>

    <!-- Broker Configuration Modal -->
    <BrokerConfigModal 
      :show="showConfigModal" 
      @close="showConfigModal = false" 
    />
  </div>
</template>
