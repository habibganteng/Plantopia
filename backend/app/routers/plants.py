from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.models import Plant
from app.models.schemas import PlantCreate, PlantResponse
from app.graph.prompts import get_personality

router = APIRouter(prefix="/plants", tags=["plants"])


@router.post("/", response_model=PlantResponse)
def create_plant(plant: PlantCreate, db: Session = Depends(get_db)):
    personality = get_personality(plant.species)

    new_plant = Plant(
        name=plant.name,
        species=plant.species,
        age=plant.age,
        location=plant.location,
        personality=personality,
    )
    db.add(new_plant)
    db.commit()
    db.refresh(new_plant)
    return new_plant


@router.get("/", response_model=List[PlantResponse])
def get_all_plants(db: Session = Depends(get_db)):
    return db.query(Plant).all()


@router.get("/{plant_id}", response_model=PlantResponse)
def get_plant(plant_id: int, db: Session = Depends(get_db)):
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Tanaman tidak ditemukan")
    return plant


@router.put("/{plant_id}", response_model=PlantResponse)
def update_plant(plant_id: int, plant_data: PlantCreate, db: Session = Depends(get_db)):
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Tanaman tidak ditemukan")

    plant.name = plant_data.name
    plant.species = plant_data.species
    plant.age = plant_data.age
    plant.location = plant_data.location
    plant.personality = get_personality(plant_data.species)

    db.commit()
    db.refresh(plant)
    return plant


@router.delete("/{plant_id}")
def delete_plant(plant_id: int, db: Session = Depends(get_db)):
    plant = db.query(Plant).filter(Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Tanaman tidak ditemukan")

    db.delete(plant)
    db.commit()
    return {"message": "Tanaman berhasil dihapus"}

@router.get("/with-status/all")
def get_plants_with_status(db: Session = Depends(get_db)):
    from app.models.models import CareHistory

    plants = db.query(Plant).all()
    result = []
    total_score = 0
    score_count = 0

    score_map = {"sehat": 90, "perlu perhatian": 55, "kritis": 20}

    for plant in plants:
        latest = (
            db.query(CareHistory)
            .filter(CareHistory.plant_id == plant.id)
            .order_by(CareHistory.created_at.desc())
            .first()
        )
        health_status = latest.health_status if latest else "belum ada data"
        score = score_map.get(health_status, 70)
        total_score += score
        score_count += 1

        result.append({
            "id": plant.id,
            "name": plant.name,
            "species": plant.species,
            "personality": plant.personality,
            "health_status": health_status,
        })

    avg_score = round(total_score / score_count) if score_count > 0 else 0

    return {
        "plants": result,
        "stats": {
            "total_plants": len(plants),
            "average_health_score": avg_score,
            "critical_count": len([p for p in result if p["health_status"] == "kritis"]),
            "attention_count": len([p for p in result if p["health_status"] == "perlu perhatian"]),
        }
    }