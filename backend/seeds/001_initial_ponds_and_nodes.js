/**
 * Seed 001: Initial Ponds, Actuators, Telemetry (6-Hour Interval Schedule: 06:00, 12:00, 18:00, 00:00),
 * Executions, AI Analyses, and Audit Logs
 */
export async function seed(knex) {
  // Clear existing records in reverse dependency order
  await knex('audit_logs').del()
  await knex('ai_analyses').del()
  await knex('ai_recommendations').del()
  await knex('execution_logs').del()
  await knex('telemetry_logs').del()
  await knex('mortality_logs').del()
  await knex('actuators').del()
  await knex('hardware_nodes').del()
  await knex('ponds').del()

  // 1. Seed Ponds K01 - K04
  const pondsData = [
    {
      id: 'K01',
      name: 'Pond 1',
      species: 'Red Tilapia (Oreochromis niloticus)',
      phase: 'Finisher Stage (Ready for Harvest)',
      fish_count: 1850,
      avg_weight_grams: 920.0,
      volume_m3: 50.0,
      initial_biomass_kg: 460.0,
      initial_fish_count: 2000,
      initial_weight_grams: 230.0,
      target_harvest_weight_grams: 950.0,
      stocking_date: '12 Jan 2026',
      doc: 112,
      survival_rate: 92.5,
      cumulative_mortality_count: 150,
      adg_grams_day: 6.16,
      cycle_status: 'ACTIVE',
      cumulative_feed_kg: 1450.8,
      cumulative_molasses_kg: 36.5,
      health_score: 98.0,
      status: 'OPTIMAL',
      iot_config: JSON.stringify({
        deviceId: 'ESP32-AQUA-01',
        mqttTopic: 'sac/pond001',
        nodeId: 'sac/pond001',
        intervalSeconds: 21600,
        protocol: 'MQTT Broker (v3.1.1 / WSS)',
        telemetryMode: 'BATCH_6H',
        sensors: ['DO_OPTICAL', 'PH_ELECTRODE', 'TEMP_PT100', 'IMHOFF_FLOC', 'TAN_AMMONIA'],
        calibrations: { doOffset: 0.0, phOffset: 0.0, tempOffset: 0.0 }
      }),
      telemetry_cache: JSON.stringify({
        do: 6.4, ph: 7.62, temp: 28.8, ammonia: 0.015, flocDensity: 14.0, orp: 280, tds: 1100
      })
    },
    {
      id: 'K02',
      name: 'Pond 2',
      species: 'Black Tilapia (Gift Strain)',
      phase: 'Grower Stage (Rapid Growth)',
      fish_count: 2200,
      avg_weight_grams: 420.0,
      volume_m3: 50.0,
      initial_biomass_kg: 280.0,
      initial_fish_count: 2350,
      initial_weight_grams: 120.0,
      target_harvest_weight_grams: 850.0,
      stocking_date: '02 Feb 2026',
      doc: 74,
      survival_rate: 93.6,
      cumulative_mortality_count: 150,
      adg_grams_day: 4.05,
      cycle_status: 'ACTIVE',
      cumulative_feed_kg: 755.4,
      cumulative_molasses_kg: 19.8,
      health_score: 94.0,
      status: 'OPTIMAL',
      iot_config: JSON.stringify({
        deviceId: 'ESP32-AQUA-02',
        mqttTopic: 'sac/pond002',
        nodeId: 'sac/pond002',
        intervalSeconds: 21600,
        protocol: 'MQTT Broker (v3.1.1 / WSS)',
        telemetryMode: 'BATCH_6H',
        sensors: ['DO_OPTICAL', 'PH_ELECTRODE', 'TEMP_PT100', 'IMHOFF_FLOC', 'TAN_AMMONIA'],
        calibrations: { doOffset: 0.0, phOffset: 0.0, tempOffset: 0.0 }
      }),
      telemetry_cache: JSON.stringify({
        do: 5.8, ph: 7.45, temp: 29.1, ammonia: 0.022, flocDensity: 16.5, orp: 265, tds: 1150
      })
    },
    {
      id: 'K03',
      name: 'Pond 3',
      species: 'Nile Tilapia (Fry/Fingerling Stage)',
      phase: 'Nursery Conditioning',
      fish_count: 5500,
      avg_weight_grams: 45.0,
      volume_m3: 50.0,
      initial_biomass_kg: 55.0,
      initial_fish_count: 5800,
      initial_weight_grams: 10.0,
      target_harvest_weight_grams: 120.0,
      stocking_date: '10 Mar 2026',
      doc: 38,
      survival_rate: 94.8,
      cumulative_mortality_count: 300,
      adg_grams_day: 0.92,
      cycle_status: 'ACTIVE',
      cumulative_feed_kg: 210.6,
      cumulative_molasses_kg: 7.2,
      health_score: 96.0,
      status: 'OPTIMAL',
      iot_config: JSON.stringify({
        deviceId: 'ESP32-AQUA-03',
        mqttTopic: 'sac/pond003',
        nodeId: 'sac/pond003',
        intervalSeconds: 21600,
        protocol: 'MQTT Broker (v3.1.1 / WSS)',
        telemetryMode: 'BATCH_6H',
        sensors: ['DO_OPTICAL', 'PH_ELECTRODE', 'TEMP_PT100', 'IMHOFF_FLOC', 'TAN_AMMONIA'],
        calibrations: { doOffset: 0.0, phOffset: 0.0, tempOffset: 0.0 }
      }),
      telemetry_cache: JSON.stringify({
        do: 6.1, ph: 7.78, temp: 28.5, ammonia: 0.018, flocDensity: 12.0, orp: 290, tds: 1080
      })
    },
    {
      id: 'K04',
      name: 'Pond 4',
      species: 'Red Tilapia (High Density Test)',
      phase: 'Active Biomass (Stress Test)',
      fish_count: 2600,
      avg_weight_grams: 380.0,
      volume_m3: 50.0,
      initial_biomass_kg: 320.0,
      initial_fish_count: 2750,
      initial_weight_grams: 116.0,
      target_harvest_weight_grams: 800.0,
      stocking_date: '20 Feb 2026',
      doc: 55,
      survival_rate: 94.5,
      cumulative_mortality_count: 150,
      adg_grams_day: 4.80,
      cycle_status: 'ACTIVE',
      cumulative_feed_kg: 580.2,
      cumulative_molasses_kg: 14.5,
      health_score: 88.0,
      status: 'WARNING',
      iot_config: JSON.stringify({
        deviceId: 'ESP32-AQUA-04',
        mqttTopic: 'sac/pond004',
        nodeId: 'sac/pond004',
        intervalSeconds: 21600,
        protocol: 'MQTT Broker (v3.1.1 / WSS)',
        telemetryMode: 'BATCH_6H',
        sensors: ['DO_OPTICAL', 'PH_ELECTRODE', 'TEMP_PT100', 'IMHOFF_FLOC', 'TAN_AMMONIA'],
        calibrations: { doOffset: 0.0, phOffset: 0.0, tempOffset: 0.0 }
      }),
      telemetry_cache: JSON.stringify({
        do: 4.3, ph: 7.15, temp: 29.8, ammonia: 0.048, flocDensity: 19.5, orp: 230, tds: 1280
      })
    }
  ]
  await knex('ponds').insert(pondsData)

  // 1.4. Seed Hardware Nodes Registry (Edge Device Inventory)
  const hardwareNodesData = [
    {
      id: 'sac/pond001',
      device_tag: 'ESP32-AQUA-01',
      name: 'Field Controller Node #1 (Pond K01 Primary Gateway)',
      chip_model: 'ESP32-WROOM-32D Dual-Core 240MHz',
      firmware_version: 'v2.4.1-SNI',
      mqtt_topic: 'sac/pond001',
      mqtt_cmd_topic: 'sac/pond001/commands',
      default_pond_id: 'K01',
      status: 'ONLINE',
      mac_address: '24:6F:28:B1:01:A1',
      ip_address: '192.168.1.101'
    },
    {
      id: 'sac/pond002',
      device_tag: 'ESP32-AQUA-02',
      name: 'Field Controller Node #2 (Pond K02 Primary Gateway)',
      chip_model: 'ESP32-WROOM-32D Dual-Core 240MHz',
      firmware_version: 'v2.4.1-SNI',
      mqtt_topic: 'sac/pond002',
      mqtt_cmd_topic: 'sac/pond002/commands',
      default_pond_id: 'K02',
      status: 'ONLINE',
      mac_address: '24:6F:28:B1:02:B2',
      ip_address: '192.168.1.102'
    },
    {
      id: 'sac/pond003',
      device_tag: 'ESP32-AQUA-03',
      name: 'Field Controller Node #3 (Pond K03 Primary Gateway)',
      chip_model: 'ESP32-WROOM-32D Dual-Core 240MHz',
      firmware_version: 'v2.4.1-SNI',
      mqtt_topic: 'sac/pond003',
      mqtt_cmd_topic: 'sac/pond003/commands',
      default_pond_id: 'K03',
      status: 'ONLINE',
      mac_address: '24:6F:28:B1:03:C3',
      ip_address: '192.168.1.103'
    },
    {
      id: 'sac/pond004',
      device_tag: 'ESP32-AQUA-04',
      name: 'Field Controller Node #4 (Pond K04 Primary Gateway)',
      chip_model: 'ESP32-WROOM-32D Dual-Core 240MHz',
      firmware_version: 'v2.4.1-SNI',
      mqtt_topic: 'sac/pond004',
      mqtt_cmd_topic: 'sac/pond004/commands',
      default_pond_id: 'K04',
      status: 'ONLINE',
      mac_address: '24:6F:28:B1:04:D4',
      ip_address: '192.168.1.104'
    },
    {
      id: 'sac/pond005',
      device_tag: 'ESP32-AQUA-05',
      name: 'Modular Standby Node #5 (Hot Spare Gateway)',
      chip_model: 'ESP32-S3-WROOM-1 N16R8',
      firmware_version: 'v2.5.0-rc',
      mqtt_topic: 'sac/pond005',
      mqtt_cmd_topic: 'sac/pond005/commands',
      default_pond_id: null,
      status: 'STANDBY',
      mac_address: '30:30:F9:A5:05:E5',
      ip_address: '192.168.1.105'
    },
    {
      id: 'sac/pond006',
      device_tag: 'ESP32-AQUA-06',
      name: 'Mobile Calibration & Testing Node #6',
      chip_model: 'ESP32-S3-WROOM-1 N16R8',
      firmware_version: 'v2.5.0-rc',
      mqtt_topic: 'sac/pond006',
      mqtt_cmd_topic: 'sac/pond006/commands',
      default_pond_id: null,
      status: 'STANDBY',
      mac_address: '30:30:F9:A6:06:F6',
      ip_address: '192.168.1.106'
    }
  ]
  await knex('hardware_nodes').insert(hardwareNodesData)

  // 1.5. Seed Detailed Mortality Records (SNI Biosecurity Compliant)
  const mortalityLogsData = [
    // --- Pond K01 (Total: 150 fish) ---
    {
      id: 'MORT-K01-20261016-01',
      pond_id: 'K01',
      count: 4,
      avg_weight_grams: 915.0,
      biomass_lost_kg: 3.66,
      cause: 'Density Stress / Old Age (Ready for Harvest)',
      disposal_method: 'Buried with Quicklime (SNI Biosecurity Standard)',
      actor: 'Ilfa Hidayat (Supervisor)',
      notes: 'Morning inspection scoop at 07:15 WIB.',
      recorded_at: new Date('2026-10-16T07:15:00+07:00')
    },
    {
      id: 'MORT-K01-20261014-01',
      pond_id: 'K01',
      count: 6,
      avg_weight_grams: 910.0,
      biomass_lost_kg: 5.46,
      cause: 'Routine / Natural Mortality',
      disposal_method: 'Buried with Quicklime (SNI Biosecurity Standard)',
      actor: 'Ilfa Hidayat (Supervisor)',
      notes: 'Routine morning mortality scoop. Dissolved oxygen and aeration normal.',
      recorded_at: new Date('2026-10-14T07:30:00+07:00')
    },
    {
      id: 'MORT-K01-20261010-01',
      pond_id: 'K01',
      count: 8,
      avg_weight_grams: 880.0,
      biomass_lost_kg: 7.04,
      cause: 'Thermal Shock / Extreme Temperature',
      disposal_method: 'Buried with Quicklime (SNI Biosecurity Standard)',
      actor: 'Ilfa Hidayat (Supervisor)',
      notes: 'Extreme afternoon heat followed by rapid evening temperature drop.',
      recorded_at: new Date('2026-10-10T08:15:00+07:00')
    },
    {
      id: 'MORT-K01-20261002-01',
      pond_id: 'K01',
      count: 12,
      avg_weight_grams: 810.0,
      biomass_lost_kg: 9.72,
      cause: 'Grading & Handling Stress',
      disposal_method: 'Buried with Quicklime (SNI Biosecurity Standard)',
      actor: 'Ilfa Hidayat (Supervisor)',
      notes: 'Handling stress post-sampling weight assessment at DOC 90.',
      recorded_at: new Date('2026-10-02T07:00:00+07:00')
    },
    {
      id: 'MORT-K01-20260915-01',
      pond_id: 'K01',
      count: 25,
      avg_weight_grams: 630.0,
      biomass_lost_kg: 15.75,
      cause: 'Hypoxia / Low DO Stress',
      disposal_method: 'Buried with Quicklime (SNI Biosecurity Standard)',
      actor: 'Ilfa Hidayat (Supervisor)',
      notes: 'Backup aerator breaker tripped at 03:00 WIB, resolved at 05:00 WIB.',
      recorded_at: new Date('2026-09-15T07:45:00+07:00')
    },
    {
      id: 'MORT-K01-20260820-01',
      pond_id: 'K01',
      count: 35,
      avg_weight_grams: 420.0,
      biomass_lost_kg: 14.70,
      cause: 'Cannibalism / Physical Injury',
      disposal_method: 'Buried with Quicklime (SNI Biosecurity Standard)',
      actor: 'Ilfa Hidayat (Supervisor)',
      notes: 'Feeding competition aggression during advanced grower phase.',
      recorded_at: new Date('2026-08-20T08:00:00+07:00')
    },
    {
      id: 'MORT-K01-20260725-01',
      pond_id: 'K01',
      count: 60,
      avg_weight_grams: 250.0,
      biomass_lost_kg: 15.00,
      cause: 'Stocking Adaptation / Fingerling Stress',
      disposal_method: 'Buried with Quicklime (SNI Biosecurity Standard)',
      actor: 'Ilfa Hidayat (Supervisor)',
      notes: 'First-week acclimation mortality after stocking grow-out batch.',
      recorded_at: new Date('2026-07-25T08:30:00+07:00')
    },

    // --- Pond K02 (Total: 150 fish) ---
    {
      id: 'MORT-K02-20261015-01',
      pond_id: 'K02',
      count: 6,
      avg_weight_grams: 410.0,
      biomass_lost_kg: 2.46,
      cause: 'Cannibalism / Physical Injury',
      disposal_method: 'Buried with Quicklime (SNI Biosecurity Standard)',
      actor: 'Ilfa Hidayat (Supervisor)',
      notes: 'Fin nipping and aggressive territorial bites observed.',
      recorded_at: new Date('2026-10-15T08:00:00+07:00')
    },
    {
      id: 'MORT-K02-20261008-01',
      pond_id: 'K02',
      count: 14,
      avg_weight_grams: 350.0,
      biomass_lost_kg: 4.90,
      cause: 'Elevated Ammonia / TAN Deficit',
      disposal_method: 'Buried with Quicklime (SNI Biosecurity Standard)',
      actor: 'Ilfa Hidayat (Supervisor)',
      notes: 'TAN elevated to 0.05 ppm, injected 500g molasses to balance C:N ratio.',
      recorded_at: new Date('2026-10-08T07:30:00+07:00')
    },
    {
      id: 'MORT-K02-20260922-01',
      pond_id: 'K02',
      count: 25,
      avg_weight_grams: 280.0,
      biomass_lost_kg: 7.00,
      cause: 'Routine / Natural Mortality',
      disposal_method: 'Buried with Quicklime (SNI Biosecurity Standard)',
      actor: 'Ilfa Hidayat (Supervisor)',
      notes: 'Routine perimeter screen cleaning on Pond K02.',
      recorded_at: new Date('2026-09-22T07:15:00+07:00')
    },
    {
      id: 'MORT-K02-20260830-01',
      pond_id: 'K02',
      count: 40,
      avg_weight_grams: 190.0,
      biomass_lost_kg: 7.60,
      cause: 'Grading & Handling Stress',
      disposal_method: 'Buried with Quicklime (SNI Biosecurity Standard)',
      actor: 'Ilfa Hidayat (Supervisor)',
      notes: 'Size sorting transfer stress into uniform batch.',
      recorded_at: new Date('2026-08-30T08:00:00+07:00')
    },
    {
      id: 'MORT-K02-20260805-01',
      pond_id: 'K02',
      count: 65,
      avg_weight_grams: 130.0,
      biomass_lost_kg: 8.45,
      cause: 'Stocking Adaptation / Fingerling Stress',
      disposal_method: 'Buried with Quicklime (SNI Biosecurity Standard)',
      actor: 'Ilfa Hidayat (Supervisor)',
      notes: 'Stocking acclimation for 2,350 fingerlings GIFT strain.',
      recorded_at: new Date('2026-08-05T07:45:00+07:00')
    },

    // --- Pond K03 (Total: 300 fish) ---
    {
      id: 'MORT-K03-20261014-01',
      pond_id: 'K03',
      count: 15,
      avg_weight_grams: 42.0,
      biomass_lost_kg: 0.63,
      cause: 'Cannibalism / Physical Injury',
      disposal_method: 'Buried with Quicklime (SNI Biosecurity Standard)',
      actor: 'Ilfa Hidayat (Supervisor)',
      notes: 'Size disparity triggered occasional nipping between feedings.',
      recorded_at: new Date('2026-10-14T07:00:00+07:00')
    },
    {
      id: 'MORT-K03-20261005-01',
      pond_id: 'K03',
      count: 35,
      avg_weight_grams: 32.0,
      biomass_lost_kg: 1.12,
      cause: 'Routine / Natural Mortality',
      disposal_method: 'Buried with Quicklime (SNI Biosecurity Standard)',
      actor: 'Ilfa Hidayat (Supervisor)',
      notes: 'Normal mortality during early nursery phase.',
      recorded_at: new Date('2026-10-05T07:30:00+07:00')
    },
    {
      id: 'MORT-K03-20260925-01',
      pond_id: 'K03',
      count: 70,
      avg_weight_grams: 22.0,
      biomass_lost_kg: 1.54,
      cause: 'Thermal Shock / Extreme Temperature',
      disposal_method: 'Buried with Quicklime (SNI Biosecurity Standard)',
      actor: 'Ilfa Hidayat (Supervisor)',
      notes: 'Nighttime water temperature dropped below 26 °C.',
      recorded_at: new Date('2026-09-25T08:00:00+07:00')
    },
    {
      id: 'MORT-K03-20260912-01',
      pond_id: 'K03',
      count: 180,
      avg_weight_grams: 11.0,
      biomass_lost_kg: 1.98,
      cause: 'Stocking Adaptation / Fingerling Stress',
      disposal_method: 'Buried with Quicklime (SNI Biosecurity Standard)',
      actor: 'Ilfa Hidayat (Supervisor)',
      notes: 'Initial stocking acclimation for 5,800 red tilapia fingerlings.',
      recorded_at: new Date('2026-09-12T08:15:00+07:00')
    },

    // --- Pond K04 (Total: 150 fish) ---
    {
      id: 'MORT-K04-20261017-01',
      pond_id: 'K04',
      count: 8,
      avg_weight_grams: 375.0,
      biomass_lost_kg: 3.00,
      cause: 'Hypoxia / Low DO Stress',
      disposal_method: 'Buried with Quicklime (SNI Biosecurity Standard)',
      actor: 'Ilfa Hidayat (Supervisor)',
      notes: 'Pre-dawn DO dropped to 3.7 mg/L; scooped mortalities and increased aerator to 90%.',
      recorded_at: new Date('2026-10-17T06:30:00+07:00')
    },
    {
      id: 'MORT-K04-20261013-01',
      pond_id: 'K04',
      count: 12,
      avg_weight_grams: 360.0,
      biomass_lost_kg: 4.32,
      cause: 'Elevated Ammonia / TAN Deficit',
      disposal_method: 'Buried with Quicklime (SNI Biosecurity Standard)',
      actor: 'Ilfa Hidayat (Supervisor)',
      notes: 'Floc density surged to 19 mL/L.',
      recorded_at: new Date('2026-10-13T07:00:00+07:00')
    },
    {
      id: 'MORT-K04-20261001-01',
      pond_id: 'K04',
      count: 20,
      avg_weight_grams: 310.0,
      biomass_lost_kg: 6.20,
      cause: 'Routine / Natural Mortality',
      disposal_method: 'Buried with Quicklime (SNI Biosecurity Standard)',
      actor: 'Ilfa Hidayat (Supervisor)',
      notes: 'Routine water surface skimming on Pond K04.',
      recorded_at: new Date('2026-10-01T07:45:00+07:00')
    },
    {
      id: 'MORT-K04-20260910-01',
      pond_id: 'K04',
      count: 40,
      avg_weight_grams: 220.0,
      biomass_lost_kg: 8.80,
      cause: 'Grading & Handling Stress',
      disposal_method: 'Buried with Quicklime (SNI Biosecurity Standard)',
      actor: 'Ilfa Hidayat (Supervisor)',
      notes: 'Intensive weight sampling during high-density growth trial.',
      recorded_at: new Date('2026-09-10T08:00:00+07:00')
    },
    {
      id: 'MORT-K04-20260822-01',
      pond_id: 'K04',
      count: 70,
      avg_weight_grams: 120.0,
      biomass_lost_kg: 8.40,
      cause: 'Stocking Adaptation / Fingerling Stress',
      disposal_method: 'Buried with Quicklime (SNI Biosecurity Standard)',
      actor: 'Ilfa Hidayat (Supervisor)',
      notes: 'Initial stocking acclimation for 2,750 high-density fingerlings.',
      recorded_at: new Date('2026-08-22T07:30:00+07:00')
    }
  ]
  await knex('mortality_logs').insert(mortalityLogsData)

  // 2. Seed Actuators for each Pond (4 per pond = 16 actuators)
  const actuatorsData = []
  for (const pond of pondsData) {
    const pNum = pond.id.replace('K', '')
    actuatorsData.push(
      {
        id: `ESP32-${pond.id}-AR`,
        pond_id: pond.id,
        type: 'AERATOR',
        name: `VFD Aerator #${pNum}`,
        status: 'RUNNING',
        power_percent: pond.id === 'K04' ? 90 : (pond.id === 'K01' ? 80 : 75),
        config: JSON.stringify({ targetRpm: pond.id === 'K04' ? 1350 : 1200, maxRpm: 1500, mode: 'AUTO_VFD' })
      },
      {
        id: `ESP32-${pond.id}-FD`,
        pond_id: pond.id,
        type: 'FEEDER',
        name: `Auto-Feeder #${pNum}`,
        status: 'IDLE',
        dispensed_today_kg: pond.id === 'K01' ? 22.4 : (pond.id === 'K02' ? 12.5 : (pond.id === 'K03' ? 4.5 : 15.0)),
        target_daily_kg: pond.id === 'K01' ? 48.0 : (pond.id === 'K02' ? 26.0 : (pond.id === 'K03' ? 9.0 : 32.0)),
        next_schedule: '18:00',
        config: JSON.stringify({ feedType: pond.id === 'K03' ? 'BioCrumble-1' : 'BioGrow-7 Floating Pellet', dosePerPulseGrams: 50 })
      },
      {
        id: `ESP32-${pond.id}-DS`,
        pond_id: pond.id,
        type: 'MOLASSES_PUMP',
        name: `Molasses Dosing Valve #${pNum}`,
        status: 'IDLE',
        config: JSON.stringify({ doseUnit: 'ml', brixRating: 79.5 })
      },
      {
        id: `ESP32-${pond.id}-FLUSH`,
        pond_id: pond.id,
        type: 'SIPHON_VALVE',
        name: `Bottom Siphon Drain Valve #${pNum}`,
        status: 'IDLE',
        config: JSON.stringify({ maxVolumeLiters: 500, flowRateLpm: 60 })
      }
    )
  }
  await knex('actuators').insert(actuatorsData)

  // 3. Seed Telemetry Logs: Strictly 6-Hour Cycle Schedule (00:00, 06:00, 12:00, 18:00)
  // Generating calibrated historical data points for the past 3 days (15, 16, 17 Oct 2026)
  const telemetryLogs = []
  const days = ['2026-10-15', '2026-10-16', '2026-10-17']
  const timeSlots = [
    { time: '00:00:00', slotLabel: 'Midnight (Respiration check)', tempOffset: -0.6, doOffset: -0.5, phOffset: -0.15, tanOffset: +0.002, flocOffset: +0.5 },
    { time: '06:00:00', slotLabel: 'Morning Baseline (Pre-feed)', tempOffset: -1.0, doOffset: -0.8, phOffset: -0.20, tanOffset: -0.003, flocOffset: -0.2 },
    { time: '12:00:00', slotLabel: 'Midday Peak (Max solar/temp)', tempOffset: +1.2, doOffset: +0.7, phOffset: +0.25, tanOffset: +0.004, flocOffset: +0.8 },
    { time: '18:00:00', slotLabel: 'Evening (Post afternoon feed)', tempOffset: +0.4, doOffset: +0.2, phOffset: +0.10, tanOffset: +0.006, flocOffset: +0.4 }
  ]

  const pondProfiles = {
    K01: { baseDo: 6.3, basePh: 7.60, baseTemp: 28.5, baseTan: 0.015, baseFloc: 14.0, baseOrp: 280, baseTds: 1100, cond: 'ok' },
    K02: { baseDo: 5.8, basePh: 7.45, baseTemp: 28.8, baseTan: 0.022, baseFloc: 16.5, baseOrp: 265, baseTds: 1150, cond: 'ok' },
    K03: { baseDo: 6.1, basePh: 7.75, baseTemp: 28.2, baseTan: 0.018, baseFloc: 12.0, baseOrp: 290, baseTds: 1080, cond: 'ok' },
    K04: { baseDo: 4.5, basePh: 7.15, baseTemp: 29.5, baseTan: 0.048, baseFloc: 19.5, baseOrp: 230, baseTds: 1280, cond: 'warning' }
  }

  for (const day of days) {
    for (const slot of timeSlots) {
      const timestampStr = `${day}T${slot.time}+07:00`
      const timestampDate = new Date(timestampStr)

      for (const [pondId, prof] of Object.entries(pondProfiles)) {
        const doVal = +(prof.baseDo + slot.doOffset + (Math.sin(telemetryLogs.length) * 0.15)).toFixed(2)
        const phVal = +(prof.basePh + slot.phOffset + (Math.cos(telemetryLogs.length) * 0.05)).toFixed(2)
        const tempVal = +(prof.baseTemp + slot.tempOffset).toFixed(1)
        const tanVal = +(Math.max(0.005, prof.baseTan + slot.tanOffset)).toFixed(3)
        const flocVal = +(prof.baseFloc + slot.flocOffset).toFixed(1)

        telemetryLogs.push({
          pond_id: pondId,
          device_id: `ESP32-${pondId}`,
          timestamp: timestampDate,
          dissolved_oxygen: doVal,
          ph: phVal,
          temperature: tempVal,
          ammonia: tanVal,
          floc_density: flocVal,
          orp: prof.baseOrp + (slot.time === '12:00:00' ? 15 : -10),
          tds: prof.baseTds + Math.round(Math.random() * 20),
          battery_percent: +(97.5 - (days.indexOf(day) * 0.5)).toFixed(1),
          simulation_condition: pondId === 'K04' ? 'warning' : 'ok',
          raw_payload: JSON.stringify({
            scheduleWindow: slot.slotLabel,
            interval: '6h_cycle',
            slotHour: slot.time.substring(0, 5)
          }),
          created_at: timestampDate
        })
      }
    }
  }
  await knex('telemetry_logs').insert(telemetryLogs)

  // 4. Seed AI Morning Recommendations for Today & Yesterday
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const yesterday = new Date(now.getTime() - 86400000)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  const aiRecsData = [
    {
      id: `REC-K01-${todayStr}`,
      pond_id: 'K01',
      plan_date: todayStr,
      status: 'APPROVED',
      approved_by: 'Ilfa Hidayat (Farm Supervisor)',
      approved_at: new Date('2026-10-17T07:15:00+07:00'),
      summary: 'Water parameters are exceptionally healthy with high microbial floc activity. Maintain standard feeding curve and 80% VFD aeration lock.',
      treatments: JSON.stringify([
        {
          id: 'PLAN-K01-01',
          category: 'FEEDING',
          title: 'Morning Feeding Window #1 (BioGrow-7 Pellets)',
          dosageAmount: 11.2,
          dosageUnit: 'kg',
          scheduledTime: '08:00 WIB',
          hardwareNode: 'sac/k01/feeder',
          status: 'SUCCESS'
        },
        {
          id: 'PLAN-K01-02',
          category: 'AERATION',
          title: 'Continuous VFD Aerator Speed Maintenance (80% Power)',
          dosageAmount: 80,
          dosageUnit: '%',
          aeratorPowerPercent: 80,
          aeratorRpm: 1200,
          scheduledTime: 'Continuous (VFD)',
          hardwareNode: 'sac/k01/aerator',
          status: 'RUNNING'
        },
        {
          id: 'PLAN-K01-03',
          category: 'FEEDING',
          title: 'Afternoon Feeding Window #2 (BioGrow-7 Pellets)',
          dosageAmount: 11.2,
          dosageUnit: 'kg',
          scheduledTime: '14:30 WIB',
          hardwareNode: 'sac/k01/feeder',
          status: 'SUCCESS'
        },
        {
          id: 'PLAN-K01-04',
          category: 'MOLASSES',
          title: 'Post-Feed C:N Balancing Carbon Dosing (400g Molasses)',
          dosageAmount: 400,
          dosageUnit: 'g',
          scheduledTime: '15:15 WIB',
          hardwareNode: 'sac/k01/molasses',
          status: 'SUCCESS'
        }
      ])
    },
    {
      id: `REC-K02-${todayStr}`,
      pond_id: 'K02',
      plan_date: todayStr,
      status: 'APPROVED',
      approved_by: 'Ilfa Hidayat (Farm Supervisor)',
      approved_at: new Date('2026-10-17T07:18:00+07:00'),
      summary: 'Grower stage biomass expanding rapidly. Maintain high dissolved oxygen (>5.5 mg/L) and 12.5 kg daily feed ration.',
      treatments: JSON.stringify([
        {
          id: 'PLAN-K02-01',
          category: 'FEEDING',
          title: 'Morning Feeding Window #1 (BioGrow-7)',
          dosageAmount: 6.25,
          dosageUnit: 'kg',
          scheduledTime: '08:30 WIB',
          hardwareNode: 'sac/k02/feeder',
          status: 'SUCCESS'
        },
        {
          id: 'PLAN-K02-02',
          category: 'AERATION',
          title: 'Aerator Speed Lock (75% VFD Power)',
          dosageAmount: 75,
          dosageUnit: '%',
          aeratorPowerPercent: 75,
          aeratorRpm: 1125,
          scheduledTime: 'Continuous',
          hardwareNode: 'sac/k02/aerator',
          status: 'RUNNING'
        },
        {
          id: 'PLAN-K02-03',
          category: 'MOLASSES',
          title: 'Heterotrophic Carbon Addition (350g Molasses)',
          dosageAmount: 350,
          dosageUnit: 'g',
          scheduledTime: '15:30 WIB',
          hardwareNode: 'sac/k02/molasses',
          status: 'SUCCESS'
        }
      ])
    },
    {
      id: `REC-K03-${todayStr}`,
      pond_id: 'K03',
      plan_date: todayStr,
      status: 'APPROVED',
      approved_by: 'Ilfa Hidayat (Farm Supervisor)',
      approved_at: new Date('2026-10-17T07:22:00+07:00'),
      summary: 'Nursery fingerlings active and healthy. Total ammonia low (0.018 ppm). Fine crumble feeding schedule active.',
      treatments: JSON.stringify([
        {
          id: 'PLAN-K03-01',
          category: 'FEEDING',
          title: 'Fingerling Crumble Feeding (4x Daily Allocation)',
          dosageAmount: 2.25,
          dosageUnit: 'kg',
          scheduledTime: '08:00 WIB',
          hardwareNode: 'sac/k03/feeder',
          status: 'SUCCESS'
        },
        {
          id: 'PLAN-K03-02',
          category: 'AERATION',
          title: 'Gentle Aeration Flow (70% VFD Power)',
          dosageAmount: 70,
          dosageUnit: '%',
          aeratorPowerPercent: 70,
          aeratorRpm: 1050,
          scheduledTime: 'Continuous',
          hardwareNode: 'sac/k03/aerator',
          status: 'RUNNING'
        }
      ])
    },
    {
      id: `REC-K04-${todayStr}`,
      pond_id: 'K04',
      plan_date: todayStr,
      status: 'PENDING',
      summary: 'Intensive biomass density requires intervention: DO dip observed at 4.3 mg/L and TAN elevated to 0.048 ppm. Recommended 90% aeration boost, bottom siphon flush (5.0 m³), and 450g molasses carbon dosing.',
      treatments: JSON.stringify([
        {
          id: 'PLAN-K04-01',
          category: 'AERATION',
          title: 'Emergency Aerator Boost (90% Power Lock)',
          dosageAmount: 90,
          dosageUnit: '%',
          aeratorPowerPercent: 90,
          aeratorRpm: 1350,
          scheduledTime: 'Immediate',
          hardwareNode: 'sac/k04/aerator',
          status: 'SCHEDULED'
        },
        {
          id: 'PLAN-K04-02',
          category: 'SIPHON_FLUSH',
          title: 'Bottom Sludge Siphon & Water Exchange (5.0 m³)',
          dosageAmount: 5.0,
          dosageUnit: 'm³',
          scheduledTime: '16:00 WIB',
          hardwareNode: 'sac/k04/flush',
          status: 'SCHEDULED'
        },
        {
          id: 'PLAN-K04-03',
          category: 'MOLASSES',
          title: 'Avnimelech C:N Ratio Correction Dosing (450g Molasses)',
          dosageAmount: 450,
          dosageUnit: 'g',
          scheduledTime: '16:45 WIB',
          hardwareNode: 'sac/k04/molasses',
          status: 'SCHEDULED'
        }
      ])
    }
  ]
  await knex('ai_recommendations').insert(aiRecsData)

  // 5. Seed Execution Logs (Chronological Operational Trail: 4 Essential Biofloc Treatments)
  // Categories strictly: FEEDING (3x: Morning, Noon, Afternoon), MOLASSES, SIPHON_FLUSH, AERATION (Aerator Speed)
  const executionLogsData = [
    // --- Pond K01 (Finisher A) ---
    {
      id: `ACT-${todayStr}-K01-01`,
      pond_id: 'K01',
      category: 'AERATION',
      title: 'Aerator Speed Control (VFD 80% Power)',
      dosage_amount: 80,
      dosage_unit: '%',
      aerator_power_percent: 80,
      aerator_rpm: 1200,
      scheduled_time: '06:00 WIB',
      executed_at: new Date(`${todayStr}T06:02:10+07:00`),
      status: 'SUCCESS',
      actor: 'AI Closed-Loop Controller',
      hardware_id: 'ESP32-K01-AR (VFD Inverter)',
      notes: 'VFD inverter aerator frequency calibration (~1,200 RPM / 40.0 Hz) maintains optimal floc suspension.'
    },
    {
      id: `ACT-${todayStr}-K01-02`,
      pond_id: 'K01',
      category: 'FEEDING',
      title: 'Feed Dispense #1 (Morning) — BioGrow-7',
      dosage_amount: 11.2,
      dosage_unit: 'kg',
      scheduled_time: '08:00 WIB',
      executed_at: new Date(`${todayStr}T08:00:25+07:00`),
      status: 'SUCCESS',
      actor: 'Smart Auto-Feeder (AI Schedule)',
      hardware_id: 'ESP32-K01-FD (Auto-Feeder)',
      notes: 'Morning ration (30% of total 37.2 kg daily feed). Pre-feed DO verified safe at 6.4 mg/L.'
    },
    {
      id: `ACT-${todayStr}-K01-03`,
      pond_id: 'K01',
      category: 'SIPHON_FLUSH',
      title: 'Water Exchange & Sludge Siphon (250 L)',
      dosage_amount: 250,
      dosage_unit: 'L',
      scheduled_time: '10:30 WIB',
      executed_at: new Date(`${todayStr}T10:31:18+07:00`),
      status: 'SUCCESS',
      actor: 'Ilfa Hidayat (Supervisor Purge)',
      hardware_id: 'ESP32-K01-FLUSH (Siphon Valve)',
      notes: 'Purging bottom anaerobic sludge and organic particulate buildup with fresh water top-up.'
    },
    {
      id: `ACT-${todayStr}-K01-04`,
      pond_id: 'K01',
      category: 'FEEDING',
      title: 'Feed Dispense #2 (Noon) — BioGrow-7',
      dosage_amount: 14.8,
      dosage_unit: 'kg',
      scheduled_time: '12:30 WIB',
      executed_at: null,
      status: 'SCHEDULED',
      actor: 'Smart Auto-Feeder (AI Schedule)',
      hardware_id: 'ESP32-K01-FD (Auto-Feeder)',
      notes: 'Peak metabolic noon ration (40% of total daily ration) at optimal temperature of 28.8°C.'
    },
    {
      id: `ACT-${todayStr}-K01-05`,
      pond_id: 'K01',
      category: 'MOLASSES',
      title: 'Molasses C:N 15:1 Balancing (400 g)',
      dosage_amount: 400,
      dosage_unit: 'g',
      scheduled_time: '14:30 WIB',
      executed_at: null,
      status: 'SCHEDULED',
      actor: 'AI Dosing Valve Actuator',
      hardware_id: 'ESP32-K01-DS (Molasses Pump)',
      notes: 'Cane molasses organic carbon injection (C:N 15:1) for converting TAN ammonia into microbial biofloc protein.'
    },
    {
      id: `ACT-${todayStr}-K01-06`,
      pond_id: 'K01',
      category: 'FEEDING',
      title: 'Feed Dispense #3 (Afternoon) — BioGrow-7',
      dosage_amount: 11.2,
      dosage_unit: 'kg',
      scheduled_time: '17:00 WIB',
      executed_at: null,
      status: 'SCHEDULED',
      actor: 'Smart Auto-Feeder (AI Schedule)',
      hardware_id: 'ESP32-K01-FD (Auto-Feeder)',
      notes: 'Afternoon closing daily ration (30% of total daily ration) before nighttime temperature decline.'
    },

    // --- Pond K02 (Grower B) ---
    {
      id: `ACT-${todayStr}-K02-01`,
      pond_id: 'K02',
      category: 'AERATION',
      title: 'Aerator Speed Control (VFD 75% Power)',
      dosage_amount: 75,
      dosage_unit: '%',
      aerator_power_percent: 75,
      aerator_rpm: 1125,
      scheduled_time: '06:00 WIB',
      executed_at: new Date(`${todayStr}T06:04:15+07:00`),
      status: 'SUCCESS',
      actor: 'AI Closed-Loop Controller',
      hardware_id: 'ESP32-K02-AR (VFD Inverter)',
      notes: 'Aeration speed set to 75% (~1,125 RPM) for active grower phase.'
    },
    {
      id: `ACT-${todayStr}-K02-02`,
      pond_id: 'K02',
      category: 'FEEDING',
      title: 'Feed Dispense #1 (Morning) — BioGrow-7',
      dosage_amount: 6.25,
      dosage_unit: 'kg',
      scheduled_time: '08:30 WIB',
      executed_at: new Date(`${todayStr}T08:30:10+07:00`),
      status: 'SUCCESS',
      actor: 'Smart Auto-Feeder (AI Schedule)',
      hardware_id: 'ESP32-K02-FD (Auto-Feeder)',
      notes: 'Morning grower ration. Active and healthy surface feeding pattern.'
    },
    {
      id: `ACT-${todayStr}-K02-03`,
      pond_id: 'K02',
      category: 'SIPHON_FLUSH',
      title: 'Water Exchange & Sludge Siphon (200 L)',
      dosage_amount: 200,
      dosage_unit: 'L',
      scheduled_time: '11:00 WIB',
      executed_at: null,
      status: 'SCHEDULED',
      actor: 'Supervisor Manual Purge',
      hardware_id: 'ESP32-K02-FLUSH (Siphon Valve)',
      notes: 'Purging dense settling floc from pond bottom.'
    },
    {
      id: `ACT-${todayStr}-K02-04`,
      pond_id: 'K02',
      category: 'FEEDING',
      title: 'Feed Dispense #2 (Noon) — BioGrow-7',
      dosage_amount: 8.30,
      dosage_unit: 'kg',
      scheduled_time: '13:00 WIB',
      executed_at: null,
      status: 'SCHEDULED',
      actor: 'Smart Auto-Feeder (AI Schedule)',
      hardware_id: 'ESP32-K02-FD (Auto-Feeder)',
      notes: 'Noon grow-out ration for tilapia stock.'
    },
    {
      id: `ACT-${todayStr}-K02-05`,
      pond_id: 'K02',
      category: 'MOLASSES',
      title: 'Molasses C:N 15:1 Balancing (350 g)',
      dosage_amount: 350,
      dosage_unit: 'g',
      scheduled_time: '15:00 WIB',
      executed_at: null,
      status: 'SCHEDULED',
      actor: 'AI Dosing Valve Actuator',
      hardware_id: 'ESP32-K02-DS (Molasses Pump)',
      notes: 'Molasses dosage maintaining balanced C:N 15:1 ratio.'
    },
    {
      id: `ACT-${todayStr}-K02-06`,
      pond_id: 'K02',
      category: 'FEEDING',
      title: 'Feed Dispense #3 (Afternoon) — BioGrow-7',
      dosage_amount: 6.25,
      dosage_unit: 'kg',
      scheduled_time: '17:30 WIB',
      executed_at: null,
      status: 'SCHEDULED',
      actor: 'Smart Auto-Feeder (AI Schedule)',
      hardware_id: 'ESP32-K02-FD (Auto-Feeder)',
      notes: 'Afternoon closing daily ration for Pond Grower B.'
    },

    // --- Pond K03 (Nursery 2) ---
    {
      id: `ACT-${todayStr}-K03-01`,
      pond_id: 'K03',
      category: 'AERATION',
      title: 'Aerator Speed Control (VFD 70% Power)',
      dosage_amount: 70,
      dosage_unit: '%',
      aerator_power_percent: 70,
      aerator_rpm: 1050,
      scheduled_time: '06:00 WIB',
      executed_at: new Date(`${todayStr}T06:03:00+07:00`),
      status: 'SUCCESS',
      actor: 'AI Closed-Loop Controller',
      hardware_id: 'ESP32-K03-AR (VFD Inverter)',
      notes: 'Gentle aeration stream (~1,050 RPM) protecting fingerling stock.'
    },
    {
      id: `ACT-${todayStr}-K03-02`,
      pond_id: 'K03',
      category: 'FEEDING',
      title: 'Feed Dispense #1 (Morning) — BioCrumble',
      dosage_amount: 2.25,
      dosage_unit: 'kg',
      scheduled_time: '08:00 WIB',
      executed_at: new Date(`${todayStr}T08:01:05+07:00`),
      status: 'SUCCESS',
      actor: 'Auto-Feeder Micro-Dose',
      hardware_id: 'ESP32-K03-FD (Micro-Feeder)',
      notes: 'Micro-crumble starter pellet distribution for fingerlings.'
    },
    {
      id: `ACT-${todayStr}-K03-03`,
      pond_id: 'K03',
      category: 'SIPHON_FLUSH',
      title: 'Water Exchange & Sludge Siphon (150 L)',
      dosage_amount: 150,
      dosage_unit: 'L',
      scheduled_time: '10:00 WIB',
      executed_at: null,
      status: 'SCHEDULED',
      actor: 'Supervisor Manual Purge',
      hardware_id: 'ESP32-K03-FLUSH (Siphon Valve)',
      notes: 'Precision nursery bottom sludge purge with clean water top-up.'
    },
    {
      id: `ACT-${todayStr}-K03-04`,
      pond_id: 'K03',
      category: 'FEEDING',
      title: 'Feed Dispense #2 (Noon) — BioCrumble',
      dosage_amount: 3.00,
      dosage_unit: 'kg',
      scheduled_time: '12:30 WIB',
      executed_at: null,
      status: 'SCHEDULED',
      actor: 'Auto-Feeder Micro-Dose',
      hardware_id: 'ESP32-K03-FD (Micro-Feeder)',
      notes: 'Mid-day nursery starter ration.'
    },
    {
      id: `ACT-${todayStr}-K03-05`,
      pond_id: 'K03',
      category: 'MOLASSES',
      title: 'Molasses C:N 15:1 Balancing (200 g)',
      dosage_amount: 200,
      dosage_unit: 'g',
      scheduled_time: '14:00 WIB',
      executed_at: null,
      status: 'SCHEDULED',
      actor: 'AI Dosing Valve Actuator',
      hardware_id: 'ESP32-K03-DS (Molasses Pump)',
      notes: 'Light organic carbon supplementation for nursery biofloc culture.'
    },
    {
      id: `ACT-${todayStr}-K03-06`,
      pond_id: 'K03',
      category: 'FEEDING',
      title: 'Feed Dispense #3 (Afternoon) — BioCrumble',
      dosage_amount: 2.25,
      dosage_unit: 'kg',
      scheduled_time: '17:00 WIB',
      executed_at: null,
      status: 'SCHEDULED',
      actor: 'Auto-Feeder Micro-Dose',
      hardware_id: 'ESP32-K03-FD (Micro-Feeder)',
      notes: 'Afternoon closing starter ration for nursery.'
    },

    // --- Pond K04 (Intensive Biomass C) ---
    {
      id: `ACT-${todayStr}-K04-01`,
      pond_id: 'K04',
      category: 'AERATION',
      title: 'Aerator Speed Control (VFD 90% Power Lock)',
      dosage_amount: 90,
      dosage_unit: '%',
      aerator_power_percent: 90,
      aerator_rpm: 1350,
      scheduled_time: '06:00 WIB',
      executed_at: new Date(`${todayStr}T06:01:20+07:00`),
      status: 'SUCCESS',
      actor: 'AI Closed-Loop Controller',
      hardware_id: 'ESP32-K04-AR (VFD Inverter)',
      notes: 'Aerator speed elevated to 90% (~1,350 RPM) accommodating heavy biomass stocking.'
    },
    {
      id: `ACT-${todayStr}-K04-02`,
      pond_id: 'K04',
      category: 'FEEDING',
      title: 'Feed Dispense #1 (Morning) — BioGrow-7',
      dosage_amount: 8.80,
      dosage_unit: 'kg',
      scheduled_time: '08:00 WIB',
      executed_at: new Date(`${todayStr}T08:00:10+07:00`),
      status: 'SUCCESS',
      actor: 'Smart Auto-Feeder (AI Schedule)',
      hardware_id: 'ESP32-K04-FD (Auto-Feeder)',
      notes: 'Morning feeding for high-density biomass.'
    },
    {
      id: `ACT-${todayStr}-K04-03`,
      pond_id: 'K04',
      category: 'SIPHON_FLUSH',
      title: 'Water Exchange & Sludge Siphon (300 L)',
      dosage_amount: 300,
      dosage_unit: 'L',
      scheduled_time: '10:30 WIB',
      executed_at: null,
      status: 'SCHEDULED',
      actor: 'Supervisor Manual Purge',
      hardware_id: 'ESP32-K04-FLUSH (Siphon Valve)',
      notes: 'Sludge siphon purge to prevent sudden nocturnal oxygen sag.'
    },
    {
      id: `ACT-${todayStr}-K04-04`,
      pond_id: 'K04',
      category: 'FEEDING',
      title: 'Feed Dispense #2 (Noon) — BioGrow-7',
      dosage_amount: 11.80,
      dosage_unit: 'kg',
      scheduled_time: '12:30 WIB',
      executed_at: null,
      status: 'SCHEDULED',
      actor: 'Smart Auto-Feeder (AI Schedule)',
      hardware_id: 'ESP32-K04-FD (Auto-Feeder)',
      notes: 'Mid-day intensive biomass ration.'
    },
    {
      id: `ACT-${todayStr}-K04-05`,
      pond_id: 'K04',
      category: 'MOLASSES',
      title: 'Molasses C:N 15:1 Balancing (450 g)',
      dosage_amount: 450,
      dosage_unit: 'g',
      scheduled_time: '14:30 WIB',
      executed_at: null,
      status: 'SCHEDULED',
      actor: 'AI Dosing Valve Actuator',
      hardware_id: 'ESP32-K04-DS (Molasses Pump)',
      notes: 'Carbon injection mitigating ammonia spikes in high-density biomass.'
    },
    {
      id: `ACT-${todayStr}-K04-06`,
      pond_id: 'K04',
      category: 'FEEDING',
      title: 'Feed Dispense #3 (Afternoon) — BioGrow-7',
      dosage_amount: 8.80,
      dosage_unit: 'kg',
      scheduled_time: '17:00 WIB',
      executed_at: null,
      status: 'SCHEDULED',
      actor: 'Smart Auto-Feeder (AI Schedule)',
      hardware_id: 'ESP32-K04-FD (Auto-Feeder)',
      notes: 'Afternoon closing feeding for high-density biomass.'
    }
  ]
  await knex('execution_logs').insert(executionLogsData)

  // 6. Seed AI Analyses (Gemini Biofloc Synthesis History at 6-Hour Intervals)
  const aiAnalysesData = [
    {
      id: `AI-EVAL-${todayStr}-K01-0600`,
      pond_id: 'K01',
      trigger_type: '6H_SCHEDULED_CYCLE',
      health_score: 98,
      health_status: 'OPTIMAL',
      summary: '06:00 Morning Baseline: Biofloc microbial consortium in steady state. Dissolved oxygen stable at 5.5 mg/L, TAN safe at 0.012 ppm. Proceed with full morning feeding curve.',
      telemetry_snapshot: JSON.stringify({ do: 5.5, temp: 27.5, ph: 7.42, ammonia: 0.012, flocDensity: 13.8 }),
      anomalies_detected: JSON.stringify([]),
      recommendation_payload: JSON.stringify({ aeratorPower: 80, feedKg: 11.2, molassesGrams: 400 }),
      model_used: 'gemini-3.8-flash',
      prompt_tokens: 385,
      candidate_tokens: 142,
      created_at: new Date('2026-10-17T06:01:00+07:00')
    },
    {
      id: `AI-EVAL-${todayStr}-K01-1200`,
      pond_id: 'K01',
      trigger_type: '6H_SCHEDULED_CYCLE',
      health_score: 98,
      health_status: 'OPTIMAL',
      summary: '12:00 Midday Evaluation: Water temperature reached 29.8 °C. Oxygenation robust at 7.0 mg/L with active aeration. Floc volume measured at 14.8 mL/L (optimal 10-25 mL/L).',
      telemetry_snapshot: JSON.stringify({ do: 7.0, temp: 29.8, ph: 7.85, ammonia: 0.019, flocDensity: 14.8 }),
      anomalies_detected: JSON.stringify([]),
      recommendation_payload: JSON.stringify({ aeratorPower: 80, nextFeedTime: '14:30' }),
      model_used: 'gemini-3.8-flash',
      prompt_tokens: 392,
      candidate_tokens: 130,
      created_at: new Date('2026-10-17T12:01:00+07:00')
    },
    {
      id: `AI-EVAL-${todayStr}-K04-0600`,
      pond_id: 'K04',
      trigger_type: '6H_SCHEDULED_CYCLE',
      health_score: 86,
      health_status: 'WARNING',
      summary: '06:00 Morning Baseline Alert: Elevated stocking biomass causing nocturnal DO dip to 3.7 mg/L. Ammonia TAN slightly elevated at 0.045 ppm. Immediate VFD aerator acceleration recommended.',
      telemetry_snapshot: JSON.stringify({ do: 3.7, temp: 28.5, ph: 6.95, ammonia: 0.045, flocDensity: 19.3 }),
      anomalies_detected: JSON.stringify([
        { parameter: 'DO', severity: 'WARNING', value: 3.7, optimal: '5.0 - 7.5 mg/L', issue: 'Below biofloc respiration target' }
      ]),
      recommendation_payload: JSON.stringify({ aeratorPower: 90, carbonDose: '450g molasses' }),
      model_used: 'gemini-3.8-flash',
      prompt_tokens: 410,
      candidate_tokens: 165,
      created_at: new Date('2026-10-17T06:01:30+07:00')
    },
    {
      id: `AI-EVAL-${todayStr}-K04-1800`,
      pond_id: 'K04',
      trigger_type: '6H_SCHEDULED_CYCLE',
      health_score: 88,
      health_status: 'WARNING',
      summary: '18:00 Evening Assessment: DO recovered to 4.5 mg/L following aerator boost. TAN remains at 0.048 ppm. Maintain 90% aeration overnight and schedule bottom siphon drain tomorrow morning.',
      telemetry_snapshot: JSON.stringify({ do: 4.5, temp: 29.9, ph: 7.25, ammonia: 0.048, flocDensity: 19.9 }),
      anomalies_detected: JSON.stringify([
        { parameter: 'Ammonia', severity: 'WARNING', value: 0.048, optimal: '< 0.05 ppm', issue: 'Elevated TAN near warning threshold' }
      ]),
      recommendation_payload: JSON.stringify({ aeratorPower: 90, nightWatch: true }),
      model_used: 'gemini-3.8-flash',
      prompt_tokens: 420,
      candidate_tokens: 155,
      created_at: new Date('2026-10-17T18:01:00+07:00')
    }
  ]
  await knex('ai_analyses').insert(aiAnalysesData)

  // 7. Seed System Audit Logs (Immutable Operational Events)
  const auditLogsData = [
    {
      pond_id: 'K01',
      event_type: 'TELEMETRY_SCHEDULE_6H',
      message: '6-Hour periodic telemetry packet ingested at 06:00 WIB: DO 5.5 mg/L, Temp 27.5 °C, pH 7.42, TAN 0.012 ppm.',
      metadata: JSON.stringify({ cycle: '06:00', slot: 'Morning Baseline', condition: 'OPTIMAL' }),
      created_at: new Date('2026-10-17T06:00:15+07:00')
    },
    {
      pond_id: 'K01',
      event_type: 'AI_APPROVAL',
      message: 'Supervisor Ilfa Hidayat approved Morning Treatment Plan REC-K01-2026-10-17 (Feeding: 22.4 kg, Aeration: 80%, Molasses: 400g).',
      metadata: JSON.stringify({ recommendationId: `REC-K01-${todayStr}`, actor: 'Ilfa Hidayat' }),
      created_at: new Date('2026-10-17T07:15:20+07:00')
    },
    {
      pond_id: 'K01',
      event_type: 'COMMAND_DISPATCHED',
      message: 'Dispatched automated feeding command to ESP32-K01-FD (11.2 kg BioGrow-7 Floating Pellets).',
      metadata: JSON.stringify({ action: 'FEEDING', amountKg: 11.2, feederId: 'ESP32-K01-FD' }),
      created_at: new Date('2026-10-17T08:00:00+07:00')
    },
    {
      pond_id: 'K04',
      event_type: 'THRESHOLD_ALERT',
      message: 'DO Warning triggered on Pond K04: Value 3.7 mg/L below safe biofloc threshold (5.0 mg/L). Automated VFD aerator acceleration initiated.',
      metadata: JSON.stringify({ parameter: 'DO', measured: 3.7, target: 5.5 }),
      created_at: new Date('2026-10-17T06:02:10+07:00')
    },
    {
      pond_id: 'K01',
      event_type: 'TELEMETRY_SCHEDULE_6H',
      message: '6-Hour periodic telemetry packet ingested at 12:00 WIB: DO 7.0 mg/L, Temp 29.8 °C, pH 7.85, TAN 0.019 ppm.',
      metadata: JSON.stringify({ cycle: '12:00', slot: 'Midday Peak', condition: 'OPTIMAL' }),
      created_at: new Date('2026-10-17T12:00:10+07:00')
    },
    {
      pond_id: 'K02',
      event_type: 'COMMAND_DISPATCHED',
      message: 'Central bottom siphon valve activated for 5.0 m³ sludge discharge on Pond K02.',
      metadata: JSON.stringify({ action: 'SIPHON_FLUSH', volumeM3: 5.0, actor: 'Ilfa Hidayat' }),
      created_at: new Date('2026-10-17T15:30:00+07:00')
    },
    {
      pond_id: 'K01',
      event_type: 'COMMAND_DISPATCHED',
      message: 'Molasses dosing pump ESP32-K01-DS activated: 400g carbon source injected for C:N 15:1 ratio balancing.',
      metadata: JSON.stringify({ action: 'MOLASSES_DOSING', amountGrams: 400 }),
      created_at: new Date('2026-10-17T15:15:00+07:00')
    },
    {
      pond_id: 'K04',
      event_type: 'TELEMETRY_SCHEDULE_6H',
      message: '6-Hour periodic telemetry packet ingested at 18:00 WIB: DO 4.5 mg/L, Temp 29.9 °C, pH 7.25, TAN 0.048 ppm.',
      metadata: JSON.stringify({ cycle: '18:00', slot: 'Evening Slot', condition: 'WARNING' }),
      created_at: new Date('2026-10-17T18:00:15+07:00')
    }
  ]
  await knex('audit_logs').insert(auditLogsData)

  console.log('[Seed] Database successfully seeded with 4 Ponds, 16 Actuators, 48 6-Hour Telemetry Logs, AI Recommendations, Executions & Audit Trails.')
}
