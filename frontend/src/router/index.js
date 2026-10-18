import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import WaterTelemetryView from '../views/WaterTelemetryView.vue'
import CopilotView from '../views/CopilotView.vue'
import PondsManagementView from '../views/PondsManagementView.vue'
import HardwareNodesView from '../views/HardwareNodesView.vue'
import LogAuditView from '../views/LogAuditView.vue'
import DailyExecutionView from '../views/DailyExecutionView.vue'

const routes = [
  {
    path: '/',
    alias: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: { title: 'Pond Overview — Sampay Biofloc' }
  },
  {
    path: '/daily-treatment',
    alias: ['/execution', '/daily-execution', '/treatment'],
    name: 'daily-treatment',
    component: DailyExecutionView,
    meta: { title: 'Daily Treatment — Sampay Biofloc' }
  },
  {
    path: '/water-quality',
    alias: ['/telemetry', '/water-telemetry'],
    name: 'water-quality',
    component: WaterTelemetryView,
    meta: { title: 'Water Quality — Sampay Biofloc' }
  },
  {
    path: '/copilot',
    name: 'copilot',
    component: CopilotView,
    meta: { title: 'Co-Pilot AI — Sampay Biofloc' }
  },
  {
    path: '/ponds',
    name: 'ponds',
    component: PondsManagementView,
    meta: { title: 'Ponds Fleet — Sampay Biofloc' }
  },
  {
    path: '/hardware',
    name: 'hardware',
    component: HardwareNodesView,
    meta: { title: 'Equipment & Sensors — Sampay Biofloc' }
  },
  {
    path: '/calculator',
    redirect: '/execution'
  },
  {
    path: '/audit',
    name: 'audit',
    component: LogAuditView,
    meta: { title: 'Activity Log & Ledger — Sampay Biofloc' }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

router.afterEach((to) => {
  if (to.meta?.title) {
    document.title = to.meta.title
  }
})

export default router
