<script setup>
import { usePonds } from '../composables/usePonds'
import { useToast } from '../composables/useToast'
import { 
  SlidersHorizontal, 
  AlertTriangle, 
  Biohazard, 
  Utensils, 
  CheckCircle2, 
  Radio, 
  X
} from 'lucide-vue-next'

const emit = defineEmits(['close'])
const { applyScenario, isLiveSimulationRunning } = usePonds()
const { showToast } = useToast()

const handleScenario = (type, title) => {
  applyScenario(type)
  showToast(`Demo Scenario Active: ${title} on Pond 4`, 'warning', 4000)
}
</script>

<template>
  <aside class="simulator-drawer glass-panel">
    <div class="drawer-header">
      <div class="drawer-title-row">
        <SlidersHorizontal class="text-sky" :size="18" />
        <div>
          <h4 class="drawer-title font-display">Farm Scenario Simulator (Jury Demo)</h4>
          <span class="drawer-sub">Test how Co-Pilot and actuators react to extreme biofloc conditions</span>
        </div>
      </div>

      <button class="btn-close" @click="emit('close')" title="Close simulator panel">
        <X :size="16" />
      </button>
    </div>

    <div class="scenarios-list">
      <!-- Scenario 1: Normal -->
      <button 
        id="btn-scenario-normal"
        class="scenario-card"
        @click="handleScenario('reset', 'Normal & Healthy Water State')"
      >
        <div class="scenario-icon-wrap emerald">
          <CheckCircle2 :size="18" />
        </div>
        <div class="scenario-text">
          <span class="scenario-name">1. Normal & Healthy Water State</span>
          <span class="scenario-desc">Oxygen 6.2 mg/L, pH 7.5, Ammonia 0.02 ppm. All systems nominal.</span>
        </div>
      </button>

      <!-- Scenario 2: Hypoxia -->
      <button 
        id="btn-scenario-hypoxia"
        class="scenario-card alert-rose"
        @click="handleScenario('hypoxia', 'Hypoxia Emergency (Low DO)')"
      >
        <div class="scenario-icon-wrap rose">
          <AlertTriangle :size="18" />
        </div>
        <div class="scenario-text">
          <span class="scenario-name">2. Hypoxia Emergency (DO 3.2 mg/L)</span>
          <span class="scenario-desc">Triggers critical low DO alarm & auto-prompts 100% aerator boost</span>
        </div>
      </button>

      <!-- Scenario 3: Ammonia Spike -->
      <button 
        id="btn-scenario-ammonia"
        class="scenario-card alert-amber"
        @click="handleScenario('ammonia_spike', 'Ammonia Spike (High TAN)')"
      >
        <div class="scenario-icon-wrap amber">
          <Biohazard :size="18" />
        </div>
        <div class="scenario-text">
          <span class="scenario-name">3. Ammonia Spike (TAN 0.082 ppm)</span>
          <span class="scenario-desc">Co-Pilot calculates organic carbon deficit & prompts +850g molasses dosing</span>
        </div>
      </button>

      <!-- Scenario 4: Feeding Window -->
      <button 
        id="btn-scenario-feeding"
        class="scenario-card alert-cyan"
        @click="handleScenario('feeding_window', 'Scheduled Feed Window')"
      >
        <div class="scenario-icon-wrap cyan">
          <Utensils :size="18" />
        </div>
        <div class="scenario-text">
          <span class="scenario-name">4. Scheduled Feed Window (14:00 WIB)</span>
          <span class="scenario-desc">Triggers 5.2 kg pellet broadcast via smart auto-feeder</span>
        </div>
      </button>
    </div>

    <!-- Toggle Live Sensor Jitter -->
    <div class="drawer-footer">
      <div class="live-toggle-row">
        <div class="toggle-info">
          <Radio :size="15" :class="{ 'text-emerald': isLiveSimulationRunning, 'text-muted': !isLiveSimulationRunning }" />
          <span class="toggle-title">Live Sensor Jitter:</span>
        </div>
        <button 
          class="btn-toggle-switch font-mono" 
          :class="{ active: isLiveSimulationRunning }"
          @click="isLiveSimulationRunning = !isLiveSimulationRunning"
        >
          {{ isLiveSimulationRunning ? 'ACTIVE' : 'PAUSED' }}
        </button>
      </div>
      <span class="footer-tip">Demo Tip: Click any scenario above, then open the "Co-Pilot" tab to inspect automated HITL recommendations!</span>
    </div>
  </aside>
</template>

<style scoped>
.simulator-drawer {
  position: fixed;
  top: 74px;
  right: 28px;
  width: 420px;
  max-width: calc(100vw - 48px);
  z-index: 1000;
  background: #ffffff;
  border: 1px solid var(--border-medium);
  box-shadow: var(--shadow-xl);
  padding: 18px 20px;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  animation: slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slide-in {
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-subtle);
}

.drawer-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.drawer-title {
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--text-primary);
}

.drawer-sub {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.btn-close {
  background: transparent;
  color: var(--text-muted);
  padding: 4px;
  border-radius: 6px;
}
.btn-close:hover {
  background: var(--bg-surface-subtle);
  color: var(--text-primary);
}

.scenarios-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.scenario-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--bg-surface-subtle);
  border: 1px solid var(--border-subtle);
  text-align: left;
  transition: all 0.2s ease;
}

.scenario-card:hover {
  transform: translateX(3px);
  background: #ffffff;
  border-color: var(--sky-400);
  box-shadow: var(--shadow-sm);
}

.scenario-card.alert-rose:hover {
  border-color: var(--rose-400);
  box-shadow: 0 0 10px rgba(244, 63, 94, 0.15);
}

.scenario-card.alert-amber:hover {
  border-color: var(--amber-400);
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.15);
}

.scenario-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.scenario-icon-wrap.emerald { background: var(--emerald-50); color: var(--emerald-600); }
.scenario-icon-wrap.rose { background: var(--rose-50); color: var(--rose-600); }
.scenario-icon-wrap.amber { background: var(--amber-50); color: var(--amber-600); }
.scenario-icon-wrap.cyan { background: var(--sky-50); color: var(--sky-600); }

.scenario-text {
  display: flex;
  flex-direction: column;
}

.scenario-name {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-primary);
}

.scenario-desc {
  font-size: 0.68rem;
  color: var(--text-muted);
}

.drawer-footer {
  padding-top: 12px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.live-toggle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toggle-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.toggle-title {
  font-size: 0.72rem;
  color: var(--text-secondary);
  font-weight: 700;
}

.btn-toggle-switch {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  background: var(--bg-surface-subtle);
  color: var(--text-muted);
  border: 1px solid var(--border-subtle);
}

.btn-toggle-switch.active {
  background: var(--emerald-50);
  color: var(--emerald-700);
  border-color: var(--emerald-200);
}

.footer-tip {
  font-size: 0.65rem;
  color: var(--text-muted);
  line-height: 1.4;
}
</style>
