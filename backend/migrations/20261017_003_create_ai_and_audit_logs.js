/**
 * Migration 003: AI Analyses, AI Recommendations & Audit Logs
 */
export async function up(knex) {
  // 1. AI Realtime & Diagnosis Analyses (Gemini API results)
  await knex.schema.createTable('ai_analyses', (table) => {
    table.string('id', 64).primary() // AI-EVAL-20261017-001
    table.string('pond_id', 16).references('id').inTable('ponds').onDelete('CASCADE')
    table.string('trigger_type', 40).notNullable() // REALTIME_TELEMETRY, DAILY_0700_BRIEFING, MANUAL_PROMPT
    table.integer('health_score').defaultTo(95)
    table.string('health_status', 30).defaultTo('OPTIMAL') // OPTIMAL, WARNING, CRITICAL
    table.text('summary').notNullable()
    table.json('telemetry_snapshot').nullable()
    table.json('anomalies_detected').nullable()
    table.json('recommendation_payload').nullable()
    table.string('model_used', 50).defaultTo('gemini-2.5-flash')
    table.integer('prompt_tokens').defaultTo(0)
    table.integer('candidate_tokens').defaultTo(0)
    table.timestamp('created_at').defaultTo(knex.fn.now())

    table.index(['pond_id', 'created_at'])
  })

  // 2. AI Morning Recommendations (07:00 AM HITL Action Cards)
  await knex.schema.createTable('ai_recommendations', (table) => {
    table.string('id', 64).primary() // REC-K01-20261017
    table.string('pond_id', 16).references('id').inTable('ponds').onDelete('CASCADE')
    table.string('plan_date', 12).notNullable() // YYYY-MM-DD
    table.string('status', 20).defaultTo('PENDING') // PENDING, APPROVED, REJECTED
    table.text('summary').nullable()
    table.json('treatments').notNullable() // Array of proposed daily actions
    table.string('approved_by', 100).nullable()
    table.timestamp('approved_at').nullable()
    table.timestamps(true, true)

    table.unique(['pond_id', 'plan_date'])
    table.index(['pond_id', 'status'])
  })

  // 3. System Audit Logs
  await knex.schema.createTable('audit_logs', (table) => {
    table.bigIncrements('id').primary()
    table.string('pond_id', 16).nullable()
    table.string('event_type', 50).notNullable() // COMMAND_DISPATCHED, AI_APPROVAL, THRESHOLD_ALERT
    table.text('message').notNullable()
    table.json('metadata').nullable()
    table.string('ip_address', 50).nullable()
    table.timestamp('created_at').defaultTo(knex.fn.now())

    table.index(['pond_id', 'event_type'])
  })
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('audit_logs')
  await knex.schema.dropTableIfExists('ai_recommendations')
  await knex.schema.dropTableIfExists('ai_analyses')
}
