/**
 * Migration 005: Add iot_config JSON column to ponds table
 */
export async function up(knex) {
  const hasCol = await knex.schema.hasColumn('ponds', 'iot_config')
  if (!hasCol) {
    await knex.schema.table('ponds', (table) => {
      table.json('iot_config').nullable()
    })
  }
}

export async function down(knex) {
  const hasCol = await knex.schema.hasColumn('ponds', 'iot_config')
  if (hasCol) {
    await knex.schema.table('ponds', (table) => {
      table.dropColumn('iot_config')
    })
  }
}
