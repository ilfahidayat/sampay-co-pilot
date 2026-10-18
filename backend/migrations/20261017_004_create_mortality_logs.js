/**
 * Migration 004: Fish Mortality Logs & Cumulative Mortality on Ponds
 */
export async function up(knex) {
  // 1. Add cumulative_mortality_count to ponds table if not exists
  const hasCol = await knex.schema.hasColumn('ponds', 'cumulative_mortality_count')
  if (!hasCol) {
    await knex.schema.table('ponds', (table) => {
      table.integer('cumulative_mortality_count').defaultTo(0)
    })
  }

  // 2. Create mortality_logs table
  const hasTable = await knex.schema.hasTable('mortality_logs')
  if (!hasTable) {
    await knex.schema.createTable('mortality_logs', (table) => {
      table.string('id', 64).primary() // e.g. MORT-K01-1729188000000
      table.string('pond_id', 16).references('id').inTable('ponds').onDelete('CASCADE')
      table.integer('count').notNullable() // Number of dead fish
      table.float('avg_weight_grams').notNullable() // Average body weight at death
      table.float('biomass_lost_kg').notNullable() // (count * avg_weight_grams) / 1000
      table.string('cause', 150).notNullable() // Symptom / cause
      table.string('disposal_method', 150).notNullable() // SNI biosecurity disposal
      table.string('actor', 100).defaultTo('Ilfa Hidayat (Supervisor)')
      table.text('notes').nullable()
      table.timestamp('recorded_at').defaultTo(knex.fn.now())
      table.timestamps(true, true)

      table.index(['pond_id', 'recorded_at'])
    })
  }
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('mortality_logs')
  const hasCol = await knex.schema.hasColumn('ponds', 'cumulative_mortality_count')
  if (hasCol) {
    await knex.schema.table('ponds', (table) => {
      table.dropColumn('cumulative_mortality_count')
    })
  }
}
