<script setup>
import { computed } from 'vue'

const props = defineProps({
  node: {
    type: Object,
    required: true
  }
})

const formattedUptime = computed(() => {
  const s = props.node.uptimeSeconds
  const hrs = Math.floor(s / 3600)
  const mins = Math.floor((s % 3600) / 60)
  const secs = s % 60
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
})

const pondTheme = computed(() => {
  switch (props.node.pondId) {
    case 'K01':
      return {
        accent: 'accent-k01',
        badge: 'border',
        badgeStyle: 'background-color: #dbeafe; color: #1d4ed8; border-color: #bfdbfe !important;'
      }
    case 'K02':
      return {
        accent: 'accent-k02',
        badge: 'border',
        badgeStyle: 'background-color: #d1fae5; color: #047857; border-color: #a7f3d0 !important;'
      }
    case 'K03':
      return {
        accent: 'accent-k03',
        badge: 'border',
        badgeStyle: 'background-color: #ede9fe; color: #6d28d9; border-color: #ddd6fe !important;'
      }
    default:
      return {
        accent: 'accent-k04',
        badge: 'border',
        badgeStyle: 'background-color: #fef3c7; color: #b45309; border-color: #fde68a !important;'
      }
  }
})

const doStatus = computed(() => {
  if (props.node.dissolvedOxygen >= 5.0) return { text: 'Optimal', class: 'bg-success text-white' }
  if (props.node.dissolvedOxygen >= 3.5) return { text: 'Moderate', class: 'bg-warning text-dark' }
  return { text: 'Hypoxia', class: 'bg-danger text-white' }
})

const ammoniaStatus = computed(() => {
  if (props.node.ammonia < 0.25) return { text: 'Safe', class: 'bg-success text-white' }
  if (props.node.ammonia < 0.8) return { text: 'Warning', class: 'bg-warning text-dark' }
  return { text: 'Critical', class: 'bg-danger text-white' }
})

const phStatus = computed(() => {
  if (props.node.ph < 6.8) return { text: 'Acidic', class: 'bg-warning text-dark' }
  if (props.node.ph > 8.2) return { text: 'Alkaline', class: 'bg-danger text-white' }
  return { text: 'Optimal', class: 'bg-success text-white' }
})
</script>

