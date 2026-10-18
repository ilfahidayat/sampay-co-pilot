<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePonds } from '../composables/usePonds'
import { useSystemConfig } from '../composables/useSystemConfig'
import { useSidebar } from '../composables/useSidebar'
import { 
  LayoutDashboard, 
  Layers, 
  Cpu, 
  FileText, 
  Waves,
  Sparkles,
  Bot,
  Activity,
  Zap,
  Settings
} from 'lucide-vue-next'

const route = useRoute()
const { ponds } = usePonds()
const { systemHealth, openConfigModal, startPolling, stopPolling } = useSystemConfig()
const { isSidebarCollapsed } = useSidebar()

const navItems = computed(() => [
  { id: 'dashboard', path: '/', label: 'Pond Overview', icon: LayoutDashboard, badge: null },
  { id: 'copilot', path: '/copilot', label: 'Co-Pilot', icon: Bot, badge: 'AI Assistant' },
  { id: 'treatment', path: '/daily-treatment', label: 'Daily Treatment', icon: Zap, badge: 'Treatment' },
  { id: 'water-quality', path: '/water-quality', label: 'Water Quality', icon: Activity, badge: 'Vitals' },
  { id: 'ponds', path: '/ponds', label: 'Ponds Fleet', icon: Layers, badge: `${ponds.value.length} Ponds` },
  { id: 'hardware', path: '/hardware', label: 'Equipment & Sensors', icon: Cpu, badge: null },
  { id: 'audit', path: '/audit', label: 'Activity Log', icon: FileText, badge: null }
])

const isItemActive = (item) => {
  if (item.path === '/') {
    return route.path === '/' || route.path === '/dashboard'
  }
  if (item.id === 'treatment') {
    return route.path === '/daily-treatment' || route.path === '/execution' || route.path === '/daily-execution' || route.path === '/treatment'
  }
  return route.path.startsWith(item.path)
}

const getBrokerShortHost = (url) => {
  if (!url) return 'emqx.io'
  try {
    return url.replace(/^wss?:\/\//, '').replace(/\/.*$/, '').split(':')[0]
  } catch {
    return 'broker'
  }
}

onMounted(() => {
  startPolling()
})

onUnmounted(() => {
  stopPolling()
})
</script>

<template>
  <aside class="app-sidebar" :class="{ 'collapsed': isSidebarCollapsed }">
    <!-- Brand Logo -->
    <div class="sidebar-brand-box">
      <div class="brand-logo-icon" :title="isSidebarCollapsed ? 'SAMPAY BIOFLOC' : ''">
        <Waves class="logo-icon" :size="20" />
      </div>
      <div v-if="!isSidebarCollapsed" class="brand-texts">
        <div class="title-row">
          <span class="brand-title font-display">SAMPAY</span>
          <span class="version-tag">BIOFLOC</span>
        </div>
        <span class="brand-sub">Smart Tilapia Co-Pilot</span>
      </div>
    </div>

    <!-- Navigation Section -->
    <nav class="sidebar-nav">
      <div v-if="!isSidebarCollapsed" class="nav-section-title">MAIN MENU</div>
      <ul class="nav-list">
        <li v-for="item in navItems" :key="item.id">
          <router-link 
            :to="item.path"
            :id="'nav-' + item.id"
            class="nav-link"
            :class="{ active: isItemActive(item) }"
            :title="item.label"
          >
            <component :is="item.icon" class="nav-icon" :size="18" />
            <span v-if="!isSidebarCollapsed" class="nav-label">{{ item.label }}</span>
            <span v-if="!isSidebarCollapsed && item.badge" class="nav-badge" :class="item.id === 'copilot' ? 'badge-ai' : ''">
              {{ item.badge }}
            </span>
          </router-link>
        </li>
      </ul>
    </nav>

    <!-- Google Cloud AI Builder Cup Badge & Live Infrastructure Link -->
    <div 
      class="competition-card" 
      :class="{ 'collapsed-card': isSidebarCollapsed }"
      @click="openConfigModal" 
      :title="isSidebarCollapsed ? `Google Cloud AI Cup & Settings • MQTT: ${systemHealth.mqtt?.status || 'ONLINE'}` : 'Click to configure Google Gemini AI & MQTT Broker'"
    >
      <template v-if="!isSidebarCollapsed">
        <div class="comp-header-row">
          <div class="comp-icon-row">
            <Sparkles :size="15" class="text-sky" />
            <span class="comp-title">Google Cloud AI Cup</span>
          </div>
          <button 
            type="button" 
            class="comp-config-btn" 
            @click.stop="openConfigModal"
            title="Open System Settings"
          >
            <Settings :size="12" />
          </button>
        </div>
        <p class="comp-desc">Autonomous AI Operating System for Biofloc Aquaculture</p>

        <!-- Status Indicators Stack -->
        <div class="comp-status-stack font-mono">
          <!-- 1. Gemini AI Status -->
          <div class="comp-status-item">
            <span class="pulse-dot online mini"></span>
            <span class="comp-status-text">
              {{ systemHealth.ai?.mockMode ? 'Gemini: Mock (0 Credit)' : `Gemini: ${systemHealth.ai?.model || 'Live API'}` }}
            </span>
          </div>

          <!-- 2. MQTT Broker Status (Inside Google Cloud AI Cup Card) -->
          <div class="comp-status-item">
            <span class="pulse-dot mini" :class="systemHealth.mqtt?.status === 'CONNECTED' ? 'online' : 'offline'"></span>
            <span class="comp-status-text" :class="systemHealth.mqtt?.status === 'CONNECTED' ? 'text-mqtt-online' : 'text-mqtt-offline'">
              {{ systemHealth.mqtt?.status === 'CONNECTED' ? 'MQTT: Online' : 'MQTT: Offline' }}
            </span>
            <span class="comp-host-badge" :title="systemHealth.mqtt?.brokerUrl || ''">
              {{ getBrokerShortHost(systemHealth.mqtt?.brokerUrl) }}
            </span>
            <span v-if="systemHealth.mqtt?.hasAuth" class="comp-auth-badge" title="Username/Password Authentication Enabled">
              Auth
            </span>
          </div>
        </div>
      </template>

      <!-- Collapsed Compact State for Competition Card -->
      <template v-else>
        <div class="collapsed-card-inner">
          <div class="mini-sparkles-wrap">
            <Sparkles :size="16" class="text-sky" />
          </div>
          <span 
            class="pulse-dot mini" 
            :class="systemHealth.mqtt?.status === 'CONNECTED' ? 'online' : 'offline'"
          ></span>
        </div>
      </template>
    </div>

    <!-- Supervisor Profile Card -->
    <div class="sidebar-footer">
      <div class="operator-box" :title="isSidebarCollapsed ? 'Ilfa Hidayat (Farm Supervisor)' : ''">
        <div class="operator-avatar">
          <span>IH</span>
        </div>
        <div v-if="!isSidebarCollapsed" class="operator-details">
          <span class="operator-name">Ilfa Hidayat</span>
          <span class="operator-role">Farm Supervisor</span>
        </div>
      </div>
      <div v-if="!isSidebarCollapsed" class="farm-meta">
        <span>Location: Biofloc Unit #01</span>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.app-sidebar {
  width: 270px;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  padding: 20px 16px;
  flex-shrink: 0;
  z-index: 100;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.02);
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1), padding 0.25s ease;
  overflow-x: hidden;
}

