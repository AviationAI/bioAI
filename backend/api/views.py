from trafilatura import extract_metadata, fetch_url
from django.core.paginator import Paginator
from .models import User, AIGeneratedResearchSteps, Project, Scores, Manuscript, ManuscriptSection
from django.contrib.auth.decorators import login_required   
import json
import decimal
from django.db.models import Count
import ollama
from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage
import uuid
from datetime import datetime
from markdown2 import Markdown
from langchain_community.document_loaders import WebBaseLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_ollama import OllamaEmbeddings
from langchain_core.vectorstores import InMemoryVectorStore
from django.middleware.csrf import get_token
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .serializers import UserSerializer, ProjectFrontendSerializer, ProjectBackendSerializer, ManuscriptBackendSerializer, ManuscriptFrontendSerializer, ManuscriptSectionSerializer
from rest_framework import generics, permissions
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from .permissions import IsOwner, IsEditor, IsViewer, Can_Create_Project, IsBasic, IsPremium, IsPremium_Deluxe, IsPro
from rest_framework import status
from bioAI.settings import OLLAMA_BASE_URL, SEARXNG_URL
from langchain_community.utilities import SearxSearchWrapper
from rag.pipeline import ResearchPipeline
from rest_framework.exceptions import ValidationError, NotFound


# Create your views here.
markdowner = Markdown()
chat = ChatOllama(
    model = "llama3.2:3b",
    temperature = 0.3,
    top_p = 0.4,
    base_url=OLLAMA_BASE_URL
)

model = ChatOllama(
    model = "mistral:latest",
    temperature = 0.4,
    top_p = 0.9,
    base_url = OLLAMA_BASE_URL
)

search = SearxSearchWrapper(searx_host = SEARXNG_URL)

embeddings = OllamaEmbeddings(
    model="nomic-embed-text",
    base_url = OLLAMA_BASE_URL
)

# Setting up text splitter for faster response times
text_splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
    chunk_size=1000 , chunk_overlap=100
)

pipeline = ResearchPipeline(model, chat, search, text_splitter, embeddings)

class ProjectListCreate(generics.ListCreateAPIView):
    serializer_class = ProjectBackendSerializer
    permission_classes = [IsAuthenticated]
    throttle_scope = 'moderate_address'

    def get_queryset(self):
        request = self.request
        if request.method != "GET":
            return None
        user = request.user
        owned = Project.objects.filter(user = user)
        type = request.headers.get("Type", "owned")

        # Shared queryset is all projects shared with the user
        shared = Project.objects.filter(editors__in = [user]) | Project.objects.filter(viewers__in = [user])
        if type == "shared":
            return shared
        elif type == "all":
            return shared | owned
        return owned
    
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), Can_Create_Project()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        data = self.request.data
        title = data.get("topic")
        description = data.get("description")
        rq = data.get("research_question")
        scan_mode = data.get("scan_mode", False)

        # Two options, scan mode or not scan mode
        if not scan_mode:

            # Accesing request data specific to not scan mode (research mode)
            summary = data.get("summary")
            sources = data.get("sources")
            literature_summarized = data.get("literature_summarized")

            serializer.save(
                user = self.request.user,
                topic = title,
                research_question = rq,
                available_trusted_literatures = sources,
                summary = summary,
                scan_mode = False,
                description = description,
                literature_summarized = literature_summarized
            )
        else:
            # Saving the project in scan mode
            subtopics = data.get("subtopics")

            serializer.save(
                subtopics = subtopics,
                user = self.request.user,
                scan_mode = True,
                description = description
            )

