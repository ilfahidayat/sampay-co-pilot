<script setup>
import { ref, nextTick, watch, onMounted } from 'vue'
import { marked } from 'marked'
import { useCopilot } from '../composables/useCopilot'
import { usePonds } from '../composables/usePonds'
import { 
  Send, 
  Bot, 
  User, 
  Check, 
  X, 
  Mic, 
  ShieldAlert, 
  CheckCircle2,
  Sparkles
} from 'lucide-vue-next'

marked.setOptions({
  breaks: true,
  gfm: true
})

const { messages, isThinking, autoPilotMode, sendMessage, authorizeAction, cancelAction, triggerCriticalIssueAlert } = useCopilot()
const { activePond } = usePonds()

const inputMessage = ref('')
const chatMessagesContainer = ref(null)
const commandInputRef = ref(null)

const focusInput = async () => {
  await nextTick()
  if (commandInputRef.value) {
    commandInputRef.value.focus()
  }
}

const scrollToBottom = async () => {
  await nextTick()
  if (chatMessagesContainer.value) {
    chatMessagesContainer.value.scrollTop = chatMessagesContainer.value.scrollHeight
  }
}

watch(messages, () => {
  scrollToBottom()
}, { deep: true })

watch(isThinking, (thinking) => {
  if (!thinking) {
    focusInput()
  }
})

onMounted(() => {
  focusInput()
})

const handleSend = () => {
  if (!inputMessage.value.trim() || isThinking.value) return
  const text = inputMessage.value
  inputMessage.value = ''
  sendMessage(text)
  scrollToBottom()
  focusInput()
}

const sendPromptPreset = (presetText) => {
  sendMessage(presetText)
  scrollToBottom()
  focusInput()
}

const formatMarkdown = (text) => {
  if (!text) return ''
  try {
    return marked.parse(text)
  } catch (err) {
    return text.replace(/\n/g, '<br>')
  }
}
</script>

