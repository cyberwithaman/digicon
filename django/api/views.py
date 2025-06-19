from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, update_session_auth_hash
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.middleware.csrf import get_token
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, IsAdminUser

from .models import Media, User, MediaBatch
from .serializers import MediaSerializer, UserSerializer, MediaBatchSerializer
import logging
from .permissions import IsAdminUser, IsViewerUser, IsEditorUser
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import User
from .permissions import IsOwnerOrStaff

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reset_password(request, user_id):
    try:
        user = User.objects.get(id=user_id)
        
        # Get new password and confirmation from request
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')
        
        # Validate passwords
        if not new_password or not confirm_password:
            return Response({'error': 'Both new password and confirmation are required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        if new_password != confirm_password:
            return Response({'error': 'Passwords do not match'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Set new password
        user.set_password(new_password)
        user.save()
        
        return Response({
            'message': 'Password reset successfully'
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    
    # Create reset link
    reset_link = f"http://192.168.240.6:8000/api/password-reset/{uid}/{token}/"
    
    # Send email
    subject = 'Password Reset Request'
    message = render_to_string('password_reset_email.txt', {
        'user': user,
        'reset_link': reset_link,
    })
    send_mail(subject, message, 'noreply@yourdomain.com', [user.email])
    
    return Response({'message': 'Password reset link has been sent to your email'}, status=status.HTTP_200_OK)

logger = logging.getLogger(__name__)

# Media ViewSet
@method_decorator(csrf_exempt, name='dispatch')
class MediaViewSet(viewsets.ModelViewSet):
    queryset = Media.objects.all()
    serializer_class = MediaSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get_permissions(self):
        if self.action == 'list' or self.action == 'retrieve':
            # Anyone authenticated can list/retrieve, but queryset will be filtered
            permission_classes = [IsAuthenticated]
        elif self.action == 'create':
            # Anyone authenticated can create
            permission_classes = [IsAuthenticated]
        else:
            # For update, partial_update, destroy
            permission_classes = [IsAuthenticated, IsOwnerOrStaff]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        user = self.request.user
        # Admin, editor, and viewer can see all media
        if user.role in ['admin', 'editor', 'viewer']:
            return Media.objects.all()
        # Regular users can only see their own media
        return Media.objects.filter(owner=user)
        
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

# Update MediaBatchViewSet permissions similarly
class MediaBatchViewSet(viewsets.ModelViewSet):
    queryset = MediaBatch.objects.all()
    serializer_class = MediaBatchSerializer
    permission_classes = [IsAuthenticated]  # Default permission
    
    def get_permissions(self):
        if self.action == 'list' or self.action == 'retrieve':
            # Anyone authenticated can list/retrieve, but queryset will be filtered
            permission_classes = [IsAuthenticated]
        elif self.action == 'create':
            # Anyone authenticated can create
            permission_classes = [IsAuthenticated]
        else:
            # For update, partial_update, destroy
            permission_classes = [IsAuthenticated, IsOwnerOrStaff]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        user = self.request.user
        # Admin, editor, and viewer can see all batches
        if user.role in ['admin', 'editor', 'viewer']:
            return MediaBatch.objects.all()
        # Regular users can only see their own batches
        return MediaBatch.objects.filter(owner=user)
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

# Update UserViewSet
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]  # Changed from IsAdminUser to IsAuthenticated

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return User.objects.all()
        return User.objects.filter(id=user.id)

    def update(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            # Check if user is updating their own profile or is an admin
            if request.user.id != instance.id and request.user.role != 'admin':
                return Response(
                    {'error': 'You do not have permission to update this profile'},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Handle profile photo upload
            if 'profile_photo' in request.FILES:
                instance.profile_photo = request.FILES['profile_photo']
                instance.save()
                return Response(self.get_serializer(instance).data)

            # Handle other profile updates
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def get_serializer_context(self):
        return {'request': self.request}

    def get_serializer_context(self):
        return {'request': self.request}

# Auth: Login
@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response({'error': 'Username and password are required'}, status=400)

    user = authenticate(username=username, password=password)
    if user:
        token, _ = Token.objects.get_or_create(user=user)
        response = Response({
            'token': token.key,
            'is_admin': user.is_admin,
            'username': user.username,
            'user_id': user.id,
        })
        # Add CSRF token to the response
        response['X-CSRFToken'] = get_token(request)
        return response
    else:
        return Response({'error': 'Invalid credentials'}, status=401)

# Auth: Logout
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_user(request):
    request.user.auth_token.delete()
    return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)

# Profile: Get current user profile
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    user = request.user
    serializer = UserSerializer(user)
    return Response(serializer.data)

# Profile: Update profile
@api_view(['PUT', 'POST'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    user = request.user
    if request.FILES:
        request.data['profile_photo'] = request.FILES['profile_photo']

    serializer = UserSerializer(user, data=request.data, partial=True, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Profile: Change password
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    user = request.user
    new_password = request.data.get('new_password')

    if not new_password:
        return Response({'detail': 'New password is required'}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()
    update_session_auth_hash(request, user)  # Keep user logged in after password change
    return Response({'detail': 'Password updated successfully'}, status=status.HTTP_200_OK)

# Optional: class-based profile view (can be removed if not used)
class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user, context={'request': request})
        return Response(serializer.data)

# Add MediaBatchViewSet
class MediaBatchViewSet(viewsets.ModelViewSet):
    queryset = MediaBatch.objects.all()
    serializer_class = MediaBatchSerializer
    
    def get_permissions(self):
        if self.action == 'list' or self.action == 'retrieve':
            # Anyone authenticated can list/retrieve, but queryset will be filtered
            permission_classes = [IsAuthenticated]
        elif self.action == 'create':
            # Anyone authenticated can create
            permission_classes = [IsAuthenticated]
        else:
            # For update, partial_update, destroy
            permission_classes = [IsAuthenticated, IsOwnerOrStaff]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        user = self.request.user
        # Admin, editor, and viewer can see all batches
        if user.role in ['admin', 'editor', 'viewer']:
            return MediaBatch.objects.all()
        # Regular users can only see their own batches
        return MediaBatch.objects.filter(owner=user)
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

# Update MediaUploadView to handle batch uploads
class MediaUploadView(APIView):
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        logger.info(f"Received file upload request: {request.data}")
        
        # Ensure file is present
        if 'file' not in request.data:
            return Response({'detail': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Add the owner to the request data
        request.data['owner'] = request.user.id
        
        # Handle batch information
        batch_id = request.data.get('batch')
        batch_referral_id = request.data.get('batch_referral_id')
        batch_title = request.data.get('batch_title')
        
        # Prepare data for serializer
        data = request.data.copy()
        if batch_referral_id:
            data['batch_referral_id'] = batch_referral_id
        if batch_title:
            data['batch_title'] = batch_title
        
        file_serializer = MediaSerializer(data=data, context={'request': request})
        if file_serializer.is_valid():
            file_serializer.save()
            logger.info(f"File saved successfully: {file_serializer.data}")
            return Response(file_serializer.data, status=status.HTTP_201_CREATED)
        else:
            logger.error(f"File upload failed: {file_serializer.errors}")
            return Response(file_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Add batch upload endpoint for multiple files
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def batch_upload(request):
    if 'files[]' not in request.FILES:
        return Response({'detail': 'No files uploaded'}, status=status.HTTP_400_BAD_REQUEST)
    
    batch_title = request.data.get('title')
    if not batch_title:
        return Response({'detail': 'Batch title is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Create a new batch
    batch = MediaBatch.objects.create(
        owner=request.user,
        title=batch_title
    )
    
    # Process each file
    uploaded_files = []
    files = request.FILES.getlist('files[]')
    
    # Check minimum requirement only
    if len(files) < 20:
        batch.delete()
        return Response({'detail': 'Minimum 20 files required for batch upload'}, 
                        status=status.HTTP_400_BAD_REQUEST)
    
    # Process all files (no maximum limit)
    for file in files:
        media = Media.objects.create(
            owner=request.user,
            batch=batch,
            file=file,
            title=request.data.get('file_title', '')
        )
        uploaded_files.append(MediaSerializer(media, context={'request': request}).data)
    
    return Response({
        'batch': MediaBatchSerializer(batch, context={'request': request}).data,
        'files': uploaded_files
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def batch_images(request, batch_id):
    try:
        batch = MediaBatch.objects.get(id=batch_id)
        files = request.FILES.getlist('images')
        
        for file in files:
            Media.objects.create(
                file=file,
                owner=request.user,
                batch=batch,
                title=file.name
            )
        
        return Response({'message': 'Images added successfully'}, status=status.HTTP_200_OK)
    except MediaBatch.DoesNotExist:
        return Response({'error': 'Batch not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

from django.http import FileResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from PIL import Image
from io import BytesIO
import os
from django.conf import settings

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_media_batches(request):
    batches = MediaBatch.objects.filter(owner=request.user)
    serializer = MediaBatchSerializer(batches, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_batch(request):
    batch_id = request.data.get('batch_id')
    try:
        batch = MediaBatch.objects.get(id=batch_id, owner=request.user)
        files = request.FILES.getlist('files[]')
        
        for file in files:
            Media.objects.create(
                owner=request.user,
                batch=batch,
                file=file
            )
        
        return Response({'message': 'Images added successfully'})
    except MediaBatch.DoesNotExist:
        return Response({'error': 'Batch not found'}, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_batch_pdf(request, batch_id):
    try:
        batch = MediaBatch.objects.get(id=batch_id)
        
        # Check if user has permission to access this batch
        if request.user.role not in ['admin', 'editor', 'viewer'] and batch.owner != request.user:
            return Response({'detail': 'You do not have permission to access this batch'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        # Get all images in this batch
        images = batch.media_files.all()
        
        if not images:
            return Response({'detail': 'No images in this batch to export'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Create a PDF file
        # (Your existing PDF generation code here)
        
        # Set the content type explicitly for PDF
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{batch.title}_export.pdf"'
        
        # Your PDF generation logic here
        buffer = BytesIO()
        
        # Create PDF
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72
        )
        
        elements = []
        styles = getSampleStyleSheet()
        
        # Add title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=30
        )
        elements.append(Paragraph(f"Batch Report", title_style))
        
        # Add batch information
        elements.append(Paragraph(f"Batch ID: {batch.id}", styles['Heading2']))
        elements.append(Paragraph(f"Title: {batch.title}", styles['Heading2']))
        elements.append(Paragraph(f"Created: {batch.created_at.strftime('%Y-%m-%d %H:%M')}", styles['Normal']))
        elements.append(Spacer(1, 12))
        
        # Add images
        elements.append(Paragraph("Images:", styles['Heading2']))
        elements.append(Spacer(1, 12))
        
        # Create image table
        image_data = []
        current_row = []
        
        for media in batch.media_files.all():
            try:
                # Get image path
                img_path = media.file.path
                img = Image.open(img_path)
                
                # Resize image for PDF
                img.thumbnail((300, 300))
                
                # Save to temporary buffer
                img_buffer = BytesIO()
                img.save(img_buffer, format='JPEG')
                img_buffer.seek(0)
                
                # Create image for PDF
                img_for_pdf = RLImage(img_buffer, width=200, height=200)
                
                # Add image and details to table
                current_row.append([
                    img_for_pdf,
                    Paragraph(f"File: {os.path.basename(media.file.name)}", styles['Normal']),
                    Paragraph(f"Uploaded: {media.created_at.strftime('%Y-%m-%d')}", styles['Normal'])
                ])
                
                if len(current_row) == 2:
                    image_data.append(current_row)
                    current_row = []
                
            except Exception as e:
                print(f"Error processing image {media.file.name}: {str(e)}")
                continue
        
        # Add remaining images
        if current_row:
            image_data.append(current_row)
        
        # Create table for images
        for row in image_data:
            table = Table(row, colWidths=[250, 250])
            table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('PADDING', (0, 0), (-1, -1), 6),
            ]))
            elements.append(table)
            elements.append(Spacer(1, 12))
        
        # Build PDF
        doc.build(elements)
        buffer.seek(0)
        
        response = FileResponse(
            buffer,
            as_attachment=True,
            filename=f'batch_{batch.id}.pdf'
        )
        response['Content-Type'] = 'application/pdf'
        response['Content-Disposition'] = f'attachment; filename="batch_{batch.id}.pdf"'
        
        return response
        
    except MediaBatch.DoesNotExist:
        return Response(
            {'error': 'Batch not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        print(f"PDF Export Error: {str(e)}")
        return Response(
            {'error': f'Error generating PDF: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]  # Fix: permission_classes instead of permission_class  # Only admin users can access the list
