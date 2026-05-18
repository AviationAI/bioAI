from rest_framework import permissions
from .models import User

class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if  super().has_object_permission(request, view, obj):
            return obj.user == request.user
        return False
    
class IsEditor(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if super().has_object_permission(request, view, obj):
            return obj.user == request.user or request.user in obj.editors.all()
        return False
    
class IsViewer(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if super().has_object_permission(request, view, obj):
            return obj.user == request.user or request.user in obj.viewers.all() or request.user in obj.editors.all()
        return False
    
class IsBasic(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_basic()
        
class IsPro(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_pro()
        

class IsPremium(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_prem()
        

class IsPremium_Deluxe(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_prem_del()
        
class Can_Create_Project(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.project_limit() > request.user.project_set.count()