<template>
  <div class="nlops-chat-container glass-panel">
    <!-- Chat Header -->
    <div class="chat-header">
      <div class="assistant-profile">
        <div class="avatar-ring">
          <Bot class="bot-icon" :size="20" />
        </div>
        <div class="profile-details">
          <div class="name-row">
            <span class="assistant-name font-display">Co-Pilot</span>
            <span class="badge badge-purple">AI Farm Assistant</span>
          </div>
          <span class="status-sub">
            <span class="pulse-dot online mini"></span>
            Online & Ready • Telemetry Synthesis & Smart Actuation
          </span>
        </div>
      </div>

      <!-- Mode Selector -->
      <div class="mode-pill-toggle">
        <span class="mode-label">Control Mode:</span>
        <button 
          class="mode-btn" 
          :class="{ active: !autoPilotMode }"
          @click="autoPilotMode = false"
          title="Actuators only execute when authorized by supervisor"
        >
          Supervisor Approval (Safe)
        </button>
        <button 
          class="mode-btn" 
          :class="{ active: autoPilotMode }"
          @click="autoPilotMode = true"
          title="Automated dispatch based on scheduled biological policies"
        >
          Autonomous Mode
        </button>
      </div>
    </div>

    <!-- Chat Messages Stream -->
    <div class="chat-stream" ref="chatMessagesContainer">
      <div 
        v-for="msg in messages" 
        :key="msg.id" 
        class="message-bubble-wrapper"
        :class="msg.role"
      >
        <!-- Avatar -->
        <div class="msg-avatar" :class="msg.role">
          <Bot v-if="msg.role === 'assistant'" :size="16" />
          <User v-else :size="16" />
        </div>

        <div class="msg-content-block">
          <div class="msg-sender-info">
            <span class="sender-name">{{ msg.senderName === 'Sampay AI Co-Pilot' ? 'Co-Pilot' : msg.senderName }}</span>
            <span class="msg-time font-mono">{{ msg.timestamp }}</span>
          </div>

          <!-- Message Text Body with formatted HTML -->
          <div 
            class="msg-body" 
            :class="{ 'briefing-card': msg.isBriefing }"
            v-html="formatMarkdown(msg.text)"
          ></div>

          <!-- Human-in-the-Loop (HITL) Action Card -->
          <div 
            v-if="msg.actionCard" 
            class="hitl-action-card"
            :class="{
              'status-pending': msg.actionCard.status === 'pending',
              'status-approved': msg.actionCard.status === 'approved',
              'status-cancelled': msg.actionCard.status === 'cancelled',
              'is-critical': msg.actionCard.type === 'EMERGENCY_HYPOXIA'
            }"
          >
            <div class="hitl-card-header">
              <div class="hitl-header-left">
                <ShieldAlert class="hitl-icon" :size="18" />
                <span class="hitl-title">{{ msg.actionCard.title || 'Supervisor Authorization Required' }}</span>
              </div>
              <span 
                class="badge"
                :class="{
                  'badge-amber': msg.actionCard.status === 'pending' && msg.actionCard.type !== 'EMERGENCY_HYPOXIA',
                  'badge-rose': msg.actionCard.type === 'EMERGENCY_HYPOXIA' && msg.actionCard.status === 'pending',
                  'badge-emerald': msg.actionCard.status === 'approved',
                  'badge-cancelled': msg.actionCard.status === 'cancelled'
                }"
              >
                {{ msg.actionCard.status === 'pending' ? (msg.actionCard.type === 'EMERGENCY_HYPOXIA' ? 'CRITICAL MITIGATION' : 'PENDING APPROVAL') : (msg.actionCard.status === 'approved' ? 'APPROVED' : 'CANCELLED') }}
              </span>
            </div>

            <p class="hitl-desc">{{ msg.actionCard.description }}</p>

            <!-- Parameters Grid if plan or mitigation -->
            <div v-if="msg.actionCard.feedAmountKg || msg.actionCard.aeratorPowerPercent || msg.actionCard.molassesGrams" class="hitl-params-pill-grid font-mono">
              <span v-if="msg.actionCard.feedAmountKg" class="param-tag feed">
                🐟 Feed: <strong>{{ msg.actionCard.feedAmountKg }} kg</strong>
              </span>
              <span v-if="msg.actionCard.aeratorPowerPercent" class="param-tag aerate">
                ⚡ Aerator: <strong>{{ msg.actionCard.aeratorPowerPercent }}% (~{{ Math.round((msg.actionCard.aeratorPowerPercent / 100) * 1500) }} RPM)</strong>
              </span>
              <span v-if="msg.actionCard.molassesGrams" class="param-tag molasses">
                🧪 Molasses: <strong>{{ msg.actionCard.molassesGrams }} g</strong>
              </span>
            </div>

            <div class="hitl-meta font-mono">
              <span>Target Hardware: <strong>{{ msg.actionCard.targetDevice }}</strong></span>
            </div>

            <!-- Natural Language Guidance Hint -->
            <div v-if="msg.actionCard.status === 'pending' && msg.actionCard.hint" class="hitl-guidance-note font-mono">
              <span class="note-bulb">💡</span>
              <span>{{ msg.actionCard.hint }}</span>
            </div>

            <!-- Action Buttons for Supervisor -->
            <div v-if="msg.actionCard.status === 'pending'" class="hitl-buttons-row">
              <button 
                id="btn-hitl-approve"
                class="btn-action-agree"
                @click="authorizeAction(msg.actionCard)"
                title="Authorize and dispatch command directly to hardware and execution schedule"
              >
                <Check :size="14" class="btn-icon" />
                <span>APPROVE & DISPATCH TO EXECUTION</span>
              </button>

              <button 
                id="btn-hitl-cancel"
                class="btn-action-cancel"
                @click="cancelAction(msg.actionCard)"
                title="Reject and keep actuators on standby"
              >
                <X :size="14" class="btn-icon" />
                <span>REJECT</span>
              </button>
            </div>

            <!-- Resolved Status -->
            <div v-else-if="msg.actionCard.status === 'approved'" class="hitl-status-resolved success">
              <CheckCircle2 :size="15" />
              <span>Command authorized & logged in Daily Execution Hub. Dispatch telemetry transmitted to hardware.</span>
            </div>
            <div v-else class="hitl-status-resolved cancelled">
              <X :size="15" />
              <span>Command cancelled by supervisor. Actuators remain in standby mode.</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Thinking Indicator -->
      <div v-if="isThinking" class="message-bubble-wrapper assistant">
        <div class="msg-avatar assistant">
          <Bot :size="16" />
        </div>
        <div class="thinking-pill">
          <Sparkles :size="14" class="thinking-sparkle" />
          <span>Co-Pilot is analyzing telemetry & biofloc guidelines...</span>
        </div>
      </div>
    </div>

    <!-- Input Bar -->
    <div class="chat-input-bar">
      <div class="input-field-wrapper">
        <input 
          ref="commandInputRef"
          id="input-nlops-command"
          type="text" 
          v-model="inputMessage" 
          placeholder="Type an instruction or query (e.g. 'how is pond 1?', 'change afternoon feed to 15 kg', 'set aerator to 90%')..." 
          @keydown.enter="handleSend"
          autocomplete="off"
        />
        
        <button class="icon-tool-btn" title="Voice Command (Mic)">
          <Mic :size="16" />
        </button>
      </div>

      <button 
        id="btn-send-nlops"
        class="btn-send" 
        :disabled="!inputMessage.trim() || isThinking"
        @click="handleSend"
        title="Send Command"
      >
        <Send :size="16" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.nlops-chat-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 128px);
  min-height: 600px;
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-subtle);
  background: #ffffff;
}

