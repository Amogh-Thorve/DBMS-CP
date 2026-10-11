import sys
import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import StaticPool
from app.config.settings import settings

logger = logging.getLogger("stvams.db")

Base = declarative_base()

# Construct Oracle SQLAlchemy URL or fallback to SQLite engine
ORACLE_DATABASE_URL = f"oracle+oracledb://{settings.ORACLE_USER}:{settings.ORACLE_PASSWORD}@{settings.ORACLE_HOST}:{settings.ORACLE_PORT}/?service_name={settings.ORACLE_SERVICE_NAME}"

is_testing = "pytest" in sys.modules or os.environ.get("TESTING") == "1"

try:
    if is_testing:
        raise ConnectionError("Testing mode active - utilizing in-memory SQLite.")
    engine = create_engine(ORACLE_DATABASE_URL, pool_pre_ping=True)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception as e:
    root_db = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../stvams_dev.db"))
    backend_db = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../stvams_dev.db"))
    chosen_path = root_db if os.path.exists(root_db) else backend_db
    norm_path = chosen_path.replace("\\", "/")
    db_url = "sqlite:///:memory:" if is_testing else f"sqlite:///{norm_path}"
    logger.warning(f"Database connection fallback: {e}. Utilizing {db_url}.")
    if is_testing:
        engine = create_engine(
            db_url,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool
        )
    else:
        engine = create_engine(
            db_url,
            connect_args={"check_same_thread": False}
        )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
