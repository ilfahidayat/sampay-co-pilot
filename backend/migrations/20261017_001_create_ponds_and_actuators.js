/**
 * Migration 001: Ponds & Actuators
 */
export async function up(knex) {
  // 1. Ponds Table
  await knex.schema.createTable('ponds', (table) => {
    table.string('id', 16).primary() // K01, K02, K03, K04
    table.string('name', 100).notNullable()
    table.string('species', 100).notNullable()
    table.string('phase', 100).notNullable()
    table.integer('fish_count').defaultTo(2000)
    table.float('avg_weight_grams').defaultTo(400)
    table.float('volume_m3').defaultTo(50.0)
    table.float('initial_biomass_kg').defaultTo(300.0)
    table.integer('initial_fish_count').defaultTo(2000)
    table.float('initial_weight_grams').defaultTo(150.0)
    table.float('target_harvest_weight_grams').defaultTo(950.0)
    table.string('stocking_date', 30).nullable()
    table.integer('doc').defaultTo(60) // Days of Culture
    table.float('survival_rate').defaultTo(92.0)
    table.float('adg_grams_day').defaultTo(4.5)
    table.string('cycle_status', 20).defaultTo('ACTIVE')
    table.float('cumulative_feed_kg').defaultTo(0.0)
    table.float('cumulative_molasses_kg').defaultTo(0.0)
    table.float('health_score').defaultTo(95.0)
    table.string('status', 20).defaultTo('OPTIMAL')
    table.json('telemetry_cache').nullable()
    table.timestamps(true, true)
  })

  // 2. Actuators Table
  await knex.schema.createTable('actuators', (table) => {
    table.string('id', 64).primary() // ESP32-K01-FD, ESP32-K01-AR, etc.
    table.string('pond_id', 16).references('id').inTable('ponds').onDelete('CASCADE')
    table.string('type', 30).notNullable() // AERATOR, FEEDER, MOLASSES_PUMP, SIPHON_VALVE
    table.string('name', 100).notNullable()
    table.string('status', 30).defaultTo('IDLE') // IDLE, RUNNING, ERROR, STANDBY
    table.integer('power_percent').defaultTo(0)
    table.float('dispensed_today_kg').defaultTo(0.0)
    table.float('target_daily_kg').defaultTo(0.0)
    table.string('next_schedule', 20).nullable()
    table.json('config').nullable()
    table.timestamps(true, true)
  })
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('actuators')
  await knex.schema.dropTableIfExists('ponds')
}
