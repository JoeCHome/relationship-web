import sqlite3
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from models import Connection, ConnectionCreate, ConnectionTypesUpdate

router = APIRouter()


def _load_connection(conn_id: int, db: sqlite3.Connection) -> Connection:
    row = db.execute("SELECT * FROM connections WHERE id = ?", (conn_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Connection not found")
    types = _get_types_for_connection(conn_id, db)
    return Connection(**dict(row), types=types)


def _get_types_for_connection(conn_id: int, db: sqlite3.Connection) -> List[str]:
    rows = db.execute(
        """SELECT rt.key FROM relationship_types rt
           JOIN connection_types ct ON ct.relationship_type_id = rt.id
           WHERE ct.connection_id = ?""",
        (conn_id,),
    ).fetchall()
    return [r["key"] for r in rows]


def _resolve_type_ids(keys: List[str], db: sqlite3.Connection) -> List[int]:
    ids = []
    for key in keys:
        row = db.execute(
            "SELECT id FROM relationship_types WHERE key = ?", (key,)
        ).fetchone()
        if not row:
            raise HTTPException(status_code=400, detail=f"Unknown relationship type: {key}")
        ids.append(row["id"])
    return ids


@router.post("/connections", response_model=Connection, status_code=201)
def create_connection(body: ConnectionCreate, db: sqlite3.Connection = Depends(get_db)):
    for uid in (body.owner_user_id, body.target_user_id):
        if not db.execute("SELECT 1 FROM users WHERE id = ?", (uid,)).fetchone():
            raise HTTPException(status_code=404, detail=f"User not found: {uid}")
    try:
        cur = db.execute(
            "INSERT INTO connections (owner_user_id, target_user_id) VALUES (?, ?)",
            (body.owner_user_id, body.target_user_id),
        )
    except Exception:
        raise HTTPException(status_code=409, detail="Connection already exists")
    conn_id = cur.lastrowid
    if body.types:
        type_ids = _resolve_type_ids(body.types, db)
        db.executemany(
            "INSERT OR IGNORE INTO connection_types (connection_id, relationship_type_id) VALUES (?, ?)",
            [(conn_id, tid) for tid in type_ids],
        )
    return _load_connection(conn_id, db)


@router.delete("/connections/{conn_id}", status_code=204)
def delete_connection(conn_id: int, db: sqlite3.Connection = Depends(get_db)):
    row = db.execute("SELECT 1 FROM connections WHERE id = ?", (conn_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Connection not found")
    db.execute("DELETE FROM connections WHERE id = ?", (conn_id,))


@router.put("/connections/{conn_id}/types", response_model=Connection)
def update_connection_types(
    conn_id: int,
    body: ConnectionTypesUpdate,
    db: sqlite3.Connection = Depends(get_db),
):
    row = db.execute("SELECT 1 FROM connections WHERE id = ?", (conn_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Connection not found")
    type_ids = _resolve_type_ids(body.types, db)
    db.execute("DELETE FROM connection_types WHERE connection_id = ?", (conn_id,))
    if type_ids:
        db.executemany(
            "INSERT OR IGNORE INTO connection_types (connection_id, relationship_type_id) VALUES (?, ?)",
            [(conn_id, tid) for tid in type_ids],
        )
    return _load_connection(conn_id, db)
