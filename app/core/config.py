from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "LeadSpawn"
    environment: str = "development"
    debug: bool = True
    google_places_api_key: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
