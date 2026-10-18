<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useSidebar } from '../composables/useSidebar'
import { Clock, PanelLeftClose, PanelLeftOpen } from 'lucide-vue-next'

const { isSidebarCollapsed, toggleSidebar } = useSidebar()
const currentTime = ref('')

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB'
}

let timer = null

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <header class="top-header-fixed" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
    <!-- Left: Sidebar Expand/Collapse Toggle & Breadcrumb -->
    <div class="header-left-group">
      <button 
        id="btn-toggle-sidebar"
        class="btn-sidebar-toggle"
        @click="toggleSidebar"
        :title="isSidebarCollapsed ? 'Perbesar Sidebar (Expand)' : 'Perkecil Sidebar (Collapse)'"
      >
        <PanelLeftOpen v-if="isSidebarCollapsed" :size="18" />
        <PanelLeftClose v-else :size="18" />
      </button>

      <div class="header-brand-title">
        <span class="brand-name font-display">SAMPAY BIOFLOC</span>
        <span class="brand-divider">•</span>
        <span class="brand-system-tag">Smart Aquaculture OS</span>
      </div>
    </div>

    <!-- Right: Field Digital Clock -->
    <div class="header-actions-group">
      <div class="clock-pill font-mono">
        <Clock :size="14" class="text-muted" />
        <span>{{ currentTime }}</span>
      </div>
    </div>
  </header>
</template>

<style scoped>
.top-header-fixed {
  position: fixed;
  top: 0;
  right: 0;
  left: 270px;
  height: 64px;
  background: #ffffff;
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  z-index: 90;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
  transition: left 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.top-header-fixed.sidebar-collapsed {
  left: 76px;
}

.header-left-group {
  display: flex;
  align-items: center;
  gap: 14px;
}

.btn-sidebar-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid var(--border-subtle, #e2e8f0);
  background: #ffffff;
  color: var(--text-secondary, #475569);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-sidebar-toggle:hover {
  background: var(--bg-surface-subtle, #f8fafc);
  border-color: #cbd5e1;
  color: var(--sky-600, #0284c7);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.header-brand-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.brand-name {
  font-size: 0.92rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--text-primary, #0f172a);
}

.brand-divider {
  color: #cbd5e1;
  font-size: 0.8rem;
}

.brand-system-tag {
  font-size: 0.75rem;
  color: var(--text-muted, #64748b);
  font-weight: 500;
}

.header-actions-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.clock-pill {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 14px;
  border-radius: 8px;
  background: var(--bg-surface-subtle, #f8fafc);
  border: 1px solid var(--border-subtle, #e2e8f0);
  color: var(--text-secondary, #475569);
  font-size: 0.76rem;
  font-weight: 600;
}

.text-muted {
  color: var(--text-muted);
}

@media (max-width: 1280px) {
  .top-header-fixed {
    left: 240px;
  }
  .top-header-fixed.sidebar-collapsed {
    left: 76px;
  }
}
@media (max-width: 768px) {
  .top-header-fixed {
    left: 0;
  }
  .top-header-fixed.sidebar-collapsed {
    left: 0;
  }
  .brand-system-tag, .brand-divider {
    display: none;
  }
}
</style>
