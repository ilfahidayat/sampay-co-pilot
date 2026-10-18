<script setup>
import { computed } from 'vue'
import { usePonds } from '../composables/usePonds'
import { 
  Waves, 
  Activity, 
  Cpu, 
  Sparkles, 
  FlaskConical, 
  SlidersHorizontal,
  Layers
} from 'lucide-vue-next'

const emit = defineEmits(['toggle-simulator'])
const { globalFarmMetrics } = usePonds()

defineProps({
  simulatorOpen: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <header class="navbar glass-panel">
    <!-- Brand Info -->
    <div class="brand-container">
      <div class="logo-wrapper">
        <div class="logo-icon-box">
          <Waves class="logo-svg" :size="22" />
        </div>
        <div class="brand-text">
          <div class="brand-title-row">
            <span class="brand-name font-display">SAMPAY</span>
            <span class="badge badge-cyan">AI Co-Pilot</span>
          </div>
          <span class="brand-sub">Biofloc NLOps Enterprise • Google Cloud AI Builder Cup</span>
        </div>
      </div>
    </div>

    <!-- Quick Stats Pills -->
    <div class="stats-pills">
      <div class="stat-pill" title="Estimated Total Farm Biomass">
        <Layers class="pill-icon text-cyan" :size="15" />
        <div class="pill-data">
          <span class="pill-val font-mono">{{ globalFarmMetrics.totalBiomassKg.toLocaleString() }} kg</span>
          <span class="pill-lbl">Total Biomass</span>
        </div>
      </div>

      <div class="stat-pill" title="Feed Conversion Ratio (FCR)">
        <FlaskConical class="pill-icon text-emerald" :size="15" />
        <div class="pill-data">
          <span class="pill-val font-mono">{{ globalFarmMetrics.fcr }}</span>
          <span class="pill-lbl">Avg FCR</span>
        </div>
      </div>

      <div class="stat-pill" title="Biofloc Health Vitality Index">
        <Activity class="pill-icon text-emerald" :size="15" />
        <div class="pill-data">
          <span class="pill-val font-mono">{{ globalFarmMetrics.avgHealth }}%</span>
          <span class="pill-lbl">Health Score</span>
        </div>
      </div>
    </div>

    <!-- System Status & Controls -->
    <div class="system-status-group">
      <!-- Hardware Gateway Indicator -->
      <div class="status-indicator-chip" title="ESP32 Edge Microcontroller Connection">
        <span class="pulse-dot online"></span>
        <div class="chip-text">
          <span class="chip-title">ESP32 Edge</span>
          <span class="chip-sub font-mono">ONLINE (34ms)</span>
        </div>
      </div>

      <!-- AI Core Indicator -->
      <div class="status-indicator-chip ai-chip" title="Google Gemini 2.5 Flash Grounded Agent">
        <Sparkles class="ai-sparkle-icon" :size="14" />
        <div class="chip-text">
          <span class="chip-title">Gemini 2.5 Flash</span>
          <span class="chip-sub">RAG SOP Grounded</span>
        </div>
      </div>

      <!-- Simulator Drawer Toggle -->
      <button 
        id="btn-toggle-simulator"
        class="simulator-toggle-btn" 
        :class="{ active: simulatorOpen }"
        @click="emit('toggle-simulator')"
        title="Open Demo Scenario Simulation Panel"
      >
        <SlidersHorizontal :size="16" />
        <span>Demo Simulator</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  border-radius: 16px;
  margin-bottom: 20px;
  background: rgba(10, 17, 36, 0.75);
}

.brand-container {
  display: flex;
  align-items: center;
}

.logo-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(16, 185, 129, 0.2) 100%);
  border: 1px solid rgba(56, 189, 248, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 20px rgba(6, 182, 212, 0.25);
}

.logo-svg {
  color: var(--cyan-400);
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-name {
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  background: linear-gradient(135deg, #f8fafc 0%, #38bdf8 100%);
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.brand-sub {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 500;
}

/* Stats Pills */
.stats-pills {
  display: flex;
  align-items: center;
  gap: 14px;
}

.stat-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 6px 14px;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.stat-pill:hover {
  border-color: rgba(56, 189, 248, 0.3);
  background: rgba(15, 23, 42, 0.85);
}

.text-cyan { color: var(--cyan-400); }
.text-emerald { color: var(--emerald-400); }

.pill-data {
  display: flex;
  flex-direction: column;
}

.pill-val {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.1;
}

.pill-lbl {
  font-size: 0.68rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* System Status Group */
.system-status-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-indicator-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 6px 12px;
  border-radius: 10px;
}

.chip-text {
  display: flex;
  flex-direction: column;
}

.chip-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.1;
}

.chip-sub {
  font-size: 0.65rem;
  color: var(--emerald-400);
}

.ai-chip {
  border-color: rgba(168, 85, 247, 0.3);
  background: rgba(168, 85, 247, 0.08);
}
.ai-sparkle-icon {
  color: var(--purple-400);
}
.ai-chip .chip-sub {
  color: var(--purple-400);
}

.simulator-toggle-btn {
  background: rgba(6, 182, 212, 0.12);
  color: var(--cyan-400);
  border: 1px solid rgba(6, 182, 212, 0.3);
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.simulator-toggle-btn:hover,
.simulator-toggle-btn.active {
  background: var(--cyan-500);
  color: #ffffff;
  border-color: var(--cyan-400);
  box-shadow: 0 0 16px rgba(6, 182, 212, 0.4);
}

@media (max-width: 1024px) {
  .stats-pills {
    display: none;
  }
}
</style>
