# Payment System Integration Guide

## Overview

The Mind Department booking system is now **payment-ready** with a clean API for your standalone payment system to integrate with.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│   Booking System (This App)        │
│   - Health questionnaires (annual)  │
│   - Session booking                 │
│   - Credit tracking                 │
│   - Capacity management             │
└──────────────┬──────────────────────┘
               │
               │ REST API Integration
               │
┌──────────────▼──────────────────────┐
│   Payment System (Your Next App)   │
│   - Stripe integration              │
│   - Package purchases               │
│   - Transaction processing          │
│   - Payment UI                      │
└─────────────────────────────────────┘
```

---

## ✅ What's Been Added

### 1. **Annual Health Questionnaire Renewal**

**IntakeProfile Model Updates:**
- `completed_date` - When questionnaire was completed
- `expires_at` - Expiry date (1 year from completion)
- `is_expired()` - Check if renewal needed
- `is_valid_for_booking()` - Now includes expiry check

**Behavior:**
- Questionnaire expires after 365 days
- User must renew before booking
- Renewal updates `completed_date` and `expires_at`

### 2. **Payment Integration Fields**

**Booking Model Updates:**
```python
payment_status = 'pending' | 'paid' | 'failed' | 'refunded' | 'credit_used'
payment_id = 'stripe_pi_xxx'  # Your payment system reference
payment_amount = Decimal('25.00')
payment_type = 'single_class' | 'package' | 'credit'
```

### 3. **Class Package System**

**New Models:**
- `ClassPackage` - Define packages (e.g., "5 Class Pass - £100")
- `ClientCredit` - Track client's remaining classes
- `PaymentTransaction` - Audit trail of all transactions

---

## 📡 API Endpoints for Your Payment System

### Base URL
```
https://[your-railway-app].railway.app/api
```

### 1. **Get Available Packages**

```http
GET /api/packages/
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "5 Class Pass",
    "description": "Save 20% with 5 classes",
    "class_count": 5,
    "price": "100.00",
    "price_per_class": 20.00,
    "validity_days": 365,
    "active": true
  },
  {
    "id": 2,
    "name": "10 Class Pass",
    "description": "Save 30% with 10 classes",
    "class_count": 10,
    "price": "175.00",
    "price_per_class": 17.50,
    "validity_days": 365,
    "active": true
  }
]
```

### 2. **Check Client's Credits**

```http
GET /api/credits/by-client/?client_id=123
```

**Response:**
```json
{
  "client_id": 123,
  "total_credits": 8,
  "credits": [
    {
      "id": 45,
      "package_name": "10 Class Pass",
      "total_classes": 10,
      "remaining_classes": 8,
      "expires_at": "2027-02-06T00:00:00Z",
      "is_valid": true
    }
  ]
}
```

### 3. **Confirm Single Class Payment**

Called by your payment system after successful Stripe payment.

```http
POST /api/payment/confirm-payment/
Content-Type: application/json

{
  "booking_id": 123,
  "payment_id": "pi_3AbCdEfGhIjKlMnO",
  "amount": 25.00,
  "payment_type": "single_class"
}
```

**Response:**
```json
{
  "success": true,
  "booking_id": 123,
  "status": "confirmed",
  "payment_status": "paid"
}
```

### 4. **Create Credit After Package Purchase**

Called by your payment system after successful package purchase.

```http
POST /api/payment/create-credit/
Content-Type: application/json

{
  "client_id": 123,
  "package_id": 2,
  "payment_id": "pi_3AbCdEfGhIjKlMnO",
  "amount_paid": 100.00
}
```

**Response:**
```json
{
  "success": true,
  "credit": {
    "id": 45,
    "total_classes": 5,
    "remaining_classes": 5,
    "expires_at": "2027-02-06T00:00:00Z",
    "is_valid": true
  },
  "transaction_id": 789
}
```

### 5. **Use Credit for Booking**

```http
POST /api/credits/use/
Content-Type: application/json

{
  "credit_id": 45,
  "booking_id": 123
}
```

**Response:**
```json
{
  "success": true,
  "remaining_classes": 4,
  "booking_id": 123,
  "booking_status": "confirmed"
}
```

### 6. **Refund Credit (Booking Cancelled)**

```http
POST /api/credits/refund/
Content-Type: application/json

