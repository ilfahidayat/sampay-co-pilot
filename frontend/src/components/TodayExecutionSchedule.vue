<script setup>
import { ref, computed } from 'vue'
import { usePonds } from '../composables/usePonds'
import { useToast } from '../composables/useToast'
import { 
  CalendarClock, 
  Utensils, 
  Pipette, 
  Wind, 
  CheckCircle2, 
  Clock, 
  Zap, 
  Sparkles,
  ChevronRight,
  Flame,
  ArrowUpRight
} from 'lucide-vue-next'

const { activePond, triggerFeeder, triggerMolassesDosing } = usePonds()
const { showToast } = useToast()

// Reactive tracker for manual overrides within the session
const sessionOverrides = ref({})

// Dynamic today schedule computed based on the selected pond
const scheduleData = computed(() => {
  const p = activePond.value
  const targetFeed = p.actuators.feeder.targetDailyKg || 43.5
  const dispensedFeed = p.actuators.feeder.dispensedTodayKg || 22.4
  const feedPercent = Math.min(100, Math.round((dispensedFeed / targetFeed) * 100))

  const targetMolasses = p.id === 'K04' ? 1050 : (p.id === 'K01' ? 800 : (p.id === 'K02' ? 600 : 350))
  const dispensedMolasses = p.todayMolassesGrams || 700
  const molassesPercent = Math.min(100, Math.round((dispensedMolasses / targetMolasses) * 100))

  // Sessions list tailored to active pond
  const sessions = [
    {
      id: `${p.id}-s1`,
      time: '08:00 WIB',
      category: 'FEEDING',
      title: 'Morning Feeding Ration',
      doseText: `${(targetFeed * 0.3).toFixed(1)} kg BioGrow-7 Pellets`,
      amountKg: Number((targetFeed * 0.3).toFixed(1)),
      condition: 'Optimal DO > 5.0 mg/L confirmed',
      status: 'COMPLETED',
      completedAt: '08:01 WIB'
    },
    {
      id: `${p.id}-s2`,
      time: '09:30 WIB',
      category: 'MOLASSES',
      title: 'Morning C:N Molasses Balance',
      doseText: `${Math.round(targetMolasses * 0.33)}g Cane Molasses Solution`,
      amountGrams: Math.round(targetMolasses * 0.33),
      condition: 'C:N 15:1 assimilation boost',
      status: 'COMPLETED',
      completedAt: '09:31 WIB'
    },
    {
      id: `${p.id}-s3`,
      time: '12:30 WIB',
      category: 'FEEDING',
      title: 'Midday Feeding Ration',
      doseText: `${(targetFeed * 0.3).toFixed(1)} kg BioGrow-7 Pellets`,
      amountKg: Number((targetFeed * 0.3).toFixed(1)),
      condition: 'Strong thermal appetite at 28.5°C',
      status: 'COMPLETED',
      completedAt: '12:32 WIB'
    },
    {
      id: `${p.id}-s4`,
      time: '16:30 WIB',
      category: 'MOLASSES',
      title: 'Post-Feeding Molasses Buffer',
      doseText: `${Math.round(targetMolasses * 0.33)}g Cane Molasses Solution`,
      amountGrams: Math.round(targetMolasses * 0.33),
      condition: 'Heterotrophic ammonia neutralization',
      status: sessionOverrides.value[`${p.id}-s4`] || 'UPCOMING',
      timingBadge: 'UPCOMING • In ~15 min',
      canExecute: true
    },
    {
      id: `${p.id}-s5`,
      time: '19:30 WIB',
      category: 'FEEDING',
      title: 'Evening Feeding Ration',
      doseText: `${(targetFeed * 0.25).toFixed(1)} kg BioGrow-7 Pellets`,
      amountKg: Number((targetFeed * 0.25).toFixed(1)),
      condition: 'Night digestive prep',
      status: sessionOverrides.value[`${p.id}-s5`] || 'UPCOMING',
      timingBadge: 'UPCOMING • In ~3 hours',
      canExecute: true
    },
    {
      id: `${p.id}-s6`,
      time: '21:00 WIB',
      category: 'AERATION',
      title: 'Night Aeration Boost Protocol',
      doseText: 'Ramp VFD Blowers to 85% RPM',
      condition: 'Night algae & biofloc oxygen consumption',
      status: 'SCHEDULED',
      timingBadge: 'SCHEDULED • In ~4.5 hours',
      canExecute: false
    }
  ]

  return {
    targetFeed,
    dispensedFeed,
    feedPercent,
    targetMolasses,
    dispensedMolasses,
    molassesPercent,
    sessions
  }
})

