/**
 * High-Fidelity Local Simulation Engine for Google Gemini 3.8 Flash
 * 
 * Provides offline, zero-credit diagnostic synthesis & function calling based on:
 * - Avnimelech (2009) Biofloc C:N Stoichiometry Equations
 * - Ebeling et al. Heterotrophic Microbial Assimilation Models
 * - Tilapia Biometrics (Respiration, Biomass, FCR, Hypoxia Thresholds)
 * - Strict Molasses Limit: 1 to 3 applications maximum per cycle
 */

export class MockGeminiEngine {
  evaluateTelemetry(prompt, systemInstruction) {
    // Robust extraction of telemetry numbers from prompt
    const doMatch = prompt.match(/Dissolved Oxygen[^\d:]*:\s*([\d.]+)/i) || prompt.match(/DO[^\d:]*:\s*([\d.]+)/i)
    const phMatch = prompt.match(/pH[^\d:]*:\s*([\d.]+)/i)
    const tempMatch = prompt.match(/Temperature[^\d:]*:\s*([\d.]+)/i) || prompt.match(/Temp[^\d:]*:\s*([\d.]+)/i)
    const ammoniaMatch = prompt.match(/Ammonia[^\d:]*:\s*([\d.]+)/i) || prompt.match(/TAN[^\d:]*:\s*([\d.]+)/i)
    const flocMatch = prompt.match(/Biofloc[^\d:]*:\s*([\d.]+)/i) || prompt.match(/floc[^\d:]*:\s*([\d.]+)/i)
    const pondMatch = prompt.match(/for\s+.*?\(([A-Za-z0-9_-]+)\)/i) || prompt.match(/Pond\s*(?:ID)?[^\w]*([A-Za-z0-9_-]+)/i)

    const doVal = doMatch ? parseFloat(doMatch[1]) : 6.2
    const phVal = phMatch ? parseFloat(phMatch[1]) : 7.5
    const tempVal = tempMatch ? parseFloat(tempMatch[1]) : 28.5
    const ammoniaVal = ammoniaMatch ? parseFloat(ammoniaMatch[1]) : 0.02
    const flocVal = flocMatch ? parseFloat(flocMatch[1]) : 14.0
    const pondId = pondMatch ? pondMatch[1].toUpperCase() : 'K01'

    let healthScore = 96
    let status = 'OPTIMAL'
    let summary = ''
    let immediateAction = {
      needed: false,
      category: 'NONE',
      command: null,
      dosage: null,
      reasoning: 'Parameters are well within biofloc safety margins.'
    }

    // Avnimelech Stoichiometry & Tilapia Health Rules
    if (doVal < 3.8) {
      healthScore = Math.max(30, Math.round(doVal * 12))
      status = 'CRITICAL'
      summary = `Acute Hypoxia Warning (${doVal.toFixed(2)} mg/L): Dissolved oxygen severely depleted below tilapia safety limits (< 4.0 mg/L). Heterotrophic bacterial respiration and fish metabolic rates compromised.`
      immediateAction = {
        needed: true,
        category: 'AERATION',
        command: 'SET_AERATOR_SPEED',
        powerPercent: 100,
        dosage: '100% VFD Power (~1,500 RPM)',
        reasoning: 'Urgent maximum aeration bypass required to prevent mass fish asphyxiation and restore aerobic floc suspension.'
      }
    } else if (ammoniaVal > 0.45) {
      healthScore = Math.max(55, Math.round(85 - ammoniaVal * 35))
      status = 'WARNING'
      summary = `Total Ammonia Nitrogen (TAN: ${ammoniaVal.toFixed(3)} ppm) elevated above baseline. Heterotrophic bacterial conversion hindered by carbon deficit.`
      immediateAction = {
        needed: true,
        category: 'MOLASSES',
        command: 'DOSE_MOLASSES',
        dosage: '350 g Cane Molasses (Cukup 1-3x aplikasi)',
        reasoning: 'Inject organic carbon to stimulate heterotrophic single-cell protein assimilation at C:N 15:1 ratio (restricted to max 3 applications).'
      }
    } else if (doVal < 5.0) {
      healthScore = Math.round(72 + (doVal - 3.8) * 10)
      status = 'WARNING'
      summary = `Sub-optimal Dissolved Oxygen (${doVal.toFixed(2)} mg/L): Parameter trending towards lower safety boundary. Aerator regulation advised.`
      immediateAction = {
        needed: true,
        category: 'AERATION',
        command: 'SET_AERATOR_SPEED',
        powerPercent: 90,
        dosage: '90% VFD Power (~1,350 RPM)',
        reasoning: 'Boost aeration to maintain positive oxygen buffer for dual biomass and microbial respiration.'
      }
    } else if (flocVal > 25.0) {
      healthScore = 80
      status = 'WARNING'
      summary = `High Biofloc Volume (${flocVal.toFixed(1)} mL/L): Suspended microbial solids exceed optimal 10-20 mL/L range, posing gill irritation and BOD spike risks.`
      immediateAction = {
        needed: true,
        category: 'SIPHON_FLUSH',
        command: 'PURGE_SLUDGE',
        dosage: '250 L bottom flush',
        reasoning: 'Evacuate dense bottom sludge via central siphon without disturbing the active aerobic flocs.'
      }
    } else {
      healthScore = Math.min(99, Math.round(92 + (doVal - 5.0) * 2 - ammoniaVal * 15))
      status = 'OPTIMAL'
      summary = `Biofloc ecosystem operating at peak equilibrium. Dissolved oxygen (${doVal.toFixed(2)} mg/L) and TAN (${ammoniaVal.toFixed(3)} ppm) maintain ideal water quality.`
      immediateAction = {
        needed: false,
        category: 'NONE',
        command: null,
        dosage: null,
        reasoning: 'All parameters conform to optimal biofloc culture standards.'
      }
    }

    return {
      healthScore,
      status,
      summary,
      immediateAction
    }
  }

