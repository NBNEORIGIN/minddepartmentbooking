# The Mind Department Booking System

A comprehensive, production-ready booking platform for wellness services with GDPR-compliant intake forms, real-time availability checking, and automated email notifications.

## 🌟 Features

### Customer-Facing
- **Real-time Availability**: Time slots automatically update based on existing bookings
- **GDPR-Compliant Intake Forms**: Yearly auto-renewal with consent tracking
- **Seamless Booking Flow**: Service → Staff → Date → Time → Details → Confirmation
- **Email Confirmations**: Automatic booking confirmations via IONOS SMTP or Resend API
- **Mobile Responsive**: Works perfectly on all devices

### Admin Features
- **Booking Management**: View, filter, and cancel bookings with one click
- **Staff Management**: Add/edit staff members and their services
- **Service Management**: Configure services, pricing, and durations
- **Client Management**: Track customer information and booking history
- **Disclaimer Management**: Edit disclaimer content with HTML support and version control
- **Form Renewal Management**: Manually expire intake forms or trigger bulk renewals
- **Real-time Dashboard**: Overview of bookings, revenue, and client activity

### Technical Features
- **Double Booking Prevention**: Backend validation prevents overlapping appointments
- **Automatic Slot Management**: Cancelled bookings immediately free up time slots
- **Intake Form Validation**: Blocks bookings until valid intake form is completed
- **Session-based Availability**: 15-minute slot intervals with service duration awareness
- **Timezone Aware**: All times stored and displayed with proper timezone handling

## 🏗️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Custom CSS with responsive design
- **Date Handling**: date-fns
- **Deployment**: Vercel

### Backend
- **Framework**: Django 5.2
- **API**: Django REST Framework
- **Database**: PostgreSQL 14+
- **Email**: IONOS SMTP / Resend API
- **Deployment**: Railway

## 📋 Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 14+
- Git

## 🚀 Local Development Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd minddepartmentbooking
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Configure .env with your settings:
# - DATABASE_URL
# - SECRET_KEY
# - EMAIL_HOST, EMAIL_PORT, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD
# - RESEND_API_KEY (optional)

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Set up initial data (services, disclaimer)
python manage.py setup_production

# Start development server
python manage.py runserver 8001
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8001/api" > .env.local

# Start development server
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001/api
- **Django Admin**: http://localhost:8001/admin
- **Custom Admin**: http://localhost:3000/admin

## 🌐 Production Deployment

### Railway (Backend)

1. **Create Railway Project**
   - Go to railway.app
   - Create new project
   - Add PostgreSQL database

2. **Configure Environment Variables**
   ```
   DATABASE_URL=<automatically set by Railway>
   SECRET_KEY=<generate with: python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())">
   DEBUG=False
   ALLOWED_HOSTS=minddepartmentbooking-production.up.railway.app,localhost
   CORS_ALLOWED_ORIGINS=https://minddepartmentbooking.vercel.app,http://localhost:3000
   
   # Email Settings (IONOS SMTP)
   EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
   EMAIL_HOST=smtp.ionos.co.uk
   EMAIL_PORT=587
   EMAIL_USE_TLS=True
   EMAIL_HOST_USER=<your-email>
   EMAIL_HOST_PASSWORD=<your-password>
   DEFAULT_FROM_EMAIL=<your-email>
   
   # Optional: Resend API (fallback)
   RESEND_API_KEY=<your-resend-key>
   RESEND_FROM_EMAIL=<verified-email>
   ```

3. **Deploy**
   - Connect GitHub repository
   - Railway auto-deploys on push to main branch
   - Run migrations: `python manage.py migrate`
   - Set up data: `python manage.py setup_production`

### Vercel (Frontend)

1. **Create Vercel Project**
   - Go to vercel.com
   - Import GitHub repository
   - Select `frontend` as root directory

2. **Configure Environment Variables**
   ```
   NEXT_PUBLIC_API_BASE_URL=https://minddepartmentbooking-production.up.railway.app/api
   ```

3. **Deploy**
   - Vercel auto-deploys on push to main branch

