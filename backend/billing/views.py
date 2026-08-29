from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from authentication.permissions import IsAdmin
from jobs.models import Job, JobStatus
from jobs.serializers import JobSerializer
from .models import Invoice, InvoiceStatus
from .serializers import InvoiceSerializer

class InvoiceViewSet(viewsets.ModelViewSet):
    """
    Admin-only Invoicing management.
    Workers are denied access completely at the permission layer.
    """
    queryset = Invoice.objects.select_related('job', 'job__client', 'job__service_type').all()
    serializer_class = InvoiceSerializer
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'job']
    search_fields = ['invoice_number', 'job__client__name', 'notes']
    ordering_fields = ['issued_date', 'amount', 'status', 'created_at']
    ordering = ['-issued_date', '-created_at']

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def mark_paid(self, request, pk=None):
        """
        Mark an invoice as paid with an optional paid_date (defaults to today).
        POST /api/invoices/{id}/mark_paid/
        """
        invoice = self.get_object()
        paid_date = request.data.get('paid_date')
        if not paid_date:
            paid_date = timezone.now().date()
        invoice.mark_as_paid(paid_date=paid_date)
        serializer = self.get_serializer(invoice)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def unbilled_jobs(self, request):
        """
        Returns jobs that do not yet have an invoice associated with them,
        especially completed jobs ready for billing.
        """
        jobs_with_invoices = Invoice.objects.values_list('job_id', flat=True)
        unbilled = Job.objects.exclude(id__in=jobs_with_invoices).select_related('client', 'service_type')
        status_filter = request.query_params.get('status')
        if status_filter:
            unbilled = unbilled.filter(status=status_filter)
        serializer = JobSerializer(unbilled, many=True)
        return Response(serializer.data)