.assistant-profile {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar-ring {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: var(--purple-50);
  border: 1px solid var(--purple-100);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--purple-600);
}

.profile-details {
  display: flex;
  flex-direction: column;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.assistant-name {
  font-size: 1rem;
  font-weight: 800;
  color: var(--text-primary);
}

.status-sub {
  font-size: 0.72rem;
  color: var(--emerald-600);
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

.pulse-dot.mini {
  width: 6px;
  height: 6px;
}

.mode-pill-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-surface-subtle);
  padding: 4px;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
}

.mode-label {
  font-size: 0.72rem;
  color: var(--text-muted);
  font-weight: 600;
  margin-left: 6px;
}

.mode-btn {
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  background: transparent;
  color: var(--text-muted);
}

.mode-btn.active {
  background: #ffffff;
  color: var(--sky-700);
  font-weight: 700;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

/* Messages Stream */
.chat-stream {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #fafbfc;
}

.message-bubble-wrapper {
  display: flex;
  gap: 12px;
  max-width: 85%;
}

.message-bubble-wrapper.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.msg-avatar {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.msg-avatar.assistant {
  background: var(--purple-100);
  color: var(--purple-700);
}

.msg-avatar.user {
  background: var(--sky-100);
  color: var(--sky-700);
}

.msg-content-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.msg-sender-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
}

.user .msg-sender-info {
  justify-content: flex-end;
}

.sender-name {
  font-weight: 700;
  color: var(--text-secondary);
}

.msg-time {
  color: var(--text-subtle);
}

.msg-body {
  padding: 14px 18px;
  border-radius: 12px;
  font-size: 0.88rem;
  line-height: 1.55;
}

.assistant .msg-body {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  box-shadow: var(--shadow-xs);
}

.assistant .msg-body.briefing-card {
  background: linear-gradient(145deg, #ffffff 0%, #f0fdf4 100%);
  border: 1px solid var(--emerald-200);
  box-shadow: var(--shadow-xs);
}

.user .msg-body {
  background: var(--sky-600);
  color: #ffffff;
  border-bottom-right-radius: 2px;
  box-shadow: 0 1px 3px rgba(2, 132, 199, 0.3);
}

/* Rich Markdown Rendering for Tables, Lists, and Headings */
.msg-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
  font-size: 0.82rem;
  background: #f8fafc;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
}

.msg-body :deep(th) {
  background: #f1f5f9;
  color: var(--text-secondary);
  font-weight: 700;
  text-align: left;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-subtle);
}

.msg-body :deep(td) {
  padding: 8px 12px;
  border-bottom: 1px solid #f1f5f9;
  color: var(--text-primary);
}

.msg-body :deep(tr:last-child td) {
  border-bottom: none;
}

.msg-body :deep(tr:nth-child(even)) {
  background: #ffffff;
}

.msg-body :deep(ul), .msg-body :deep(ol) {
  margin: 8px 0;
  padding-left: 20px;
}

.msg-body :deep(li) {
  margin-bottom: 4px;
}

.msg-body :deep(h1), .msg-body :deep(h2), .msg-body :deep(h3), .msg-body :deep(h4) {
  margin: 12px 0 6px 0;
  font-weight: 700;
  color: var(--text-primary);
}

.msg-body :deep(p) {
  margin-bottom: 8px;
}

.msg-body :deep(p:last-child) {
  margin-bottom: 0;
}

.msg-body :deep(hr) {
  margin: 12px 0;
  border: none;
  border-top: 1px solid var(--border-subtle);
}