{
  "credit_id": 45
}
```

**Response:**
```json
{
  "success": true,
  "remaining_classes": 5
}
```

### 7. **Check Booking Payment Status**

```http
GET /api/payment/booking-status/?booking_id=123
```

**Response:**
```json
{
  "booking_id": 123,
  "status": "confirmed",
  "payment_status": "paid",
  "payment_id": "pi_3AbCdEfGhIjKlMnO",
  "payment_amount": "25.00",
  "payment_type": "single_class"
}
```

---

## 🔄 Integration Flow Examples

### Flow 1: Single Class Purchase

```
1. User completes health questionnaire (Booking System)
2. User selects class (Booking System)
3. Booking created with payment_status='pending' (Booking System)
4. Redirect to Payment System with booking_id
5. User pays via Stripe (Payment System)
6. Payment System calls: POST /api/payment/confirm-payment/
7. Booking status updated to 'confirmed' (Booking System)
8. Confirmation email sent (Booking System)
9. Redirect back to booking confirmation page
```

### Flow 2: Package Purchase

```
1. User views packages (Payment System fetches from /api/packages/)
2. User selects "5 Class Pass" (Payment System)
3. User pays via Stripe (Payment System)
4. Payment System calls: POST /api/payment/create-credit/
5. ClientCredit record created with 5 classes (Booking System)
6. User can now book using credits
```

### Flow 3: Book Using Existing Credit

```
1. User selects class (Booking System)
2. Booking System checks: GET /api/credits/by-client/?client_id=X
3. User has 3 credits remaining
4. User chooses "Use Credit" instead of "Pay Now"
5. Booking System calls: POST /api/credits/use/
6. Credit decremented to 2 remaining
7. Booking confirmed immediately (no payment needed)
8. Confirmation email sent
```

---

## 🗄️ Database Models Reference

### ClassPackage
```python
{
  "name": "5 Class Pass",
  "description": "Save 20%",
  "class_count": 5,
  "price": 100.00,
  "validity_days": 365,
  "active": True
}
```

### ClientCredit
```python
{
  "client": Client object,
  "package": ClassPackage object,
  "total_classes": 5,
  "remaining_classes": 3,
  "payment_id": "pi_xxx",
  "amount_paid": 100.00,
  "purchased_at": datetime,
  "expires_at": datetime,
  "active": True
}
```

### PaymentTransaction (Audit Trail)
```python
{
  "client": Client object,
  "transaction_type": "purchase" | "single" | "refund",
  "status": "pending" | "completed" | "failed" | "refunded",
  "payment_system_id": "pi_xxx",  # Stripe payment intent ID
  "amount": 100.00,
  "currency": "GBP",
  "package": ClassPackage object (if applicable),
  "credit": ClientCredit object (if applicable),
  "payment_metadata": {}  # JSON field for additional data
}
```

---

## 🔐 Security Considerations

### Authentication
Your payment system should:
1. Use API keys or JWT tokens for authentication
2. Validate booking_id and client_id before processing
3. Verify payment amounts match expected prices

### Webhooks
Consider implementing Stripe webhooks in your payment system:
- `payment_intent.succeeded` → Call confirm-payment endpoint
- `payment_intent.failed` → Update booking status
- `charge.refunded` → Call refund endpoint

### Idempotency
- Use Stripe's `payment_intent_id` as `payment_id`
- Prevents duplicate credit creation
- Safe to retry API calls

---

## 📊 Admin Management

Aly can manage packages via Django admin:

**Admin URL:** `https://[railway-app].railway.app/admin`

**Available Actions:**
- Create/edit class packages
- View client credits
- See payment transactions
- Manually adjust credits (if needed)
- Export transaction reports

---

## 🚀 Next Steps for Your Payment System

### 1. **Create Payment System App**
```bash
# Suggested structure
payment-system/
├── stripe-integration/
│   ├── checkout.py
│   ├── webhooks.py
│   └── packages.py
├── api/
│   ├── booking_api.py  # Calls booking system endpoints
│   └── client.py
└── frontend/
    ├── checkout-page.tsx
    └── packages-page.tsx
```

### 2. **Environment Variables**
```env
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
BOOKING_SYSTEM_API_URL=https://minddepartment.railway.app/api
BOOKING_SYSTEM_API_KEY=xxx  # If you add authentication
```

### 3. **Test Integration**
```python
# Example: Confirm payment after Stripe success
import requests

def confirm_booking_payment(booking_id, payment_intent):
    response = requests.post(
        'https://minddepartment.railway.app/api/payment/confirm-payment/',
        json={
            'booking_id': booking_id,
            'payment_id': payment_intent.id,
            'amount': payment_intent.amount / 100,  # Stripe uses cents
            'payment_type': 'single_class'
        }
    )
    return response.json()
```

---

## 📋 Checklist for Aly

Before launching:
- [ ] Create class packages in Django admin
- [ ] Set package prices
- [ ] Test single class payment flow
- [ ] Test package purchase flow
- [ ] Test booking with credits
- [ ] Verify email confirmations work
- [ ] Test annual questionnaire renewal
- [ ] Export test transaction report

---

## 🆘 Support

**Integration Issues:**
- Check Railway logs for API errors
- Verify payment_id format matches Stripe
- Ensure booking_id exists before payment
- Check client has valid intake profile

**Common Errors:**
- `404 Not Found` - Check booking_id exists
- `400 Bad Request` - Missing required fields
- `Credit not valid` - Credit expired or already used

---

**The booking system is now payment-ready!** Build your payment system to integrate with these endpoints, and the two apps will work together seamlessly.
