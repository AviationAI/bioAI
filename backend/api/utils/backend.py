from ..apiconfig import VECTOR_STORAGES
import threading

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

def retriever():
    pass

