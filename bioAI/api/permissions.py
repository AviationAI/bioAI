from rest_framework import permissions

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