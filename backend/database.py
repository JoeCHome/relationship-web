import sqlite3
import os

DB_PATH = os.environ.get("RELMAP_DB_PATH", "./relmap.db")

RELATIONSHIP_TYPE_SEEDS = [
    ("spouse_partner", "Spouse / Partner", "#7F77DD", "solid",  1),
    ("family",         "Family",           "#534AB7", "solid",  2),
    ("best_friend",    "Best Friend",      "#1D9E75", "solid",  3),
    ("friend",         "Friend",           "#5DCAA5", "solid",  4),
    ("romantic",       "Romantic",         "#D4537E", "dashed", 5),
    ("colleague",      "Colleague",        "#378ADD", "solid",  6),
    ("manager_report", "Manager / Report", "#0C447C", "dashed", 7),
    ("mentor_mentee",  "Mentor / Mentee",  "#BA7517", "solid",  8),
    ("vendor",         "Vendor",           "#D85A30", "solid",  9),
    ("customer_client","Customer / Client","#993C1D", "dashed", 10),
    ("neighbor",       "Neighbor",         "#639922", "solid",  11),
    ("classmate_alumni","Classmate / Alumni","#97C459","dashed",12),
    ("acquaintance",   "Acquaintance",     "#888780", "dashed", 13),
]

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id           TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    photo_url    TEXT,
    host_user_id TEXT NOT NULL,
    notes        TEXT,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS relationship_types (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    key        TEXT NOT NULL UNIQUE,
    name       TEXT NOT NULL,
    color_hex  TEXT NOT NULL,
    edge_style TEXT NOT NULL DEFAULT 'solid',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active  BOOLEAN NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS connections (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_user_id  TEXT NOT NULL REFERENCES users(id),
    target_user_id TEXT NOT NULL REFERENCES users(id),
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(owner_user_id, target_user_id)
);

CREATE TABLE IF NOT EXISTS connection_types (
    connection_id        INTEGER NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
    relationship_type_id INTEGER NOT NULL REFERENCES relationship_types(id),
    PRIMARY KEY (connection_id, relationship_type_id)
);

CREATE TABLE IF NOT EXISTS rating_dimensions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    key        TEXT NOT NULL UNIQUE,
    label      TEXT NOT NULL,
    icon       TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ratings (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    rated_user_id TEXT NOT NULL REFERENCES users(id),
    rater_user_id TEXT NOT NULL REFERENCES users(id),
    dimension_id  INTEGER NOT NULL REFERENCES rating_dimensions(id),
    score         REAL NOT NULL CHECK(score >= 0 AND score <= 5),
    notes         TEXT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rated_user_id, rater_user_id, dimension_id)
);

CREATE TABLE IF NOT EXISTS node_positions (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_user_id  TEXT NOT NULL REFERENCES users(id),
    target_user_id TEXT NOT NULL REFERENCES users(id),
    pos_x          REAL NOT NULL DEFAULT 0,
    pos_y          REAL NOT NULL DEFAULT 0,
    is_pinned      BOOLEAN NOT NULL DEFAULT 0,
    UNIQUE(owner_user_id, target_user_id)
);
"""


def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        for statement in SCHEMA.strip().split(";"):
            s = statement.strip()
            if s:
                conn.execute(s)
        for seed in RELATIONSHIP_TYPE_SEEDS:
            conn.execute(
                """INSERT OR IGNORE INTO relationship_types
                   (key, name, color_hex, edge_style, sort_order)
                   VALUES (?, ?, ?, ?, ?)""",
                seed,
            )
        conn.commit()
    finally:
        conn.close()
