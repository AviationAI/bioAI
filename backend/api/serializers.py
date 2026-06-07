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
    research_question = serializers.CharField(allow_blank=True, required = False)
    editors = UserSerializer(many = True, required=False)
    viewers = UserSerializer(many = True, required=False)
    user = UserSerializer()
    literature_summarized = serializers.CharField(allow_blank = True, required = False)

    class Meta:
        model = Project
        fields = '__all__'
        read_only_fields = ['id', 'user']
    
    def validate(self, attrs):
        user = self.context["request"].user
        
        # Getting the field values
        scan_mode = attrs.get("scan_mode", self.instance.scan_mode)
        rq = attrs.get("research_question", self.instance.research_question)
        
        if not scan_mode and (not rq):
            raise serializers.ValidationError("NO Research Question")

        if user.is_basic() and scan_mode:
            raise serializers.ValidationError("Basic User cannot go in scan mode.")
        return super().validate(attrs)

class ProjectBackendSerializer(serializers.ModelSerializer):
    summary = serializers.CharField(required=False, allow_blank=True)
    available_trusted_literatures = serializers.JSONField(required=False)
    research_question = serializers.CharField(allow_blank=True, required = False)
    editors = serializers.PrimaryKeyRelatedField(many = True, queryset = User.objects.all(), required = False)
    viewers = serializers.PrimaryKeyRelatedField(many = True, queryset = User.objects.all(), required = False)
    literature_summarized = serializers.CharField(allow_blank = True, required = False)

    class Meta:
        model = Project
        fields = '__all__'
        read_only_fields = ['id', 'user']

    def validate(self, attrs):
        user = self.context["request"].user
        
        # Getting the field values
        scan_mode = attrs.get("scan_mode", self.instance.scan_mode)
        rq = attrs.get("research_question", self.instance.research_question)
        
        if not scan_mode and (not rq):
            raise serializers.ValidationError("NO Research Question")

        if user.is_basic() and scan_mode:
            raise serializers.ValidationError("Basic User cannot go in scan mode.")
        return super().validate(attrs)

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