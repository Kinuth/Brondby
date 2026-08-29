from django.core.management.base import BaseCommand
from jobs.models import ServiceType

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
    help = "Seed the 5 core Brondby Enterprises service types"

    def handle(self, *args, **options):
        self.stdout.write("Seeding Service Types...")
        created_count = 0
        for item in SERVICES:
            obj, created = ServiceType.objects.get_or_create(
                name=item["name"],
                defaults={"description": item["description"], "is_active": True}
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"  + Created: {obj.name}"))
            else:
                self.stdout.write(f"  - Already exists: {obj.name}")

        self.stdout.write(self.style.SUCCESS(f"Done. {created_count} service types created."))
