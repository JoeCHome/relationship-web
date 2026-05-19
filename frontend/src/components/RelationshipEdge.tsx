import { memo } from 'react'
import type { EdgeProps } from '@xyflow/react'
import type { GraphEdgeType } from '../types'

export interface RelationshipEdgeData {
  types: GraphEdgeType[]
  dimmed?: boolean
  [key: string]: unknown
}

export const RelationshipEdge = memo(function RelationshipEdge({
  sourceX, sourceY, targetX, targetY, data,
}: EdgeProps) {
  const edgeData = data as RelationshipEdgeData
  const types = edgeData?.types ?? []
  const dimmed = edgeData?.dimmed ?? false

  const dx = targetX - sourceX
  const dy = targetY - sourceY
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  // Perpendicular unit vector for offset
  const px = -dy / len
  const py = dx / len

  const spacing = 5
  const count = types.length || 1

  if (count === 0) return null

  return (
    <g style={{ opacity: dimmed ? 0.15 : 1, transition: 'opacity 0.2s' }}>
      {(types.length > 0 ? types : [{ key: 'default', color_hex: '#9ca3af', edge_style: 'solid' as const, name: '' }]).map((type, i) => {
        const offset = (i - (count - 1) / 2) * spacing
        const sx = sourceX + px * offset
        const sy = sourceY + py * offset
        const tx = targetX + px * offset
        const ty = targetY + py * offset

        // Slight curve via quadratic bezier
        const mx = (sx + tx) / 2 + py * 20
        const my = (sy + ty) / 2 - px * 20

        const d = `M ${sx} ${sy} Q ${mx} ${my} ${tx} ${ty}`

        return (
          <path
            key={type.key}
            d={d}
            fill="none"
            stroke={type.color_hex}
            strokeWidth={2}
            strokeDasharray={type.edge_style === 'dashed' ? '8 4' : undefined}
            strokeLinecap="round"
          />
        )
      })}
    </g>
  )
})
