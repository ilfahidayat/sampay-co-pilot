import { ref, computed } from 'vue'
import { frontendMqttClient, mqttStatus } from '../services/mqttClient'
import { apiClient } from '../services/apiClient'

const selectedPondId = ref('K04')
const isLiveSimulationRunning = ref(true)

// Initial Ponds dataset with cumulative feed, molasses, initial stocking biomass for live FCR calculation
export const ponds = ref([
  {
    id: 'K01',
    name: 'Pond 1',
    species: 'Red Tilapia (Oreochromis niloticus)',
    phase: 'Finisher Stage (Ready for Harvest)',
    fishCount: 1850,
    avgWeightGrams: 920,
    volumeM3: 50,
    status: 'OPTIMAL',
    healthScore: 98,
    isPowered: true,
    isOnline: true,
    simulationCondition: 'ok',
    uptimeSeconds: 420,
    batteryPercent: 94,
    batteryVoltage: 24.2,
    wifiRssi: -58,
    initialBiomassKg: 460, // Initial fingerling stocking weight
    initialFishCount: 2000,
    initialWeightGrams: 230,
    targetHarvestWeightGrams: 950,
    stockingDate: '12 Jan 2026',
    doc: 112, // Days of Culture
    survivalRate: 92.5, // %
    adgGramsDay: 6.16, // g/day
    cycleStatus: 'ACTIVE', // 'ACTIVE' | 'HARVESTED' | 'TRANSFERRED'
    cumulativeFeedKg: 1450.8, // Total cycle feed delivered
    cumulativeMolassesKg: 36.5, // Total cycle molasses delivered
    todayMolassesGrams: 400,
    cumulativeMortalityCount: 150,
    mortalityLogs: [
      { id: 'MORT-101', date: '14 Oct 2026, 07:30 WIB', count: 4, avgWeightGrams: 910, biomassLostKg: 3.64, cause: 'Density Stress / Old Age', disposalMethod: 'Buried with quicklime', notes: 'Routine morning scoop' },
      { id: 'MORT-100', date: '10 Oct 2026, 08:15 WIB', count: 8, avgWeightGrams: 880, biomassLostKg: 7.04, cause: 'Thermal Fluctuation', disposalMethod: 'Buried with quicklime', notes: 'Hot afternoon temp drop' }
    ],
    growthHistory: [
      { doc: 1, abw: 230, biomassKg: 460, feedKg: 0, note: 'Stocking Finisher Stage' },
      { doc: 30, abw: 420, biomassKg: 820, feedKg: 380, note: 'Sampling 1' },
      { doc: 60, abw: 630, biomassKg: 1210, feedKg: 790, note: 'Sampling 2' },
      { doc: 90, abw: 810, biomassKg: 1530, feedKg: 1220, note: 'Sampling 3' },
      { doc: 112, abw: 920, biomassKg: 1702, feedKg: 1450.8, note: 'Pre-harvest Assessment' }
    ],
    telemetry: {
      do: 6.4,
      ph: 7.6,
      temp: 28.8,
      ammonia: 0.015,
      flocDensity: 14, // mL/L
      orp: 280, // mV
      tds: 1100, // ppm
      flocSensor: {
        model: 'Imhoff-Vision AI (ESP32-CAM) & NIR-860nm Probe',
        protocol: 'RS485 Modbus RTU (Addr: 0x01)',
        od600: 0.48, // AU (Optical Density)
        tssMgL: 560, // mg/L (Total Suspended Solids)
        settlingRate: '1.9 mm/min',
        samplingMethod: '15-min Motorized Imhoff Settling Chamber',
        calibrationStd: 'SNI 7550:2009 / APHA 2540 F'
      }
    },
    actuators: {
      feeder: { id: 'ESP32-K01-FD', name: 'Auto-Feeder #1', status: 'IDLE', dispensedTodayKg: 22.4, targetDailyKg: 48.0, nextSchedule: '14:00' },
      aerator: { id: 'ESP32-K01-AR', name: 'VFD Aerator #1', status: 'RUNNING', powerPercent: 80, mode: 'AUTO' },
      dosing: { id: 'ESP32-K01-DS', name: 'Molasses Valve', status: 'STANDBY', flowMlMin: 0 },
      flush: { id: 'ESP32-K01-FLUSH', name: 'Emergency Siphon Valve', status: 'STANDBY', drainRateM3H: 15, lastFlushed: 'None (Zero-Exchange)' }
    }
  },
  {
    id: 'K02',
    name: 'Pond 2',
    species: 'Black Tilapia (Gift Strain)',
    phase: 'Grower Stage (Rapid Growth)',
    fishCount: 2200,
    avgWeightGrams: 420,
    volumeM3: 50,
    status: 'OPTIMAL',
    healthScore: 94,
    isPowered: true,
    isOnline: true,
    simulationCondition: 'ok',
    uptimeSeconds: 310,
    batteryPercent: 88,
    batteryVoltage: 24.1,
    wifiRssi: -62,
    initialBiomassKg: 280,
    initialFishCount: 2350,
    initialWeightGrams: 120,
    targetHarvestWeightGrams: 850,
    stockingDate: '02 Feb 2026',
    doc: 74,
    survivalRate: 93.6,
    adgGramsDay: 4.05,
    cycleStatus: 'ACTIVE',
    cumulativeFeedKg: 755.4,
    cumulativeMolassesKg: 19.8,
    todayMolassesGrams: 250,
    cumulativeMortalityCount: 150,
    mortalityLogs: [
      { id: 'MORT-201', date: '12 Oct 2026, 08:00 WIB', count: 6, avgWeightGrams: 410, biomassLostKg: 2.46, cause: 'Cannibalism / Fin Nipping', disposalMethod: 'Buried with quicklime', notes: 'Nipping observed during fast feeding' }
    ],
    growthHistory: [
      { doc: 1, abw: 120, biomassKg: 280, feedKg: 0, note: 'Stocking Grower Batch' },
      { doc: 25, abw: 210, biomassKg: 485, feedKg: 230, note: 'Sampling 1' },
      { doc: 50, abw: 320, biomassKg: 720, feedKg: 490, note: 'Sampling 2' },
      { doc: 74, abw: 420, biomassKg: 924, feedKg: 755.4, note: 'Sampling 3' }
    ],
    telemetry: {
      do: 5.9,
      ph: 7.4,
      temp: 29.1,
      ammonia: 0.025,
      flocDensity: 11,
      orp: 265,
      tds: 1050,
      flocSensor: {
        model: 'Imhoff-Vision AI (ESP32-CAM) & NIR-860nm Probe',
        protocol: 'RS485 Modbus RTU (Addr: 0x02)',
        od600: 0.38,
        tssMgL: 440,
        settlingRate: '1.6 mm/min',
        samplingMethod: '15-min Motorized Imhoff Settling Chamber',
        calibrationStd: 'SNI 7550:2009 / APHA 2540 F'
      }
    },
    actuators: {
      feeder: { id: 'ESP32-K02-FD', name: 'Auto-Feeder #2', status: 'IDLE', dispensedTodayKg: 14.8, targetDailyKg: 32.0, nextSchedule: '14:00' },
      aerator: { id: 'ESP32-K02-AR', name: 'VFD Aerator #2', status: 'RUNNING', powerPercent: 75, mode: 'AUTO' },
      dosing: { id: 'ESP32-K02-DS', name: 'Molasses Valve', status: 'STANDBY', flowMlMin: 0 },
      flush: { id: 'ESP32-K02-FLUSH', name: 'Emergency Siphon Valve', status: 'STANDBY', drainRateM3H: 15, lastFlushed: 'None (Zero-Exchange)' }
    }
  },
  {
    id: 'K03',
    name: 'Pond 3',
    species: 'Red Tilapia F1 Fingerlings',
    phase: 'Nursery Stage (Fingerlings)',
    fishCount: 4500,
    avgWeightGrams: 85,
    volumeM3: 30,
    status: 'OPTIMAL',
    healthScore: 97,
    isPowered: true,
    isOnline: true,
    simulationCondition: 'ok',
    uptimeSeconds: 220,
    batteryPercent: 91,
    batteryVoltage: 24.3,
    wifiRssi: -55,
    initialBiomassKg: 85,
    initialFishCount: 4650,
    initialWeightGrams: 18,
    targetHarvestWeightGrams: 100, // Nursery grading target
    stockingDate: '18 Mar 2026',
    doc: 27,
    survivalRate: 96.8,
    adgGramsDay: 2.48,
    cycleStatus: 'ACTIVE',
    cumulativeFeedKg: 315.2,
    cumulativeMolassesKg: 8.2,
    todayMolassesGrams: 150,
    cumulativeMortalityCount: 150,
    mortalityLogs: [
      { id: 'MORT-301', date: '13 Oct 2026, 07:45 WIB', count: 12, avgWeightGrams: 80, biomassLostKg: 0.96, cause: 'Grading Stress', disposalMethod: 'Buried with quicklime', notes: 'Post-netting recovery' }
    ],
    growthHistory: [
      { doc: 1, abw: 18, biomassKg: 85, feedKg: 0, note: 'Fingerling Stocking' },
      { doc: 14, abw: 50, biomassKg: 230, feedKg: 140, note: 'Mid-Nursery Check' },
      { doc: 27, abw: 85, biomassKg: 383, feedKg: 315.2, note: 'Grading Prep' }
    ],
    telemetry: {
      do: 6.8,
      ph: 7.8,
      temp: 28.2,
      ammonia: 0.012,
      flocDensity: 8,
      orp: 295,
      tds: 920,
      flocSensor: {
        model: 'Imhoff-Vision AI (ESP32-CAM) & NIR-860nm Probe',
        protocol: 'RS485 Modbus RTU (Addr: 0x03)',
        od600: 0.28,
        tssMgL: 320,
        settlingRate: '1.4 mm/min',
        samplingMethod: '15-min Motorized Imhoff Settling Chamber',
        calibrationStd: 'SNI 7550:2009 / APHA 2540 F'
      }
    },
    actuators: {
      feeder: { id: 'ESP32-K03-FD', name: 'Auto-Feeder #3', status: 'IDLE', dispensedTodayKg: 6.2, targetDailyKg: 15.0, nextSchedule: '13:30' },
      aerator: { id: 'ESP32-K03-AR', name: 'VFD Aerator #3', status: 'RUNNING', powerPercent: 70, mode: 'AUTO' },
      dosing: { id: 'ESP32-K03-DS', name: 'Molasses Valve', status: 'STANDBY', flowMlMin: 0 },
      flush: { id: 'ESP32-K03-FLUSH', name: 'Emergency Siphon Valve', status: 'STANDBY', drainRateM3H: 15, lastFlushed: 'None (Zero-Exchange)' }
    }
  },
  {
    id: 'K04',
    name: 'Pond 4',
    species: 'Super Biofloc Tilapia',
    phase: 'Commercial Grow-Out (Focus Demo)',
    fishCount: 1700,
    avgWeightGrams: 850,
    volumeM3: 50,
    status: 'OPTIMAL',
    healthScore: 96,
    isPowered: true,
    isOnline: true,
    simulationCondition: 'warning',
    uptimeSeconds: 510,
    batteryPercent: 79,
    batteryVoltage: 23.9,
    wifiRssi: -66,
    initialBiomassKg: 380,
    initialFishCount: 1780,
    initialWeightGrams: 215,
    targetHarvestWeightGrams: 900,
    stockingDate: '15 Dec 2025',
    doc: 96,
    survivalRate: 95.5,
    adgGramsDay: 6.61,
    cycleStatus: 'ACTIVE',
    cumulativeFeedKg: 1225.4,
    cumulativeMolassesKg: 28.5,
    todayMolassesGrams: 700,
    cumulativeMortalityCount: 80,
    mortalityLogs: [
      { id: 'MORT-401', date: '14 Oct 2026, 08:00 WIB', count: 5, avgWeightGrams: 840, biomassLostKg: 4.20, cause: 'Ammonia Spike Stress', disposalMethod: 'Buried with quicklime', notes: 'Temporary TAN spike before molasses buffer' }
    ],
    growthHistory: [
      { doc: 1, abw: 215, biomassKg: 380, feedKg: 0, note: 'Stocking Grow-Out' },
      { doc: 30, abw: 430, biomassKg: 750, feedKg: 360, note: 'Sampling 1' },
      { doc: 60, abw: 640, biomassKg: 1100, feedKg: 760, note: 'Sampling 2' },
      { doc: 96, abw: 850, biomassKg: 1445, feedKg: 1225.4, note: 'Current Demo State' }
    ],
    telemetry: {
      do: 6.2,
      ph: 7.5,
      temp: 28.5,
      ammonia: 0.02,
      flocDensity: 12, // mL/L
      orp: 275,
      tds: 1150,
      flocSensor: {
        model: 'Imhoff-Vision AI (ESP32-CAM) & NIR-860nm Probe',
        protocol: 'RS485 Modbus RTU (Addr: 0x04)',
        od600: 0.42,
        tssMgL: 485,
        settlingRate: '1.8 mm/min',
        samplingMethod: '15-min Motorized Imhoff Settling Chamber',
        calibrationStd: 'SNI 7550:2009 / APHA 2540 F'
      }
    },
    actuators: {
      feeder: { id: 'ESP32-K04-FD', name: 'Smart Auto-Feeder', status: 'IDLE', dispensedTodayKg: 18.5, targetDailyKg: 43.5, nextSchedule: '14:00 (5.2 kg)' },
      aerator: { id: 'ESP32-K04-AR', name: 'Dual VFD Aerator (1HP)', status: 'RUNNING', powerPercent: 82, mode: 'AUTO-LOOP' },
      dosing: { id: 'ESP32-K04-DS', name: 'Molasses Solenoid Valve', status: 'STANDBY', flowMlMin: 0 },
      flush: { id: 'ESP32-K04-FLUSH', name: 'Emergency Siphon Valve', status: 'STANDBY', drainRateM3H: 15, lastFlushed: 'None (Zero-Exchange Biofloc)' }
    }
  }
])

