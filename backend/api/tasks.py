from celery import shared_task
from rag.utils.pipeline_instance import pipeline


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
