<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { simulationEngine, nodes, clusterState } from './services/simulationEngine'
import { mqttService } from './services/mqttService'

import CompactNodeCard from './components/CompactNodeCard.vue'
import BrokerConfigModal from './components/BrokerConfigModal.vue'

const showConfigModal = ref(false)

onMounted(() => {
  simulationEngine.start()
})

onUnmounted(() => {
  simulationEngine.stop()
})
</script>

<template>
  <div class="min-vh-100 d-flex flex-column bg-light" style="background-color: #f8fafc;">
    <!-- Compact Top Navbar -->
    <nav class="navbar navbar-light bg-white border-bottom sticky-top px-3 py-2 shadow-sm">
      <div class="container-fluid px-0">
        <div class="d-flex align-items-center gap-2">
          <span class="badge bg-primary p-2 rounded-2 text-white">
            <i class="bi bi-cpu-fill fs-6"></i>
          </span>
          <div>
            <div class="fw-bold fs-6 text-dark lh-1">
              ESP32 Multi-Node Cluster Simulator
            </div>
            <div class="text-muted small" style="font-size: 0.72rem;">
              Smart Biofloc Edge Node Array (4 Nodes Concurrent)
            </div>
          </div>
        </div>

        <div class="d-flex align-items-center gap-2">
          <!-- Cluster Status Badges -->
          <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1 small font-monospace">
            <span class="led-indicator on-green me-1" style="width: 7px; height: 7px;"></span>4/4 Nodes Online
          </span>

          <span class="badge bg-light text-secondary border px-2 py-1 small font-monospace d-none d-sm-inline">
            <i class="bi bi-broadcast me-1 text-primary"></i>TX in: {{ clusterState.nextPublishCountdown }}s
          </span>

          <span class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 px-2 py-1 small d-none d-md-inline">
            <i class="bi bi-arrow-repeat me-1"></i>Cross-Tab Bus Synced
          </span>

          <!-- Quick Link to SAC Platform -->
          <a 
            href="http://localhost:5173" 
            target="_blank" 
            class="btn btn-outline-primary btn-sm rounded-pill px-3 py-1 font-semibold"
            style="font-size: 0.78rem;"
            title="Open Main SAC Dashboard at localhost:5173"
          >
            <i class="bi bi-box-arrow-up-right me-1"></i>Open SAC Dashboard
          </a>

          <!-- Config Button -->
          <button @click="showConfigModal = true" class="btn btn-light btn-sm border rounded-pill px-2 py-1 text-secondary" style="font-size: 0.78rem;" title="Settings">
            <i class="bi bi-gear-fill"></i>
          </button>
        </div>
      </div>
    </nav>

    <!-- Main Container Content (Compact 4-Column Grid) -->
    <div class="container-fluid px-3 px-lg-3 py-2 flex-grow-1">
      <!-- 1-Line Info Notice Banner -->
      <div class="d-flex justify-content-between align-items-center bg-white border rounded-3 px-3 py-1 mb-2 shadow-sm" style="font-size: 0.74rem;">
        <div class="d-flex align-items-center gap-2 text-secondary text-truncate">
          <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-0.5 rounded-pill fw-semibold" style="font-size: 0.68rem;">
            <i class="bi bi-broadcast-pin me-1"></i>Realtime Edge Node
          </span>
          <span class="text-truncate">
            All actuators are orchestrated remotely from central SAC Dashboard (<a href="http://localhost:5173" target="_blank" class="fw-semibold text-primary">localhost:5173</a>). Trigger feeder/aerator on dashboard to watch live execution!
          </span>
        </div>
        <div class="d-flex align-items-center gap-1 ms-2 font-monospace text-muted" style="font-size: 0.65rem;">
          <span class="badge bg-light text-muted border">Topic: esp32/+/telemetry</span>
        </div>
      </div>

      <!-- 4 Compact Nodes Grid (Fits in 1 Full Page) -->
      <div class="row g-2 g-lg-2">
        <div v-for="node in nodes" :key="node.id" class="col-12 col-sm-6 col-lg-3">
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
