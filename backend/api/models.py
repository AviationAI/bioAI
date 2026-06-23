from django.db import models
from django.db.models import Avg, Count
from django.contrib.auth.models import AbstractUser
from django.core.validators import MaxValueValidator, MinValueValidator
from pydantic import BaseModel, Field, HttpUrl, computed_field
from typing import List, Dict
from django.utils.translation import gettext_lazy as _
import uuid
import math

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

    class Plans(models.TextChoices):
        BASIC = "basic", _("Free Tier")
        PRO = "pro", _("Professional")
        PREMIUM = "prem", _("Premium")
        PREMIUM_DELUXE = "prem_del", _("Premium Deluxe")

    id = models.CharField(primary_key=True, editable=False)
    plan = models.CharField(choices = Plans, max_length=10, default = Plans.BASIC)

    def is_basic(self):
        return self.plan == self.Plans.BASIC
    
    def is_pro(self):
        return self.plan == self.Plans.PRO
    
    def is_prem(self):
        return self.plan == self.Plans.PREMIUM
    
    def is_prem_del(self):
        return self.plan == self.Plans.PREMIUM_DELUXE
    
    def project_limit(self):
        
        if self.is_basic():
            return 3
        
        if self.is_pro():
            return 5
        
        if self.is_prem():
            return 10
        
        return math.inf

    def __str__(self):
        return f"{self.username}"
    
    def IsValidUser(self):
        pass
    

class Project(models.Model):
    
    id = models.UUIDField(primary_key=True, default = uuid.uuid4)
    scan_mode = models.BooleanField(default = False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    topic = models.CharField()
    description = models.CharField()
    available_trusted_literatures = models.JSONField(blank = True, null = True)
    summary = models.CharField(blank = True)
    research_question = models.CharField(blank = True, null=True)
    literature_summarized = models.CharField(blank = True)
    editors = models.ManyToManyField(User, related_name="editable_projects", blank = True)
    viewers = models.ManyToManyField(User, related_name="viewable_projects", blank = True)
    subtopics = models.JSONField(blank = True, null = True)

    def __str__(self):
        return f"{self.topic} by {self.user}"
    
    def IsValidProject (self):
        try: 
            AIGeneratedResearchSteps.model_validate_json(self.available_trusted_literatures)
            isPydanticSteps = True
        except:
            isPydanticSteps = False
        return [editor not in self.viewers for editor in self.editors] and self.user not in self.editors and self.user not in self.viewers and id.length == 32 and self.user and isPydanticSteps

class Manuscript(models.Model):
    id = models.UUIDField(default = uuid.uuid4, primary_key = True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="manuscripts")
    editors = models.ManyToManyField(User, related_name="editable_docs", blank = True)
    viewers = models.ManyToManyField(User, related_name="viewable_docs", blank = True)
    name = models.CharField()
    project = models.ForeignKey(Project, on_delete = models.CASCADE, related_name="manuscripts")
    created_on = models.DateTimeField(auto_now_add = True)
    
    def __str__(self):
        return f"{self.name}: Made by {self.user}, Project: {self.project}"
    
class ManuscriptSection(models.Model):
    id = models.UUIDField(default = uuid.uuid4, primary_key = True)
    title = models.CharField(max_length=100)
    content = models.TextField(blank = True)
    order = models.PositiveIntegerField()
    manuscript = models.ForeignKey(Manuscript, on_delete = models.CASCADE, related_name = "sections")

    class Meta:
        ordering = ["order"]