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

# Create your views here.
markdowner = Markdown()
chat = ChatOllama(model = "llama3.2:3b")
embeddings = OllamaEmbeddings(model = "nomic-embed-text")
text_splitter = RecursiveCharacterTextSplitter(chunk_size = 1500, chunk_overlap = 225)


@csrf_exempt
# Index() main page
def index(request):
    try:
        projects = Project.objects.filter(user = request.user)

    except:
        projects = False
    return render(request, "bioAIPrototype/index.html", {
        "projects": projects
    })

@login_required(login_url="/login")
def create(request):
    if request.method == "POST":
        id = uuid.uuid4()
        data = json.loads(request.body)
        title = data.get("title")
        description = data.get("description")

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
        """
        messages = [
            HumanMessage(content = ai_prompt)
        ]

        response = chat.invoke(messages)
        steps = response.content
        validated_steps = AIGeneratedResearchSteps.model_validate_json(steps)
        print(validated_steps.model_dump_json())

        ai_prompt2 = f"""
            You are an AI scientific research assistant. Your task is to generate structured steps toward conducting a scientific research study.
            The topic of the study is the following:

            <study_topic>
                {title}
            </study_topic>
            The description of the study is the following. Use the description as the main guide for the following steps: 

            <study_description>
                {description}
            </study_description>

            Your job is to generate a summary of the study topic.
            You may use the following sources:

            <study_sources>
                {response}
            </study_sources>

            Criteria:
            Your summary should be professional and formal
            Your summary should be 6-12 sentences
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


        
        p = Project.objects.create(
            id = id,
            user = request.user,
            topic = title,
            description = description,
            AIsteps = json.loads(validated_steps.model_dump_json()),
            summary = summary
        )
        p.save()
        return JsonResponse({"Success": "True", "Project": p.serialize()})
    return render(request, "bioAIPrototype/create.html")

def delete(request, project_id):
    if request.method == "POST":
        project = Project.objects.get(id = project_id)
        if request.user == project.user:
            project.delete()
            return JsonResponse({"Success": "True"})
        return JsonResponse({"Error": "User cannot delete project that they do not own."})
    return JsonResponse({"Error": "Post method required."})

def login_view(request):
    if request.method == "POST":
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(username = username, password = password)

        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "bioAIPrototype/login.html", {
                "message": "Invalid password and/or username"
            })
    return render(request, "bioAIPrototype/login.html")

def project(request, project_id):
    project = Project.objects.get(id = project_id)
    summary = markdowner.convert(project.summary)
    return render(request, "bioAIPrototype/project.html", {
        "project": project,
        "summary": summary
    })

@csrf_exempt
def URLQuestion(request):
    if request.method == "POST":
        start =  datetime.now()
        print(start)
        data = json.loads(request.body)
        url = data.get("url")
        question = data.get("question")
        loader = WebBaseLoader(url)
        documents = loader.load()
        chunks = text_splitter.split_documents(documents)

        vectorstorage = Chroma(
            collection_name="user_collection_one",
            embedding_function=embeddings
        )

        retriever = vectorstorage.as_retriever()
        vectorstorage.add_documents(chunks)
        docs = retriever.invoke(question)
        docs_content = "\n\n".join(doc.page_content for doc in docs)
        prompt = f"Context = {docs_content} Question = {question}"
        response = chat.invoke(prompt)
        print(datetime.now() - start)
        return JsonResponse({"Success": "True", "response": response.content})
    return JsonResponse({"Error": "Post Method Required"})

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