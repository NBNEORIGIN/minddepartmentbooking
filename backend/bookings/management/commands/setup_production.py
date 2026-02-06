from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from bookings.models import Service, Staff, IntakeWellbeingDisclaimer, ClassPackage
from decimal import Decimal


class Command(BaseCommand):
    help = 'Setup production data including superuser'

    def handle(self, *args, **kwargs):
        # Create superuser
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'aly@theminddepartment.com', 'admin123')
            self.stdout.write(self.style.SUCCESS('✓ Superuser created: admin'))
        else:
            self.stdout.write('✓ Superuser already exists')

        # Create Service
        service, created = Service.objects.get_or_create(
            name='Mindfulness Session',
            defaults={
                'description': '60-minute guided mindfulness practice to support your wellbeing',
                'duration_minutes': 60,
                'price': Decimal('25.00'),
                'active': True
            }
        )
        self.stdout.write(self.style.SUCCESS(f'✓ {"Created" if created else "Found"} service: {service.name}'))

        # Create Staff
        staff, created = Staff.objects.get_or_create(
            email='aly@theminddepartment.com',
            defaults={
                'name': 'Aly Harwood',
                'phone': '07395812669',
                'active': True
            }
        )
        self.stdout.write(self.style.SUCCESS(f'✓ {"Created" if created else "Found"} staff: {staff.name}'))

        # Create Disclaimer
        disclaimer, created = IntakeWellbeingDisclaimer.objects.get_or_create(
            version='1.0',
            defaults={
                'content': 'This is a wellbeing service. By proceeding, you confirm you are booking for personal development and wellness purposes.',
                'active': True
            }
        )
        self.stdout.write(self.style.SUCCESS(f'✓ {"Created" if created else "Found"} disclaimer: v{disclaimer.version}'))

        # Create Package
        package, created = ClassPackage.objects.get_or_create(
            name='5 Class Pass',
            defaults={
                'description': 'Package of 5 mindfulness sessions',
                'class_count': 5,
                'price': Decimal('100.00'),
                'validity_days': 90,
                'active': True
            }
        )
        self.stdout.write(self.style.SUCCESS(f'✓ {"Created" if created else "Found"} package: {package.name}'))

        self.stdout.write(self.style.SUCCESS('\n✅ Production setup complete!'))
