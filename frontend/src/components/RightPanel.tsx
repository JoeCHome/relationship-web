import { useState } from 'react'
import type { GraphUser, GraphEdge, Rating, RatingDimension } from '../types'

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

interface Props {
  user: GraphUser | null
  currentUserId: string
  edge: GraphEdge | null
  ratings: Rating[]
  ratingDimensions: RatingDimension[]
  onRate: (dimensionKey: string, score: number) => Promise<void>
  onClose: () => void
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 20,
            color: s <= (hover || value) ? '#f59e0b' : '#d1d5db',
            padding: 0,
          }}
        >★</button>
      ))}
    </div>
  )
}

export function RightPanel({ user, currentUserId, edge, ratings, ratingDimensions, onRate, onClose }: Props) {
  const [ratingValues, setRatingValues] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({})

  if (!user) {
    return (
      <div style={{ width: 260, borderLeft: '1px solid #e5e7eb', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 13, color: '#9ca3af' }}>Select a person</span>
      </div>
    )
  }

  const userRatings = ratings.filter(r => r.rated_user_id === user.id)
  const myRatings = userRatings.filter(r => r.rater_user_id === currentUserId)
  const myRatingMap = new Map(myRatings.map(r => [r.dimension_key, r.score]))

  function avgByDim(key: string) {
    const relevant = userRatings.filter(r => r.dimension_key === key)
    if (!relevant.length) return null
    return relevant.reduce((s, r) => s + r.score, 0) / relevant.length
  }

  async function handleSubmitRating(dimKey: string) {
    const score = ratingValues[dimKey]
    if (!score) return
    setSubmitting(s => ({ ...s, [dimKey]: true }))
    try {
      await onRate(dimKey, score)
      setRatingValues(v => ({ ...v, [dimKey]: 0 }))
    } finally {
      setSubmitting(s => ({ ...s, [dimKey]: false }))
    }
  }

  return (
    <div style={{
      width: 260,
      borderLeft: '1px solid #e5e7eb',
      background: '#fafafa',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #e5e7eb' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Detail</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#9ca3af' }}>×</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: '#e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            fontWeight: 600,
            color: '#6b7280',
            overflow: 'hidden',
            flexShrink: 0,
          }}>
            {user.photo_url
              ? <img src={user.photo_url} alt={user.display_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initials(user.display_name)
            }
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{user.display_name}</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{user.connection_count} connection{user.connection_count !== 1 ? 's' : ''}</div>
          </div>
        </div>

        {/* Relationship type tags */}
        {edge && edge.types.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Relationship</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {edge.types.map(t => (
                <span key={t.key} style={{
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: t.color_hex + '22',
                  color: t.color_hex,
                  border: `1px solid ${t.color_hex}66`,
                  fontSize: 11,
                  fontWeight: 600,
                }}>
                  {t.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Ratings */}
        {ratingDimensions.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ratings</div>
            {ratingDimensions.map(dim => {
              const avg = avgByDim(dim.key)
              const myScore = myRatingMap.get(dim.key)
              return (
                <div key={dim.key} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{dim.label}</span>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>
                      {avg != null ? `avg ${avg.toFixed(1)}` : '—'}
                      {myScore != null ? ` · you: ${myScore.toFixed(1)}` : ''}
                    </span>
                  </div>
                  {user.id !== currentUserId && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <StarInput
                        value={ratingValues[dim.key] ?? 0}
                        onChange={v => setRatingValues(prev => ({ ...prev, [dim.key]: v }))}
                      />
                      {ratingValues[dim.key] > 0 && (
                        <button
                          onClick={() => handleSubmitRating(dim.key)}
                          disabled={submitting[dim.key]}
                          style={{
                            padding: '2px 8px',
                            fontSize: 11,
                            borderRadius: 4,
                            border: '1px solid #6366f1',
                            background: '#6366f1',
                            color: '#fff',
                            cursor: 'pointer',
                          }}
                        >
                          {submitting[dim.key] ? '…' : 'Save'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Notes */}
        {user.notes && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes</div>
            <p style={{ fontSize: 13, color: '#374151', margin: 0, whiteSpace: 'pre-wrap' }}>{user.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
