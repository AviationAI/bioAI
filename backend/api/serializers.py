from .models import User, Project, Doc
from rest_framework import routers, serializers, viewsets

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'
        read_only_fields = ['id']

class ProjectFrontendSerializer(serializers.ModelSerializer):
    summary = serializers.CharField(required=False, allow_blank=True)
    available_trusted_literatures = serializers.JSONField(required=False)
    research_question = serializers.CharField()
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
    research_question = serializers.CharField()
    editors = serializers.PrimaryKeyRelatedField(many = True, queryset = User.objects.all(), required = False)
    viewers = serializers.PrimaryKeyRelatedField(many = True, queryset = User.objects.all(), required = False)

    class Meta:
        model = Project
        fields = '__all__'
        read_only_fields = ['id', 'user']

# Doc serializers

# Serializer for frontend with user objects

class DocFrontendSerializer(serializers.ModelSerializer):
    editors = UserSerializer(many = True, required = False)
    viewers = UserSerializer(many = True, required = False)

    class Meta:
        model = Doc
        fields = '__all__'
        read_only_fields = ['id', 'user']

# Serializer for backend with user primary keys

class DocBackendSerializer(serializers.ModelSerializer):
    editors = serializers.PrimaryKeyRelatedField(many = True, required = False, queryset = User.objects.all())
    viewers = serializers.PrimaryKeyRelatedField(many = True, required = False, queryset = User.objects.all())

    class Meta:
        model = Doc
        fields = '__all__'
        read_only_fields = ['id', 'user']