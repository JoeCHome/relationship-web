# Relationship Map — Project Spec

## Overview

A reusable React component library backed by a FastAPI + SQLite service that renders an interactive, physics-simulated graph of personal relationships. Users can map people in their life, define typed connections between them, and explore the web of relationships visually. The component is designed to be embedded in other applications (initially a tool lending app).

---

## Stack

| Layer | Technology |
|---|---|
| Frontend component | React + React Flow + d3-force |
| Physics simulation | d3-force (force-directed layout) |
| Backend API | FastAPI (Python) |
| Database | SQLite |
| Packaging | npm (React component library) |

---

## Component Modes

The component supports two modes via the `mode` prop:

### `mode="explorer"` (default)
Full interactive map. Users browse their relationship web, drag nodes, click to inspect, add people, manage connections, and submit ratings. This is the day-to-day view.

### `mode="picker"`
A self-contained modal triggered by the host application. The host configures filter rules (depth, relationship types along the full path). Eligible people are highlighted; ineligible ones are dimmed. User selects and confirms; the component calls `onSelect` with the result. Used for flows like "select a borrower from my trusted network."

---

## Component API

```jsx
<RelationshipMap
  // --- Identity (required) ---
  currentUserId="user_abc"           // host app's user ID; becomes the root node

  // --- Mode ---
  mode="explorer"                    // "explorer" | "picker"

  // --- Data source (one of these two) ---
  apiUrl="http://localhost:8000/relmap"  // smart mode: component fetches its own data
  data={nodesAndEdges}                   // controlled mode: parent provides data

  // --- Rating dimensions (host-defined, passed as config) ---
  ratingDimensions={[
    { key: "borrower", label: "Borrower", icon: "arrow-down-circle" },
    { key: "lender",   label: "Lender",   icon: "arrow-up-circle"  }
  ]}

  // --- Picker mode config ---
  pickerTitle="Select a borrower"
  pickerMaxDepth={2}                         // max hops from currentUser
  pickerAllowedTypes={["friend", "family", "best_friend"]}
  pickerRequireTypesAlongPath={true}         // type filter applies to EVERY hop, not just endpoint

  // --- Callbacks ---
  onSelect={(selectedUsers) => {}}           // picker: called on confirm; always array
  onNodeClick={(user) => {}}                 // explorer: called when node is clicked
  onConnectionAdd={(conn) => {}}             // when user adds a new connection
  onRatingSubmit={(rating) => {}}            // when user submits a rating

  // --- Display options ---
  visibleRatingDimensions={["borrower", "lender"]}  // toggles which ratings render
  showSearch={true}
  height="600px"
/>
```

### Controlled mode data shape

When `data` prop is used instead of `apiUrl`, the parent passes:

```js
{
  users: [{ id, display_name, photo_url, host_user_id, notes }],
  connections: [{
    id, owner_user_id, target_user_id, types: ["friend", "colleague"]
  }],
  ratings: [{
    rated_user_id, rater_user_id, dimension_key, score, notes
  }]
}
```

---

## SQLite Schema

### `users`
Registered users drawn from the host app's user pool.

```sql
CREATE TABLE users (
  id           TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  photo_url    TEXT,
  host_user_id TEXT NOT NULL,       -- FK to host app's user system
  notes        TEXT,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `relationship_types`
Predefined list, seeded at startup. Never user-editable.

```sql
CREATE TABLE relationship_types (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  key        TEXT NOT NULL UNIQUE,  -- e.g. "spouse", "friend", "colleague"
  name       TEXT NOT NULL,
  color_hex  TEXT NOT NULL,
  edge_style TEXT NOT NULL DEFAULT 'solid',  -- "solid" | "dashed"
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active  BOOLEAN NOT NULL DEFAULT 1
);
```

### `connections`
One row per owner→target relationship. Owner-scoped: your map of Marcus is independent of Sarah's map of Marcus.

```sql
CREATE TABLE connections (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_user_id TEXT NOT NULL REFERENCES users(id),
  target_user_id TEXT NOT NULL REFERENCES users(id),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(owner_user_id, target_user_id)
);
```

### `connection_types`
Many-to-many bridge: one connection can have multiple relationship types.

```sql
CREATE TABLE connection_types (
  connection_id        INTEGER NOT NULL REFERENCES connections(id),
  relationship_type_id INTEGER NOT NULL REFERENCES relationship_types(id),
  PRIMARY KEY (connection_id, relationship_type_id)
);
```

### `rating_dimensions`
Injected by the host app at startup via the API. Defines what rating categories exist.

```sql
CREATE TABLE rating_dimensions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  key        TEXT NOT NULL UNIQUE,   -- e.g. "borrower", "lender"
  label      TEXT NOT NULL,
  icon       TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);
