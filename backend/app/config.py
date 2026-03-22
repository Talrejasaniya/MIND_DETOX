from pydantic_settings import BaseSettings
import os
from dotenv import load_dotenv

load_dotenv() # .env file load karne ke liye

class Settings(BaseSettings):
    # Default values dene se "Arguments missing" wala error chala jayega
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 2))
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    SQLALCHEMY_DATABASE_URL_TEST: str = os.getenv("SQLALCHEMY_DATABASE_URL_TEST", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    class Config:
        env_file = ".env"

# Ise call karte waqt ab arguments nahi mangega
settings = Settings()