// Trigger upcoming schedule early
const handleExecuteEarly = (session) => {
  if (session.category === 'FEEDING') {
    triggerFeeder(activePond.value.id, session.amountKg, 'MANUAL_ADJUST')
    showToast(`⚡ Scheduled Feed Executed: Dispensing ${session.doseText} to ${activePond.value.name}.`, 'success')
  } else if (session.category === 'MOLASSES') {
    triggerMolassesDosing(activePond.value.id, session.amountGrams, 'MANUAL_ADJUST')
    showToast(`🧪 Scheduled Molasses Executed: Dispensing ${session.doseText} to ${activePond.value.name}.`, 'info')
  }

  sessionOverrides.value[session.id] = 'COMPLETED'
}
</script>

<template>
  <div class="schedule-panel glass-panel">
    <!-- Header -->
    <div class="schedule-top">
      <div class="header-left">
        <div class="icon-avatar">
          <CalendarClock class="header-icon text-sky" :size="18" />
        </div>
        <div>
          <h3 class="panel-title font-display">Today's Execution Schedule & Action Plan</h3>
          <span class="panel-sub font-mono">Planned feeding, molasses dosing & aeration windows • {{ activePond.name }}</span>
        </div>
      </div>
      <div class="header-right-actions">
        <router-link to="/execution" class="btn-hub-link font-sans">
          <Zap :size="13" />
          <span>Buka Daily Execution Hub</span>
          <ArrowUpRight :size="13" />
        </router-link>
        <div class="next-pill font-mono">
          <Clock :size="12" class="text-amber" />
          <span>Next Action: 16:30 WIB (Molasses)</span>
        </div>
      </div>
    </div>

    <!-- Dual Progress Bar: Feed & Molasses -->
    <div class="progress-bar-grid font-mono">
      <!-- Feed Progress -->
      <div class="prog-box">
        <div class="prog-header">
          <div class="prog-title">
            <Utensils :size="13" class="text-sky" />
            <span>Today's Pellet Feed Ration</span>
          </div>
          <span class="prog-stats text-sky">{{ scheduleData.dispensedFeed }} / {{ scheduleData.targetFeed }} kg ({{ scheduleData.feedPercent }}%)</span>
        </div>
        <div class="prog-track">
          <div class="prog-fill feed" :style="{ width: scheduleData.feedPercent + '%' }"></div>
        </div>
        <div class="prog-sub">
          <span>2 sessions completed</span>
          <span>•</span>
          <span>1 upcoming session remaining</span>
        </div>
      </div>

      <!-- Molasses Progress -->
      <div class="prog-box">
        <div class="prog-header">
          <div class="prog-title">
            <Pipette :size="13" class="text-amber" />
            <span>Today's Molasses (C:N Buffer)</span>
          </div>
          <span class="prog-stats text-amber">{{ scheduleData.dispensedMolasses }} / {{ scheduleData.targetMolasses }} g ({{ scheduleData.molassesPercent }}%)</span>
        </div>
        <div class="prog-track">
          <div class="prog-fill molasses" :style="{ width: scheduleData.molassesPercent + '%' }"></div>
        </div>
        <div class="prog-sub">
          <span>1 session completed</span>
          <span>•</span>
          <span>1 post-feed session due at 16:30</span>
        </div>
      </div>
    </div>

    <!-- Timeline Schedule List -->
    <div class="timeline-list">
      <div 
        v-for="s in scheduleData.sessions" 
        :key="s.id"
        class="timeline-item"
        :class="s.status.toLowerCase()"
      >
        <!-- Time Column -->
        <div class="time-col font-mono">
          <span class="time-main">{{ s.time }}</span>
          <span class="time-tag" :class="s.category.toLowerCase()">{{ s.category }}</span>
        </div>

        <!-- Indicator Node -->
        <div class="timeline-node" :class="s.status.toLowerCase()">
          <CheckCircle2 v-if="s.status === 'COMPLETED'" :size="13" />
          <Clock v-else-if="s.status === 'UPCOMING'" :size="13" />
          <span v-else class="scheduled-dot"></span>
        </div>

        <!-- Content Column -->
        <div class="timeline-content">
          <div class="content-head">
            <span class="content-title font-sans">{{ s.title }}</span>
            <span class="dose-tag font-mono" :class="s.category.toLowerCase()">{{ s.doseText }}</span>
          </div>
          <span class="content-sub">{{ s.condition }}</span>
        </div>

        <!-- Action / Status Column -->
        <div class="action-col font-mono">
          <span v-if="s.status === 'COMPLETED'" class="status-badge done">
            <CheckCircle2 :size="11" />
            <span>COMPLETED</span>
          </span>
          <div v-else-if="s.status === 'UPCOMING'" class="upcoming-wrap">
            <span class="status-badge upcoming">{{ s.timingBadge }}</span>
            <button 
              v-if="s.canExecute"
              :id="'btn-execute-' + s.id"
              class="btn-trigger-early"
              @click="handleExecuteEarly(s)"
              title="Execute this scheduled action immediately"
            >
              <Zap :size="11" />
              <span>Execute Now</span>
            </button>
          </div>
          <span v-else class="status-badge scheduled">
            {{ s.timingBadge }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.schedule-panel {
  padding: 14px 16px;
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  box-shadow: var(--shadow-xs);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.schedule-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon-avatar {
  width: 34px;
  height: 34px;
  background: var(--sky-50);
  border: 1px solid var(--sky-200);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.panel-title {
  font-size: 0.98rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
}

.panel-sub {
  font-size: 0.68rem;
  color: var(--text-muted);
}

.header-right-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-hub-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--sky-50);
  color: var(--sky-700);
  border: 1px solid var(--sky-200);
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.15s ease;
}

.btn-hub-link:hover {
  background: var(--sky-100);
  border-color: var(--sky-300);
  transform: translateY(-1px);
}

.next-pill {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.68rem;
  color: var(--amber-800);
  background: var(--amber-50);
  border: 1px solid var(--amber-200);
  padding: 3px 9px;
  border-radius: 6px;
  font-weight: 700;
}

/* Progress Bar Grid */
.progress-bar-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  background: var(--bg-surface-subtle);
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
}

