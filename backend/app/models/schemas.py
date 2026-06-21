from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# ---------- Plant Schemas ----------
class PlantCreate(BaseModel):
    name: str
    species: str
    age: Optional[str] = None
    location: Optional[str] = None


class PlantResponse(BaseModel):
    id: int
    name: str
    species: str
    age: Optional[str]
    location: Optional[str]
    personality: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Chat Schemas ----------
class ChatMessageRequest(BaseModel):
    plant_id: int
    message: str
    session_id: Optional[int] = None  # kalau None, berarti sesi baru


class ChatMessageResponse(BaseModel):
    session_id: int
    reply: str
    is_complete: bool
    diagnosis: Optional[dict] = None
    recommendation: Optional[str] = None


# ---------- Care History Schemas ----------
class CareHistoryResponse(BaseModel):
    id: int
    plant_id: int
    symptom_summary: Optional[str]
    diagnosis: Optional[str]
    recommendation: Optional[str]
    health_status: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True