// Operational Action Activity Log with AUTO vs MANUAL_ADJUST provenance
const operationalLogs = ref([
  // Today (2026-10-16)
  {
    id: 'ACT-9407',
    date: '2026-10-16',
    time: '15:30:10 WIB',
    pondId: 'K02',
    pondName: 'Pond 2',
    category: 'SIPHON_FLUSH',
    type: 'MANUAL_ADJUST',
    actor: 'Ilfa Hidayat (Supervisor Purge)',
    action: 'Central sludge siphon & water exchange',
    dosage: '10% Exch (5.0 m³)',
    hardware: 'ESP32-K02-FLUSH (Siphon Valve)',
    status: 'EXECUTED',
    notes: 'Purged dense bottom organic solids; refreshed water volume'
  },
  {
    id: 'ACT-9406',
    date: '2026-10-16',
    time: '14:10:25 WIB',
    pondId: 'K01',
    pondName: 'Pond 1',
    category: 'AERATION',
    type: 'AUTO',
    actor: 'Closed-Loop VFD Automation',
    action: 'Blower frequency set to 80% power (~1,200 RPM)',
    dosage: '80% Power',
    hardware: 'ESP32-K01-AR (Dual VFD)',
    status: 'EXECUTED',
    notes: 'Optical DO verified above 6.10 mg/L'
  },
  {
    id: 'ACT-9405',
    date: '2026-10-16',
    time: '11:25:40 WIB',
    pondId: 'K04',
    pondName: 'Pond 4',
    category: 'FEEDING',
    type: 'AUTO',
    actor: 'Smart Auto-Feeder Schedule (AI Loop)',
    action: 'Auto-dispense 5.2 kg BioGrow-7 feed pellets',
    dosage: '+5.2 kg',
    hardware: 'ESP32-K04-FD (Smart Feeder)',
    status: 'EXECUTED',
    notes: 'DO level verified safe (6.2 mg/L) prior to automated feeder dispatch'
  },
  {
    id: 'ACT-9404',
    date: '2026-10-16',
    time: '10:45:12 WIB',
    pondId: 'K04',
    pondName: 'Pond 4',
    category: 'MOLASSES',
    type: 'MANUAL_ADJUST',
    actor: 'Ilfa Hidayat (Supervisor Adjustment)',
    action: 'Manual injection 350g Cane Molasses carbon solution',
    dosage: '+350 g',
    hardware: 'ESP32-K04-DS (Solenoid Valve)',
    status: 'EXECUTED',
    notes: 'C:N ratio adjusted to 15:1 following ammonia rise to 0.025 ppm'
  },
  {
    id: 'ACT-9403',
    date: '2026-10-16',
    time: '09:15:30 WIB',
    pondId: 'K02',
    pondName: 'Pond 2',
    category: 'AERATION',
    type: 'AUTO',
    actor: 'Closed-Loop VFD Automation',
    action: 'Ramped blower power to 75% RPM based on optical sensor',
    dosage: '75% RPM',
    hardware: 'ESP32-K02-AR (Dual VFD)',
    status: 'EXECUTED',
    notes: 'Dynamic frequency modulation for daytime energy optimization'
  },
  {
    id: 'ACT-9402',
    date: '2026-10-16',
    time: '07:30:00 WIB',
    pondId: 'K01',
    pondName: 'Pond 1',
    category: 'FEEDING',
    type: 'AUTO',
    actor: 'Morning Schedule Window',
    action: 'Dispensed 11.2 kg finisher pellet ration',
    dosage: '+11.2 kg',
    hardware: 'ESP32-K01-FD (Auto-Feeder)',
    status: 'EXECUTED',
    notes: 'Fish active, strong feeding response at 28.5°C'
  },
  {
    id: 'ACT-9401',
    date: '2026-10-16',
    time: '07:00:15 WIB',
    pondId: 'K03',
    pondName: 'Pond 3',
    category: 'FEEDING',
    type: 'AUTO',
    actor: 'Nursery Micro-Feeder Loop',
    action: 'Dispensed 4.2 kg high-protein starter crumble',
    dosage: '+4.2 kg',
    hardware: 'ESP32-K03-FD (Micro Feeder)',
    status: 'EXECUTED',
    notes: 'Calm water surface maintained for fingerling grazing'
  },

  // Yesterday (2026-10-15)
  {
    id: 'ACT-9390',
    date: '2026-10-15',
    time: '16:00:20 WIB',
    pondId: 'K04',
    pondName: 'Pond 4',
    category: 'SIPHON_FLUSH',
    type: 'MANUAL_ADJUST',
    actor: 'Ilfa Hidayat (Supervisor Adjustment)',
    action: 'Bottom sludge evacuation & fresh water exchange',
    dosage: '5% Exch (2.5 m³)',
    hardware: 'ESP32-K04-FLUSH (Siphon Valve)',
    status: 'EXECUTED',
    notes: 'Sludge evacuation completed, fresh dechlorinated water replenished'
  },
  {
    id: 'ACT-9389',
    date: '2026-10-15',
    time: '14:30:00 WIB',
    pondId: 'K01',
    pondName: 'Pond 1',
    category: 'MOLASSES',
    type: 'MANUAL_ADJUST',
    actor: 'Ilfa Hidayat (Supervisor Adjustment)',
    action: 'Organic cane molasses injection for C:N balance',
    dosage: '+400 g',
    hardware: 'ESP32-K01-DS (Solenoid Valve)',
    status: 'EXECUTED',
    notes: 'Maintained heterotrophic single-cell protein production'
  },
  {
    id: 'ACT-9388',
    date: '2026-10-15',
    time: '11:00:00 WIB',
    pondId: 'K02',
    pondName: 'Pond 2',
    category: 'FEEDING',
    type: 'AUTO',
    actor: 'Automated Feeder Window',
    action: 'Dispensed 7.2 kg BioGrow-7 feed pellets',
    dosage: '+7.2 kg',
    hardware: 'ESP32-K02-FD (Auto-Feeder)',
    status: 'EXECUTED',
    notes: 'Feed consumption verified in 15 minutes'
  },
  {
    id: 'ACT-9387',
    date: '2026-10-15',
    time: '08:45:10 WIB',
    pondId: 'K03',
    pondName: 'Pond 3',
    category: 'AERATION',
    type: 'AUTO',
    actor: 'Nursery VFD Automation',
    action: 'Regulated micro-bubble blower to 60% power',
    dosage: '60% Power',
    hardware: 'ESP32-K03-AR (Micro VFD)',
    status: 'EXECUTED',
    notes: 'Laminar flow verified, no excessive shear stress on fry'
  },
  {
    id: 'ACT-9386',
    date: '2026-10-15',
    time: '07:15:00 WIB',
    pondId: 'K04',
    pondName: 'Pond 4',
    category: 'FEEDING',
    type: 'AUTO',
    actor: 'Morning Schedule Window',
    action: 'Dispensed 8.8 kg core ration pellets',
    dosage: '+8.8 kg',
    hardware: 'ESP32-K04-FD (Smart Feeder)',
    status: 'EXECUTED',
    notes: 'High appetite observed; floc volume 15.5 mL/L'
  },

  // 2 Days Ago (2026-10-14)
  {
    id: 'ACT-9375',
    date: '2026-10-14',
    time: '16:30:00 WIB',
    pondId: 'K01',
    pondName: 'Pond 1',
    category: 'SIPHON_FLUSH',
    type: 'MANUAL_ADJUST',
    actor: 'Ilfa Hidayat (Routine Purge)',
    action: 'Central sludge drain purge and water exchange',
    dosage: '8% Exch (4.0 m³)',
    hardware: 'ESP32-K01-FLUSH (Siphon Valve)',
    status: 'EXECUTED',
    notes: 'Purged settled dead bacterial flocs from center cone'
  },
  {
    id: 'ACT-9374',
    date: '2026-10-14',
    time: '13:00:00 WIB',
    pondId: 'K04',
    pondName: 'Pond 4',
    category: 'MOLASSES',
    type: 'MANUAL_ADJUST',
    actor: 'Ilfa Hidayat (Supervisor Adjustment)',
    action: 'Molasses dosage for carbon balance recharge',
    dosage: '+320 g',
    hardware: 'ESP32-K04-DS (Solenoid Valve)',
    status: 'EXECUTED',
    notes: 'TAN stabilized at 0.02 ppm post dosing'
  },
  {
    id: 'ACT-9373',
    date: '2026-10-14',
    time: '10:15:00 WIB',
    pondId: 'K02',
    pondName: 'Pond 2',
    category: 'FEEDING',
    type: 'AUTO',
    actor: 'Smart Auto-Feeder Routine',
    action: 'Dispensed 7.0 kg BioGrow-7 ration',
    dosage: '+7.0 kg',
    hardware: 'ESP32-K02-FD (Auto-Feeder)',
    status: 'EXECUTED',
    notes: 'Normal consumption pattern'
  },
  {
    id: 'ACT-9372',
    date: '2026-10-14',
    time: '07:30:00 WIB',
    pondId: 'K01',
    pondName: 'Pond 1',
    category: 'FEEDING',
    type: 'AUTO',
    actor: 'Morning Schedule Window',
    action: 'Dispensed 10.5 kg finisher pellet ration',
    dosage: '+10.5 kg',
    hardware: 'ESP32-K01-FD (Auto-Feeder)',
    status: 'EXECUTED',
    notes: 'Good vigorous feeding activity'
  },

  // 3 Days Ago (2026-10-13)
  {
    id: 'ACT-9362',
    date: '2026-10-13',
    time: '15:15:00 WIB',
    pondId: 'K02',
    pondName: 'Pond 2',
    category: 'SIPHON_FLUSH',
    type: 'MANUAL_ADJUST',
    actor: 'Ilfa Hidayat (Routine Purge)',
    action: 'Bottom sludge siphon evacuation',
    dosage: '10% Exch (5.0 m³)',
    hardware: 'ESP32-K02-FLUSH (Siphon Valve)',
    status: 'EXECUTED',
    notes: 'Bottom center drain inspected clean'
  },
  {
    id: 'ACT-9361',
    date: '2026-10-13',
    time: '11:45:00 WIB',
    pondId: 'K01',
    pondName: 'Pond 1',
    category: 'MOLASSES',
    type: 'MANUAL_ADJUST',
    actor: 'Ilfa Hidayat (Supervisor Adjustment)',
    action: 'Molasses addition for biofloc nitrogen buffering',
    dosage: '+380 g',
    hardware: 'ESP32-K01-DS (Solenoid Valve)',
    status: 'EXECUTED',
    notes: 'Heterotrophic flocs healthy at 13.5 mL/L'
  },
  {
    id: 'ACT-9360',
    date: '2026-10-13',
    time: '08:00:00 WIB',
    pondId: 'K04',
    pondName: 'Pond 4',
    category: 'FEEDING',
    type: 'AUTO',
    actor: 'Morning Auto-Feeder Routine',
    action: 'Dispensed 8.5 kg core pellets',
    dosage: '+8.5 kg',
    hardware: 'ESP32-K04-FD (Smart Feeder)',
    status: 'EXECUTED',
    notes: 'DO stable at 6.25 mg/L'
  },

  // 4 Days Ago (2026-10-12)
  {
    id: 'ACT-9350',
    date: '2026-10-12',
    time: '15:30:00 WIB',
    pondId: 'K04',
    pondName: 'Pond 4',
    category: 'SIPHON_FLUSH',
    type: 'MANUAL_ADJUST',
    actor: 'Ilfa Hidayat (Supervisor Adjustment)',
    action: 'Sludge purge & water exchange',
    dosage: '6% Exch (3.0 m³)',
    hardware: 'ESP32-K04-FLUSH (Siphon Valve)',
    status: 'EXECUTED',
    notes: 'Weekly bottom drain purge executed'
  },
  {
    id: 'ACT-9348',
    date: '2026-10-12',
    time: '11:00:00 WIB',
    pondId: 'K04',
    pondName: 'Pond 4',
    category: 'MOLASSES',
    type: 'MANUAL_ADJUST',
    actor: 'Ilfa Hidayat (Supervisor Adjustment)',
    action: 'Post-feeding molasses carbon dose',
    dosage: '+350 g',
    hardware: 'ESP32-K04-DS (Solenoid Valve)',
    status: 'EXECUTED',
    notes: 'Maintained total ammonia below 0.03 ppm'
  },
  {
    id: 'ACT-9347',
    date: '2026-10-12',
    time: '07:30:00 WIB',
    pondId: 'K01',
    pondName: 'Pond 1',
    category: 'FEEDING',
    type: 'AUTO',
    actor: 'Morning Feeding Window',
    action: 'Dispensed 10.8 kg finisher pellets',
    dosage: '+10.8 kg',
    hardware: 'ESP32-K01-FD (Auto-Feeder)',
    status: 'EXECUTED',
    notes: 'Week opening feed cycle verified'
  },

  // 5 Days Ago (2026-10-11)
  {
    id: 'ACT-9338',
    date: '2026-10-11',
    time: '15:00:00 WIB',
    pondId: 'K02',
    pondName: 'Pond 2',
    category: 'SIPHON_FLUSH',
    type: 'MANUAL_ADJUST',
    actor: 'Ilfa Hidayat (Sunday Maintenance)',
    action: 'Weekend organic waste siphon evacuation',
    dosage: '8% Exch (4.0 m³)',
    hardware: 'ESP32-K02-FLUSH (Siphon Valve)',
    status: 'EXECUTED',
    notes: 'Cleaned central drain line; fresh water added'
  },
  {
    id: 'ACT-9336',
    date: '2026-10-11',
    time: '10:00:00 WIB',
    pondId: 'K04',
    pondName: 'Pond 4',
    category: 'MOLASSES',
    type: 'MANUAL_ADJUST',
    actor: 'Ilfa Hidayat (Sunday Maintenance)',
    action: 'Weekend carbon boosting solution',
    dosage: '+350 g',
    hardware: 'ESP32-K04-DS (Solenoid Valve)',
    status: 'EXECUTED',
    notes: 'Heterotrophic flocs well suspended'
  },
  {
    id: 'ACT-9335',
    date: '2026-10-11',
    time: '07:30:00 WIB',
    pondId: 'K01',
    pondName: 'Pond 1',
    category: 'FEEDING',
    type: 'AUTO',
    actor: 'Weekend Auto-Feeder Schedule',
    action: 'Dispensed 10.2 kg BioGrow-7 feed pellets',
    dosage: '+10.2 kg',
    hardware: 'ESP32-K01-FD (Auto-Feeder)',
    status: 'EXECUTED',
    notes: 'Brown tea-colored healthy water'
  },

  // 6 Days Ago (2026-10-10)
  {
    id: 'ACT-9325',
    date: '2026-10-10',
    time: '16:15:00 WIB',
    pondId: 'K01',
    pondName: 'Pond 1',
    category: 'SIPHON_FLUSH',
    type: 'MANUAL_ADJUST',
    actor: 'Ilfa Hidayat (Routine Purge)',
    action: 'Bottom sludge evacuation',
    dosage: '6% Exch (3.0 m³)',
    hardware: 'ESP32-K01-FLUSH (Siphon Valve)',
    status: 'EXECUTED',
    notes: 'Sludge purged cleanly'
  },
  {
    id: 'ACT-9324',
    date: '2026-10-10',
    time: '11:15:00 WIB',
    pondId: 'K04',
    pondName: 'Pond 4',
    category: 'MOLASSES',
    type: 'MANUAL_ADJUST',
    actor: 'Ilfa Hidayat (Supervisor Adjustment)',
    action: 'Organic carbon buffer injection',
    dosage: '+340 g',
    hardware: 'ESP32-K04-DS (Solenoid Valve)',
    status: 'EXECUTED',
    notes: 'Microbial activity boosted'
  },
  {
    id: 'ACT-9322',
    date: '2026-10-10',
    time: '07:00:00 WIB',
    pondId: 'K01',
    pondName: 'Pond 1',
    category: 'FEEDING',
    type: 'AUTO',
    actor: 'Morning Schedule Window',
    action: 'Dispensed 10.0 kg finisher ration',
    dosage: '+10.0 kg',
    hardware: 'ESP32-K01-FD (Auto-Feeder)',
    status: 'EXECUTED',
    notes: 'Rapid feed intake observed'
  }
])

