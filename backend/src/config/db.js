import knex from 'knex'
import knexConfig from '../../knexfile.js'

const environment = process.env.NODE_ENV || 'development'
const config = knexConfig[environment] || knexConfig.development

export const db = knex(config)

export const checkDatabaseConnection = async () => {
  try {
    await db.raw('SELECT 1+1 AS result')
    const dbName = config.connection.database || config.connection.filename
    console.log(`[Database] Connected successfully to ${dbName} via ${config.client}`)
    return true
  } catch (error) {
    console.error('[Database] Connection failed:', error.message)
    return false
  }
}

export default db
