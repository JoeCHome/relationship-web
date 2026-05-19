from typing import Optional, List
from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    id: str
    display_name: str
    photo_url: Optional[str] = None
    host_user_id: str
    notes: Optional[str] = None


class User(UserCreate):
    created_at: str


class RelationshipType(BaseModel):
    id: int
    key: str
    name: str
    color_hex: str
    edge_style: str
    sort_order: int
    is_active: bool


class ConnectionCreate(BaseModel):
    owner_user_id: str
    target_user_id: str
    types: List[str] = []


class ConnectionTypesUpdate(BaseModel):
    types: List[str]


class Connection(BaseModel):
    id: int
    owner_user_id: str
    target_user_id: str
    types: List[str]
    created_at: str


class RatingDimensionUpsert(BaseModel):
    key: str
    label: str
    icon: Optional[str] = None
    sort_order: int = 0


class RatingDimensionsBatch(BaseModel):
    dimensions: List[RatingDimensionUpsert]


class RatingDimension(RatingDimensionUpsert):
    id: int


class RatingCreate(BaseModel):
    rated_user_id: str
    rater_user_id: str
    dimension_key: str
    score: float = Field(ge=0, le=5)
    notes: Optional[str] = None


class Rating(BaseModel):
    id: int
    rated_user_id: str
    rater_user_id: str
    dimension_key: str
    score: float
    notes: Optional[str]
    created_at: str


class NodePositionItem(BaseModel):
    target_user_id: str
    pos_x: float
    pos_y: float
    is_pinned: bool = False


class NodePositionsBatch(BaseModel):
    positions: List[NodePositionItem]


# Graph response types

class GraphUser(BaseModel):
    id: str
    display_name: str
    photo_url: Optional[str]
    host_user_id: str
    notes: Optional[str]
    pos_x: Optional[float] = None
    pos_y: Optional[float] = None
    is_pinned: bool = False
    connection_count: int = 0


class GraphEdgeType(BaseModel):
    key: str
    name: str
    color_hex: str
    edge_style: str


class GraphEdge(BaseModel):
    id: int
    owner_user_id: str
    target_user_id: str
    types: List[GraphEdgeType]


class GraphResponse(BaseModel):
    users: List[GraphUser]
    edges: List[GraphEdge]
    ratings: List[Rating]
    relationship_types: List[RelationshipType]


# Picker response types

class PickerUser(BaseModel):
    id: str
    display_name: str
    photo_url: Optional[str]
    host_user_id: str
    hop_count: int
    path: List[str]


class PickerResponse(BaseModel):
    eligible: List[PickerUser]
    total_in_graph: int
