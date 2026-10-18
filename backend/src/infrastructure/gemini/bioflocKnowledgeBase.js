/**
 * Biofloc Aquaculture Knowledge Base, RAG Framework & Standard Operating Procedures (SOP)
 * 
 * Scientific Foundations:
 * - Prof. Yoram Avnimelech: "Biofloc Technology - A Practical Guide Book"
 * - Ebeling, Timmons & Bisogni: "Stoichiometry of Heterotrophic and Autotrophic Nitrification"
 * - Standard Tilapia (Oreochromis niloticus) High-Density Biometric Models
 * 
 * Rules & Safety Constraints:
 * - Molasses dosing is strictly limited to 1 to 3 applications maximum per cycle / acute outbreak.
 *   Continuous daily molasses dosing is strictly prohibited to prevent biofloc sludge asphyxiation.
 */

// ============================================================================
// 1. SYSTEM ROLE & PERSONA
// ============================================================================
export const BIOFLOC_AI_ROLE = `You are the Senior Biofloc Aquaculture Specialist & Autonomous System Controller for the Sampay Smart Aquaculture Co-Pilot (SAC).
Your mission is to maintain water quality equilibrium, optimize fish growth (Oreochromis niloticus / Tilapia), and prevent mortalities through strict adherence to Avnimelech Biofloc Technology (BFT) protocols and Standard Operating Procedures (SOP).
You operate with scientific precision, zero hallucinations, and absolute safety compliance. All recommendations and execution plans must adhere strictly to predefined categories, measurable dosages, and verifiable biological rationale.

LANGUAGE DIRECTIVE (MANDATORY):
- ALWAYS respond in professional, crisp, and structured English.
- You must fluently comprehend user inputs in Indonesian (e.g., "kondisi kolam 1 gimana?", "ubah pakan sore jadi 15 kg", "atur aerator 90%", "setujui semua jadwal") and English.
- Your output response to the user must ALWAYS be rendered in English with clear Markdown formatting (tables, bullet points, and bold metric highlights).
- In pond references, use simple numbered format: "Pond 1", "Pond 2", "Pond 3", "Pond 4" (do not use complex names).`

// ============================================================================
// 2. SCIENTIFIC PRINCIPLES & STOICHIOMETRIC FOUNDATIONS
// ============================================================================
export const BIOFLOC_SCIENCE_PRINCIPLES = {
  heterotrophicAssimilation: {
    title: "Heterotrophic TAN Assimilation",
    concept: "Heterotrophic bacteria convert toxic Total Ammonia Nitrogen (TAN) directly into single-cell microbial protein biomass when organic carbon is provided at a Carbon:Nitrogen (C:N) ratio of 15:1 to 20:1.",
    mechanism: "NH4+ + 1.18 C6H12O6 + HCO3- + 3.57 O2 -> C5H7O2N (Bacterial Flocks) + 3.08 CO2 + 5.48 H2O"
  },
  molassesLimitationRule: {
    title: "Strict Molasses Application Limit (1 to 3 Times Maximum)",
    rule: "Molasses application (organic carbon source) is strictly restricted to 1 to 3 applications during initial biofloc establishment or during acute ammonia (TAN) spikes. Routine daily molasses addition is strictly prohibited.",
    biologicalRationale: "Excessive daily molasses induces uncontrollable bacterial population explosions, organic sludge accumulation (sludge overload > 30 mL/L), severe nocturnal dissolved oxygen crashes (hypoxia), and acute fish mortality. Once biofloc volume reaches optimal maturity (10-15 mL/L) or after 1-3 applications, the biofloc system operates in steady-state (Zero Carbon Standby)."
  },
  dualRespirationDemand: {
    title: "Dual Respiration Oxygen Demand",
    concept: "In dense biofloc ponds, oxygen is consumed simultaneously by both fish biomass and dense aerobic bacterial flocs. Nighttime oxygen depletion can occur rapidly without adequate VFD aeration.",
    threshold: "Aeration must maintain DO >= 5.0 mg/L at all times to prevent microbial floc die-off and fish stress."
  },
  zeroWaterExchange: {
    title: "Zero-Water Exchange & Selective Sludge Siphon",
    concept: "Biofloc systems operate under true zero-water exchange. Only dense central anaerobic sludge is evacuated via bottom siphon (max 200-300 L per session) when Imhoff cone settleable solids exceed 25 mL/L."
  }
}

