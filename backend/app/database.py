import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 1. Direct environment variable uthaiye (Render dashboard se)
DATABASE_URL = os.getenv("DATABASE_URL")

# 🧐 Pragmatic Check: Agar URL nahi hai toh app ko wahi rok do
if not DATABASE_URL:
    raise ValueError("Saniya, DATABASE_URL Render dashboard mein missing hai!")

# 🚨 Render Fix: 'postgres://' ko 'postgresql://' mein badalna zaroori hai
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# 2. Engine Create karein
# Port 5000 ka jhamela yahan se khatam ho jayega
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()