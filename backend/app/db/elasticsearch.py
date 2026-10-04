import logging
from app.config.settings import settings

logger = logging.getLogger("stvams.elasticsearch")

try:
    from elasticsearch import Elasticsearch
    es_client = Elasticsearch(settings.ELASTICSEARCH_HOST, request_timeout=2)
except Exception as e:
    logger.warning(f"Elasticsearch driver or connection unavailable: {e}")
    es_client = None

def get_es_client():
    return es_client
