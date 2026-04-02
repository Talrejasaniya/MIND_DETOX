from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api import auth , journal ,ai,analysis
from app import models, database
import os
# 1. Path Setup (More robust)
current_file_path = os.path.abspath(__file__) # backend/app/main.py
app_dir = os.path.dirname(current_file_path)   # backend/app
backend_dir = os.path.dirname(app_dir)         # backend
# Agar frontend root mein hai:
root_dir = os.path.dirname(backend_dir) 
frontend_path = os.path.join(root_dir, "frontend")

# 2. Database Creation (Top level is okay but risky, ensure DB_URL is perfect)
try:
    models.Base.metadata.create_all(bind=database.engine)
    print("✅ Database tables checked/created.")
except Exception as e:
    print(f"❌ DB Error during startup: {e}")

app = FastAPI(title="Mind Detox API")

# 3. Middlewares
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True, 
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router,prefix="/api/v1")
app.include_router(journal.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1",)
app.include_router(analysis.router, prefix="/api/v1")
app.mount("/", StaticFiles(directory=frontend_path, html=True), name="static")# Routes include karna

@app.get("/")
def read_root():
    return {"message" : "Welcome to the Mind Detox API"}