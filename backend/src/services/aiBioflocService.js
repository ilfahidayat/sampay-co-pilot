import { geminiClient } from '../infrastructure/gemini/geminiClient.js'
import {
  BIOFLOC_AI_ROLE,
  BIOFLOC_KNOWLEDGE_BASE,
  BIOFLOC_THRESHOLDS,
  REALTIME_EVALUATION_SCHEMA,
  DAILY_EXECUTION_SYNTHESIS_SCHEMA,
  GEMINI_BIOFLOC_TOOLS,
  buildBioflocRagContext
} from '../infrastructure/gemini/bioflocKnowledgeBase.js'
import { aiAnalysisRepository } from '../repositories/aiAnalysisRepository.js'
import { pondRepository } from '../repositories/pondRepository.js'
import { executionRepository } from '../repositories/executionRepository.js'
import { copilotMessageRepository } from '../repositories/copilotMessageRepository.js'
import { mqttClient } from '../infrastructure/mqtt/mqttClient.js'
import { executionService } from './executionService.js'

const lastActionDispatched = new Map()
const lastCopilotChatBroadcast = new Map()

export class AiBioflocService {
  /**
   * 1. Real-time Telemetry Evaluation
   * Triggered on every incoming sensor telemetry packet from sac/{pondId}/telemetry
   */
  async evaluateRealtimeTelemetry(pondId, telemetry) {
    const pond = await pondRepository.findById(pondId)
    if (!pond) return null

    const doVal = Number(telemetry.dissolved_oxygen || telemetry.do || 0)
    const phVal = Number(telemetry.ph || 7.0)
    const tempVal = Number(telemetry.temperature || telemetry.temp || 28.0)
    const ammoniaVal = Number(telemetry.ammonia || 0.0)
    const flocVal = Number(telemetry.floc_density || telemetry.flocDensity || 15.0)

    // Biofloc Threshold & Anomaly Detection
    const anomalies = []
    let calculatedScore = 98
    let status = 'OPTIMAL'

    if (doVal < 3.5) {
      anomalies.push({ parameter: 'DO', severity: 'CRITICAL', value: doVal, optimal: '5.0 - 7.5 mg/L', issue: 'Severe hypoxia hazard' })
      calculatedScore -= 35
      status = 'CRITICAL'
    } else if (doVal < 5.0) {
      anomalies.push({ parameter: 'DO', severity: 'WARNING', value: doVal, optimal: '5.0 - 7.5 mg/L', issue: 'Below biofloc microbial respiration target' })
      calculatedScore -= 15
      if (status !== 'CRITICAL') status = 'WARNING'
    }

    if (ammoniaVal > 0.8) {
      anomalies.push({ parameter: 'Ammonia', severity: 'CRITICAL', value: ammoniaVal, optimal: '< 0.05 ppm', issue: 'Toxic free ammonia TAN accumulation' })
      calculatedScore -= 30
      status = 'CRITICAL'
    } else if (ammoniaVal > 0.05) {
      anomalies.push({ parameter: 'Ammonia', severity: 'WARNING', value: ammoniaVal, optimal: '< 0.05 ppm', issue: 'Elevated TAN requiring carbon addition' })
      calculatedScore -= 12
      if (status !== 'CRITICAL') status = 'WARNING'
    }

    if (phVal < 6.8 || phVal > 8.4) {
      anomalies.push({ parameter: 'pH', severity: 'WARNING', value: phVal, optimal: '7.2 - 8.2', issue: 'Alkalinity / pH stress on nitrifying bacteria' })
      calculatedScore -= 10
      if (status !== 'CRITICAL') status = 'WARNING'
    }

    if (flocVal > 25.0) {
      anomalies.push({ parameter: 'FlocDensity', severity: 'WARNING', value: flocVal, optimal: '10 - 25 mL/L', issue: 'Excess suspended solids, bottom siphon recommended' })
      calculatedScore -= 8
    }

    calculatedScore = Math.max(20, Math.min(100, calculatedScore))

    let summary = ''
    let immediateAction = null

    // Try Gemini API if key is configured (or mock engine)
    if (geminiClient.hasApiKey()) {
      const systemInstruction = `${BIOFLOC_AI_ROLE}

AVNIMELECH BIOFLOC KNOWLEDGE BASE & SOP PROTOCOLS:
- Science Principles: ${JSON.stringify(BIOFLOC_KNOWLEDGE_BASE.sciencePrinciples)}
- Operating Thresholds: ${JSON.stringify(BIOFLOC_KNOWLEDGE_BASE.standardOperatingLimits)}
- SOP Aeration: ${(BIOFLOC_KNOWLEDGE_BASE.sops.SOP_AERATION?.instructions || BIOFLOC_KNOWLEDGE_BASE.sops.SOP_AERATION?.rules || []).join(' ')}
- SOP Molasses (C:N 15:1): ${(BIOFLOC_KNOWLEDGE_BASE.sops.SOP_MOLASSES?.instructions || BIOFLOC_KNOWLEDGE_BASE.sops.SOP_MOLASSES?.rules || []).join(' ')}
- SOP Siphon Purge: ${(BIOFLOC_KNOWLEDGE_BASE.sops.SOP_SIPHON?.instructions || BIOFLOC_KNOWLEDGE_BASE.sops.SOP_SIPHON?.rules || []).join(' ')}

Enforce strict scientific consistency. Output strictly JSON matching the required schema.`

      const prompt = `Evaluate real-time water quality sensor telemetry for ${pond.name} (${pond.id}):
Pond Biometrics:
- Species: ${pond.species}
- Culture Phase: ${pond.phase} (Day of Culture: ${pond.doc})
- Volume: ${pond.volume_m3} m3
- Estimated Biomass: ${(pond.avg_weight_grams * pond.fish_count / 1000).toFixed(1)} kg
Current Sensor Readings:
- Dissolved Oxygen (DO): ${doVal.toFixed(2)} mg/L (Avnimelech Target: 5.0 - 7.5 mg/L)
- pH: ${phVal.toFixed(2)} (Target: 7.2 - 8.2)
- Temperature: ${tempVal.toFixed(1)} °C (Target: 27.0 - 30.5 °C)
- Ammonia TAN: ${ammoniaVal.toFixed(3)} ppm (Target: < 0.05 ppm)
- Biofloc Imhoff Density: ${flocVal.toFixed(1)} mL/L (Target: 10 - 20 mL/L)
- Detected Anomalies: ${JSON.stringify(anomalies)}

Respond strictly in structured JSON schema.`

      const geminiResult = await geminiClient.generateJsonContent({
        systemInstruction,
        prompt,
        schema: REALTIME_EVALUATION_SCHEMA
      })
      if (geminiResult && geminiResult.summary) {
        summary = geminiResult.summary
        calculatedScore = geminiResult.healthScore || calculatedScore
        status = geminiResult.status || status
        immediateAction = geminiResult.immediateAction || null
      }
    }

    // Heuristic Fallback if Gemini is offline or not set
    if (!summary) {
      if (status === 'CRITICAL') {
        summary = `Critical water quality hazard detected: Dissolved Oxygen (${doVal.toFixed(2)} mg/L) or Ammonia (${ammoniaVal.toFixed(3)} ppm) breached survival limits. Immediate actuator intervention required.`
        immediateAction = {
          needed: true,
          category: doVal < 4.0 ? 'AERATION' : 'SIPHON_FLUSH',
          command: doVal < 4.0 ? 'SET_AERATOR_SPEED' : 'PURGE_SLUDGE',
          dosage: doVal < 4.0 ? '100% VFD Power' : '200 L bottom flush',
          reasoning: 'Prevent imminent mortality from hypoxia or acute ammonia toxicity.'
        }
      } else if (status === 'WARNING') {
        summary = `Minor water parameter deviation: Ammonia is ${ammoniaVal.toFixed(3)} ppm with DO at ${doVal.toFixed(2)} mg/L. Microorganisms require C:N carbon rebalancing.`
        immediateAction = {
          needed: true,
          category: 'MOLASSES',
          command: 'DOSE_MOLASSES',
          dosage: '250 g',
          reasoning: 'Stimulate heterotrophic bacterial assimilation of total ammonia nitrogen.'
        }
      } else {
        summary = `All water quality parameters are within optimal biofloc range. DO is healthy at ${doVal.toFixed(2)} mg/L and biofloc density is ${flocVal.toFixed(1)} mL/L.`
      }
    }

    // Persist AI diagnosis
    const analysisRecord = await aiAnalysisRepository.insertAnalysis({
      pond_id: pondId,
      trigger_type: 'REALTIME_TELEMETRY',
      health_score: calculatedScore,
      health_status: status,
      summary,
      telemetry_snapshot: { do: doVal, ph: phVal, temp: tempVal, ammonia: ammoniaVal, flocDensity: flocVal },
      anomalies_detected: anomalies,
      recommendation_payload: immediateAction,
      model_used: geminiClient.hasApiKey() ? geminiClient.modelName : 'Avnimelech-Heuristic-Engine'
    })

    // Update pond health score and status in database
    await pondRepository.updateHealthAndStatus(pondId, calculatedScore, status)

    console.log(`├── [CORE AI EVALUATION] Engine: ${geminiClient.hasApiKey() ? geminiClient.modelName : 'Avnimelech Specialist'} ──`)
    console.log(`│ • Biometrics In : ${pond.species} | Biomass=${((pond.avg_weight_grams * pond.fish_count) / 1000).toFixed(1)} kg | Vol=${pond.volume_m3} m³`)
    console.log(`│ • AI Output     : Health Score=${calculatedScore}/100 | Status=${status} | Anomalies=${anomalies.length}`)
    console.log(`│ • AI Diagnosa   : "${summary}"`)
    if (immediateAction && immediateAction.needed) {
      console.log(`│ • Immediate Act : ⚡ ${immediateAction.category} -> ${immediateAction.command} (${immediateAction.dosage}) [Dispatched]`)
    } else {
      console.log(`│ • Immediate Act : Standby (All parameters optimal within safe thresholds)`)
    }
    console.log(`│ • Database Save : ai_analyses (Record #${analysisRecord.id}) & pond health_score updated`)

    // 1. Dispatch Immediate Action to IoT Simulator if needed (with 30s throttle)
    if (immediateAction && immediateAction.needed === true) {
      const now = Date.now()
      const last = lastActionDispatched.get(pondId)
      if (!last || (now - last.timestamp > 30000) || last.category !== immediateAction.category) {
        lastActionDispatched.set(pondId, { timestamp: now, category: immediateAction.category })

        let action = null
        let params = {}

        if (immediateAction.category === 'AERATION') {
          action = 'aerator'
          params = { state: 'running', powerPercent: immediateAction.powerPercent || 100 }
        } else if (immediateAction.category === 'MOLASSES') {
          action = 'molasses'
          params = { dose: 250, unit: 'ml' }
        } else if (immediateAction.category === 'SIPHON_FLUSH') {
          action = 'siphon'
          params = { volume: 200, unit: 'liter' }
        } else if (immediateAction.category === 'FEEDING') {
          action = 'feed'
          params = { dose: 50, unit: 'g' }
        }

        if (action) {
          executionService.dispatchIoTCommand(pondId, {
            action,
            params,
            actor: `Gemini AI Engine (${geminiClient.modelName})`,
            notes: `Auto-dispatched: ${immediateAction.reasoning || summary}`
          }).catch(err => {
            console.warn(`[AI Action] Failed to dispatch action for ${pondId}:`, err.message)
          })
        }
      }
    }

    // 2. Broadcast Processed Telemetry with Gemini Evaluation via MQTT
    mqttClient.publishProcessedTelemetry(pondId, {
      pond_id: pondId,
      timestamp: new Date().toISOString(),
      telemetry: {
        do: doVal,
        ph: phVal,
        temp: tempVal,
        ammonia: ammoniaVal,
        flocDensity: flocVal
      },
      ai: {
        healthScore: calculatedScore,
        status,
        summary,
        anomalies,
        modelUsed: geminiClient.hasApiKey() ? geminiClient.modelName : 'Avnimelech-Heuristic-Engine',
        immediateAction
      }
    })

    // 3. Broadcast Notification if Warning or Critical
    if (status !== 'OPTIMAL') {
      mqttClient.publishNotification({
        id: `notif-${pondId}-${Date.now()}`,
        pondId,
        type: 'AI_DIAGNOSTIC_ALERT',
        severity: status,
        title: `AI Alert: Pond ${pondId} (${status})`,
        message: summary,
        action: immediateAction,
        timestamp: new Date().toISOString()
      })
    }

    // 4. Persist Tuned Co-Pilot Diagnostic Message & Broadcast to Chat
    try {
      const lastChat = lastCopilotChatBroadcast.get(pondId)
      const isStatusChanged = !lastChat || lastChat.status !== status
      const isActionNeeded = immediateAction && immediateAction.needed
      const isTimeElapsed = !lastChat || (Date.now() - lastChat.time > 45000)

      if (isStatusChanged || isActionNeeded || isTimeElapsed) {
        lastCopilotChatBroadcast.set(pondId, { time: Date.now(), status })

        const formattedDoStatus = doVal < 4.0 ? '🚨 (CRITICAL - Hypoxia)' : (doVal < 5.0 ? '⚠️ (Low Caution)' : '✓ (Optimal)')
        const formattedAmmoniaStatus = ammoniaVal > 0.15 ? '⚠️ (Elevated)' : '✓ (Safe)'
        const formattedFlocStatus = flocVal > 20.0 ? '⚠️ (High - Siphon Needed)' : '✓ (Healthy)'

        const chatText = `📊 **Telemetry Update & Biofloc Diagnostic — ${pond.name} (${pondId})**

🌿 **Health Score**: **${calculatedScore}/100 (${status})**

📈 **Current Water Quality Parameters:**
• **Dissolved Oxygen (DO)**: **${doVal.toFixed(2)} mg/L** ${formattedDoStatus}
• **pH Level**: **${phVal.toFixed(2)}** | **Temperature**: **${tempVal.toFixed(1)}°C**
• **Total Ammonia Nitrogen (TAN)**: **${ammoniaVal.toFixed(3)} ppm** ${formattedAmmoniaStatus}
• **Floc Density (Imhoff Cone)**: **${flocVal.toFixed(1)} mL/L** ${formattedFlocStatus}

🧠 **Biofloc Diagnosis (Gemini AI):**
"${summary}"

${immediateAction && immediateAction.needed 
  ? `⚡ **Emergency Action Dispatched**: **${immediateAction.category}** (${immediateAction.dosage}).`
  : '📋 **Action Status**: All biological parameters are stable within safe biofloc thresholds.'}`

        let chatActionCard = null
        if (immediateAction && immediateAction.needed) {
          chatActionCard = {
            id: `act-tele-${Date.now()}`,
            title: `🚨 Emergency Protocol: ${immediateAction.category}`,
            pondId,
            type: immediateAction.category,
            targetDevice: `sac/${pondId.toLowerCase()}`,
            description: immediateAction.reasoning || summary,
            status: 'approved',
            hint: 'Automatically dispatched by AI Guard.'
          }
        }

        const copilotMsg = await copilotMessageRepository.insert({
          pond_id: pondId,
          role: 'assistant',
          sender_name: 'Co-Pilot (Gemini AI)',
          message_type: status === 'CRITICAL' ? 'CRITICAL_ALERT' : 'TELEMETRY_DIAGNOSTIC',
          text: chatText,
          action_card: chatActionCard,
          metadata: {
            healthScore: calculatedScore,
            status,
            telemetry: { do: doVal, ph: phVal, temp: tempVal, ammonia: ammoniaVal, flocDensity: flocVal },
            immediateAction
          }
        })

        mqttClient.publishCopilotMessage(pondId, copilotMsg)
      }
    } catch (chatSaveErr) {
      console.warn(`[Copilot Chat Persistence] Failed for ${pondId}:`, chatSaveErr.message)
    }

    return analysisRecord
  }