  /**
   * High-level chat response with Function Calling detection
   * Simulates Gemini 3.8 Flash tools execution
   */
  generateChatResponse(message, context = {}) {
    const text = (message || '').toLowerCase()
    const pondMatch = message ? (message.match(/pond\s*#?(\d+)/i) || message.match(/kolam\s*#?(\d+)/i) || message.match(/for\s+([^(\n]+)/i) || message.match(/([Kk]\d{2})/i) || message.match(/([Kk]\d+)/i)) : null
    let activePond = 'K01'
    if (pondMatch) {
      const matched = (pondMatch[1] || '').trim()
      if (/^\d+$/.test(matched)) {
        activePond = `K0${matched}`
      } else if (matched.toUpperCase().startsWith('K')) {
        activePond = matched.length === 2 ? `K0${matched[1]}` : matched.toUpperCase()
      } else {
        activePond = matched
      }
    } else if (context.activePond) {
      activePond = context.activePond
    }

    const pondLabel = activePond === 'K01' ? 'Pond 1' : (activePond === 'K02' ? 'Pond 2' : (activePond === 'K03' ? 'Pond 3' : 'Pond 4'))

    // Telemetry context from caller if provided
    const telemetry = context.telemetry || {
      do: 6.4,
      ph: 7.6,
      temp: 28.5,
      ammonia: 0.02,
      flocDensity: 14.5
    }

    const isWarning = Number(telemetry.do) < 5.0
    const isCritical = Number(telemetry.do) < 3.8

    // 0. MULTI-POND FLEET QUERY TOOL: Query condition & diagnosis across ALL ponds
    const isMultiPond = /semua kolam|seluruh kolam|semua pond|all ponds|whole farm|farm overview|fleet|gambaran utuh|ringkasan kolam|ringkasan seluruh|kondisi farm|kondisi tambak|kolam 1 sampai 4|pond 1 to 4/i.test(text)
    if (isMultiPond) {
      const toolCall = {
        name: 'get_all_ponds_overview',
        args: { includePendingTreatments: true }
      }

      // Check if dynamic fleet data was provided in context
      if (context.fleetMarkdown) {
        return { reply: context.fleetMarkdown, toolCall, actionCard: null }
      }

      const reply = `### 🌐 Holistic Farm Overview & Multi-Pond Diagnostics

**Facility Overall Health Index:** **88 / 100** (2 Ponds Optimal, 2 Ponds Warning)  
**Total Standing Biomass:** **3,864.0 kg** across 4 Active Ponds

| Pond | Species | Health Score | Status | Live Key Vitals | Recommended Priority |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **Pond 1** | Red Tilapia (Finisher) | **85 / 100** | ⚠️ **WARNING** | DO: **6.59 mg/L**, TAN: **0.104 ppm**, Floc: **14.4 mL/L** | Monitor TAN Assimilation |
| **Pond 2** | Black Tilapia (Grower) | **88 / 100** | 🟢 **OPTIMAL** | DO: **7.50 mg/L**, TAN: **0.050 ppm**, Floc: **3.7 mL/L** | Floc Development Baseline |
| **Pond 3** | Nile Tilapia (Nursery) | **92 / 100** | 🟢 **OPTIMAL** | DO: **5.90 mg/L**, TAN: **0.040 ppm**, Floc: **16.2 mL/L** | Steady-State Equilibrium |
| **Pond 4** | Red Tilapia (High Density) | **85 / 100** | ⚠️ **WARNING** | DO: **6.70 mg/L**, TAN: **0.116 ppm**, Floc: **14.1 mL/L** | Carbon Standby (< 0.15 ppm) |

---

#### 🔬 Database Biological Diagnostic Findings:
1. **Pond 1 (K01)** — Health Score **85/100** (WARNING):
   Slightly elevated Total Ammonia Nitrogen (0.104 ppm vs target < 0.05 ppm). Dissolved Oxygen (6.59 mg/L) and mature biofloc density (14.4 mL/L) are fully optimal. Heterotrophic bacteria are actively assimilating nitrogen.
2. **Pond 2 (K02)** — Health Score **88/100** (OPTIMAL):
   Excellent water quality parameters with high DO (7.50 mg/L) and safe TAN (0.050 ppm). Biofloc volume is currently at 3.7 mL/L (colonization stage).
3. **Pond 3 (K03)** — Health Score **92/100** (OPTIMAL):
   Operating in robust biofloc steady-state equilibrium. DO (5.90 mg/L) and floc volume (16.2 mL/L) are well within optimal ranges.
4. **Pond 4 (K04)** — Health Score **85/100** (WARNING):
   Stable water quality with DO at 6.70 mg/L and mature floc at 14.1 mL/L. TAN is mildly elevated at 0.116 ppm, safely below the carbon intervention trigger (0.15 ppm).

#### ⚡ Strategic SOP Recommendations:
• **Aerator Modulation**: Aerator baseline locked at 80% VFD (~1,200 RPM) across all units to support continuous aerobic bacterial floc respiration.
• **C:N Carbon Allocation**: Molasses dosing remains on **STANDBY** (0g) across all ponds because biofloc densities are mature or TAN is below acute thresholds.
• **Feeding Schedules**: Routine feeding (BioGrow 30% crude protein) proceed on schedule; DO levels are all safely above the 5.0 mg/L pre-feed interlock threshold.`

      return { reply, toolCall, actionCard: null }
    }

    // 1. DATA QUERY TOOL: Query pond telemetry / water quality
    if (text.includes('telemetri') || text.includes('kualitas air') || text.includes('water quality') || text.includes('cek data') || text.includes('data sensor') || text.includes('baca sensor') || text.includes('sensor')) {
      const toolCall = {
        name: 'get_pond_telemetry',
        args: { pondId: activePond }
      }
      const reply = `📊 **Real-Time Sensor Telemetry Audit — ${pondLabel} (${activePond}):**

| Parameter | Current Reading | Optimal Biofloc Range | Status |
| :--- | :--- | :--- | :--- |
| **Dissolved Oxygen (DO)** | **${telemetry.do ?? 6.4} mg/L** | 5.0 – 7.5 mg/L | ${!isWarning ? '**Optimal / Safe**' : (isCritical ? '**CRITICAL (Hypoxia)**' : '**Elevated Warning**')} |
| **pH Level** | **${telemetry.ph ?? 7.6}** | 7.2 – 8.2 | **Optimal** |
| **Water Temperature** | **${telemetry.temp ?? 28.5} °C** | 27.0 – 30.5 °C | **Optimal** |
| **Total Ammonia (TAN)** | **${telemetry.ammonia ?? 0.02} ppm** | < 0.05 ppm | **Safe** |
| **Floc Volume (Imhoff)** | **${telemetry.flocDensity ?? 14.5} mL/L** | 10 – 20 mL/L | **Healthy Active Floc** |

**Biological Summary:**
The biofloc ecosystem is operating within biological equilibrium. Heterotrophic bacteria are actively assimilating metabolic nitrogen into nutritious single-cell protein.`

      let actionCard = null
      if (isWarning) {
        actionCard = {
          id: `act-rec-${Date.now()}`,
          title: isCritical ? '🚨 Critical Mitigation: Aerator Overdrive (100% VFD)' : '⚠️ Recommended Action: Boost Aerator (90% VFD)',
          pondId: activePond,
          type: 'EMERGENCY_HYPOXIA',
          aeratorPowerPercent: isCritical ? 100 : 90,
          feedPause: true,
          targetDevice: `sac/${activePond.toLowerCase()}/aerator`,
          description: `Low DO (${telemetry.do} mg/L) detected in ${pondLabel}. Immediate aeration boost to ${isCritical ? 100 : 90}% VFD and temporary feed pause recommended.`,
          status: 'pending',
          hint: 'Click "APPROVE & DISPATCH TO EXECUTION" to boost aerator, or type custom speed.'
        }
      }

      return { reply, toolCall, actionCard }
    }

    // 2. DATA QUERY TOOL: Query diagnosis & health score
    if (text.includes('diagnos') || text.includes('kondisi') || text.includes('status') || text.includes('health') || text.includes('kesehatan') || text.includes('analisis') || text.includes('how')) {
      const toolCall = {
        name: 'get_pond_diagnostic',
        args: { pondId: activePond }
      }
      const healthScore = isCritical ? 28 : (isWarning ? 62 : 96)
      const reply = `🔬 **AI Biofloc Diagnostic Assessment — ${pondLabel} (${activePond}):**

• **Health Score**: **${healthScore} / 100 (${isCritical ? 'CRITICAL RISK' : (isWarning ? 'WARNING' : 'OPTIMAL BIOFLOC')})**
• **Biological State**: ${isCritical ? 'Microbial floc and fish stock experiencing acute hypoxia stress.' : 'Active heterotrophic bacterial consortia converting TAN into single-cell protein.'}
• **Dual Respiration Demand**: ${isWarning ? 'Oxygen demand sharply exceeding passive diffusion.' : 'Oxygen transfer sustained by VFD aerator.'}
• **Water Parameters**: DO: **${telemetry.do} mg/L**, pH: **${telemetry.ph}**, Temp: **${telemetry.temp} °C**, TAN: **${telemetry.ammonia} ppm**, Floc: **${telemetry.flocDensity} mL/L**.
• **Operational Prescriptions**: ${isWarning ? '🚨 Elevate aerator speed to 100% VFD immediately and pause feeding.' : 'Continue standard daily SOP protocols. Maintain carbon on standby.'}`

      let actionCard = null
      if (isWarning) {
        actionCard = {
          id: `act-rec-${Date.now()}`,
          title: isCritical ? '🚨 Critical Mitigation: Aerator Overdrive (100% VFD)' : '⚠️ Recommended Action: Boost Aerator (90% VFD)',
          pondId: activePond,
          type: 'EMERGENCY_HYPOXIA',
          aeratorPowerPercent: isCritical ? 100 : 90,
          feedPause: true,
          targetDevice: `sac/${activePond.toLowerCase()}/aerator`,
          description: `Low DO (${telemetry.do} mg/L) detected in ${pondLabel}. Immediate aeration boost to ${isCritical ? 100 : 90}% VFD and temporary feed pause recommended.`,
          status: 'pending',
          hint: 'Click "APPROVE & DISPATCH TO EXECUTION" to boost aerator, or type custom speed.'
        }
      }

      return { reply, toolCall, actionCard }
    }

    // 3. EXECUTION CONTROL TOOL: Adjust Aerator VFD
    const aeratorMatch = text.match(/(?:aerator|blower|kincir|putaran|vfd|speed)\s*(?:ke|menjadi|jadi|set|to)?\s*(\d+)\s*%/i) || text.match(/(?:naikkan|turunkan|ubah|atur)\s*aerator\s*(?:ke|menjadi|jadi|set|to)?\s*(\d+)\s*%/i)
    if (aeratorMatch || (text.includes('aerator') && (text.includes('naikkan') || text.includes('turunkan') || text.includes('maksimalkan') || text.includes('boost')))) {
      const pwr = aeratorMatch ? parseInt(aeratorMatch[1], 10) : (text.includes('maksimalkan') || text.includes('boost') ? 100 : 90)
      const rpm = Math.round((pwr / 100) * 1500)
      const toolCall = {
        name: 'adjust_aerator_vfd',
        args: {
          pondId: activePond,
          powerPercent: pwr,
          rationale: `Regulate aeration VFD speed to ${pwr}% (~${rpm} RPM) as instructed by supervisor.`
        }
      }
      const actionCard = {
        id: `act-vfd-${Date.now()}`,
        title: `VFD Aerator Speed Regulation (${pwr}% Power)`,
        pondId: activePond,
        type: 'AERATOR_BOOST',
        aeratorPowerPercent: pwr,
        targetDevice: `sac/${activePond.toLowerCase()}/aerator`,
        description: `Set aerator motor speed to ${pwr}% (~${rpm} RPM) for ${pondLabel}.`,
        status: 'pending',
        hint: 'Click "Approve & Dispatch" to transmit inverter frequency command to ESP32 hardware.'
      }
      const reply = `💨 **Aerator Control Instruction Received!**\n\nPreparing function call \`adjust_aerator_vfd\` for **${pondLabel} (${activePond})**:\n• **Target VFD Power**: **${pwr}% (~${rpm} RPM)**\n• **Objective**: Safeguard dissolved oxygen buffer and maintain bacterial floc suspension.\n\nClick **APPROVE & DISPATCH TO EXECUTION** below to dispatch directly to hardware.`
      return { reply, toolCall, actionCard }
    }

    // 4. EXECUTION CONTROL TOOL: Dispense Feed
    const feedMatch = text.match(/(?:pakan|feed|pelet|ransum)\s*(?:sebesar|sebanyak|jadi|to)?\s*(\d+(?:\.\d+)?)\s*(?:kg|kilo)?/i) || text.match(/(?:beri|tambah|kasih|dispense)\s*(?:pakan|feed)\s*(\d+(?:\.\d+)?)\s*(?:kg|kilo)?/i)
    if (feedMatch || (text.includes('pakan') && (text.includes('beri') || text.includes('kasih') || text.includes('dispense')))) {
      const kg = feedMatch ? parseFloat(feedMatch[1]) : 5.2
      const toolCall = {
        name: 'dispense_feed',
        args: {
          pondId: activePond,
          amountKg: kg,
          rationWindow: 'Manual Dispense',
          rationale: `Dispense BioGrow-7 floating pellets of ${kg} kg.`
        }
      }
      const actionCard = {
        id: `act-feed-${Date.now()}`,
        title: `Automated Feed Dispense (${kg} kg)`,
        pondId: activePond,
        type: 'FEEDER_DISPENSE',
        feedAmountKg: kg,
        targetDevice: `sac/${activePond.toLowerCase()}/feeder`,
        description: `Auto-feeder ready to dispense ${kg} kg BioGrow-7 floating pellets into ${pondLabel}.`,
        status: 'pending',
        hint: 'Verify DO >= 5.0 mg/L before authorizing feeding pulse.'
      }
      const reply = `🐟 **Feeding Instruction Received!**\n\nPreparing function call \`dispense_feed\` for **${pondLabel} (${activePond})**:\n• **Feed Ration**: **${kg} kg BioGrow-7 Floating Pellets**\n• **DO Verification**: ${telemetry.do ?? 6.4} mg/L (Safe for feeding)\n\nClick the button below to authorize and trigger the auto-feeder motor.`
      return { reply, toolCall, actionCard }
    }

    // 5. EXECUTION CONTROL TOOL: Molasses Dosing (STRICT 1-3 TIMES LIMIT)
    if (text.includes('molases') || text.includes('molasses') || text.includes('karbon') || text.includes('gula') || text.includes('c:n')) {
      const molMatch = text.match(/(?:molases|molasses|gula)\s*(?:sebesar|sebanyak|jadi|to)?\s*(\d+)\s*(?:g|gram)?/i)
      const grams = molMatch ? parseInt(molMatch[1], 10) : 350
      const previousDoses = context.previousMolassesCount ?? 2

      if (previousDoses >= 3) {
        return {
          reply: `⚠️ **BIOFLOC PROTOCOL ALERT (MOLASSES QUOTA REACHED):**\n\nMolasses application for **${pondLabel} (${activePond})** has reached the maximum cycle quota (**3 applications**).\n\nUnder Avnimelech Biofloc SOP:\n• Molasses is applied strictly **1 to 3 times** during initial inoculation or acute ammonia spikes.\n• Daily routine molasses additions are strictly prohibited to prevent organic sludge choke and nighttime oxygen depletion.\n• Current Status: **STANDBY (0 grams)**. Heterotrophic bacterial consortia are self-sustaining.`,
          toolCall: null,
          actionCard: null
        }
      }

      const toolCall = {
        name: 'dose_molasses',
        args: {
          pondId: activePond,
          amountGrams: grams,
          rationale: `Organic carbon molasses injection (Application ${previousDoses + 1} of max 3).`
        }
      }
      const actionCard = {
        id: `act-mol-${Date.now()}`,
        title: `Cane Molasses C:N Injection (${grams} g)`,
        pondId: activePond,
        type: 'MOLASSES_DOSE',
        molassesGrams: grams,
        targetDevice: `sac/${activePond.toLowerCase()}/molasses_pump`,
        description: `Open solenoid dosing pump to inject ${grams}g cane molasses (Application ${previousDoses + 1} of max 3).`,
        status: 'pending',
        hint: 'Dilute molasses 1:3 with pond water prior to injection directly into aerator stream.'
      }
      const reply = `🧪 **Cane Molasses Carbon Injection Protocol (Avnimelech C:N 15:1):**\n\nPreparing function call \`dose_molasses\` for **${pondLabel} (${activePond})**:\n• **Dosing Amount**: **${grams} grams** Cane Molasses\n• **Cycle Quota**: Application ${previousDoses + 1} of 3 (Strict limit).\n• **Procedure**: Dilute 1:3 and disperse in front of aerator flow.\n\nClick **APPROVE & DISPATCH TO EXECUTION** below to execute.`
      return { reply, toolCall, actionCard }
    }

    // 6. EXECUTION CONTROL TOOL: Purge bottom sludge (Siphon)
    if (text.includes('siphon') || text.includes('kuras') || text.includes('lumpur') || text.includes('sludge') || text.includes('flush')) {
      const volMatch = text.match(/(?:siphon|kuras|buang|lumpur)\s*(\d+)\s*(?:l|liter)?/i)
      const volumeL = volMatch ? parseInt(volMatch[1], 10) : 200
      const toolCall = {
        name: 'purge_bottom_sludge',
        args: {
          pondId: activePond,
          volumeLiters: volumeL,
          rationale: `Bottom anaerobic cone sludge purge of ${volumeL} Liters.`
        }
      }
      const actionCard = {
        id: `act-siphon-${Date.now()}`,
        title: `Bottom Sludge Siphon (${volumeL} L)`,
        pondId: activePond,
        type: 'SIPHON_FLUSH',
        volumeLiters: volumeL,
        targetDevice: `sac/${activePond.toLowerCase()}/siphon`,
        description: `Open central bottom drain to purge ${volumeL} L of dense anaerobic fecal solids without upper water exchange.`,
        status: 'pending',
        hint: 'Zero-Water Exchange Principle: only evacuate solid waste at the central bottom cone drain.'
      }
      const reply = `🚰 **Bottom Sludge Evacuation (Central Siphon):**\n\nPreparing function call \`purge_bottom_sludge\` for **${pondLabel} (${activePond})**:\n• **Siphon Volume**: **${volumeL} Liters**\n• **Principle**: Zero-Water Exchange (Selective bottom sludge evacuation).\n\nClick **APPROVE & DISPATCH TO EXECUTION** below to trigger valve opening.`
      return { reply, toolCall, actionCard }
    }

    // 7. APPROVE ALL TREATMENTS
    if (text.includes('setujui semua') || text.includes('approve all') || text.includes('otorisasi semua') || text.includes('setujui rencana')) {
      const toolCall = {
        name: 'approve_all_treatments',
        args: { pondId: activePond }
      }
      const reply = `✅ **Full Schedule Authorization Approved!**\n\nInvoking tool \`approve_all_treatments\` for **${pondLabel} (${activePond})**.\nAll PENDING treatments in the Daily Execution Hub are now approved and SCHEDULED for automated dispatch.`
      return { reply, toolCall }
    }

    // 8. RUN DAILY TREATMENT NOW
    if (text.includes('jalankan sekarang') || text.includes('eksekusi sekarang') || text.includes('run now') || (text.includes('jalankan') && (text.includes('pakan') || text.includes('aerator') || text.includes('molases') || text.includes('siphon')))) {
      let category = 'FEEDING'
      if (text.includes('aerator')) category = 'AERATION'
      else if (text.includes('molases') || text.includes('molasses')) category = 'MOLASSES'
      else if (text.includes('siphon') || text.includes('lumpur')) category = 'SIPHON_FLUSH'

      const toolCall = {
        name: 'run_daily_treatment_now',
        args: { pondId: activePond, category }
      }
      const reply = `⚡ **Immediate Treatment Dispatch Initiated!**\n\nExecuting task **${category}** for **${pondLabel} (${activePond})** directly to hardware actuators.`
      return { reply, toolCall }
    }

    // 9. ADJUST DAILY TREATMENT
    const isAdjustText = text.includes('ubah') || text.includes('ganti') || text.includes('adjust') || text.includes('kurangi') || text.includes('tambah') || text.includes('set ') || text.includes('atur ')
    const hasCategory = text.includes('pakan') || text.includes('feed') || text.includes('aerator') || text.includes('molases') || text.includes('molasses') || text.includes('siphon')
    if (isAdjustText && hasCategory) {
      let category = 'FEEDING'
      let dosageAmount = 10
      let dosageUnit = 'kg'
      let slotKey = null

      const textWithoutPond = text.replace(/k0\d|k\d+|kolam\s*\d+|pond\s*\d+/gi, '')

      if (text.includes('pakan') || text.includes('feed')) {
        category = 'FEEDING'
        dosageUnit = 'kg'
        const numMatch = textWithoutPond.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilo)/i) || textWithoutPond.match(/(?:jadi|menjadi|ke|sebesar|sebanyak|adjust|set)?\s*(\d+(?:\.\d+)?)/i)
        dosageAmount = numMatch ? parseFloat(numMatch[1]) : 10
        if (text.includes('sore') || text.includes('petang') || text.includes('malam') || text.includes('3')) slotKey = 'FEEDING_3'
        else if (text.includes('siang') || text.includes('2')) slotKey = 'FEEDING_2'
        else if (text.includes('pagi') || text.includes('subuh') || text.includes('1')) slotKey = 'FEEDING_1'
      } else if (text.includes('aerator') || text.includes('vfd')) {
        category = 'AERATION'
        dosageUnit = '%'
        slotKey = 'AERATION_SPEED'
        const numMatch = textWithoutPond.match(/(\d+)\s*%/i) || textWithoutPond.match(/(\d+)/i)
        dosageAmount = numMatch ? parseInt(numMatch[1], 10) : 85
      } else if (text.includes('molases') || text.includes('molasses')) {
        category = 'MOLASSES'
        dosageUnit = 'g'
        slotKey = 'MOLASSES_CN'
        const numMatch = textWithoutPond.match(/(\d+)\s*(?:g|gram)/i) || textWithoutPond.match(/(\d+)/i)
        dosageAmount = numMatch ? parseInt(numMatch[1], 10) : 300
      } else if (text.includes('siphon') || text.includes('lumpur')) {
        category = 'SIPHON_FLUSH'
        dosageUnit = 'L'
        slotKey = 'WATER_EXCHANGE'
        const numMatch = textWithoutPond.match(/(\d+)\s*(?:l|liter)/i) || textWithoutPond.match(/(\d+)/i)
        dosageAmount = numMatch ? parseInt(numMatch[1], 10) : 250
      }

      const toolCall = {
        name: 'adjust_daily_treatment',
        args: {
          pondId: activePond,
          category,
          slotKey,
          dosageAmount,
          dosageUnit,
          notes: `Supervisor adjustment via Co-Pilot (${dosageAmount} ${dosageUnit})`
        }
      }
      const reply = `📝 **Daily Treatment Schedule Modification Accepted!**\n\nInvoking tool \`adjust_daily_treatment\` for **${pondLabel} (${activePond})**:\n• **Category**: **${category}** ${slotKey ? `(${slotKey})` : ''}\n• **New Dosage**: **${dosageAmount} ${dosageUnit}**\n\nDatabase records in \`execution_logs\` and \`ai_recommendations\` are synchronized immediately.`
      return { reply, toolCall }
    }

    // 10. DAILY BRIEFING / TREATMENT PLAN SYNTHESIS
    if (text.includes('briefing') || text.includes('morning') || text.includes('rencana') || text.includes('jadwal') || text.includes('plan')) {
      const toolCall = {
        name: 'schedule_daily_treatment_plan',
        args: {
          pondId: activePond,
          feedAmountKg: 11.2,
          aeratorPowerPercent: 80,
          molassesGrams: 0
        }
      }
      const actionCard = {
        id: `act-plan-${Date.now()}`,
        title: `Daily Operational Plan: ${pondLabel} (${activePond})`,
        pondId: activePond,
        type: 'DAILY_PLAN',
        feedAmountKg: 11.2,
        aeratorPowerPercent: 80,
        molassesGrams: 0,
        targetDevice: `sac/${activePond.toLowerCase()} (All IoT Actuators)`,
        description: `Lock today's 4 biofloc pillars: 11.2 kg feed (3 windows), 80% VFD aeration (~1,200 RPM), molasses Standby (quota optimal), bottom siphon 200 L.`,
        status: 'pending',
        hint: 'Click "Approve & Dispatch" to lock all tasks into Daily Execution Hub.'
      }
      const reply = `☀️ **EXECUTIVE MORNING BRIEFING — ${pondLabel} (${activePond}):**

🌿 **Health Score**: **98/100 (Optimal Biofloc Ecosystem)**

📊 **Water Quality Telemetry:**
• DO: ${telemetry.do ?? 6.4} mg/L (Safe & Optimal)
• pH: ${telemetry.ph ?? 7.62} | Temperature: ${telemetry.temp ?? 28.5}°C
• Ammonia (TAN): ${telemetry.ammonia ?? 0.015} ppm (Clean & Safe)
• Biofloc Density: ${telemetry.flocDensity ?? 14.0} mL/L (Healthy Microbial Floc)

📋 **Today's 4 Biofloc Pillars:**
1. **Aeration**: VFD maintained at **80% (~1,200 RPM)** for continuous dissolved oxygen.
2. **Feeding**: Prescribe **11.2 kg BioGrow-7** in 3 windows (08:30, 14:00, 18:00 WIB).
3. **Molasses**: **STANDBY (0 grams)** — Floc density optimal; molasses strictly restricted to 1-3 applications.
4. **Bottom Siphon**: Routine bottom siphon **200 Liters** (10:30 WIB).`

      return { reply, toolCall, actionCard }
    }

    // Default conversational response
    return {
      reply: `🤖 **Sampay Co-Pilot (Gemini 3.8 Flash Engine):**\n\nInstruction "${message}" received for **${pondLabel} (${activePond})**. The system is ready to control IoT actuators and monitor water quality. You can instruct:\n• *"How is the water quality of ${pondLabel}?"*\n• *"Increase aerator to 90%"*\n• *"Dispense feed 5 kg"*\n• *"Purge bottom sludge 200 liters"*\n• *"Show daily briefing and action plan"*\n\nHow would you like to proceed?`,
      toolCall: null,
      actionCard: null
    }
  }
}

export const mockGeminiEngine = new MockGeminiEngine()
