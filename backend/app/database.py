import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

# 1. URL uthaiye
DATABASE_URL = os.getenv("DATABASE_URL")

# 🧐 Pragmatic Check: Agar URL nahi hai toh error de do, localhost par mat jao
if not DATABASE_URL:
    raise ValueError("CRITICAL ERROR: DATABASE_URL not found in environment variables!")

# 2. Render Postgres fix (Kabhi kabhi Render 'postgres://' deta hai, SQLAlchemy ko 'postgresql://' chahiye)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# 3. Engine banaiye
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()