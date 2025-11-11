from django.db import models
from django.db import models
from django.db.models import Avg, Count
from django.contrib.auth.models import AbstractUser
from django.core.validators import MaxValueValidator, MinValueValidator
from pydantic import BaseModel, Field, HttpUrl
from typing import List, Dict
import json

# Create your models here.

class User(AbstractUser):
    pass

class Project(models.Model):
    id = models.UUIDField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    topic = models.CharField()
    description = models.CharField()
    objective = models.CharField(default="none")
    AIsteps = models.JSONField()

    def __str__(self):
        return f"{self.topic} by {self.user}"
    
    def serialize(self):
        return {
            "id": self.id,
            "user": self.user.username,
            "topic": self.topic,
            "description": self.description,
            "objective": self.objective,
            "AIsteps": {
                "available_trusted_literatures": self.AIsteps['available_trusted_literatures'],
                "summarization": self.AIsteps['summarization']
            }
        }
    
    
class AIGeneratedResearchSteps(BaseModel):
    available_trusted_literatures: List[str] = Field(description = "All available sites/trusted literatures on the topic. Must be trustable websites.")
    summarization: str = Field(description="Summarization of the entire topic, and without sources.")
