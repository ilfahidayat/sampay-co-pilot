import { GoogleGenAI } from '@google/genai'
import { mockGeminiEngine } from './mockGeminiEngine.js'
import { BIOFLOC_AI_ROLE, BIOFLOC_KNOWLEDGE_BASE, GEMINI_BIOFLOC_TOOLS, REALTIME_EVALUATION_SCHEMA, DAILY_EXECUTION_SYNTHESIS_SCHEMA } from './bioflocKnowledgeBase.js'
import { saveEnvVariables } from '../../config/envStorage.js'

class GeminiClient {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || ''
    this.modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash'
    this.fallbackModelName = process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.8-flash'
    this.client = null
    this.knowledgeBase = BIOFLOC_KNOWLEDGE_BASE
    this.role = BIOFLOC_AI_ROLE
    this.tools = GEMINI_BIOFLOC_TOOLS

    if (this.isMockMode()) {
      console.log(`[Gemini AI] 🧪 Running in Local Mock Gemini Mode (${this.modelName}). Zero API credits consumed.`)
    } else if (this.apiKey && this.apiKey.trim().length > 0) {
      try {
        this.client = new GoogleGenAI({ apiKey: this.apiKey.trim() })
        console.log(`[Gemini AI] ✅ Initialized Google GenAI Client with model: ${this.modelName}`)
      } catch (err) {
        console.warn('[Gemini AI] Failed to initialize Google GenAI SDK:', err.message)
      }
    } else {
      console.log('[Gemini AI] Notice: Running in Local Mock Gemini Mode. Zero API credits consumed.')
    }
  }

  isMockMode() {
    return process.env.USE_MOCK_GEMINI === 'true' || !this.apiKey || this.apiKey.trim().length === 0
  }

  hasApiKey() {
    // In mock mode, we want the system to treat Gemini as active and operational
    return this.isMockMode() || Boolean(this.apiKey && this.apiKey.trim().length > 0)
  }

  getClient() {
    // Refresh client if key was added dynamically to .env or if client was not yet initialized
    const currentKey = process.env.GEMINI_API_KEY || ''
    if (currentKey && (!this.client || currentKey !== this.apiKey)) {
      this.apiKey = currentKey.trim()
      try {
        this.client = new GoogleGenAI({ apiKey: this.apiKey })
        console.log(`[Gemini AI] ✅ Google GenAI Client active with model: ${this.modelName}`)
      } catch (err) {
        console.warn('[Gemini AI] Failed to instantiate Google GenAI Client:', err.message)
      }
    }
    return this.client
  }

  updateConfig({ useMock, apiKey, modelName }) {
    const envUpdates = {}

    if (useMock !== undefined) {
      const mockStr = useMock ? 'true' : 'false'
      process.env.USE_MOCK_GEMINI = mockStr
      envUpdates.USE_MOCK_GEMINI = mockStr
    }

    if (apiKey !== undefined && apiKey.trim().length > 0) {
      this.apiKey = apiKey.trim()
      process.env.GEMINI_API_KEY = this.apiKey
      envUpdates.GEMINI_API_KEY = this.apiKey
    }

    if (modelName !== undefined && modelName.trim().length > 0) {
      this.modelName = modelName.trim()
      process.env.GEMINI_MODEL = this.modelName
      envUpdates.GEMINI_MODEL = this.modelName
    }

    // Persist changes to backend/.env on disk
    if (Object.keys(envUpdates).length > 0) {
      saveEnvVariables(envUpdates)
    }

    // Immediately instantiate live client if switched to live mode and apiKey is available
    if (!this.isMockMode() && this.apiKey) {
      try {
        this.client = new GoogleGenAI({ apiKey: this.apiKey })
        console.log(`[Gemini AI] ⚡ Live Google GenAI API Client Ready & Activated (Model: ${this.modelName})`)
      } catch (e) {
        console.warn('[Gemini AI] Failed to initialize Google GenAI with key:', e.message)
      }
    } else if (this.isMockMode()) {
      console.log(`[Gemini AI] 🧪 Switched to Local Mock Gemini Mode (Model: ${this.modelName})`)
    }

    console.log(`[Gemini AI] Configuration updated: Mock Mode = ${this.isMockMode()}, Model = ${this.modelName}`)
    return {
      mockMode: this.isMockMode(),
      model: this.modelName,
      hasApiKey: this.hasApiKey()
    }
  }

  async generateJsonContent({ systemInstruction = BIOFLOC_AI_ROLE, prompt, schema = null }) {
    // Direct routing to Local Mock Engine when USE_MOCK_GEMINI=true or key missing
    if (this.isMockMode()) {
      return mockGeminiEngine.evaluateTelemetry(prompt, systemInstruction)
    }

    const client = this.getClient()
    if (!client || !this.apiKey) {
      return mockGeminiEngine.evaluateTelemetry(prompt, systemInstruction)
    }

    try {
      const config = {
        systemInstruction,
        responseMimeType: 'application/json'
      }
      if (schema) {
        config.responseSchema = schema
      }

      const response = await client.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config
      })

      const text = response.text || ''
      try {
        return JSON.parse(text)
      } catch (parseErr) {
        const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim()
        return JSON.parse(cleaned)
      }
    } catch (apiError) {
      console.warn(`[Gemini AI] Primary model ${this.modelName} error: ${apiError.message}. Trying fallback ${this.fallbackModelName}...`)
      try {
        const fallbackConfig = {
          systemInstruction,
          responseMimeType: 'application/json'
        }
        if (schema) {
          fallbackConfig.responseSchema = schema
        }

        const fallbackResponse = await client.models.generateContent({
          model: this.fallbackModelName,
          contents: prompt,
          config: fallbackConfig
        })
        const text = fallbackResponse.text || ''
        const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim()
        return JSON.parse(cleaned)
      } catch (fallbackError) {
        console.warn(`[Gemini AI] Live API credit/quota exhausted (${fallbackError.message}). Seamlessly engaging Local Mock Gemini Engine.`)
        return mockGeminiEngine.evaluateTelemetry(prompt, systemInstruction)
      }
    }
  }

  async generateChatResponse({ systemInstruction, message, history = [], context = {}, executeTool = null }) {
    // Direct routing to Local Mock Engine when USE_MOCK_GEMINI=true or key missing
    if (this.isMockMode()) {
      return mockGeminiEngine.generateChatResponse(message, { ...context, systemInstruction })
    }

    const client = this.getClient()
    if (!client || !this.apiKey) {
      return mockGeminiEngine.generateChatResponse(message, { ...context, systemInstruction })
    }

    try {
      const config = {
        systemInstruction,
        tools: [{
          functionDeclarations: GEMINI_BIOFLOC_TOOLS.map(t => ({
            name: t.name,
            description: t.description,
            parameters: t.parameters
          }))
        }]
      }

      const response = await client.models.generateContent({
        model: this.modelName,
        contents: message,
        config
      })

      const functionCalls = response.functionCalls || []
      
      // If direct text answer without function calls
      if (functionCalls.length === 0) {
        return {
          reply: response.text || 'Instruksi telah diproses.',
          toolCall: null,
          toolResult: null,
          actionCard: null
        }
      }

      const primaryCall = functionCalls[0]
      let primaryResult = null
      const executedResults = []

      // If tool execution callback provided, execute tools and perform multi-turn completion
      if (executeTool && typeof executeTool === 'function') {
        for (const call of functionCalls) {
          try {
            console.log(`[Gemini AI] ⚙️ Executing function call: ${call.name}`, call.args)
            const result = await executeTool(call.name, call.args || {})
            executedResults.push({ call, result })
            if (!primaryResult) primaryResult = result
          } catch (toolExecErr) {
            console.warn(`[Gemini AI] Error executing tool ${call.name}:`, toolExecErr.message)
            executedResults.push({ call, result: { error: toolExecErr.message, status: 'FAILED' } })
          }
        }

        // Multi-Turn Loop: Feed function execution outputs back to Gemini so it synthesizes natural language diagnostic!
        try {
          const followUpContents = [
            { role: 'user', parts: [{ text: message }] },
            response.candidates[0].content,
            {
              role: 'user',
              parts: executedResults.map(item => ({
                functionResponse: {
                  name: item.call.name,
                  response: { output: item.result },
                  id: item.call.id
                }
              }))
            }
          ]

          const followUpResponse = await client.models.generateContent({
            model: this.modelName,
            contents: followUpContents,
            config: { systemInstruction }
          })

          const synthesizedText = followUpResponse.text
          if (synthesizedText && synthesizedText.trim().length > 0) {
            return {
              reply: synthesizedText.trim(),
              toolCall: primaryCall,
              toolResult: primaryResult,
              allCalls: executedResults,
              actionCard: null
            }
          }
        } catch (followUpErr) {
          console.warn(`[Gemini AI] Second-turn multi-turn synthesis error: ${followUpErr.message}`)
        }
      }

      // Safe fallback if multi-turn synthesis was bypassed or failed
      let fallbackText = ''
      if (primaryResult?.message) {
        fallbackText = primaryResult.message
      } else if (primaryCall.name === 'get_pond_telemetry' && primaryResult?.telemetry) {
        const t = primaryResult.telemetry
        fallbackText = `📊 **Telemetry Data for Pond ${primaryResult.pondId || 'K01'}:**\n• DO: **${t.do} mg/L**\n• pH: **${t.ph}**\n• Temp: **${t.temp}°C**\n• TAN: **${t.ammonia} ppm**\n• Floc: **${t.flocDensity} mL/L**`
      } else if (primaryCall.name === 'get_pond_diagnostic' && primaryResult) {
        fallbackText = `🔬 **Biofloc Diagnosis for Pond ${primaryResult.pondId || 'K01'}:**\n• Health Score: **${primaryResult.healthScore}/100** (${primaryResult.status})\n• ${primaryResult.summary}`
      } else {
        fallbackText = `Function **${primaryCall.name}** for pond **${primaryCall.args?.pondId || 'K01'}** was processed successfully.`
      }

      return {
        reply: fallbackText,
        toolCall: primaryCall,
        toolResult: primaryResult,
        actionCard: null
      }
    } catch (err) {
      console.warn(`[Gemini AI] Live chat API error (${err.message}). Seamlessly engaging Local Mock Gemini Engine.`)
      return mockGeminiEngine.generateChatResponse(message, { ...context, systemInstruction })
    }
  }
}

export const geminiClient = new GeminiClient()

