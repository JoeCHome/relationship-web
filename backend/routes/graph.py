import sqlite3
from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from models import GraphResponse, GraphUser, GraphEdge, GraphEdgeType, Rating, RelationshipType

router = APIRouter()


@router.get("/graph/{owner_user_id}", response_model=GraphResponse)
def get_graph(owner_user_id: str, db: sqlite3.Connection = Depends(get_db)):
    if not db.execute("SELECT 1 FROM users WHERE id = ?", (owner_user_id,)).fetchone():
        raise HTTPException(status_code=404, detail="User not found")

    # All connections owned by this user
    conn_rows = db.execute(
        "SELECT * FROM connections WHERE owner_user_id = ?", (owner_user_id,)
    ).fetchall()

    # Collect all user IDs in the graph (owner + targets)
    target_ids = [r["target_user_id"] for r in conn_rows]
    all_user_ids = list({owner_user_id} | set(target_ids))

    # Load users
    placeholders = ",".join("?" * len(all_user_ids))
    user_rows = db.execute(
        f"SELECT * FROM users WHERE id IN ({placeholders})", all_user_ids
    ).fetchall()

    # Load positions for this owner
    pos_rows = db.execute(
        "SELECT target_user_id, pos_x, pos_y, is_pinned FROM node_positions WHERE owner_user_id = ?",
        (owner_user_id,),
    ).fetchall()
    positions = {r["target_user_id"]: dict(r) for r in pos_rows}

    # Connection counts per target user (how many people have them connected)
    conn_count_rows = db.execute(
        f"""SELECT target_user_id, COUNT(*) AS cnt
            FROM connections
            WHERE owner_user_id = ?
            GROUP BY target_user_id""",
        (owner_user_id,),
    ).fetchall()
    conn_counts = {r["target_user_id"]: r["cnt"] for r in conn_count_rows}

    # Build graph users
    graph_users = []
    for u in user_rows:
        uid = u["id"]
        pos = positions.get(uid, {})
        graph_users.append(
            GraphUser(
                id=uid,
                display_name=u["display_name"],
                photo_url=u["photo_url"],
                host_user_id=u["host_user_id"],
                notes=u["notes"],
                pos_x=pos.get("pos_x"),
                pos_y=pos.get("pos_y"),
                is_pinned=bool(pos.get("is_pinned", False)),
                connection_count=conn_counts.get(uid, 0),
            )
        )

    # Build edges with full type info
    rt_rows = db.execute("SELECT * FROM relationship_types").fetchall()
    rt_by_id = {r["id"]: dict(r) for r in rt_rows}

    graph_edges = []
    for c in conn_rows:
        cid = c["id"]
        ct_rows = db.execute(
            "SELECT relationship_type_id FROM connection_types WHERE connection_id = ?", (cid,)
        ).fetchall()
        types = [
            GraphEdgeType(
                key=rt_by_id[r["relationship_type_id"]]["key"],
                name=rt_by_id[r["relationship_type_id"]]["name"],
                color_hex=rt_by_id[r["relationship_type_id"]]["color_hex"],
                edge_style=rt_by_id[r["relationship_type_id"]]["edge_style"],
            )
            for r in ct_rows
            if r["relationship_type_id"] in rt_by_id
        ]
        graph_edges.append(
            GraphEdge(
                id=cid,
                owner_user_id=c["owner_user_id"],
                target_user_id=c["target_user_id"],
                types=types,
            )
        )

    # Ratings for all users in this graph
    rating_rows = db.execute(
        f"""SELECT r.id, r.rated_user_id, r.rater_user_id, rd.key AS dimension_key,
                   r.score, r.notes, r.created_at
            FROM ratings r
            JOIN rating_dimensions rd ON rd.id = r.dimension_id
            WHERE r.rated_user_id IN ({placeholders})""",
        all_user_ids,
    ).fetchall()
    ratings = [
        Rating(
            id=r["id"],
            rated_user_id=r["rated_user_id"],
            rater_user_id=r["rater_user_id"],
            dimension_key=r["dimension_key"],
            score=r["score"],
            notes=r["notes"],
            created_at=r["created_at"],
        )
        for r in rating_rows
    ]

    # All active relationship types (for the legend)
    rel_types = [
        RelationshipType(**dict(r))
        for r in db.execute(
            "SELECT * FROM relationship_types WHERE is_active = 1 ORDER BY sort_order"
        ).fetchall()
    ]

    return GraphResponse(
        users=graph_users,
        edges=graph_edges,
        ratings=ratings,
        relationship_types=rel_types,
    )
