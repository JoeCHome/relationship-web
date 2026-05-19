import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { GraphUser, Rating, RatingDimension } from '../types'

export interface RelationshipNodeData {
  user: GraphUser
  ratings: Rating[]
  ratingDimensions: RatingDimension[]
  visibleRatingDimensions: string[]
  isSelected: boolean
  isFocal: boolean
  dimmed: boolean
  eligible: boolean
  pickerMode: boolean
  [key: string]: unknown
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function avgRating(ratings: Rating[], userId: string, dimKey: string): number | null {
  const relevant = ratings.filter(r => r.rated_user_id === userId && r.dimension_key === dimKey)
  if (!relevant.length) return null
  return relevant.reduce((s, r) => s + r.score, 0) / relevant.length
}

function NodeContent({ data }: { data: RelationshipNodeData }) {
  const { user, ratings, ratingDimensions, visibleRatingDimensions, isSelected, isFocal, dimmed, eligible, pickerMode } = data

  const size = isFocal ? 64 : Math.min(48 + user.connection_count * 3, 72)
  const fontSize = isFocal ? 20 : Math.min(14 + user.connection_count, 20)

  const visibleDims = ratingDimensions.filter(d => visibleRatingDimensions.includes(d.key))

  return (
    <div
      style={{
        opacity: dimmed ? 0.28 : 1,
        transition: 'opacity 0.2s',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        position: 'relative',
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          border: `3px solid ${isSelected ? '#6366f1' : isFocal ? '#1d9e75' : '#e5e7eb'}`,
          boxShadow: isSelected ? '0 0 0 3px #c7d2fe' : 'none',
          background: '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {user.photo_url ? (
          <img src={user.photo_url} alt={user.display_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize, fontWeight: 600, color: '#6b7280' }}>{initials(user.display_name)}</span>
        )}
      </div>

      {/* Eligible checkmark badge for picker mode */}
      {pickerMode && eligible && (
        <div style={{
          position: 'absolute',
          top: -4,
          right: -4,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#1d9e75',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          color: '#fff',
        }}>✓</div>
      )}

      {/* Name */}
      <div style={{
        fontSize: 12,
        fontWeight: isFocal ? 700 : 500,
        color: '#111827',
        textAlign: 'center',
        maxWidth: 90,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        background: 'rgba(255,255,255,0.85)',
        borderRadius: 4,
        padding: '1px 4px',
      }}>
        {user.display_name}
      </div>

      {/* Rating scores */}
      {visibleDims.length > 0 && (
        <div style={{ display: 'flex', gap: 4 }}>
          {visibleDims.map(dim => {
            const avg = avgRating(ratings, user.id, dim.key)
            return (
              <div key={dim.key} style={{
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: 4,
                padding: '1px 5px',
                fontSize: 10,
                color: '#374151',
                whiteSpace: 'nowrap',
              }}>
                {dim.label}: {avg != null ? avg.toFixed(1) : '—'}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export const RelationshipNode = memo(function RelationshipNode({ data }: NodeProps) {
  const nodeData = data as RelationshipNodeData
  return (
    <>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <NodeContent data={nodeData} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </>
  )
})
