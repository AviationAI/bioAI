from trafilatura import extract_metadata, fetch_url
from django.core.paginator import Paginator
from .models import User, AIGeneratedResearchSteps, Project, Scores, Doc
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
from .serializers import UserSerializer, ProjectFrontendSerializer, ProjectBackendSerializer, DocBackendSerializer, DocFrontendSerializer
from rest_framework import generics, permissions
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from .permissions import IsOwner, IsEditor, IsViewer, Can_Create_Project
from rest_framework import status
from bioAI.settings import OLLAMA_BASE_URL, SEARXNG_URL
from langchain_community.utilities import SearxSearchWrapper

# Create your views here.
markdowner = Markdown()
chat = ChatOllama(
    model = "llama3.2:3b",
    temperature = 0.3,
    top_p = 0.4,
    base_url=OLLAMA_BASE_URL
)

search = SearxSearchWrapper(searx_host = SEARXNG_URL)

class ProjectListCreate(generics.ListCreateAPIView):
    serializer_class = ProjectBackendSerializer

    def get_queryset(self):
        request = self.request
        if request.method == "POST":
            return None
        user = request.user
        owned = Project.objects.filter(user = user)
        type = request.headers.get("Type", "owned")
        print(type)

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
        title = self.request.data.get("topic")
        description = self.request.data.get("description")
        rq = self.request.data.get("research_question")

        # Using SearXNG (localhosted) to search for sources based on the research question and topic
        search_results = search.results(rq, num_results = 10, engines = [ "duckduckgo", "wikipedia"])
        search_results2 = search.results(title, num_results = 10, engines = [ "duckduckgo", "wikipedia"])
        sources = [[source["title"], source["link"]] for source in search_results]
        sources.extend([[source["title"], source["link"]] for source in search_results2])

        print(sources)
        ai_prompt2 = f"""
            You are an AI scientific research assistant. After researching instensively about a scientific topic based on the study's topic, research question, and description, your job is to summarize all the information you have found.
            The topic of the study is the following:

            <study_topic>
                {title}
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
            You may use the following sources:

            <study_sources>
                {sources}
            </study_sources>

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

        messages2 = [
            HumanMessage(content = ai_prompt2)
        ]

        response = chat.invoke(messages2)
        
        summary = response.content
        
        serializer.save(
            user = self.request.user,
            available_trusted_literatures = sources,
            summary = summary
        )

class ProjectRetrieveUpdateDestroy(generics.RetrieveUpdateDestroyAPIView):
    queryset = Project.objects.all()
    lookup_field = "pk"
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
        question = data.get("question", project.research_question)
        updateData = {
            "topic": topic,
            "description": description,
            "research_question": question,
            "available_trusted_literatures": sources,
            "summary": summary,
        }
        print(summary)
        serializer = self.get_serializer(
            project, data = updateData, partial = True
        )
        if not serializer.is_valid():
            return Response({"error": "invalid data"}, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def patch (self, request, *args, **kwargs):
        project = self.get_object()
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


# List create views for Doc model 

class DocListCreate(generics.ListCreateAPIView):

    serializer_class = DocBackendSerializer

    # Checking which queryset we want to load from
    def get_queryset(self):

        # Checking if we want to query from the project the doc is from
        user = self.request.user
        isProject = self.request.headers["Is-Project"]

        if isProject:
            projectID = self.request.headers["project-id"]
            project = Project.objects.get(pk = projectID)
            return Doc.objects.filter(project = project)
        else:
            type = self.request.headers["Type"]
            if type == "editor":
                return Doc.objects.filter(editors__in = user)
            elif type == "viewer":
                return Doc.objects.filter(viewers__in = user)
            return Doc.objects.filter(user = user)