const addOperationalLog = (entry) => {
  const now = new Date()
  operationalLogs.value.unshift({
    id: `ACT-${Date.now().toString().slice(-4)}`,
    date: entry.date || '2026-10-16',
    time: entry.time || (now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB'),
    ...entry
  })
}

// Active selected pond computed
export const activePond = computed(() => {
  return ponds.value.find(p => p.id === selectedPondId.value) || ponds.value[3]
})

// Multi-Timeframe Telemetry History Data Generators (24h Daily, 7d Weekly, 30d Monthly)
export const generateHistoryData = (timeRange = '24h', targetPond = null) => {
  const points = []
  const pond = targetPond || activePond.value
  const targetDo = pond?.telemetry?.do || 6.2
  const targetTemp = pond?.telemetry?.temp || 28.5
  const targetAmmonia = pond?.telemetry?.ammonia || 0.02
  const targetPh = pond?.telemetry?.ph || 7.5
  const targetFloc = pond?.telemetry?.flocDensity || 12
  const targetOrp = pond?.telemetry?.orp || 275

  if (timeRange === '24h') {
    // 25 hourly sample points across 24 hours
    for (let i = 24; i >= 0; i--) {
      const hourVal = (24 - i + 8) % 24
      const timeLabel = `${String(hourVal).padStart(2, '0')}:00`
      let baseDo = targetDo + Math.sin((hourVal - 6) / 24 * Math.PI * 2) * 0.95
      let baseTemp = targetTemp + Math.sin((hourVal - 9) / 24 * Math.PI * 2) * 1.1
      let baseAmmonia = targetAmmonia + (hourVal > 11 && hourVal < 16 ? 0.006 : -0.003)
      let basePh = targetPh + Math.sin((hourVal - 8) / 24 * Math.PI * 2) * 0.15
      let baseFloc = Math.round(targetFloc + Math.sin(hourVal / 12 * Math.PI) * 1.2)
      let baseOrp = Math.round(targetOrp + (baseDo - targetDo) * 18 + (Math.random() * 6 - 3))

      points.push({
        time: timeLabel,
        do: Number((baseDo + (Math.random() * 0.14 - 0.07)).toFixed(2)),
        ph: Number((basePh + (Math.random() * 0.08 - 0.04)).toFixed(2)),
        temp: Number((baseTemp + (Math.random() * 0.16 - 0.08)).toFixed(1)),
        ammonia: Number(Math.max(0.005, baseAmmonia + (Math.random() * 0.003 - 0.0015)).toFixed(3)),
        flocDensity: Math.max(2, baseFloc),
        orp: baseOrp,
        verified: true,
        status: baseDo >= 5.0 && baseAmmonia <= 0.045 ? 'OPTIMAL' : 'MONITOR'
      })
    }
  } else if (timeRange === '7d') {
    // 7 daily points for the past week
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun (Today)']
    for (let i = 0; i < 7; i++) {
      const baseDo = targetDo + Math.sin(i * 0.8) * 0.35
      const baseTemp = targetTemp + Math.cos(i * 0.6) * 0.45
      const baseAmmonia = targetAmmonia + (i % 3 === 0 ? 0.005 : -0.003)
      const basePh = targetPh + (i % 2 === 0 ? 0.08 : -0.06)

      points.push({
        time: dayNames[i],
        do: Number((baseDo + (Math.random() * 0.12 - 0.06)).toFixed(2)),
        ph: Number((basePh + (Math.random() * 0.08 - 0.04)).toFixed(2)),
        temp: Number((baseTemp + (Math.random() * 0.18 - 0.09)).toFixed(1)),
        ammonia: Number(Math.max(0.008, baseAmmonia).toFixed(3)),
        flocDensity: Math.round(targetFloc + (i * 0.4) - 1.2),
        orp: Math.round(targetOrp + (baseDo - targetDo) * 15),
        verified: true,
        status: 'OPTIMAL'
      })
    }
  } else if (timeRange === '30d') {
    // 30 daily sample points across the month
    for (let d = 1; d <= 30; d++) {
      const timeLabel = `Day ${d}`
      const baseDo = targetDo - (d > 22 ? 0.15 : 0) + Math.sin(d * 0.5) * 0.3
      const baseTemp = targetTemp + Math.cos(d * 0.3) * 0.5
      const baseAmmonia = targetAmmonia - (d * 0.00015) + Math.sin(d * 0.8) * 0.004
      const basePh = targetPh + Math.sin(d * 0.4) * 0.1

      points.push({
        time: timeLabel,
        do: Number((baseDo + (Math.random() * 0.15 - 0.07)).toFixed(2)),
        ph: Number((basePh + (Math.random() * 0.1 - 0.05)).toFixed(2)),
        temp: Number((baseTemp + (Math.random() * 0.2 - 0.1)).toFixed(1)),
        ammonia: Number(Math.max(0.010, baseAmmonia).toFixed(3)),
        flocDensity: Math.round(Math.min(22, targetFloc * (0.6 + (d / 30) * 0.5))),
        orp: Math.round(targetOrp + Math.sin(d * 0.3) * 12),
        verified: true,
        status: 'OPTIMAL'
      })
    }
  }

  return points
}

const historyLogs = ref(generateHistoryData('24h'))

// Active pond specific FCR & Biomass metrics
const activePondBiomassMetrics = computed(() => {
  const p = activePond.value
  if (!p) return {}

  const currentBiomassKg = Math.round(p.fishCount * p.avgWeightGrams / 1000)
  const stockingBiomassKg = p.initialBiomassKg || 380
  const netGainKg = Math.max(1, currentBiomassKg - stockingBiomassKg)
  const cumulativeFeedKg = Number((p.cumulativeFeedKg || 1200).toFixed(1))
  const estimatedFcr = Number((cumulativeFeedKg / netGainKg).toFixed(2))

  let fcrRating = 'EXCELLENT'
  let fcrBadgeClass = 'badge-emerald'
  if (estimatedFcr > 1.3) {
    fcrRating = 'ELEVATED'
    fcrBadgeClass = 'badge-amber'
  } else if (estimatedFcr > 1.5) {
    fcrRating = 'HIGH / CAUTION'
    fcrBadgeClass = 'badge-rose'
  }

  return {
    currentBiomassKg,
    stockingBiomassKg,
    netGainKg,
    cumulativeFeedKg,
    cumulativeMolassesKg: Number((p.cumulativeMolassesKg || 28).toFixed(1)),
    todayFeedKg: p.actuators.feeder.dispensedTodayKg,
    todayMolassesGrams: p.todayMolassesGrams || 700,
    estimatedFcr,
    fcrRating,
    fcrBadgeClass,
    growthPercent: Math.round((netGainKg / stockingBiomassKg) * 100)
  }
})

// Global farm summary
const globalFarmMetrics = computed(() => {
  const totalBiomassKg = ponds.value.reduce((acc, p) => acc + (p.fishCount * p.avgWeightGrams / 1000), 0)
  const totalStockingKg = ponds.value.reduce((acc, p) => acc + (p.initialBiomassKg || 300), 0)
  const totalBiomassGainKg = Math.max(1, totalBiomassKg - totalStockingKg)
  const totalCumulativeFeedKg = ponds.value.reduce((acc, p) => acc + (p.cumulativeFeedKg || 0), 0)
  const totalCumulativeMolassesKg = ponds.value.reduce((acc, p) => acc + (p.cumulativeMolassesKg || 0), 0)
  const farmFcr = Number((totalCumulativeFeedKg / totalBiomassGainKg).toFixed(2))

  const onlinePonds = ponds.value.filter(p => p.isPowered !== false)
  const avgHealth = onlinePonds.length
    ? Math.round(onlinePonds.reduce((acc, p) => acc + (p.healthScore || 0), 0) / onlinePonds.length)
    : 0
  const activeAerators = ponds.value.filter(p => p.actuators.aerator.status === 'RUNNING').length
  const totalPonds = ponds.value.length
  const activePondsCount = onlinePonds.length

  return {
    totalBiomassKg: Math.round(totalBiomassKg),
    totalBiomassGainKg: Math.round(totalBiomassGainKg),
    totalCumulativeFeedKg: Number(totalCumulativeFeedKg.toFixed(1)),
    totalCumulativeMolassesKg: Number(totalCumulativeMolassesKg.toFixed(1)),
    fcr: farmFcr,
    avgHealth,
    activeAerators,
    totalPonds,
    activePondsCount
  }
})

// Helper: Normalize any pond ID or channel string into K01 - K04
export function normalizePondId(input) {
  if (!input) return 'K01'
  const str = String(input).toUpperCase().trim()
  if (str === 'K01' || str === 'K02' || str === 'K03' || str === 'K04') return str
  if (str.includes('POND001') || str.includes('POND-01') || str.includes('AQUA-01') || str === '1') return 'K01'
  if (str.includes('POND002') || str.includes('POND-02') || str.includes('AQUA-02') || str === '2') return 'K02'
  if (str.includes('POND003') || str.includes('POND-03') || str.includes('AQUA-03') || str === '3') return 'K03'
  if (str.includes('POND004') || str.includes('POND-04') || str.includes('AQUA-04') || str === '4') return 'K04'
  const match = str.match(/(?:K|POND|POND0*)(\d+)/i)
  if (match) {
    const num = parseInt(match[1], 10)
    return `K${String(num).padStart(2, '0')}`
  }
  return 'K01'
}

// Compute dynamic pond health score from simulation condition and live biometrics
export function computePondHealthScore(pond) {
  if (pond.isPowered === false || pond.simulationCondition === 'offline') return 0

  const doVal = pond.telemetry?.do ?? 6.4
  const ammoniaVal = pond.telemetry?.ammonia ?? 0.02
  const phVal = pond.telemetry?.ph ?? 7.5

  // Critical Danger state: either simulationCondition === 'danger' or severe hypoxia / ammonia spike
  if (pond.simulationCondition === 'danger' || doVal < 3.8 || ammoniaVal > 0.8) {
    const doPenalty = Math.max(0, (4.0 - doVal) * 15)
    const nh3Penalty = Math.max(0, (ammoniaVal - 0.5) * 20)
    return Math.max(35, Math.min(65, Math.round(55 - doPenalty - nh3Penalty)))
  }

  // Warning state: either simulationCondition === 'warning' or moderate deterioration
  if (pond.simulationCondition === 'warning' || doVal < 5.0 || ammoniaVal > 0.25 || phVal < 6.8 || phVal > 8.5) {
    const doPenalty = Math.max(0, (5.0 - doVal) * 10)
    const nh3Penalty = Math.max(0, (ammoniaVal - 0.2) * 15)
    return Math.max(70, Math.min(84, Math.round(79 - doPenalty - nh3Penalty)))
  }

  // Healthy / Optimal biometrics
  let score = 98
  if (doVal < 6.0) score -= (6.0 - doVal) * 8
  if (ammoniaVal > 0.03) score -= (ammoniaVal - 0.03) * 40
  if (phVal < 7.2) score -= (7.2 - phVal) * 10
  if (phVal > 8.2) score -= (phVal - 8.2) * 10

  return Math.max(86, Math.min(99, Math.round(score)))
}

// Compute initial health scores for all ponds
ponds.value.forEach(p => {
  p.healthScore = computePondHealthScore(p)
  if (p.isPowered === false) {
    p.status = 'OFFLINE'
  } else if (p.healthScore >= 90) {
    p.status = 'OPTIMAL'
  } else if (p.healthScore >= 75) {
    p.status = 'CAUTION'
  } else {
    p.status = 'CRITICAL'
  }
})

// Dual-Channel Sync: MQTT Broker + Cross-Tab BroadcastChannel
let sacTelemetryBus = null

function applyIncomingTelemetry(payload, devId = null) {
  if (!payload || typeof payload !== 'object') return
  const targetPondId = normalizePondId(payload.pond_id || payload.device_id || devId)
  const pond = ponds.value.find(p => p.id === targetPondId)
  if (!pond) return

  pond.lastSeen = Date.now()

  // Handle Power Down / Offline event
  const isPowerOff = payload.isPowered === false || 
                     payload.system?.power_state === 'OFF' || 
                     payload.condition === 'offline' ||
                     (payload.sensors === null && payload.isPowered === false)

  if (isPowerOff) {
    pond.isPowered = false
    pond.isOnline = false
    pond.simulationCondition = 'offline'
    pond.status = 'OFFLINE'
    pond.healthScore = 0
    pond.uptimeSeconds = 0
    if (pond.actuators) {
      if (pond.actuators.aerator) pond.actuators.aerator.status = 'IDLE'
      if (pond.actuators.feeder) pond.actuators.feeder.status = 'IDLE'
      if (pond.actuators.dosing) pond.actuators.dosing.status = 'STANDBY'
      if (pond.actuators.flush) pond.actuators.flush.status = 'STANDBY'
    }
    return
  }

  // Node is Powered ON
  pond.isPowered = true
  pond.isOnline = true
  if (payload.condition) pond.simulationCondition = payload.condition
  if (payload.uptime_seconds !== undefined) pond.uptimeSeconds = payload.uptime_seconds
  if (payload.system) {
    if (payload.system.battery_percent !== undefined) pond.batteryPercent = payload.system.battery_percent
    if (payload.system.battery_v !== undefined) pond.batteryVoltage = payload.system.battery_v
    if (payload.system.wifi_rssi_dbm !== undefined) pond.wifiRssi = payload.system.wifi_rssi_dbm
  }

  if (payload.sensors) {
    if (payload.sensors.dissolved_oxygen_mg_l !== undefined) pond.telemetry.do = Number(payload.sensors.dissolved_oxygen_mg_l.toFixed(2))
    if (payload.sensors.ph !== undefined) pond.telemetry.ph = Number(payload.sensors.ph.toFixed(2))
    if (payload.sensors.temperature_c !== undefined) pond.telemetry.temp = Number(payload.sensors.temperature_c.toFixed(1))
    if (payload.sensors.ammonia_mg_l !== undefined) pond.telemetry.ammonia = Number(payload.sensors.ammonia_mg_l.toFixed(3))
    if (payload.sensors.floc_density_ml_l !== undefined) pond.telemetry.flocDensity = Number(payload.sensors.floc_density_ml_l.toFixed(1))
    if (payload.sensors.mud_solids_mg_l !== undefined) pond.telemetry.turbidity = Math.round(payload.sensors.mud_solids_mg_l)
  }

  if (payload.actuators) {
    if (payload.actuators.aerator) {
      pond.actuators.aerator.status = payload.actuators.aerator.state === 'running' ? 'RUNNING' : 'IDLE'
      pond.actuators.aerator.powerPercent = payload.actuators.aerator.power_percent || 100
    }
    if (payload.actuators.feeder) {
      pond.actuators.feeder.status = payload.actuators.feeder.state === 'running' ? 'DISPENSING' : 'IDLE'
      if (payload.actuators.feeder.total_today_grams !== undefined) {
        pond.actuators.feeder.dispensedTodayKg = +(payload.actuators.feeder.total_today_grams / 1000).toFixed(2)
      }
    }
    const molasses = payload.actuators.molasses_pump || payload.actuators.dosing
    if (molasses) {
      pond.actuators.dosing.status = molasses.state === 'running' ? 'DOSING' : 'STANDBY'
    }
    const siphon = payload.actuators.siphon || payload.actuators.water_change
    if (siphon) {
      pond.actuators.flush.status = siphon.state !== 'idle' ? 'DRAINING' : 'STANDBY'
    }
  }

  // Recalculate dynamic healthScore and operational status ONLY if not provided by Gemini AI backend
  if (!pond.aiAnalysis || pond.aiAnalysis.healthScore === undefined) {
    pond.healthScore = computePondHealthScore(pond)
    if (pond.healthScore >= 90) {
      pond.status = 'OPTIMAL'
    } else if (pond.healthScore >= 75) {
      pond.status = 'CAUTION'
    } else {
      pond.status = 'CRITICAL'
    }
  }
}

// 1. MQTT Broker Subscriber for live Gemini-processed stream
if (typeof window !== 'undefined') {
  frontendMqttClient.on('processed', ({ pondId, data }) => {
    const targetPondId = normalizePondId(data.pond_id || pondId)
    const pond = ponds.value.find(p => p.id === targetPondId)
    if (!pond) return

    pond.lastSeen = Date.now()

    if (data.isPowered === false) {
      pond.isPowered = false
      pond.isOnline = false
      pond.status = 'OFFLINE'
      pond.healthScore = 0
      if (pond.aiAnalysis) {
        pond.aiAnalysis.healthScore = 0
        pond.aiAnalysis.status = 'OFFLINE'
        pond.aiAnalysis.summary = data.ai?.summary || 'Edge Node Offline'
      }
      return
    }

    pond.isPowered = true
    pond.isOnline = true

    if (data.telemetry) {
      if (data.telemetry.do !== undefined) pond.telemetry.do = Number(data.telemetry.do.toFixed(2))
      if (data.telemetry.ph !== undefined) pond.telemetry.ph = Number(data.telemetry.ph.toFixed(2))
      if (data.telemetry.temp !== undefined) pond.telemetry.temp = Number(data.telemetry.temp.toFixed(1))
      if (data.telemetry.ammonia !== undefined) pond.telemetry.ammonia = Number(data.telemetry.ammonia.toFixed(3))
      if (data.telemetry.flocDensity !== undefined) pond.telemetry.flocDensity = Number(data.telemetry.flocDensity.toFixed(1))
    }

    if (data.ai) {
      pond.healthScore = data.ai.healthScore
      pond.status = data.ai.status
      pond.aiAnalysis = {
        healthScore: data.ai.healthScore,
        status: data.ai.status,
        summary: data.ai.summary,
        anomalies: data.ai.anomalies,
        recommendation: data.ai.immediateAction,
        modelUsed: data.ai.modelUsed,
        updatedAt: new Date().toLocaleTimeString()
      }
    }
  })

  // Fallback direct telemetry subscriber
  frontendMqttClient.on('telemetry', ({ pondId, data }) => {
    applyIncomingTelemetry(data, pondId)
  })
}

// Database Hydration: Synchronize ponds with MySQL database & Gemini AI
export async function loadPondsFromDatabase() {
  try {
    const dbPonds = await apiClient.getPonds()
    if (dbPonds && dbPonds.length > 0) {
      for (const row of dbPonds) {
        const pond = ponds.value.find(p => p.id === row.id)
        const tele = row.telemetry_cache 
          ? (typeof row.telemetry_cache === 'string' ? JSON.parse(row.telemetry_cache) : row.telemetry_cache)
          : null

        // Fetch latest AI analysis from MySQL
        const ai = await apiClient.getLatestAiAnalysis(row.id)

        if (pond) {
          pond.name = row.name
          pond.species = row.species
          pond.phase = row.phase
          pond.fishCount = row.fish_count
          pond.avgWeightGrams = row.avg_weight_grams
          pond.volumeM3 = row.volume_m3
          pond.initialBiomassKg = row.initial_biomass_kg
          pond.initialFishCount = row.initial_fish_count
          pond.initialWeightGrams = row.initial_weight_grams
          pond.targetHarvestWeightGrams = row.target_harvest_weight_grams
          pond.stockingDate = row.stocking_date
          pond.doc = row.doc
          pond.survivalRate = row.survival_rate
          pond.adgGramsDay = row.adg_grams_day
          pond.cumulativeFeedKg = row.cumulative_feed_kg
          pond.cumulativeMolassesKg = row.cumulative_molasses_kg
          pond.cycleStatus = row.cycle_status || 'ACTIVE'
          pond.iotConfig = row.iot_config 
            ? (typeof row.iot_config === 'string' ? JSON.parse(row.iot_config) : row.iot_config)
            : {
                deviceId: `ESP32-AQUA-0${row.id.replace(/\D/g, '') || '1'}`,
                mqttTopic: `sac/pond00${row.id.replace(/\D/g, '') || '1'}`,
                intervalSeconds: 21600,
                protocol: 'MQTT / RS485 Modbus',
                telemetryMode: 'BATCH_6H',
                sensors: ['DO_OPTICAL', 'PH_ELECTRODE', 'TEMP_PT100', 'IMHOFF_FLOC', 'TAN_AMMONIA'],
                calibrations: { doOffset: 0, phOffset: 0, tempOffset: 0 }
              }
          pond.status = ai ? ai.health_status : (row.status || 'OPTIMAL')
          pond.healthScore = ai ? ai.health_score : (row.health_score || 95)
          if (tele) {
            pond.telemetry = { ...pond.telemetry, ...tele }
          }
          if (row.cumulative_mortality_count !== undefined && row.cumulative_mortality_count !== null) {
            pond.cumulativeMortalityCount = row.cumulative_mortality_count
          }

          // Fetch database-backed mortality records
          try {
            const mortLogs = await apiClient.getPondMortality(row.id)
            if (mortLogs && mortLogs.length > 0) {
              pond.mortalityLogs = mortLogs.map(m => {
                const d = new Date(m.recorded_at)
                const dateStr = !isNaN(d.getTime())
                  ? d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' WIB'
                  : m.recorded_at
                return {
                  id: m.id,
                  date: dateStr,
                  count: m.count,
                  avgWeightGrams: m.avg_weight_grams,
                  biomassLostKg: m.biomass_lost_kg,
                  cause: m.cause,
                  disposalMethod: m.disposal_method,
                  actor: m.actor || 'Ilfa Hidayat (Supervisor)',
                  notes: m.notes || ''
                }
              })
            }
          } catch (mErr) {
            console.warn(`[Mortality Hydrate Warning] Pond ${row.id}:`, mErr)
          }

          if (ai) {
            pond.aiAnalysis = {
              healthScore: ai.health_score,
              status: ai.health_status,
              summary: ai.summary,
              anomalies: ai.anomalies_detected,
              recommendation: ai.recommendation_payload,
              modelUsed: ai.model_used,
              updatedAt: ai.created_at
            }
          }
        }
      }
      console.log(`[Ponds Hydrated] Synchronized ${dbPonds.length} ponds with MySQL Database & Gemini AI!`)
    }
  } catch (e) {
    console.warn('[Ponds Hydrate Error]', e)
  }
}

// Initial trigger on load
if (typeof window !== 'undefined') {
  loadPondsFromDatabase()
}

// 2. Cross-tab BroadcastChannel listener (fallback & instant sync)
if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
  try {
    sacTelemetryBus = new BroadcastChannel('sac_telemetry_bus')
    sacTelemetryBus.onmessage = (event) => {
      if (event.data && event.data.type === 'TELEMETRY') {
        applyIncomingTelemetry(event.data.payload, event.data.deviceId)
      }
    }
  } catch (e) {
    console.warn('Broadcast bus init error in frontend:', e)
  }
}

