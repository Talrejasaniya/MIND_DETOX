import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base


DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    print(f"DEBUG: Database URL found! Starts with: {DATABASE_URL[:15]}...")
else:
    print("DEBUG: DATABASE_URL IS MISSING IN RENDER!")
    raise ValueError("DATABASE_URL not found in Environment Variables")

# Render fix (postgres -> postgresql)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()