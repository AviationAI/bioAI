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
import time


class ResearchPipeline():

    def __init__(self, model: ChatOllama, summary_model: ChatOllama, search: SearxSearchWrapper, text_splitter: RecursiveCharacterTextSplitter, embeddings: OllamaEmbeddings, classifier = get_classifier()):
        self.model = model
        self.summary_model = summary_model
        self.classifier = classifier
        self.search = search
        self.text_splitter = text_splitter
        self.embeddings = embeddings
    
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
    