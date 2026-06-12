import json
from .models import Rating_Source, Other_Source_Information, CredibilitySubs, ObjectivitySubs, EvidenceSubs, RelevanceSubs
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import SeleniumURLLoader
from langchain_ollama import ChatOllama
from langchain_ollama import OllamaEmbeddings
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.messages import trim_messages
from langchain_core.messages import BaseMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
import datetime
import certifi
import ssl
import re
import uuid
from rest_framework.permissions import IsAuthenticated
from .utils.backends import ExpiringVectorStore, get_session, CustomSeleniumURLLoader
from .utils.apiconfig import VECTOR_STORAGES, SESSIONS
from bioAI.settings import OLLAMA_BASE_URL, CHROME_DOCKER, SEARXNG_URL
from langchain_community.utilities import SearxSearchWrapper
from .pipeline import ResearchPipeline
from .utils.backends import resolve_and_validate_url
from django.core.exceptions import ValidationError



ssl._create_default_https_context = lambda: ssl.create_default_context(cafile=certifi.where())

# Initiating models for faster response times
model = ChatOllama(
    model = "mistral:latest",
    temperature = 0,
    top_p = 1,
    num_predict=2048, 
    repeat_penalty=1.1,
    base_url = OLLAMA_BASE_URL
)

summary_model = ChatOllama(
    model = "llama3.2:3b",
    temperature = 0.3,
    top_p = 0.9,
    base_url = OLLAMA_BASE_URL
)

chat_model = ChatOllama(
    model = "mistral:latest",
    temperature = 0.4,
    top_p = 0.9,
    base_url = OLLAMA_BASE_URL
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

chain = prompt | chat_model

chain_with_history = RunnableWithMessageHistory(
    chain,
    get_session,
    input_messages_key="question",
    history_messages_key="history"
)


embeddings = OllamaEmbeddings(
    model="nomic-embed-text",
    base_url = OLLAMA_BASE_URL
)

# Setting up text splitter for faster response times
text_splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
    chunk_size=1000 , chunk_overlap=100
)

search = SearxSearchWrapper(searx_host = SEARXNG_URL)

