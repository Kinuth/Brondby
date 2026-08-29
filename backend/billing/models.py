import uuid
from datetime import date
from django.db import models
from django.utils import timezone
from jobs.models import Job

class InvoiceStatus(models.TextChoices):
    UNPAID = 'unpaid', 'Unpaid'
    PAID = 'paid', 'Paid'


def generate_invoice_number():
    today = date.today()
    random_suffix = uuid.uuid4().hex[:6].upper()
    return f"INV-{today.strftime('%Y%m')}-{random_suffix}"


class Invoice(models.Model):
    job = models.ForeignKey(
        Job,
        on_delete=models.PROTECT,
        related_name='invoices',
        db_index=True,
        help_text="Historical job associated with this invoice cannot be deleted."
    )
    invoice_number = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,
        default=generate_invoice_number,
        help_text="Unique auto-generated invoice identifier."
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Invoice total amount."
    )
    status = models.CharField(
        max_length=20,
        choices=InvoiceStatus.choices,
        default=InvoiceStatus.UNPAID,
        db_index=True
    )
    issued_date = models.DateField(default=timezone.now, db_index=True)
    paid_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, help_text="Payment terms, wire details, or client notes.")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-issued_date', '-created_at']

    def mark_as_paid(self, paid_date=None):
        self.status = InvoiceStatus.PAID
        self.paid_date = paid_date or timezone.now().date()
        self.save(update_fields=['status', 'paid_date', 'updated_at'])

    def __str__(self):
        return f"{self.invoice_number} - {self.job.client.name} (${self.amount}) [{self.get_status_display()}]"