.prog-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.prog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.68rem;
}

.prog-title {
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 700;
  color: var(--text-primary);
}

.prog-stats {
  font-weight: 800;
}

.prog-track {
  width: 100%;
  height: 5px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
}

.prog-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.4s ease;
}
.prog-fill.feed { background: linear-gradient(90deg, #0284c7, #38bdf8); }
.prog-fill.molasses { background: linear-gradient(90deg, #d97706, #fbbf24); }

.prog-sub {
  display: flex;
  gap: 5px;
  font-size: 0.62rem;
  color: var(--text-muted);
}

/* Timeline List */
.timeline-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.timeline-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  transition: all 0.15s ease;
}

.timeline-item:hover {
  border-color: var(--border-medium);
  background: #f8fafc;
}

.timeline-item.completed {
  opacity: 0.85;
}

.timeline-item.upcoming {
  border-color: var(--sky-200);
  background: linear-gradient(90deg, #f0f9ff 0%, #ffffff 100%);
}

.time-col {
  display: flex;
  flex-direction: column;
  width: 72px;
  flex-shrink: 0;
}

.time-main {
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--text-primary);
}

.time-tag {
  font-size: 0.58rem;
  font-weight: 700;
  text-transform: uppercase;
}
.time-tag.feeding { color: var(--sky-600); }
.time-tag.molasses { color: var(--amber-600); }
.time-tag.aeration { color: var(--emerald-600); }

.timeline-node {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.timeline-node.completed {
  background: var(--emerald-100);
  color: var(--emerald-700);
}
.timeline-node.upcoming {
  background: var(--sky-100);
  color: var(--sky-700);
  animation: pulse-node 2s infinite ease-in-out;
}
.timeline-node.scheduled {
  background: var(--bg-surface-subtle);
  color: var(--text-muted);
}

.scheduled-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-muted);
}

@keyframes pulse-node {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.timeline-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  gap: 1px;
}

.content-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.content-title {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-primary);
}

.dose-tag {
  font-size: 0.65rem;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 4px;
}
.dose-tag.feeding { background: var(--sky-100); color: var(--sky-800); }
.dose-tag.molasses { background: var(--amber-100); color: var(--amber-800); }
.dose-tag.aeration { background: var(--emerald-100); color: var(--emerald-800); }

.content-sub {
  font-size: 0.66rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.action-col {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.status-badge {
  font-size: 0.62rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.status-badge.done {
  background: var(--emerald-50);
  color: var(--emerald-700);
  border: 1px solid var(--emerald-200);
}
.status-badge.upcoming {
  background: var(--sky-50);
  color: var(--sky-700);
  border: 1px solid var(--sky-200);
}
.status-badge.scheduled {
  background: var(--bg-surface-subtle);
  color: var(--text-muted);
  border: 1px solid var(--border-subtle);
}

.upcoming-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-trigger-early {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 700;
  background: var(--sky-600);
  color: #ffffff;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-trigger-early:hover {
  background: var(--sky-700);
}

@media (max-width: 900px) {
  .progress-bar-grid {
    grid-template-columns: 1fr;
  }
  .timeline-item {
    flex-direction: column;
    align-items: flex-start;
  }
  .action-col {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
