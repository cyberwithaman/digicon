from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from django.conf import settings
from django.conf.urls.static import static
from .views import get_current_user, reset_password

router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'media', views.MediaViewSet)
router.register(r'batches', views.MediaBatchViewSet)

urlpatterns = [
    path('', include(router.urls)),
    
    # Auth endpoints
    path('auth/login/', views.login_user),
    path('auth/logout/', views.logout_user),
    
    # User profile endpoints
    path('users/me/', get_current_user, name='current-user'),
    path('users/profile/update/', views.update_profile),
    path('users/password/change/', views.change_password),
    path('users/<int:user_id>/reset-password/', reset_password, name='reset_password'),
    
    # Media upload endpoints
    path('upload/', views.MediaUploadView.as_view(), name='media-upload'),
    path('batch-upload/', views.batch_upload, name='batch-upload'),
    path('media/batches/', views.get_media_batches, name='media-batches'),
    path('media/add-to-batch/', views.add_to_batch, name='add-to-batch'),
    path('batches/<int:batch_id>/export-pdf/', views.export_batch_pdf, name='export-batch-pdf'),
    path('batches/<int:batch_id>/images/', views.batch_images, name='batch-images'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)