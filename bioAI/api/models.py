from django.db import models
from django.db.models import Avg, Count
from django.contrib.auth.models import AbstractUser
from django.core.validators import MaxValueValidator, MinValueValidator
from pydantic import BaseModel, Field, HttpUrl
from typing import List, Dict
import json
import uuid

# Create your models here.

class User(AbstractUser):
    id = models.CharField(primary_key=True, editable=False)
    def serialize(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email
        }

class Project(models.Model):
    id = models.UUIDField(primary_key=True, default = uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    topic = models.CharField()
    description = models.CharField()
    objective = models.CharField(default="none")
    available_trusted_literatures = models.JSONField()
    summary = models.CharField()
    editors = models.ManyToManyField(User, related_name="editable_projects")
    viewers = models.ManyToManyField(User, related_name="viewable_projects")

    def __str__(self):
        return f"{self.topic} by {self.user}"
    
    
class AIGeneratedResearchSteps(BaseModel):
    available_trusted_literatures: List[str] = Field(description = "All available sites/trusted literatures on the topic. Must be trustable websites.")
    model_config = {
        "extra": "ignore"
    }