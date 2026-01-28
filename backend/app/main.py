from fastapi import FastAPI
# Relative '.' hata kar absolute imports use karo
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api import auth 
from app import models, database
import os

# 1. 'main.py' ka rasta nikaalo (backend/app/)
current_dir = os.path.dirname(os.path.abspath(__file__))

# 2. Do level piche jao 'Mind-Detox-2026' tak pahunchne ke liye
# backend/app -> backend -> Mind-Detox-2026
root_dir = os.path.dirname(os.path.dirname(current_dir))

# 3. 'frontend' folder ka pura rasta banao
frontend_path = os.path.join(root_dir, "frontend")
# Database tables create karna
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Mind Detox API")
origins = [
    "http://localhost:8000",
    "https://your-app-name.onrender.com", # Deployment ke baad wala URL yahan dalo
]
# 1. CORS Setup (Essential for Frontend-Backend connection)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Frontend folder ko mount karo
# Ensure karo ki 'frontend' folder main.py ke saath hi ho
app.mount("/app", StaticFiles(directory=frontend_path, html=True), name="static")# Routes include karna
app.include_router(auth.router)

@app.get("/")
def read_root():
    return {"message" : "Welcome to the Mind Detox API"}