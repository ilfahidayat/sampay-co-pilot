<script setup>
import { ref, computed } from 'vue'
import { simulationEngine } from '../services/simulationEngine'
import AdjustSensorModal from './AdjustSensorModal.vue'

const props = defineProps({
  node: {
    type: Object,
    required: true
  }
})

const isUpdating = ref(false)
const showAdjustModal = ref(false)

const formattedTime = computed(() => {
  const now = new Date()
  return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
})

const onTogglePower = () => {
  simulationEngine.toggleNodePower(props.node.id)
}

const onSelectCondition = (condition) => {
  if (!props.node.isPowered) return
  simulationEngine.setNodeCondition(props.node.id, condition)
}

const onManualUpdate = () => {
  if (!props.node.isPowered) return
  isUpdating.value = true
  simulationEngine.triggerManualPublish(props.node.id)
  setTimeout(() => {
    isUpdating.value = false
  }, 750)
}

const triggerFeed = () => {
  if (!props.node.isPowered) return
  simulationEngine.triggerFeederAction(props.node.id, 50)
}

const triggerMolasses = () => {
  if (!props.node.isPowered) return
  simulationEngine.triggerMolassesAction(props.node.id, 100)
}

const triggerSiphon = () => {
  if (!props.node.isPowered) return
  simulationEngine.triggerSiphonAction(props.node.id, 200)
}
</script>

