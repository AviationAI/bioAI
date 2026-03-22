from .apiconfig import VECTOR_STORAGES
from .utils.backend import ExpiringVectorStore
from trafilatura import extract_metadata, fetch_url
from newspaper import Article
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
from .permissions import IsOwner, IsEditor, IsViewer
from rest_framework import status


# Create your views here.
markdowner = Markdown()
chat = ChatOllama(model = "bioResearchBuddy")
sourceChat = ChatOllama(model = "bioSourceBuddy")
embeddings = OllamaEmbeddings(model = "nomic-embed-text")
text_splitter = RecursiveCharacterTextSplitter(chunk_size = 1250, chunk_overlap = 250)


class ProjectListCreate(generics.ListCreateAPIView):
    serializer_class = ProjectBackendSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        request = self.request
        if request.method == "POST":
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
    
    def perform_create(self, serializer):
        title = self.request.data.get("topic")
        description = self.request.data.get("description")
        rq = self.request.data.get("research_question")

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

            The research questiont that the study is aiming to answer is the folowing. Use the research question and the description as the main guide for the following steps.: 

            <study_research_question>
                { rq }
            </study_research_question>

            The description of the study is the following. Use the research question and the description as the main guide for the following steps.: 

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
            ALL OF YOUR JSON OBJECT SHOULD BE INSIDE OF TWO CURLY BRACES 
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
                {response}
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
        sources = json.loads(validated_steps.model_dump_json())["available_trusted_literatures"]

        
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

    def put (self, request):
        data = request.data
        topic = data.get("topic")
        description = data.get("description")
        sources = data.get("sources")
        summary = data.get("summary")
        question = data.get("question")
        project = self.get_object()
        updateData = {
            "topic": topic,
            "description": description,
            "research_question": question,
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
    
    def patch (self, request):
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
        

class RAGviews(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        url = data.get("url", None)
        question = data.get("question", None)
        vector_id = f"{request.user.id}_sources"
        if url:
            VECTOR_STORAGES[vector_id] = InMemoryVectorStore(embedding=embeddings)
            vector_storage = VECTOR_STORAGES[vector_id]
            ExpiringVectorStore(vector_id, 300)
            start =  datetime.now()
            # Loading the url
            loader = WebBaseLoader(url)
            documents = loader.load()
            # Splitting the document into digestible chunks for the AI
            chunks = text_splitter.split_documents(documents)
            vector_storage.add_documents(chunks)
            retriever = vector_storage.as_retriever(search_kwargs={"k": 5})
            # invoking the vector storage
            docs = retriever.invoke(
                "Retrieve only the documents that evaluate or discuss the reliability, credibility, or overall quality of the source."
            )
            docs_content = "\n\n".join(doc.page_content.strip() for doc in docs)

            html_content = fetch_url(url)
            if html_content ==  None:
                return Response("Website has anti scraping protocols")
            metadata = extract_metadata(html_content)
            print("start" + docs_content)

            example_rating = {
                "timeliness_score": 20,
                "authority_score": 30,
                "accuracy_score": 25,
                "purpose_score": 25
            }

            # FIX PROMPT

            prompt = f"""
                Perform a complete rating of the source using the following source content below:
                <content>
                    {docs_content}
                </content>
                Do NOT use the content if it doesnt contain more than a total of 100 characters
                The url of the source is:
                <url>
                    { url }
                </url>
                The metadata of the source is: 
                    <metadata>
                        { metadata }
                    </metadata>
                The metadata should be the basis of your review, but you can use the content if necessary
                Your rating should consist of 5 scores:
                timeliness score
                    -The timeliness score should be an integer from 0-20 (inclusive)
                    -The rubric for the score is (current date is {datetime.now().strftime('%Y-%m-%d')}):
                        20 — Published ≤ 1 year ago
                        19 — Published ≤ 2 years ago
                        18 — Published ≤ 3 years ago
                        17 — Published ≤ 4 years ago
                        16 — Published ≤ 5 years ago
                        15 — Published ≤ 6 years ago
                        14 — Published ≤ 7 years ago
                        13 — Published ≤ 8 years ago
                        12 — Published ≤ 9 years ago
                        11 — Published ≤ 10 years ago
                        ≤10 — Published >10 years ago
                    -If a source qualifies for two scores, choose the lower one
                authority score
                    -The authority score should be an integer from 0-30 (inclusive)
                    -The score should be based on how trustable the source is (government website or random blog), and the credibility of an author
                    -An example of a perfect score is a .gov or .edu website, with a reputable author, whose credentials are shown clearly
                    -An example of a bad score is a random blog with a user posting a theory
                accuracy score
                    -The accuracy score should be an integer from 0-25 (inclusive)
                    -The score should be based on how acccurate the information, if it has been proven to be false, and if the source is peer reviewed
                purpose score
                    -The purpose score should be an integer from 0-25 (inclusive)
                    -The score should be based on the biasy of the source
                    -If the source has any sort of monetary gain from changing the result in a certain way, dock off five points
                    -If the source is known for lobbying and misleading information (especially in the field of the source), give it a maximum of ten points
                    -If the content is blatantly, or even slightly biased, dock off 3 points
                
                Your response should use the same format as the following exampl, but may include different ratings:
                <example>
                    {json.dumps(example_rating)}
                </example>
                
                Your ratings should be given in JSON format
                All the ratings should be inclosed within curly braces
                Your ratings should be a SINGLE JSON object
            """
            print(datetime.now() - start)
            
            response = sourceChat.invoke(prompt)
            print(response.content)
            validated_data = Scores.model_validate_json(response.content)
            final_data = validated_data.model_dump_json()
            print(final_data)
            retriever = None
            try:
                return Response(final_data, status=status.HTTP_200_OK)
            except:
                return Response("Prompt error", status=status.HTTP_400_BAD_REQUEST)
        
        if question:

            try:
                vector_storage = VECTOR_STORAGES[vector_id]
            except:
                return Response("Session timed out.")
            
            retriever = vector_storage.as_retriever()
            answerdocs = retriever.invoke(f"Retrieve only the chunks that will help answer the following question: {question}")
            docs_content = "\n\n".join(doc.page_content for doc in answerdocs)
            answer_prompt = f"Context = {docs_content} Question = {question}"
            response = chat.invoke(answer_prompt)

            return Response(response.content)