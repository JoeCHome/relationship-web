import sqlite3
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from models import NodePositionItem, NodePositionsBatch

router = APIRouter()


@router.get("/positions/{owner_user_id}", response_model=List[NodePositionItem])
def get_positions(owner_user_id: str, db: sqlite3.Connection = Depends(get_db)):
    if not db.execute("SELECT 1 FROM users WHERE id = ?", (owner_user_id,)).fetchone():
        raise HTTPException(status_code=404, detail="User not found")
    rows = db.execute(
        "SELECT target_user_id, pos_x, pos_y, is_pinned FROM node_positions WHERE owner_user_id = ?",
        (owner_user_id,),
    ).fetchall()
    return [NodePositionItem(**dict(r)) for r in rows]


@router.put("/positions/{owner_user_id}", response_model=List[NodePositionItem])
def upsert_positions(
    owner_user_id: str,
    body: NodePositionsBatch,
    db: sqlite3.Connection = Depends(get_db),
):
    if not db.execute("SELECT 1 FROM users WHERE id = ?", (owner_user_id,)).fetchone():
        raise HTTPException(status_code=404, detail="User not found")
    for pos in body.positions:
        db.execute(
            """INSERT INTO node_positions (owner_user_id, target_user_id, pos_x, pos_y, is_pinned)
               VALUES (?, ?, ?, ?, ?)
               ON CONFLICT(owner_user_id, target_user_id) DO UPDATE SET
                 pos_x     = excluded.pos_x,
                 pos_y     = excluded.pos_y,
                 is_pinned = excluded.is_pinned""",
            (owner_user_id, pos.target_user_id, pos.pos_x, pos.pos_y, pos.is_pinned),
        )
    rows = db.execute(
        "SELECT target_user_id, pos_x, pos_y, is_pinned FROM node_positions WHERE owner_user_id = ?",
        (owner_user_id,),
    ).fetchall()
    return [NodePositionItem(**dict(r)) for r in rows]
