import { useState } from 'react'
import { RelationshipMap } from './RelationshipMap'
import {
  SEED_DATA,
  SEED_USERS,
  SEED_RATING_DIMENSIONS,
  SEED_CURRENT_USER_ID,
} from './dev/seedData'
import type { User } from './types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/relmap'

type DataSource = 'mock' | 'api'

export default function DevApp() {
  const [source, setSource] = useState<DataSource>('mock')
  const [focalUserId, setFocalUserId] = useState(SEED_CURRENT_USER_ID)
  const [lastSelected, setLastSelected] = useState<User[] | null>(null)
  const [log, setLog] = useState<string[]>([])

  function addLog(msg: string) {
    setLog(prev => [`${new Date().toLocaleTimeString()} ${msg}`, ...prev].slice(0, 20))
  }

  const TOOLBAR_HEIGHT = 44

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Dev toolbar */}
      <div style={{
        height: TOOLBAR_HEIGHT,
        background: '#0f172a',
        color: '#cbd5e1',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '0 16px',
        flexShrink: 0,
        fontSize: 13,
      }}>
        <span style={{ color: '#38bdf8', fontWeight: 700, letterSpacing: '0.05em', fontSize: 11 }}>
          DEV HARNESS
        </span>

        {/* Data source toggle */}
        <div style={{ display: 'flex', borderRadius: 5, border: '1px solid #334155', overflow: 'hidden' }}>
          {(['mock', 'api'] as DataSource[]).map(s => (
            <button
              key={s}
              onClick={() => setSource(s)}
              style={{
                padding: '3px 12px',
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500,
                background: source === s ? '#3b82f6' : 'transparent',
                color: source === s ? '#fff' : '#94a3b8',
              }}
            >
              {s === 'mock' ? 'Mock data' : `Live API`}
            </button>
          ))}
        </div>

        {source === 'api' && (
          <span style={{ fontSize: 11, color: '#475569' }}>{API_URL}</span>
        )}

        {/* Focal user selector */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#64748b', fontSize: 11 }}>Focal user</span>
          <select
            value={focalUserId}
            onChange={e => { setFocalUserId(e.target.value); setLastSelected(null) }}
            style={{
              background: '#1e293b',
              color: '#e2e8f0',
              border: '1px solid #334155',
              borderRadius: 4,
              padding: '2px 6px',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {SEED_USERS.map(u => (
              <option key={u.id} value={u.id}>{u.display_name}</option>
            ))}
          </select>
        </label>

        <div style={{ flex: 1 }} />

        {/* Event log */}
        {log.length > 0 && (
          <span style={{ fontSize: 11, color: '#475569', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {log[0]}
          </span>
        )}

        {lastSelected && (
          <span style={{ fontSize: 11, color: '#34d399' }}>
            Picked: {lastSelected.map(u => u.display_name).join(', ')}
          </span>
        )}
      </div>

      {/* Component under test — remount when focal user or source changes */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <RelationshipMap
          key={`${focalUserId}-${source}`}
          currentUserId={focalUserId}
          {...(source === 'mock'
            ? { data: SEED_DATA }
            : { apiUrl: API_URL }
          )}
          ratingDimensions={SEED_RATING_DIMENSIONS}
          pickerTitle="Select a trusted person"
          pickerMaxDepth={2}
          pickerAllowedTypes={['friend', 'best_friend', 'family', 'colleague']}
          pickerRequireTypesAlongPath
          height={`calc(100vh - ${TOOLBAR_HEIGHT}px)`}
          showSearch
          onSelect={users => {
            setLastSelected(users)
            addLog(`onSelect: ${users.map(u => u.display_name).join(', ')}`)
          }}
          onNodeClick={user => addLog(`onNodeClick: ${user.display_name}`)}
          onRatingSubmit={r => addLog(`onRatingSubmit: ${JSON.stringify(r)}`)}
        />
      </div>
    </div>
  )
}
