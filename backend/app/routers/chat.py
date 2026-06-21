import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.models import Plant, ChatSession, CareHistory
from app.models.schemas import ChatMessageRequest, ChatMessageResponse
from app.graph.plant_graph import plant_graph

router = APIRouter(prefix="/chat", tags=["chat"])


def determine_health_status(severity: str) -> str:
    severity_lower = severity.lower()
    if "ringan" in severity_lower:
        return "perlu perhatian"
    elif "berat" in severity_lower or "parah" in severity_lower:
        return "kritis"
    elif "sedang" in severity_lower:
        return "perlu perhatian"
    return "sehat"


@router.post("/", response_model=ChatMessageResponse)
def send_message(payload: ChatMessageRequest, db: Session = Depends(get_db)):
    plant = db.query(Plant).filter(Plant.id == payload.plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Tanaman tidak ditemukan")

    # Ambil atau buat sesi chat
    if payload.session_id:
        session = db.query(ChatSession).filter(ChatSession.id == payload.session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Sesi chat tidak ditemukan")
        session_data = json.loads(session.messages) if session.messages else {}
        messages = session_data.get("messages", [])
        followup_count = session_data.get("followup_count", 0)
    else:
        session = ChatSession(plant_id=plant.id, messages="{}", status="ongoing")
        db.add(session)
        db.commit()
        db.refresh(session)
        messages = []
        followup_count = 0

    # Tambahkan pesan user ke riwayat
    messages.append({"role": "user", "content": payload.message})

    # Jalankan LangGraph
    state = {
        "plant_name": plant.name,
        "species": plant.species,
        "personality": plant.personality,
        "messages": messages,
        "is_complete": False,
        "diagnosis": None,
        "recommendation": None,
        "reply": "",
        "followup_count": followup_count,
    }

    result = plant_graph.invoke(state)

    # Simpan update sesi (messages + followup_count digabung dalam satu JSON)
    session.messages = json.dumps({
        "messages": result["messages"],
        "followup_count": result.get("followup_count", followup_count),
    })
    session.status = "diagnosed" if result["is_complete"] else "ongoing"
    db.commit()

    # Kalau sudah selesai diagnosis, simpan ke care_history
    if result["is_complete"] and result.get("diagnosis"):
        diagnosis = result["diagnosis"]
        health_status = determine_health_status(diagnosis.get("severity", ""))

        care_entry = CareHistory(
            plant_id=plant.id,
            symptom_summary=payload.message,
            diagnosis=json.dumps(diagnosis),
            recommendation=result.get("recommendation"),
            health_status=health_status,
        )
        db.add(care_entry)
        db.commit()

    return ChatMessageResponse(
        session_id=session.id,
        reply=result["reply"],
        is_complete=result["is_complete"],
        diagnosis=result.get("diagnosis"),
        recommendation=result.get("recommendation"),
    )

@router.get("/latest/{plant_id}")
def get_latest_session(plant_id: int, db: Session = Depends(get_db)):
    session = (
        db.query(ChatSession)
        .filter(ChatSession.plant_id == plant_id)
        .order_by(ChatSession.created_at.desc())
        .first()
    )
    if not session:
        return {"session_id": None, "messages": [], "is_complete": False}

    session_data = json.loads(session.messages) if session.messages else {}
    messages = session_data.get("messages", [])

    return {
        "session_id": session.id,
        "messages": messages,
        "is_complete": session.status == "diagnosed",
    }