# Local Testing Guide - The Mind Department

## Prerequisites

- ✅ Python 3.11+ installed
- ✅ Node.js 18+ installed
- ✅ PostgreSQL 17 installed (you have this)
- ✅ Git installed

---

## 🗄️ Step 1: Setup PostgreSQL Database (5 minutes)

Since you have PostgreSQL 17 installed, let's create the database:

### Open PowerShell and run:

```powershell
# Connect to PostgreSQL
psql -U postgres

# In psql prompt, create database:
CREATE DATABASE minddepartment_booking;

# Create user (optional, or use postgres user):
CREATE USER minddept_user WITH PASSWORD 'local_dev_password';
GRANT ALL PRIVILEGES ON DATABASE minddepartment_booking TO minddept_user;

# Exit psql
\q
```

---

## 🐍 Step 2: Setup Django Backend (10 minutes)

### Navigate to backend directory:

```powershell
cd D:\nbne-booking-instances\clients\minddepartmentbooking\backend
```

### Create virtual environment:

```powershell
python -m venv venv
```

### Activate virtual environment:

```powershell
.\venv\Scripts\activate
```

### Install dependencies:

```powershell
pip install -r requirements.txt
```

### Create `.env` file:

Create `backend/.env` with this content:

```env
# Django Settings
SECRET_KEY=local-dev-secret-key-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (PostgreSQL)
DATABASE_URL=postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/minddepartment_booking

# Email (Resend - optional for local testing)
RESEND_API_KEY=re_test_key_optional
RESEND_FROM_EMAIL=test@localhost

# Client Info
CLIENT_NAME=The Mind Department
CLIENT_SLUG=minddepartment
```

**Replace `YOUR_POSTGRES_PASSWORD` with your actual PostgreSQL password!**

### Run migrations:

```powershell
python manage.py makemigrations
python manage.py migrate
```

### Create superuser (for admin access):

```powershell
python manage.py createsuperuser
```

Follow prompts:
- Username: `admin`
- Email: `admin@theminddepartment.com`
- Password: (choose a password)

### Start Django server:

```powershell
python manage.py runserver
```

**Backend should now be running at:** `http://localhost:8000`

**Test it:** Visit `http://localhost:8000/admin` and login with your superuser credentials.

---

## ⚛️ Step 3: Setup Next.js Frontend (5 minutes)

### Open a NEW PowerShell window (keep backend running)

```powershell
cd D:\nbne-booking-instances\clients\minddepartmentbooking\frontend
```

### Install dependencies:

```powershell
npm install
```

This will take 2-3 minutes and will resolve all the TypeScript errors.

### Create `.env.local` file:

Create `frontend/.env.local` with this content:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

### Start Next.js dev server:

```powershell
npm run dev
```

**Frontend should now be running at:** `http://localhost:3000`

---

## 🧪 Step 4: Test the System (15 minutes)

### 1. **Setup Initial Data via Django Admin**

Visit: `http://localhost:8000/admin`

**Create a Service:**
- Services → Add Service
- Name: "Mindfulness Session"
- Description: "60-minute guided mindfulness practice"
- Duration: 60 minutes
- Price: £25.00
- Active: ✓

**Create a Staff Member:**
- Staff → Add Staff
- Name: "Aly Harwood"
- Email: "aly@theminddepartment.com"
- Services: Select "Mindfulness Session"
- Active: ✓

**Create Wellbeing Disclaimer:**
- Intake Wellbeing Disclaimers → Add
- Version: "1.0"
- Content: 
  ```html
  <p>The Mind Department offers wellness sessions designed to support your personal growth and wellbeing.</p>
  <p><strong>Please note:</strong> Our sessions are not a substitute for medical or psychological treatment.</p>
  <p>By proceeding, you confirm that you are participating in these sessions for wellness purposes.</p>
  ```
- Active: ✓

**Create a Class Package (optional):**
- Class Packages → Add
- Name: "5 Class Pass"
- Description: "Save 20% with 5 classes"
- Class Count: 5
- Price: £100.00
- Validity Days: 365
- Active: ✓

### 2. **Test Health Questionnaire Flow**

Visit: `http://localhost:3000/intake`

**Fill out the form:**
- Full Name: "Test User"
- Email: "test@example.com"
- Phone: "07123456789"
- Emergency Contact Name: "Emergency Contact"
- Emergency Contact Phone: "07987654321"
- Experience Level: "First time"
- Goals: "Reduce stress and anxiety"
- ✓ Consent to booking
- ✓ Accept privacy policy
- ✓ Receive updates (optional)

**Submit** → Should redirect to booking page

### 3. **Test Booking Flow**

Visit: `http://localhost:3000`

**Complete booking:**
1. Select "Mindfulness Session"
2. Select "Aly Harwood"
3. Select a date (today or future)
4. Select a time slot
5. Enter customer details (use same email as intake)
6. Click "Book Your Experience"

**Expected:** Booking created with `payment_status='pending'`

### 4. **Verify in Django Admin**

Visit: `http://localhost:8000/admin/bookings/booking/`

**You should see:**
- Your test booking
- Status: Pending
- Payment Status: Payment Pending
- Client details linked

Visit: `http://localhost:8000/admin/bookings/intakeprofile/`

