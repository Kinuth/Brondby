from django.test import TestCase
from django.contrib.auth import get_user_model
from authentication.models import UserRole
from jobs.models import Client, ServiceType, Job, JobStatus, JobStatusLog
from billing.models import Invoice, InvoiceStatus

User = get_user_model()

class ModelAndAuditSignalTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username='admin_test',
            email='admin@test.com',
            password='password123',
            role=UserRole.ADMIN
        )
        self.worker = User.objects.create_user(
            username='worker_test',
            email='worker@test.com',
            password='password123',
            role=UserRole.WORKER
        )
        self.client = Client.objects.create(
            name='Test African Enterprises',
            company_name='TAE Holdings',
            email='tae@example.com'
        )
        self.service = ServiceType.objects.create(
            name='Enhanced Due Diligence (EDD)',
            description='Test EDD'
        )

    def test_job_creation_creates_initial_status_log(self):
        job = Job.objects.create(
            client=self.client,
            service_type=self.service,
            assigned_worker=self.worker,
            status=JobStatus.ASSIGNED,
            created_by=self.admin
        )
        # Verify initial JobStatusLog was created automatically via signal
        logs = JobStatusLog.objects.filter(job=job)
        self.assertEqual(logs.count(), 1)
        log = logs.first()
        self.assertEqual(log.new_status, JobStatus.ASSIGNED)
        self.assertEqual(log.old_status, 'none')

    def test_job_status_change_creates_audit_log(self):
        job = Job.objects.create(
            client=self.client,
            service_type=self.service,
            assigned_worker=self.worker,
            status=JobStatus.ASSIGNED,
            created_by=self.admin
        )

        # Update status
        job.status = JobStatus.PENDING
        job._changed_by = self.worker
        job._status_note = 'Field research started'
        job.save()

        logs = JobStatusLog.objects.filter(job=job).order_by('timestamp')
        self.assertEqual(logs.count(), 2)
        latest_log = logs.last()
        self.assertEqual(latest_log.old_status, JobStatus.ASSIGNED)
        self.assertEqual(latest_log.new_status, JobStatus.PENDING)
        self.assertEqual(latest_log.changed_by, self.worker)
        self.assertEqual(latest_log.note, 'Field research started')

    def test_invoice_creation_and_mark_as_paid(self):
        job = Job.objects.create(
            client=self.client,
            service_type=self.service,
            assigned_worker=self.worker,
            status=JobStatus.COMPLETED,
            created_by=self.admin
        )
        invoice = Invoice.objects.create(
            job=job,
            amount=1500.00
        )
        self.assertTrue(invoice.invoice_number.startswith('INV-'))
        self.assertEqual(invoice.status, InvoiceStatus.UNPAID)
        self.assertIsNone(invoice.paid_date)

        invoice.mark_as_paid()
        invoice.refresh_from_db()
        self.assertEqual(invoice.status, InvoiceStatus.PAID)
        self.assertIsNotNone(invoice.paid_date)