```

### `ratings`
Per-person, per-dimension scores. Visible to all users who have that person in their map.

```sql
CREATE TABLE ratings (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  rated_user_id TEXT NOT NULL REFERENCES users(id),
  rater_user_id TEXT NOT NULL REFERENCES users(id),
  dimension_id  INTEGER NOT NULL REFERENCES rating_dimensions(id),
  score         REAL NOT NULL CHECK(score >= 0 AND score <= 5),
  notes         TEXT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(rated_user_id, rater_user_id, dimension_id)
);
```

### `node_positions`
Persists where each user dragged nodes on their personal map.

```sql
CREATE TABLE node_positions (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_user_id  TEXT NOT NULL REFERENCES users(id),
  target_user_id TEXT NOT NULL REFERENCES users(id),
  pos_x          REAL NOT NULL DEFAULT 0,
  pos_y          REAL NOT NULL DEFAULT 0,
  is_pinned      BOOLEAN NOT NULL DEFAULT 0,
  UNIQUE(owner_user_id, target_user_id)
);
```

---

## Seed Data — Relationship Types

Seed this table on first startup:

| key | name | color_hex | edge_style | sort_order |
|---|---|---|---|---|
| spouse_partner | Spouse / Partner | #7F77DD | solid | 1 |
| family | Family | #534AB7 | solid | 2 |
| best_friend | Best Friend | #1D9E75 | solid | 3 |
| friend | Friend | #5DCAA5 | solid | 4 |
| romantic | Romantic | #D4537E | dashed | 5 |
| colleague | Colleague | #378ADD | solid | 6 |
| manager_report | Manager / Report | #0C447C | dashed | 7 |
| mentor_mentee | Mentor / Mentee | #BA7517 | solid | 8 |
| vendor | Vendor | #D85A30 | solid | 9 |
| customer_client | Customer / Client | #993C1D | dashed | 10 |
| neighbor | Neighbor | #639922 | solid | 11 |
| classmate_alumni | Classmate / Alumni | #97C459 | dashed | 12 |
| acquaintance | Acquaintance | #888780 | dashed | 13 |

---

## FastAPI Endpoint Structure

Mount the router at a configurable prefix (e.g. `/relmap`) so it can be added to the host app without conflicts.

```
GET    /relmap/graph/{owner_user_id}         # full graph for a user (nodes + edges + ratings)
GET    /relmap/users/search?q=&exclude=      # search registered users to add
POST   /relmap/users                         # register a user
GET    /relmap/users/{user_id}               # get single user profile + aggregate ratings

POST   /relmap/connections                   # add a connection
DELETE /relmap/connections/{id}              # remove a connection
PUT    /relmap/connections/{id}/types        # update relationship types on a connection

GET    /relmap/relationship-types            # list all active relationship types
GET    /relmap/rating-dimensions             # list configured rating dimensions
POST   /relmap/rating-dimensions             # upsert rating dimensions (host app calls at startup)

POST   /relmap/ratings                       # submit or update a rating
GET    /relmap/ratings/{user_id}             # get all ratings for a user

PUT    /relmap/positions/{owner_user_id}     # batch upsert node positions
GET    /relmap/positions/{owner_user_id}     # get saved node positions

GET    /relmap/picker/{owner_user_id}        # trust-scoped query:
                                             # ?max_depth=2&types=friend,family&require_along_path=true
