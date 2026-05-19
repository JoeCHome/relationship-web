import sqlite3
from collections import deque
from typing import List, Optional, Set
from fastapi import APIRouter, Depends, HTTPException, Query
from database import get_db
from models import PickerResponse, PickerUser

router = APIRouter()


@router.get("/picker/{owner_user_id}", response_model=PickerResponse)
def picker_query(
    owner_user_id: str,
    max_depth: int = Query(2, ge=1, le=5),
    types: Optional[str] = Query(None, description="Comma-separated relationship type keys"),
    require_along_path: bool = Query(True),
    db: sqlite3.Connection = Depends(get_db),
):
    if not db.execute("SELECT 1 FROM users WHERE id = ?", (owner_user_id,)).fetchone():
        raise HTTPException(status_code=404, detail="User not found")

    allowed_types: Optional[Set[str]] = None
    if types:
        allowed_types = {t.strip() for t in types.split(",") if t.strip()}

    # Build adjacency: for each user, their outgoing connections with type keys
    # We load edges lazily per node during BFS to avoid loading the entire graph
    def get_edges(user_id: str):
        rows = db.execute(
            """SELECT c.id, c.target_user_id,
                      GROUP_CONCAT(rt.key) AS type_keys
               FROM connections c
               LEFT JOIN connection_types ct ON ct.connection_id = c.id
               LEFT JOIN relationship_types rt ON rt.id = ct.relationship_type_id
               WHERE c.owner_user_id = ?
               GROUP BY c.id""",
            (user_id,),
        ).fetchall()
        return [
            {
                "target_user_id": r["target_user_id"],
                "types": set(r["type_keys"].split(",")) if r["type_keys"] else set(),
            }
            for r in rows
        ]

    def edge_passes_filter(edge_types: Set[str]) -> bool:
        if not allowed_types:
            return True
        return bool(edge_types & allowed_types)

    # BFS
    # visited: user_id -> {"hop_count": int, "path": List[str]}
    visited = {owner_user_id: {"hop_count": 0, "path": [owner_user_id]}}
    queue = deque([owner_user_id])
    total_visited: Set[str] = {owner_user_id}

    while queue:
        current = queue.popleft()
        current_hop = visited[current]["hop_count"]
        current_path = visited[current]["path"]

        if current_hop >= max_depth:
            continue

        for edge in get_edges(current):
            neighbor = edge["target_user_id"]
            if neighbor in total_visited:
                continue

            # Check edge type filter
            if require_along_path and allowed_types:
                if not edge_passes_filter(edge["types"]):
                    continue
            elif not require_along_path and allowed_types and current_hop + 1 == max_depth:
                # Only check types at the final hop when require_along_path=False
                if not edge_passes_filter(edge["types"]):
                    continue

            total_visited.add(neighbor)
            visited[neighbor] = {
                "hop_count": current_hop + 1,
                "path": current_path + [neighbor],
            }
            queue.append(neighbor)

    # Load user info for all eligible nodes (exclude owner)
    eligible_ids = [uid for uid in visited if uid != owner_user_id]
    total_in_graph = len(eligible_ids)

    if not eligible_ids:
        return PickerResponse(eligible=[], total_in_graph=0)

    placeholders = ",".join("?" * len(eligible_ids))
    user_rows = db.execute(
        f"SELECT id, display_name, photo_url, host_user_id FROM users WHERE id IN ({placeholders})",
        eligible_ids,
    ).fetchall()
    user_map = {r["id"]: dict(r) for r in user_rows}

    eligible = []
    for uid in eligible_ids:
        info = visited[uid]
        u = user_map.get(uid)
        if not u:
            continue
        eligible.append(
            PickerUser(
                id=uid,
                display_name=u["display_name"],
                photo_url=u["photo_url"],
                host_user_id=u["host_user_id"],
                hop_count=info["hop_count"],
                path=info["path"],
            )
        )

    eligible.sort(key=lambda x: (x.hop_count, x.display_name))
    return PickerResponse(eligible=eligible, total_in_graph=total_in_graph)
