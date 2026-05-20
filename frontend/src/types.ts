export interface User {
  id: string
  display_name: string
  photo_url?: string | null
  host_user_id: string
  notes?: string | null
  created_at?: string
}

export interface GraphUser extends User {
  pos_x?: number | null
  pos_y?: number | null
  is_pinned: boolean
  connection_count: number
}

export interface RelationshipType {
  id: number
  key: string
  name: string
  color_hex: string
  edge_style: 'solid' | 'dashed'
  sort_order: number
  is_active: boolean
}

export interface GraphEdgeType {
  key: string
  name: string
  color_hex: string
  edge_style: 'solid' | 'dashed'
}

export interface GraphEdge {
  id: number
  owner_user_id: string
  target_user_id: string
  primary_type: string
  types: GraphEdgeType[]
}

export interface Rating {
  id: number
  rated_user_id: string
  rater_user_id: string
  dimension_key: string
  score: number
  notes?: string | null
  created_at: string
}

export interface RatingDimension {
  key: string
  label: string
  icon?: string
}

export interface GraphData {
  users: GraphUser[]
  edges: GraphEdge[]
  ratings: Rating[]
  relationship_types: RelationshipType[]
}

export interface PickerUser {
  id: string
  display_name: string
  photo_url?: string | null
  host_user_id: string
  hop_count: number
  path: string[]
}

export interface PickerResponse {
  eligible: PickerUser[]
  total_in_graph: number
}

export interface NodePositionItem {
  target_user_id: string
  pos_x: number
  pos_y: number
  is_pinned: boolean
}

export interface UserSearchResult {
  id: string
  display_name: string
  photo_url?: string | null
}

export interface RelationshipMapProps {
  currentUserId: string
  mode?: 'explorer' | 'picker'
  apiUrl?: string
  searchUsers?: (query: string) => Promise<UserSearchResult[]>
  data?: {
    users: User[]
    connections: Array<{ id: number; owner_user_id: string; target_user_id: string; primary_type?: string; types: string[] }>
    ratings: Rating[]
  }
  ratingDimensions?: RatingDimension[]
  pickerTitle?: string
  pickerMaxDepth?: number
  pickerAllowedTypes?: string[]
  pickerRequireTypesAlongPath?: boolean
  onSelect?: (users: User[]) => void
  onNodeClick?: (user: User) => void
  onConnectionAdd?: (conn: unknown) => void
  onRatingSubmit?: (rating: unknown) => void
  visibleRatingDimensions?: string[]
  showSearch?: boolean
  height?: string
}
