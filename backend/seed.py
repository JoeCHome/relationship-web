"""
Populate the dev database with sample data matching the frontend seed.

Usage:
    python seed.py                 # uses RELMAP_DB_PATH or ./dev.db
    python seed.py --reset         # drop and recreate before seeding
    RELMAP_DB_PATH=./other.db python seed.py
"""

import argparse
import os
import sqlite3
import sys

os.environ.setdefault("RELMAP_DB_PATH", "./dev.db")
from database import init_db, DB_PATH  # noqa: E402 (needs env set first)

USERS = [
    ("alice", "Alice Chen",    None, "h-alice", "Focal user in the demo"),
    ("bob",   "Bob Martinez",  None, "h-bob",   None),
    ("carol", "Carol Chen",    None, "h-carol", "Alice's sister"),
    ("david", "David Kim",     None, "h-david", None),
    ("emma",  "Emma Williams", None, "h-emma",  None),
    ("frank", "Frank Johnson", None, "h-frank", None),
    ("sarah", "Sarah Lee",     None, "h-sarah", None),
    ("tom",   "Tom Brown",     None, "h-tom",   None),
    ("lisa",  "Lisa Park",     None, "h-lisa",  None),
    ("mike",  "Mike Davis",    None, "h-mike",  None),
]

DIMENSIONS = [
    ("borrower", "Borrower", None, 1),
    ("lender",   "Lender",   None, 2),
]

# (owner, target, [type_keys])
CONNECTIONS = [
    # Alice's map
    ("alice", "bob",   ["best_friend", "colleague"]),
    ("alice", "carol", ["family"]),
    ("alice", "david", ["colleague", "mentor_mentee"]),
    ("alice", "emma",  ["friend"]),
    ("alice", "frank", ["neighbor"]),
    # Bob's map  (hop 2 via alice → bob)
    ("bob", "sarah", ["romantic"]),
    ("bob", "tom",   ["friend", "classmate_alumni"]),
    ("bob", "alice", ["best_friend", "colleague"]),
    # David's map  (hop 2 via alice → david)
    ("david", "lisa",  ["colleague"]),
    ("david", "mike",  ["colleague", "manager_report"]),
    ("david", "alice", ["colleague", "mentor_mentee"]),
]

# (rater, rated, dimension_key, score, notes)
RATINGS = [
    ("alice", "bob",   "borrower", 4.5, "Super reliable"),
    ("alice", "bob",   "lender",   3.5, None),
    ("alice", "carol", "borrower", 5.0, "Perfect track record"),
    ("alice", "carol", "lender",   5.0, None),
    ("alice", "david", "lender",   4.0, None),
    ("alice", "emma",  "borrower", 3.0, "Usually good, sometimes slow"),
    ("bob",   "alice", "borrower", 4.0, None),
    ("bob",   "alice", "lender",   4.5, None),
    ("carol", "alice", "lender",   4.5, None),
    ("emma",  "alice", "lender",   4.0, None),
    ("bob",   "sarah", "borrower", 4.0, None),
    ("david", "lisa",  "borrower", 4.5, None),
    ("david", "mike",  "borrower", 3.5, None),
]


def seed(reset: bool = False) -> None:
    if reset and os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        print(f"Removed {DB_PATH}")

    init_db()
    print(f"Database: {DB_PATH}")

    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")

    try:
        # Rating dimensions
        for key, label, icon, sort_order in DIMENSIONS:
            conn.execute(
                """INSERT INTO rating_dimensions (key, label, icon, sort_order)
                   VALUES (?, ?, ?, ?)
                   ON CONFLICT(key) DO UPDATE SET label=excluded.label, sort_order=excluded.sort_order""",
                (key, label, icon, sort_order),
            )
        print(f"  {len(DIMENSIONS)} rating dimensions")

        # Users
        inserted_users = 0
        for uid, name, photo, host_id, notes in USERS:
            try:
                conn.execute(
                    "INSERT INTO users (id, display_name, photo_url, host_user_id, notes) VALUES (?, ?, ?, ?, ?)",
                    (uid, name, photo, host_id, notes),
                )
                inserted_users += 1
            except sqlite3.IntegrityError:
                pass  # already exists
        print(f"  {inserted_users}/{len(USERS)} users inserted")

        # Connections + types
        rt_rows = conn.execute("SELECT id, key FROM relationship_types").fetchall()
        rt_key_to_id = {r["key"]: r["id"] for r in rt_rows}

        inserted_conns = 0
        for owner, target, type_keys in CONNECTIONS:
            try:
                cur = conn.execute(
                    "INSERT INTO connections (owner_user_id, target_user_id) VALUES (?, ?)",
                    (owner, target),
                )
                conn_id = cur.lastrowid
                for key in type_keys:
                    if key in rt_key_to_id:
                        conn.execute(
                            "INSERT OR IGNORE INTO connection_types (connection_id, relationship_type_id) VALUES (?, ?)",
                            (conn_id, rt_key_to_id[key]),
                        )
                inserted_conns += 1
            except sqlite3.IntegrityError:
                pass  # connection already exists
        print(f"  {inserted_conns}/{len(CONNECTIONS)} connections inserted")

        # Ratings
        inserted_ratings = 0
        dim_rows = conn.execute("SELECT id, key FROM rating_dimensions").fetchall()
        dim_key_to_id = {r["key"]: r["id"] for r in dim_rows}

        for rater, rated, dim_key, score, notes in RATINGS:
            dim_id = dim_key_to_id.get(dim_key)
            if not dim_id:
                continue
            conn.execute(
                """INSERT INTO ratings (rated_user_id, rater_user_id, dimension_id, score, notes)
                   VALUES (?, ?, ?, ?, ?)
                   ON CONFLICT(rated_user_id, rater_user_id, dimension_id) DO UPDATE SET
                     score=excluded.score, notes=excluded.notes""",
                (rated, rater, dim_id, score, notes),
            )
            inserted_ratings += 1
        print(f"  {inserted_ratings}/{len(RATINGS)} ratings upserted")

        conn.commit()
        print("Done.")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--reset", action="store_true", help="Delete and recreate the database before seeding")
    args = parser.parse_args()
    seed(reset=args.reset)
