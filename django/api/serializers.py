from rest_framework import serializers
from .models import Media, User, MediaBatch
import logging

logger = logging.getLogger(__name__)

class MediaSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    batch_referral_id = serializers.CharField(write_only=True, required=False)
    batch_title = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Media
        fields = [
            'id',
            'file',
            'file_url',
            'owner',
            'batch',
            'title',
            'uploaded_at',
            'batch_referral_id',
            'batch_title'
        ]
        read_only_fields = ['owner', 'uploaded_at']

    def get_file_url(self, obj):
        request = self.context.get('request')
        return request.build_absolute_uri(obj.file.url) if obj.file and request else None

    def create(self, validated_data):
        request = self.context.get('request')
        batch_referral_id = validated_data.pop('batch_referral_id', None)
        batch_title = validated_data.pop('batch_title', None)

        # Get or create batch if referral_id is provided
        if batch_referral_id:
            try:
                batch = MediaBatch.objects.get(referral_id=batch_referral_id)
            except MediaBatch.DoesNotExist:
                batch = None
        else:
            batch = None

        # Create new batch if needed
        if not batch and batch_title:
            batch = MediaBatch.objects.create(
                owner=validated_data['owner'],
                title=batch_title
            )

        if batch:
            validated_data['batch'] = batch

        # Save binary file data into file_data
        media_instance = Media(**validated_data)
        uploaded_file = validated_data.get('file')
        if uploaded_file:
            uploaded_file.seek(0)
            media_instance.file_data = uploaded_file.read()
        
        media_instance.save()
        return media_instance

class MediaBatchSerializer(serializers.ModelSerializer):
    owner = serializers.SerializerMethodField()
    images = MediaSerializer(many=True, read_only=True, source='media_files')

    class Meta:
        model = MediaBatch
        fields = ['id', 'referral_id', 'title', 'created_at', 'owner', 'images']

    def get_owner(self, obj):
        return {
            'username': obj.owner.username,
            'id': obj.owner.id
        }

    def get_images(self, obj):
        request = self.context.get('request')
        media_files = obj.media_files.all()
        return [{
            'id': media.id,
            'url': request.build_absolute_uri(media.file.url) if media.file else None
        } for media in media_files]

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    profile_photo = serializers.SerializerMethodField()
    employee_id = serializers.CharField(read_only=True)  # Add this line

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'employee_id',        # Include in response
            'full_name',
            'phone_number',
            'profile_photo',
            'role',
            'password'
        ]

    def get_profile_photo(self, obj):
        if obj.profile_photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_photo.url)
            return obj.profile_photo.url
        return None

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email'),
            full_name=validated_data.get('full_name', ''),
            phone_number=validated_data.get('phone_number', ''),
            password=validated_data['password'],
            role=validated_data.get('role', 'user')
        )
        user.profile_photo = validated_data.get('profile_photo', None)
        user.save()
        return user