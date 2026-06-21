from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.models import Plant, CareHistory
from app.models.schemas import CareHistoryResponse

router = APIRouter(prefix="/history", tags=["history"])


@router.get("/{plant_id}", response_model=List[CareHistoryResponse])
def get_plant_history(plant_id: int, db: Session = Depends(get_db)):
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Tanaman tidak ditemukan")

    history = (
        db.query(CareHistory)
        .filter(CareHistory.plant_id == plant_id)
        .order_by(CareHistory.created_at.desc())
        .all()
    )
    return history


@router.get("/{plant_id}/latest", response_model=CareHistoryResponse)
def get_latest_status(plant_id: int, db: Session = Depends(get_db)):
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Tanaman tidak ditemukan")

    latest = (
        db.query(CareHistory)
        .filter(CareHistory.plant_id == plant_id)
        .order_by(CareHistory.created_at.desc())
        .first()
    )
    if not latest:
        raise HTTPException(status_code=404, detail="Belum ada riwayat untuk tanaman ini")
    return latest

# Mapping health_status ke mood & skor kesehatan (dipakai di Dashboard UI)
MOOD_MAP = {
    "sehat": {"mood": "Segar", "emoji": "🌿", "score": 90},
    "perlu perhatian": {"mood": "Butuh Perhatian", "emoji": "😟", "score": 55},
    "kritis": {"mood": "Kritis", "emoji": "🥀", "score": 20},
}


@router.get("/{plant_id}/dashboard")
def get_dashboard(plant_id: int, db: Session = Depends(get_db)):
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Tanaman tidak ditemukan")

    latest = (
        db.query(CareHistory)
        .filter(CareHistory.plant_id == plant_id)
        .order_by(CareHistory.created_at.desc())
        .first()
    )

    if not latest:
        # Belum ada riwayat diagnosis sama sekali, anggap masih sehat/netral
        mood_info = {"mood": "Belum Diketahui", "emoji": "🌱", "score": 70}
        health_status = "belum ada data"
        last_diagnosis = None
        last_recommendation = None
        last_checked = None
    else:
        mood_info = MOOD_MAP.get(latest.health_status, MOOD_MAP["sehat"])
        health_status = latest.health_status
        last_diagnosis = latest.diagnosis
        last_recommendation = latest.recommendation
        last_checked = latest.created_at

    return {
        "plant_id": plant.id,
        "plant_name": plant.name,
        "species": plant.species,
        "personality": plant.personality,
        "health_status": health_status,
        "mood": mood_info["mood"],
        "mood_emoji": mood_info["emoji"],
        "health_score": mood_info["score"],
        "last_diagnosis": last_diagnosis,
        "last_recommendation": last_recommendation,
        "last_checked": last_checked,
    }