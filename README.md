# Professional Booking System - Master Template

A full-stack booking management system for salons, spas, and service businesses with Next.js frontend and Django backend.

## � Features

### Customer-Facing
- **Real-time Availability**: Time slots automatically update based on existing bookings
- **GDPR-Compliant Intake Forms**: Yearly auto-renewal with consent tracking
- **Seamless Booking Flow**: Service → Staff → Date → Time → Details → Confirmation
- **Email Confirmations**: Automatic booking confirmations via IONOS SMTP or Resend API
- **Mobile Responsive**: Works perfectly on all devices

### Admin Features
- **Booking Management**: View, filter, and cancel bookings
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
│   └── package.json
│
├── backend/                  # Django application
│   ├── bookings/
│   │   ├── models.py        # Database models
│   │   ├── serializers.py   # API serializers
│   │   ├── api_views.py     # API endpoints
│   │   ├── views_schedule.py
│   │   ├── serializers_schedule.py
│   │   ├── admin.py         # Django admin config
│   │   └── migrations/
│   ├── booking_platform/
│   │   ├── settings.py      # Django settings
│   │   ├── urls.py          # URL routing
│   │   └── wsgi.py
│   ├── requirements.txt
│   ├── Procfile             # Railway deployment
│   └── manage.py
│
└── vercel.json              # Vercel deployment config
```

## 🗄️ Database Models

### Core Models

**Service**
- name, description, duration_minutes, price, active
- Used for: Haircuts, colors, treatments, etc.

**Staff**
- name, email, phone, photo_url, active
- services (ManyToMany)
- Supports staff photos via URL

**Client**
- name, email, phone, notes
- marketing_consent (GDPR compliance)
- total_bookings, last_booking_date

**Booking**
- client, service, staff
- start_time, end_time, status
- notes, confirmation_sent, reminder_sent
- Status: pending, confirmed, completed, cancelled, no_show

### Schedule Models

**BusinessHours**
- day_of_week (0-6), is_open
- open_time, close_time
- Controls overall business availability

**StaffSchedule**
- staff, day_of_week, is_working
- start_time, end_time
- Individual staff working hours

**Closure**
- date, reason, all_day
- start_time, end_time (optional)
- Business closures (holidays, events)

**StaffLeave**
- staff, start_date, end_date, reason
- Individual staff time off

## 🚀 Setup for New Client

### 1. Copy Template

```bash
# Copy master template to new client folder
cp -r master-template/ clients/[client-name]/
cd clients/[client-name]/
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
# Create .env file with:
SECRET_KEY=your-secret-key-here
DEBUG=True
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=bookings@yourdomain.com

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Initialize default schedules
python manage.py setup_schedules

# Run development server
python manage.py runserver
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
# Create .env.local with:
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api

# Run development server
npm run dev
```

### 4. Branding Customization

**Logo & Icons:**
1. Replace `frontend/public/logo.png` with client logo
2. Replace `frontend/public/scissors.png` with service icon (optional)

**Colors:**
Edit `frontend/app/admin/admin.css`:
```css
.admin-header {
  background: #f5f5dc;  /* Change to client brand color */
}

