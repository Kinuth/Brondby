from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from authentication.models import UserRole
from jobs.models import Client, ServiceType, Job, JobStatus
from billing.models import Invoice, InvoiceStatus

User = get_user_model()

class DashboardStatsTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username='admin_dash',
            email='admin@dash.com',
            password='Password123!',
            role=UserRole.ADMIN
        )
        self.worker = User.objects.create_user(
            username='worker_dash',
            email='worker@dash.com',
            password='Password123!',
            role=UserRole.WORKER
        )
        self.client = Client.objects.create(name='Acme Africa')
        self.service = ServiceType.objects.create(name='Legal Checks')

        self.job1 = Job.objects.create(
            client=self.client,
            service_type=self.service,
            assigned_worker=self.worker,
            status=JobStatus.ASSIGNED,
            created_by=self.admin
        )
        self.job2 = Job.objects.create(
            client=self.client,
            service_type=self.service,
            assigned_worker=None,
            status=JobStatus.INCOMING,
            created_by=self.admin
        )
        Invoice.objects.create(job=self.job1, amount=1000.00, status=InvoiceStatus.PAID)
        Invoice.objects.create(job=self.job2, amount=2500.00, status=InvoiceStatus.UNPAID)

    def test_admin_receives_financials_and_all_jobs(self):
        self.client_drf = self.client_class()
        self.client_drf.force_authenticate(user=self.admin)
        res = self.client_drf.get('/api/dashboard/stats/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['role'], 'admin')
        self.assertEqual(res.data['total_jobs'], 2)
        self.assertIn('financials', res.data)
        self.assertEqual(res.data['financials']['total_invoiced'], 3500.00)
        self.assertEqual(res.data['financials']['total_paid'], 1000.00)
        self.assertEqual(res.data['financials']['total_outstanding'], 2500.00)

    def test_worker_receives_only_personal_stats(self):
        self.client_drf = self.client_class()
        self.client_drf.force_authenticate(user=self.worker)
        res = self.client_drf.get('/api/dashboard/stats/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['role'], 'worker')
        # Only 1 job is assigned to this worker
        self.assertEqual(res.data['total_jobs'], 1)
        self.assertNotIn('financials', res.data)
        self.assertIn('upcoming_deadlines', res.data)
