from .models import User
from .models import Project
from rest_framework import routers, serializers, viewsets

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'
        read_only_fields = ['id']

class ProjectFrontendSerializer(serializers.ModelSerializer):
    summary = serializers.CharField(required=False, allow_blank=True)
    available_trusted_literatures = serializers.JSONField(required=False)
    objective = serializers.CharField(required = False)
    editors = UserSerializer(many = True, required=False)
    viewers = UserSerializer(many = True, required=False)
    user = UserSerializer()

    class Meta:
        model = Project
        fields = '__all__'
        read_only_fields = ['id', 'user']

class ProjectBackendSerializer(serializers.ModelSerializer):
    summary = serializers.CharField(required=False, allow_blank=True)
    available_trusted_literatures = serializers.JSONField(required=False)
    objective = serializers.CharField(required = False)
    editors = serializers.PrimaryKeyRelatedField(many = True, queryset = User.objects.all(),required=False)
    viewers = serializers.PrimaryKeyRelatedField(many = True, queryset = User.objects.all(), required=False)
    user = UserSerializer()

    class Meta:
        model = Project
        fields = '__all__'
        read_only_fields = ['id', 'user']