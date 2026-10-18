import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import { checkDatabaseConnection } from './config/db.js'
import { mqttClient } from './infrastructure/mqtt/mqttClient.js'
import { telemetryService } from './services/telemetryService.js'
import { executionService } from './services/executionService.js'
import { schedulerService } from './services/schedulerService.js'

// Import Routes
import pondRoutes from './presentation/routes/pondRoutes.js'
import telemetryRoutes from './presentation/routes/telemetryRoutes.js'
import executionRoutes from './presentation/routes/executionRoutes.js'
import aiRoutes from './presentation/routes/aiRoutes.js'
import systemRoutes from './presentation/routes/systemRoutes.js'
import hardwareRoutes from './presentation/routes/hardwareRoutes.js'

const app = express()
const PORT = process.env.PORT || 5000

// 1. Middlewares & Enterprise CORS Configuration
const rawOrigins = process.env.CORS_ORIGIN || 'https://sac-dev.sampay.id,http://localhost:5175,http://localhost:5177,http://localhost:5050'
const allowedOrigins = rawOrigins.split(',').map(s => s.trim().toLowerCase())

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (mobile apps, curl, server-side fetch, postman, same-origin)
    if (!origin) return callback(null, true)

    const lower = origin.toLowerCase()
    const isAllowed = 
      allowedOrigins.includes('*') ||
      allowedOrigins.includes(lower) ||
      lower.endsWith('.sampay.id') ||
      lower === 'https://sac-dev.sampay.id' ||
      lower.includes('localhost') ||
      lower.includes('127.0.0.1')

    if (isAllowed) {
      return callback(null, true)
    }

    // Permissive fallback so legitimate developer/tunnel requests are never blocked
    return callback(null, true)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ]
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Request Logging Middleware
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    if (!req.path.startsWith('/api/system/health')) {
      console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`)
    }
  })
  next()
})

// 2. Register API Routes
app.use('/api/ponds', pondRoutes)
app.use('/api/telemetry', telemetryRoutes)
app.use('/api/executions', executionRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/system', systemRoutes)
app.use('/api/hardware', hardwareRoutes)

// API Root info
app.get('/api', (req, res) => {
  res.json({
    name: 'SAC Backend Service (Sampay Aquaculture Co-Pilot)',
    version: '1.0.0',
    status: 'ONLINE',
    rootApi: process.env.API_ROOT_URL || 'https://sac-dev.sampay.id',
    docs: '/api/system/health',
    endpoints: {
      health: '/api/system/health',
      config: '/api/system/config',
      ponds: '/api/ponds',
      telemetry: '/api/telemetry',
      executions: '/api/executions',
      ai: '/api/ai',
      hardware: '/api/hardware'
    }
  })
})

// Root fallback
app.get('/', (req, res) => {
  res.json({
    name: 'SAC Backend Service (Sampay Aquaculture Co-Pilot)',
    version: '1.0.0',
    status: 'ONLINE',
    rootApi: process.env.API_ROOT_URL || 'https://sac-dev.sampay.id',
    docs: '/api/system/health'
  })
})

// 3. Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Error]', err.stack || err.message)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  })
})

// 4. Bootstrap Server, Database, MQTT & Scheduler
async function startServer() {
  console.log('====================================================')
  console.log('🚀 Starting Sampay Aquaculture Co-Pilot (SAC) Backend')
  console.log('====================================================')

  // Verify Database
  const dbConnected = await checkDatabaseConnection()
  if (!dbConnected) {
    console.error('⚠️ Database connection failed. Please check sqlite3 setup.')
  }

  // Connect MQTT Client
  mqttClient.connect()

  // Wire MQTT Telemetry Ingestion -> Telemetry Service
  mqttClient.onTelemetry((pondId, payload) => {
    telemetryService.processIncomingTelemetry(pondId, payload)
  })

  // Wire MQTT Actuator Events -> Execution Service
  mqttClient.onEvent((pondId, payload) => {
    executionService.handleIncomingActuatorEvent(pondId, payload)
  })

  // Start Cron Scheduler (07:00 AM Daily Briefing)
  schedulerService.start()

  // Listen HTTP Server
  app.listen(PORT, () => {
    console.log(`[HTTP Server] Listening on http://localhost:${PORT}`)
    console.log(`[API Base] Endpoints ready at http://localhost:${PORT}/api/ponds`)
    console.log('====================================================')
  })
}

startServer().catch(err => {
  console.error('Fatal bootstrap error:', err)
  process.exit(1)
})