**You should see:**
- Your intake profile
- Completed: ✓
- Expires At: (1 year from now)

### 5. **Test API Endpoints**

**Get Packages:**
```powershell
curl http://localhost:8000/api/packages/
```

**Check Intake Status:**
```powershell
curl "http://localhost:8000/api/intake/status/?email=test@example.com"
```

**Get Client Credits:**
```powershell
# First, get client ID from admin, then:
curl "http://localhost:8000/api/credits/by-client/?client_id=1"
```

---

## 🧪 Step 5: Test Payment Integration (Mock)

### Simulate Payment Confirmation:

```powershell
# Get booking ID from admin (e.g., 1)
curl -X POST http://localhost:8000/api/payment/confirm-payment/ `
  -H "Content-Type: application/json" `
  -d '{\"booking_id\": 1, \"payment_id\": \"test_pi_123\", \"amount\": 25.00, \"payment_type\": \"single_class\"}'
```

**Check result in admin:**
- Booking status should change to "Confirmed"
- Payment status should be "Paid"

### Simulate Package Purchase:

```powershell
# Create credit for client (use client ID from admin)
curl -X POST http://localhost:8000/api/payment/create-credit/ `
  -H "Content-Type: application/json" `
  -d '{\"client_id\": 1, \"package_id\": 1, \"payment_id\": \"test_pi_456\", \"amount_paid\": 100.00}'
```

**Check result in admin:**
- Client Credits → Should see new credit with 5 classes

### Test Using Credit:

```powershell
# Use credit for a booking (use credit ID and booking ID from admin)
curl -X POST http://localhost:8000/api/credits/use/ `
  -H "Content-Type: application/json" `
  -d '{\"credit_id\": 1, \"booking_id\": 2}'
```

**Check result:**
- Credit remaining_classes should decrease
- Booking payment_status should be "Credit Used"

---

## 📧 Step 6: Test Email (Optional)

### Option 1: Use Resend Test API Key

1. Sign up at https://resend.com (free tier)
2. Get API key
3. Update `backend/.env`:
   ```env
   RESEND_API_KEY=re_your_actual_key
   RESEND_FROM_EMAIL=onboarding@resend.dev
   ```
4. Restart Django server
5. Create a booking → Email should be sent

### Option 2: Skip Email Testing

- Emails will work in production with Railway Pro + SMTP
- For now, you can see booking confirmations in Django admin

---

## 🔍 Troubleshooting

### Backend Issues

**"ModuleNotFoundError"**
```powershell
# Make sure venv is activated:
.\venv\Scripts\activate
pip install -r requirements.txt
```

**"Database connection error"**
- Check PostgreSQL is running: `Get-Service postgresql*`
- Verify DATABASE_URL in `.env`
- Test connection: `psql -U postgres -d minddepartment_booking`

**"Migrations not applied"**
```powershell
python manage.py migrate
```

### Frontend Issues

**"Cannot find module 'next'"**
```powershell
# Delete node_modules and reinstall:
rm -r node_modules
npm install
```

**"API connection refused"**
- Make sure Django backend is running on port 8000
- Check `NEXT_PUBLIC_API_BASE_URL` in `.env.local`

**"CORS errors"**
- Django has CORS configured for localhost
- If issues persist, check `backend/booking_platform/settings.py` CORS settings

---

## ✅ Success Checklist

Before deploying to Railway/Vercel, verify:

- [ ] Django admin accessible
- [ ] Can create services and staff
- [ ] Intake form loads and submits
- [ ] Intake profile created in database
- [ ] Booking page loads with services
- [ ] Can complete a booking
- [ ] Booking appears in admin
- [ ] API endpoints respond correctly
- [ ] Payment confirmation endpoint works
- [ ] Package/credit system works
- [ ] Annual expiry logic works (check intake profile expires_at)

---

## 🚀 Ready for Deployment?

Once local testing is complete:

1. **Deploy Backend to Railway:**
   - Follow `NEXT-STEPS.md` Railway section
   - Railway Pro will provide SMTP for emails
   - Migrations run automatically

2. **Deploy Frontend to Vercel:**
   - Follow `NEXT-STEPS.md` Vercel section
   - Set `NEXT_PUBLIC_API_BASE_URL` to Railway URL

3. **Configure Production:**
   - Add class packages in Railway admin
   - Add wellbeing disclaimer
   - Test end-to-end with real Stripe (via your payment system)

---

## 📞 Need Help?

**Common Commands:**

```powershell
# Backend
cd backend
.\venv\Scripts\activate
python manage.py runserver

# Frontend
cd frontend
npm run dev

# Database
psql -U postgres -d minddepartment_booking

# Check logs
# Backend: Terminal where runserver is running
# Frontend: Terminal where npm run dev is running
```

**Quick Reset:**

```powershell
# Reset database (WARNING: Deletes all data)
psql -U postgres
DROP DATABASE minddepartment_booking;
CREATE DATABASE minddepartment_booking;
\q

# Re-run migrations
cd backend
python manage.py migrate
python manage.py createsuperuser
```

---

**You're all set for local testing!** Follow the steps above and you'll have a fully functional local environment to test before deploying to Railway/Vercel.
