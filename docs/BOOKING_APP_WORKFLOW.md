# Complete Workflow: Building a Booking App from Scratch

This guide provides a step-by-step workflow for creating a new booking application based on The Mind Department template.

## 📋 Table of Contents

1. [Initial Setup](#1-initial-setup)
2. [Backend Development](#2-backend-development)
3. [Frontend Development](#3-frontend-development)
4. [Railway Deployment](#4-railway-deployment)
5. [Vercel Deployment](#5-vercel-deployment)
6. [Post-Deployment Configuration](#6-post-deployment-configuration)
7. [Testing Checklist](#7-testing-checklist)
8. [Client Handoff](#8-client-handoff)

---

## 1. Initial Setup

### 1.1 Create Project Structure

```bash
# Create client directory
mkdir -p clients/[client-name]
cd clients/[client-name]

# Initialize git repository
git init
git remote add origin <github-repo-url>

# Create directory structure
mkdir -p backend frontend docs
```

### 1.2 Gather Client Information

**Required Information:**
- [ ] Business name
- [ ] Business hours (per day of week)
- [ ] Services offered (name, duration, price)
- [ ] Staff members (name, email, services they perform)
- [ ] Brand colors (primary, secondary, accent)
- [ ] Logo files (PNG, high resolution)
- [ ] Email for notifications
- [ ] Domain name (if custom domain)

**Optional Information:**
- [ ] Staff photos
- [ ] Service icons
- [ ] Custom disclaimer text
- [ ] Special business rules
- [ ] Integration requirements

---

## 2. Backend Development

### 2.1 Django Project Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install Django and dependencies
pip install django djangorestframework psycopg2-binary django-cors-headers python-dotenv resend

# Create Django project
django-admin startproject booking_platform .

# Create bookings app
python manage.py startapp bookings
```

### 2.2 Configure Settings

**File: `backend/booking_platform/settings.py`**

```python
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')

DEBUG = os.getenv('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'bookings',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# CORS Settings
CORS_ALLOWED_ORIGINS = os.getenv(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:3000'
).split(',')

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'booking_db'),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD', 'postgres'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
    }
}

# Email Configuration
EMAIL_BACKEND = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.ionos.co.uk')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True') == 'True'
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', EMAIL_HOST_USER)

# Resend API (optional fallback)
RESEND_API_KEY = os.getenv('RESEND_API_KEY', '')
RESEND_FROM_EMAIL = os.getenv('RESEND_FROM_EMAIL', '')

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 100,
}

# Timezone
TIME_ZONE = 'Europe/London'  # Adjust for client location
USE_TZ = True
```

### 2.3 Create Database Models

**File: `backend/bookings/models.py`**

Copy the complete models from The Mind Department project:
- Service
- Staff
- Client
- Booking
- BusinessHours (if needed)
- StaffSchedule (if needed)

**File: `backend/bookings/models_intake.py`**

Copy the intake form models:
- IntakeProfile
- IntakeWellbeingDisclaimer

**Key Features to Include:**
- [ ] Auto-expiry dates (1 year from completion)
- [ ] `is_expired()` method
- [ ] `is_valid_for_booking()` method
- [ ] Consent tracking fields
- [ ] GDPR compliance

### 2.4 Create Serializers

**File: `backend/bookings/serializers.py`**

```python
from rest_framework import serializers
from .models import Service, Staff, Client, Booking

class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = '__all__'

class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = '__all__'

class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = '__all__'

class BookingSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
    client_email = serializers.CharField(source='client.email', read_only=True)
    client_phone = serializers.CharField(source='client.phone', read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)
    staff_name = serializers.CharField(source='staff.name', read_only=True)
    price = serializers.DecimalField(source='service.price', max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = Booking
        fields = '__all__'
```

**File: `backend/bookings/serializers_intake.py`**

Copy from The Mind Department project with:
- [ ] `is_expired` SerializerMethodField
- [ ] `is_valid_for_booking` SerializerMethodField
- [ ] Email validation for updates

### 2.5 Create API Views

**File: `backend/bookings/api_views.py`**

**CRITICAL: Include Double Booking Prevention**

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from datetime import datetime, timedelta
from django.db import transaction
from .models import Booking, Service, Staff, Client
from .serializers import BookingSerializer, ServiceSerializer, StaffSerializer, ClientSerializer

class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    
    def create(self, request, *args, **kwargs):
        """Create booking with double-booking prevention"""
        from django.utils import timezone as tz
        
        # Extract data
        service_id = request.data.get('service')
        staff_id = request.data.get('staff')
        date_str = request.data.get('date')
        time_str = request.data.get('time')
        client_name = request.data.get('client_name')
        client_email = request.data.get('client_email')
        client_phone = request.data.get('client_phone')
        notes = request.data.get('notes', '')
        
        # Validate required fields
        if not all([service_id, staff_id, date_str, time_str, client_name, client_email, client_phone]):
            return Response(
                {'error': 'Missing required fields'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                # Find or create client
                client, created = Client.objects.get_or_create(
                    email=client_email,
                    defaults={
                        'name': client_name,
                        'phone': client_phone,
                    }
                )
                
                # Update client if exists
                if not created:
                    client.name = client_name
                    client.phone = client_phone
                    client.save()
                
                # Get staff and service
                staff = Staff.objects.get(id=staff_id, active=True)
                service = Service.objects.get(id=service_id, active=True)
                
                # Parse datetime
                datetime_str = f"{date_str} {time_str}"
                start_datetime = datetime.strptime(datetime_str, '%Y-%m-%d %H:%M')
                start_datetime = tz.make_aware(start_datetime)
                
                # Calculate end time
                end_datetime = start_datetime + timedelta(minutes=service.duration_minutes)
                
                # CRITICAL: Check for overlapping bookings
                overlapping_bookings = Booking.objects.filter(
                    staff=staff,
                    status__in=['pending', 'confirmed'],
                    start_time__lt=end_datetime,
                    end_time__gt=start_datetime
                )
                
                if overlapping_bookings.exists():
                    return Response(
                        {'error': 'This time slot is no longer available. Please select a different time.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Create booking
                booking = Booking.objects.create(
                    client=client,
                    staff=staff,
                    service=service,
                    start_time=start_datetime,
                    end_time=end_datetime,
                    status='confirmed',
                    notes=notes
                )
                
                # Send confirmation email (async)
                # ... email code here ...
                
                serializer = self.get_serializer(booking)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def slots(self, request):
        """Get available time slots"""
        from .utils import generate_time_slots
        
        staff_id = request.query_params.get('staff_id')
        service_id = request.query_params.get('service_id')
        date = request.query_params.get('date')
        
        if not all([staff_id, service_id, date]):
            return Response(
                {'error': 'staff_id, service_id, and date are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        slots = generate_time_slots(staff_id, service_id, date)
        return Response({'slots': slots})

class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.filter(active=True)
    serializer_class = ServiceSerializer

class StaffViewSet(viewsets.ModelViewSet):
    queryset = Staff.objects.filter(active=True)
    serializer_class = StaffSerializer

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
```

### 2.6 Create Availability Utility

**File: `backend/bookings/utils.py`**

```python
from datetime import datetime, timedelta
from django.utils import timezone
from .models import Booking, Staff, Service

def generate_time_slots(staff_id, service_id, date, business_hours_start=9, business_hours_end=17):
    """
    Generate available time slots for a given staff member, service, and date.
    
    CRITICAL: Only considers bookings with status 'pending' or 'confirmed'
    This ensures cancelled bookings free up time slots automatically.
    """
    try:
        staff = Staff.objects.get(id=staff_id, active=True)
        service = Service.objects.get(id=service_id, active=True)
    except (Staff.DoesNotExist, Service.DoesNotExist):
        return []
    
    # Parse date
    target_date = datetime.strptime(date, '%Y-%m-%d').date()
    
    # Get existing bookings for this staff on this date
    start_of_day = timezone.make_aware(datetime.combine(target_date, datetime.min.time()))
    end_of_day = timezone.make_aware(datetime.combine(target_date, datetime.max.time()))
    
    # CRITICAL: Only check pending/confirmed bookings
    existing_bookings = Booking.objects.filter(
        staff=staff,
        start_time__gte=start_of_day,
        start_time__lt=end_of_day,
        status__in=['pending', 'confirmed']  # Cancelled bookings don't block slots
    ).order_by('start_time')
    
    # Generate potential slots
    slots = []
    current_time = timezone.make_aware(
        datetime.combine(target_date, datetime.min.time().replace(hour=business_hours_start))
    )
    end_time = timezone.make_aware(
        datetime.combine(target_date, datetime.min.time().replace(hour=business_hours_end))
    )
    
    slot_duration = timedelta(minutes=service.duration_minutes)
    
    while current_time + slot_duration <= end_time:
        slot_end = current_time + slot_duration
        
        # Check if this slot conflicts with existing bookings
        is_available = True
        for booking in existing_bookings:
            # Check for overlap
            if (current_time < booking.end_time and slot_end > booking.start_time):
                is_available = False
                break
        
        if is_available:
            slots.append({
                'start_time': current_time.isoformat(),
                'end_time': slot_end.isoformat(),
                'available': True
            })
        
        # Move to next slot (15-minute intervals)
        current_time += timedelta(minutes=15)
    
    return slots
```

### 2.7 Create Intake Form Views

**File: `backend/bookings/views_intake.py`**

Copy from The Mind Department project with:
- [ ] `status` action for checking intake validity
- [ ] `expire_all` action for bulk expiry
- [ ] `expire` action for individual expiry
- [ ] Create/update logic for form renewals

### 2.8 Configure URLs

**File: `backend/bookings/api_urls.py`**

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import BookingViewSet, ServiceViewSet, StaffViewSet, ClientViewSet
from .views_intake import IntakeProfileViewSet, IntakeWellbeingDisclaimerViewSet

router = DefaultRouter()
router.register(r'bookings', BookingViewSet, basename='booking')
router.register(r'services', ServiceViewSet, basename='service')
router.register(r'staff', StaffViewSet, basename='staff')
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'intake', IntakeProfileViewSet, basename='intake-profile')
router.register(r'intake-disclaimer', IntakeWellbeingDisclaimerViewSet, basename='intake-disclaimer')

urlpatterns = [
    path('', include(router.urls)),
]
```

**File: `backend/booking_platform/urls.py`**

```python
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('bookings.api_urls')),
]
```

### 2.9 Create Management Command

**File: `backend/bookings/management/commands/setup_production.py`**

```python
from django.core.management.base import BaseCommand
from bookings.models import Service, Staff
from bookings.models_intake import IntakeWellbeingDisclaimer

class Command(BaseCommand):
    help = 'Set up production data for [Client Name]'

    def handle(self, *args, **options):
        # Create services
        services_data = [
            {
                'name': 'Service 1',
                'description': 'Description',
                'duration_minutes': 60,
                'price': 25.00,
                'active': True
            },
            # Add more services...
        ]
        
        for service_data in services_data:
            Service.objects.get_or_create(
                name=service_data['name'],
                defaults=service_data
            )
        
        self.stdout.write(self.style.SUCCESS('✓ Services created'))
        
        # Create staff (manually via admin)
        self.stdout.write(self.style.SUCCESS('✓ Staff members managed via admin interface'))
        
        # Create default disclaimer
        IntakeWellbeingDisclaimer.objects.get_or_create(
            version='1.0',
            defaults={
                'content': '<h2>Client Intake Form</h2><p>...</p>',
                'active': True
            }
        )
        
        self.stdout.write(self.style.SUCCESS('✓ Default disclaimer created'))
        self.stdout.write(self.style.SUCCESS('Setup complete!'))
```

### 2.10 Create Requirements File

**File: `backend/requirements.txt`**

```
Django==5.2
djangorestframework==3.14.0
psycopg2-binary==2.9.9
django-cors-headers==4.3.1
python-dotenv==1.0.0
resend==0.8.0
gunicorn==21.2.0
```

### 2.11 Create Environment File

**File: `backend/.env.example`**

```
SECRET_KEY=your-secret-key-here
DEBUG=True
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Email Settings
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.ionos.co.uk
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@domain.com
EMAIL_HOST_PASSWORD=your-password
DEFAULT_FROM_EMAIL=your-email@domain.com

# Optional: Resend API
RESEND_API_KEY=
RESEND_FROM_EMAIL=
```

### 2.12 Run Migrations

```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Set up initial data
python manage.py setup_production

# Test server
python manage.py runserver 8001
```

---

## 3. Frontend Development

### 3.1 Next.js Setup

```bash
cd frontend

# Create Next.js app
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir

# Install dependencies
npm install date-fns
```

### 3.2 Create Booking Page

**File: `frontend/app/page.tsx`**

Copy from The Mind Department project with:
- [ ] Service selection
- [ ] Staff selection
- [ ] Date picker
- [ ] Time slot selection (with availability checking)
- [ ] Customer details form
- [ ] Intake form validation
- [ ] Booking summary
- [ ] Confirmation page

**CRITICAL Features:**
```typescript
// Fetch available slots when service, staff, and date are selected
useEffect(() => {
  fetchAvailableSlots()
}, [selectedService, selectedStaff, selectedDate])

const fetchAvailableSlots = async () => {
  if (!selectedService || !selectedStaff || !selectedDate) {
    setAvailableSlots([])
    return
  }

  const dateStr = format(selectedDate, 'yyyy-MM-dd')
  const response = await fetch(
    `${API_BASE}/bookings/slots/?service_id=${selectedService.id}&staff_id=${selectedStaff.id}&date=${dateStr}`
  )
  
  if (response.ok) {
    const data = await response.json()
    const times = data.slots.map((slot: any) => {
      const startTime = new Date(slot.start_time)
      return format(startTime, 'HH:mm')
    })
    setAvailableSlots(times)
  }
}

// Check intake form before booking
const handleSubmit = async () => {
  // Check intake form status
  const intakeCheckRes = await fetch(
    `${API_BASE}/intake/status/?email=${encodeURIComponent(customerEmail)}`
  )
  
  if (intakeCheckRes.ok) {
    const intakeStatus = await intakeCheckRes.json()
    
    if (!intakeStatus.is_valid_for_booking) {
      // Redirect to intake form
      window.location.href = `/intake?email=${encodeURIComponent(customerEmail)}&return=booking`
      return
    }
  }
  
  // Proceed with booking...
}
```

### 3.3 Create Intake Form Page

**File: `frontend/app/intake/page.tsx`**

Copy from The Mind Department project with:
- [ ] Disclaimer display
- [ ] Personal information fields
- [ ] Emergency contact fields
- [ ] Consent checkboxes
- [ ] Return-to-booking redirect

### 3.4 Create Admin Dashboard

**File: `frontend/app/admin/page.tsx`**

Copy from The Mind Department project with:
- [ ] Booking list with filters
- [ ] Cancel booking button
- [ ] View booking details
- [ ] Links to management pages

**CRITICAL: Cancel Booking Function**
```typescript
const handleCancelBooking = async (bookingId: number) => {
  if (!confirm('Cancel this booking? The time slot will become available.')) {
    return
  }

  const response = await fetch(`${API_BASE}/bookings/${bookingId}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'cancelled' }),
  })

  if (response.ok) {
    alert('Booking cancelled. Time slot is now available.')
    fetchBookings()
  }
}
```

### 3.5 Create Admin Subpages

Create the following pages (copy from The Mind Department):
- [ ] `/admin/services/page.tsx` - Service management
- [ ] `/admin/staff/page.tsx` - Staff management
- [ ] `/admin/clients/page.tsx` - Client management
- [ ] `/admin/disclaimer/page.tsx` - Disclaimer management

### 3.6 Create CSS Files

**File: `frontend/app/booking-compact.css`**

Copy from The Mind Department project and customize:
- [ ] Brand colors
- [ ] Logo references
- [ ] Button styles
- [ ] Disabled slot styles

**File: `frontend/app/admin/admin.css`**

Copy and customize admin styles.

### 3.7 Add Logo Assets

```bash
# Add to frontend/public/
- client-logo.png
- favicon.ico
```

### 3.8 Configure Environment

**File: `frontend/.env.local`**

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001/api
```

### 3.9 Test Frontend

```bash
npm run dev
# Visit http://localhost:3000
```

---

## 4. Railway Deployment

### 4.1 Prepare Backend for Deployment

**File: `backend/Procfile`**

```
web: gunicorn booking_platform.wsgi --bind 0.0.0.0:$PORT
release: python manage.py migrate
```

**File: `backend/runtime.txt`**

```
python-3.11.7
```

**Update `backend/booking_platform/settings.py`:**

```python
import dj_database_url

# Database from Railway
if 'DATABASE_URL' in os.environ:
    DATABASES['default'] = dj_database_url.config(
        conn_max_age=600,
        conn_health_checks=True,
    )

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
```

### 4.2 Create Railway Project

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your repository
5. Select the backend folder as root directory

### 4.3 Add PostgreSQL Database

1. In Railway project, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway automatically sets `DATABASE_URL`

### 4.4 Configure Railway Environment Variables

Add the following variables in Railway dashboard:

```
SECRET_KEY=<generate-new-secret-key>
DEBUG=False
ALLOWED_HOSTS=<your-app>.up.railway.app,localhost
CORS_ALLOWED_ORIGINS=https://<your-vercel-app>.vercel.app,http://localhost:3000

# Email Settings
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.ionos.co.uk
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=<client-email>
EMAIL_HOST_PASSWORD=<email-password>
DEFAULT_FROM_EMAIL=<client-email>

# Optional: Resend
RESEND_API_KEY=<resend-key>
RESEND_FROM_EMAIL=<verified-email>
```

**To generate SECRET_KEY:**
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### 4.5 Deploy to Railway

1. Push code to GitHub
2. Railway auto-deploys
3. Check deployment logs for:
   - "Applying bookings.XXXX... OK" (migrations)
   - "Starting gunicorn" (server started)

### 4.6 Run Initial Setup

In Railway console:
```bash
python manage.py setup_production
python manage.py createsuperuser
```

### 4.7 Test Railway Deployment

Visit: `https://<your-app>.up.railway.app/api/services/`

Should return JSON array of services.

---

## 5. Vercel Deployment

### 5.1 Prepare Frontend

**File: `frontend/vercel.json`**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

### 5.2 Create Vercel Project

1. Go to https://vercel.com
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Set **Root Directory** to `frontend`
5. Framework Preset: Next.js (auto-detected)

### 5.3 Configure Vercel Environment Variables

Add in Vercel project settings:

```
NEXT_PUBLIC_API_BASE_URL=https://<your-railway-app>.up.railway.app/api
```

### 5.4 Deploy to Vercel

1. Click "Deploy"
2. Vercel builds and deploys automatically
3. Check deployment logs for build success

### 5.5 Update Railway CORS

Update Railway environment variable:

```
CORS_ALLOWED_ORIGINS=https://<your-vercel-app>.vercel.app,http://localhost:3000
```

Redeploy Railway backend.

### 5.6 Test Vercel Deployment

Visit: `https://<your-vercel-app>.vercel.app`

Test complete booking flow.

---

## 6. Post-Deployment Configuration

### 6.1 Add Initial Data via Admin

1. Go to `https://<your-railway-app>.up.railway.app/admin`
2. Login with superuser credentials
3. Add:
   - Services (name, duration, price)
   - Staff members (name, email, services)
   - Business hours (if using schedule system)

### 6.2 Test Email Notifications

1. Make a test booking
2. Check Railway logs for email send confirmation
3. Verify email received in inbox

### 6.3 Configure Custom Domain (Optional)

**Vercel:**
1. Go to Project Settings → Domains
2. Add custom domain
3. Update DNS records as instructed

**Railway:**
1. Go to Project Settings → Domains
2. Add custom domain
3. Update DNS records

### 6.4 Set Up Monitoring

- [ ] Enable Railway metrics
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure uptime monitoring
- [ ] Set up database backups

---

## 7. Testing Checklist

### 7.1 Booking Flow

- [ ] Can select service
- [ ] Can select staff
- [ ] Can select date
- [ ] Time slots show correctly
- [ ] Booked slots are greyed out
- [ ] Can fill customer details
- [ ] Intake form validation works
- [ ] Booking confirmation shows
- [ ] Email confirmation received

### 7.2 Intake Form

- [ ] Disclaimer displays correctly
- [ ] All fields are required
- [ ] Consent checkboxes work
- [ ] Form submits successfully
- [ ] Redirects back to booking
- [ ] Form expires after 1 year

### 7.3 Admin Dashboard

- [ ] Can view all bookings
- [ ] Can filter bookings
- [ ] Can cancel bookings
- [ ] Cancelled slots become available
- [ ] Can manage services
- [ ] Can manage staff
- [ ] Can manage clients
- [ ] Can edit disclaimer
- [ ] Can expire intake forms

### 7.4 Double Booking Prevention

- [ ] Cannot book same slot twice
- [ ] Error message shows for unavailable slots
- [ ] Cancelled bookings free up slots
- [ ] Completed bookings don't block slots

### 7.5 Email System

- [ ] Booking confirmations send
- [ ] Emails have correct branding
- [ ] Emails contain booking details
- [ ] Fallback email provider works

---

## 8. Client Handoff

### 8.1 Documentation

Provide client with:
- [ ] Admin login credentials
- [ ] Admin user guide
- [ ] Booking page URL
- [ ] Admin dashboard URL
- [ ] Support contact information

### 8.2 Training

Train client on:
- [ ] Adding/editing services
- [ ] Adding/editing staff
- [ ] Managing bookings
- [ ] Cancelling bookings
- [ ] Editing disclaimer
- [ ] Expiring intake forms
- [ ] Viewing client database

### 8.3 Handoff Checklist

- [ ] All credentials documented
- [ ] All URLs documented
- [ ] Admin training completed
- [ ] Support process established
- [ ] Backup procedures documented
- [ ] Monitoring set up
- [ ] Custom domain configured (if applicable)

---

## 9. Common Issues & Solutions

### Issue: 500 Error on Booking

**Solution:**
- Check Railway logs for Python exceptions
- Verify all environment variables are set
- Check database connection
- Ensure migrations ran successfully

### Issue: CORS Errors

**Solution:**
- Verify `CORS_ALLOWED_ORIGINS` includes Vercel URL
- Ensure no trailing slashes in URLs
- Redeploy Railway after changes

### Issue: Time Slots Not Showing

**Solution:**
- Check browser console for API errors
- Verify `/api/bookings/slots/` endpoint works
- Check service and staff IDs are valid
- Ensure date format is correct (YYYY-MM-DD)

### Issue: Email Not Sending

**Solution:**
- Check Railway logs for email errors
- Verify SMTP credentials
- Test with Resend API as fallback
- Check email provider allows SMTP

### Issue: Double Bookings Still Happening

**Solution:**
- Verify overlap check logic in `api_views.py`
- Check status filter includes only 'pending' and 'confirmed'
- Test with concurrent requests
- Review booking creation transaction

---

## 10. Maintenance Schedule

### Daily
- [ ] Monitor error logs
- [ ] Check email delivery

### Weekly
- [ ] Review bookings
- [ ] Check database size
- [ ] Test booking flow

### Monthly
- [ ] Update dependencies
- [ ] Review security
- [ ] Backup database
- [ ] Check disk space

### Quarterly
- [ ] Review client feedback
- [ ] Update documentation
- [ ] Performance optimization
- [ ] Feature requests review

---

## Appendix A: Railway Variables Quick Reference

```
# Required
DATABASE_URL=<auto-set-by-railway>
SECRET_KEY=<generate-new>
DEBUG=False
ALLOWED_HOSTS=<your-app>.up.railway.app
CORS_ALLOWED_ORIGINS=https://<vercel-app>.vercel.app

# Email (IONOS SMTP)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.ionos.co.uk
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=<client-email>
EMAIL_HOST_PASSWORD=<password>
DEFAULT_FROM_EMAIL=<client-email>

# Email (Resend - Optional)
RESEND_API_KEY=<key>
RESEND_FROM_EMAIL=<verified-email>
```

## Appendix B: Vercel Variables Quick Reference

```
NEXT_PUBLIC_API_BASE_URL=https://<railway-app>.up.railway.app/api
```

## Appendix C: Key Files Checklist

### Backend
- [ ] `backend/booking_platform/settings.py` - Django settings
- [ ] `backend/bookings/models.py` - Database models
- [ ] `backend/bookings/models_intake.py` - Intake models
- [ ] `backend/bookings/api_views.py` - API endpoints (with double-booking prevention)
- [ ] `backend/bookings/utils.py` - Availability logic
- [ ] `backend/bookings/serializers.py` - DRF serializers
- [ ] `backend/requirements.txt` - Python dependencies
- [ ] `backend/Procfile` - Railway deployment
- [ ] `backend/.env.example` - Environment template

### Frontend
- [ ] `frontend/app/page.tsx` - Booking page (with availability checking)
- [ ] `frontend/app/intake/page.tsx` - Intake form
- [ ] `frontend/app/admin/page.tsx` - Admin dashboard (with cancel button)
- [ ] `frontend/app/admin/disclaimer/page.tsx` - Disclaimer management
- [ ] `frontend/app/booking-compact.css` - Booking styles
- [ ] `frontend/app/admin/admin.css` - Admin styles
- [ ] `frontend/.env.local` - Environment variables
- [ ] `frontend/public/client-logo.png` - Client logo

---

**End of Workflow Guide**

This workflow ensures all critical features are implemented:
✅ Double booking prevention
✅ Availability checking
✅ Intake form validation
✅ Cancellation functionality
✅ Email notifications
✅ GDPR compliance