<template>
  <div class="card card-iot h-100 shadow-sm">
    <!-- Top Accent Bar per Pond -->
    <div class="card-accent-bar" :class="pondTheme.accent"></div>

    <!-- Node Header -->
    <div class="card-header bg-white py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
      <div>
        <div class="d-flex align-items-center gap-1 mb-1">
          <span class="pulse-indicator-green me-1" title="Node Online"></span>
          <span class="badge rounded-pill fw-bold" :class="pondTheme.badge" :style="pondTheme.badgeStyle" style="font-size: 0.72rem;">
            {{ node.pondId }}
          </span>
          <span class="text-dark fw-bold font-monospace small ms-1">{{ node.id }}</span>
        </div>
        <div class="text-muted text-truncate fw-medium" style="font-size: 0.72rem; max-width: 170px;">
          {{ node.name }}
        </div>
      </div>

      <!-- Quick Status Chips (Uptime, Signal, Battery) -->
      <div class="text-end" style="font-size: 0.68rem;">
        <div class="text-secondary font-monospace fw-semibold mb-1">
          <i class="bi bi-clock-history me-1 text-primary"></i>{{ formattedUptime }}
        </div>
        <div class="d-flex align-items-center justify-content-end gap-1 text-muted font-monospace">
          <span class="badge bg-light text-secondary border px-1 py-0" style="font-size: 0.62rem;" title="WiFi Signal">
            <i class="bi bi-wifi me-1 text-success"></i>{{ node.wifiRssi }}dBm
          </span>
          <span class="badge bg-light text-secondary border px-1 py-0" style="font-size: 0.62rem;" title="Battery">
            <i class="bi bi-battery-charging me-1 text-warning"></i>{{ node.batteryVoltage }}V
          </span>
        </div>
      </div>
    </div>

    <!-- Card Body -->
    <div class="card-body p-2 d-flex flex-column justify-content-between">
      <!-- 1. Live Telemetry Sensors (Lively Pastel 2x2 Grid) -->
      <div class="row g-1 mb-2">
        <!-- DO -->
        <div class="col-6">
          <div class="sensor-tile sensor-tile-do p-2 rounded-3 h-100">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="sensor-label"><i class="bi bi-droplet-half me-1 text-info"></i>DO</span>
              <span :class="['badge rounded-pill', doStatus.class]" style="font-size: 0.6rem; padding: 2px 6px;">
                {{ doStatus.text }}
              </span>
            </div>
            <div class="d-flex align-items-baseline">
              <span class="fs-5 fw-bold text-dark font-monospace lh-1">
                {{ node.dissolvedOxygen.toFixed(2) }}
              </span>
              <span class="text-muted ms-1" style="font-size: 0.68rem;">mg/L</span>
            </div>
          </div>
        </div>

        <!-- Ammonia TAN -->
        <div class="col-6">
          <div class="sensor-tile sensor-tile-ammonia p-2 rounded-3 h-100">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="sensor-label"><i class="bi bi-radioactive me-1 text-warning"></i>TAN</span>
              <span :class="['badge rounded-pill', ammoniaStatus.class]" style="font-size: 0.6rem; padding: 2px 6px;">
                {{ ammoniaStatus.text }}
              </span>
            </div>
            <div class="d-flex align-items-baseline">
              <span class="fs-5 fw-bold font-monospace lh-1" :class="node.ammonia > 0.5 ? 'text-danger' : 'text-dark'">
                {{ node.ammonia.toFixed(3) }}
              </span>
              <span class="text-muted ms-1" style="font-size: 0.68rem;">mg/L</span>
            </div>
          </div>
        </div>

        <!-- pH & Temp -->
        <div class="col-6">
          <div class="sensor-tile sensor-tile-ph p-2 rounded-3 h-100">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="sensor-label"><i class="bi bi-thermometer-half me-1 text-success"></i>pH / Temp</span>
              <span :class="['badge rounded-pill', phStatus.class]" style="font-size: 0.6rem; padding: 2px 6px;">
                pH {{ node.ph.toFixed(1) }}
              </span>
            </div>
            <div class="fw-bold text-dark font-monospace lh-1 d-flex align-items-baseline" style="font-size: 0.92rem;">
              <span>{{ node.ph.toFixed(2) }}</span>
              <span class="text-muted fw-normal ms-1" style="font-size: 0.7rem;">| {{ node.temperature.toFixed(1) }}°C</span>
            </div>
          </div>
        </div>

        <!-- TSS Sludge -->
        <div class="col-6">
          <div class="sensor-tile sensor-tile-tss p-2 rounded-3 h-100">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="sensor-label"><i class="bi bi-layers-half me-1 text-primary"></i>TSS</span>
              <span class="badge bg-white text-secondary rounded-pill border" style="font-size: 0.6rem; padding: 2px 6px;">
                {{ node.mudSolids > 200 ? 'Turbid' : 'Clear' }}
              </span>
            </div>
            <div class="d-flex align-items-baseline">
              <span class="fs-5 fw-bold text-dark font-monospace lh-1">
                {{ node.mudSolids.toFixed(0) }}
              </span>
              <span class="text-muted ms-1" style="font-size: 0.68rem;">mg/L</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. Actuator Matrix (Clean Idle vs Live Progress) -->
      <div class="border rounded-3 p-2 bg-white">
        <div class="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom">
          <span class="fw-bold text-secondary text-uppercase" style="font-size: 0.68rem; letter-spacing: 0.5px;">
            <i class="bi bi-cpu me-1 text-primary"></i>Actuators
          </span>
          <span class="badge bg-light text-muted border font-monospace" style="font-size: 0.62rem;">
            Remote Control
          </span>
        </div>

        <!-- Actuator 1: Aerator -->
        <div class="actuator-row mb-1 p-2 rounded-2" :class="node.aerator.state === 'running' ? 'actuator-active-cyan' : 'bg-light-subtle'">
          <div class="d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center gap-2">
              <i :class="['bi bi-fan fs-6', node.aerator.state === 'running' ? 'text-info animate-spin-fast' : 'text-muted']"></i>
              <span class="fw-medium text-dark" style="font-size: 0.74rem;">Aerator</span>
            </div>
            <div>
              <span v-if="node.aerator.state === 'running'" class="badge bg-info text-white font-monospace" style="font-size: 0.66rem;">
                Running ({{ node.aerator.powerPercent }}%)
              </span>
              <span v-else class="badge bg-light text-muted border font-monospace" style="font-size: 0.66rem;">
                Idle
              </span>
            </div>
          </div>
        </div>

        <!-- Actuator 2: Feeder -->
        <div class="actuator-row mb-1 p-2 rounded-2" :class="node.feeder.state === 'running' ? 'actuator-active-green' : 'bg-light-subtle'">
          <div class="d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center gap-2">
              <i :class="['bi bi-basket fs-6', node.feeder.state === 'running' ? 'text-success animate-bounce' : 'text-muted']"></i>
              <span class="fw-medium text-dark" style="font-size: 0.74rem;">Feeder</span>
            </div>
            <div>
              <span v-if="node.feeder.state === 'running'" class="badge bg-success text-white font-monospace animate-pulse" style="font-size: 0.66rem;">
                Dispensing {{ node.feeder.dose }}g ({{ Math.round(node.feeder.progress) }}%)
              </span>
              <span v-else class="badge bg-light text-muted border font-monospace" style="font-size: 0.66rem;">
                Idle
              </span>
            </div>
          </div>
          <!-- Progress bar only when running -->
          <div v-if="node.feeder.state === 'running'" class="progress mt-1" style="height: 4px;">
            <div class="progress-bar progress-bar-striped progress-bar-animated bg-success" :style="{ width: `${node.feeder.progress}%` }"></div>
          </div>
        </div>

        <!-- Actuator 3: Molasses -->
        <div class="actuator-row mb-1 p-2 rounded-2" :class="node.molassesPump.state === 'running' ? 'actuator-active-amber' : 'bg-light-subtle'">
          <div class="d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center gap-2">
              <i :class="['bi bi-funnel fs-6', node.molassesPump.state === 'running' ? 'text-warning animate-bounce' : 'text-muted']"></i>
              <span class="fw-medium text-dark" style="font-size: 0.74rem;">Molasses</span>
            </div>
            <div>
              <span v-if="node.molassesPump.state === 'running'" class="badge bg-warning text-dark font-monospace animate-pulse" style="font-size: 0.66rem;">
                Dosing {{ node.molassesPump.dose }}ml ({{ Math.round(node.molassesPump.progress) }}%)
              </span>
              <span v-else class="badge bg-light text-muted border font-monospace" style="font-size: 0.66rem;">
                Idle
              </span>
            </div>
          </div>
          <!-- Progress bar only when running -->
          <div v-if="node.molassesPump.state === 'running'" class="progress mt-1" style="height: 4px;">
            <div class="progress-bar progress-bar-striped progress-bar-animated bg-warning" :style="{ width: `${node.molassesPump.progress}%` }"></div>
          </div>
        </div>

        <!-- Actuator 4: Water Siphon -->
        <div class="actuator-row p-2 rounded-2" :class="node.waterChange.state !== 'idle' ? 'actuator-active-blue' : 'bg-light-subtle'">
          <div class="d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center gap-2">
              <i :class="['bi bi-arrow-repeat fs-6', node.waterChange.state !== 'idle' ? 'text-primary animate-spin-fast' : 'text-muted']"></i>
              <span class="fw-medium text-dark" style="font-size: 0.74rem;">Water Siphon</span>
            </div>
            <div>
              <span v-if="node.waterChange.state !== 'idle'" class="badge bg-primary text-white font-monospace animate-pulse" style="font-size: 0.66rem;">
                {{ node.waterChange.phase }} ({{ Math.round(node.waterChange.progress) }}%)
              </span>
              <span v-else class="badge bg-light text-muted border font-monospace" style="font-size: 0.66rem;">
                Idle
              </span>
            </div>
          </div>
          <!-- Progress bar only when running -->
          <div v-if="node.waterChange.state !== 'idle'" class="progress mt-1" style="height: 4px;">
            <div class="progress-bar progress-bar-striped progress-bar-animated bg-primary" :style="{ width: `${node.waterChange.progress}%` }"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
