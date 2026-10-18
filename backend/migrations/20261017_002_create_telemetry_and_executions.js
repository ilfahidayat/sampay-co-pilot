/**
 * Migration 002: Telemetry Logs & Execution Logs
 */
export async function up(knex) {
  // 1. Telemetry Logs Table
  await knex.schema.createTable('telemetry_logs', (table) => {
    table.bigIncrements('id').primary()
    table.string('pond_id', 16).references('id').inTable('ponds').onDelete('CASCADE')
    table.string('device_id', 64).nullable()
    table.timestamp('timestamp').notNullable().defaultTo(knex.fn.now())
    table.float('dissolved_oxygen').notNullable() // mg/L
    table.float('ph').notNullable()
    table.float('temperature').notNullable() // °C
    table.float('ammonia').notNullable() // ppm TAN
    table.float('floc_density').defaultTo(15.0) // mL/L Imhoff
    table.float('orp').defaultTo(280.0) // mV
    table.float('tds').defaultTo(1100.0) // ppm
    table.float('battery_percent').defaultTo(95.0)
    table.string('simulation_condition', 20).defaultTo('ok') // ok, warning, danger
    table.json('raw_payload').nullable()
    table.timestamp('created_at').defaultTo(knex.fn.now())

    table.index(['pond_id', 'timestamp'])
  })

  // 2. Execution Logs Table (Daily Execution & Action Audit)
  await knex.schema.createTable('execution_logs', (table) => {
    table.string('id', 64).primary() // ACT-20261017-001
    table.string('pond_id', 16).references('id').inTable('ponds').onDelete('CASCADE')
    table.string('category', 30).notNullable() // FEEDING, AERATION, MOLASSES, SIPHON_FLUSH
    table.string('title', 150).notNullable()
    table.float('dosage_amount').nullable()
    table.string('dosage_unit', 20).nullable() // kg, g, ml, L, %
    table.integer('aerator_power_percent').nullable()
    table.integer('aerator_rpm').nullable()
    table.string('scheduled_time', 50).nullable()
    table.timestamp('executed_at').nullable()
    table.string('status', 30).defaultTo('SCHEDULED') // SCHEDULED, RUNNING, SUCCESS, FAILED
    table.string('actor', 100).defaultTo('AI Copilot Schedule')
    table.string('hardware_id', 100).nullable()
    table.text('notes').nullable()
    table.json('result_data').nullable()
    table.timestamps(true, true)

    table.index(['pond_id', 'status'])
    table.index(['created_at'])
  })
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('execution_logs')
  await knex.schema.dropTableIfExists('telemetry_logs')
}
