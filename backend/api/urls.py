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
    path('projects/<str:pk>', views.ProjectRetrieveUpdateDestroy.as_view(), name = "project-retrieve-update-destroy"),
    path('projects/<str:pk>/change', views.ProjectChangeMode.as_view(), name = "project-change-mode"),
    path('generate/sources', views.GenerateSources.as_view(), name = "generate-sources"),
    path('generate/summary', views.GenerateSummary.as_view(), name = "generate-summary"),
    path('generate/summarize_literature', views.GenerateSourceSummary.as_view(), name = "generate-source-summary"),
    path('generate/subtopics', views.GenerateSubtopics.as_view(), name = "generate-subtopics"),
    path('user', views.UserRetrieveUpdateDestroy.as_view(), name = "user-retrieve-update-destroy"),
    path('manuscripts/<str:project_id>', views.ManuscriptListCreate.as_view(), name = "manuscript-list-create"),
    path('manuscripts/sections/<str:project_id>', views.ManuscriptSectionListCreate.as_view(), name = "manuscriptsection-list-create"),
    path('manuscript/<str:pk>', views.ManuscriptRetrieveUpdateDestroy.as_view(), name = "manuscript-retrieve-update-destroy")
]