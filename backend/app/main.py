from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import engine, Base
from app.routers import plants, chat, history

# Buat semua tabel di database (kalau belum ada)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Plantopia API", description="API untuk companion tanaman berbasis AI")

# CORS supaya frontend (React) bisa akses backend ini
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # nanti bisa dibatasi ke domain frontend spesifik
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Daftarkan semua router
app.include_router(plants.router)
app.include_router(chat.router)
app.include_router(history.router)


@app.get("/")
def root():
    return {"message": "Plantopia API is running 🌱"}