from .models import User
from .models import Project
from rest_framework import routers, serializers, viewsets

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'

class ProjectSerializer(serializers.ModelSerializer):
    summary = serializers.CharField(required=False, allow_blank=True)
    available_trusted_literatures = serializers.JSONField(required=False)
    objective = serializers.CharField(required = False)
    editors = serializers.PrimaryKeyRelatedField(many = True, required=False, queryset = User.objects.all())
    viewers = serializers.PrimaryKeyRelatedField(many = True, queryset = User.objects.all(), required=False)
    
    class Meta:
        model = Project
        fields = '__all__'
        read_only_fields = ['id', 'user', 'AIsteps', 'editors', 'viewers']