  /**
   * Synthesize & Maintain Daily Biofloc Execution Plan based on live telemetry & Avnimelech models
   * Strictly 4 action categories:
   * 1. FEEDING: 3 times a day (Morning 08:30 WIB, Afternoon 14:00 WIB, Evening 18:00 WIB)
   * 2. MOLASSES: As needed based on TAN / C:N 15:1 ratio
   * 3. SIPHON_FLUSH: As needed based on Imhoff cone floc density (>20 mL/L)
   * 4. AERATION: VFD speed regulation based on DO respiration demand
   */
  async synthesizeDailyExecutionPlan(pondId, telemetry = {}) {
    const pond = await pondRepository.findById(pondId)
    if (!pond) return null

    const todayStr = new Date().toISOString().split('T')[0]
    const doVal = Number(telemetry.dissolved_oxygen ?? telemetry.do ?? 6.0)
    const phVal = Number(telemetry.ph ?? 7.5)
    const tempVal = Number(telemetry.temperature ?? telemetry.temp ?? 28.5)
    const ammoniaVal = Number(telemetry.ammonia ?? 0.02)
    const flocVal = Number(telemetry.floc_density ?? telemetry.flocDensity ?? 15.0)

    const fishCount = pond.fish_count || 2000
    const avgWeight = pond.avg_weight_grams || 350
    const biomassKg = (fishCount * avgWeight) / 1000
    // Biofloc tilapia feeding ration: ~2.4% body weight per day
    const dailyFeedKg = +(biomassKg * 0.024).toFixed(1)
    const feed1Kg = +(dailyFeedKg * 0.3).toFixed(1)
    const feed2Kg = +(dailyFeedKg * 0.4).toFixed(1)
    const feed3Kg = +(dailyFeedKg * 0.3).toFixed(1)

    // Molasses calculation (Avnimelech C:N 15:1)
    // Rule: Pemberian molases dibatasi cukup 1 sampai 3 kali saja per siklus.
    const historicalMolasses = await executionRepository.findByPondId(pondId, { category: 'MOLASSES' })
    const historicalMolassesCount = historicalMolasses.filter(e => e.status === 'SUCCESS' || e.status === 'RUNNING').length
    const isMolassesQuotaReached = historicalMolassesCount >= 3
    const isMolassesNeeded = !isMolassesQuotaReached && (ammoniaVal > 0.15 || flocVal < 10.0)
    const baseMolassesGrams = Math.round(dailyFeedKg * 0.30 * 0.16 * 1.25 / 0.45 * 100)
    const molassesGrams = isMolassesNeeded ? Math.min(450, Math.max(250, baseMolassesGrams)) : 0

    // Siphon calculation: only needed if floc density > 20 mL/L or ammonia > 0.5 ppm
    const isSiphonNeeded = flocVal > 20.0 || ammoniaVal > 0.5
    const siphonVolumeLiters = isSiphonNeeded ? 200 : 0

    // Aerator power calculation: based on DO
    let aeratorPower = 80
    if (doVal < 4.0) {
      aeratorPower = 100 // Emergency boost
    } else if (doVal < 5.0) {
      aeratorPower = 90
    } else if (doVal > 7.5) {
      aeratorPower = 70 // Eco / Saturated
    }
    const aeratorRpm = Math.round(aeratorPower * 15)

    // Desired Daily Treatment Schedule (Strictly 4 essential biofloc treatments in chronological sequence)
    // 1. Aerator Speed Control (06:00 WIB)
    // 2. Feed Dispense #1 Morning (08:00 WIB)
    // 3. Water Exchange & Sludge Siphon (10:30 WIB)
    // 4. Feed Dispense #2 Noon (12:30 WIB)
    // 5. Molasses Injection C:N 15:1 (14:30 WIB)
    // 6. Feed Dispense #3 Afternoon (17:00 WIB)
    const desiredActions = [
      {
        slotKey: 'AERATION_SPEED',
        category: 'AERATION',
        title: `Aerator Speed Control (VFD ${aeratorPower}% Power)`,
        dosage_amount: aeratorPower,
        dosage_unit: '%',
        aerator_power_percent: aeratorPower,
        aerator_rpm: aeratorRpm,
        scheduled_time: '06:00 WIB',
        notes: `Calibration of aerator VFD inverter frequency (~${aeratorRpm} RPM / ${((aeratorPower/100)*50).toFixed(1)} Hz) based on DO ${doVal.toFixed(2)} mg/L.`
      },
      {
        slotKey: 'FEEDING_1',
        category: 'FEEDING',
        title: `Feed Dispense #1 (Morning) — BioGrow-7`,
        dosage_amount: feed1Kg,
        dosage_unit: 'kg',
        aerator_power_percent: null,
        aerator_rpm: null,
        scheduled_time: '08:00 WIB',
        notes: `Morning feeding session (30% of total ${dailyFeedKg} kg daily ration). Pre-feed DO verified at ${doVal.toFixed(2)} mg/L.`
      },
      {
        slotKey: 'WATER_EXCHANGE',
        category: 'SIPHON_FLUSH',
        title: `Water Exchange & Sludge Siphon (${isSiphonNeeded ? siphonVolumeLiters : 200} L)`,
        dosage_amount: isSiphonNeeded ? siphonVolumeLiters : 200,
        dosage_unit: 'L',
        aerator_power_percent: null,
        aerator_rpm: null,
        scheduled_time: '10:30 WIB',
        notes: isSiphonNeeded 
          ? `Floc density (${flocVal.toFixed(1)} mL/L) approaching upper limit; bottom sludge siphon and fresh water replenishment required.`
          : `Purging bottom anaerobic sludge and organic particulate buildup with fresh water top-up.`
      },
      {
        slotKey: 'FEEDING_2',
        category: 'FEEDING',
        title: `Feed Dispense #2 (Noon) — BioGrow-7`,
        dosage_amount: feed2Kg,
        dosage_unit: 'kg',
        aerator_power_percent: null,
        aerator_rpm: null,
        scheduled_time: '12:30 WIB',
        notes: `Peak metabolic noon feeding session (40% of total daily ration) at optimal water temperature of ${tempVal.toFixed(1)}°C.`
      },
      {
        slotKey: 'MOLASSES_CN',
        category: 'MOLASSES',
        title: isMolassesQuotaReached
          ? 'Molasses C:N Injection (STANDBY — 3x Limit Reached)'
          : (isMolassesNeeded ? `Molasses C:N 15:1 Balancing (${molassesGrams} g)` : 'Molasses C:N Injection (STANDBY — Optimal Floc)'),
        dosage_amount: isMolassesNeeded ? molassesGrams : 0,
        dosage_unit: 'g',
        aerator_power_percent: null,
        aerator_rpm: null,
        scheduled_time: '14:30 WIB',
        notes: isMolassesQuotaReached
          ? `Molasses dosage is strictly limited to 1–3 applications per cycle. Quota fulfilled (${historicalMolassesCount}/3); daily routine dosage prohibited to prevent hypoxia and sludge overload.`
          : (isMolassesNeeded 
            ? `Cane molasses organic carbon injection (application #${historicalMolassesCount + 1} of 3-limit quota) for heterotrophic ammonia conversion (${ammoniaVal.toFixed(3)} ppm).`
            : `Floc density (${flocVal.toFixed(1)} mL/L) is optimal; molasses injection on standby to preserve nighttime dissolved oxygen.`)
      },
      {
        slotKey: 'FEEDING_3',
        category: 'FEEDING',
        title: `Feed Dispense #3 (Afternoon) — BioGrow-7`,
        dosage_amount: feed3Kg,
        dosage_unit: 'kg',
        aerator_power_percent: null,
        aerator_rpm: null,
        scheduled_time: '17:00 WIB',
        notes: `Afternoon closing feeding session (30% of total daily ration) before nighttime temperature decline.`
      }
    ]

    // Fetch existing executions for today
    const existing = await executionRepository.findTodayExecutions(pondId)
    const existingByKey = new Map()
    existing.forEach(e => {
      // Key by category + scheduled time (or slot)
      const key = `${e.category}_${e.scheduled_time}`
      existingByKey.set(key, e)
      if (e.id) existingByKey.set(e.id, e)
    })

    const generatedExecutions = []
    for (const desired of desiredActions) {
      const key = `${desired.category}_${desired.scheduled_time}`
      const targetId = `ACT-${todayStr}-${pondId}-${desired.slotKey}`
      const found = existingByKey.get(key) || existingByKey.get(targetId)

      if (found) {
        // If already completed or currently running, do not modify
        if (found.status === 'SUCCESS' || found.status === 'RUNNING') {
          generatedExecutions.push(found)
          continue
        }
        // If still SCHEDULED or PENDING, dynamically adapt parameters to fresh incoming telemetry
        if (found.status === 'PENDING' || found.status === 'SCHEDULED') {
          const updated = await executionRepository.update(found.id, {
            dosage_amount: desired.dosage_amount,
            dosage_unit: desired.dosage_unit,
            aerator_power_percent: desired.aerator_power_percent,
            aerator_rpm: desired.aerator_rpm,
            title: desired.title,
            notes: desired.notes
          })
          generatedExecutions.push(updated)
          continue
        }
        generatedExecutions.push(found)
      } else {
        // Auto-approve routine optimal treatments as SCHEDULED.
        // Only flag as PENDING (HITL Review) if there is an active biological hazard / emergency
        const isHazard = doVal < 3.5 || ammoniaVal > 0.8 || phVal < 6.5 || phVal > 8.6
        const initialStatus = isHazard ? 'PENDING' : 'SCHEDULED'

        const created = await executionRepository.insert({
          id: targetId,
          pond_id: pondId,
          category: desired.category,
          title: desired.title,
          dosage_amount: desired.dosage_amount,
          dosage_unit: desired.dosage_unit,
          aerator_power_percent: desired.aerator_power_percent,
          aerator_rpm: desired.aerator_rpm,
          scheduled_time: desired.scheduled_time,
          status: initialStatus,
          actor: 'Gemini Biofloc Specialist',
          hardware_id: `sac/${pondId.toLowerCase()}/${desired.category.toLowerCase()}`,
          notes: desired.notes
        })
        generatedExecutions.push(created)
      }
    }

    // Also update/sync ai_recommendations for today
    const recId = `REC-${pondId}-${todayStr}`
    const treatments = generatedExecutions.map(e => ({
      id: e.id,
      category: e.category,
      categoryLabel: e.category === 'FEEDING' ? 'Feed Dispense' : (e.category === 'AERATION' ? 'Aerator Speed Control' : (e.category === 'MOLASSES' ? 'Molasses Injection' : 'Water Exchange & Siphon')),
      title: e.title,
      dosage: e.dosage_amount !== null ? `${e.dosage_amount} ${e.dosage_unit || ''}` : `${e.aerator_power_percent}%`,
      dosageAmount: e.dosage_amount,
      dosageUnit: e.dosage_unit,
      aeratorPowerPercent: e.aerator_power_percent,
      aeratorRpm: e.aerator_rpm,
      scheduledTime: e.scheduled_time,
      status: e.status,
      notes: e.notes
    }))

    const summaryText = `Biofloc prescription for ${pond.name}: Daily feed ${dailyFeedKg} kg in 3 windows. Aerator locked at ${aeratorPower}% VFD. ${isMolassesNeeded ? `Molasses ${molassesGrams}g prescribed for C:N balance.` : 'Molasses on standby.'} ${isSiphonNeeded ? `Bottom sludge siphon ${siphonVolumeLiters}L required.` : 'Zero-exchange standby.'}`

    await aiAnalysisRepository.insertRecommendation({
      id: recId,
      pond_id: pondId,
      plan_date: todayStr,
      status: 'PENDING',
      summary: summaryText,
      treatments
    })

    // Broadcast update via MQTT
    mqttClient.publishExecutionUpdate(pondId, {
      pond_id: pondId,
      type: 'EXECUTIONS_SYNTHESIZED',
      count: generatedExecutions.length,
      timestamp: new Date().toISOString()
    })

    console.log(`├── [CORE DAILY TREATMENT] Avnimelech Biofloc Prescription (${todayStr}) ──`)
    console.log(`│ • Biometrics In : Fish Count=${fishCount} | Biomass=${biomassKg.toFixed(1)} kg | Total Daily Feed Ration=${dailyFeedKg} kg`)
    console.log(`│ • Output Tasks  : ${generatedExecutions.length} Schedules [Feeding 3x: ${feed1Kg}kg, ${feed2Kg}kg, ${feed3Kg}kg | Aerator VFD: ${aeratorPower}% | Molasses: ${isMolassesNeeded ? molassesGrams + 'g' : 'Standby'} | Siphon: ${isSiphonNeeded ? siphonVolumeLiters + 'L' : 'Standby'}]`)
    console.log(`│ • Database Save : execution_logs (${generatedExecutions.filter(e => e.status === 'SCHEDULED').length} Scheduled, ${generatedExecutions.filter(e => e.status === 'SUCCESS').length} Done) & ai_recommendations (${recId})`)
    console.log(`└── [MQTT BROADCAST] sac/${pondId.toLowerCase()}/processed & sac/${pondId.toLowerCase()}/executions dispatched ✔\n`)

    return generatedExecutions
  }

