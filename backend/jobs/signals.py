from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from .models import Job, JobStatusLog

@receiver(pre_save, sender=Job)
def track_job_status_before_save(sender, instance, **kwargs):
    """
    Cache previous status before save so post_save can compare.
    """
    if instance.pk:
        try:
            previous = Job.objects.get(pk=instance.pk)
            instance._old_status = previous.status
        except Job.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None


@receiver(post_save, sender=Job)
def log_job_status_change(sender, instance, created, **kwargs):
    """
    Auto-create JobStatusLog entry whenever a job status changes, or when a job is first created.
    """
    old_status = getattr(instance, '_old_status', None)
    new_status = instance.status

    # Check if this is a creation or if status actually changed
    if created:
        changed_by = getattr(instance, '_changed_by', instance.created_by)
        note = getattr(instance, '_status_note', 'Job created initially.')
        JobStatusLog.objects.create(
            job=instance,
            changed_by=changed_by,
            old_status='none',
            new_status=new_status,
            note=note
        )
    elif old_status and old_status != new_status:
        changed_by = getattr(instance, '_changed_by', None)
        note = getattr(instance, '_status_note', '')
        JobStatusLog.objects.create(
            job=instance,
            changed_by=changed_by,
            old_status=old_status,
            new_status=new_status,
            note=note
        )
