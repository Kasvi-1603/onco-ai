from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    groq_api_key: str = ""
    groq_model: str = "llama-3.1-70b-versatile"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3"
    database_url: str = "./oncopilot.db"
    next_public_api_url: str = "http://localhost:8000"
    demo_patient: bool = False

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()