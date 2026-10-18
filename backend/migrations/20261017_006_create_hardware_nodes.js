/**
 * Migration 006: Hardware Nodes Registry
 */
export async function up(knex) {
  const exists = await knex.schema.hasTable('hardware_nodes')
  if (!exists) {
    await knex.schema.createTable('hardware_nodes', (table) => {
      table.string('id', 64).primary() // e.g. 'sac/pond001'
      table.string('device_tag', 64).notNullable().unique() // e.g. 'ESP32-AQUA-01'
      table.string('name', 100).notNullable()
      table.string('chip_model', 80).defaultTo('ESP32-WROOM-32D Dual-Core 240MHz')
      table.string('firmware_version', 40).defaultTo('v2.4.1-SNI')
      table.string('mqtt_topic', 100).notNullable()
      table.string('mqtt_cmd_topic', 100).notNullable()
      table.string('default_pond_id', 16).nullable()
      table.string('status', 30).defaultTo('ONLINE') // ONLINE, STANDBY, MAINTENANCE
      table.string('mac_address', 40).nullable()
      table.string('ip_address', 40).nullable()
      table.timestamps(true, true)
    })
  }
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('hardware_nodes')
}
