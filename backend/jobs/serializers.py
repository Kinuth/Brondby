from rest_framework import serializers
from django.contrib.auth import get_user_model
from authentication.serializers import UserSerializer
from .models import Client, ServiceType, Job, JobStatus, JobStatusLog, JobAttachment

User = get_user_model()

class ClientSerializer(serializers.ModelSerializer):
    jobs_count = serializers.IntegerField(source='jobs.count', read_only=True)

    class Meta:
        model = Client
        fields = [
            'id',
            'name',
            'company_name',
            'email',
            'phone',
            'address',
            'created_at',
            'jobs_count'
        ]
        read_only_fields = ['id', 'created_at', 'jobs_count']


class ServiceTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceType
        fields = ['id', 'name', 'description', 'is_active']
        read_only_fields = ['id']


class JobAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = JobAttachment
        fields = [
            'id',
            'job',
            'file',
            'file_url',
            'file_name',
            'file_size',
            'uploaded_by',
            'uploaded_by_name',
            'description',
            'created_at',
        ]
        read_only_fields = ['id', 'file_size', 'file_name', 'uploaded_by', 'created_at']

    def get_uploaded_by_name(self, obj) -> str:
        if obj.uploaded_by:
            return obj.uploaded_by.get_full_name() or obj.uploaded_by.username
        return "System"

    def get_file_url(self, obj) -> str:
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return ""


class JobStatusLogSerializer(serializers.ModelSerializer):
    changed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = JobStatusLog
        fields = [
            'id',
            'job',
            'changed_by',
            'changed_by_name',
            'old_status',
            'new_status',
            'note',
            'timestamp',
        ]
        read_only_fields = fields

    def get_changed_by_name(self, obj) -> str:
        if obj.changed_by:
            return obj.changed_by.get_full_name() or obj.changed_by.username
        return "System"


class JobSerializer(serializers.ModelSerializer):
    client_detail = ClientSerializer(source='client', read_only=True)
    service_type_detail = ServiceTypeSerializer(source='service_type', read_only=True)
    assigned_worker_detail = UserSerializer(source='assigned_worker', read_only=True)
    created_by_detail = UserSerializer(source='created_by', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    status_logs = JobStatusLogSerializer(many=True, read_only=True)
    attachments = JobAttachmentSerializer(many=True, read_only=True)
    status_note = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Job
        fields = [
            'id',
            'client',
            'client_detail',
            'service_type',
            'service_type_detail',
            'assigned_worker',
            'assigned_worker_detail',
            'status',
            'status_display',
            'due_date',
            'description',
            'notes',
            'created_by',
            'created_by_detail',
            'created_at',
            'updated_at',
            'status_logs',
            'attachments',
            'status_note',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at', 'status_logs', 'attachments']

    def validate(self, attrs):
        request = self.context.get('request')
        user = request.user if request else None

        if self.instance and user and not (user.role == 'admin' or user.is_superuser):
            # Worker is updating this job
            # Worker can ONLY change status and status_note
            for field in ['client', 'service_type', 'assigned_worker', 'due_date', 'description']:
                if field in attrs:
                    raise serializers.ValidationError({field: "Workers are not permitted to change this field."})

            if 'status' in attrs:
                new_status = attrs['status']
                current_status = self.instance.status
                # Allowed worker transitions: assigned -> pending -> completed
                allowed_transitions = {
                    JobStatus.ASSIGNED: [JobStatus.PENDING],
                    JobStatus.PENDING: [JobStatus.COMPLETED],
                    JobStatus.COMPLETED: [],
                }
                valid_targets = allowed_transitions.get(current_status, [])
                if new_status not in valid_targets:
                    raise serializers.ValidationError({
                        'status': f"Workers can only transition status from 'assigned' -> 'pending' -> 'completed'. Cannot transition from '{current_status}' to '{new_status}'."
                    })

        return attrs

    def create(self, validated_data):
        status_note = validated_data.pop('status_note', None)
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['created_by'] = request.user

        job = Job(**validated_data)
        if request and request.user.is_authenticated:
            job._changed_by = request.user
        if status_note:
            job._status_note = status_note
        job.save()
        return job

    def update(self, instance, validated_data):
        status_note = validated_data.pop('status_note', None)
        request = self.context.get('request')

        if request and request.user.is_authenticated:
            instance._changed_by = request.user
        if status_note:
            instance._status_note = status_note

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance
