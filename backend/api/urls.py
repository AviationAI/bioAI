from django.urls import path
from . import views
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('projects', views.ProjectListCreate.as_view(), name = "project-list-create"),
    path('token/', TokenObtainPairView.as_view(), name = 'token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name = 'token_refresh'),
    path('tasks/<str:id>', views.get_task_status, name = "get-task-status"),
    path('projects/<str:pk>', views.ProjectRetrieveUpdateDestroy.as_view(), name = "project-retrieve-update-destroy"),
    path('projects/<str:pk>/change', views.ProjectChangeMode.as_view(), name = "project-change-mode"),
    path('generate/sources', views.GenerateSources.as_view(), name = "generate-sources"),
    path('generate/summary', views.GenerateSummary.as_view(), name = "generate-summary"),
    path('generate/summarize_literature', views.GenerateSourceSummary.as_view(), name = "generate-source-summary"),
    path('generate/subtopics', views.GenerateSubtopics.as_view(), name = "generate-subtopics"),
    path('generate/summarize_source', views.SummarizeSource.as_view(), name = "summarize-source"),
    path('user', views.UserRetrieveUpdateDestroy.as_view(), name = "user-retrieve-update-destroy"),
    path('manuscripts/<str:project_id>', views.ManuscriptListCreate.as_view(), name = "manuscript-list-create"),
    path('manuscripts/sections/<str:manuscript_id>', views.ManuscriptSectionListCreate.as_view(), name = "manuscriptsection-list-create"),
    path('manuscript/<str:pk>', views.ManuscriptRetrieveUpdateDestroy.as_view(), name = "manuscript-retrieve-update-destroy"),
    path('manuscripts/section/<str:pk>', views.ManuscriptSectionRetrieveUpdateDestroy.as_view(), name = "manuscriptsection-retrieve-update-destroy"),
    path('playground/initialize', views.InitializePlayground.as_view(), name = "playground-initialize"),
    path('playground/rate/<str:vector_id>', views.RateSource.as_view(), name = "playground-rate"),
    path('playground/find/claims/<str:vector_id>', views.FindClaimsSource.as_view(), name = "playground-find-claims"),
    path('playground/find/red_flags/<str:vector_id>', views.FindRedFlagsSource.as_view(), name = "playground-find-red-flags"),
    path('playground/find/corporations/<str:vector_id>', views.FindCorporationsSource.as_view(), name = "playground-find-coporations"),
    path('playground/ask/question', views.AskQuestionSource.as_view(), name = "playground-ask-question")
]