  /**
   * 2. Daily 07:00 AM Morning Briefing & Avnimelech Prescription Synthesis
   * Triggered by cron job at 07:00:00 every day
   */
  async generateDailyMorningBriefing(pondId) {
    const pond = await pondRepository.findById(pondId)
    if (!pond) return null

    const todayStr = new Date().toISOString().split('T')[0]
    const telemetry = pond.telemetry_cache 
      ? (typeof pond.telemetry_cache === 'string' ? JSON.parse(pond.telemetry_cache) : pond.telemetry_cache)
      : { do: 6.2, ph: 7.6, temp: 28.5, ammonia: 0.02, flocDensity: 14.0 }

    const biomassKg = (pond.fish_count * pond.avg_weight_grams) / 1000
    // Tilapia feeding percentage: ~2.5% of body weight for grower/finisher
    const dailyFeedKg = +(biomassKg * 0.024).toFixed(1)
    const feedProteinPercent = 0.30 // 30% crude protein

    // Avnimelech formula for C:N 15:1 carbon dosing:
    // Nitrogen excreted = Feed (kg) * Protein% * 0.16 * 0.75
    // Carbon needed = N * 15 - (Feed * 0.5)
    // Molasses (45% carbon) = Carbon needed / 0.45 * 1000 grams
    const molassesGrams = Math.round(Math.max(100, dailyFeedKg * feedProteinPercent * 0.16 * 1.25 / 0.45 * 100))

    let aeratorTargetPower = 80
    if (biomassKg > 1500) aeratorTargetPower = 90
    else if (biomassKg < 300) aeratorTargetPower = 70

    const needSiphon = (telemetry.flocDensity || 14) > 25.0

    const proposedTreatments = [
      {
        id: `PLAN-${pond.id}-01`,
        category: 'FEEDING',
        title: `Daily Feeding Protocol (${dailyFeedKg} kg BioGrow Pellets in 3 Windows)`,
        dosageAmount: dailyFeedKg,
        dosageUnit: 'kg',
        scheduledTime: '08:30, 14:00, 17:30 WIB',
        hardwareNode: `sac/pond00${pond.id.replace('K', '')}/feeder`,
        status: 'SCHEDULED'
      },
      {
        id: `PLAN-${pond.id}-02`,
        category: 'AERATION',
        title: `VFD Aeration Continuous Lock (${aeratorTargetPower}% Power)`,
        dosageAmount: aeratorTargetPower,
        dosageUnit: '%',
        aeratorPowerPercent: aeratorTargetPower,
        aeratorRpm: Math.round(aeratorTargetPower * 15),
        scheduledTime: '08:00 WIB',
        hardwareNode: `sac/pond00${pond.id.replace('K', '')}/aerator`,
        status: 'RUNNING'
      },
      {
        id: `PLAN-${pond.id}-03`,
        category: 'MOLASSES',
        title: `Avnimelech C:N 15:1 Molasses Dosing (${molassesGrams} g)`,
        dosageAmount: molassesGrams,
        dosageUnit: 'g',
        scheduledTime: '15:00 WIB',
        hardwareNode: `sac/pond00${pond.id.replace('K', '')}/molasses`,
        status: 'SCHEDULED'
      }
    ]

    if (needSiphon) {
      proposedTreatments.push({
        id: `PLAN-${pond.id}-04`,
        category: 'SIPHON_FLUSH',
        title: 'Bottom Sludge Siphon Purge (Floc Density Control)',
        dosageAmount: 200,
        dosageUnit: 'L',
        scheduledTime: '10:00 WIB',
        hardwareNode: `sac/pond00${pond.id.replace('K', '')}/siphon`,
        status: 'SCHEDULED'
      })
    }

    let summary = `Morning Biofloc Assessment: Biomass is ${biomassKg.toFixed(1)} kg. Daily feeding allocated at ${dailyFeedKg} kg pellets with ${molassesGrams} g molasses to sustain C:N ratio 15:1.`

    // Gemini API invocation if key is available
    if (geminiClient.hasApiKey()) {
      const systemInstruction = 'You are the Avnimelech Biofloc AI Copilot generating the 07:00 AM Morning Executive Briefing for fish farm supervisors.'
      const prompt = `Synthesize the morning briefing for ${pond.name} (${pond.species}, DOC ${pond.doc}, biomass ${biomassKg.toFixed(1)} kg).
Proposed Treatments: ${JSON.stringify(proposedTreatments)}.
Telemetry: DO ${telemetry.do} mg/L, Temp ${telemetry.temp} °C, TAN ${telemetry.ammonia} ppm.
Provide a professional 2-sentence executive summary.`

      const aiText = await geminiClient.generateChatResponse({ systemInstruction, message: prompt })
      if (aiText) {
        summary = (typeof aiText === 'object' && aiText.reply ? aiText.reply : String(aiText)).trim()
      }
    }

    // Save Recommendation
    const recommendation = await aiAnalysisRepository.insertRecommendation({
      id: `REC-${pond.id}-${todayStr}`,
      pond_id: pond.id,
      plan_date: todayStr,
      status: 'PENDING',
      summary,
      treatments: proposedTreatments
    })

    console.log(`[AI Copilot] Generated 07:00 AM Briefing for ${pond.id}: ${summary.substring(0, 70)}...`)
    return recommendation
  }

