import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 1. Variable uthayein
db_url = os.getenv("DATABASE_URL")
if db_url:
    host_part = db_url.split('@')[-1] if '@' in db_url else "MISSING HOST"
    print(f"DEBUG: Connecting to host -> {host_part}")
# 🧐 Saniya, ye check karega ki URL mila ya nahi
if db_url is None:
    print("❌ ERROR: Render dashboard mein DATABASE_URL missing hai!")
    # App ko yahi rok do taaki crash na ho
    sys.exit("Stopping: DATABASE_URL not found.")

# 2. Agar mil gaya, tabhi slice ya replace karein
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

print(f"✅ Database URL found! Connecting...")
engine = create_engine(db_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()