<template>
  <div class="mydevices-card" :class="'border-' + node.pondId.toLowerCase()">
    <!-- 1. Header: Microcontroller Icon (No Background) Aligned with Title, Power Button on Right -->
    <div class="d-flex align-items-center justify-content-between gap-2 mb-1">
      <!-- Icon + Title Aligned Horizontally with padding -->
      <div class="d-flex align-items-center min-w-0 flex-grow-1">
        <i 
          class="bi bi-cpu-fill flex-shrink-0 me-2" 
          :class="node.isPowered ? 'text-primary' : 'text-muted'"
          style="font-size: 1.28rem; line-height: 1;"
          title="Edge Microcontroller Node (ESP32-S3)"
        ></i>
        <span class="fw-bold text-dark lh-1 text-truncate" style="font-size: 1.05rem;">
          {{ node.name }}
        </span>
      </div>

      <!-- Top-Right Power Button Toggle -->
      <button 
        :id="'btn-power-' + node.pondId.toLowerCase()"
        @click="onTogglePower" 
        class="btn-power-toggle flex-shrink-0" 
        :class="node.isPowered ? 'is-on' : 'is-off'" 
        :title="node.isPowered ? 'Click to power off hardware node' : 'Click to power on hardware node'"
      >
        <i class="bi bi-power"></i>
        <span>{{ node.isPowered ? 'PWR ON' : 'PWR OFF' }}</span>
      </button>
    </div>

    <!-- Metadata Row: Placed underneath BOTH the icon and title -->
    <div class="d-flex align-items-center justify-content-between font-monospace text-secondary mb-3" style="font-size: 0.72rem;">
      <div class="text-truncate">
        {{ node.id }} <span class="text-muted ms-1">• {{ node.pondId }}</span>
      </div>
      <div class="text-muted text-truncate" style="font-size: 0.67rem;">
        MQTT: {{ node.id }}/telemetry
      </div>
    </div>

    <!-- 2. Simulation Condition Options (OK, WARN, DANGER, TUNE) + Manual Transmit Button -->
    <div class="d-flex align-items-center justify-content-between gap-1.5 mb-3">
      <!-- 4-State Condition & Tuning Selector Group -->
      <div class="d-flex align-items-center gap-1 flex-grow-1 min-w-0">
        <div class="condition-selector-group flex-grow-1">
          <button 
            :id="'btn-cond-ok-' + node.pondId.toLowerCase()"
            @click="onSelectCondition('ok')" 
            :disabled="!node.isPowered"
            class="condition-btn"
            :class="{ 'active-ok': node.simulationCondition === 'ok' }"
            title="Set optimal & healthy water quality (Click Send Data to transmit)"
          >
            <i class="bi bi-check-circle-fill"></i>
            <span>OK</span>
          </button>
          <button 
            :id="'btn-cond-warn-' + node.pondId.toLowerCase()"
            @click="onSelectCondition('warning')" 
            :disabled="!node.isPowered"
            class="condition-btn"
            :class="{ 'active-warning': node.simulationCondition === 'warning' }"
            title="Set warning condition (low DO, elevated ammonia)"
          >
            <i class="bi bi-exclamation-triangle-fill"></i>
            <span>WARN</span>
          </button>
          <button 
            :id="'btn-cond-danger-' + node.pondId.toLowerCase()"
            @click="onSelectCondition('danger')" 
            :disabled="!node.isPowered"
            class="condition-btn"
            :class="{ 'active-danger': node.simulationCondition === 'danger' }"
            title="Set critical / danger condition (severe hypoxia & toxic ammonia)"
          >
            <i class="bi bi-radioactive"></i>
            <span>DANGER</span>
          </button>
          <button 
            :id="'btn-cond-tune-' + node.pondId.toLowerCase()"
            @click="showAdjustModal = true" 
            :disabled="!node.isPowered"
            class="condition-btn"
            :class="{ 'active-custom': node.simulationCondition === 'custom' }"
            title="Open fine-tuning sliders for DO, pH, Temp, TAN & Biofloc"
          >
            <i class="bi bi-sliders"></i>
            <span>TUNE</span>
          </button>
        </div>
      </div>

      <!-- Manual Transmit Button -->
      <button 
        :id="'btn-send-' + node.pondId.toLowerCase()"
        @click="onManualUpdate" 
        :disabled="!node.isPowered"
        class="btn-manual-tx flex-shrink-0"
        :class="{ 'btn-pending-tx': node.hasPendingChanges }"
        :title="node.hasPendingChanges ? 'Pending adjusted data • Click to transmit to MQTT' : 'Transmit telemetry packet for this node manually now'"
      >
        <i :class="isUpdating ? 'bi bi-arrow-repeat animate-spin-fast' : 'bi bi-send-fill'"></i>
        <span>{{ isUpdating ? 'SENDING...' : (node.hasPendingChanges ? 'Send Data •' : 'Send Data') }}</span>
      </button>
    </div>

    <!-- 3. Metric Tiles Grid: 3 Columns x 3 Rows (Sensors & Action Actuators) -->
    <div class="row g-2 mb-3">
      <!-- Row 1: DO, pH, Temp -->
      <div class="col-4">
        <div 
          class="metric-tile" 
          @click="node.isPowered && (showAdjustModal = true)"
          :style="node.isPowered ? 'cursor: pointer;' : ''"
          title="Click to adjust DO value"
        >
          <div class="metric-tile-label d-flex justify-content-between">
            <span>DO (Oxygen):</span>
            <i v-if="node.isPowered" class="bi bi-pencil-fill text-muted" style="font-size: 0.6rem;"></i>
          </div>
          <div class="metric-tile-value" :class="{ 'text-danger': node.isPowered && node.dissolvedOxygen < 3.5, 'text-warning': node.isPowered && node.dissolvedOxygen >= 3.5 && node.dissolvedOxygen < 5.0 }">
            <span v-if="node.isPowered">{{ node.dissolvedOxygen.toFixed(2) }}<span class="small fw-normal text-muted ms-1" style="font-size: 0.68rem;">mg/L</span></span>
            <span v-else class="text-muted">--</span>
          </div>
        </div>
      </div>

      <div class="col-4">
        <div 
          class="metric-tile" 
          @click="node.isPowered && (showAdjustModal = true)"
          :style="node.isPowered ? 'cursor: pointer;' : ''"
          title="Click to adjust pH value"
        >
          <div class="metric-tile-label d-flex justify-content-between">
            <span>pH Level:</span>
            <i v-if="node.isPowered" class="bi bi-pencil-fill text-muted" style="font-size: 0.6rem;"></i>
          </div>
          <div class="metric-tile-value" :class="{ 'text-danger': node.isPowered && (node.ph < 6.5 || node.ph > 8.5) }">
            <span v-if="node.isPowered">{{ node.ph.toFixed(2) }}</span>
            <span v-else class="text-muted">--</span>
          </div>
        </div>
      </div>

      <div class="col-4">
        <div 
          class="metric-tile" 
          @click="node.isPowered && (showAdjustModal = true)"
          :style="node.isPowered ? 'cursor: pointer;' : ''"
          title="Click to adjust Temperature value"
        >
          <div class="metric-tile-label d-flex justify-content-between">
            <span>Water Temp:</span>
            <i v-if="node.isPowered" class="bi bi-pencil-fill text-muted" style="font-size: 0.6rem;"></i>
          </div>
          <div class="metric-tile-value" :class="{ 'text-danger': node.isPowered && node.temperature > 32.0, 'text-warning': node.isPowered && node.temperature > 30.0 }">
            <span v-if="node.isPowered">{{ node.temperature.toFixed(1) }}<span class="small fw-normal text-muted ms-1" style="font-size: 0.68rem;">°C</span></span>
            <span v-else class="text-muted">--</span>
          </div>
        </div>
      </div>

      <!-- Row 2: Ammonia TAN, Floc Density, Aerator (TSS Sludge removed) -->
      <div class="col-4">
        <div 
          class="metric-tile" 
          @click="node.isPowered && (showAdjustModal = true)"
          :style="node.isPowered ? 'cursor: pointer;' : ''"
          title="Click to adjust Ammonia value"
        >
          <div class="metric-tile-label d-flex justify-content-between">
            <span>Ammonia TAN:</span>
            <i v-if="node.isPowered" class="bi bi-pencil-fill text-muted" style="font-size: 0.6rem;"></i>
          </div>
          <div class="metric-tile-value" :class="{ 'text-danger': node.isPowered && node.ammonia > 0.8, 'text-warning': node.isPowered && node.ammonia >= 0.4 && node.ammonia <= 0.8 }">
            <span v-if="node.isPowered">{{ node.ammonia.toFixed(3) }}<span class="small fw-normal text-muted ms-1" style="font-size: 0.65rem;">ppm</span></span>
            <span v-else class="text-muted">--</span>
          </div>
        </div>
      </div>

      <div class="col-4">
        <div 
          class="metric-tile" 
          @click="node.isPowered && (showAdjustModal = true)"
          :style="node.isPowered ? 'cursor: pointer;' : ''"
          title="Click to adjust Biofloc density"
        >
          <div class="metric-tile-label d-flex justify-content-between">
            <span>Floc Density:</span>
            <i v-if="node.isPowered" class="bi bi-pencil-fill text-muted" style="font-size: 0.6rem;"></i>
          </div>
          <div class="metric-tile-value">
            <span v-if="node.isPowered">{{ (node.flocDensity || (node.mudSolids / 6.8)).toFixed(1) }}<span class="small fw-normal text-muted ms-1" style="font-size: 0.65rem;">mL/L</span></span>
            <span v-else class="text-muted">--</span>
          </div>
        </div>
      </div>

      <div class="col-4">
        <div class="metric-tile">
          <div class="metric-tile-label">Aerator Speed:</div>
          <div class="metric-tile-value">
            <div v-if="node.isPowered" class="d-flex align-items-center gap-1.5" :class="node.aerator.state === 'running' ? 'text-primary' : 'text-muted'">
              <i v-if="node.aerator.state === 'running'" class="bi bi-fan fs-6 animate-spin"></i>
              <span>{{ node.aerator.state === 'running' ? node.aerator.powerPercent + '%' : 'IDLE' }}</span>
            </div>
            <span v-else class="text-muted">OFF</span>
          </div>
        </div>
      </div>

      <!-- Row 3: Action Actuators (Auto-Feeder, Molasses Dosing, Siphon with action animations) -->
      <!-- Action 1: Auto-Feeder -->
      <div class="col-4">
        <div class="metric-tile" :class="{ 'actuator-active-feeder': node.isPowered && node.feeder.state === 'running' }">
          <div class="d-flex justify-content-between align-items-center">
            <div class="metric-tile-label">Auto-Feeder:</div>
            <button 
              v-if="node.isPowered && node.feeder.state !== 'running'"
              @click.stop="triggerFeed" 
              class="btn-mini-act" 
              title="Manual feed test 50g (preview animation)"
            >
              +Feed
            </button>
          </div>
          
          <div class="metric-tile-value mt-0.5">
            <!-- Active Dispensing: Display executed dose and progress -->
            <div v-if="node.isPowered && node.feeder.state === 'running'" class="w-100">
              <div class="d-flex align-items-center justify-content-between text-success" style="font-size: 0.74rem;">
                <span class="d-flex align-items-center gap-1 fw-bold text-truncate">
                  <i class="bi bi-box-seam-fill animate-feed-running flex-shrink-0"></i>
                  <span>FEEDING: {{ node.feeder.dose || 50 }}g</span>
                </span>
                <span class="font-monospace small ms-1 flex-shrink-0">{{ node.feeder.progress }}%</span>
              </div>
              <div class="progress progress-mini mt-1">
                <div class="progress-bar bg-success progress-bar-animated-fast" :style="{ width: `${node.feeder.progress}%` }"></div>
              </div>
            </div>
            
            <!-- Idle State: Clean status only (no cumulative value) -->
            <div v-else-if="node.isPowered" class="d-flex align-items-center">
              <span class="text-secondary font-monospace fw-bold" style="font-size: 0.85rem;">IDLE</span>
            </div>
            <span v-else class="text-muted font-monospace" style="font-size: 0.85rem;">OFF</span>
          </div>
        </div>
      </div>

      <!-- Action 2: Molasses Dosing -->
      <div class="col-4">
        <div class="metric-tile" :class="{ 'actuator-active-molasses': node.isPowered && node.molassesPump.state === 'running' }">
          <div class="d-flex justify-content-between align-items-center">
            <div class="metric-tile-label">Molasses Dosing:</div>
            <button 
              v-if="node.isPowered && node.molassesPump.state !== 'running'"
              @click.stop="triggerMolasses" 
              class="btn-mini-act" 
              title="Manual molasses test 100ml (preview animation)"
            >
              +Molasses
            </button>
          </div>
          
          <div class="metric-tile-value mt-0.5">
            <!-- Active Dosing: Display executed dose and progress -->
            <div v-if="node.isPowered && node.molassesPump.state === 'running'" class="w-100">
              <div class="d-flex align-items-center justify-content-between text-warning" style="font-size: 0.74rem;">
                <span class="d-flex align-items-center gap-1 fw-bold text-truncate">
                  <i class="bi bi-droplet-fill animate-molasses-running flex-shrink-0"></i>
                  <span>DOSING: {{ node.molassesPump.dose || 100 }}ml</span>
                </span>
                <span class="font-monospace small ms-1 flex-shrink-0">{{ node.molassesPump.progress }}%</span>
              </div>
              <div class="progress progress-mini mt-1">
                <div class="progress-bar bg-warning progress-bar-animated-fast" :style="{ width: `${node.molassesPump.progress}%` }"></div>
              </div>
            </div>
            
            <!-- Idle State: Clean status only (no cumulative value) -->
            <div v-else-if="node.isPowered" class="d-flex align-items-center">
              <span class="text-secondary font-monospace fw-bold" style="font-size: 0.85rem;">IDLE</span>
            </div>
            <span v-else class="text-muted font-monospace" style="font-size: 0.85rem;">OFF</span>
          </div>
        </div>
      </div>

      <!-- Action 3: Siphon / Sludge Drain -->
      <div class="col-4">
        <div class="metric-tile" :class="{ 'actuator-active-siphon': node.isPowered && node.waterChange.state !== 'idle' }">
          <div class="d-flex justify-content-between align-items-center">
            <div class="metric-tile-label">Siphon / Drain:</div>
            <button 
              v-if="node.isPowered && node.waterChange.state === 'idle'"
              @click.stop="triggerSiphon" 
              class="btn-mini-act" 
              title="Manual siphon sludge drain test 200L (preview animation)"
            >
              +Siphon
            </button>
          </div>
          
          <div class="metric-tile-value mt-0.5">
            <!-- Active Siphon: Display executed volume and phase -->
            <div v-if="node.isPowered && node.waterChange.state !== 'idle'" class="w-100">
              <div class="d-flex align-items-center justify-content-between text-info" style="font-size: 0.74rem;">
                <span class="d-flex align-items-center gap-1 fw-bold text-truncate">
                  <i class="bi bi-water animate-siphon-running flex-shrink-0"></i>
                  <span>{{ node.waterChange.state === 'refilling' ? 'REFILLING' : 'DRAINING' }}: {{ node.waterChange.volume || 200 }}L</span>
                </span>
                <span class="font-monospace small ms-1 flex-shrink-0">{{ node.waterChange.progress }}%</span>
              </div>
              <div class="progress progress-mini mt-1">
                <div class="progress-bar bg-info progress-bar-animated-fast" :style="{ width: `${node.waterChange.progress}%` }"></div>
              </div>
            </div>
            
            <!-- Idle State: Clean status only (no cumulative value) -->
            <div v-else-if="node.isPowered" class="d-flex align-items-center">
              <span class="text-secondary font-monospace fw-bold" style="font-size: 0.85rem;">IDLE</span>
            </div>
            <span v-else class="text-muted font-monospace" style="font-size: 0.85rem;">OFF</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. Footer Row: Battery Pill Graphic + % Only (RSSI Removed) -->
    <div class="d-flex justify-content-between align-items-center mt-auto pt-1">
      <!-- Battery Pill Graphic + Percentage + Voltage -->
      <div class="d-flex align-items-center font-monospace" style="font-size: 0.8rem; color: #475569;">
        <div class="battery-pill-graphic">
          <div class="battery-pill-fill" :style="{ width: `${node.batteryPercent || 94}%` }"></div>
        </div>
        <span class="fw-bold">{{ (node.batteryPercent || 94).toFixed(1) }}%</span>
        <span class="text-muted ms-1" style="font-size: 0.7rem;">({{ (node.batteryVoltage || 24.2).toFixed(1) }}V)</span>
      </div>

      <!-- Time spec -->
      <div class="text-muted font-monospace" style="font-size: 0.72rem;">
        {{ formattedTime }}
      </div>
    </div>

    <!-- Fine-Tuning Parameter Adjuster Modal -->
    <AdjustSensorModal 
      :show="showAdjustModal" 
      :node="node" 
      @close="showAdjustModal = false" 
    />
  </div>
</template>
