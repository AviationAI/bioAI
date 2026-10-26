import redis

from bioAI.settings import VECTOR_STORAGE_URL
from bioAI.settings import MESSAGES_URL

# VECTOR_STORAGES is where the vector storages will be stored

VECTOR_STORAGES = redis.from_url(VECTOR_STORAGE_URL)

# Sessions is where chatlogs are going to be stored 
SESSIONS = redis.from_url(MESSAGES_URL)    