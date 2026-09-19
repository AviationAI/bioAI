from bioAI.settings import OLLAMA_BASE_URL, SEARXNG_URL
from langchain_community.utilities import SearxSearchWrapper
from rag.pipeline import ResearchPipeline
from langchain_ollama import ChatOllama
from langchain_ollama import OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter


chat = ChatOllama(
    model = "llama3.2:3b",
    temperature = 0.3,
    top_p = 0.4,
    base_url=OLLAMA_BASE_URL
)

model = ChatOllama(
    model = "mistral:latest",
    temperature = 0.4,
    top_p = 0.9,
    base_url = OLLAMA_BASE_URL
)

search = SearxSearchWrapper(searx_host = SEARXNG_URL)

embeddings = OllamaEmbeddings(
    model="nomic-embed-text",
    base_url = OLLAMA_BASE_URL
)

# Setting up text splitter for faster response times
text_splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
    chunk_size=1000 , chunk_overlap=100
)

pipeline = ResearchPipeline(model, chat, search, text_splitter, embeddings)