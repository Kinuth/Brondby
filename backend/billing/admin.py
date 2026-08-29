from django.contrib import admin
from .models import Invoice

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'job', 'amount', 'status', 'issued_date', 'paid_date')
    list_filter = ('status', 'issued_date', 'paid_date')
    search_fields = ('invoice_number', 'job__client__name', 'notes')
    ordering = ('-issued_date', '-created_at')
    readonly_fields = ('created_at', 'updated_at')