```

### Picker query logic

The `/relmap/picker` endpoint performs a BFS from `owner_user_id` up to `max_depth` hops. When `require_along_path=true`, every edge traversed in the path must include at least one of the `types` values — not just the final node's connection to the owner. Returns each eligible user with their hop count and the path taken (for displaying "via Sarah" in the UI).

---

## Visual Design

### Node appearance
- Size scales with connection count (more connections = larger node)
- Shows name + rating scores on the node label (toggleable)
- Photo displayed as circular avatar if available; initials fallback
- Focal (current user) node is always largest and centered at start

### Edge appearance
- Color from relationship type's `color_hex`
- Multi-type connections: render multiple layered lines (primary type solid, secondary types as offset dashed lines)
- Stroke width reflects number of types on the connection (more types = thicker overall)
- Dashed vs solid per `edge_style` in relationship_types

### Interaction
- Force-directed physics simulation via d3-force
- Drag any node to reposition; pinned nodes resist the simulation
- Drag focal node to a new person to re-center the graph on them
- Click node to open detail panel (name, relationship tags, ratings, shared connections, notes)
- Detail panel actions: Edit, Add link, Set as focal, Rate

### Picker modal overlaid on explorer canvas
- Ineligible nodes dimmed to ~38% opacity
- Eligible nodes highlighted with a checkmark badge
- 2-hop paths show "Via [intermediary name]" badge
- Filter controls: hop depth buttons (1, 2, 3, Any) + relationship type chips
- Footer shows eligible count, selected count, ineligible count

---

## UI Layout

```
┌─ Top bar ──────────────────────────────────────────────────────────┐
│  [Explorer | Picker]  [Borrower toggle] [Lender toggle]  [Find]   │
├─ Left sidebar ──┬─ Canvas (force graph) ──────┬─ Right panel ──────┤
│  Search         │                             │  Detail panel      │
│  People list    │   [nodes + edges]           │  - Avatar + name   │
│  + Add person   │                             │  - Rel type tags   │
│                 │   [Picker modal overlay]    │  - Ratings + Rate  │
│  Legend         │                             │  - Notes           │
│  (rel types)    │   [Toolbar: zoom/fit/filter]│  - Shared conns    │
│                 │   [Zoom %]                  │  - Edit/Link/Focal │
└─────────────────┴─────────────────────────────┴────────────────────┘
```

---

## Suggested Build Order

1. **Database layer** — schema creation, seed data, SQLite connection utility
2. **FastAPI routes** — `/graph`, `/users`, `/connections`, `/ratings` (core CRUD first)
3. **Picker query** — BFS with path-aware type filtering
4. **React project scaffold** — Vite + React + React Flow + d3-force
5. **Graph canvas** — force simulation, node rendering, edge rendering (colors + multi-type)
6. **Left sidebar** — people list, search, legend
7. **Right detail panel** — profile, relationship tags, ratings, actions
8. **Add person flow** — search registered users, set relationship types
9. **Picker modal** — filter controls, eligibility display, confirm callback
10. **Rating UI** — star input, submission, aggregate display
11. **Node position persistence** — save/restore drag positions
12. **Component library packaging** — props API, named exports, README

---

## Future / v2 Features (design for but do not build yet)

- Permission system: users can require approval before being added to someone's map
- Graph analytics: mutual connection counts, trust score derived from ratings
- Connection request notifications
- Export map as image

---

## Notes for Claude Code

- The SQLite database file path should be configurable via environment variable `RELMAP_DB_PATH`
- The FastAPI router should be mountable as a sub-application: `app.mount("/relmap", relmap_app)`
- All relationship type keys are `snake_case` strings matching the seed table
- Rating scores are stored as `REAL` (0.0–5.0); display as one decimal place
- The `host_user_id` field on `users` is the host app's own user ID — the component does not manage auth, it trusts whatever `currentUserId` it receives
- `visibleRatingDimensions` prop controls display only; all dimensions are always stored
- Use `react-flow` v11+ (the `@xyflow/react` package)
