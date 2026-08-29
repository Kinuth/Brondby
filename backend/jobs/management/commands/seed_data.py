from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from authentication.models import UserRole
from jobs.models import Client, ServiceType, Job, JobStatus, JobStatusLog
from billing.models import Invoice, InvoiceStatus

User = get_user_model()

from jobs.constants import SERVICES

CLIENTS = [
    {
        "name": "Standard Equity Partners Ltd",
        "company_name": "Standard Equity Partners",
        "email": "compliance@standardequity.africa",
        "phone": "+254 20 890 1200",
        "address": "Delta Corner Annex, Westlands, Nairobi, Kenya"
    },
    {
        "name": "Akin & Adeleke Legal Practitioners",
        "company_name": "Akin & Adeleke Chambers",
        "email": "investigations@akinlegal.ng",
        "phone": "+234 1 270 4500",
        "address": "Victoria Island, Lagos, Nigeria"
    },
    {
        "name": "Kilima Minerals Consortium",
        "company_name": "Kilima Resources Holding",
        "email": "legal@kilimaresources.com",
        "phone": "+27 11 445 8800",
        "address": "Sandton City, Johannesburg, South Africa"
    },
    {
        "name": "Dr. Kofi Mensah",
        "company_name": "",  # Individual
        "email": "kmensah.family@consulting.gh",
        "phone": "+233 24 550 7811",
        "address": "Airport Residential Area, Accra, Ghana"
    },
]