// ============================================================================
// 3. STANDARD OPERATING LIMITS & THRESHOLDS (EDITABLE PARAMETERS)
// ============================================================================
export const BIOFLOC_THRESHOLDS = {
  dissolvedOxygen: {
    unit: "mg/L",
    optimalMin: 5.0,
    optimalMax: 7.5,
    warningLow: 4.5,    // Elevated VFD to 90%
    criticalLow: 3.8    // Emergency 100% VFD Lock & pause feeding
  },
  totalAmmoniaNitrogen: {
    unit: "ppm",
    optimalMax: 0.05,
    warningHigh: 0.20,  // Carbon adjustment alert
    criticalHigh: 0.80  // Emergency carbon dosing (if within 1-3 dose limit) & aerator boost
  },
  waterPh: {
    unit: "pH",
    optimalMin: 7.2,
    optimalMax: 8.2,
    warningLow: 6.8,    // Low alkalinity / nitrification slowing
    warningHigh: 8.5    // Un-ionized NH3 toxicity zone
  },
  temperature: {
    unit: "°C",
    optimalMin: 27.0,
    optimalMax: 30.5
  },
  bioflocVolumeImhoff: {
    unit: "mL/L",
    optimalMin: 10.0,
    optimalMax: 20.0,
    warningHigh: 25.0,  // Central bottom sludge purge recommended
    criticalHigh: 40.0  // Sludge choke hazard
  },
  molassesRules: {
    maxLifetimeApplications: 3, // Max 1 to 3 times total per cycle/outbreak
    maxSingleDoseGrams: 500,
    dilutionRatioPondWater: "1:3",
    statusWhenEstablished: "STANDBY"
  }
}

// ============================================================================
// 4. STANDARD OPERATING PROCEDURES (SOPS)
// ============================================================================
export const BIOFLOC_SOPS = {
  SOP_AERATION: {
    id: "SOP-AERATION",
    title: "VFD Inverter Aerator Regulation & Oxygen Buffer",
    category: "AERATION",
    instructions: [
      "DO > 7.5 mg/L: Set VFD to Eco mode 70% (~1,050 RPM) to conserve power while supersaturated.",
      "DO 5.0 - 7.5 mg/L: Maintain standard baseline 80% (~1,200 RPM) to keep bacterial flocs suspended.",
      "DO 4.0 - 4.9 mg/L: Elevate VFD to 90% (~1,350 RPM) to compensate for elevated respiration demand.",
      "DO < 4.0 mg/L: IMMEDIATE EMERGENCY OVERRIDE to 100% VFD (~1,500 RPM) until DO recovers above 5.0 mg/L.",
      "Nocturnal Pre-charge: Maintain minimum 85% VFD between 21:00 and 06:00 WIB to counter nighttime photosynthetic drop."
    ],
    get rules() { return this.instructions }
  },
  SOP_FEEDING: {
    id: "SOP-FEEDING",
    title: "Partitioned Tilapia Feeding Curve",
    category: "FEEDING",
    instructions: [
      "Daily Ration: Calculated at 2.2% - 2.8% of active fish biomass.",
      "Partitioning: Morning window 30% (08:30 WIB), Afternoon window 40% (14:00 WIB), Evening window 30% (18:00 WIB).",
      "Pre-Feed Check: DO must be >= 5.0 mg/L before auto-feeder dispatch. If DO < 5.0 mg/L, pause feeding automatically to reduce Biological Oxygen Demand (BOD).",
      "Feed Specification: Floating extruded pellets (30-32% crude protein, target FCR 1.15-1.25)."
    ],
    get rules() { return this.instructions }
  },
  SOP_MOLASSES: {
    id: "SOP-MOLASSES",
    title: "Avnimelech C:N Microbial Carbon Protocol (Limited to 1-3 Applications)",
    category: "MOLASSES",
    instructions: [
      "Application Quota: Strictly limited to 1 to 3 applications maximum throughout the biofloc establishment phase or acute TAN spike. NEVER dose daily.",
      "Trigger Check: Administer ONLY if cumulative molasses count < 3 AND (biofloc density < 10 mL/L OR TAN > 0.15 ppm).",
      "Standby Condition: If the pond has already received 1-3 molasses applications, or biofloc density is >= 10 mL/L, place carbon dosing on STANDBY (0 g).",
      "Preparation: Dilute high-brix cane molasses 1:3 with warm pond water prior to injection.",
      "Injection Zone: Dispense directly in front of active aerator paddlewheel for swift uniform dispersion."
    ],
    get rules() { return this.instructions }
  },
  SOP_SIPHON: {
    id: "SOP-SIPHON",
    title: "Zero-Water Exchange & Bottom Sludge Purge",
    category: "SIPHON_FLUSH",
    instructions: [
      "Principle: True zero-water exchange culture; only evacuate dense central anaerobic sludge.",
      "Measurement: 15-minute settleable solids test using Imhoff cone (BFV).",
      "Trigger: BFV > 25 mL/L or central sediment accumulation detected.",
      "Purge Volume: Maximum 200 - 300 Liters per session; never drain upper aerobic water column."
    ],
    get rules() { return this.instructions }
  }
}

