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

# Create your views here.
chat = ChatOllama(model = "llama3.2:3b")

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
            ],
            summarization = "Example summarization",
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
            Step 1: Available trustworthy literature: Find detailed and trustworthy sources/literatures towards the topic of the study. ONLY use real, existing sources. DO NOT invent sources. If all sources cannot be verified as real, write "NO TRUSTWORTHY SOURCES" instead. They should follow the following criteria:
                a. Lack of bias (Bad source example: Oil company for the topic of climate change)
                b. The source has a good online reputation for factual data
                c. The source is recommended to be .edu .gov or .org, however .com is fine if the source follows all other criteria
                d: The source is relevant towards the topic of the study
                e: ONLY use real, existing sources. DO NOT invent URLs, DOIs, or articles. If all sources cannot be verified as real, write "NO TRUSTWORTHY SOURCES" instead.
            Step 2: Summarization: Now, with all the information you have gathered on the research topic, summarize all key points about the topic. This summary should follow the following criteria:
                a. Length: The summary should be anywhere from 6-12 sentences, covering critical aspects about the topic. If needed, you can extend the range by a few sentences if critical details are missed
                b. Sources: Use ONLY trustworthy sources for this summary (Look above for the parameters defining a trustworthy source)
                c. Content: The summary should give as much valid information about the topic as possible, and should be based on the description for the project. Focus on facts.

            

            Do NOT respond with ``` or ```` or any other code fenced in your JSON response
            Your response should be clean JSON, meant to be parsed as so
            Your response should be structured exactly as the example given, but with different, reale, and valid values that follow parameters in the given instructions
            Do NOT use ' (single quotation marks) instead use " (double quotation marks)
            Do NOT use Python Dict format
            Output must be valid JSON.
            Do NOT include explanations, code fences, or any text outside the JSON object.
            Use strings instead of python objects 
            Dp NOT use "=", instead use ":" (unless it is part of your url)
            ALL OF YOU JSON OBJECT SHOULD BE INSIDE OF TWO CURLY BRACES 
        """
        messages = [
            HumanMessage(content = ai_prompt)
        ]

        response = chat.invoke(messages)
        steps = response.content
        validated_steps = AIGeneratedResearchSteps.model_validate_json(steps)

        print(validated_steps.model_dump_json())
        
        p = Project.objects.create(
            id = id,
            user = request.user,
            topic = title,
            description = description,
            AIsteps = json.loads(validated_steps.model_dump_json())
        )
        p.save()
        return JsonResponse({"Success": "True", "Project": p.serialize()})
    return render(request, "bioAIPrototype/create.html")

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
    return render(request, "bioAIPrototype/project.html", {
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