class Command(BaseCommand):
    help = "Seed complete demo dataset for Brondby Enterprises"

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("=== Starting Brondby Enterprises Demo Data Seeding ==="))

        # 1. Services
        self.stdout.write("\n1. Seeding Service Types...")
        service_objs = {}
        for s in SERVICES:
            obj, _ = ServiceType.objects.get_or_create(
                name=s["name"],
                defaults={"description": s["description"], "is_active": True}
            )
            service_objs[s["name"]] = obj
            self.stdout.write(f"   [+] {obj.name}")

        # 2. Users
        self.stdout.write("\n2. Seeding Users...")
        admin, _ = User.objects.get_or_create(
            username="admin",
            defaults={
                "email": "admin@brondby.com",
                "first_name": "Admin",
                "last_name": "Director",
                "role": UserRole.ADMIN,
                "is_staff": True,
                "is_superuser": True,
            }
        )
        admin.set_password("AdminPass123!")
        admin.role = UserRole.ADMIN
        admin.is_staff = True
        admin.is_superuser = True
        admin.save()
        self.stdout.write("   [+] Admin: admin@brondby.com / AdminPass123!")

        worker1, _ = User.objects.get_or_create(
            username="worker1",
            defaults={
                "email": "worker1@brondby.com",
                "first_name": "James",
                "last_name": "Mwangi",
                "role": UserRole.WORKER,
                "phone_number": "+254 712 345 678"
            }
        )
        worker1.set_password("WorkerPass123!")
        worker1.role = UserRole.WORKER
        worker1.save()
        self.stdout.write("   [+] Worker 1: worker1@brondby.com / WorkerPass123! (James Mwangi)")

        worker2, _ = User.objects.get_or_create(
            username="worker2",
            defaults={
                "email": "worker2@brondby.com",
                "first_name": "Amina",
                "last_name": "Diallo",
                "role": UserRole.WORKER,
                "phone_number": "+254 722 987 654"
            }
        )
        worker2.set_password("WorkerPass123!")
        worker2.role = UserRole.WORKER
        worker2.save()
        self.stdout.write("   [+] Worker 2: worker2@brondby.com / WorkerPass123! (Amina Diallo)")

        # 3. Clients
        self.stdout.write("\n3. Seeding Clients...")
        client_objs = []
        for c in CLIENTS:
            obj, _ = Client.objects.get_or_create(
                name=c["name"],
                defaults={
                    "company_name": c["company_name"],
                    "email": c["email"],
                    "phone": c["phone"],
                    "address": c["address"],
                }
            )
            client_objs.append(obj)
            self.stdout.write(f"   [+] Client: {obj.name}")

        # 4. Jobs & Status Logs
        self.stdout.write("\n4. Seeding Sample Jobs & Audit History...")
        today = timezone.now().date()

        demo_jobs_data = [
            {
                "client": client_objs[0],
                "service": service_objs["Enhanced Due Diligence (EDD)"],
                "assigned_worker": worker1,
                "status": JobStatus.PENDING,
                "due_date": today + timedelta(days=3),
                "desc": "Deep background intelligence and UBO tracing on prospective joint-venture partner in telecom infrastructure.",
                "notes": "Target has holding structures in Mauritius and Kenya.",
                "history": [
                    (JobStatus.ASSIGNED, admin, "Assigned to James Mwangi for primary registry and PEP checks."),
                    (JobStatus.PENDING, worker1, "Preliminary field inquiry underway. Registry records retrieved; verifying source of wealth.")
                ]
            },
            {
                "client": client_objs[1],
                "service": service_objs["Legal & Litigation Checks"],
                "assigned_worker": worker1,
                "status": JobStatus.COMPLETED,
                "due_date": today - timedelta(days=2),
                "desc": "High Court commercial registry searches and appellate litigation verification for cross-border acquisition.",
                "notes": "All litigation files inspected at Milimani Commercial Courts.",
                "history": [
                    (JobStatus.ASSIGNED, admin, "Urgent due diligence check for upcoming merger closing."),
                    (JobStatus.PENDING, worker1, "Accessing court registries and cross-referencing case numbers."),
                    (JobStatus.COMPLETED, worker1, "Completed report delivered: no adverse claims or outstanding judgements.")
                ]
            },
            {
                "client": client_objs[2],
                "service": service_objs["Certified Official Company Documents"],
                "assigned_worker": worker2,
                "status": JobStatus.ASSIGNED,
                "due_date": today + timedelta(days=5),
                "desc": "Official certified CR12 and Memorandum and Articles of Association retrieval from BRS.",
                "notes": "Original stamped copies required for bank opening.",
                "history": [
                    (JobStatus.ASSIGNED, admin, "Assigned to Amina Diallo for BRS physical stamping and notary.")
                ]
            },
            {
                "client": client_objs[3],
                "service": service_objs["Citizenship & Residency Programs"],
                "assigned_worker": worker2,
                "status": JobStatus.PENDING,
                "due_date": today + timedelta(days=1),
                "desc": "Verification of residency status, investor permits, and authenticity of immigration documentation.",
                "notes": "Client applying for high-net-worth investor residency clearance.",
                "history": [
                    (JobStatus.ASSIGNED, admin, "Assigned to Amina for passport and permit audit."),
                    (JobStatus.PENDING, worker2, "Submitted verification request to Immigration Department; awaiting sign-off.")
                ]
            },
            {
                "client": client_objs[0],
                "service": service_objs["Background Checks and Screening Services"],
                "assigned_worker": None,
                "status": JobStatus.INCOMING,
                "due_date": today + timedelta(days=8),
                "desc": "C-Suite executive screening: qualification verification, criminal history, and global sanctions search.",
                "notes": "Incoming request from Standard Equity. Unassigned.",
                "history": []
            },
        ]

        created_jobs = []
        for jd in demo_jobs_data:
            # Create job
            job = Job.objects.create(
                client=jd["client"],
                service_type=jd["service"],
                assigned_worker=jd["assigned_worker"],
                status=jd["status"],
                due_date=jd["due_date"],
                description=jd["desc"],
                notes=jd["notes"],
                created_by=admin
            )
            created_jobs.append(job)
            self.stdout.write(f"   [+] Job #{job.id}: {job.service_type.name} ({job.status})")

            # Seed specific history steps for demo audit trail
            for h_status, h_user, h_note in jd["history"]:
                JobStatusLog.objects.create(
                    job=job,
                    changed_by=h_user,
                    old_status=JobStatus.ASSIGNED if h_status != JobStatus.ASSIGNED else JobStatus.INCOMING,
                    new_status=h_status,
                    note=h_note,
                )

        # 5. Invoices
        self.stdout.write("\n5. Seeding Invoices...")
        # Create paid invoice for completed job
        completed_job = created_jobs[1]
        inv1 = Invoice.objects.create(
            job=completed_job,
            amount=2850.00,
            status=InvoiceStatus.PAID,
            issued_date=today - timedelta(days=3),
            paid_date=today - timedelta(days=1),
            notes="Net 30 terms. Paid via wire transfer ref: WT-892110"
        )
        self.stdout.write(f"   [+] Invoice {inv1.invoice_number}: ${inv1.amount} ({inv1.status})")

        # Create unpaid invoice for pending job
        pending_job = created_jobs[0]
        inv2 = Invoice.objects.create(
            job=pending_job,
            amount=4200.00,
            status=InvoiceStatus.UNPAID,
            issued_date=today - timedelta(days=1),
            notes="Milestone payment 1 upon commencement of Enhanced Due Diligence."
        )
        self.stdout.write(f"   [+] Invoice {inv2.invoice_number}: ${inv2.amount} ({inv2.status})")

        self.stdout.write(self.style.SUCCESS("\n=== Seeding Completed Successfully! ==="))
