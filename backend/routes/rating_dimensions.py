import sqlite3
from typing import List
from fastapi import APIRouter, Depends
from database import get_db
from models import RatingDimension, RatingDimensionsBatch

router = APIRouter()


@router.get("/rating-dimensions", response_model=List[RatingDimension])
def list_rating_dimensions(db: sqlite3.Connection = Depends(get_db)):
    rows = db.execute(
        "SELECT * FROM rating_dimensions ORDER BY sort_order"
    ).fetchall()
    return [RatingDimension(**dict(r)) for r in rows]


@router.post("/rating-dimensions", response_model=List[RatingDimension])
def upsert_rating_dimensions(
    body: RatingDimensionsBatch, db: sqlite3.Connection = Depends(get_db)
):
    for dim in body.dimensions:
        db.execute(
            """INSERT INTO rating_dimensions (key, label, icon, sort_order)
               VALUES (?, ?, ?, ?)
               ON CONFLICT(key) DO UPDATE SET
                 label      = excluded.label,
                 icon       = excluded.icon,
                 sort_order = excluded.sort_order""",
            (dim.key, dim.label, dim.icon, dim.sort_order),
        )
    rows = db.execute(
        "SELECT * FROM rating_dimensions ORDER BY sort_order"
    ).fetchall()
    return [RatingDimension(**dict(r)) for r in rows]
