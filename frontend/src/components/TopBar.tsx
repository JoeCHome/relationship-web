import type { RatingDimension } from '../types'

interface Props {
  mode: 'explorer' | 'picker'
  onModeChange: (m: 'explorer' | 'picker') => void
  ratingDimensions: RatingDimension[]
  visibleRatingDimensions: string[]
  onToggleDimension: (key: string) => void
}

export function TopBar({ mode, onModeChange, ratingDimensions, visibleRatingDimensions, onToggleDimension }: Props) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '8px 16px',
      borderBottom: '1px solid #e5e7eb',
      background: '#fff',
      flexShrink: 0,
    }}>
      {/* Mode toggle */}
      <div style={{ display: 'flex', borderRadius: 6, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        {(['explorer', 'picker'] as const).map(m => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            style={{
              padding: '4px 14px',
              fontSize: 13,
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              background: mode === m ? '#6366f1' : '#fff',
              color: mode === m ? '#fff' : '#374151',
              textTransform: 'capitalize',
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Rating dimension toggles */}
      {ratingDimensions.map(dim => (
        <button
          key={dim.key}
          onClick={() => onToggleDimension(dim.key)}
          style={{
            padding: '3px 10px',
            fontSize: 12,
            borderRadius: 20,
            border: '1px solid #e5e7eb',
            cursor: 'pointer',
            background: visibleRatingDimensions.includes(dim.key) ? '#dbeafe' : '#f9fafb',
            color: visibleRatingDimensions.includes(dim.key) ? '#1d4ed8' : '#6b7280',
            fontWeight: 500,
          }}
        >
          {dim.label}
        </button>
      ))}
    </div>
  )
}
