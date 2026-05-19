from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routes import (
    graph,
    users,
    connections,
    relationship_types,
    rating_dimensions,
    ratings,
    positions,
    picker,
)

relmap_app = FastAPI(title="Relationship Map API", version="0.1.0")

relmap_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Order matters: /users/search must be registered before /users/{user_id}
relmap_app.include_router(users.router)
relmap_app.include_router(connections.router)
relmap_app.include_router(relationship_types.router)
relmap_app.include_router(rating_dimensions.router)
relmap_app.include_router(ratings.router)
relmap_app.include_router(positions.router)
relmap_app.include_router(graph.router)
relmap_app.include_router(picker.router)


@relmap_app.on_event("startup")
def on_startup():
    init_db()


# Stand-alone entry point (python main.py or uvicorn main:app)
app = FastAPI(title="Host App")
app.mount("/relmap", relmap_app)


@app.get("/")
def root():
    return {"message": "Relationship Map host app. API available at /relmap"}
