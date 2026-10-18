<script setup>
import Sidebar from './components/Sidebar.vue'
import TopHeader from './components/TopHeader.vue'
import SystemConfigModal from './components/SystemConfigModal.vue'
import ToastContainer from './components/ToastContainer.vue'
import { useSystemConfig } from './composables/useSystemConfig'
import { useSidebar } from './composables/useSidebar'

const { isConfigModalOpen, closeConfigModal, fetchSystemHealth } = useSystemConfig()
const { isSidebarCollapsed } = useSidebar()
</script>

<template>
  <div class="layout-wrapper">
    <!-- Left Navigation Sidebar -->
    <Sidebar />

    <!-- Main Content Container with Fixed Top Header -->
    <div class="main-content-wrapper" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
      <!-- Fixed Top Header Bar -->
      <TopHeader />

      <!-- Content Area with proper top padding for fixed header -->
      <main class="page-body">
        <router-view />
      </main>
    </div>

    <!-- Global System Configuration Modal -->
    <SystemConfigModal 
      :show="isConfigModalOpen" 
      @close="closeConfigModal" 
      @updated="fetchSystemHealth" 
    />

    <!-- Global Toast Container -->
    <ToastContainer />
  </div>
</template>

<style scoped>
.layout-wrapper {
  display: flex;
  min-height: 100vh;
  background-color: var(--bg-body);
}

.main-content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  margin-left: 270px; /* Offset for fixed sidebar */
  transition: margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.main-content-wrapper.sidebar-collapsed {
  margin-left: 76px;
}

.page-body {
  padding: 84px 32px 48px; /* Top padding 84px to clear 64px fixed header */
  flex: 1;
  max-width: 1600px;
  width: 100%;
}

.dashboard-full-view {
  display: flex;
  flex-direction: column;
}

.dashboard-operations-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 16px;
  margin-bottom: 16px;
  align-items: stretch;
}

@media (max-width: 1100px) {
  .dashboard-operations-grid {
    grid-template-columns: 1fr;
  }
}

.copilot-dedicated-view {
  width: 100%;
}

.copilot-page-container {
  max-width: 980px;
  margin: 0 auto;
}

.full-view-container {
  width: 100%;
}

@media (max-width: 1280px) {
  .main-content-wrapper {
    margin-left: 240px;
  }
  .main-content-wrapper.sidebar-collapsed {
    margin-left: 76px;
  }
}

@media (max-width: 768px) {
  .main-content-wrapper {
    margin-left: 0;
  }
  .main-content-wrapper.sidebar-collapsed {
    margin-left: 0;
  }
  .page-body {
    padding: 80px 16px 32px;
  }
}
</style>
