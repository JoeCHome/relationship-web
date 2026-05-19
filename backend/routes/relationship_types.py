import sqlite3
from typing import List
from fastapi import APIRouter, Depends
from database import get_db
from models import RelationshipType

router = APIRouter()


@router.get("/relationship-types", response_model=List[RelationshipType])
def list_relationship_types(db: sqlite3.Connection = Depends(get_db)):
    rows = db.execute(
        "SELECT * FROM relationship_types WHERE is_active = 1 ORDER BY sort_order"
    ).fetchall()
    return [RelationshipType(**dict(r)) for r in rows]
