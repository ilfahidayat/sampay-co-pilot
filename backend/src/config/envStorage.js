import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envFilePath = path.resolve(__dirname, '../../.env')

/**
 * Returns the resolved path to backend/.env file
 */
export function getEnvFilePath() {
  return envFilePath
}

/**
 * Persists an object of key-value pairs into backend/.env file
 * and updates current process.env in-memory.
 * @param {Record<string, string|number|boolean>} updates 
 */
export function saveEnvVariables(updates = {}) {
  try {
    if (!fs.existsSync(envFilePath)) {
      console.warn(`[Config Storage] .env file not found at: ${envFilePath}`)
      return { success: false, error: 'File .env not found' }
    }

    let envContent = fs.readFileSync(envFilePath, 'utf8')

    for (const [key, rawVal] of Object.entries(updates)) {
      if (rawVal === undefined || rawVal === null) continue
      const val = String(rawVal)
      process.env[key] = val

      const keyRegex = new RegExp(`^${key}=.*$`, 'm')
      if (keyRegex.test(envContent)) {
        envContent = envContent.replace(keyRegex, `${key}=${val}`)
      } else {
        envContent = `${envContent.trimEnd()}\n${key}=${val}\n`
      }
    }

    fs.writeFileSync(envFilePath, envContent, 'utf8')
    console.log(`[Config Storage] 💾 Successfully persisted [${Object.keys(updates).join(', ')}] to ${envFilePath}`)
    return { success: true, savedKeys: Object.keys(updates), path: envFilePath }
  } catch (err) {
    console.error('[Config Storage] ❌ Failed to write .env file:', err.message)
    return { success: false, error: err.message }
  }
}
