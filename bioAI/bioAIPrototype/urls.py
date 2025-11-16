from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name = "index"),
    path('create', views.create, name = "create"),
    path('login', views.login_view, name = "login"),
    path('logout', views.logout_view, name = "logout"),
    path('register', views.register, name = "register"),
    path('project/<str:project_id>', views.project, name = "project"),
    path('delete/<str:project_id>', views.delete, name = "delete"),
    path('edit/<str:project_id>', views.edit, name = "edit")
]