## 📁 Project Structure

```
minddepartmentbooking/
├── backend/
│   ├── booking_platform/      # Django project settings
│   ├── bookings/              # Main app
│   │   ├── models.py          # Database models
│   │   ├── models_intake.py   # Intake form models
│   │   ├── api_views.py       # API endpoints
│   │   ├── views_intake.py    # Intake form API
│   │   ├── serializers.py     # DRF serializers
│   │   ├── utils.py           # Availability logic
│   │   └── management/
│   │       └── commands/
│   │           └── setup_production.py  # Initial data setup
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── page.tsx           # Booking page
│   │   ├── intake/
│   │   │   └── page.tsx       # Intake form
│   │   └── admin/
│   │       ├── page.tsx       # Admin dashboard
│   │       ├── disclaimer/
│   │       │   └── page.tsx   # Disclaimer management
│   │       ├── staff/
│   │       ├── services/
│   │       ├── clients/
│   │       └── schedules/
│   └── package.json
└── docs/
    └── DISCLAIMER_GDPR.md     # GDPR compliance documentation
```

## 🔑 Key API Endpoints

### Bookings
- `GET /api/bookings/` - List all bookings
- `POST /api/bookings/` - Create booking (with double-booking validation)
- `PATCH /api/bookings/{id}/` - Update booking (e.g., cancel)
- `GET /api/bookings/slots/` - Get available time slots

### Intake Forms
- `GET /api/intake/` - List intake profiles
- `POST /api/intake/` - Create/update intake profile
- `GET /api/intake/status/` - Check intake status by email
- `POST /api/intake/expire-all/` - Expire all forms (admin)
- `POST /api/intake/{id}/expire/` - Expire specific form

### Services & Staff
- `GET /api/services/` - List services
- `GET /api/staff/` - List staff members

## 🛡️ Security Features

- CSRF protection on all POST/PATCH/DELETE requests
- CORS configured for specific origins only
- Environment-based configuration (no secrets in code)
- SQL injection protection via Django ORM
- XSS protection via React's automatic escaping
- GDPR-compliant consent tracking

## 📧 Email Configuration

The system supports two email providers:

1. **IONOS SMTP** (Primary)
   - Reliable for transactional emails
   - Configure via EMAIL_HOST settings

2. **Resend API** (Fallback)
   - Modern API-based email service
   - Configure via RESEND_API_KEY

Emails are sent asynchronously to avoid blocking booking confirmations.

## 🔄 Availability Logic

Time slots are generated dynamically based on:
- Service duration (e.g., 60 minutes)
- Staff member's existing bookings
- Business hours (9 AM - 5 PM)
- 15-minute slot intervals

Only bookings with status `'pending'` or `'confirmed'` block time slots. Cancelled, completed, or no-show bookings do not affect availability.

## 📝 Intake Form Workflow

1. Customer attempts to book
2. System checks if valid intake form exists (not expired)
3. If invalid/missing: Redirect to intake form
4. Customer completes intake form (1-year validity)
5. Redirect back to booking page
6. Customer completes booking

Forms auto-expire after 1 year. Admins can manually expire forms to force renewal.

## 🎨 Branding

- **Colors**: Sage green (#8D9889), Cream (#EEE8E5), Dark green (#27382E)
- **Logo**: `/mind-department-logo.png`
- **Font**: RoxboroughCF (serif)

## 🐛 Troubleshooting

### Backend Issues
- **500 errors**: Check Railway logs for Python exceptions
- **Database errors**: Verify DATABASE_URL is set correctly
- **Email not sending**: Check SMTP credentials and Railway logs

### Frontend Issues
- **API errors**: Verify NEXT_PUBLIC_API_BASE_URL points to Railway backend
- **Build failures**: Check for TypeScript errors in Vercel logs
- **CORS errors**: Ensure Railway CORS_ALLOWED_ORIGINS includes Vercel URL

## 📄 License

Proprietary - The Mind Department

## 👥 Support

For technical support or questions, contact the development team.
