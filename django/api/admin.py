from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Media, MediaBatch
from django.utils.html import format_html

from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib import admin
from .models import User  # Ensure correct import

class UserAdmin(BaseUserAdmin):
    # Display these fields in the admin list view
    list_display = ('username', 'email', 'employee_id', 'full_name', 'phone_number', 'role', 'is_staff', 'is_active')
    
    # Fields that can be searched
    search_fields = ('username', 'email', 'employee_id', 'full_name', 'phone_number')
    
    # Filters on the side
    list_filter = ('role', 'is_staff', 'is_active')
    
    # Fields to be used in editing the user model
    fieldsets = (
        (None, {'fields': ('username', 'email', 'password')}),
        ('Personal Info', {'fields': ('employee_id', 'full_name', 'phone_number', 'profile_photo')}),
        ('Permissions', {'fields': ('role', 'is_staff', 'is_active', 'groups')}),
    )
    
    # Fields used when creating a user
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'username', 'email', 'full_name', 'phone_number', 'profile_photo',
                'password1', 'password2', 'role', 'is_staff', 'is_active'
            )}
        ),
    )
    
    ordering = ('username',)

class MediaBatchAdmin(admin.ModelAdmin):
    list_display = ('referral_id', 'title', 'owner', 'created_at', 'media_count')
    list_filter = ('owner', 'created_at')
    search_fields = ('referral_id', 'title', 'owner__username')
    readonly_fields = ('referral_id',)

    def media_count(self, obj):
        return obj.media_files.count()
    media_count.short_description = 'Number of Files'

class MediaAdmin(admin.ModelAdmin):
    list_display = ('file_preview', 'title', 'owner', 'batch', 'uploaded_at')
    list_filter = ('owner', 'batch', 'uploaded_at')
    search_fields = ('file', 'title', 'owner__username', 'batch__referral_id')
    
    def file_preview(self, obj):
        if obj.file and hasattr(obj.file, 'url'):
            return format_html('<img src="{}" width="50" height="50" />', obj.file.url)
        return "No preview"
    file_preview.short_description = 'File Preview'

# Register your models here
admin.site.register(User, UserAdmin)
admin.site.register(MediaBatch, MediaBatchAdmin)
admin.site.register(Media, MediaAdmin)