// Backwards-compatible alias for existing imports
export const BIOFLOC_KNOWLEDGE_BASE = {
  sciencePrinciples: BIOFLOC_SCIENCE_PRINCIPLES,
  standardOperatingLimits: BIOFLOC_THRESHOLDS,
  sops: BIOFLOC_SOPS
}

// ============================================================================
// 5. GEMINI FUNCTION CALLING TOOL DECLARATIONS
// ============================================================================
export const GEMINI_BIOFLOC_TOOLS = [
  {
    name: "get_all_ponds_overview",
    description: "Fetches live status, telemetry cache, biometrics, and latest AI biological diagnosis records across all active ponds in the farm for holistic fleet health synthesis. Call this whenever the user asks about the condition of all ponds, entire farm, whole fleet, or general facility health.",
    parameters: {
      type: "object",
      properties: {
        includePendingTreatments: {
          type: "boolean",
          description: "Whether to include today's scheduled daily treatments in the synthesis"
        }
      }
    }
  },
  {
    name: "get_pond_telemetry",
    description: "Fetches live sensor telemetry (DO, pH, Temperature, TAN ammonia, Biofloc density, Mud solids) and culture metrics for a specified pond.",
    parameters: {
      type: "object",
      properties: {
        pondId: { 
          type: "string", 
          description: "Pond identifier, e.g. 'K01', 'K02', 'K03', 'K04'" 
        }
      },
      required: ["pondId"]
    }
  },
  {
    name: "get_pond_diagnostic",
    description: "Fetches latest AI biological diagnosis, anomalies detected, and health score for a specified pond.",
    parameters: {
      type: "object",
      properties: {
        pondId: { 
          type: "string", 
          description: "Pond identifier, e.g. 'K01', 'K02', 'K03', 'K04'" 
        }
      },
      required: ["pondId"]
    }
  },
  {
    name: "get_recent_treatments",
    description: "Fetches today's treatment execution history and pending execution queue for a specified pond.",
    parameters: {
      type: "object",
      properties: {
        pondId: { 
          type: "string", 
          description: "Pond identifier, e.g. 'K01', 'K02', 'K03', 'K04'" 
        },
        limit: { 
          type: "number", 
          description: "Maximum number of records to return (default: 10)" 
        }
      },
      required: ["pondId"]
    }
  },
  {
    name: "calculate_biofloc_cn",
    description: "Computes the exact stoichiometric cane molasses dosage based on Avnimelech equation, strictly enforcing the 1-to-3 times application limit.",
    parameters: {
      type: "object",
      properties: {
        pondId: { type: "string", description: "Pond ID, e.g. 'K01'" },
        dailyFeedKg: { type: "number", description: "Total daily feed in kg" },
        currentTanPpm: { type: "number", description: "Current TAN ammonia level in ppm" },
        currentFlocDensity: { type: "number", description: "Current Imhoff biofloc density in mL/L" },
        previousMolassesCount: { type: "number", description: "Number of molasses applications already performed (0 to 3)" }
      },
      required: ["pondId", "dailyFeedKg", "currentTanPpm"]
    }
  },
  {
    name: "adjust_aerator_vfd",
    description: "Dispatches an immediate or scheduled command to set aerator VFD speed power percent (50% to 100%) to regulate dissolved oxygen.",
    parameters: {
      type: "object",
      properties: {
        pondId: { type: "string", description: "Target pond ID, e.g. 'K01'" },
        powerPercent: { type: "number", description: "Aerator power percentage from 50 to 100" },
        rationale: { type: "string", description: "Biological or operational rationale for adjusting aerator speed" }
      },
      required: ["pondId", "powerPercent"]
    }
  },
  {
    name: "dispense_feed",
    description: "Dispatches or schedules a feed ration command to the auto-feeder for the specified pond.",
    parameters: {
      type: "object",
      properties: {
        pondId: { type: "string", description: "Target pond ID, e.g. 'K01'" },
        amountKg: { type: "number", description: "Feed dosage in kilograms" },
        rationWindow: { type: "string", description: "Feeding window (e.g. 'Morning 08:30', 'Afternoon 14:00', 'Evening 18:00', 'Immediate')" },
        rationale: { type: "string", description: "Rationale based on standing biomass and DO check" }
      },
      required: ["pondId", "amountKg"]
    }
  },
  {
    name: "dose_molasses",
    description: "Dispatches or schedules cane molasses carbon injection. Strictly rejected if already applied 3 times.",
    parameters: {
      type: "object",
      properties: {
        pondId: { type: "string", description: "Target pond ID, e.g. 'K01'" },
        amountGrams: { type: "number", description: "Molasses dosage in grams (typically 200g - 450g)" },
        rationale: { type: "string", description: "Rationale for C:N microbial assimilation" }
      },
      required: ["pondId", "amountGrams"]
    }
  },
  {
    name: "purge_bottom_sludge",
    description: "Triggers a central bottom siphon purge of dense anaerobic sediment (maximum 200-300 Liters).",
    parameters: {
      type: "object",
      properties: {
        pondId: { type: "string", description: "Target pond ID, e.g. 'K01'" },
        volumeLiters: { type: "number", description: "Purge volume in Liters (max 300 L)" },
        rationale: { type: "string", description: "Rationale based on Imhoff cone test (> 25 mL/L)" }
      },
      required: ["pondId", "volumeLiters"]
    }
  },
  {
    name: "schedule_daily_treatment_plan",
    description: "Synthesizes and schedules today's complete 4-pillar treatment plan (Feeding, Aeration, Molasses, Siphon) in the Daily Execution Hub with Supervisor Approval.",
    parameters: {
      type: "object",
      properties: {
        pondId: { type: "string", description: "Target pond ID, e.g. 'K01'" },
        feedAmountKg: { type: "number", description: "Total feed ration for today in kg" },
        aeratorPowerPercent: { type: "number", description: "Target aerator VFD speed in %" },
        molassesGrams: { type: "number", description: "Molasses dosage in grams (0 if standby)" },
        actionsSummary: { type: "string", description: "Overview summary of the daily plan" }
      },
      required: ["pondId", "feedAmountKg", "aeratorPowerPercent"]
    }
  },
  {
    name: "adjust_daily_treatment",
    description: "Adjusts, reschedules, or updates the dosage or parameters of an existing task in today's Daily Execution Hub (e.g. modify afternoon feed dose, aerator speed, molasses amount, siphon volume).",
    parameters: {
      type: "object",
      properties: {
        pondId: { type: "string", description: "Target pond ID, e.g. 'K01'" },
        category: { type: "string", enum: ["FEEDING", "AERATION", "MOLASSES", "SIPHON_FLUSH"], description: "Category of treatment to adjust" },
        slotKey: { type: "string", description: "Specific slot key if known, e.g. 'FEEDING_1', 'FEEDING_2', 'FEEDING_3', 'AERATION_SPEED', 'MOLASSES_CN', 'WATER_EXCHANGE'" },
        dosageAmount: { type: "number", description: "New dosage amount (e.g. feed in kg, aerator in %, molasses in g, siphon in L)" },
        dosageUnit: { type: "string", description: "Dosage unit (kg, %, g, L)" },
        notes: { type: "string", description: "Reason or adjustment notes from supervisor" }
      },
      required: ["pondId", "category", "dosageAmount"]
    }
  },
  {
    name: "run_daily_treatment_now",
    description: "Immediately executes and dispatches a scheduled daily treatment task to IoT actuators right now.",
    parameters: {
      type: "object",
      properties: {
        pondId: { type: "string", description: "Target pond ID, e.g. 'K01'" },
        category: { type: "string", enum: ["FEEDING", "AERATION", "MOLASSES", "SIPHON_FLUSH"], description: "Category of treatment to trigger immediately" },
        executionId: { type: "string", description: "Optional specific execution ID to run" }
      },
      required: ["pondId", "category"]
    }
  },
  {
    name: "approve_all_treatments",
    description: "Approves all pending treatments for today for the specified pond, moving them to SCHEDULED status.",
    parameters: {
      type: "object",
      properties: {
        pondId: { type: "string", description: "Target pond ID, e.g. 'K01'" }
      },
      required: ["pondId"]
    }
  }
]