/* HITL Action Card */
.hitl-action-card {
  margin-top: 10px;
  padding: 16px 18px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid var(--amber-300);
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.hitl-action-card.is-critical {
  border-color: #f43f5e;
  background: linear-gradient(180deg, #fff1f2 0%, #ffffff 100%);
  box-shadow: 0 0 0 2px rgba(244, 63, 94, 0.2), var(--shadow-sm);
}

.hitl-action-card.status-approved {
  border-color: var(--emerald-300);
  background: #f0fdf4;
}

.hitl-action-card.status-cancelled {
  border-color: var(--rose-300);
  background: #fff1f2;
}

.hitl-params-pill-grid {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin: 2px 0;
}

.param-tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 9px;
  border-radius: 6px;
  font-size: 0.74rem;
}

.param-tag.feed {
  background: rgba(16, 185, 129, 0.1);
  color: #047857;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.param-tag.aerate {
  background: rgba(14, 165, 233, 0.1);
  color: #0369a1;
  border: 1px solid rgba(14, 165, 233, 0.3);
}

.param-tag.molasses {
  background: rgba(168, 85, 247, 0.1);
  color: #7e22ce;
  border: 1px solid rgba(168, 85, 247, 0.3);
}

.hitl-guidance-note {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 0.72rem;
  line-height: 1.4;
  color: #475569;
  background: rgba(245, 158, 11, 0.08);
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px dashed rgba(245, 158, 11, 0.3);
}

.note-bulb {
  flex-shrink: 0;
}

.hitl-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hitl-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hitl-icon {
  color: var(--amber-600);
}

.hitl-title {
  font-weight: 800;
  font-size: 0.9rem;
  color: var(--amber-800);
}

.hitl-desc {
  font-size: 0.84rem;
  color: var(--text-primary);
  line-height: 1.45;
}

.hitl-meta {
  font-size: 0.74rem;
  color: var(--text-muted);
}

.hitl-buttons-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 6px;
}

.hitl-buttons-row .btn-action-agree,
.hitl-buttons-row .btn-action-cancel {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 0.82rem;
  line-height: 1;
}

.hitl-buttons-row .btn-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  display: inline-block;
  vertical-align: middle;
}

.hitl-status-resolved {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  padding: 8px 12px;
  border-radius: 6px;
  font-weight: 600;
}

.hitl-status-resolved.success {
  background: var(--emerald-100);
  color: var(--emerald-800);
}

.hitl-status-resolved.cancelled {
  background: var(--rose-100);
  color: var(--rose-800);
}

/* Thinking Indicator */
.thinking-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--purple-50);
  border: 1px solid var(--purple-200);
  color: var(--purple-700);
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 600;
}

.thinking-sparkle {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.9); opacity: 0.6; }
  50% { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(0.9); opacity: 0.6; }
}

/* Quick Prompts Chips */
.prompt-chips-tray {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-top: 1px solid var(--border-subtle);
  background: #ffffff;
  overflow-x: auto;
  white-space: nowrap;
}

.chips-label {
  font-size: 0.72rem;
  color: var(--text-muted);
  font-weight: 700;
}

.chip-btn {
  background: var(--bg-surface-subtle);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  transition: all 0.15s ease;
}

.chip-btn:hover {
  background: var(--sky-50);
  color: var(--sky-700);
  border-color: var(--sky-200);
}

.chip-btn.chip-critical {
  background: rgba(244, 63, 94, 0.08);
  border-color: rgba(244, 63, 94, 0.35);
  color: #e11d48;
  font-weight: 700;
}

.chip-btn.chip-critical:hover {
  background: rgba(244, 63, 94, 0.16);
  border-color: #f43f5e;
  transform: translateY(-1px);
}

/* Input Bar */
.chat-input-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-top: 1px solid var(--border-subtle);
  background: #ffffff;
}

.input-field-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  background: var(--bg-surface-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 4px 12px;
  transition: all 0.2s ease;
}

.input-field-wrapper:focus-within {
  border-color: var(--sky-500);
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.12);
}

.input-field-wrapper input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 0.88rem;
  padding: 8px 4px;
  font-family: inherit;
}

.input-field-wrapper input::placeholder {
  color: var(--text-subtle);
}

.icon-tool-btn {
  background: transparent;
  color: var(--text-subtle);
  padding: 4px;
}
.icon-tool-btn:hover {
  color: var(--sky-600);
}

.btn-send {
  background: var(--sky-600);
  color: #ffffff;
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(2, 132, 199, 0.3);
}

.btn-send:hover:not(:disabled) {
  background: var(--sky-700);
}

.btn-send:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
