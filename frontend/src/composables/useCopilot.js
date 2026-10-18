import { ref, watch, onMounted, onUnmounted } from 'vue'
import { usePonds } from './usePonds'
import { useDailyExecution } from './useDailyExecution'
import { useToast } from './useToast'
import { apiClient } from '../services/apiClient'
import { frontendMqttClient } from '../services/mqttClient'

export function useCopilot() {
  const { activePond, triggerFeeder, setAeratorBoost, triggerMolassesDosing } = usePonds()
  const { executeNewIoTAction, approveRecommendation, loadExecutionsFromDatabase } = useDailyExecution()
  const { showToast } = useToast()

  const isThinking = ref(false)
  const autoPilotMode = ref(false) // Co-Pilot (HITL) vs Auto-Pilot

  // Initial messages featuring simplified Morning Alert with Health Score & Telemetry & Actions
  const messages = ref([
    {
      id: 'm1',
      role: 'assistant',
      senderName: 'Co-Pilot',
      timestamp: '07:30 WIB',
      isBriefing: true,
      text: `☀️ **DAILY MORNING BRIEFING — POND 1**

🌿 **Health Score**: **98/100 (Optimal Biofloc Ecosystem)**

📊 **Current Telemetry Data:**
• **Dissolved Oxygen (DO)**: 6.40 mg/L *(Safe & Optimal)*
• **Water Temperature**: 28.5°C | **pH**: 7.62
• **Ammonia (TAN)**: 0.015 ppm *(Clean & Safe)*
• **Biofloc Density**: 14.0 mL/L *(Healthy Microbial Floc)*

📋 **Today's Prescriptive Action Plan:**
1. **Feeding**: Dispense 11.2 kg BioGrow-7 floating pellets (Window 14:30 WIB).
2. **Aerator Speed**: Maintain at 80% VFD (~1,200 RPM) to sustain stable DO.
3. **Molasses**: Preserved on STANDBY (0 g) — Biofloc density optimal (14.0 mL/L). Molasses strictly limited to 1-3 applications.
4. **Siphon / Flush**: Standby (zero bottom sludge purge needed today).`,
      actionCard: {
        id: 'act-morning-k01',
        title: 'Supervisor Authorization: Daily Morning Treatment Plan',
        pondId: 'K01',
        type: 'DAILY_PLAN',
        targetDevice: 'sac/pond001 (All IoT Actuators)',
        feedAmountKg: 11.2,
        aeratorPowerPercent: 80,
        molassesGrams: 0,
        description: 'Ready to lock today\'s protocol into execution: 11.2 kg feed, 80% aerator speed, molasses Standby.',
        status: 'pending',
        hint: 'Click Approve/Reject, or type your own instructions to adjust commands (e.g. "reduce feed to 8 kg", "aerator 90%").'
      }
    }
  ])

  // Load chat history from MySQL backend
  const loadChatHistory = async (pondId) => {
    try {
      const targetId = pondId || activePond.value?.id || 'K01'
      const history = await apiClient.getCopilotChatHistory(targetId, 50)
      if (history && history.length > 0) {
        messages.value = history.map(item => ({
          id: item.id,
          role: item.role,
          senderName: item.sender_name || (item.role === 'user' ? 'Supervisor (Ilfa)' : 'Co-Pilot'),
          timestamp: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' WIB',
          text: item.text,
          actionCard: item.action_card || null,
          metadata: item.metadata || null
        }))
      }
    } catch (err) {
      console.warn('[useCopilot] Error loading chat history:', err.message)
    }
  }

  // Handle incoming real-time MQTT chat diagnostic & adjustment messages
  const onMqttChatMessage = (event) => {
    if (!event || !event.data || !event.data.message) return
    const targetPondId = activePond.value?.id || 'K01'
    if (event.pondId && event.pondId !== targetPondId) return

    const newMsg = event.data.message
    const exists = messages.value.some(m => m.id === newMsg.id || (m.role === newMsg.role && m.text === newMsg.text))
    if (!exists) {
      messages.value.push({
        id: newMsg.id,
        role: newMsg.role,
        senderName: newMsg.sender_name || 'Co-Pilot',
        timestamp: new Date(newMsg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' WIB',
        text: newMsg.text,
        actionCard: newMsg.action_card || null,
        metadata: newMsg.metadata || null
      })
    }
  }

  onMounted(() => {
    frontendMqttClient.on('chat', onMqttChatMessage)
    if (activePond.value?.id) {
      loadChatHistory(activePond.value.id)
    }
  })

  onUnmounted(() => {
    frontendMqttClient.off('chat', onMqttChatMessage)
  })

  watch(() => activePond.value?.id, (newPondId) => {
    if (newPondId) {
      loadChatHistory(newPondId)
    }
  })

  // Find latest pending action card
  const getLatestPendingCard = () => {
    for (let i = messages.value.length - 1; i >= 0; i--) {
      if (messages.value[i].actionCard && messages.value[i].actionCard.status === 'pending') {
        return messages.value[i].actionCard
      }
    }
    return null
  }

  // Handle HITL action card authorization -> Translates directly to Daily Execution!
  const authorizeAction = (actionCard) => {
    if (!actionCard || actionCard.status !== 'pending') return

    actionCard.status = 'approved'
    const targetPondId = actionCard.pondId || activePond.value.id || 'K01'

    showToast(`✓ Action Authorized: Dispatched to ${actionCard.targetDevice}`, 'success')

    // Translate to real Daily Execution and hardware triggers
    if (actionCard.type === 'DAILY_PLAN') {
      // 1. Feeding scheduled
      executeNewIoTAction({
        pondId: targetPondId,
        category: 'FEEDING',
        actionName: 'Afternoon Feeding Window #3 (BioGrow-7 Pellets)',
        dosageText: `${actionCard.feedAmountKg || 11.2} kg BioGrow-7`,
        dosageAmount: Number(actionCard.feedAmountKg || 11.2),
        dosageUnit: 'kg',
        aeratorPowerPercent: Number(actionCard.aeratorPowerPercent || 80),
        aeratorRpm: Math.round(((actionCard.aeratorPowerPercent || 80) / 100) * 1500),
        actor: 'Co-Pilot (Authorized by Ilfa Hidayat)',
        status: 'SCHEDULED',
        time: '14:30 WIB',
        notes: 'Authorized from Co-Pilot Daily Morning Briefing.'
      })

      // 2. Aerator continuous
      executeNewIoTAction({
        pondId: targetPondId,
        category: 'AERATION',
        actionName: 'VFD Aeration Maintenance',
        dosageText: `${actionCard.aeratorPowerPercent || 80}% Power (~${Math.round(((actionCard.aeratorPowerPercent || 80) / 100) * 1500)} RPM)`,
        dosageAmount: Number(actionCard.aeratorPowerPercent || 80),
        dosageUnit: '%',
        aeratorPowerPercent: Number(actionCard.aeratorPowerPercent || 80),
        aeratorRpm: Math.round(((actionCard.aeratorPowerPercent || 80) / 100) * 1500),
        actor: 'Co-Pilot (Authorized by Ilfa Hidayat)',
        status: 'SUCCESS',
        time: '08:00 WIB',
        notes: 'VFD continuous life-support speed locked.'
      })

      // 3. Molasses scheduled
      executeNewIoTAction({
        pondId: targetPondId,
        category: 'MOLASSES',
        actionName: 'C:N 15:1 Microbial Carbon Balance Dosing',
        dosageText: `${actionCard.molassesGrams || 400} g Cane Molasses`,
        dosageAmount: Number(actionCard.molassesGrams || 400),
        dosageUnit: 'g',
        aeratorPowerPercent: Number(actionCard.aeratorPowerPercent || 80),
        actor: 'Co-Pilot (Authorized by Ilfa Hidayat)',
        status: 'SCHEDULED',
        time: '16:00 WIB',
        notes: 'Carbon supplement to maintain heterotrophic conversion.'
      })

      // Approve recommendation card in execution hub
      approveRecommendation(targetPondId)
    } else if (actionCard.type === 'EMERGENCY_HYPOXIA') {
      const pwr = Number(actionCard.aeratorPowerPercent || 100)
      const rpm = Math.round((pwr / 100) * 1500)
      setAeratorBoost(targetPondId, pwr, 'Co-Pilot Emergency Dispatch')

      // Record emergency action in Daily Execution Hub
      executeNewIoTAction({
        pondId: targetPondId,
        category: 'AERATION',
        actionName: '🚨 Emergency Hypoxia Mitigation (100% VFD Boost)',
        dosageText: `${pwr}% Power (~${rpm} RPM)`,
        dosageAmount: pwr,
        dosageUnit: '%',
        aeratorPowerPercent: pwr,
        aeratorRpm: rpm,
        actor: 'Co-Pilot Emergency Dispatch (Authorized by Ilfa Hidayat)',
        status: 'SUCCESS',
        notes: 'Immediate aerator boost triggered to counter DO drop. Auto-feed paused to reduce Biological Oxygen Demand (BOD).'
      })

      approveRecommendation(targetPondId)
    } else if (actionCard.type === 'FEEDER_DISPENSE') {
      const feedKg = Number(actionCard.amountKg || actionCard.feedAmountKg || 5.2)
      triggerFeeder(targetPondId, feedKg, 'Co-Pilot (Authorized by Ilfa Hidayat)')
      executeNewIoTAction({
        pondId: targetPondId,
        category: 'FEEDING',
        actionName: 'Supplemental Feed Ration Dispatch',
        dosageText: `${feedKg} kg BioGrow-7`,
        dosageAmount: feedKg,
        dosageUnit: 'kg',
        actor: 'Co-Pilot (Authorized by Ilfa Hidayat)',
        status: 'SUCCESS',
        notes: 'Dispatched from Co-Pilot chat prompt.'
      })
    } else if (actionCard.type === 'AERATOR_BOOST') {
      const pwr = Number(actionCard.powerPercent || 100)
      setAeratorBoost(targetPondId, pwr, 'Co-Pilot (Authorized by Ilfa Hidayat)')
      executeNewIoTAction({
        pondId: targetPondId,
        category: 'AERATION',
        actionName: 'VFD Aerator Speed Regulation',
        dosageText: `${pwr}% Power (~${Math.round((pwr / 100) * 1500)} RPM)`,
        dosageAmount: pwr,
        dosageUnit: '%',
        aeratorPowerPercent: pwr,
        aeratorRpm: Math.round((pwr / 100) * 1500),
        actor: 'Co-Pilot (Authorized by Ilfa Hidayat)',
        status: 'SUCCESS',
        notes: 'Aerator speed regulation from Co-Pilot.'
      })
    } else if (actionCard.type === 'MOLASSES_DOSE') {
      const grams = Number(actionCard.amountGrams || actionCard.molassesGrams || 250)
      triggerMolassesDosing(targetPondId, grams, 'Co-Pilot (Authorized by Ilfa Hidayat)')
      executeNewIoTAction({
        pondId: targetPondId,
        category: 'MOLASSES',
        actionName: 'Cane Molasses Injection',
        dosageText: `${grams} g Cane Molasses`,
        dosageAmount: grams,
        dosageUnit: 'g',
        actor: 'Co-Pilot (Authorized by Ilfa Hidayat)',
        status: 'SUCCESS',
        notes: 'Molasses injection from Co-Pilot.'
      })
    } else if (actionCard.type === 'PURGE_SLUDGE') {
      const vol = Number(actionCard.volumeLiters || 200)
      executeNewIoTAction({
        pondId: targetPondId,
        category: 'SIPHON_FLUSH',
        actionName: 'Bottom Anaerobic Sludge Evacuation',
        dosageText: `${vol} L Sludge Purge`,
        dosageAmount: vol,
        dosageUnit: 'L',
        actor: 'Co-Pilot (Authorized by Ilfa Hidayat)',
        status: 'SUCCESS',
        notes: 'Central sludge purge triggered from Co-Pilot.'
      })
    } else if (actionCard.type === 'PROBIOTIC_DOSE') {
      const grams = Number(actionCard.amountGrams || 150)
      executeNewIoTAction({
        pondId: targetPondId,
        category: 'MOLASSES',
        actionName: 'Nitrifying Probiotic Application',
        dosageText: `${grams} g Nitrifying Inoculant`,
        dosageAmount: grams,
        dosageUnit: 'g',
        actor: 'Co-Pilot (Authorized by Ilfa Hidayat)',
        status: 'SUCCESS',
        notes: 'Probiotic inoculant administered from Co-Pilot.'
      })
    } else if (actionCard.type === 'LIME_BUFFER') {
      const grams = Number(actionCard.amountGrams || 500)
      executeNewIoTAction({
        pondId: targetPondId,
        category: 'MAINTENANCE',
        actionName: 'Agricultural Lime (CaCO3) Buffer',
        dosageText: `${grams} g CaCO3`,
        dosageAmount: grams,
        dosageUnit: 'g',
        actor: 'Co-Pilot (Authorized by Ilfa Hidayat)',
        status: 'SUCCESS',
        notes: 'Alkalinity buffering applied from Co-Pilot.'
      })
    }

    // Add confirmation Co-Pilot message
    messages.value.push({
      id: 'm-' + Date.now(),
      role: 'assistant',
      senderName: 'Co-Pilot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      text: `✅ **Action Successfully Dispatched to Execution!**

Command has been officially authorized and transmitted to IoT hardware:
• **Target Hardware**: **${actionCard.targetDevice}**
• **Execution Hub Status**: **COMPLETED / SCHEDULED**
• **Authorized by**: Ilfa Hidayat (Farm Supervisor)

The command is now recorded in the Daily Execution Hub. You can verify its status directly on the **Execution** tab.`
    })
  }

  // Handle HITL action card cancellation
  const cancelAction = (actionCard) => {
    if (!actionCard || actionCard.status !== 'pending') return
    actionCard.status = 'cancelled'
    showToast(`✕ Action cancelled by supervisor`, 'info')

    messages.value.push({
      id: 'm-' + Date.now(),
      role: 'assistant',
      senderName: 'Co-Pilot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      text: `❌ Command for **${actionCard.targetDevice}** was cancelled by the supervisor. IoT actuators remain in standby mode.`
    })
  }

  // Trigger Critical Issue Simulation (Sudden DO Drop / Hypoxia Shock)
  const triggerCriticalIssueAlert = (pondId = 'K01') => {
    const pond = activePond.value
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' WIB'

    messages.value.push({
      id: 'crit-' + Date.now(),
      role: 'assistant',
      senderName: 'Co-Pilot (Emergency Guard)',
      timestamp: nowTime,
      text: `🚨 **CRITICAL ALERT: SUDDEN HYPOXIA DETECTED!**

⚠️ **Health Score Dropped**: **42/100 (CRITICAL / HIGH HYPOXIA RISK)**

📉 **Sensor Anomaly Spike (Pond 1):**
• **Dissolved Oxygen (DO)**: **3.20 mg/L** ⚠️ *(Below critical safety threshold of 5.0 mg/L)*
• **Water Temperature**: **29.8°C** *(Fish & floc respiration sharply elevated)*
• **pH Level**: 7.32 | **TAN (Ammonia)**: 0.042 ppm
• **Sensor Node**: \`sac/pond001/sensor_do\` (Status: ALERT ACTIVE)
• **Fish Behavior**: Surface piping / gasping behavior detected!

🛡️ **Emergency Mitigation Protocol:**
1. **Aerator Boost 100%**: Immediately increase VFD aerator to full throttle **100% (1,500 RPM)**.
2. **Pause Feeding**: Temporarily halt automatic feeding to cut Biological Oxygen Demand (BOD).
3. **Micro-bubble Bypass**: Open auxiliary aeration lines.

*Supervisor can directly click Approve, Reject, or type adjustment instructions (e.g. "set aerator to 90%").*`,
      actionCard: {
        id: 'act-crit-' + Date.now(),
        title: '🚨 Authorize Emergency Hypoxia Mitigation',
        pondId: pond.id || 'K01',
        type: 'EMERGENCY_HYPOXIA',
        aeratorPowerPercent: 100,
        feedPause: true,
        targetDevice: 'sac/pond001/aerator (ESP32-K01-AR)',
        description: 'Boost aerator speed to 100% (1,500 RPM) and pause feeder immediately to restore DO to safe levels > 5.5 mg/L.',
        status: 'pending',
        hint: 'Click Approve/Reject, or type your own instructions to adjust (e.g. "set aerator to 90%").'
      }
    })
    showToast(`🚨 CRITICAL ALERT: Low DO (3.2 mg/L) detected in ${pond.name}!`, 'error')
  }

  // Send message and trigger agentic response with natural language adjustment & Function Calling
  const sendMessage = async (rawInput) => {
    if (!rawInput.trim() || isThinking.value) return

    const userText = rawInput.trim()
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' WIB'
    const pond = activePond.value
    const lower = userText.toLowerCase()
    const pendingCard = getLatestPendingCard()

    // Push User message
    messages.value.push({
      id: 'u-' + Date.now(),
      role: 'user',
      senderName: 'Supervisor (Ilfa)',
      timestamp: nowTime,
      text: userText
    })

    // 1. Quick simulation shortcut: Critical Issue Simulation
    if (lower.includes('critical') || lower.includes('darurat') || lower.includes('hypoxia') || lower.includes('simulasi issue') || lower.includes('emergency') || lower.includes('simulate')) {
      triggerCriticalIssueAlert(pond.id)
      return
    }

    // 2. Quick shortcut: Approve pending action card
    if (pendingCard && (lower === 'approve' || lower === 'setujui' || lower === 'jalankan' || lower === 'eksekusi' || lower === 'ok' || lower === 'oke' || lower === 'yes')) {
      authorizeAction(pendingCard)
      return
    }

    // 3. Quick shortcut: Reject pending action card
    if (pendingCard && (lower === 'reject' || lower === 'tolak' || lower === 'batalkan' || lower === 'cancel' || lower === 'batal' || lower === 'no')) {
      cancelAction(pendingCard)
      return
    }

    isThinking.value = true

    try {
      // Primary Agentic Call: Call backend Gemini Function Calling & Biofloc RAG Engine
      const apiRes = await apiClient.chatWithCopilot(userText, pond.id)
      isThinking.value = false

      let replyText = apiRes?.reply || `Instruction "${userText}" processed for ${pond.name}.`
      let newActionCard = apiRes?.actionCard || null

      // If backend executed a tool directly:
      if (apiRes?.toolExecuted) {
        const { name, result } = apiRes.toolExecuted
        console.log(`[Copilot FE] Backend executed tool: ${name}`, result)

        if (name === 'adjust_daily_treatment') {
          showToast(`✓ Schedule ${result?.taskTitle || 'Task'} updated: ${result?.newDosage}`, 'success')
        } else if (name === 'run_daily_treatment_now') {
          showToast(`🚀 Action ${result?.message || 'executed'}`, 'success')
        } else if (name === 'approve_all_treatments') {
          showToast(`✓ All action plans approved (${result?.approvedCount || 0} tasks)`, 'success')
        } else if (name === 'adjust_aerator_vfd' && result?.powerPercent) {
          setAeratorBoost(pond.id, result.powerPercent, 'Co-Pilot Tool Execution')
          showToast(`⚡ Aerator VFD regulated to ${result.powerPercent}% (~${result.rpm} RPM)`, 'success')
        } else if (name === 'dispense_feed' && result?.amountKg) {
          triggerFeeder(pond.id, result.amountKg, 'Co-Pilot Tool Execution')
          showToast(`🐟 Feed ${result.amountKg} kg dispensed to ${pond.name}`, 'success')
        } else if (name === 'dose_molasses' && result?.amountGrams && result.status !== 'REJECTED') {
          triggerMolassesDosing(pond.id, result.amountGrams, 'Co-Pilot Tool Execution')
          showToast(`🧪 Molasses ${result.amountGrams}g injected (Application ${result.molassesCount || 1}/3)`, 'success')
        } else if (name === 'dose_molasses' && result?.status === 'REJECTED') {
          showToast('⚠️ Molasses quota limit (3x) reached! Standby per Biofloc SOP.', 'warning')
        }

        // Refresh execution database
        if (loadExecutionsFromDatabase) {
          loadExecutionsFromDatabase(pond.id).catch(() => {})
        }
      }

      // If actionCard requires supervisor approval:
      if (newActionCard && autoPilotMode.value) {
        authorizeAction(newActionCard)
      }

      const exists = messages.value.some(m => (apiRes?.messageId && m.id === apiRes.messageId) || (m.role === 'assistant' && m.text === replyText))
      if (!exists) {
        messages.value.push({
          id: apiRes?.messageId || ('m-' + Date.now()),
          role: 'assistant',
          senderName: 'Co-Pilot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' WIB',
          text: replyText,
          actionCard: autoPilotMode.value ? null : newActionCard
        })
      }
    } catch (err) {
      console.warn('[Copilot Chat Error]', err)
      isThinking.value = false

      // Fallback response with pond telemetry
      messages.value.push({
        id: 'm-' + Date.now(),
        role: 'assistant',
        senderName: 'Co-Pilot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' WIB',
        text: `🤖 **Co-Pilot (${pond.name}):**\n\nInstruction "${userText}" received. Active telemetry: DO ${pond.telemetry.do} mg/L, pH ${pond.telemetry.ph}, Temp ${pond.telemetry.temp}°C, TAN ${pond.telemetry.ammonia} ppm. All parameters remain within biofloc operational envelope.`
      })
    }
  }

  return {
    messages,
    isThinking,
    autoPilotMode,
    sendMessage,
    authorizeAction,
    cancelAction,
    triggerCriticalIssueAlert,
    loadChatHistory
  }
}
