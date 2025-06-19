from rest_framework import permissions

class IsAdminUser(permissions.BasePermission):
    """
    Allows access only to admin users.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'

class IsEditorUser(permissions.BasePermission):
    """
    Allows access to admin and editor users.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ['admin', 'editor']

class IsViewerUser(permissions.BasePermission):
    """
    Allows access to admin, editor, and viewer users for viewing operations.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ['admin', 'editor', 'viewer']

class IsOwnerOrStaff(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object or staff members to edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Staff members (admin, editor) can perform any action
        if request.user.role in ['admin', 'editor']:
            return True
            
        # Check if the object has an owner field and if the user is the owner
        return hasattr(obj, 'owner') and obj.owner == request.user
        
        return False