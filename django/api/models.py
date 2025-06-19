from django.contrib.auth.models import AbstractUser
from django.db import models
import random
import string

from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('viewer', 'Viewer'),
        ('editor', 'Editor'),
        ('user', 'User'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    full_name = models.CharField(max_length=100, blank=True, null=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    profile_photo = models.ImageField(upload_to='profile_photos/', blank=True, null=True)
    employee_id = models.CharField(max_length=20, unique=True, blank=True, null=True)  # New field

    @property
    def is_admin(self):
        return self.role == 'admin'

    def save(self, *args, **kwargs):
        if self.role in ['admin', 'viewer', 'editor']:
            self.is_staff = True
        
        # Generate employee ID only if not set
        if not self.employee_id:
            last_user = User.objects.filter(employee_id__isnull=False).order_by('-id').first()
            if last_user and last_user.employee_id:
                try:
                    last_id = int(last_user.employee_id.split('-')[-1])
                except ValueError:
                    last_id = 0
            else:
                last_id = 0
            self.employee_id = f'EP-ID-{last_id + 1:04d}'

        super().save(*args, **kwargs)

class MediaBatch(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='media_batches')
    referral_id = models.CharField(max_length=15, unique=True, editable=False)
    title = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def save(self, *args, **kwargs):
        if not self.referral_id:
            # Generate a unique referral ID in format REF-ID-000001
            last_batch = MediaBatch.objects.order_by('-id').first()
            if last_batch and last_batch.referral_id and last_batch.referral_id.startswith('REF-ID-'):
                try:
                    last_number = int(last_batch.referral_id[7:])
                    new_number = last_number + 1
                except ValueError:
                    new_number = 1
            else:
                new_number = 1
            
            self.referral_id = f'REF-ID-{new_number:06d}'
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.title} ({self.referral_id})"

class Media(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploaded_media')
    batch = models.ForeignKey(MediaBatch, on_delete=models.CASCADE, related_name='media_files', null=True, blank=True)
    file = models.FileField(upload_to='uploaded_media/')
    file_data = models.BinaryField(editable=False, blank=True, null=True)
    title = models.CharField(max_length=255, blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Save binary content of the file to file_data
        if self.file and not self.file_data:
            self.file.seek(0)
            self.file_data = self.file.read()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title if self.title else self.file.name
