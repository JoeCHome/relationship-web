import sqlite3
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from database import get_db
from models import User, UserCreate

router = APIRouter()


@router.get("/users/search", response_model=List[User])
def search_users(
    q: str = Query("", description="Search string matched against display_name"),
    exclude: Optional[str] = Query(None, description="Comma-separated user IDs to exclude"),
    db: sqlite3.Connection = Depends(get_db),
):
    exclude_ids = [e.strip() for e in exclude.split(",")] if exclude else []
    like = f"%{q}%"
    rows = db.execute(
        "SELECT * FROM users WHERE display_name LIKE ? ORDER BY display_name",
        (like,),
    ).fetchall()
    results = [User(**dict(r)) for r in rows if r["id"] not in exclude_ids]
    return results


@router.post("/users", response_model=User, status_code=201)
def create_user(body: UserCreate, db: sqlite3.Connection = Depends(get_db)):
    try:
        db.execute(
            "INSERT INTO users (id, display_name, photo_url, host_user_id, notes) VALUES (?, ?, ?, ?, ?)",
            (body.id, body.display_name, body.photo_url, body.host_user_id, body.notes),
        )
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="User ID already exists")
    row = db.execute("SELECT * FROM users WHERE id = ?", (body.id,)).fetchone()
    return User(**dict(row))


@router.get("/users/{user_id}", response_model=User)
def get_user(user_id: str, db: sqlite3.Connection = Depends(get_db)):
    row = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**dict(row))
