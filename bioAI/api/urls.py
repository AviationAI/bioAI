from django.urls import path
from . import views
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('projects', views.ProjectListCreate.as_view(), name = "project-list-create"),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('projects/<str:pk>', views.ProjectRetrieveUpdateDestroy.as_view(), name = "project-retrieve-update-destroy"),
    path('ask', views.RAGviews.as_view(), name = "urlQuestion"),
]