from rest_framework import serializers
from .models import Invoice, InvoiceStatus
from jobs.models import Job
from jobs.serializers import JobSerializer

class InvoiceSerializer(serializers.ModelSerializer):
    job_detail = JobSerializer(source='job', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    client_name = serializers.CharField(source='job.client.name', read_only=True)
    service_type_name = serializers.CharField(source='job.service_type.name', read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id',
            'job',
            'job_detail',
            'client_name',
            'service_type_name',
            'invoice_number',
            'amount',
            'status',
            'status_display',
            'issued_date',
            'paid_date',
            'notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'invoice_number', 'created_at', 'updated_at']

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Invoice amount must be greater than zero.")
        return value
