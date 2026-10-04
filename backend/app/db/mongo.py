import logging
from app.config.settings import settings

logger = logging.getLogger("stvams.mongo")

try:
    from pymongo import MongoClient
    mongo_client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=2000)
    mongo_db = mongo_client[settings.MONGODB_DB_NAME]
except Exception as e:
    logger.warning(f"MongoDB driver or connection unavailable: {e}")
    mongo_client = None
    mongo_db = None

def get_mongo_db():
    return mongo_db
