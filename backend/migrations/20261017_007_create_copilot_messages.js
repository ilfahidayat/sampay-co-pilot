/**
 * Migration 007: Create copilot_messages table
 * Stores interactive chat history, automated AI telemetry diagnostics,
 * daily briefing reports, and supervisor treatment adjustments.
 */
export async function up(knex) {
  const exists = await knex.schema.hasTable('copilot_messages')
  if (!exists) {
    await knex.schema.createTable('copilot_messages', (table) => {
      table.string('id', 64).primary() // msg-{timestamp}-{rand}
      table.string('pond_id', 16).references('id').inTable('ponds').onDelete('CASCADE')
      table.string('role', 20).notNullable().defaultTo('assistant') // 'assistant', 'user', 'system'
      table.string('sender_name', 50).notNullable().defaultTo('Co-Pilot')
      table.string('message_type', 40).notNullable().defaultTo('CHAT') // 'CHAT', 'TELEMETRY_DIAGNOSTIC', 'DAILY_BRIEFING', 'CRITICAL_ALERT', 'ACTION_ADJUSTMENT'
      table.text('text', 'longtext').notNullable()
      table.json('action_card').nullable()
      table.json('metadata').nullable()
      table.timestamp('created_at').defaultTo(knex.fn.now())

      table.index(['pond_id', 'created_at'])
      table.index(['pond_id', 'message_type'])
    })
  }
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('copilot_messages')
}
