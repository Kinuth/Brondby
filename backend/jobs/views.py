from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Sum, Q
from django.utils import timezone
from datetime import timedelta
from authentication.permissions import IsAdmin, IsAssignedWorkerOrAdmin
from authentication.models import UserRole
from billing.models import Invoice, InvoiceStatus
from .models import Client, ServiceType, Job, JobStatus, JobStatusLog, JobAttachment
from .serializers import (
    ClientSerializer,
    ServiceTypeSerializer,
    JobSerializer,
    JobStatusLogSerializer,
    JobAttachmentSerializer,
)

class ClientViewSet(viewsets.ModelViewSet):
    """
    Admin-only management of Client records.
    Workers are strictly forbidden at the permission layer.
    """
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [IsAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'company_name', 'email', 'phone']
    ordering_fields = ['name', 'created_at']
    ordering = ['-created_at']


class ServiceTypeViewSet(viewsets.ModelViewSet):
    """
    Admin has full CRUD. Authenticated workers can read service types to display/filter jobs.
    """
    queryset = ServiceType.objects.all()
    serializer_class = ServiceTypeSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdmin()]


class JobViewSet(viewsets.ModelViewSet):
    """
    Job tracking ViewSet with scoped querysets and role-based permissions:
    - Admin: view all jobs, create, update any field, reassign, delete.
    - Worker: view ONLY assigned jobs, update status from assigned -> pending -> completed with notes.
    """
    serializer_class = JobSerializer
    permission_classes = [IsAssignedWorkerOrAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'service_type', 'assigned_worker', 'client']
    search_fields = ['client__name', 'client__company_name', 'description', 'notes']
    ordering_fields = ['created_at', 'due_date', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Job.objects.none()

        # Admins and superusers see all jobs
        if user.role == UserRole.ADMIN or user.is_superuser:
            queryset = Job.objects.all()
        else:
            # Workers ONLY see jobs assigned to them
            queryset = Job.objects.filter(assigned_worker=user)

        # Date range filtering support
        created_after = self.request.query_params.get('created_after')
        created_before = self.request.query_params.get('created_before')
        due_after = self.request.query_params.get('due_after')
        due_before = self.request.query_params.get('due_before')

        if created_after:
            queryset = queryset.filter(created_at__date__gte=created_after)
        if created_before:
            queryset = queryset.filter(created_at__date__lte=created_before)
        if due_after:
            queryset = queryset.filter(due_date__gte=due_after)
        if due_before:
            queryset = queryset.filter(due_date__lte=due_before)

        return queryset.select_related('client', 'service_type', 'assigned_worker', 'created_by').prefetch_related('status_logs', 'attachments')

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser], permission_classes=[IsAssignedWorkerOrAdmin])
    def upload_attachment(self, request, pk=None):
        """
        Upload file attachment to an investigation case:
        POST /api/jobs/{id}/upload_attachment/
        multipart/form-data: file, description (optional)
        """
        job = self.get_object()
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'file': 'No file was submitted.'}, status=status.HTTP_400_BAD_REQUEST)

        description = request.data.get('description', '')
        attachment = JobAttachment.objects.create(
            job=job,
            file=file_obj,
            file_name=file_obj.name,
            file_size=file_obj.size,
            uploaded_by=request.user,
            description=description
        )

        serializer = JobAttachmentSerializer(attachment, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsAssignedWorkerOrAdmin])
    def update_status(self, request, pk=None):
        """
        Dedicated endpoint for updating status with an audit note.
        POST /api/jobs/{id}/update_status/
        Payload: { "status": "pending", "note": "Finished field interview" }
        """
        job = self.get_object()
        new_status = request.data.get('status')
        note = request.data.get('note', '')

        if not new_status:
            return Response({'status': 'Status field is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Serialize and validate through JobSerializer
        serializer = self.get_serializer(
            job,
            data={'status': new_status, 'status_note': note},
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status=status.HTTP_200_OK)


class JobAttachmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for individual task/case attachments.
    - Admins have full access.
    - Workers can view and download attachments for their assigned cases.
    """
    serializer_class = JobAttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return JobAttachment.objects.none()

        if user.role == UserRole.ADMIN or user.is_superuser:
            return JobAttachment.objects.all().select_related('job', 'uploaded_by')

        return JobAttachment.objects.filter(job__assigned_worker=user).select_related('job', 'uploaded_by')

    def perform_create(self, serializer):
        file_obj = self.request.FILES.get('file')
        serializer.save(
            uploaded_by=self.request.user,
            file_name=file_obj.name if file_obj else 'document',
            file_size=file_obj.size if file_obj else 0
        )


class JobStatusLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Audit trail viewset.
    - Admins see all logs.
    - Workers see logs only for jobs assigned to them.
    """
    serializer_class = JobStatusLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['job', 'changed_by', 'new_status']
    ordering = ['-timestamp']

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return JobStatusLog.objects.none()

        if user.role == UserRole.ADMIN or user.is_superuser:
            return JobStatusLog.objects.all().select_related('job', 'changed_by')

        return JobStatusLog.objects.filter(job__assigned_worker=user).select_related('job', 'changed_by')


class DashboardStatsView(APIView):
    """
    Summary stats endpoint:
    - Admin: system-wide job counts by status, revenue metrics (invoiced, paid, outstanding), client counts, recent logs.
    - Worker: personal job counts by status, upcoming due dates, personal recent logs.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        is_admin = user.role == UserRole.ADMIN or user.is_superuser

        if is_admin:
            # Aggregate system-wide jobs
            jobs_qs = Job.objects.all()
            status_counts_raw = jobs_qs.values('status').annotate(count=Count('id'))
            status_counts = {choice[0]: 0 for choice in JobStatus.choices}
            for item in status_counts_raw:
                status_counts[item['status']] = item['count']

            total_jobs = jobs_qs.count()

            # Financial metrics
            invoices_qs = Invoice.objects.all()
            total_invoiced = invoices_qs.aggregate(total=Sum('amount'))['total'] or 0
            total_paid = invoices_qs.filter(status=InvoiceStatus.PAID).aggregate(total=Sum('amount'))['total'] or 0
            total_unpaid = invoices_qs.filter(status=InvoiceStatus.UNPAID).aggregate(total=Sum('amount'))['total'] or 0

            paid_invoices_count = invoices_qs.filter(status=InvoiceStatus.PAID).count()
            unpaid_invoices_count = invoices_qs.filter(status=InvoiceStatus.UNPAID).count()

            total_clients = Client.objects.count()

            # Recent audit activity (last 10)
            recent_logs = JobStatusLog.objects.select_related('job', 'changed_by')[:10]
            logs_data = JobStatusLogSerializer(recent_logs, many=True).data

            return Response({
                'role': 'admin',
                'total_jobs': total_jobs,
                'status_counts': status_counts,
                'financials': {
                    'total_invoiced': float(total_invoiced),
                    'total_paid': float(total_paid),
                    'total_outstanding': float(total_unpaid),
                    'paid_count': paid_invoices_count,
                    'unpaid_count': unpaid_invoices_count,
                },
                'total_clients': total_clients,
                'recent_activity': logs_data,
            })
        else:
            # Worker scoped metrics
            my_jobs = Job.objects.filter(assigned_worker=user)
            status_counts_raw = my_jobs.values('status').annotate(count=Count('id'))
            status_counts = {choice[0]: 0 for choice in JobStatus.choices}
            for item in status_counts_raw:
                status_counts[item['status']] = item['count']

            total_jobs = my_jobs.count()

            # Upcoming deadlines (jobs due within 7 days or overdue that aren't completed or cancelled)
            today = timezone.now().date()
            upcoming_jobs = my_jobs.filter(
                Q(due_date__isnull=False),
                ~Q(status__in=[JobStatus.COMPLETED, JobStatus.CANCELLED])
            ).order_by('due_date')[:10]
            upcoming_data = JobSerializer(upcoming_jobs, many=True, context={'request': request}).data

            # Recent activity on their jobs
            recent_logs = JobStatusLog.objects.filter(job__assigned_worker=user).select_related('job', 'changed_by')[:10]
            logs_data = JobStatusLogSerializer(recent_logs, many=True).data

            return Response({
                'role': 'worker',
                'total_jobs': total_jobs,
                'status_counts': status_counts,
                'upcoming_deadlines': upcoming_data,
                'recent_activity': logs_data,
            })
