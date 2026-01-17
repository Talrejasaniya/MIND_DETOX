from fastapi import FastAPI
from .api import auth
from . import models,database 

models.Base.metadata.create_all(bind=database.engine)

app= FastAPI(title="Mind Detox API")

app.include_router(auth.router)

@app.get("/")
def read_root():
    return {"message" : "Welcome to the Mind Detox API"}