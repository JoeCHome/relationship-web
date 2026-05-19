import { useState, useEffect } from 'react'
import type { RelationshipType, PickerUser, User } from '../types'

interface Props {
  title: string
  eligibleUsers: PickerUser[]
  allUsersInGraph: number
  relationshipTypes: RelationshipType[]
  maxDepth: number
  allowedTypes: string[]
  requireAlongPath: boolean
  onDepthChange: (depth: number) => void
  onTypesChange: (types: string[]) => void
  onConfirm: (selected: User[]) => void
  onCancel: () => void
}

export function PickerOverlay({
  title,
  eligibleUsers,
  allUsersInGraph,
  relationshipTypes,
  maxDepth,
  allowedTypes,
  onDepthChange,
  onTypesChange,
  onConfirm,
  onCancel,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [localDepth, setLocalDepth] = useState(maxDepth)
  const [localTypes, setLocalTypes] = useState<string[]>(allowedTypes)

  useEffect(() => { setLocalDepth(maxDepth) }, [maxDepth])
  useEffect(() => { setLocalTypes(allowedTypes) }, [allowedTypes])

  function toggleType(key: string) {
    const next = localTypes.includes(key) ? localTypes.filter(t => t !== key) : [...localTypes, key]
    setLocalTypes(next)
    onTypesChange(next)
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectedUsers = eligibleUsers.filter(u => selected.has(u.id)).map(u => ({
    id: u.id,
    display_name: u.display_name,
    photo_url: u.photo_url,
    host_user_id: u.host_user_id,
  }))

  const ineligibleCount = allUsersInGraph - eligibleUsers.length

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'rgba(0,0,0,0.35)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 12,
        width: 480,
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{title}</div>
        </div>

        {/* Filters */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Depth */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500, minWidth: 60 }}>Depth</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {[1, 2, 3].map(d => (
                <button
                  key={d}
                  onClick={() => { setLocalDepth(d); onDepthChange(d) }}
                  style={{
                    padding: '3px 12px',
                    borderRadius: 20,
                    border: '1px solid #e5e7eb',
                    cursor: 'pointer',
                    fontSize: 12,
                    background: localDepth === d ? '#6366f1' : '#f9fafb',
                    color: localDepth === d ? '#fff' : '#374151',
                    fontWeight: 500,
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Type filter chips */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500, minWidth: 60, paddingTop: 4 }}>Types</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {relationshipTypes.map(rt => {
                const active = localTypes.includes(rt.key)
                return (
                  <button
                    key={rt.key}
                    onClick={() => toggleType(rt.key)}
                    style={{
                      padding: '2px 10px',
                      borderRadius: 20,
                      border: `1px solid ${active ? rt.color_hex : '#e5e7eb'}`,
                      cursor: 'pointer',
                      fontSize: 11,
                      background: active ? rt.color_hex + '22' : '#f9fafb',
                      color: active ? rt.color_hex : '#6b7280',
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    {rt.name}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Eligible user list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {eligibleUsers.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
              No eligible people found with these filters
            </div>
          )}
          {eligibleUsers.map(user => (
            <div
              key={user.id}
              onClick={() => toggleSelect(user.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 20px',
                cursor: 'pointer',
                background: selected.has(user.id) ? '#ede9fe' : 'transparent',
              }}
            >
              <input
                type="checkbox"
                checked={selected.has(user.id)}
                onChange={() => {}}
                style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#6366f1' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{user.display_name}</div>
                {user.hop_count > 1 && user.path.length > 1 && (
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>
                    via {user.path.slice(1, -1).join(' → ')}
                  </div>
                )}
              </div>
              <span style={{
                padding: '1px 7px',
                borderRadius: 10,
                background: '#f3f4f6',
                fontSize: 11,
                color: '#6b7280',
              }}>
                {user.hop_count === 1 ? 'direct' : `${user.hop_count} hops`}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            <span style={{ color: '#1d9e75', fontWeight: 600 }}>{eligibleUsers.length} eligible</span>
            {selected.size > 0 && <span style={{ color: '#6366f1', fontWeight: 600 }}> · {selected.size} selected</span>}
            {ineligibleCount > 0 && <span> · {ineligibleCount} ineligible</span>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onCancel}
              style={{ padding: '6px 16px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#374151' }}
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(selectedUsers)}
              disabled={selected.size === 0}
              style={{
                padding: '6px 16px',
                borderRadius: 6,
                border: 'none',
                background: selected.size > 0 ? '#6366f1' : '#e5e7eb',
                color: selected.size > 0 ? '#fff' : '#9ca3af',
                cursor: selected.size > 0 ? 'pointer' : 'default',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
