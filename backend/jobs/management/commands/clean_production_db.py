from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from authentication.models import UserRole
from jobs.models import Client, ServiceType, Job, JobStatusLog
from billing.models import Invoice

User = get_user_model()

SERVICES = [
    {
        "name": "Certified Official Company Documents",
        "description": "Retrieval, verification, and certification of official registrar documents, certificates of incorporation, CR12s, and shareholder registers across African jurisdictions."
    },
    {
        "name": "Enhanced Due Diligence (EDD)",
        "description": "Comprehensive investigative background reports, source of wealth analysis, politically exposed persons (PEP) vetting, and ultimate beneficial ownership (UBO) discovery."
    },
    {
        "name": "Legal & Litigation Checks",
        "description": "Search across commercial courts, appellate registries, regulatory enforcement notices, bankruptcy proceedings, and active arbitrations."
    },
    {
        "name": "Background Checks and Screening Services",
        "description": "Executive pre-employment screening, credential verification, adverse media intelligence, credit history, and regulatory disciplinary records."
    },
    {
        "name": "Citizenship & Residency Programs",
        "description": "Verification of residency status, citizenship documentation audits, passport authenticity checks, and immigration compliance vetting."
    }
]

class Command(BaseCommand):
    help = "Purge all hypothetical/demo data and prepare the database for real production usage"

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("=== Purging Hypothetical Records for Production ==="))

        # 1. Delete Invoices
        inv_count = Invoice.objects.all().delete()[0]
        self.stdout.write(f"  [-] Removed {inv_count} invoice records.")

        # 2. Delete JobStatusLogs & Attachments
        log_count = JobStatusLog.objects.all().delete()[0]
        att_count = JobAttachment.objects.all().delete()[0]
        self.stdout.write(f"  [-] Removed {log_count} status log records and {att_count} attachment records.")

        # 3. Delete Jobs
        job_count = Job.objects.all().delete()[0]
        self.stdout.write(f"  [-] Removed {job_count} case records.")

        # 4. Delete Clients
        client_count = Client.objects.all().delete()[0]
        self.stdout.write(f"  [-] Removed {client_count} client records.")

        # 5. Delete demo worker accounts
        demo_workers = User.objects.filter(username__in=['worker1', 'worker2'])
        w_count = demo_workers.delete()[0]
        self.stdout.write(f"  [-] Removed {w_count} demo investigator accounts.")

        # 6. Ensure Admin exists
        admin, created = User.objects.get_or_create(
            username="admin",
            defaults={
                "email": "admin@brondby.com",
                "first_name": "System",
                "last_name": "Administrator",
                "role": UserRole.ADMIN,
                "is_staff": True,
                "is_superuser": True,
            }
        )
        if created:
            admin.set_password("AdminPass123!")
            admin.save()
            self.stdout.write(self.style.SUCCESS("  [+] Initial Administrator initialized: admin / AdminPass123!"))
        else:
            self.stdout.write("  [+] Existing Administrator account retained.")

        # 7. Seed / Ensure the 5 Official Service Types
        self.stdout.write("\n=== Verifying Official Service Types ===")
        for s in SERVICES:
            obj, _ = ServiceType.objects.get_or_create(
                name=s["name"],
                defaults={"description": s["description"], "is_active": True}
            )
            self.stdout.write(f"  [+] Service: {obj.name}")

        self.stdout.write(self.style.SUCCESS("\nDatabase is 100% clean and ready for real production use!"))