# Class for User controls such as retrieving or updating fields    
class UserRetrieveUpdateDestroy(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    # GET
    def get_object(self):

        # Returns user, drf automatically serializes and puts in response obj
        return self.request.user

class ProjectRetrieveUpdateDestroy(generics.RetrieveUpdateDestroyAPIView):
    queryset = Project.objects.all()
    lookup_field = "pk"
    throttle_scope = 'moderate_address'

    def get_permissions(self):
        request = self.request
        if request.method == "GET":
            return [IsViewer()]
        elif request.method in ["PUT", "PATCH"]:
            return [IsEditor()]
        elif request.method == "DELETE":
            return [IsOwner()]
        return False
    
    def get_serializer_class(self):
        request = self.request
        if request.method == "GET":
            return ProjectFrontendSerializer
        return ProjectBackendSerializer

    def put (self, request, *args, **kwargs):
        data = request.data
        project = self.get_object()

        # If there is such field, set it to the field, otherwise set it to the current value in model object
        topic = data.get("topic", project.topic)
        description = data.get("description", project.description)
        sources = data.get("sources", project.available_trusted_literatures)
        summary = data.get("summary", project.summary)
        rq = data.get("question", project.research_question)
        literature_summarized = data.get("literature_summarized", project.literature_summarized)

        # Creating update data and getting the serializer
        updateData = {
            "topic": topic,
            "description": description,
            "research_question": rq,
            "available_trusted_literatures": sources,
            "summary": summary,
            "literature_summarized": literature_summarized
        }
        serializer = self.get_serializer(
            project, data = updateData, partial = True
        )

        if not serializer.is_valid():
            return Response({"error": "invalid data"}, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def patch (self, request, *args, **kwargs):
        project = self.get_object()

        # Only owner can edit people who the project is shared with
        if request.user != project.user:
            return Response(status = status.HTTP_403_FORBIDDEN)
        
        currentEditors = [editor.id for editor in project.editors.all()]
        currentViewers = [viewer.id  for viewer in project.viewers.all()]
        addedUsers = request.data.get("addedUsers", [])
        addedType = request.data.get("addedType", None)
        editors = request.data.get("editors", [])   
        viewers = request.data.get("viewers", [])
        remove = request.data.get("removed", [])
        newEditors = set(currentEditors) | set(editors)
        newViewers = set(currentViewers) | set(viewers)
        # Typecasting to set to find the intersection
        intersection = newEditors & newViewers
        # Checking if each user has multiple instances
        for user in intersection:
            # Removing user from the instance not provided from the front end
            if user in editors:
                newViewers.discard(user)
            elif user in viewers:
                newEditors.discard(user)
            else:
                if user in currentEditors:
                    newViewers.discard(user)
                elif user in currentViewers:
                    newEditors.discard(user)
        for user in addedUsers:
            try:
                userID = User.objects.get(username = user).id
                if userID not in newEditors and userID not in newViewers:
                    if addedType == "editor":
                        newEditors.add(userID)
                    elif addedType == "viewer":
                        newViewers.add(userID)
            except:
                pass
        # Checking which users are in the remove list
        for user in remove:
            # Removing the user if from every other list
            if user in newEditors:
                newEditors.discard(user)
            if user in newViewers: 
                newViewers.discard(user)
        updateData = {
            "editors": list(newEditors),
            "viewers": list(newViewers)
        }
        print(updateData)
        serializer = self.get_serializer(project, data = updateData, partial = True)
        if not serializer.is_valid():
            return Response({"error": "invalid data"}, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    
# View to change out of scan mode
class ProjectChangeMode(generics.GenericAPIView):

    queryset = Project.objects.all()
    lookup_field = "pk"
    permission_classes = [IsOwner]
    serializer_class = ProjectBackendSerializer

    def post(self, request, *args, **kwargs):

        project = self.get_object()

        updateData = {
            "scan_mode": False
        }

        serializer = self.get_serializer(project, data = updateData, partial = True)
        # Changing mode out of scan mode
        if not serializer.is_valid():
            return Response(status = status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response(status = status.HTTP_200_OK)
    
# Manuscript view
class ManuscriptListCreate(generics.ListCreateAPIView):

    permission_classes = [IsAuthenticated]
    throttle_scope = 'moderate_address'

    def get_queryset(self):
        
        # returning queryset only if GET
        request = self.request
        
        if request.method != "GET":
            return None
        
        project_id = self.kwargs.get("project_id", None)

        # filtering user and/or project for queryset
        if project_id is None:
            return Manuscript.objects.filter(user = request.user)
        
        try:
            project = Project.objects.get(pk = project_id, user = request.user)
        except:
            raise NotFound("User does not own project or invalid project")

        return Manuscript.objects.filter(project = project)

    def get_serializer(self):
        
        request = self.request

        # Returning serializer based on request method
        
        if request.method != "GET":
            return ProjectBackendSerializer
        return ProjectFrontendSerializer
    
    def perform_create(self):
        
        data = self.request.data

        # fields
        user = self.request.user
        name = data.get("name")
        project_id = data.get("project")

        # checking if project is related to user
        try:
            project = Project.objects.get(user = user, pk = project_id)
        except:
            return Response(status = status.HTTP_400_BAD_REQUEST)
        
        serializer = self.get_serializer(project = project, name = name, user = user)

        if not serializer.is_valid():
            return Response(status = status.HTTP_400_BAD_REQUEST)
        serializer.save()
        
class ManuscriptSectionListCreate(generics.ListCreateAPIView):

    serializer_class = ManuscriptSection
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        
        request = self.request

        # returning queryset only if GET

        if request.method != "GET":
            return None
        
        user = request.user
        manuscript_id = self.kwargs.get("manuscript_id")

        if manuscript_id is None:
            raise NotFound("Manuscript id is not given")
        
        try:
            manuscript = Manuscript.objects.get(user = user, pk = manuscript_id)
            return ManuscriptSection.objects.filter(manuscript = manuscript)
        except:
            raise NotFound("Invaid Manuscript ID or lack of permissions")
    
    def perform_create(self):

        user = self.request.user
        data = self.request.data
        
        # fields
        name = data.get("name")
        order = data.get("order")
        manuscript_id = data.get("manuscript")

        # Checking if user belongs to specific manuscript while querying it
        try:
            manuscript = Manuscript.objects.get(user = user, pk = manuscript_id)
        except:
            return Response(status = status.HTTP_400_BAD_REQUEST)
        
        serializer = self.get_serializer(name = name, order = order, manuscript = manuscript, user = user)

        if not serializer.is_valid():
            return Response(status = status.HTTP_400_BAD_REQUEST)
        return Response(status = status.HTTP_400_BAD_REQUEST)

# View to generate summary
class GenerateSummary(APIView):

    permission_classes = [IsAuthenticated]
    throttle_scope = 'sensitive_address'

    def post(self, request):

        # Request data to generate summary
        data = self.request.data

        # Topic & RQ & Sources
        topic = data.get("topic")
        rq = data.get("research_question")
        description = data.get("description")

        try:
            assert topic is not None and rq is not None and description is not None
        except:
            return Response(status = status.HTTP_400_BAD_REQUEST)

        # Generating summary then returning
        summary = pipeline.summarize_topic(topic, description, rq)
        return Response({"summary": summary}, status = status.HTTP_200_OK)

# View to generate sources
class GenerateSources(APIView):

    permission_classes = [IsAuthenticated]
    throttle_scope = 'sensitive_address'

    def post(self, request):

        # Request data to generate sources
        data = self.request.data

        # Topic & RQ
        topic = data.get("topic")
        rq = data.get("research_question")

        try:
            assert topic is not None and rq is not None
        except:
            return Response(status = status.HTTP_400_BAD_REQUEST)

        # Generating sources and then returning them
        sources = pipeline.find_available_literature(topic, rq)
        return Response({"sources": sources}, status = status.HTTP_200_OK)


# View to summarize literature
class GenerateSourceSummary(generics.GenericAPIView):

    permission_classes = [IsAuthenticated]
    throttle_scope = 'sensitive_address'

    def post(self, *args, **kwargs):
        
        # request data
        data = self.request.data

        # Getting the project detalis
        topic = data.get("topic")
        rq = data.get("research_question")
        sources = data.get("sources")
        description = data.get("description")

        try:
            assert topic is not None and rq is not None and sources is not None and description is not None
        except:
            return Response(status = status.HTTP_400_BAD_REQUEST)

        # Summarizing sources
        summary = pipeline.summarize_sources(topic, rq, description, sources)

        return Response({"summary": summary}, status = status.HTTP_200_OK)

# View to generate subtopics
class GenerateSubtopics(generics.GenericAPIView):

    permission_classes = [IsAuthenticated, (IsPro | IsPremium | IsPremium_Deluxe)]
    throttle_scope = 'sensitive_address'

    # POST request
    def post (self, *args, **kwargs):


        # request data
        data = self.request.data

        # fields
        topic = data.get("topic")
        description = data.get("description")
        
        try:
            assert topic is not None and description is not None
        except:
            return Response(status = status.HTTP_400_BAD_REQUEST)
        
        # Generating subtopics
        try: 
            subtopics = pipeline.scan_topic(topic, description)
        except json.decoder.JSONDecodeError:
            return Response(status = status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({"subtopics": subtopics}, status = status.HTTP_200_OK)
