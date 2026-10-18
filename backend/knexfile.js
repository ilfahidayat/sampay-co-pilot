import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '.env') })

// Ensure local data directory exists if SQLite is selected
const dataDir = path.resolve(__dirname, 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbClient = process.env.DB_CLIENT || 'mysql2'
const dbFilename = process.env.DB_FILENAME || './data/sac_biofloc.sqlite3'
const resolvedDbPath = path.isAbsolute(dbFilename) ? dbFilename : path.resolve(__dirname, dbFilename)

const getConnectionConfig = () => {
  if (dbClient === 'better-sqlite3' || dbClient === 'sqlite3') {
    return {
      filename: resolvedDbPath
    }
  }

  // Default to MySQL
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'sac_biofloc',
    charset: 'utf8mb4',
    dateStrings: true
  }
}

export default {
  development: {
    client: dbClient,
    connection: getConnectionConfig(),
    useNullAsDefault: true,
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: path.resolve(__dirname, 'migrations'),
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: path.resolve(__dirname, 'seeds')
    }
  },
  production: {
    client: dbClient,
    connection: getConnectionConfig(),
    useNullAsDefault: true,
    pool: {
      min: 2,
      max: 20
    },
    migrations: {
      directory: path.resolve(__dirname, 'migrations'),
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: path.resolve(__dirname, 'seeds')
    }
  }
}
