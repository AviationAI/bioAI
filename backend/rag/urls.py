from django.urls import path
from . import views

urlpatterns = [
    path("ask", views.EvaluateSource.as_view(), name = "source")
]