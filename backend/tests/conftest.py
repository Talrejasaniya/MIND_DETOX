import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db
from fastapi.testclient import TestClient
from dotenv import load_dotenv
import os 
load_dotenv()
SQLALCHEMY_DATABASE_URL_TEST = os.getenv("SQLALCHEMY_DATABASE_URL_TEST")

engine = create_engine(SQLALCHEMY_DATABASE_URL_TEST)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    """Create tables, yield a session, and drop tables after each test."""
    Base.metadata.create_all(bind=engine) # Create tables for testing
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine) # Cleanup: Delete everything after test

@pytest.fixture(scope="function")
def client(db_session):
    """Override the get_db dependency to use the test database."""
    def override_get_db():
        try:
            yield db_session
        finally:
            db_session.close()
    
    # This is the magic: Swapping the real DB with the test DB
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear() # Reset after test