function sendBusCommand(pondId, action, params) {
  // 1. Publish command via Real MQTT Broker
  frontendMqttClient.publishCommand(pondId, action, params)

  // 2. Broadcast via Browser BroadcastChannel
  if (sacTelemetryBus) {
    try {
      const devId = pondId === 'K02' ? 'ESP32-AQUA-02' : pondId === 'K03' ? 'ESP32-AQUA-03' : pondId === 'K04' ? 'ESP32-AQUA-04' : 'ESP32-AQUA-01'
      sacTelemetryBus.postMessage({
        type: 'COMMAND',
        deviceId: devId,
        target_pond: pondId,
        payload: {
          command_id: `cmd-fe-${Date.now()}`,
          action,
          params
        }
      })
    } catch (e) {
      console.warn('Failed to send command to simulator:', e)
    }
  }
}

// Micro-ticker simulation & uptime keeper
if (typeof window !== 'undefined') {
  setInterval(() => {
    if (!isLiveSimulationRunning.value) return
    ponds.value.forEach(pond => {
      if (pond.isPowered === false) return
      pond.uptimeSeconds = (pond.uptimeSeconds || 0) + 1
    })
  }, 1000)
}

export function usePonds() {
  const setPond = (pondId) => {
    selectedPondId.value = pondId
  }

  // Actuator execution actions with customizable dosage, power, and operational logging
  const triggerFeeder = (pondId, amountKg = 5.2, source = 'MANUAL_ADJUST') => {
    const pond = ponds.value.find(p => p.id === pondId)
    if (!pond) return false
    pond.actuators.feeder.status = 'DISPENSING'
    const addedKg = Number(amountKg)
    pond.actuators.feeder.dispensedTodayKg = Number((pond.actuators.feeder.dispensedTodayKg + addedKg).toFixed(1))
    pond.cumulativeFeedKg = Number(((pond.cumulativeFeedKg || 1200) + addedKg).toFixed(1))

    // Broadcast command to ESP32 simulator if running
    sendBusCommand(pondId, 'feed', { dose: Math.round(addedKg * 25), unit: 'g' })

    // Record action log entry
    addOperationalLog({
      pondId,
      pondName: pond.name,
      category: 'FEEDING',
      type: source,
      actor: source === 'AUTO' ? 'Auto-Feeder Schedule (AI Loop)' : 'Ilfa Hidayat (Supervisor Adjustment)',
      action: `Dispensed ${addedKg} kg BioGrow-7 Pellets`,
      dosage: `+${addedKg} kg`,
      hardware: `${pond.actuators.feeder.id} (Auto-Feeder)`,
      status: 'EXECUTED',
      notes: `Cumulative feed: ${pond.cumulativeFeedKg} kg | Live FCR: ${activePondBiomassMetrics.value.estimatedFcr}`
    })

    setTimeout(() => {
      if (pond) pond.actuators.feeder.status = 'IDLE'
    }, 5000)
    return true
  }

  const setAeratorBoost = (pondId, power = 100, source = 'MANUAL_ADJUST') => {
    const pond = ponds.value.find(p => p.id === pondId)
    if (!pond) return false
    const oldPower = pond.actuators.aerator.powerPercent
    pond.actuators.aerator.powerPercent = Number(power)
    pond.actuators.aerator.status = 'RUNNING'
    const boostDiff = (power - 80) * 0.03
    pond.telemetry.do = Math.min(8.5, Number((pond.telemetry.do + Math.max(0.4, boostDiff)).toFixed(2)))

    // Broadcast command to ESP32 simulator if running
    sendBusCommand(pondId, 'set_aerator', { state: power > 0, powerPercent: power })

    // Record action log entry
    addOperationalLog({
      pondId,
      pondName: pond.name,
      category: 'AERATION',
      type: source,
      actor: source === 'AUTO' ? 'VFD Automatic Frequency Closed-Loop' : 'Ilfa Hidayat (Supervisor Adjustment)',
      action: `Blower speed adjusted from ${oldPower}% to ${power}% RPM`,
      dosage: `${power}% RPM`,
      hardware: `${pond.actuators.aerator.id} (Dual VFD)`,
      status: 'EXECUTED',
      notes: `Target DO boost achieved: ${pond.telemetry.do} mg/L`
    })

    return true
  }

  const triggerMolassesDosing = (pondId, amountGrams = 350, source = 'MANUAL_ADJUST') => {
    const pond = ponds.value.find(p => p.id === pondId)
    if (!pond) return false
    const doseGrams = Number(amountGrams)
    pond.actuators.dosing.status = 'DOSING'
    pond.actuators.dosing.flowMlMin = Math.round(doseGrams / 2)
    pond.todayMolassesGrams = (pond.todayMolassesGrams || 0) + doseGrams
    pond.cumulativeMolassesKg = Number(((pond.cumulativeMolassesKg || 25) + (doseGrams / 1000)).toFixed(2))

    // Broadcast command to ESP32 simulator if running
    sendBusCommand(pondId, 'pump_molasses', { dose: doseGrams, unit: 'ml' })

    // Record action log entry
    addOperationalLog({
      pondId,
      pondName: pond.name,
      category: 'MOLASSES',
      type: source,
      actor: source === 'AUTO' ? 'AI Carbon Balance Optimization' : 'Ilfa Hidayat (Supervisor Adjustment)',
      action: `Injected ${doseGrams}g Organic Cane Molasses (C:N 15:1)`,
      dosage: `+${doseGrams} g`,
      hardware: `${pond.actuators.dosing.id} (Solenoid Valve)`,
      status: 'EXECUTED',
      notes: `Cumulative cycle carbon: ${pond.cumulativeMolassesKg} kg | Ammonia: ${pond.telemetry.ammonia} ppm`
    })

    setTimeout(() => {
      if (pond) {
        pond.actuators.dosing.status = 'STANDBY'
        pond.actuators.dosing.flowMlMin = 0
        pond.telemetry.ammonia = Math.max(0.01, Number((pond.telemetry.ammonia - 0.035).toFixed(3)))
      }
    }, 4500)
    return true
  }

  // Emergency Water Exchange / Siphon Valve
  const triggerWaterFlush = (pondId, percent = 15, source = 'MANUAL_ADJUST') => {
    const pond = ponds.value.find(p => p.id === pondId)
    if (!pond) return false
    pond.actuators.flush.status = 'FLUSHING'

    // Broadcast command to ESP32 simulator if running
    sendBusCommand(pondId, 'water_change', { volume: Math.round(percent * 15), unit: 'liter' })

    // Record action log entry
    addOperationalLog({
      pondId,
      pondName: pond.name,
      category: 'SIPHON_FLUSH',
      type: source,
      actor: 'Ilfa Hidayat (Emergency Siphon Authorization)',
      action: `Bottom sludge siphon & ${percent}% water volume exchange`,
      dosage: `${percent}% Exch (${Math.round(pond.volumeM3 * percent / 100)} m³)`,
      hardware: `${pond.actuators.flush.id} (Siphon Valve)`,
      status: 'EXECUTED',
      notes: `Toxic TAN flushed | Fresh oxygen-rich water recharged`
    })

    setTimeout(() => {
      if (pond) {
        pond.actuators.flush.status = 'STANDBY'
        pond.actuators.flush.lastFlushed = `Just Now (${percent}% refreshed)`
        // Water exchange drastically drops toxic ammonia and recharges fresh dissolved oxygen
        pond.telemetry.ammonia = Math.max(0.01, Number((pond.telemetry.ammonia * 0.55).toFixed(3)))
        pond.telemetry.do = Math.min(7.2, Number((pond.telemetry.do + 1.8).toFixed(2)))
        pond.telemetry.ph = 7.5
        if (pond.status === 'CRITICAL' || pond.status === 'CAUTION') {
          pond.status = 'OPTIMAL'
          pond.healthScore = 95
        }
      }
    }, 4000)
    return true
  }

  // Scenario Injections for Live Demo
  const applyScenario = (type) => {
    const target = ponds.value.find(p => p.id === 'K04')
    if (!target) return

    if (type === 'hypoxia') {
      target.telemetry.do = 3.2
      target.status = 'CRITICAL'
      target.healthScore = 68
      target.actuators.aerator.powerPercent = 60
    } else if (type === 'ammonia_spike') {
      target.telemetry.ammonia = 0.082
      target.telemetry.ph = 7.9
      target.status = 'CAUTION'
      target.healthScore = 78
    } else if (type === 'feeding_window') {
      target.status = 'OPTIMAL'
      target.actuators.feeder.status = 'READY'
    } else if (type === 'reset') {
      target.telemetry.do = 6.25
      target.telemetry.ph = 7.52
      target.telemetry.temp = 28.5
      target.telemetry.ammonia = 0.02
      target.telemetry.flocDensity = 12
      target.status = 'OPTIMAL'
      target.healthScore = 96
      target.actuators.aerator.powerPercent = 82
      target.actuators.aerator.status = 'RUNNING'
      target.actuators.feeder.status = 'IDLE'
      target.actuators.dosing.status = 'STANDBY'
      if (target.actuators.flush) target.actuators.flush.status = 'STANDBY'
    }
  }

  // Register a new production pond
  const addPond = (newPondData) => {
    const nextIdx = ponds.value.length + 1
    const pondId = newPondData.id?.trim() || `K0${nextIdx}`
    const fishCount = Number(newPondData.fishCount) || 2000
    const avgWeightGrams = Number(newPondData.avgWeightGrams) || 15
    const volumeM3 = Number(newPondData.volumeM3) || 50
    const initialBiomassKg = Number(newPondData.initialBiomassKg) || Number(((fishCount * avgWeightGrams) / 1000).toFixed(1))
    const targetHarvestWeightGrams = Number(newPondData.targetHarvestWeightGrams) || 850
    const pondName = newPondData.name?.trim() || `Pond #${nextIdx} — ${newPondData.phase || 'Nursery B'}`

    const newPond = {
      id: pondId,
      name: pondName,
      species: newPondData.species || 'Red Tilapia (Oreochromis niloticus)',
      phase: newPondData.phase || 'Nursery / Fingerling Stage',
      fishCount,
      avgWeightGrams,
      volumeM3,
      status: 'OPTIMAL',
      healthScore: 98,
      initialBiomassKg,
      initialFishCount: fishCount,
      initialWeightGrams: avgWeightGrams,
      targetHarvestWeightGrams,
      stockingDate: newPondData.stockingDate || new Date().toISOString().split('T')[0],
      doc: 1,
      survivalRate: 100.0,
      adgGramsDay: 0.0,
      cycleStatus: 'ACTIVE',
      cumulativeFeedKg: 0.0,
      cumulativeMolassesKg: 0.0,
      todayMolassesGrams: 0,
      cumulativeMortalityCount: 0,
      mortalityLogs: [],
      growthHistory: [
        { doc: 1, abw: avgWeightGrams, biomassKg: initialBiomassKg, feedKg: 0, note: 'Initial Fingerling Stocking' }
      ],
      telemetry: {
        do: 6.5,
        ph: 7.5,
        temp: 28.5,
        ammonia: 0.012,
        flocDensity: 8,
        orp: 285,
        tds: 980,
        flocSensor: {
          model: 'Imhoff-Vision AI (ESP32-CAM) & NIR-860nm Probe',
          protocol: `RS485 Modbus RTU (Addr: 0x0${nextIdx})`,
          od600: 0.30,
          tssMgL: 350,
          settlingRate: '1.5 mm/min',
          samplingMethod: '15-min Motorized Imhoff Settling Chamber',
          calibrationStd: 'SNI 7550:2009 / APHA 2540 F'
        }
      },
      actuators: {
        feeder: {
          id: `ESP32-${pondId}-FD`,
          name: `Auto-Feeder #${pondId}`,
          status: 'IDLE',
          dispensedTodayKg: 0.0,
          targetDailyKg: Number(Math.max(2.0, (initialBiomassKg * 0.04)).toFixed(1)),
          nextSchedule: '08:00'
        },
        aerator: {
          id: `ESP32-${pondId}-AR`,
          name: `VFD Aerator #${pondId}`,
          status: 'RUNNING',
          powerPercent: 80,
          mode: 'AUTO'
        },
        dosing: {
          id: `ESP32-${pondId}-DS`,
          name: `Molasses Solenoid Valve #${pondId}`,
          status: 'STANDBY',
          flowMlMin: 0
        },
        flush: {
          id: `ESP32-${pondId}-FLUSH`,
          name: `Emergency Siphon Valve #${pondId}`,
          status: 'STANDBY',
          drainRateM3H: 15,
          lastFlushed: 'None (Zero-Exchange)'
        }
      }
    }

    ponds.value.push(newPond)
    selectedPondId.value = pondId

    addOperationalLog({
      pondId,
      pondName: newPond.name,
      category: 'POND_SETUP',
      type: 'MANUAL_ADJUST',
      actor: 'Ilfa Hidayat (Farm Supervisor)',
      action: `Registered New Production Pond ${pondId} (${newPond.name})`,
      dosage: `${volumeM3} m³ | ${fishCount.toLocaleString()} fish (${initialBiomassKg} kg)`,
      hardware: `ESP32-${pondId} Telemetry & Actuator Cluster`,
      status: 'EXECUTED',
      notes: `Initial stocking: ${avgWeightGrams}g/fish | Target Harvest: ${targetHarvestWeightGrams}g`
    })

    return newPond
  }

  // End cycle via Harvest (Full or Partial) — Persisted to MySQL Database
  const harvestPondCycle = async (pondId, { type = 'FULL', harvestKg, harvestCount, harvestAbw, notes = '' }) => {
    const pond = ponds.value.find(p => p.id === pondId)
    if (!pond) return false

    const harvestedKg = Number(harvestKg) || Math.round(pond.fishCount * pond.avgWeightGrams / 1000)
    const countHarvested = Number(harvestCount) || pond.fishCount
    const finalAbw = Number(harvestAbw) || pond.avgWeightGrams
    const currentGainKg = Math.max(1, harvestedKg - (pond.initialBiomassKg || 100))
    const finalFcr = Number(((pond.cumulativeFeedKg || 500) / currentGainKg).toFixed(2))

    if (type === 'FULL') {
      pond.cycleStatus = 'HARVESTED'
      pond.phase = 'Cycle Harvested (Ready for Restocking)'
      pond.fishCount = 0
      pond.avgWeightGrams = finalAbw

      if (!pond.growthHistory) pond.growthHistory = []
      pond.growthHistory.push({
        doc: pond.doc || 120,
        abw: finalAbw,
        biomassKg: harvestedKg,
        feedKg: pond.cumulativeFeedKg,
        note: `Full Harvest (${harvestedKg.toLocaleString()} kg total yield)`
      })

      // Persist to MySQL database via API
      try {
        await apiClient.updatePond(pondId, {
          cycle_status: 'HARVESTED',
          phase: 'Cycle Harvested (Ready for Restocking)',
          fish_count: 0,
          avg_weight_grams: finalAbw
        })
      } catch (err) {
        console.warn('[harvestPondCycle] Database persist error:', err)
      }

      addOperationalLog({
        pondId,
        pondName: pond.name,
        category: 'CYCLE_HARVEST',
        type: 'MANUAL_ADJUST',
        actor: 'Ilfa Hidayat (Harvest Operator)',
        action: `FULL HARVEST EXECUTED: ${harvestedKg.toLocaleString()} kg Tilapia`,
        dosage: `${countHarvested.toLocaleString()} fish @ ${finalAbw}g/fish`,
        hardware: `Siphon Channel & Harvest Net`,
        status: 'EXECUTED',
        notes: `Final FCR: ${finalFcr} | Total Feed: ${pond.cumulativeFeedKg} kg | Cycle Completed: ${notes || 'Commercial Harvest'}`
      })
    } else {
      // Partial Harvest (Thinning)
      pond.fishCount = Math.max(0, pond.fishCount - countHarvested)

      // Persist to MySQL database via API
      try {
        await apiClient.updatePond(pondId, {
          fish_count: pond.fishCount
        })
      } catch (err) {
        console.warn('[harvestPondCycle] Database persist error:', err)
      }

      addOperationalLog({
        pondId,
        pondName: pond.name,
        category: 'CYCLE_HARVEST',
        type: 'MANUAL_ADJUST',
        actor: 'Ilfa Hidayat (Harvest Operator)',
        action: `PARTIAL HARVEST (Thinning): ${harvestedKg.toLocaleString()} kg Tilapia`,
        dosage: `${countHarvested.toLocaleString()} fish removed`,
        hardware: `Selective Grading Net`,
        status: 'EXECUTED',
        notes: `Remaining in pond: ${pond.fishCount.toLocaleString()} fish (~${Math.round(pond.fishCount * pond.avgWeightGrams / 1000)} kg)`
      })
    }
    return true
  }

  // End cycle or grade via Transfer (Pond Transfer) — Persisted to MySQL Database
  const transferPondFish = async (sourcePondId, targetPondId, { transferCount, transferKg, transferAbw, reason = '' }) => {
    const source = ponds.value.find(p => p.id === sourcePondId)
    const target = ponds.value.find(p => p.id === targetPondId)
    if (!source || !target) return false

    const count = Math.min(source.fishCount, Number(transferCount) || source.fishCount)
    const abw = Number(transferAbw) || source.avgWeightGrams
    const kg = Number(transferKg) || Number(((count * abw) / 1000).toFixed(1))

    source.fishCount = Math.max(0, source.fishCount - count)
    if (source.fishCount === 0) {
      source.cycleStatus = 'TRANSFERRED'
      source.phase = `Batch Transferred to ${target.name}`
    }

    target.fishCount = (target.fishCount || 0) + count
    target.avgWeightGrams = Math.round((target.avgWeightGrams + abw) / 2) || abw

    // Persist both source and target to MySQL database via API
    try {
      await apiClient.updatePond(sourcePondId, {
        fish_count: source.fishCount,
        cycle_status: source.cycleStatus,
        phase: source.phase
      })
      await apiClient.updatePond(targetPondId, {
        fish_count: target.fishCount,
        avg_weight_grams: target.avgWeightGrams
      })
    } catch (err) {
      console.warn('[transferPondFish] Database persist error:', err)
    }

    addOperationalLog({
      pondId: sourcePondId,
      pondName: source.name,
      category: 'POND_TRANSFER',
      type: 'MANUAL_ADJUST',
      actor: 'Ilfa Hidayat (Farm Supervisor)',
      action: `Fish Grading Transfer: ${source.id} ➔ ${target.id}`,
      dosage: `${count.toLocaleString()} fish (${kg} kg @ ${abw}g)`,
      hardware: `Grading Tank & Water Transfer Pipeline`,
      status: 'EXECUTED',
      notes: `Reason: ${reason || 'Progressive size grading'}. ${target.name} population now: ${target.fishCount.toLocaleString()} fish.`
    })

    return true
  }

  // Restart a harvested/transferred pond with a fresh cycle — Persisted to MySQL Database
  const restartPondCycle = async (pondId, cycleData = {}) => {
    const pond = ponds.value.find(p => p.id === pondId)
    if (!pond) return false

    const count = Number(cycleData.fishCount) || 2000
    const abw = Number(cycleData.avgWeightGrams) || 20
    const biomass = Number(cycleData.initialBiomassKg) || Number(((count * abw) / 1000).toFixed(1))
    const species = cycleData.species || pond.species
    const stockingDate = cycleData.stockingDate || new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })

    pond.cycleStatus = 'ACTIVE'
    pond.phase = cycleData.phase || 'Nursery / Fingerling Conditioning'
    pond.fishCount = count
    pond.avgWeightGrams = abw
    pond.initialFishCount = count
    pond.initialWeightGrams = abw
    pond.initialBiomassKg = biomass
    pond.stockingDate = stockingDate
    pond.doc = 1
    pond.survivalRate = 100.0
    pond.cumulativeMortalityCount = 0
    pond.cumulativeFeedKg = 0
    pond.cumulativeMolassesKg = 0
    pond.mortalityLogs = []

    try {
      await apiClient.updatePond(pondId, {
        cycle_status: 'ACTIVE',
        phase: pond.phase,
        species,
        fish_count: count,
        avg_weight_grams: abw,
        initial_fish_count: count,
        initial_weight_grams: abw,
        initial_biomass_kg: biomass,
        stocking_date: stockingDate,
        doc: 1,
        survival_rate: 100.0,
        cumulative_mortality_count: 0,
        cumulative_feed_kg: 0,
        cumulative_molasses_kg: 0
      })
    } catch (err) {
      console.warn('[restartPondCycle] Database persist error:', err)
    }

    addOperationalLog({
      pondId,
      pondName: pond.name,
      category: 'CYCLE_STOCKING',
      type: 'MANUAL_ADJUST',
      actor: 'Ilfa Hidayat (Farm Supervisor)',
      action: `NEW CYCLE STARTED: Stocked ${count.toLocaleString()} fingerlings in ${pond.name}`,
      dosage: `${count.toLocaleString()} fish @ ${abw}g (${biomass} kg)`,
      hardware: `Acclimation Tank & Aerated Bucket`,
      status: 'EXECUTED',
      notes: `Species: ${species} | Initial Biomass: ${biomass} kg | Fresh Cycle Day 1`
    })

    return true
  }

  // Configure IoT Edge Controller & Telemetry Ingestion — Persisted to MySQL Database
  const updatePondIotConfig = async (pondId, iotConfig) => {
    const pond = ponds.value.find(p => p.id === pondId)
    if (!pond) return false

    pond.iotConfig = { ...pond.iotConfig, ...iotConfig }

    try {
      await apiClient.updatePond(pondId, {
        iot_config: pond.iotConfig
      })

      if (iotConfig.nodeId) {
        await apiClient.assignHardwareNode(iotConfig.nodeId, pondId)
      }

      addOperationalLog({
        pondId,
        pondName: pond.name,
        category: 'HARDWARE_CONFIG',
        type: 'MANUAL_ADJUST',
        actor: 'Ilfa Hidayat (IoT Systems Engineer)',
        action: `Updated IoT Configuration for ${pond.name}`,
        dosage: `${iotConfig.deviceId || 'ESP32'} @ ${iotConfig.mqttTopic || 'sac/pond'}`,
        hardware: `${iotConfig.deviceId || 'ESP32-AQUA'} (Firmware Gateway)`,
        status: 'EXECUTED',
        notes: `Sampling: ${iotConfig.intervalSeconds || 21600}s | Protocol: ${iotConfig.protocol || 'MQTT'} | Active Sensors: ${iotConfig.sensors?.length || 5}`
      })
      return true
    } catch (err) {
      console.warn('[updatePondIotConfig] Failed to save IoT config to database:', err)
      return false
    }
  }

  // Record fish mortality for a specific pond (Persisted to Database)
  const recordFishMortality = async (pondId, { count, avgWeightGrams, cause = 'Routine Mortality', disposalMethod = 'Buried with quicklime', notes = '' }) => {
    const pond = ponds.value.find(p => p.id === pondId)
    if (!pond) return false

    const deadCount = Math.max(1, Number(count) || 1)
    const deadAbw = Number(avgWeightGrams) || pond.avgWeightGrams || 100
    const lostKg = Number(((deadCount * deadAbw) / 1000).toFixed(2))

    // Optimistic local state update
    pond.fishCount = Math.max(0, pond.fishCount - deadCount)
    pond.cumulativeMortalityCount = (pond.cumulativeMortalityCount || 0) + deadCount

    // Recalculate survival rate
    const initialCount = pond.initialFishCount || (pond.fishCount + pond.cumulativeMortalityCount)
    pond.survivalRate = Number((((initialCount - pond.cumulativeMortalityCount) / initialCount) * 100).toFixed(1))

    const now = new Date()
    const dateFormatted = now.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' WIB'

    const newLog = {
      id: `MORT-${pondId}-${Date.now()}`,
      date: dateFormatted,
      count: deadCount,
      avgWeightGrams: deadAbw,
      biomassLostKg: lostKg,
      cause,
      disposalMethod,
      actor: 'Ilfa Hidayat (Supervisor)',
      notes: notes || 'Daily mortality audit'
    }

    if (!pond.mortalityLogs) pond.mortalityLogs = []
    pond.mortalityLogs.unshift(newLog)

    // Add to global operationalLogs so it appears in audit trail and ledger!
    addOperationalLog({
      pondId,
      pondName: pond.name,
      category: 'MORTALITY_LOG',
      type: 'MANUAL_ADJUST',
      actor: 'Ilfa Hidayat (Supervisor Mortality Audit)',
      action: `Recorded Fish Mortality: -${deadCount} fish in ${pond.name}`,
      dosage: `-${deadCount} fish (-${lostKg} kg)`,
      hardware: `Scoop Net & Disposal Pit`,
      status: 'EXECUTED',
      notes: `Cause: ${cause} | Remaining Population: ${pond.fishCount.toLocaleString()} fish | New SR: ${pond.survivalRate}%`
    })

    // Asynchronously persist to backend MySQL database via API
    try {
      const res = await apiClient.recordMortality(pondId, {
        count: deadCount,
        avg_weight_grams: deadAbw,
        cause,
        disposal_method: disposalMethod,
        notes
      })
      if (res && res.success && res.data?.pond) {
        pond.fishCount = res.data.pond.fish_count
        pond.survivalRate = res.data.pond.survival_rate
        pond.cumulativeMortalityCount = res.data.pond.cumulative_mortality_count
      }
    } catch (apiErr) {
      console.warn('[recordFishMortality] Backend sync error:', apiErr)
    }

    return newLog
  }

  return {
    ponds,
    selectedPondId,
    activePond,
    activePondBiomassMetrics,
    globalFarmMetrics,
    historyLogs,
    operationalLogs,
    isLiveSimulationRunning,
    setPond,
    triggerFeeder,
    setAeratorBoost,
    triggerMolassesDosing,
    triggerWaterFlush,
    addOperationalLog,
    generateHistoryData,
    applyScenario,
    addPond,
    harvestPondCycle,
    transferPondFish,
    restartPondCycle,
    recordFishMortality,
    loadPondsFromDatabase,
    updatePondIotConfig,
    mqttStatus,
    frontendMqttClient
  }
}