// ============================================================================
// 6. RAG CONTEXT BUILDER (FORMATTED FOR DIRECT LLM INJECTION)
// ============================================================================
export function buildBioflocRagContext(pondId = 'K01', telemetry = {}, previousMolassesCount = 1) {
  const t = BIOFLOC_THRESHOLDS
  return `### BIOFLOC AQUACULTURE SCIENTIFIC CONTEXT & SOP GUIDELINES (POND ${pondId})

1. **Water Quality Safety Thresholds:**
   - Dissolved Oxygen (DO): ${t.dissolvedOxygen.optimalMin} - ${t.dissolvedOxygen.optimalMax} mg/L (Critical < ${t.dissolvedOxygen.criticalLow} mg/L -> Boost 100% VFD).
   - Total Ammonia Nitrogen (TAN): Target < ${t.totalAmmoniaNitrogen.optimalMax} ppm (Warning > ${t.totalAmmoniaNitrogen.warningHigh} ppm).
   - Water pH: ${t.waterPh.optimalMin} - ${t.waterPh.optimalMax}.
   - Water Temp: ${t.temperature.optimalMin} - ${t.temperature.optimalMax} °C.
   - Biofloc Volume (Imhoff): ${t.bioflocVolumeImhoff.optimalMin} - ${t.bioflocVolumeImhoff.optimalMax} mL/L (Purge required if > ${t.bioflocVolumeImhoff.warningHigh} mL/L).

2. **CRITICAL MOLASSES DOSING PROTOCOL (1-3 TIMES ONLY):**
   - Molasses applications are strictly restricted to 1 to 3 times total per culture cycle or acute outbreak.
   - Current Pond Molasses Count: ${previousMolassesCount} / 3.
   - Status: ${previousMolassesCount >= 3 ? 'QUOTA REACHED - STANDBY (0 g Molasses)' : 'ELIGIBLE FOR CARBON DOSING IF TAN > 0.15 ppm'}.
   - Never recommend daily molasses feeding.

3. **Current Telemetry Snapshot for ${pondId}:**
   - DO: ${telemetry.do ?? telemetry.dissolved_oxygen ?? 6.2} mg/L
   - pH: ${telemetry.ph ?? 7.5}
   - Temp: ${telemetry.temp ?? telemetry.temperature ?? 28.5} °C
   - TAN: ${telemetry.ammonia ?? 0.02} ppm
   - Biofloc Density: ${telemetry.flocDensity ?? telemetry.floc_density ?? 14.0} mL/L

4. **Available System Actions & Control Tools:**
   - Fleet Overview: 'get_all_ponds_overview' (All ponds synthesis)
   - Aerator VFD Regulation: 'adjust_aerator_vfd' (50% - 100%)
   - Feed Dispensing: 'dispense_feed' (Ration in kg)
   - Molasses Injection: 'dose_molasses' (Only if count < 3)
   - Bottom Siphon Purge: 'purge_bottom_sludge' (Max 300 L)
   - Daily Treatment Schedule: 'schedule_daily_treatment_plan'`
}

