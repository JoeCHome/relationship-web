import { useState } from 'react'
import type { GraphUser, GraphEdge, RelationshipType } from '../types'

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

interface Props {
  users: GraphUser[]
  edges: GraphEdge[]
  currentUserId: string
  selectedNodeId: string | null
  relationshipTypes: RelationshipType[]
  onSelectNode: (id: string) => void
  onAddPerson: (query: string) => void
  showSearch: boolean
}

export function LeftSidebar({
  users,
  edges,
  currentUserId,
  selectedNodeId,
  relationshipTypes,
  onSelectNode,
  onAddPerson,
  showSearch,
}: Props) {
  const [search, setSearch] = useState('')
  const [showLegend, setShowLegend] = useState(false)

  const connectionCounts = new Map<string, number>()
  for (const e of edges) {
    connectionCounts.set(e.target_user_id, (connectionCounts.get(e.target_user_id) ?? 0) + 1)
  }

  const sortedUsers = [...users]
    .filter(u => u.id !== currentUserId)
    .filter(u => u.display_name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.display_name.localeCompare(b.display_name))

  return (
    <div style={{
      width: 220,
      borderRight: '1px solid #e5e7eb',
      background: '#fafafa',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      overflow: 'hidden',
    }}>
      {/* Search */}
      {showSearch && (
        <div style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>
          <input
            type="text"
            placeholder="Search people…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid #d1d5db',
              fontSize: 13,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}

      {/* People list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {sortedUsers.map(user => {
          const edge = edges.find(e => e.target_user_id === user.id)
          const primaryType = edge?.types[0]
          return (
            <div
              key={user.id}
              onClick={() => onSelectNode(user.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 12px',
                cursor: 'pointer',
                background: selectedNodeId === user.id ? '#ede9fe' : 'transparent',
                borderLeft: selectedNodeId === user.id ? '3px solid #6366f1' : '3px solid transparent',
              }}
            >
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 600,
                color: '#6b7280',
                flexShrink: 0,
                overflow: 'hidden',
              }}>
                {user.photo_url
                  ? <img src={user.photo_url} alt={user.display_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : initials(user.display_name)
                }
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.display_name}
                </div>
                {primaryType && (
                  <div style={{ fontSize: 11, color: primaryType.color_hex, fontWeight: 500 }}>
                    {primaryType.name}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add person button */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid #e5e7eb' }}>
        <button
          onClick={() => onAddPerson('')}
          style={{
            width: '100%',
            padding: '7px 0',
            borderRadius: 6,
            border: '1px dashed #d1d5db',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: 13,
            color: '#6b7280',
            fontWeight: 500,
          }}
        >
          + Add person
        </button>
      </div>

      {/* Legend toggle */}
      <div style={{ borderTop: '1px solid #e5e7eb' }}>
        <button
          onClick={() => setShowLegend(s => !s)}
          style={{
            width: '100%',
            padding: '8px 12px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: 12,
            color: '#6b7280',
            textAlign: 'left',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>Legend</span>
          <span>{showLegend ? '▲' : '▼'}</span>
        </button>
        {showLegend && (
          <div style={{ padding: '4px 12px 12px' }}>
            {relationshipTypes.map(rt => (
              <div key={rt.key} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <div style={{
                  width: 24,
                  height: 3,
                  background: rt.color_hex,
                  borderRadius: 2,
                  flexShrink: 0,
                  ...(rt.edge_style === 'dashed' ? {
                    background: 'transparent',
                    borderTop: `2px dashed ${rt.color_hex}`,
                    height: 0,
                  } : {}),
                }} />
                <span style={{ fontSize: 11, color: '#374151' }}>{rt.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
