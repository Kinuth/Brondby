from django.core.management.base import BaseCommand
from jobs.models import ServiceType

from jobs.constants import SERVICES


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