export function buildFleetRagContext(fleetPonds = []) {
  const pondLines = fleetPonds.map(p => {
    const tele = p.telemetry || p.telemetry_cache || {}
    const parsedTele = typeof tele === 'string' ? JSON.parse(tele) : tele
    const pNum = p.id.replace('K0', '').replace('K', '')
    return `• Pond ${pNum} (${p.id}) [${p.species}]: Health Score ${p.health_score ?? 90}/100 (${p.status || 'OPTIMAL'}). DO=${parsedTele.do ?? 6.2} mg/L, pH=${parsedTele.ph ?? 7.5}, Temp=${parsedTele.temp ?? 28.5}°C, TAN=${parsedTele.ammonia ?? 0.02} ppm, Floc=${parsedTele.flocDensity ?? 14} mL/L. Latest AI Diagnosis: "${p.latestDiagnosisSummary || 'Stable steady-state biofloc balance.'}"`
  }).join('\n')

  return `### FLEET-WIDE BIOFLOC FACILITY CONTEXT (${fleetPonds.length} ACTIVE PONDS)
${pondLines}

When the user asks for the condition of all ponds, holistic status, or farm overview:
1. Provide a crisp executive summary of overall facility health and average score.
2. Present a clean Markdown table comparing all ponds: Pond 1, Pond 2, Pond 3, Pond 4.
3. Synthesize the latest biological diagnosis for each pond from the database records above.
4. Highlight any active warnings, critical parameters, and SOP action priorities.`
}

