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
    path('generate/summarize_literature', views.GenerateSourceSummary.as_view(), name = "generate-source-summary")
]