  /**
   * 3. Copilot Tool Execution Handler (Gemini Function Calling Backend Dispatcher)
   */
  async executeCopilotTool(toolName, args = {}) {
    const rawPondId = args.pondId || 'K01'
    const pondId = rawPondId.toUpperCase().startsWith('K') ? rawPondId.toUpperCase() : `K0${rawPondId}`
    const pond = await pondRepository.findById(pondId)

    switch (toolName) {
      case 'get_pond_telemetry': {
        const tele = pond?.telemetry_cache 
          ? (typeof pond.telemetry_cache === 'string' ? JSON.parse(pond.telemetry_cache) : pond.telemetry_cache)
          : { do: 6.4, ph: 7.6, temp: 28.5, ammonia: 0.02, flocDensity: 14.5 }
        return {
          pondId,
          pondName: pond?.name || `Pond ${pondId}`,
          species: pond?.species || 'Oreochromis niloticus',
          doc: pond?.doc || 112,
          fishCount: pond?.fish_count || 2000,
          biomassKg: ((pond?.fish_count || 2000) * (pond?.avg_weight_grams || 350)) / 1000,
          telemetry: tele,
          status: 'SUCCESS',
          message: `Telemetry for ${pond?.name || pondId}: DO ${tele.do} mg/L, pH ${tele.ph}, Temp ${tele.temp}°C, TAN ${tele.ammonia} ppm, Floc ${tele.flocDensity} mL/L.`
        }
      }

      case 'get_pond_diagnostic': {
        const ai = await aiAnalysisRepository.findLatestByPondId(pondId)
        return {
          pondId,
          healthScore: ai?.health_score || 96,
          status: ai?.health_status || 'OPTIMAL',
          summary: ai?.summary || 'Ecosystem operating in steady-state aerobic biofloc balance.',
          anomalies: ai?.anomalies_detected || [],
          message: `Diagnostic for ${pondId}: Health Score ${ai?.health_score || 96}/100 (${ai?.health_status || 'OPTIMAL'}). ${ai?.summary || 'Stable conditions.'}`
        }
      }

      case 'get_recent_treatments': {
        const limit = args.limit || 10
        const treatments = await executionRepository.findByPondId(pondId, { limit })
        return {
          pondId,
          count: treatments.length,
          treatments: treatments.map(t => ({
            id: t.id,
            category: t.category,
            title: t.title,
            dosage: `${t.dosage_amount ?? ''} ${t.dosage_unit ?? ''}`.trim(),
            status: t.status,
            time: t.scheduled_time || t.executed_at
          })),
          message: `Found ${treatments.length} treatment records for pond ${pondId}.`
        }
      }

      case 'calculate_biofloc_cn': {
        const dailyFeed = Number(args.dailyFeedKg || 10)
        const tan = Number(args.currentTanPpm || 0.02)
        // Check historical molasses applications to enforce the 1-3 times limit:
        const molassesExecs = await executionRepository.findByPondId(pondId, { category: 'MOLASSES' })
        const executedCount = molassesExecs.filter(e => e.status === 'SUCCESS' || e.status === 'RUNNING').length
        
        if (executedCount >= 3) {
          return {
            pondId,
            status: 'STANDBY',
            recommendedDoseGrams: 0,
            molassesCount: executedCount,
            maxAllowed: 3,
            message: `Molasses application quota reached (${executedCount}/3). Carbon dosing placed on STANDBY to prevent organic sludge choke and nighttime oxygen depletion.`
          }
        }

        const isNeeded = tan > 0.05 || executedCount === 0
        const dose = isNeeded ? Math.min(450, Math.round(dailyFeed * 35)) : 0
        return {
          pondId,
          status: isNeeded ? 'ACTIVE_DOSE' : 'STANDBY',
          recommendedDoseGrams: dose,
          molassesCount: executedCount + 1,
          maxAllowed: 3,
          message: isNeeded 
            ? `Recommended dose: ${dose}g cane molasses diluted 1:3 with pond water (Application ${executedCount + 1} of 3).`
            : 'Biofloc C:N ratio is stable. Carbon dosing on Standby.'
        }
      }

      case 'adjust_aerator_vfd': {
        const power = Math.max(50, Math.min(100, Number(args.powerPercent || 80)))
        const rpm = Math.round((power / 100) * 1500)
        const execution = await executionService.dispatchIoTCommand(pondId, {
          action: 'aerator',
          params: { power_percent: power, rpm },
          actor: 'Co-Pilot (Gemini AI Execution Control)',
          notes: args.rationale || `VFD regulation to ${power}% (~${rpm} RPM) via Co-Pilot function call`
        })
        return {
          pondId,
          status: 'DISPATCHED',
          powerPercent: power,
          rpm,
          executionId: execution.id,
          message: `Aerator VFD speed successfully adjusted to ${power}% (~${rpm} RPM).`
        }
      }

      case 'dispense_feed': {
        const amount = Number(args.amountKg || 5.2)
        const execution = await executionService.dispatchIoTCommand(pondId, {
          action: 'feed',
          params: { dose: amount, unit: 'kg' },
          actor: 'Co-Pilot (Gemini AI Execution Control)',
          notes: args.rationale || `Feed ration ${amount} kg via Co-Pilot function call`
        })
        return {
          pondId,
          status: 'DISPATCHED',
          amountKg: amount,
          executionId: execution.id,
          message: `Auto-feeder pulse of ${amount} kg BioGrow-7 dispatched to hardware.`
        }
      }

      case 'dose_molasses': {
        // Enforce the 1 to 3 times molasses limit!
        const todayExecs = await executionRepository.findByPondId(pondId, { category: 'MOLASSES' })
        const executedCount = todayExecs.filter(e => e.status === 'SUCCESS' || e.status === 'RUNNING').length
        if (executedCount >= 3) {
          return {
            pondId,
            status: 'REJECTED',
            message: `Molasses application rejected: Pond ${pondId} has already received ${executedCount} molasses applications. Maximum allowed is 3 times per cycle to prevent sludge overload and oxygen crash.`
          }
        }
        const grams = Math.min(500, Number(args.amountGrams || 350))
        const execution = await executionService.dispatchIoTCommand(pondId, {
          action: 'molasses',
          params: { dose: grams, unit: 'g' },
          actor: 'Co-Pilot (Gemini AI Execution Control)',
          notes: args.rationale || `Molasses injection ${grams}g via Co-Pilot function call`
        })
        return {
          pondId,
          status: 'DISPATCHED',
          amountGrams: grams,
          executionId: execution.id,
          message: `Cane molasses dose of ${grams}g dispatched (Application ${executedCount + 1} of 3).`
        }
      }

      case 'purge_bottom_sludge': {
        const vol = Math.min(300, Number(args.volumeLiters || 200))
        const execution = await executionService.dispatchIoTCommand(pondId, {
          action: 'siphon',
          params: { volume: vol },
          actor: 'Co-Pilot (Gemini AI Execution Control)',
          notes: args.rationale || `Bottom sludge purge ${vol}L via Co-Pilot function call`
        })
        return {
          pondId,
          status: 'DISPATCHED',
          volumeLiters: vol,
          executionId: execution.id,
          message: `Bottom siphon valve opened to purge ${vol} Liters of central sludge.`
        }
      }

      case 'schedule_daily_treatment_plan': {
        await this.synthesizeDailyExecutionPlan(pondId)
        return {
          pondId,
          status: 'SCHEDULED',
          message: `Today's 4-pillar treatment plan locked into Daily Execution Hub for ${pondId}.`
        }
      }

      case 'adjust_daily_treatment': {
        const category = (args.category || 'FEEDING').toUpperCase()
        const newDose = Number(args.dosageAmount)
        const unit = args.dosageUnit || (category === 'FEEDING' ? 'kg' : (category === 'AERATION' ? '%' : (category === 'MOLASSES' ? 'g' : 'L')))
        const slotKey = args.slotKey

        const todayExecutions = await executionRepository.findTodayExecutions(pondId)
        let targetTask = null
        if (slotKey) {
          targetTask = todayExecutions.find(e => 
            (e.id && e.id.includes(slotKey)) ||
            (slotKey === 'FEEDING_3' && (e.title?.includes('#3') || e.title?.toLowerCase().includes('sore'))) ||
            (slotKey === 'FEEDING_2' && (e.title?.includes('#2') || e.title?.toLowerCase().includes('siang'))) ||
            (slotKey === 'FEEDING_1' && (e.title?.includes('#1') || e.title?.toLowerCase().includes('pagi'))) ||
            (slotKey === 'AERATION_SPEED' && e.category === 'AERATION') ||
            (slotKey === 'MOLASSES_CN' && e.category === 'MOLASSES') ||
            (slotKey === 'WATER_EXCHANGE' && e.category === 'SIPHON_FLUSH')
          )
        }
        if (!targetTask) {
          // Find next pending or scheduled task in this category
          targetTask = todayExecutions.find(e => e.category === category && (e.status === 'SCHEDULED' || e.status === 'PENDING'))
        }
        if (!targetTask) {
          targetTask = todayExecutions.find(e => e.category === category)
        }

        if (!targetTask) {
          return {
            pondId,
            status: 'FAILED',
            message: `No active schedule found for category ${category} in pond ${pondId} today.`
          }
        }

        if (targetTask.status === 'SUCCESS') {
          if (category === 'AERATION') {
            // Aerator calibration is continuous: dispatch live adjustment
            const pwr = Math.max(50, Math.min(100, newDose))
            const rpm = Math.round((pwr / 100) * 1500)
            const liveExecution = await executionService.dispatchIoTCommand(pondId, {
              action: 'aerator',
              params: { power_percent: pwr, rpm },
              actor: 'Co-Pilot (Live VFD Adjustment)',
              notes: `Live VFD regulation to ${pwr}% (~${rpm} RPM) via Co-Pilot`
            })
            return {
              pondId,
              status: 'SUCCESS',
              executionId: liveExecution.id,
              taskTitle: `VFD Aerator Speed Target: ${pwr}%`,
              newDosage: `${pwr} %`,
              message: `Aerator speed for pond ${pondId} set directly to ${pwr}% (~${rpm} RPM) and dispatched to hardware inverter.`
            }
          }

          return {
            pondId,
            status: 'LOCKED',
            message: `Treatment '${targetTask.title}' was already executed successfully and cannot be modified.`
          }
        }

        const updates = {
          dosage_amount: newDose,
          dosage_unit: unit,
          notes: args.notes || `Adjusted by Supervisor via Co-Pilot: ${newDose} ${unit}`
        }

        if (category === 'AERATION') {
          updates.aerator_power_percent = newDose
          updates.aerator_rpm = Math.round((newDose / 100) * 1500)
          updates.title = `Aerator Speed Control (VFD ${newDose}% Power)`
        } else if (category === 'FEEDING') {
          updates.title = targetTask.title.includes('—') 
            ? targetTask.title 
            : `Feed Dispense (${newDose} kg) — BioGrow-7`
        } else if (category === 'MOLASSES') {
          updates.title = `Molasses C:N 15:1 Balancing (${newDose} g)`
        } else if (category === 'SIPHON_FLUSH') {
          updates.title = `Water Exchange & Sludge Siphon (${newDose} L)`
        }

        const updated = await executionRepository.update(targetTask.id, updates)

        // Sync with ai_recommendations table
        try {
          const todayStr = new Date().toISOString().split('T')[0]
          const rec = await aiAnalysisRepository.getLatestRecommendation(pondId, todayStr)
          if (rec && rec.treatments) {
            let list = typeof rec.treatments === 'string' ? JSON.parse(rec.treatments) : rec.treatments
            list = list.map(item => {
              if (item.id === targetTask.id || (item.category === category && item.status !== 'SUCCESS')) {
                return {
                  ...item,
                  dosageAmount: newDose,
                  dosageUnit: unit,
                  dosage: `${newDose} ${unit}`,
                  aeratorPowerPercent: updates.aerator_power_percent || item.aeratorPowerPercent,
                  aeratorRpm: updates.aerator_rpm || item.aeratorRpm,
                  title: updates.title || item.title,
                  notes: updates.notes
                }
              }
              return item
            })
            await aiAnalysisRepository.insertRecommendation({
              id: rec.id,
              pond_id: pondId,
              plan_date: todayStr,
              status: rec.status,
              summary: rec.summary,
              treatments: list
            })
          }
        } catch (syncErr) {
          console.warn('[Sync Recommendation Error]', syncErr.message)
        }

        // Broadcast reactive update via MQTT
        mqttClient.publishExecutionUpdate(pondId, {
          pond_id: pondId,
          type: 'EXECUTION_ADJUSTED',
          execution: updated,
          timestamp: new Date().toISOString()
        })

        return {
          pondId,
          status: 'SUCCESS',
          executionId: targetTask.id,
          taskTitle: updated.title,
          newDosage: `${newDose} ${unit}`,
          message: `Schedule '${updated.title}' successfully adjusted to ${newDose} ${unit} on Daily Execution Hub.`
        }
      }

      case 'run_daily_treatment_now': {
        const category = (args.category || 'FEEDING').toUpperCase()
        const todayExecutions = await executionRepository.findTodayExecutions(pondId)
        const target = args.executionId 
          ? todayExecutions.find(e => e.id === args.executionId)
          : todayExecutions.find(e => e.category === category && (e.status === 'SCHEDULED' || e.status === 'PENDING'))

        if (!target) {
          return {
            pondId,
            status: 'NOT_FOUND',
            message: `No scheduled ${category} treatment found in pond ${pondId}.`
          }
        }

        let action = 'feed'
        let params = {}
        if (target.category === 'FEEDING') {
          action = 'feed'
          params = { dose: target.dosage_amount || 10, unit: target.dosage_unit || 'kg' }
        } else if (target.category === 'AERATION') {
          action = 'aerator'
          params = { power_percent: target.aerator_power_percent || 80, rpm: target.aerator_rpm || 1200 }
        } else if (target.category === 'MOLASSES') {
          action = 'molasses'
          params = { dose: target.dosage_amount || 300, unit: target.dosage_unit || 'g' }
        } else if (target.category === 'SIPHON_FLUSH') {
          action = 'siphon'
          params = { volume: target.dosage_amount || 200, unit: 'liter' }
        }

        const execution = await executionService.dispatchIoTCommand(pondId, {
          action,
          params,
          actor: 'Co-Pilot (Dispatched by Supervisor)',
          notes: `Triggered immediately via Co-Pilot chat: ${target.title}`
        }, target.id)

        return {
          pondId,
          status: 'RUNNING',
          executionId: target.id,
          message: `Treatment '${target.title}' dispatched immediately to IoT actuator.`
        }
      }

      case 'approve_all_treatments': {
        const count = await executionRepository.approveAllPending(pondId)
        const todayStr = new Date().toISOString().split('T')[0]
        const recId = `REC-${pondId}-${todayStr}`
        await aiAnalysisRepository.updateRecommendationStatus(recId, 'APPROVED', 'Supervisor via Co-Pilot')

        mqttClient.publishExecutionUpdate(pondId, {
          pond_id: pondId,
          type: 'ALL_APPROVED',
          timestamp: new Date().toISOString()
        })

        return {
          pondId,
          status: 'APPROVED',
          approvedCount: count,
          message: `All daily treatments for Pond ${pondId} have been approved (Status: SCHEDULED).`
        }
      }

      default:
        return { pondId, status: 'UNKNOWN_TOOL', message: `Tool '${toolName}' not recognized.` }
    }
  }

