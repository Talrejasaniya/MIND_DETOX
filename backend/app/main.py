from fastapi import FastAPI
# Relative '.' hata kar absolute imports use karo
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api import auth , journal ,ai,analysis
from app import models, database
import os

current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
frontend_path = os.path.join(backend_dir, "frontend")
# Database tables create karna
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Mind Detox API")
origins = ["*"] 

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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