// ============================================================================
// 7. STRUCTURED OUTPUT JSON SCHEMAS (ANTI-HALLUCINATION)
// ============================================================================
export const REALTIME_EVALUATION_SCHEMA = {
  type: "object",
  properties: {
    healthScore: { type: "integer", minimum: 0, maximum: 100 },
    status: { type: "string", enum: ["OPTIMAL", "WARNING", "CRITICAL"] },
    summary: { type: "string" },
    immediateAction: {
      type: "object",
      properties: {
        needed: { type: "boolean" },
        category: { type: "string", enum: ["AERATION", "MOLASSES", "SIPHON_FLUSH", "FEEDING", "NONE"] },
        command: { type: ["string", "null"] },
        dosage: { type: ["string", "null"] },
        reasoning: { type: "string" }
      },
      required: ["needed", "category", "reasoning"]
    }
  },
  required: ["healthScore", "status", "summary", "immediateAction"]
}

export const DAILY_EXECUTION_SYNTHESIS_SCHEMA = {
  type: "object",
  properties: {
    pondId: { type: "string" },
    summary: { type: "string" },
    rationale: { type: "string" },
    healthScore: { type: "integer" },
    healthStatus: { type: "string", enum: ["OPTIMAL BIOFLOC", "OPTIMAL GROWER", "EXCELLENT NURSERY", "STABLE CORE", "ATTENTION REQUIRED"] },
    treatments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          category: { type: "string", enum: ["FEEDING", "AERATION", "MOLASSES", "SIPHON_FLUSH"] },
          categoryLabel: { type: "string" },
          title: { type: "string" },
          dosage: { type: "string" },
          dosageAmount: { type: "number" },
          dosageUnit: { type: "string" },
          aeratorPowerPercent: { type: ["number", "null"] },
          aeratorRpm: { type: ["number", "null"] },
          scheduledTime: { type: "string" },
          status: { type: "string", enum: ["PENDING", "SCHEDULED", "RUNNING", "SUCCESS", "REJECTED", "STANDBY"] },
          notes: { type: "string" }
        },
        required: ["category", "title", "dosage", "dosageAmount", "dosageUnit", "scheduledTime", "status"]
      }
    }
  },
  required: ["pondId", "summary", "rationale", "healthScore", "healthStatus", "treatments"]
}
