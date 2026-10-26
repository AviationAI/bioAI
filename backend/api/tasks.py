from celery import shared_task
from rag.utils.pipeline_instance import pipeline
import uuid


# Check rag/pipeline.py for more details abt most of these


# task to scan topic 
@shared_task()
def scan_topic_task(topic: str, description: str):
    return pipeline.scan_topic(topic, description)

# task to find sources
@shared_task()
def find_available_literature_task(topic: str, rq: str):
    return pipeline.find_available_literature(topic, rq)

# task to summarize sources
@shared_task()
def summarize_sources_task(topic: str, rq: str, description: str, sources):
    return pipeline.summarize_sources(topic, rq, description, sources)

# task to summarize a topic
@shared_task()
def summarize_topic_task(topic: str, rq: str, description: str):
    return pipeline.summarize_topic(topic, description, rq)



# source playground tasks

@shared_task()
def initialize_source_playground_task(url: str):
    return pipeline.initialize_source_playground(url)

@shared_task
def find_claims_in_source_task(id: uuid.UUID):
    return pipeline.find_claims(id)

@shared_task
def find_red_flags_in_source_task(id: uuid.UUID):
    return pipeline.find_red_flags(id)

@shared_task
def find_corporations_in_source_task(id: uuid.UUID):
    return pipeline.find_corporations(id)

@shared_task
def rate_source_task(id: uuid.UUID, url: str):
    return pipeline.rate_source(id, url)

@shared_task
def ask_question_about_source_task(id: uuid.UUID, question: str):
    return pipeline.ask_question(id, question)
