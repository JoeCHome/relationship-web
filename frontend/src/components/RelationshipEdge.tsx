import { memo, useState } from 'react'
import type { EdgeProps } from '@xyflow/react'
import type { GraphEdgeType } from '../types'

export interface RelationshipEdgeData {
  primary_type: string
  types: GraphEdgeType[]
  dimmed?: boolean
  [key: string]: unknown
}

export const RelationshipEdge = memo(function RelationshipEdge({
  sourceX, sourceY, targetX, targetY, data,
}: EdgeProps) {
  const [hovered, setHovered] = useState(false)
  const edgeData = data as RelationshipEdgeData
  const types = edgeData?.types ?? []
  const dimmed = edgeData?.dimmed ?? false

  if (types.length === 0) return null

  const primary = types.find(t => t.key === edgeData?.primary_type) ?? types[0]
  const secondaries = types.filter(t => t.key !== primary.key)

  // Quadratic bezier control point (slight perpendicular offset for curve)
  const mx = (sourceX + targetX) / 2
  const my = (sourceY + targetY) / 2
  const dx = targetX - sourceX
  const dy = targetY - sourceY
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const cx = mx - (dy / len) * 20
  const cy = my + (dx / len) * 20

  const d = `M ${sourceX} ${sourceY} Q ${cx} ${cy} ${targetX} ${targetY}`

  // Tooltip anchored near the bezier midpoint (t=0.5 on quadratic bezier)
  const tipX = 0.25 * sourceX + 0.5 * cx + 0.25 * targetX
  const tipY = 0.25 * sourceY + 0.5 * cy + 0.25 * targetY

  return (
    <g
      style={{ opacity: dimmed ? 0.15 : 1, transition: 'opacity 0.2s' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Wide invisible hit area */}
      <path d={d} fill="none" stroke="transparent" strokeWidth={14} />

      {/* Primary type line */}
      <path
        d={d}
        fill="none"
        stroke={primary.color_hex}
        strokeWidth={2.5}
        strokeDasharray={primary.edge_style === 'dashed' ? '8 4' : undefined}
        strokeLinecap="round"
      />

      {/* Secondary-type indicator dots on the line when not hovered */}
      {!hovered && secondaries.length > 0 && (
        <circle
          cx={tipX}
          cy={tipY}
          r={4}
          fill="#fff"
          stroke={primary.color_hex}
          strokeWidth={1.5}
        />
      )}

      {/* Hover tooltip listing secondary types */}
      {hovered && secondaries.length > 0 && (
        <foreignObject
          x={tipX - 90}
          y={tipY - 12 - secondaries.length * 22}
          width={180}
          height={16 + secondaries.length * 22}
          style={{ pointerEvents: 'none', overflow: 'visible' }}
        >
          <div style={{
            background: '#1f2937',
            color: '#f9fafb',
            borderRadius: 6,
            padding: '6px 10px',
            fontSize: 12,
            lineHeight: '1.4',
            boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
            whiteSpace: 'nowrap',
          }}>
            {secondaries.map(t => (
              <div key={t.key} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: t.color_hex,
                  flexShrink: 0,
                }} />
                <span>{t.name}</span>
              </div>
            ))}
          </div>
        </foreignObject>
      )}
    </g>
  )
})
