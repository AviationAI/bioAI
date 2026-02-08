from django.test import TestCase
from .models import Project, User, AIGeneratedResearchSteps, Doc
import uuid

# Create your tests here.
class ApiTestCase(TestCase):
    def setUp(self):

        # Creating example users
        
        u1 = User.objects.create(id = "u1", username = "User1", email_address = "u1@bio.com")
        u2 = User.objects.create(id = "u2", username = "User2", email_address = "u2@bio.com")

        Project.objects.create(id = uuid.uuid4, topic = "Project 1", description = "Example Project", user = u1)
        Project.objects.create(id = uuid.uuid4, topic = "Project 2", description = "Example Project", user = u2)
    
    
