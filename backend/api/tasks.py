from celery import shared_task
from rag.utils.pipeline_instance import pipeline


# Check rag/pipeline.py for more details abt most of these


# function to scan topic 
@shared_task(retry_kwargs = {"max_retries": 3})
def scan_topic_task(topic: str, description: str):
    return pipeline.scan_topic(topic, description)