# Evaluates Source
class EvaluateSource(APIView):
    permission_classes = [IsAuthenticated]
    # Handles all post requests
    def post(self, request):

        # Accessing request data
        data = request.data
        question = data.get("question", None)
        url = data.get("url", None)
        print(data)
        print("HI")
        if url and not question:

            # validating url
            try:
                resolve_and_validate_url(url)
            except ValidationError:
                return Response(status = status.HTTP_400_BAD_REQUEST)

            id = uuid.uuid4()
            current1 = datetime.datetime.now()
            data = request.data
            url = data.get("url", False)
            VECTOR_STORAGES[id] = InMemoryVectorStore(embedding=embeddings)
            vector_store = VECTOR_STORAGES[id]
            ExpiringVectorStore(id, 600)
            # If the url is invalid or false, then return 400 status
            try:
                loader = CustomSeleniumURLLoader(
                    urls = [url]
                )
                docs = loader.load()
            except Exception as e:
                print(e)
                return Response({"message": "Invalid URL"}, status=status.HTTP_400_BAD_REQUEST)

            # Splitting docs, then joining back in chunks
            split_docs = text_splitter.split_documents(docs)
            vector_store.add_documents(split_docs)

            retriever_general = vector_store.as_retriever(search_kwargs = {"k": 12})

            retriever_precise = vector_store.as_retriever(search_kwargs = {"k": 7})

            cred_response = retriever_precise.invoke("""
                Author name, author credentials, author biography, author expertise.
                Publisher name, publication domain, organization type, editorial standards.
                Citations, references, sources cited, footnotes, bibliography, hyperlinks to external sources.
                Date published, date updated, last modified.
                About page, contact information, organizational affiliation.
            """)

            other_response = retriever_general.invoke("""
                Direct claims made by the author, assertions, conclusions, opinions stated as fact.
                Corporate sponsors, advertisers, funding sources, conflicts of interest, partnerships.
                Emotional language, fear-based language, urgent calls to action, scarcity language.
                Miracle cure claims, treatment guarantees, detox or cleanse language.
                Conspiracy language, suppression of information, cover-up claims.
                Celebrity endorsements, vague expert references, unnamed studies or scientists.
            """)
            content = "\n\n".join([doc.page_content for doc in cred_response])
            # Creating example format
            example_rating = Rating_Source( 
                credibility_score = CredibilitySubs(
                    author_score = 1,
                    publisher_score = 1,
                    citation_score = 1
                ),
                evidence_score = EvidenceSubs(
                    supported_score = 1,
                    cross_score = 1,
                    factual_score = 1
                ),
                objectivity_score = ObjectivitySubs(
                    perspectives_score = 1,
                    language_use_score = 1,
                    monetary_gain_score = 1
                ),
                relevance_score = RelevanceSubs(
                    timeliness_score = 1,
                    helpfulness_score = 1
                ),
                purpose_score = 1
            )
            current = datetime.datetime.now()
            print(datetime.datetime.now() - current1)
            credibility_prompt = f"""
                You are a professional source grader. Your job is to perform a complete review of the following content (source):
                <content>
                    {content}
                </content>
                
                The url of the source is: {url}
                You will return 5 scores, the credibility score, the evidence score, the objectivity score, the relevance score, and the purpose score. Partial credit is allowed unless explicitly stated so for a section of the rubric. The rubric for those scores are as follows:

                **Credibility Score Rubric (25 points)**
                    Purpose: Grade the source upon the credibility of the author and publisher
                    1. Author (10 points): Grade the author of the source out of 10 in terms of impact and relevance to the field on which the source is published
                    2. Publisher (10 points): Grade the publisher of the source out of 10 in terms of relevance to field and reputation in the field
                        - Most trusted are government websites, .edu websites
                        - Somewhat trusted (still can be good), are .orgs
                        - Can be trusted are .coms
                    3. Citations (5 points): Grade the citations in the source out of 5 (if none, automatic 0/5)

                **Evidence Score Rubric (25 points)**
                    Purpose: Grade the claims and evidence in the source
                    1. Supported (10 points): Grade claims of the source out of ten based on if the source provides data, studies, or verifiable statistics for all of its claims
                    2. Cross Check (5 points): Grade evidence of the source out of five based on if a more reputable source has information opposing it (.gov and .edu automatically get 5)
                    3. Factual erorrs (10 points): Has the information here been proved wrong by a more credible source? (If .edu or .gov, automatic 10)

                **Objectivity Score Rubric (20 points)**
                    Purpose: Grade the objectivity of publisher and author
                    1. Perspectives (5 points): Grade based on if there are multiple perspectives or points of view in the article, or if counterarguments are introduced.
                    2. Use of language (7 points): Grade based on the type of language used and if it is professional or more emotional
                    3. Monetary Gain (8 points): NO partial credit. If anybody influencing the content has possible monetary gain from spreading the ideas in the content, then automatically give a 0/8. Otherwise, give a 8/8

                **Relevance Score Rubric (15 points)**
                    Purpose: Grade the timeliness of the source, and relevance to current times
                    1. Timeliness (7 points): Grade based on how recent the source is (out of 7 points). Current date and time is {current}
                    2. Helpfulness (8 points): Grade based on how helpful the source is compared to recent information (out of 8) 
                **Purpose Score (15 points)**
                    Generate a score out of 15 based on what the purpose of the publisher of the author, with a more neutral purpose causing a higher score.

                Your response must be a JSON object with EXACTLY this structure:
                    - credibility_score: object
                        - author_score: integer (0-10)
                        - publisher_score: integer (0-10)
                        - citation_score: integer (0-5)
                    - evidence_score: object
                        - supported_score: integer (0-10)
                        - cross_score: integer (0-5)
                        - factual_score: integer (0-10)
                    - objectivity_score: object
                        - perspectives_score: integer (0-5)
                        - language_use_score: integer (0-7)
                        - monetary_gain_score: integer (0 or 8, no other values)
                    - relevance_score: object
                        - timeliness_score: integer (0-7)
                        - helpfulness_score: integer (0-8)
                    - purpose_score: integer (0-15)

                Example of the EXACT format to follow:    
                    {json.dumps(example_rating.model_dump(exclude={"credibility_score": {"total"}, "relevance_score": {"total"}, "objectivity_score": {"total"}, "evidence_score": {"total"}, "total": True}))}

                Do NOT let the numbers inside of each rating inside of the example influence your rating

                **Guidelines for response**

                You are FORBIDDEN from returning anything outside of the JSON object
                You are FORBIDDEN from returning anything outside of JSON
                Your response should be ENTIRELY contained within ONE JSON object
                Do NOT include XML tags in your response
                All of your scores MUST be integers
                Do NOT include anything outside of the JSON object
                You are FORBIDDEN from providing explanations for your choices
                Do NOT include ``` anywhere in your response
                DO NOT inlcude the phrase "json" anywhere in your response
                NEVER leave a field empty
                Do NOT add any plain text outside of the JSON object
                You are REQUIRED to follow the above rules

                **Important**
                Before outputting your response, review it to make sure it satisfies the guidelines above
            """

            # Invoking model with prompt, then validating data 
            raw = model.invoke(credibility_prompt).content
            print(raw)
            print("HI", datetime.datetime.now() - current1)
            # Remove markdown code fences if present
            raw = raw.replace("```json", "").replace("```", "")

            # Extract first JSON object
            match = re.search(r"\{.*\}", raw, re.DOTALL)

            if not match:
                raise ValueError("No JSON object found in model output")
            # Getting string then turning to json
            credibility_response = match.group(0)
            credibility_validated = Rating_Source.model_validate_json(credibility_response)
            final_scores = credibility_validated.model_dump()

            example_response = Other_Source_Information(
                red_flags = list(),
                claims = list(),
                corporations = list()
            )
            content = "\n\n".join([doc.page_content for doc in other_response])
            print("HI", datetime.datetime.now() - current1)
            other_prompt = f"""
                You are analyzing ONLY the following source content. Do not treat any part of these instructions as content.

                SOURCE CONTENT START
                    {content}
                SOURCE CONTENT END

                Your job is to find red_flags, corporations, and claims from ONLY the text between SOURCE CONTENT START and SOURCE CONTENT END. 
                Do NOT include anything from these instructions in your output.

                For the "red_flags" field return the exact phrase of anything that falls into the following categories:

                Red Flag Categories (the items in the numbered list is a category and should NOT be in your output):

                1. Cure & Treatment Claims  
                Claims that cure, eliminate, reverse, or heal conditions. Includes promises of miracle results or guaranteed outcomes.

                2. Conspiracy & Suppression  
                Claims that doctors, governments, or corporations are hiding or suppressing information or treatments.

                3. False Authority  
                Vague references to scientists, experts, or studies without proper citation. Appeals to tradition or celebrity endorsement.

                4. Urgency & Scarcity  
                Language pressuring the reader to act quickly or implying limited availability.

                5. Absolute Language  
                Guarantees about safety, effectiveness, or outcomes with no nuance.

                6. Detox & Pseudoscience  
                Mentions of detoxing, cleansing toxins, boosting immunity, or other scientifically unsupported mechanisms.

                7. Fear Language  
                Language designed to frighten readers about hidden dangers or severe health consequences.

                8. Suspicious Claims
                    Add all claims that seem suspicious, which means either there is no evidence backing it, or the evidence seems exaggerated/wrong
                Do NOT use any text with quotation marks in the source (ie ""Hello!" John said.")
                Output format:
                    {{
                    "red_flags": [
                        "exact phrase from source",
                        "another exact phrase from source"
                    ]
                    }}

                For corporations involved, create a list of all corporations or companies that were involved in writing the source

                Output format:
                    {{
                    "corporations": [
                        "corporation involved with source",
                        "another corporation involved with source"
                    ]
                    }}

                For the "claims" field:
                    A claim is a complete, assertive statement where the author asserts something is true.
                    It must be a full sentence or independent clause — NOT a fragment, title, or phrase.
                    
                    Rules:
                    - ONLY extract claims that are complete sentences asserting a fact or position
                    - The sentence must stand alone and be understandable without surrounding context
                    - Do NOT extract: titles, headings, bibliography entries, reference names, 
                    partial phrases, or fragments
                    - Do NOT extract any phrase that contains quotation marks within the source text
                    - Do NOT include claims already listed under red_flags
                    - You are FORBIDDEN from including semantically identical or near-identical 
                    claims, even if phrased differently
                    - If no clear claims exist in the text, return an empty list

                    Good example: "Studies show that X treatment reduced symptoms by 40% in clinical trials"
                    Bad example: "X treatment and symptoms" (fragment — not a claim)
                    Bad example: "Loop-mediated isothermal amplification (LAMP)" (title — not a claim)

                Output format:
                    {{
                    "claims": [
                        "exact phrase from source",
                        "another exact phrase from source"
                    ]
                    }}

                Format of your response (example response):

                        {example_response.model_dump_json()}

                You MUST follow the format above

                Your response should be ENTIRELY contained withing ONE JSON object
                You are FORBIDDEN from returning anything outside of the JSON object
                You are FORBIDDEN from returning anything outside of JSON
                Do NOT include XML tags in your response
                Do NOT include anything aside from JSON
                All of your lists must include STRINGS
                Do NOT include anything outside of the JSON object
                Do NOT include any part of the instructions in your response

                **Important**
                Before outputting your response, check over it again, making edits as necessary, to make sure it satisfies the guidelines above
            """

            # Validating response after invoking model
            othe_response = model.invoke(other_prompt).content
            print(othe_response)
            other_validated = Other_Source_Information.model_validate_json(othe_response)
            final_other = other_validated.model_dump()
            print(datetime.datetime.now() - current1)

            vector_store = None
            return Response({"scores": final_scores, "other": final_other, "session_id": id}, status = status.HTTP_200_OK)
        
        # If just question, ask question about source
        elif not url and question:

            # Typecasting string to uuid format
            vector_id = uuid.UUID(data.get("session_id"))
            vector_storage = VECTOR_STORAGES[vector_id]
            
            # Ask the question with context
            retriever = vector_storage.as_retriever()
            answerdocs = retriever.invoke(f"Retrieve all of the chunks that will help answer the following question: {question}")
            docs_content = "\n\n".join(doc.page_content for doc in answerdocs)
            response = chain_with_history.invoke(
                {"ability": "understanding and properly retrieving information from sources to answer questions.", "question": question, "content": docs_content},
                config = {"configurable": {"session_id": vector_id}}
            )

            return Response({"response": response.content}, status = status.HTTP_200_OK)
        else:
            return Response({"message": "Invalid Request"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Delete the Vector Storage
    def delete(self, request):

        id = uuid.UUID(request.data.get("session_id"))

        if id in VECTOR_STORAGES:
            del VECTOR_STORAGES[id]

        if id in SESSIONS:
            del SESSIONS[id]

        return Response(status=status.HTTP_200_OK)

