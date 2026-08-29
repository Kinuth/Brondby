from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from authentication.models import UserRole
from jobs.models import Client, ServiceType, Job, JobStatus
from billing.models import Invoice

User = get_user_model()

class RoleBasedAccessControlTests(APITestCase):
    def setUp(self):
        # Admin user
        self.admin = User.objects.create_user(
            username='admin_user',
            email='admin@brondby.com',
            password='Password123!',
            role=UserRole.ADMIN
        )
        # Workers
        self.worker1 = User.objects.create_user(
            username='worker_one',
            email='worker1@brondby.com',
            password='Password123!',
            role=UserRole.WORKER
        )
        self.worker2 = User.objects.create_user(
            username='worker_two',
            email='worker2@brondby.com',
            password='Password123!',
            role=UserRole.WORKER
        )

        # Clients and Services
        self.client = Client.objects.create(
            name='Kenya Commercial Bank',
            company_name='KCB Group',
            email='kcb@example.com'
        )
        self.service = ServiceType.objects.create(
            name='Enhanced Due Diligence (EDD)',
            description='In-depth checks'
        )

        # Jobs
        self.job_w1 = Job.objects.create(
            client=self.client,
            service_type=self.service,
            assigned_worker=self.worker1,
            status=JobStatus.ASSIGNED,
            created_by=self.admin
        )
        self.job_w2 = Job.objects.create(
            client=self.client,
            service_type=self.service,
            assigned_worker=self.worker2,
            status=JobStatus.ASSIGNED,
            created_by=self.admin
        )

        # Invoice
        self.invoice = Invoice.objects.create(
            job=self.job_w1,
            amount=3500.00
        )

    # 1. CLIENT ENDPOINT PERMISSIONS
    def test_worker_cannot_access_clients(self):
        self.client_drf = self.client_class()
        self.client_drf.force_authenticate(user=self.worker1)
        response = self.client_drf.get('/api/clients/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        response = self.client_drf.post('/api/clients/', {'name': 'Unauthorized Inc'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_access_and_create_clients(self):
        self.client_drf = self.client_class()
        self.client_drf.force_authenticate(user=self.admin)
        response = self.client_drf.get('/api/clients/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        create_res = self.client_drf.post('/api/clients/', {
            'name': 'Standard Chartered Africa',
            'company_name': 'StanChart',
            'email': 'corp@sc.com'
        })
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)

    # 2. INVOICE ENDPOINT PERMISSIONS
    def test_worker_cannot_access_invoices(self):
        self.client_drf = self.client_class()
        self.client_drf.force_authenticate(user=self.worker1)
        response = self.client_drf.get('/api/invoices/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        response = self.client_drf.get(f'/api/invoices/{self.invoice.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_manage_invoices(self):
        self.client_drf = self.client_class()
        self.client_drf.force_authenticate(user=self.admin)
        response = self.client_drf.get('/api/invoices/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Mark paid
        mark_res = self.client_drf.post(f'/api/invoices/{self.invoice.id}/mark_paid/')
        self.assertEqual(mark_res.status_code, status.HTTP_200_OK)
        self.assertEqual(mark_res.data['status'], 'paid')

    # 3. JOB SCOPING & PERMISSIONS
    def test_worker_only_receives_their_own_assigned_jobs(self):
        self.client_drf = self.client_class()
        self.client_drf.force_authenticate(user=self.worker1)
        response = self.client_drf.get('/api/jobs/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Worker 1 should see job_w1 but NOT job_w2
        results = response.data.get('results', response.data)
        job_ids = [j['id'] for j in results]
        self.assertIn(self.job_w1.id, job_ids)
        self.assertNotIn(self.job_w2.id, job_ids)

    def test_worker_cannot_view_other_workers_job_detail(self):
        self.client_drf = self.client_class()
        self.client_drf.force_authenticate(user=self.worker1)
        response = self.client_drf.get(f'/api/jobs/{self.job_w2.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_worker_cannot_create_or_delete_jobs(self):
        self.client_drf = self.client_class()
        self.client_drf.force_authenticate(user=self.worker1)

        # Try to create job
        create_res = self.client_drf.post('/api/jobs/', {
            'client': self.client.id,
            'service_type': self.service.id,
            'description': 'Malicious job'
        })
        self.assertEqual(create_res.status_code, status.HTTP_403_FORBIDDEN)

        # Try to delete job
        delete_res = self.client_drf.delete(f'/api/jobs/{self.job_w1.id}/')
        self.assertEqual(delete_res.status_code, status.HTTP_403_FORBIDDEN)

    def test_worker_valid_status_transition_lifecycle(self):
        self.client_drf = self.client_class()
        self.client_drf.force_authenticate(user=self.worker1)

        # 1. Transition assigned -> pending (allowed)
        res1 = self.client_drf.patch(f'/api/jobs/{self.job_w1.id}/', {
            'status': JobStatus.PENDING,
            'status_note': 'Starting investigation interviews'
        })
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.job_w1.refresh_from_db()
        self.assertEqual(self.job_w1.status, JobStatus.PENDING)

        # 2. Transition pending -> completed (allowed)
        res2 = self.client_drf.patch(f'/api/jobs/{self.job_w1.id}/', {
            'status': JobStatus.COMPLETED,
            'status_note': 'Report compiled and submitted'
        })
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.job_w1.refresh_from_db()
        self.assertEqual(self.job_w1.status, JobStatus.COMPLETED)

    def test_worker_invalid_status_transition_blocked(self):
        self.client_drf = self.client_class()
        self.client_drf.force_authenticate(user=self.worker1)

        # Cannot jump assigned -> completed directly
        res = self.client_drf.patch(f'/api/jobs/{self.job_w1.id}/', {
            'status': JobStatus.COMPLETED,
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_worker_cannot_modify_forbidden_fields(self):
        self.client_drf = self.client_class()
        self.client_drf.force_authenticate(user=self.worker1)

        # Attempt to reassign worker or change client
        res = self.client_drf.patch(f'/api/jobs/{self.job_w1.id}/', {
            'assigned_worker': self.worker2.id
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
