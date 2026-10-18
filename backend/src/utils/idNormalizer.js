/**
 * Utility to normalize Pond IDs across various MQTT topic formats and device IDs
 * Examples:
 * 'pond001' -> 'K01'
 * 'POND002' -> 'K02'
 * 'k01' -> 'K01'
 * 'sac/pond001' -> 'K01'
 * 'ESP32-K01-FD' -> 'K01'
 */
export function normalizePondId(rawId) {
  if (!rawId) return 'K01'
  const str = String(rawId).trim().toUpperCase()

  // If already in K01..K09 format
  if (/^K0[1-9]$/.test(str)) {
    return str
  }

  // Match sac/pond001 or pond001 or pond1
  const pondMatch = str.match(/POND[0]*([1-9][0-9]*)/i)
  if (pondMatch) {
    const num = parseInt(pondMatch[1], 10)
    return `K${String(num).padStart(2, '0')}`
  }

  // Match any occurrence of K01..K99
  const kMatch = str.match(/K0[1-9]/i)
  if (kMatch) {
    return kMatch[0].toUpperCase()
  }

  return str
}
