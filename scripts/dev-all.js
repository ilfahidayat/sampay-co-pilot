import { spawn, execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const services = [
  {
    name: 'BACKEND',
    dir: path.resolve(rootDir, 'backend'),
    cmd: 'npm',
    args: ['run', 'dev'],
    color: '\x1b[34m' // Blue
  },
  {
    name: 'FRONTEND',
    dir: path.resolve(rootDir, 'frontend'),
    cmd: 'npm',
    args: ['run', 'dev'],
    color: '\x1b[32m' // Green
  },
  {
    name: 'SIMULATOR',
    dir: path.resolve(rootDir, 'simulator'),
    cmd: 'npm',
    args: ['run', 'dev'],
    color: '\x1b[35m' // Magenta
  }
]

const resetColor = '\x1b[0m'
const bold = '\x1b[1m'

console.log(`${bold}====================================================${resetColor}`)
console.log(`${bold}🚀 Launching All 3 SAC Platform Services Simultaneously${resetColor}`)
console.log(`  🔹 [BACKEND]   : http://localhost:5050 (API & MQTT Broker Link)`)
console.log(`  🔹 [FRONTEND]  : http://localhost:5175 (Pond Overview & Dashboard)`)
console.log(`  🔹 [SIMULATOR] : http://localhost:5177 (ESP32 Multi-Node IoT Simulator)`)
console.log(`${bold}====================================================${resetColor}\n`)

// Auto-reset database to clean state on development start to prevent accumulated duplicate rows
try {
  console.log(`🧹 [DATABASE] Resetting database to clean initial state (Knex seed)...`)
  execSync('npm --prefix backend run seed', { stdio: 'inherit', cwd: rootDir })
  console.log(`✅ [DATABASE] Clean initial state verified.\n`)
} catch (err) {
  console.warn(`⚠️ [DATABASE] Auto-seed warning: ${err.message}`)
}

const children = []

services.forEach(svc => {
  const child = spawn(svc.cmd, svc.args, {
    cwd: svc.dir,
    shell: true,
    stdio: 'pipe',
    env: { ...process.env, FORCE_COLOR: '1' }
  })

  children.push(child)

  const prefix = `${svc.color}${bold}[${svc.name}]${resetColor} `

  child.stdout.on('data', data => {
    const lines = data.toString().split('\n')
    lines.forEach(line => {
      if (line.trim().length > 0) {
        console.log(`${prefix}${line}`)
      }
    })
  })

  child.stderr.on('data', data => {
    const lines = data.toString().split('\n')
    lines.forEach(line => {
      if (line.trim().length > 0) {
        console.error(`${prefix}${line}`)
      }
    })
  })

  child.on('close', code => {
    if (code !== 0 && code !== null) {
      console.log(`${prefix}Process exited with code ${code}`)
    }
  })
})

function cleanup() {
  console.log(`\n${bold}🛑 Stopping all SAC platform services...${resetColor}`)
  children.forEach(child => {
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', child.pid, '/f', '/t'])
      } else {
        try {
          spawn('pkill', ['-P', String(child.pid)])
        } catch {}
        child.kill('SIGINT')
        child.kill('SIGTERM')
      }
    } catch {}
  })

  // Ensure ports are completely cleared on Unix
  if (process.platform !== 'win32') {
    setTimeout(() => {
      try {
        spawn('sh', ['-c', 'lsof -ti :5050 -ti :5175 -ti :5177 | xargs kill -9 2>/dev/null'])
      } catch {}
      process.exit(0)
    }, 500)
  } else {
    setTimeout(() => process.exit(0), 500)
  }
}

process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)
process.on('exit', cleanup)
