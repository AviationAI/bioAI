import json
from .models import Subtopic_List, Subtopic
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
import logging
import uuid
from rest_framework.permissions import IsAuthenticated
from .utils.backends import ExpiringVectorStore, get_session, CustomSeleniumURLLoader
from .utils.apiconfig import VECTOR_STORAGES, SESSIONS
from langchain_community.utilities import SearxSearchWrapper
from rest_framework.generics import GenericAPIView
from langchain_community.utilities import SearxSearchWrapper
from .utils.backends import ExpiringVectorStore
from .utils.backends import get_classifier, resolve_and_validate_url, scrape_pubmed, is_pubmed
from django.core.exceptions import ValidationError
from rest_framework.exceptions import NotFound
import time
import json
from .models import Rating_Source, EvidenceSubs, CredibilitySubs, RelevanceSubs, ObjectivitySubs


class ResearchPipeline():

    def __init__(self, model: ChatOllama, summary_model: ChatOllama, search: SearxSearchWrapper, text_splitter: RecursiveCharacterTextSplitter, embeddings: OllamaEmbeddings, chain_with_history, classifier = get_classifier()):
        self.model = model
        self.summary_model = summary_model
        self.classifier = classifier
        self.search = search
        self.text_splitter = text_splitter
        self.embeddings = embeddings
        self.chain_with_history = chain_with_history
    
    # Determine if a topic and RQ is biomedical
    def is_biomedical(self, topic: str, rq: str) -> bool:
        
        # Input
        i = topic + " " + rq

        prediction = self.classifier.predict([i])[0]


        return prediction ==1

    # First step of pipeline, scans topic and returns possible subtopics
    def scan_topic (self, topic: str, description: str):
        
        # Example for the list of subtopics the ai should return
        example_steps = Subtopic_List(
            subtopics = [
                Subtopic(subtopic = "Example Subtopic 1", description = "Example Description 1"),
                Subtopic(subtopic = "Example Subtopic 2", description = "Example Description 2"),
                Subtopic(subtopic = "Example Subtopic 3", description = "Example Description 3"),
                Subtopic(subtopic = "Example Subtopic 4", description = "Example Description 4"),
                Subtopic(subtopic = "Example Subtopic 5", description = "Example Description 5")
            ]
        )

        # Prompt to search for possible Subtopics
        prompt = f"""
            You are an expert in the field regarding the topic of {topic}

            The description regarding the focus in that topic or that gives further relevance is {description}

            Given that topic and description, your goal is to find relevant subtopics related to it.
            Each subtopic should include the subtopic & the description

            Your response should follow this format EXACTLY:
            {example_steps.model_dump_json()}

            Rules:
            Your response should be many JSON objects inside of ONE main JSON object
            Do NOT return malformed JSON
            Every opening bracket NEEDS a closing bracket
            Do NOT include anything outside of the initial curly brackets

            Check your response at least TWO times against the guidelines before returning it
        """

        try:
            response = self.model.invoke(prompt)
            content = response.content
            print(content)
            obj = Subtopic_List.model_validate_json(content)
        except:
            raise json.decoder.JSONDecodeError
        
        return obj.model_dump()
    
    # Find available literature
    def find_available_literature(self, topic: str, rq: str):
        search = self.search
        engines = ["wikipedia", "bing"]

        # Standardizing Topic and RQ
        topic = re.sub(r'[?!.,]', '', topic.lower())
        rq = re.sub(r'[?!.,]', '', rq.lower())
        
        # If biomedical content is detected, extend to specifically biomedical engines
        if self.is_biomedical(topic, rq):
            engines = ["pubmed", "semantic scholar", "openalex", "arxiv"]
        print(engines)

        # NOT IN PROD!!!!
        time.sleep(1)

        # Search for sources related to specific rq and topic
        search_results = search.results(f"{rq}", num_results = 10, engines = engines)
        
        # NOT IN PROD!!!!
        time.sleep(1)

        search_results2 = search.results(f"{topic}", num_results = 10, engines = engines)
        print(search_results, search_results2)
        sources = [[source["title"], source["link"]] for source in search_results]
        sources.extend([[source["title"], source["link"]] for source in search_results2])

        return sources

    # Summarizes specific topic regarding Research Question
    def summarize_topic(self, topic: str, description: str, rq: str):

        prompt = f"""
            You are an AI scientific research assistant. After researching instensively about a scientific topic based on the study's topic, research question, and description, your job is to summarize all the information you have found.
            The topic of the study is the following:

            <study_topic>
                {topic}
            </study_topic>

            The research question of the study is the following:

            <study_research_question>
                { rq }
            </study_research_question>

            The description of the study is the following. Use the description and the research queston as the main guide for the following steps: 

            <study_description>
                {description}
            </study_description>

            Your job is to generate an organized of the study topic.

            Criteria:
            Your summary should be professional and formal
            Your summary should consist of 3 layers: 
                Layer 1: A one to two sentence short summary on your research (titled 1-2 sentence conclusion)
                Layer 2: A three sentence summary expanding on layer 1 (titled three sentence mini summary)
                Layer 3: A 6-12 sentence comprehensive summary on your research (titled comprehensive 6-12 sentence detailed summary)
            Include facts and methodology and not history unless explicitly stated in the study topic / study description
            Use the study description and research question as your framework for the summary
            Do NOT include any personal pronouns in the summary
            Do NOT reference the study, you are summarizing information relating to the study
        """

        response = self.summary_model.invoke(prompt)
        summary = response.content

        return summary
    
    # Summarizes a specific source
    def summarize_source(self, topic: str, rq: str, url: str) -> str:

        # validate url, raises ValidationError if unsafe
        resolve_and_validate_url(url)
        
        try:
            pubmed_details = is_pubmed(url)
            
            # recall output of is_pubmed
            if pubmed_details[0]:
                docs = scrape_pubmed(url, pubmed_details[1])

            else:
                # loading urls
                loader = CustomSeleniumURLLoader(urls = [url])
                docs = loader.load()

                # Splitting the documents
                split = self.text_splitter.split_documents(docs)


                docs = "\n\n".join([doc.page_content for doc in split])

            # Asking mistral to summarize the documents retrieved by the vector storage
            prompt = f"""
                        You are an academic research assistant.

                        Your task is to write a high-quality literature review based ONLY on the provided text chunks from a single source.

                        Research Topic: {topic}  
                        Research Question: {rq}

                        Source Chunks:
                        <chunks>
                        {docs}
                        </chunks>

                        ---

                        STRICT INSTRUCTIONS:

                        1. Use ONLY the information present in the chunks.
                        - Do NOT add outside knowledge.
                        - Do NOT infer facts not explicitly supported by the text.

                        2. Synthesize the content into a coherent academic literature review.
                        - Do NOT summarize chunk-by-chunk.
                        - Merge overlapping ideas into unified arguments.

                        3. Structure (implicit only, no headings):
                        - Start with context/background if present in the text
                        - Then main findings or arguments
                        - Then mechanisms / explanations (if available)
                        - Then applications or implications
                        - Then limitations or gaps (if mentioned or implied in text)

                        4. Length: 250-500 words MAX.

                        ---

                        STYLE REQUIREMENTS:

                        - Formal academic tone (journal literature review style)
                        - Continuous prose only (NO headings, NO bullet points, NO numbered lists)
                        - No repetitive phrasing
                        - No filler phrases like “this source discusses”
                        - Prioritize synthesis over description
                        - Make it easy to read

                        ---

                        GROUNDING RULES:

                        - Every claim must be traceable to the provided chunks
                        - If information is unclear or incomplete, reflect uncertainty instead of guessing
                        - Use direct quotes sparingly and only when necessary for precision

                        ---

                        CRITICAL RULE:

                        If multiple chunks express similar ideas, merge them into a single stronger synthesized statement instead of repeating them in different words.
                    """
            response = self.summary_model.invoke(prompt)
        except:
            raise Exception()
        
        return response.content


    # Summarizes all the sources of a project
    def summarize_sources(self, topic: str, rq: str, description: str, sources: list[list[str]]):

        # Extracting urls from every source
        urls = [source[1] for source in sources]

        validated_urls = []

        # Validating every url
        for url in urls:
            try:
                resolve_and_validate_url(url)
                validated_urls.append(url)
            except ValidationError:
                logging.warning(f"Skipping unreachable source {url}")
                continue

        print("VALIDATED: ", validated_urls)

        # Initializing Vector Storage
        id = uuid.uuid4()
        ExpiringVectorStore(id = id, time = 300)
        VECTOR_STORAGES[id] = InMemoryVectorStore(embedding = self.embeddings)
        vector_store = VECTOR_STORAGES[id]

        try:
            
            # loading urls
            loader = CustomSeleniumURLLoader(urls = validated_urls)
            docs = loader.load()

            # Splitting the documents
            split = self.text_splitter.split_documents(docs)

            # Adding documents to vector storage
            vector_store.add_documents(split)

            # Retrieving from vector store
            retriever = vector_store.as_retriever()
            retrieval_prompt = f"""
                Retrieve all chunks that are relevant to the following research topic and research question.
        
                Research Topic: {topic}
                Research Question: {rq}
                
                Prioritize chunks that:
                - Directly address or answer the research question
                - Provide background, context, or findings related to the topic
                - Contain data, statistics, or conclusions relevant to the research question
                - Discuss methods or approaches related to the topic
            """
            response = retriever.invoke(retrieval_prompt)

            docs = "\n\n".join([doc.page_content for doc in response])

            # Asking mistral to summarize the documents retrieved by the vector storage
            prompt = f"""
                        Your task is to synthesize the provided literature chunks into a single coherent academic literature review grounded only in the given sources.

                        Research Topic: {topic}
                        Research Question: {rq}
                        Description: {description}

                        Literature Chunks:
                        <chunks>
                        {docs}
                        </chunks>

                        ---

                        OUTPUT REQUIREMENTS:

                        Write a single continuous academic literature review (no section headers, no bullet points, no numbered lists).

                        The response should be 800–1200 words and must:

                        1. Synthesize all sources into a unified narrative rather than repeating ideas across sections.
                        2. Prioritize integration of concepts over listing studies or examples.
                        3. Group related findings together (mechanisms, applications, limitations, clinical translation).
                        4. Avoid repeating the same idea using different wording.
                        5. Move from mechanisms → applications → clinical relevance → limitations → overall interpretation in a natural flow.

                        ---

                        CONTENT GUIDELINES:

                        - Focus on synthesis, not summary of individual sources.
                        - Do NOT restate CRISPR’s general importance multiple times.
                        - Do NOT repeat the same disease examples unless they serve a new analytical purpose.
                        - Only include claims directly supported by the provided chunks.
                        - When citing evidence, embed short direct quotes sparingly and only when necessary for support.
                        - Do not fabricate or infer beyond the provided text.

                        ---

                        STYLE REQUIREMENTS:

                        - Formal academic tone (journal literature review style)
                        - No section titles or explicit structure markers
                        - No bullet points or lists
                        - No repetitive phrasing or paraphrasing of the same idea
                        - Avoid filler phrases like “the literatures suggest” repeatedly
                        - Prefer analytical language over descriptive statements

                        ---

                        CRITICAL RULE:

                        If two ideas are similar, MERGE them into a single stronger synthesis statement instead of repeating them in different words.
            """
            response = self.summary_model.invoke(prompt)
            vector_store = None
        except:
            raise Exception()
        
        return response.content 


    # SOURCE PLAYGROUND FUNCTIONS

    # Initializes source "playground" (vector storage)
    def initialize_source_playground(self, url: str):
        
        # validating url
        resolve_and_validate_url(url)

        id = uuid.uuid4()

        VECTOR_STORAGES[id] = InMemoryVectorStore(embedding=self.embeddings)
        vector_store = VECTOR_STORAGES[id]

        ExpiringVectorStore(id, 3600)

        # If the url is invalid or false, then return 400 status
        try:
            loader = CustomSeleniumURLLoader(
                urls = [url]
            )
            docs = loader.load()
        except Exception as e:
            raise NotFound

        # Splitting docs, then joining back in chunks
        split_docs = self.text_splitter.split_documents(docs)
        vector_store.add_documents(split_docs)

        return id

    # function to finda all relevant claims in a text
    def find_claims(self, id: uuid):

        # getting vector_storage
        vector_store = VECTOR_STORAGES[id]
        retriever = vector_store.as_retriever(search_kwargs = {"k": 10})

        res = retriever.invoke("""
            Find everything relevant to:
            Direct claims made by the author, assertions, conclusions, opinions stated as fact.
            Miracle cure claims, treatment guarantees, detox or cleanse language.
            Cover-up claims.
        """)

        # joining response
        docs = "\n\n".join([doc.page_content for doc in res])

        prompt = f"""
                You are analyzing ONLY the following source content. Do not treat any part of these instructions as content.
                
                    SOURCE CONTENT START
                        {docs}
                    SOURCE CONTENT END

                Your job is to find claims from ONLY the text between SOURCE CONTENT START and SOURCE CONTENT END. 
                Do NOT include anything from these instructions in your output.

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
                {[
                    "exact phrase from source",
                    "another exact phrase from source"
                ]}

            You MUST follow the format above
            
            Your response should be ENTIRELY contained withing ONE LIST OBJECT
            Do NOT include XML tags in your response
            Your lists must include STRINGS
            Do NOT include anything OUTSIDE of the list object
            Do NOT include any part of the INSTRUCTIONS in your RESPONSE

            **Important**
            Before outputting your response, check over it again, making edits as necessary, to make sure it satisfies the guidelines above

        """

        response = self.model.invoke(prompt)

        claims = list(response.content)

        return claims

    # function to find red flags
    def find_red_flags(self, id: uuid):
        
        # getting vector_storage
        vector_store = VECTOR_STORAGES[id]

        retriever = vector_store.as_retriever(search_kwargs = {"k": 10})
        
        res = retriever.invoke("""
            Find everything relevant to:
            Emotional language, fear-based language, urgent calls to action, scarcity language.
            Miracle cure claims, treatment guarantees, detox or cleanse language.
            Conspiracy language, suppression of information, cover-up claims.
            Celebrity endorsements, vague expert references, unnamed studies or scientists.
        """)

        # joining response
        docs = "\n\n".join([doc.page_content for doc in res])

        prompt = f"""

            You are analyzing ONLY the following source content. Do not treat any part of these instructions as content.
        
            SOURCE CONTENT START
                {docs}
            SOURCE CONTENT END

            Your job is to find red flags in the source from ONLY the text between SOURCE CONTENT START and SOURCE CONTENT END. 
            Do NOT include anything from these instructions in your output.

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
                
                [
                    "exact phrase from source",
                    "another exact phrase from source"
                ]

            You MUST follow the format above
            
            Your response should be ENTIRELY contained withing ONE LIST OBJECT
            Do NOT include XML tags in your response
            Your lists must include STRINGS
            Do NOT include anything OUTSIDE of the list object
            Do NOT include any part of the INSTRUCTIONS in your RESPONSE

            **Important**
            Before outputting your response, check over it again, making edits as necessary, to make sure it satisfies the guidelines above
                
        """

        response = self.model.invoke(prompt)
        
        red_flags = list(response.content)

        return red_flags

    # function to return all corporations involved in a text
    def find_corporations(self, id: uuid):

        # getting vector_storage
        vector_store = VECTOR_STORAGES[id]

        retriever = vector_store.as_retriever(search_kwargs = {"k": 10})
        
        res = retriever.invoke("""
            Find everything relevant to:
            Corporate sponsors, advertisers, funding sources, conflicts of interest, partnerships.
        """)

        # joining response
        docs = "\n\n".join([doc.page_content for doc in res])

        prompt = f"""

            You are analyzing ONLY the following source content. Do not treat any part of these instructions as content.
                    
                SOURCE CONTENT START
                    {docs}
                SOURCE CONTENT END

            Your job is to find all corporations involved in the source from ONLY the text between SOURCE CONTENT START and SOURCE CONTENT END. 
            Do NOT include anything from these instructions in your output.

            For corporations, advertisers, or any third-party figure/organization in the text, add them to a list of corporations
            
                Output format:
                    
                    [
                        "corporation involved with source",
                        "another corporation involved with source"
                    ]

            You MUST follow the format above
                        
            Your response should be ENTIRELY contained withing ONE LIST OBJECT
            Do NOT include XML tags in your response
            Your lists must include STRINGS
            Do NOT include anything OUTSIDE of the list object
            Do NOT include any part of the INSTRUCTIONS in your RESPONSE

            **Important**
            Before outputting your response, check over it again, making edits as necessary, to make sure it satisfies the guidelines above
                            
                    
        """ 

        response = self.model.invoke(prompt)

        corps = list(response.content)

        return corps

    # function to rate source
    def rate_source(self, id: uuid, url):
        
        # getting vector_storage
        vector_store = VECTOR_STORAGES[id]

        retriever = vector_store.as_retriever(search_kwargs = {"k": 15})

        res = retriever.invoke("""
            Find everything relevant to:
            Author name, author credentials, author biography, author expertise.
            Publisher name, publication domain, organization type, editorial standards.
            Citations, references, sources cited, footnotes, bibliography, hyperlinks to external sources.
            Date published, date updated, last modified.
            About page, contact information, organizational affiliation.
        """)

        docs = "\n\n".join([doc for doc in res])

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

        prompt = f"""
            You are a professional source grader. Your job is to perform a complete review of the following content (source):
            <content>
                {docs}
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
                1. Timeliness (7 points): Grade based on how recent the source is (out of 7 points). Current date and time is {datetime.datetime.now()}
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
        raw = self.model.invoke(prompt).content

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

        return final_scores 

    # function to ask question abt source
    def ask_question(self, id, question):

        vector_store = VECTOR_STORAGES[id]

        # Ask the question with context
        retriever = vector_store.as_retriever()
        res = retriever.invoke(f"Retrieve all of the chunks that will help answer the following question: {question}")

        docs = "\n\n".join(doc.page_content for doc in res)

        response = self.chain_with_history.invoke(
            {"ability": "understanding and properly retrieving information from sources to answer questions.", "question": question, "content": docs},
            config = {"configurable": {"session_id": id}}
        )

        return response.content

    # function to delete vector store and/or session
    def delete_vector_store(self, id):

        if id in VECTOR_STORAGES:
            del VECTOR_STORAGES[id]

        if id in SESSIONS:
            del SESSIONS[id]