from bioAI.settings import OLLAMA_BASE_URL, SEARXNG_URL, GEMINI_API_KEY
from langchain_community.utilities import SearxSearchWrapper
from rag.pipeline import ResearchPipeline
from langchain_ollama import ChatOllama
from langchain_ollama import OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from .backends import get_session
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_google_genai import ChatGoogleGenerativeAI


summary = ChatGoogleGenerativeAI(
    model = "gemini-3.5-flash",
    temperature = 0.3,
    top_p = 0.5,
    api_key = GEMINI_API_KEY
)

model = ChatGoogleGenerativeAI(
    model = "gemini-3.5-flash",
    temperature = 0.4,
    top_p = 0.9,
    api_key = GEMINI_API_KEY
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

prompt = ChatPromptTemplate.from_messages(
    [
        ("system", "You are an assistant who is good at {ability}"),
        (MessagesPlaceholder(variable_name="history")),
        ("human", """
                Context related to user's question:
                <context>
                    {content}
                </context> 
                Question that user is asking:
                <question>
                    {question}
                </question>
        """)
    ]
)

chain = prompt | model

chain_with_history = RunnableWithMessageHistory(
    chain,
    get_session,
    input_messages_key="question",
    history_messages_key="history"
)

pipeline = ResearchPipeline(model, summary, search, text_splitter, embeddings, chain_with_history)