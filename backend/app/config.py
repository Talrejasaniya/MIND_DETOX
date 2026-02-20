from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SECRET_KEY: str
    algorithm: str
    database_url: str
    sqlalchemy_database_url_test: str
    GEMINI_API_KEY: str
    access_token_expire_minutes: int 

    class Config:
        env_file = ".env"
        # Agar tum chahti ho ki extra keys se error na aaye, toh ye add kar sakti ho:
        # extra = "ignore" 

settings = Settings()