  /**
   * 4. Interactive NLOps Copilot Chat with Gemini Function Calling & Execution Control
   */
  async chatWithCopilot(userMessage, context = {}) {
    const rawPondId = context.activePond || 'K01'
    const activePond = rawPondId.toUpperCase().startsWith('K') ? rawPondId.toUpperCase() : `K0${rawPondId}`
    const pond = await pondRepository.findById(activePond)

    // 1. Persist incoming User Message
    try {
      await copilotMessageRepository.insert({
        pond_id: activePond,
        role: 'user',
        sender_name: 'Supervisor (Ilfa)',
        message_type: 'CHAT',
        text: userMessage
      })
    } catch (saveUserErr) {
      console.warn('[Copilot Chat User Save]', saveUserErr.message)
    }

    // Build RAG context with telemetry snapshot and historical molasses count
    const tele = pond?.telemetry_cache 
      ? (typeof pond.telemetry_cache === 'string' ? JSON.parse(pond.telemetry_cache) : pond.telemetry_cache)
      : { do: 6.4, ph: 7.6, temp: 28.5, ammonia: 0.02, flocDensity: 14.5 }

    const molassesExecs = await executionRepository.findByPondId(activePond, { category: 'MOLASSES' })
    const molassesCount = molassesExecs.filter(e => e.status === 'SUCCESS' || e.status === 'RUNNING').length

    const systemInstruction = `${BIOFLOC_AI_ROLE}

${buildBioflocRagContext(activePond, tele, molassesCount)}

Active Pond: ${pond ? pond.name : activePond} (${activePond}).
Farm Supervisor: Ilfa Hidayat.
When the user requests pond water quality, telemetry, or biological diagnosis, invoke the corresponding data query tool.
When the user issues control commands or daily schedule adjustments, invoke the corresponding execution control tool.
CRITICAL CONSTRAINT: Molasses dosing is strictly limited to 1 to 3 applications maximum throughout the culture cycle. If already dosed 3 times, reject any further molasses request and explain the sludge choke hazard.`

    const chatRes = await geminiClient.generateChatResponse({
      systemInstruction,
      message: userMessage,
      context: {
        activePond,
        telemetry: tele,
        previousMolassesCount: molassesCount
      },
      executeTool: (name, args) => this.executeCopilotTool(name, args)
    })

    // Handle tool execution if Gemini returned a function call or mock engine generated one
    let toolResult = chatRes.toolResult || null
    let toolCall = chatRes.toolCall || null
    let actionCard = chatRes.actionCard || null

    if (!toolResult && toolCall && toolCall.name) {
      console.log(`[Copilot Function Call] Invoking tool: ${toolCall.name}`, toolCall.args)
      toolResult = await this.executeCopilotTool(toolCall.name, toolCall.args || {})
    }

    if (toolCall && toolResult) {
      // If an actionCard wasn't already synthesized, create one for actionable actuator/schedule commands
      if (!actionCard && (toolCall.name.startsWith('adjust_') || toolCall.name.startsWith('dispense_') || toolCall.name.startsWith('dose_') || toolCall.name.startsWith('purge_') || toolCall.name.startsWith('run_'))) {
        actionCard = {
          id: `act-${Date.now()}`,
          title: `IoT Action Authorization: ${toolCall.name.replace(/_/g, ' ').toUpperCase()}`,
          pondId: activePond,
          type: toolCall.name.toUpperCase(),
          targetDevice: `sac/${activePond.toLowerCase()}`,
          description: toolResult.message || 'Automated actuator execution from Co-Pilot',
          status: 'approved',
          hint: 'Command dispatched directly to IoT hardware and logged in Daily Execution Hub.'
        }
      }
    }

    // Synthesize recommended actionCard if water quality indicates an action is required, even if user only asked a question
    if (!actionCard) {
      const evaluatedPondId = (toolResult && toolResult.pondId) || 
        (toolCall && toolCall.args && toolCall.args.pondId) || 
        activePond
      
      const evaluatedPond = (evaluatedPondId === activePond) ? pond : await pondRepository.findById(evaluatedPondId)
      const evaluatedPondName = evaluatedPond?.name || `Pond ${evaluatedPondId.replace('K0', '').replace('K', '')}`

      const evaluatedTele = (toolResult && toolResult.telemetry) ? toolResult.telemetry : (
        evaluatedPond?.telemetry_cache
          ? (typeof evaluatedPond.telemetry_cache === 'string' ? JSON.parse(evaluatedPond.telemetry_cache) : evaluatedPond.telemetry_cache)
          : tele
      )

      let evaluatedMolassesCount = molassesCount
      if (evaluatedPondId !== activePond) {
        try {
          const targetExecs = await executionRepository.findByPondId(evaluatedPondId, { category: 'MOLASSES' })
          evaluatedMolassesCount = targetExecs.filter(e => e.status === 'SUCCESS' || e.status === 'RUNNING').length
        } catch (e) {
          evaluatedMolassesCount = 0
        }
      }

      if (evaluatedTele) {
        const doVal = Number(evaluatedTele.do)
        const ammoniaVal = Number(evaluatedTele.ammonia)
        const flocVal = Number(evaluatedTele.flocDensity)
        const phVal = Number(evaluatedTele.ph)

        if (!isNaN(doVal) && doVal < 5.0) {
          const isCritical = doVal < 3.8
          actionCard = {
            id: `act-rec-${Date.now()}`,
            title: isCritical ? `🚨 Critical Mitigation: Aerator Overdrive 100% (${evaluatedPondName})` : `⚠️ Recommended Action: Boost Aeration 90% (${evaluatedPondName})`,
            pondId: evaluatedPondId,
            type: 'EMERGENCY_HYPOXIA',
            aeratorPowerPercent: isCritical ? 100 : 90,
            feedPause: true,
            targetDevice: `sac/${evaluatedPondId.toLowerCase()}/aerator`,
            description: `Detected low Dissolved Oxygen (${doVal} mg/L in ${evaluatedPondName}). Immediate aeration boost to ${isCritical ? 100 : 90}% VFD and temporary feed pause recommended to protect stock.`,
            status: 'pending',
            hint: 'Click "APPROVE & DISPATCH TO EXECUTION" to boost aerator, or type custom speed.'
          }
        } else if (!isNaN(ammoniaVal) && ammoniaVal > 0.08) {
          if (evaluatedMolassesCount < 3) {
            const dose = Math.min(450, Math.round(ammoniaVal * 1500)) || 250
            actionCard = {
              id: `act-rec-${Date.now()}`,
              title: `🧪 Recommended Action: Molasses C:N Injection (${evaluatedPondName})`,
              pondId: evaluatedPondId,
              type: 'MOLASSES_DOSE',
              amountGrams: dose,
              molassesGrams: dose,
              targetDevice: `sac/${evaluatedPondId.toLowerCase()}/dosing_pump`,
              description: `Elevated Total Ammonia Nitrogen (${ammoniaVal} ppm in ${evaluatedPondName}). Supplement ${dose}g cane molasses (Application ${evaluatedMolassesCount + 1}/3) to accelerate bacterial assimilation.`,
              status: 'pending',
              hint: 'Click "APPROVE & DISPATCH TO EXECUTION" to inject molasses, or type custom dosage.'
            }
          } else {
            // Molasses quota reached (3/3) -> Recommend Nitrifying Probiotic
            actionCard = {
              id: `act-rec-${Date.now()}`,
              title: `🧫 Recommended Action: Nitrifying Probiotic Booster (${evaluatedPondName})`,
              pondId: evaluatedPondId,
              type: 'PROBIOTIC_DOSE',
              amountGrams: 150,
              targetDevice: `sac/${evaluatedPondId.toLowerCase()}/dosing_pump`,
              description: `Elevated TAN (${ammoniaVal} ppm in ${evaluatedPondName}) with Molasses quota at standby (${evaluatedMolassesCount}/3). Administer 150g Nitrifying Probiotic (*Bacillus* & *Nitrosomonas*) to accelerate bio-filtration without raising oxygen demand.`,
              status: 'pending',
              hint: 'Click "APPROVE & DISPATCH TO EXECUTION" to dose nitrifying bacteria.'
            }
          }
        } else if (!isNaN(flocVal) && flocVal > 20.0) {
          const volume = flocVal > 25.0 ? 250 : 150
          actionCard = {
            id: `act-rec-${Date.now()}`,
            title: `🔄 Recommended Action: Evacuate Bottom Sludge (${evaluatedPondName})`,
            pondId: evaluatedPondId,
            type: 'PURGE_SLUDGE',
            volumeLiters: volume,
            targetDevice: `sac/${evaluatedPondId.toLowerCase()}/siphon_valve`,
            description: `High biofloc solids density (${flocVal} mL/L > 20 mL/L in ${evaluatedPondName}). Purge ${volume} Liters of dense central sludge via bottom siphon valve to prevent anaerobic dead-zones.`,
            status: 'pending',
            hint: 'Click "APPROVE & DISPATCH TO EXECUTION" to open siphon valve, or type custom volume.'
          }
        } else if (!isNaN(phVal) && phVal < 7.2) {
          actionCard = {
            id: `act-rec-${Date.now()}`,
            title: `🪨 Recommended Action: Agricultural Lime Buffer (${evaluatedPondName})`,
            pondId: evaluatedPondId,
            type: 'LIME_BUFFER',
            amountGrams: 500,
            targetDevice: `sac/${evaluatedPondId.toLowerCase()}/dosing_hopper`,
            description: `Low pH reading (${phVal} < 7.2 in ${evaluatedPondName}). Apply 500g CaCO3 Agricultural Lime to stabilize alkalinity and sustain nitrification efficiency.`,
            status: 'pending',
            hint: 'Click "APPROVE & DISPATCH TO EXECUTION" to apply lime buffer.'
          }
        }
      }
    }

    const finalReply = chatRes.reply || (toolResult ? toolResult.message : 'Instruction processed.')

    // 2. Persist Assistant Message
    let assistantMsg = null
    try {
      assistantMsg = await copilotMessageRepository.insert({
        pond_id: activePond,
        role: 'assistant',
        sender_name: 'Co-Pilot',
        message_type: toolResult ? 'ACTION_ADJUSTMENT' : 'CHAT',
        text: finalReply,
        action_card: actionCard,
        metadata: {
          toolExecuted: chatRes.toolCall ? { name: chatRes.toolCall.name, result: toolResult } : null
        }
      })
      mqttClient.publishCopilotMessage(activePond, assistantMsg)
    } catch (saveAsstErr) {
      console.warn('[Copilot Chat Assistant Save]', saveAsstErr.message)
    }

    return {
      messageId: assistantMsg?.id,
      reply: finalReply,
      toolExecuted: chatRes.toolCall ? { name: chatRes.toolCall.name, result: toolResult } : null,
      actionCard
    }
  }
}

export const aiBioflocService = new AiBioflocService()
