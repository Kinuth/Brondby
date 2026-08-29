from django.db import models
from django.conf import settings

class Client(models.Model):
    name = models.CharField(max_length=255, db_index=True)
    company_name = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        if self.company_name:
            return f"{self.name} ({self.company_name})"
        return self.name


class ServiceType(models.Model):
    name = models.CharField(max_length=200, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class JobStatus(models.TextChoices):
    INCOMING = 'incoming', 'Incoming'
    ASSIGNED = 'assigned', 'Assigned'
    PENDING = 'pending', 'Pending'
    COMPLETED = 'completed', 'Completed'
    CANCELLED = 'cancelled', 'Cancelled'


class Job(models.Model):
    client = models.ForeignKey(
        Client,
        on_delete=models.PROTECT,
        related_name='jobs',
        db_index=True,
        help_text="Historical client records cannot be deleted if associated jobs exist."
    )
    service_type = models.ForeignKey(
        ServiceType,
        on_delete=models.PROTECT,
        related_name='jobs',
        db_index=True,
        help_text="Historical service records cannot be deleted if associated jobs exist."
    )
    assigned_worker = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_jobs',
        db_index=True
    )
    status = models.CharField(
        max_length=20,
        choices=JobStatus.choices,
        default=JobStatus.INCOMING,
        db_index=True
    )
    due_date = models.DateField(null=True, blank=True, db_index=True)
    description = models.TextField(blank=True, help_text="Detailed job description and requirements.")
    notes = models.TextField(blank=True, help_text="Internal notes or special instructions.")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='created_jobs'
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Job #{self.id}: {self.service_type.name} - {self.client.name} [{self.get_status_display()}]"


class JobStatusLog(models.Model):
    """
    Immutable audit trail recording every job status transition.
    """
    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name='status_logs',
        db_index=True
    )
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='job_status_changes'
    )
    old_status = models.CharField(max_length=20, choices=JobStatus.choices)
    new_status = models.CharField(max_length=20, choices=JobStatus.choices)
    note = models.TextField(blank=True, help_text="Reason or progress commentary.")
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        actor = self.changed_by.username if self.changed_by else "System"
        return f"Job #{self.job_id}: {self.old_status} -> {self.new_status} by {actor}"
