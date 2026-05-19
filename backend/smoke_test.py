import os
os.environ["RELMAP_DB_PATH"] = "./test_smoke.db"

from fastapi.testclient import TestClient
from database import init_db
from main import relmap_app

init_db()
client = TestClient(relmap_app)

r = client.get("/relationship-types")
assert r.status_code == 200
assert len(r.json()) == 13
print("relationship-types: {} types OK".format(len(r.json())))

for uid, name, host in [("u1", "Alice", "h1"), ("u2", "Bob", "h2"), ("u3", "Carol", "h3")]:
    r = client.post("/users", json={"id": uid, "display_name": name, "host_user_id": host})
    assert r.status_code == 201
print("users: create OK")

r = client.post("/connections", json={"owner_user_id": "u1", "target_user_id": "u2", "types": ["friend"]})
assert r.status_code == 201
conn_id = r.json()["id"]
assert r.json()["types"] == ["friend"]
print("connections: create OK (id={})".format(conn_id))

r = client.put("/connections/{}/types".format(conn_id), json={"types": ["friend", "colleague"]})
assert r.status_code == 200
assert set(r.json()["types"]) == {"friend", "colleague"}
print("connections: update types OK")

r = client.post("/rating-dimensions", json={"dimensions": [
    {"key": "borrower", "label": "Borrower", "sort_order": 1},
    {"key": "lender",   "label": "Lender",   "sort_order": 2},
]})
assert r.status_code == 200
print("rating-dimensions: upsert OK")

r = client.post("/ratings", json={"rated_user_id": "u2", "rater_user_id": "u1", "dimension_key": "borrower", "score": 4.5})
assert r.status_code == 201
print("ratings: submit OK")

r = client.get("/graph/u1")
assert r.status_code == 200
g = r.json()
assert any(u["id"] == "u1" for u in g["users"])
assert any(u["id"] == "u2" for u in g["users"])
assert len(g["edges"]) == 1
assert len(g["ratings"]) == 1
print("graph: OK ({} users, {} edges, {} ratings)".format(len(g["users"]), len(g["edges"]), len(g["ratings"])))

r = client.post("/connections", json={"owner_user_id": "u2", "target_user_id": "u3", "types": ["friend"]})
assert r.status_code == 201

r = client.get("/picker/u1?max_depth=2&types=friend&require_along_path=true")
assert r.status_code == 200
p = r.json()
eligible_ids = [e["id"] for e in p["eligible"]]
assert "u2" in eligible_ids
assert "u3" in eligible_ids
print("picker: OK ({} eligible: {})".format(len(eligible_ids), eligible_ids))

r = client.get("/users/search?q=bo")
assert r.status_code == 200
assert any(u["id"] == "u2" for u in r.json())
print("users/search: OK")

r = client.put("/positions/u1", json={"positions": [{"target_user_id": "u2", "pos_x": 100.0, "pos_y": 200.0, "is_pinned": False}]})
assert r.status_code == 200
r = client.get("/positions/u1")
assert r.status_code == 200
assert r.json()[0]["pos_x"] == 100.0
print("positions: OK")

os.remove("./test_smoke.db")
print("ALL TESTS PASSED")
