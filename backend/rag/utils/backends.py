from .apiconfig import VECTOR_STORAGES, SESSIONS
from langchain_core.chat_history import InMemoryChatMessageHistory
import threading
import uuid
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from bioAI.settings import CHROME_DOCKER
from langchain_community.document_loaders import SeleniumURLLoader
import joblib 
import os
from .classification_training.main import train

# With an id & time, this class deletes a vector store after a custom time limit ends
class ExpiringVectorStore:
    def __init__(self, id, time):
        self.id = id
        self.time = time
        self.timer = threading.Timer(self.time, self.expire)
        self.timer.start()
    def expire(self):
        if self.id in VECTOR_STORAGES:
            del VECTOR_STORAGES[self.id]

# Custom SeleniumURLLoader with driver customized
class CustomSeleniumURLLoader(SeleniumURLLoader):
    def _get_driver(self):

        options = Options()
        options.add_argument("--headless")

        driver = webdriver.Remote(
            command_executor = CHROME_DOCKER,
            options = options
        )
        return driver

# This gets a session by its id, and if none exists, created one in its place
def get_session(session_id: uuid.UUID) -> InMemoryChatMessageHistory:
    if session_id not in SESSIONS:
        SESSIONS[session_id] = InMemoryChatMessageHistory()
    return SESSIONS[session_id]

def get_classifier():

    # Training and returning model
    model = train()

    return model