.view-site-btn {
  background: #000;     /* Change to client button color */
  color: white;
}
```

Edit `frontend/app/booking-compact.css`:
```css
.booking-header {
  background: linear-gradient(135deg, #f5f5dc 0%, #e8e8d0 100%);
}

.compact-service-card.selected {
  border-color: #8B6F47;  /* Change to client accent color */
  background: #f5f5dc;
}
```

**Business Name:**
- Update all instances of "House of Hair" in:
  - `frontend/app/page.tsx`
  - `frontend/app/admin/page.tsx`
  - `backend/booking_platform/settings.py` (SITE_NAME)

### 5. Initial Data Setup

**Via Django Admin** (http://localhost:8000/admin):

1. **Add Services:**
   - Go to Services
   - Add each service with name, description, duration, price
   - Mark as active

2. **Add Staff:**
   - Go to Staff
   - Add each staff member with name, email, phone
   - Optionally add photo_url
   - Assign services they can perform
   - Mark as active

3. **Set Business Hours:**
   - Go to Business Hours
   - Set hours for each day of week (0=Monday, 6=Sunday)
   - Mark closed days as is_open=False

4. **Set Staff Schedules:**
   - Go to Staff Schedules
   - Set working hours for each staff member per day
   - Mark non-working days as is_working=False

**Or via Admin Dashboard** (http://localhost:3000/admin):
- Use the Next.js admin interface for all management

## 🌐 Deployment

### Railway (Backend)

1. **Create New Project:**
   - Go to Railway.app
   - Create new project from GitHub repo
   - Select backend folder as root

2. **Add PostgreSQL:**
   - Add PostgreSQL database service
   - Railway auto-configures DATABASE_URL

3. **Environment Variables:**
   ```
   SECRET_KEY=production-secret-key
   DEBUG=False
   ALLOWED_HOSTS=your-app.up.railway.app
   RESEND_API_KEY=your-resend-key
   RESEND_FROM_EMAIL=bookings@yourdomain.com
   ```

4. **Deploy:**
   - Railway auto-deploys on git push
   - Procfile runs migrations automatically
   - Check deploy logs for: "Applying bookings.XXXX... OK"

### Vercel (Frontend)

1. **Import Project:**
   - Go to Vercel.com
   - Import GitHub repository
   - Set root directory to `frontend`

2. **Environment Variables:**
   ```
   NEXT_PUBLIC_API_BASE_URL=https://your-app.up.railway.app/api
   ```

3. **Deploy:**
   - Vercel auto-deploys on git push
   - Build command: `npm run build`
   - Output directory: `.next`

## 📧 Email Configuration

**Using Resend (Recommended):**

1. Sign up at resend.com
2. Verify your domain
3. Get API key
4. Set environment variables:
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL` (must be from verified domain)

**Email Templates:**
Located in `backend/bookings/models.py` in the `Booking.save()` method.

Customize the email content:
```python
html_content = f"""
<h2>Booking Confirmation - [Your Business Name]</h2>
<p>Dear {self.client.name},</p>
...
"""
```

## 🎨 Customization Guide

### Adding New Services

**Backend:**
```python
# Via Django admin or API
Service.objects.create(
    name="New Service",
    description="Service description",
    duration_minutes=60,
    price=50.00,
    active=True
)
```

**Frontend:**
- Services auto-populate from API
- No code changes needed

### Adding Staff Photos

**Option 1: Image Hosting Service**
1. Upload photo to Imgur, Cloudinary, etc.
2. Copy direct image URL
3. Add to staff member via admin: `photo_url` field

**Option 2: Self-Hosted**
1. Add images to `frontend/public/staff/`
2. Use URL: `/staff/photo-name.jpg`

### Customizing Booking Flow

Edit `frontend/app/page.tsx`:
- Modify step labels
- Change date range (currently 14 days)
- Adjust time slots (currently 9am-5pm, 30min intervals)
- Add/remove form fields

### Admin Dashboard Customization

**Add New Admin Page:**
1. Create `frontend/app/admin/[page-name]/page.tsx`
2. Add link in `frontend/app/admin/page.tsx`
3. Follow existing pattern (services, staff, etc.)

## 🔒 Security

**Production Checklist:**

- [ ] Set `DEBUG=False` in Django
- [ ] Use strong `SECRET_KEY`
- [ ] Configure `ALLOWED_HOSTS`
- [ ] Enable HTTPS only
- [ ] Set secure cookie flags
- [ ] Configure CORS properly
- [ ] Use environment variables for secrets
- [ ] Regular dependency updates
- [ ] Database backups configured

## 📊 Features by Page

### Public Booking Page
- Compact 2-column grid layout
- Service selection with icons
- Staff selection with photos/initials
- Date picker (14-day range)
- Time slot selection
- Customer details form
- GDPR consent checkbox
- Booking summary
- Confirmation page

### Admin Dashboard
- Overview of recent bookings
- Quick stats
- Links to all management pages
- CSV export for bookings
- Booking details modal

### Services Management
- CRUD operations
- Active/inactive toggle
- Duration and pricing
- Service descriptions

### Staff Management
- CRUD operations
- Photo URL management
- Service assignment
- Active/inactive toggle
- Contact information

### Client CRM
- Client database
- Search and filter
- Marketing consent tracking
- GDPR-compliant CSV export
- Booking history

### Schedule Management
- Business hours (per day of week)
- Staff working hours (per staff, per day)
- Closures (holidays, events)
- Staff leave tracking

## 🐛 Troubleshooting

### "Failed to fetch data" on booking page
- Check Railway deployment logs
- Verify DATABASE_URL is set
- Ensure migrations ran: `Applying bookings.XXXX... OK`
- Test API directly: `https://your-app.up.railway.app/api/services/`

### TypeScript build errors
- Run `npm run build` locally to see errors
- Check for undefined properties
- Add null checks: `data?.property || []`

### Email not sending
- Verify Resend API key is correct
- Check domain is verified in Resend
- Check Railway logs for email errors
- Ensure `RESEND_FROM_EMAIL` uses verified domain

### Migrations not running on Railway
- Check Procfile exists and is correct
- Verify Railway is using Procfile
- Check deploy logs for migration output
- Manually run: `python manage.py migrate` in Railway console

## 📝 API Endpoints

**Services:**
- GET `/api/services/` - List all active services
- POST `/api/services/` - Create service
- PUT `/api/services/{id}/` - Update service
- DELETE `/api/services/{id}/` - Delete service

**Staff:**
- GET `/api/staff/` - List all active staff
- POST `/api/staff/` - Create staff member
- PUT `/api/staff/{id}/` - Update staff member
- DELETE `/api/staff/{id}/` - Delete staff member

**Bookings:**
- GET `/api/bookings/` - List all bookings
- POST `/api/bookings/` - Create booking
- PUT `/api/bookings/{id}/` - Update booking
- DELETE `/api/bookings/{id}/` - Cancel booking

**Clients:**
- GET `/api/clients/` - List all clients
- POST `/api/clients/` - Create client
- PUT `/api/clients/{id}/` - Update client

**Schedules:**
- GET `/api/business-hours/` - List business hours
- POST `/api/business-hours/` - Create/update hours
- GET `/api/staff-schedules/?staff={id}` - Get staff schedule
- POST `/api/staff-schedules/` - Create/update schedule
- GET `/api/closures/` - List closures
- POST `/api/closures/` - Create closure
- GET `/api/staff-leave/?staff={id}` - Get staff leave
- POST `/api/staff-leave/` - Create leave

## 🎓 Training New Clients

**Admin User Guide:**

1. **Managing Services:**
   - Add/edit services with pricing
   - Set duration for scheduling
   - Toggle active status to hide services

2. **Managing Staff:**
   - Add staff with contact info
   - Upload photos (via URL)
   - Assign services each staff can perform
   - Set availability via schedules

3. **Managing Schedules:**
   - Set business opening hours
   - Configure individual staff hours
   - Add closures for holidays
   - Track staff time off

4. **Managing Bookings:**
   - View all bookings
   - Filter by date, staff, status
   - Update booking status
   - Export to CSV

5. **Client Database:**
   - View all clients
   - Track booking history
   - Export marketing list (GDPR compliant)

## 📞 Support

For issues or questions:
1. Check this README
2. Review deployment logs (Railway/Vercel)
3. Test API endpoints directly
4. Check browser console for frontend errors

## 🔄 Updates & Maintenance

**Regular Tasks:**
- Update dependencies monthly
- Review and archive old bookings
- Backup database weekly
- Monitor email delivery
- Check for security updates

**Version Control:**
- Keep master template updated
- Document customizations per client
- Use branches for experimental features
- Tag stable releases

---

## 📄 License

Proprietary - Internal use only for NBNE booking instances.

## 🙏 Credits

Built with Next.js, Django, and modern web technologies.
Designed for professional service businesses.
