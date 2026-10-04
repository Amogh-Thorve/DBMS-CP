import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "STVAMS - Smart Traffic Violation & Vehicle Analytics Management System"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "stvams_super_secret_jwt_key_change_in_production_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Oracle Settings
    ORACLE_USER: str = "stvams_user"
    ORACLE_PASSWORD: str = "stvams_password"
    ORACLE_HOST: str = "localhost"
    ORACLE_PORT: int = 1521
    ORACLE_SERVICE_NAME: str = "FREEPDB1"
    ORACLE_DSN: str = "localhost:1521/FREEPDB1"

    # MongoDB Settings
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "stvams_events"

    # Elasticsearch Settings
    ELASTICSEARCH_HOST: str = "http://localhost:9200"
    ELASTICSEARCH_INDEX: str = "traffic_violations"

    # Analytics
    PARQUET_OUTPUT_DIR: str = "../data/parquet"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
