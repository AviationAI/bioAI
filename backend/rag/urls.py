from django.urls import path
from . import views

urlpatterns = [
    path("ask", views.EvaluateSource.as_view(), name = "source"),
    path("summarize/<str:pk>", views.SummarizeSources.as_view(), name = "summarize")
]