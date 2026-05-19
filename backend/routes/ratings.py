import sqlite3
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from models import Rating, RatingCreate

router = APIRouter()


def _row_to_rating(row) -> Rating:
    return Rating(
        id=row["id"],
        rated_user_id=row["rated_user_id"],
        rater_user_id=row["rater_user_id"],
        dimension_key=row["dimension_key"],
        score=row["score"],
        notes=row["notes"],
        created_at=row["created_at"],
    )


@router.post("/ratings", response_model=Rating, status_code=201)
def submit_rating(body: RatingCreate, db: sqlite3.Connection = Depends(get_db)):
    dim = db.execute(
        "SELECT id FROM rating_dimensions WHERE key = ?", (body.dimension_key,)
    ).fetchone()
    if not dim:
        raise HTTPException(status_code=400, detail=f"Unknown dimension key: {body.dimension_key}")

    for uid in (body.rated_user_id, body.rater_user_id):
        if not db.execute("SELECT 1 FROM users WHERE id = ?", (uid,)).fetchone():
            raise HTTPException(status_code=404, detail=f"User not found: {uid}")

    db.execute(
        """INSERT INTO ratings (rated_user_id, rater_user_id, dimension_id, score, notes)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(rated_user_id, rater_user_id, dimension_id) DO UPDATE SET
             score = excluded.score,
             notes = excluded.notes,
             created_at = CURRENT_TIMESTAMP""",
        (body.rated_user_id, body.rater_user_id, dim["id"], body.score, body.notes),
    )
    row = db.execute(
        """SELECT r.id, r.rated_user_id, r.rater_user_id, rd.key AS dimension_key,
                  r.score, r.notes, r.created_at
           FROM ratings r
           JOIN rating_dimensions rd ON rd.id = r.dimension_id
           WHERE r.rated_user_id = ? AND r.rater_user_id = ? AND r.dimension_id = ?""",
        (body.rated_user_id, body.rater_user_id, dim["id"]),
    ).fetchone()
    return _row_to_rating(row)


@router.get("/ratings/{user_id}", response_model=List[Rating])
def get_ratings_for_user(user_id: str, db: sqlite3.Connection = Depends(get_db)):
    if not db.execute("SELECT 1 FROM users WHERE id = ?", (user_id,)).fetchone():
        raise HTTPException(status_code=404, detail="User not found")
    rows = db.execute(
        """SELECT r.id, r.rated_user_id, r.rater_user_id, rd.key AS dimension_key,
                  r.score, r.notes, r.created_at
           FROM ratings r
           JOIN rating_dimensions rd ON rd.id = r.dimension_id
           WHERE r.rated_user_id = ?
           ORDER BY r.created_at DESC""",
        (user_id,),
    ).fetchall()
    return [_row_to_rating(r) for r in rows]
