import os 
from sqlalchemy import create_engine 
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from typing import cast

load_dotenv()

DATABASE_URL=os.getenv("DATABASE_URL")

db_url = cast(str, os.getenv("DATABASE_URL"))
engine = create_engine(db_url)
SessionLocal = sessionmaker(autocommit=False,autoflush=False,bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
Base = declarative_base()