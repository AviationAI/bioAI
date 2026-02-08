from django.db import models
from django.db.models import Avg, Count
from django.contrib.auth.models import AbstractUser
from django.core.validators import MaxValueValidator, MinValueValidator
from pydantic import BaseModel, Field, HttpUrl, computed_field
from typing import List, Dict
import uuid

# Create your models here.

class AIGeneratedResearchSteps(BaseModel):
    available_trusted_literatures: List[str] = Field(description = "All available sites/trusted literatures on the topic. Must be trustable websites.")

    model_config = {
        "extra": "ignore"
    }

class Scores(BaseModel):
    authority_score: int = Field(le = 30, ge = 0)
    timeliness_score: int = Field(le = 20, ge = 0)
    accuracy_score: int = Field(le = 25, ge = 0)
    purpose_score: int = Field(le = 25, ge = 0)
    
    @computed_field
    def total (self) -> int:
        return (self.authority_score + self.timeliness_score + self.accuracy_score + self.purpose_score)
    model_config = {
        "extra": "ignore"
    }

class User(AbstractUser):
    id = models.CharField(primary_key=True, editable=False)

    def __str__(self):
        return f"{self.username}"
    
    def IsValidUser(self):
        pass
    

class Project(models.Model):
    id = models.UUIDField(primary_key=True, default = uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    topic = models.CharField()
    description = models.CharField()
    objective = models.CharField(default="none")
    available_trusted_literatures = models.JSONField()
    summary = models.CharField()
    editors = models.ManyToManyField(User, related_name="editable_projects", blank = True)
    viewers = models.ManyToManyField(User, related_name="viewable_projects", blank = True)

    def __str__(self):
        return f"{self.topic} by {self.user}"
    
    def IsValidProject (self):
        try: 
            AIGeneratedResearchSteps.model_validate_json(self.available_trusted_literatures)
            isPydanticSteps = True
        except:
            isPydanticSteps = False
        return [editor not in self.viewers for editor in self.editors] and self.user not in self.editors and self.user not in self.viewers and id.length == 32 and self.user and isPydanticSteps
    

class Doc(models.Model):
    id = models.UUIDField(default = uuid.uuid4, primary_key = True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="documents")
    editors = models.ManyToManyField(User, related_name="editable_docs", blank = True)
    viewers = models.ManyToManyField(User, related_query_name="viewable_docs", blank = True)
    name = models.CharField()
    content = models.TextField()
    project = models.ForeignKey(Project, blank = True, null = True, on_delete = models.CASCADE, related_name="documents")

    def __str__(self):
        return f"{self.name}: Made by {self.user}, Project: {self.project}"