<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    default: ''
  },
  decimals: {
    type: Number,
    default: 2
  },
  min: {
    type: Number,
    default: 0
  },
  max: {
    type: Number,
    default: 100
  },
  targetMin: {
    type: Number,
    default: null
  },
  targetMax: {
    type: Number,
    default: null
  },
  targetLabel: {
    type: String,
    default: ''
  },
  zones: {
    type: Array,
    default: () => []
    // Array of { min, max, color, label, shortLabel }
  },
  statusBadge: {
    type: Object,
    default: () => ({ label: 'OPTIMAL', class: 'badge-emerald' })
  },
  iconWrapClass: {
    type: String,
    default: 'emerald'
  },
  insightText: {
    type: String,
    default: ''
  },
  extraStats: {
    type: Array,
    default: () => []
  }
})

// Unique identifier for SVG defs/paths collision safety
const cardId = computed(() => {
  return props.title.toLowerCase().replace(/[^a-z0-9]/g, '-')
})

// Geometry Constants for Annular Speedometer Semi-Circle
const cx = 120
const cy = 108
const rOuter = 76
const rInner = 42
const rLabel = 87
const needleLength = 72

// Compute Annular Wedge Sectors & Concentric Text Paths
const sectorPaths = computed(() => {
  const minVal = props.min
  const maxVal = props.max
  const range = maxVal - minVal
  if (range <= 0 || !props.zones || props.zones.length === 0) return []

  return props.zones.map((zone, idx) => {
    const f0 = Math.max(0, Math.min(1, (zone.min - minVal) / range))
    const f1 = Math.max(0, Math.min(1, (zone.max - minVal) / range))
    if (f1 <= f0) return null

    // Angle in radians: f=0 is left (PI), f=1 is right (0)
    const angle0 = Math.PI * f0
    const angle1 = Math.PI * f1

    // Coordinates for outer arc
    const x0Out = (cx - rOuter * Math.cos(angle0)).toFixed(2)
    const y0Out = (cy - rOuter * Math.sin(angle0)).toFixed(2)
    const x1Out = (cx - rOuter * Math.cos(angle1)).toFixed(2)
    const y1Out = (cy - rOuter * Math.sin(angle1)).toFixed(2)

    // Coordinates for inner arc
    const x0In = (cx - rInner * Math.cos(angle0)).toFixed(2)
    const y0In = (cy - rInner * Math.sin(angle0)).toFixed(2)
    const x1In = (cx - rInner * Math.cos(angle1)).toFixed(2)
    const y1In = (cy - rInner * Math.sin(angle1)).toFixed(2)

    // IN A 180° SEMI-CIRCLE, EVERY SEGMENT IS <= 180°, SO largeArc IS ALWAYS 0!
    const largeArc = 0

    // Annular sector path: outer arc clockwise, line in, inner arc counter-clockwise, close
    const pathD = `M ${x0Out} ${y0Out} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x1Out} ${y1Out} L ${x1In} ${y1In} A ${rInner} ${rInner} 0 ${largeArc} 0 ${x0In} ${y0In} Z`

    // Label path for textPath (along radius rLabel)
    const x0Lbl = (cx - rLabel * Math.cos(angle0)).toFixed(2)
    const y0Lbl = (cy - rLabel * Math.sin(angle0)).toFixed(2)
    const x1Lbl = (cx - rLabel * Math.cos(angle1)).toFixed(2)
    const y1Lbl = (cy - rLabel * Math.sin(angle1)).toFixed(2)
    const labelPathD = `M ${x0Lbl} ${y0Lbl} A ${rLabel} ${rLabel} 0 ${largeArc} 1 ${x1Lbl} ${y1Lbl}`

    // Extract shortLabel or fallback cleanly
    let label = zone.shortLabel
    if (!label && zone.label) {
      label = zone.label.split(/[\s(]/)[0].toUpperCase()
    }

    // Dynamic font size depending on text length and sector arc length
    const arcLength = rLabel * Math.PI * (f1 - f0)
    const textLen = (label || '').length || 1
    const fontSize = Math.min(6.5, Math.max(5.0, (arcLength / textLen) * 1.15)).toFixed(1)

    return {
      pathD,
      labelPathD,
      color: zone.color,
      label: label || '',
      fullLabel: zone.label || '',
      fontSize,
      min: zone.min,
      max: zone.max,
      idx
    }
  }).filter(Boolean)
})

// Needle rotation angle (-90deg at min, 0deg at mid, +90deg at max)
const needleAngle = computed(() => {
  const fraction = Math.max(0, Math.min(1, (props.value - props.min) / (props.max - props.min)))
  return -90 + (fraction * 180)
})

// Active zone color matching the current reading
const currentZoneColor = computed(() => {
  const val = props.value
  const found = props.zones.find(z => val >= z.min && val <= z.max)
  return found ? found.color : '#16a34a'
})
</script>

<template>
  <article class="water-gauge-card glass-panel">
    <!-- Card Header -->
    <div class="card-head">
      <div class="title-with-icon">
        <div class="icon-wrap" :class="iconWrapClass">
          <slot name="icon" />
        </div>
        <span class="metric-label font-display">{{ title }}</span>
      </div>
      <span class="badge" :class="statusBadge.class">
        {{ statusBadge.label }}
      </span>
    </div>

    <!-- Gauge Chart Graphic -->
    <div class="gauge-chart-wrapper">
      <svg viewBox="0 0 240 130" class="gauge-svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <!-- Individual Arc Paths for Curved Text -->
          <path 
            v-for="sector in sectorPaths" 
            :key="'path-def-' + cardId + '-' + sector.idx"
            :id="'label-arc-' + cardId + '-' + sector.idx" 
            :d="sector.labelPathD" 
            fill="none" 
          />
        </defs>

        <!-- Annular Colored Wedge Sectors with Crisp White Gaps -->
        <g class="gauge-sectors-group">
          <path 
            v-for="sector in sectorPaths" 
            :key="'sector-' + cardId + '-' + sector.idx"
            :d="sector.pathD" 
            :fill="sector.color" 
            stroke="#ffffff" 
            stroke-width="2.5" 
            stroke-linejoin="round"
            class="gauge-wedge"
            :title="`${sector.label}: ${sector.min} - ${sector.max} ${unit}`"
          />
        </g>

        <!-- Curved Sector Labels on Outer Perimeter -->
        <g class="gauge-labels-group">
          <text 
            v-for="sector in sectorPaths" 
            :key="'label-' + cardId + '-' + sector.idx"
            :font-size="sector.fontSize" 
            font-weight="800" 
            fill="#0f172a" 
            letter-spacing="0.02em"
            class="gauge-arc-label font-display"
          >
            <textPath 
              :href="'#label-arc-' + cardId + '-' + sector.idx" 
              :xlink:href="'#label-arc-' + cardId + '-' + sector.idx"
              startOffset="50%" 
              text-anchor="middle"
            >
              {{ sector.label }}
            </textPath>
          </text>
        </g>

        <!-- White Semi-Circle Base Notch Cutout -->
        <path 
          :d="`M ${cx - 16} ${cy} A 16 16 0 0 1 ${cx + 16} ${cy} Z`" 
          fill="#ffffff" 
          stroke="#e2e8f0" 
          stroke-width="1.2" 
        />

        <!-- Needle / Indicator Hand -->
        <g 
          class="gauge-needle-group" 
          :style="{ transform: `rotate(${needleAngle}deg)`, transformOrigin: `${cx}px ${cy}px` }"
        >
          <!-- Needle Body (Tapered Black) -->
          <polygon 
            :points="`${cx - 3.5},${cy} ${cx + 3.5},${cy} ${cx + 0.6},${cy - needleLength} ${cx - 0.6},${cy - needleLength}`" 
            fill="#1e293b" 
          />
          <!-- Sharp Tip -->
          <polygon 
            :points="`${cx - 1},${cy - needleLength} ${cx + 1},${cy - needleLength} ${cx},${cy - needleLength - 3}`" 
            fill="#1e293b" 
          />
          <!-- Center Highlight Spine -->
          <line 
            :x1="cx" 
            :y1="cy - 6" 
            :x2="cx" 
            :y2="cy - needleLength + 2" 
            stroke="rgba(255, 255, 255, 0.3)" 
            stroke-width="0.8" 
          />
        </g>

        <!-- Center Pivot Hub (Black with White Center Hole) -->
        <circle :cx="cx" :cy="cy" r="8" fill="#1e293b" stroke="#ffffff" stroke-width="1" />
        <circle :cx="cx" :cy="cy" r="3" fill="#ffffff" />

        <!-- Min & Max Scale Numbers at Arc Feet -->
        <text 
          :x="cx - rOuter" 
          :y="cy + 13" 
          font-size="8" 
          fill="#64748b" 
          font-family="'JetBrains Mono', Consolas, monospace" 
          font-weight="700" 
          text-anchor="middle"
        >
          {{ min }}
        </text>
        <text 
          :x="cx + rOuter" 
          :y="cy + 13" 
          font-size="8" 
          fill="#64748b" 
          font-family="'JetBrains Mono', Consolas, monospace" 
          font-weight="700" 
          text-anchor="middle"
        >
          {{ max }}
        </text>
      </svg>

      <!-- Digital Value & Target Info in Center Below Arc -->
      <div class="gauge-center-reading">
        <div class="value-display">
          <span class="digital-number font-mono">{{ Number(value).toFixed(decimals) }}</span>
          <span class="digital-unit font-mono">{{ unit }}</span>
        </div>
        <div v-if="targetLabel" class="target-band-pill font-mono">
          <span class="target-indicator-dot" :style="{ backgroundColor: currentZoneColor }"></span>
          <span>{{ targetLabel }}</span>
        </div>
      </div>
    </div>

    <!-- Extra Hardware Stats (e.g. Biofloc OD600 & TSS) -->
    <div v-if="extraStats && extraStats.length > 0" class="sensor-hardware-strip font-mono">
      <span v-for="(stat, idx) in extraStats" :key="idx">
        <strong>{{ stat.label }}:</strong> {{ stat.value }}
      </span>
    </div>

    <!-- Biofloc Diagnostic Insight Footer -->
    <div v-if="insightText" class="card-footer-info font-mono">
      <span class="insight-pill">
        <i class="bi bi-info-circle me-1"></i>{{ insightText }}
      </span>
    </div>
  </article>
</template>

<style scoped>
.water-gauge-card {
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-subtle, #e2e8f0);
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  min-height: 250px;
  position: relative;
  overflow: hidden;
}

.water-gauge-card:hover {
  transform: translateY(-2px);
  border-color: var(--border-medium, #cbd5e1);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.06), 0 4px 6px -4px rgba(0, 0, 0, 0.04);
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
}

.title-with-icon {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.icon-wrap {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-wrap.sky { background: #f0f9ff; color: #0284c7; }
.icon-wrap.emerald { background: #ecfdf5; color: #059669; }
.icon-wrap.amber { background: #fffbeb; color: #d97706; }
.icon-wrap.rose { background: #fff1f2; color: #e11d48; }
.icon-wrap.purple { background: #faf5ff; color: #9333ea; }

.metric-label {
  font-size: 0.73rem;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.badge {
  font-size: 0.58rem;
  font-weight: 800;
  padding: 2.5px 6.5px;
  border-radius: 999px;
  letter-spacing: 0.02em;
  white-space: nowrap;
  flex-shrink: 0;
}

.badge-emerald { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
.badge-amber { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
.badge-rose { background: #fff1f2; color: #991b1b; border: 1px solid #fecdd3; }
.badge-sky { background: #f0f9ff; color: #0369a1; border: 1px solid #bae6fd; }
.badge-slate { background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; }

/* Gauge SVG Styling */
.gauge-chart-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  margin: -2px 0 0 0;
}

.gauge-svg {
  width: 100%;
  max-width: 220px;
  height: auto;
  overflow: visible;
}

.gauge-wedge {
  transition: opacity 0.2s ease, filter 0.2s ease;
  cursor: default;
}

.gauge-wedge:hover {
  filter: brightness(1.08);
}

.gauge-arc-label {
  font-family: var(--font-display, 'Outfit', -apple-system, sans-serif);
  font-weight: 800;
  user-select: none;
  pointer-events: none;
}

.gauge-needle-group {
  transition: transform 0.65s cubic-bezier(0.34, 1.56, 0.64, 1);
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.28));
}

/* Digital Reading & Target Pill */
.gauge-center-reading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  margin-top: -2px;
}

.value-display {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
}

.digital-number {
  font-size: 1.85rem;
  font-weight: 800;
  color: var(--text-primary, #0f172a);
  line-height: 1;
  letter-spacing: -0.03em;
}

.digital-unit {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-muted, #64748b);
}

.target-band-pill {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--text-secondary, #475569);
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 1.5px 8px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.target-indicator-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
}

/* Sensor Hardware Strip */
.sensor-hardware-strip {
  display: flex;
  justify-content: space-between;
  font-size: 0.64rem;
  color: var(--text-secondary, #334155);
  background: var(--bg-surface-subtle, #f8fafc);
  border: 1px solid var(--border-subtle, #e2e8f0);
  padding: 4px 8px;
  border-radius: 6px;
  margin-top: -2px;
}

/* Diagnostic Insight Footer */
.card-footer-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.64rem;
  color: var(--text-muted, #64748b);
  border-top: 1px solid var(--border-subtle, #f1f5f9);
  padding-top: 6px;
  line-height: 1.35;
}

.insight-pill {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  line-height: 1.3;
}
</style>