.app-sidebar.collapsed {
  width: 76px;
  padding: 20px 10px;
}

.sidebar-brand-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 20px;
  transition: all 0.25s ease;
}

.app-sidebar.collapsed .sidebar-brand-box {
  justify-content: center;
  padding-bottom: 16px;
  margin-bottom: 16px;
}

.brand-logo-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--sky-500) 0%, var(--emerald-500) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.25);
  flex-shrink: 0;
}

.brand-texts {
  display: flex;
  flex-direction: column;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.brand-title {
  font-size: 1.2rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--text-primary);
}

.version-tag {
  font-size: 0.6rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--sky-50);
  color: var(--sky-600);
  border: 1px solid var(--sky-100);
}

.brand-sub {
  font-size: 0.72rem;
  color: var(--text-muted);
  font-weight: 500;
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.nav-section-title {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--text-subtle);
  margin-bottom: 10px;
  padding-left: 10px;
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  text-decoration: none;
  color: var(--text-secondary);
  font-size: 0.84rem;
  font-weight: 600;
  transition: all 0.15s ease;
  position: relative;
}

.app-sidebar.collapsed .nav-link {
  justify-content: center;
  padding: 10px 0;
  gap: 0;
}

.nav-link:hover {
  background: var(--bg-surface-subtle);
  color: var(--text-primary);
}

.nav-link.active {
  background: var(--sky-50);
  color: var(--sky-600);
}

.nav-icon {
  flex-shrink: 0;
}

.nav-label {
  flex: 1;
  white-space: nowrap;
}

.nav-badge {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
  background: var(--bg-surface-subtle);
  color: var(--text-muted);
}

.nav-badge.badge-ai {
  background: var(--purple-100);
  color: var(--purple-700);
}

.competition-card {
  background: linear-gradient(135deg, #f8fafc 0%, #f0f9ff 100%);
  border: 1px solid var(--sky-100);
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.competition-card.collapsed-card {
  padding: 8px 4px;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
}

.collapsed-card-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 2px;
}

.mini-sparkles-wrap {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.competition-card:hover {
  border-color: var(--sky-300);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.1);
  transform: translateY(-1px);
}

.comp-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.comp-icon-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.comp-title {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--sky-700);
}

.comp-config-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 3px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.comp-config-btn:hover {
  color: var(--sky-700);
  background: rgba(14, 165, 233, 0.12);
}

.text-sky { color: var(--sky-600); }

.comp-desc {
  font-size: 0.68rem;
  color: var(--text-muted);
  line-height: 1.3;
}

.comp-status-stack {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 4px;
  padding-top: 6px;
  border-top: 1px dashed rgba(186, 230, 253, 0.6);
}

.comp-status-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.66rem;
  font-weight: 600;
}

.comp-status-text {
  color: #334155;
  white-space: nowrap;
}

.text-mqtt-online {
  color: #047857;
}

.text-mqtt-offline {
  color: #b91c1c;
}

.comp-host-badge {
  font-size: 0.58rem;
  padding: 1px 5px;
  border-radius: 4px;
  background: #e0f2fe;
  color: #0369a1;
  max-width: 90px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.comp-auth-badge {
  font-size: 0.55rem;
  padding: 1px 4px;
  border-radius: 4px;
  background: #fef3c7;
  color: #92400e;
  font-weight: 700;
}

.sidebar-footer {
  padding-top: 14px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.operator-box {
  display: flex;
  align-items: center;
  gap: 10px;
}

.app-sidebar.collapsed .operator-box {
  justify-content: center;
}

.operator-avatar {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: var(--sky-600);
  color: #ffffff;
  font-weight: 700;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.operator-details {
  display: flex;
  flex-direction: column;
}

.operator-name {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
}

.operator-role {
  font-size: 0.68rem;
  color: var(--text-muted);
  white-space: nowrap;
}

.farm-meta {
  font-size: 0.68rem;
  color: var(--text-subtle);
  white-space: nowrap;
}
</style>
