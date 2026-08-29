from rest_framework import permissions
from .models import UserRole

class IsAdmin(permissions.BasePermission):
    """
    Permission check for Admin role or Django superuser.
    Grants full CRUD access across all resources.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role == UserRole.ADMIN or request.user.is_superuser)
        )

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class IsAssignedWorkerOrAdmin(permissions.BasePermission):
    """
    Permission check for Jobs:
    - Admins have full CRUD access.
    - Workers can view their own assigned jobs and update status/progress notes.
    - Workers CANNOT create jobs (POST) or delete jobs (DELETE).
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False

        # Admin has permission for any method
        if request.user.role == UserRole.ADMIN or request.user.is_superuser:
            return True

        # Workers cannot create new jobs or delete
        if getattr(view, 'action', None) == 'create' or request.method == 'DELETE':
            return False

        # Workers are allowed safe methods, PATCH/PUT, and detail POSTs (like upload_attachment) on assigned jobs
        return True

    def has_object_permission(self, request, view, obj):
        if not (request.user and request.user.is_authenticated):
            return False

        if request.user.role == UserRole.ADMIN or request.user.is_superuser:
            return True

        # For workers, object must be assigned to them and method cannot be DELETE
        if request.method == 'DELETE':
            return False

        return getattr(obj, 'assigned_worker_id', None) == request.user.id
