import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 1. Environment se URL uthayein
db_url = os.getenv("DATABASE_URL")

# 🧐 Pragmatic Check: Agar URL nahi mila toh app ko chalao hi mat
if not db_url:
    print("❌ FATAL ERROR: DATABASE_URL is NOT SET in Render Environment!")
    # Isse logs mein saaf dikhega ki variable missing hai
    sys.exit(1) 

# 🚨 Render postgres:// fix
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

print(f"✅ Database URL found. Connecting to host: {db_url.split('@')[-1].split(':')[0]}")

# 2. Engine Create karein
engine = create_engine(db_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()