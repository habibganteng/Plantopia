from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class Plant(Base):
    __tablename__ = "plants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    species = Column(String, nullable=False)
    age = Column(String, nullable=True)
    location = Column(String, nullable=True)  # indoor/outdoor
    personality = Column(String, nullable=False)  # judes, dramatis, kalem, dll
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    chat_sessions = relationship("ChatSession", back_populates="plant")
    care_history = relationship("CareHistory", back_populates="plant")


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    plant_id = Column(Integer, ForeignKey("plants.id"))
    messages = Column(Text, nullable=True)  # disimpan sebagai JSON string
    status = Column(String, default="ongoing")  # ongoing / diagnosed
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    plant = relationship("Plant", back_populates="chat_sessions")


class CareHistory(Base):
    __tablename__ = "care_history"

    id = Column(Integer, primary_key=True, index=True)
    plant_id = Column(Integer, ForeignKey("plants.id"))
    symptom_summary = Column(Text, nullable=True)
    diagnosis = Column(Text, nullable=True)
    recommendation = Column(Text, nullable=True)
    health_status = Column(String, nullable=True)  # sehat / perlu perhatian / kritis
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    plant = relationship("Plant", back_populates="care_history")