from django.shortcuts import render
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.core.paginator import Paginator
from .models import User, AIGeneratedResearchSteps, Project
from django.contrib.auth.decorators import login_required   
import json
import decimal
from django.db.models import Count
import ollama
from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage
from django.views.decorators.csrf import csrf_exempt
import uuid
from datetime import datetime
from markdown2 import Markdown
from langchain_community.document_loaders import WebBaseLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_ollama import OllamaEmbeddings
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_chroma import Chroma
from django.middleware.csrf import get_token
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .serializers import UserSerializer, ProjectFrontendSerializer, ProjectBackendSerializer
from rest_framework import generics, permissions
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from .permissions import IsOwner, IsEditor, IsViewer
from rest_framework import status
# Create your views here.
markdowner = Markdown()
chat = ChatOllama(model = "llama3.2:3b")
embeddings = OllamaEmbeddings(model = "nomic-embed-text")
text_splitter = RecursiveCharacterTextSplitter(chunk_size = 1500, chunk_overlap = 250)

class ProjectListCreate(generics.ListCreateAPIView):
    serializer_class = ProjectBackendSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        title = self.request.data.get("topic")
        description = self.request.data.get("description")

        example_steps = AIGeneratedResearchSteps(
            available_trusted_literatures=[
                "Example Institution",
                "Example Government",
                "Example Organization",
                "Example College",
            ]
        )
        print (example_steps.model_dump_json())
        ai_prompt = f"""
            You are an AI scientific research assistant. Your task is to generate structured steps toward conducting a scientific research study.
            The topic of the study is the following:

            <study_topic>
                {title}
            </study_topic>
            The description of the study is the following. Use the description as the main guide for the following steps.: 

            <study_description>
                {description}
            </study_description>

            The following example is the exact format your response should follow:
            {example_steps.model_dump_json()}

            Instructions for the content of your response: 
            Available trustworthy literature: Find detailed and trustworthy sources/literatures towards the topic of the study. ONLY use real, existing sources. DO NOT invent sources. If all sources cannot be verified as real, write "NO TRUSTWORTHY SOURCES" instead. They should follow the following criteria:
                a. Lack of bias (Bad source example: Oil company for the topic of climate change)
                b. The source has a good online reputation for factual data
                c. The source is recommended to be .edu .gov or .org, however .com is fine if the source follows all other criteria
                d: The source is relevant towards the topic of the study
                e: ONLY use real, existing sources. DO NOT invent URLs, DOIs, or articles. If all sources cannot be verified as real, write "NO TRUSTWORTHY SOURCES" instead.

            

            Do NOT respond with ``` or ```` or any other code fenced in your JSON response
            Your response should be clean JSON, meant to be parsed as so
            Your response should be structured exactly as the example given, but with different, reale, and valid values that follow parameters in the given instructions
            Do NOT use ' (single quotation marks) instead use " (double quotation marks)
            Do NOT use Python Dict format
            Output must be valid JSON.
            Do NOT include explanations, code fences, or any text outside the JSON object.
            Use strings instead of python objects 
            Do NOT use "=", instead use ":" (unless it is part of your url)
            ALL OF YOU JSON OBJECT SHOULD BE INSIDE OF TWO CURLY BRACES 
            Your response should only include ONE field (available_trusted_literatures) and no extra fields
            Your response should be ONE JSON object with ONE key (available_trusted_literatures) containing an ARRAY of source strings.
            No symbols, letters, or numbers should be outside of the JSON object; Everything must be contained inside of it.
        """
        messages = [
            HumanMessage(content = ai_prompt)
        ]

        response = chat.invoke(messages)
        steps = response.content

        if not steps.endswith("}"):
            steps = steps.split("}")[0]
            steps = steps + "}"

        if not steps.startswith("{"):
            steps = steps.split("{")[1]
            steps = "{" + steps
            
        print(steps)
        validated_steps = AIGeneratedResearchSteps.model_validate_json(steps)
        print(validated_steps.model_dump_json())

        ai_prompt2 = f"""
            You are an AI scientific research assistant. After researching instensively about a scientific topic based on the study's topic and description, your job is to summarize all the information you have found.
            The topic of the study is the following:

            <study_topic>
                {title}
            </study_topic>
            The description of the study is the following. Use the description as the main guide for the following steps: 

            <study_description>
                {description}
            </study_description>

            Your job is to generate an organized of the study topic.
            You may use the following sources:

            <study_sources>
                {response}
            </study_sources>

            Criteria:
            Your summary should be professional and formal
            Your summary should consist of 3 layers: 
                Layer 1: A one to two sentence short summary on your research (titled 1-2 sentence conclusion)
                Layer 2: A three sentence summary expanding on layer 1 (titled three sentence mini summary)
                Layer 3: A 6-12 sentence comprehensive summary on your research (titled comprehensive 6-12 sentence detailed summary)
            Include facts and methodology and not history unless explicitly stated in the study topic / study description
            Use the study description as your framework for the summary
            Do NOT include any personal pronouns in the summary
            Do NOT reference the study, you are summarizing information relating to the study
        """

        messages2 = [
            HumanMessage(content = ai_prompt2)
        ]

        response = chat.invoke(messages2)
        
        summary = response.content
        sources = json.loads(validated_steps.model_dump_json())["available_trusted_literatures"]

        
        serializer.save(
            user = self.request.user,
            topic = title,
            description = description,
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
        topic = data.get("topic")
        description = data.get("description")
        sources = data.get("sources")
        summary = data.get("summary")
        project = self.get_object()
        updateData = {
            "topic": topic,
            "description": description,
            "sources": sources,
            "summary": summary,
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


class RAGviews(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        start =  datetime.now()
        print(start)
        data = request.data
        url = data.get("url")
        question = data.get("question")
        # Loading the url
        loader = WebBaseLoader(url)
        documents = loader.load()

        # Splitting the document into digestible chunks for the AI
        chunks = text_splitter.split_documents(documents)

        # Setting the vector storage to a temporary Chroma DB
        vectorstorage = Chroma(
            collection_name="temporary_db",
            embedding_function=embeddings
        )

        # Making it easier to perform a RAG pipeline with the db
        retriever = vectorstorage.as_retriever()
        # Adding docs to the vector store, turning it into vectors for the AI
        vectorstorage.add_documents(chunks)
        # Asking the vector store to retrieve documents based on the question 
        docs = retriever.invoke(question)
        docs_content = "\n\n".join(doc.page_content for doc in docs)
        prompt = f"Context = {docs_content} Question = {question}"
        response = chat.invoke(prompt)
        print(datetime.now() - start)
        return Response(response.content)

def login_view(request):
    if request.method == "OPTIONS":
        return JsonResponse({"Success": True})
    if request.method == "POST":
        data = json.loads(request.body)

        username = data.get("username")
        password = data.get("password")
        user = authenticate(username = username, password = password)

        if user is not None:
            login(request, user)
            return JsonResponse({"Success": "True", "user": user.serialize()})
        else:
            return render(request, "bioAIPrototype/login.html", {
                "message": "Invalid password and/or username"
            })
    return render(request, "bioAIPrototype/login.html")

def edit(request, project_id):
    project = Project.objects.get(id = project_id)
    if request.method == "POST":
        data = json.loads(request.body)
        description = data.get("description")  
        topic = data.get("topic")
        summary = data.get("summary")
        sources = data.get("sources")

        project.topic = topic
        project.description = description
        project.summary = summary
        project.AIsteps["available_trusted_literatures"] = sources   
        project.save()
        return JsonResponse({"Success": "True"})
    return render(request, "bioAIPrototype/edit.html", {
        "project": project
    })

def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        email = request.POST["email"]

        if password != confirmation:
            return render(request, "bioAIPrototype/register.html", {
                "message": "Password doesn't match confirmation"
            })
        try:
            user = User.objects.create_user(username, email, password)
        except IntegrityError:
            return render(request, "bioAIPrototype/register.html", {
                "message": "Username Taken"
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    return render(request, "bioAIPrototype/register.html")

def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))