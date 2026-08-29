from django.contrib.auth.models import AbstractUser
from django.db import models

class UserRole(models.TextChoices):
    ADMIN = 'admin', 'Admin'
    WORKER = 'worker', 'Worker'

class User(AbstractUser):
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.WORKER,
        db_index=True,
        help_text="Role determining access levels: Admin (full access) or Worker (assigned jobs only)."
    )
    phone_number = models.CharField(max_length=30, blank=True, null=True)

    @property
    def is_admin_role(self) -> bool:
        return self.role == UserRole.ADMIN or self.is_superuser

    @property
    def is_worker_role(self) -> bool:
        return self.role == UserRole.WORKER

    def __str__(self):
        full_name = self.get_full_name()
        return f"{full_name or self.username} ({self.get_role_display()})"
