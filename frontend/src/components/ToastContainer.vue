<script setup>
import { useToast } from '../composables/useToast'
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-vue-next'

const { toasts, removeToast } = useToast()
</script>

<template>
  <div class="toast-container">
    <transition-group name="toast-fade">
      <div 
        v-for="toast in toasts" 
        :key="toast.id" 
        class="toast-item font-sans"
        :class="'toast-' + toast.type"
      >
        <CheckCircle2 v-if="toast.type === 'success'" class="toast-icon success" :size="18" />
        <AlertTriangle v-else-if="toast.type === 'warning'" class="toast-icon warning" :size="18" />
        <AlertCircle v-else-if="toast.type === 'error' || toast.type === 'danger'" class="toast-icon danger" :size="18" />
        <Info v-else class="toast-icon info" :size="18" />
        
        <span class="toast-msg">{{ toast.message }}</span>
        
        <button class="toast-close" @click="removeToast(toast.id)" title="Close notification">
          <X :size="14" />
        </button>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 420px;
}

.toast-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08);
  color: var(--text-primary);
  font-size: 0.82rem;
  font-weight: 600;
  line-height: 1.4;
}

.toast-success {
  border-color: #a7f3d0;
  border-left: 4px solid #10b981;
}
.toast-warning {
  border-color: #fde68a;
  border-left: 4px solid #f59e0b;
}
.toast-info {
  border-color: #bae6fd;
  border-left: 4px solid #0284c7;
}
.toast-error,
.toast-danger {
  border-color: #fca5a5;
  border-left: 4px solid #ef4444;
}

.toast-icon.success { color: #059669; flex-shrink: 0; }
.toast-icon.warning { color: #d97706; flex-shrink: 0; }
.toast-icon.info { color: #0284c7; flex-shrink: 0; }
.toast-icon.danger { color: #dc2626; flex-shrink: 0; }

.toast-msg {
  flex: 1;
}

.toast-close {
  background: transparent;
  color: var(--text-muted);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.15s ease;
  flex-shrink: 0;
}
.toast-close:hover {
  color: var(--text-primary);
  background: #f1f5f9;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-fade-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(15px);
}
</style>
