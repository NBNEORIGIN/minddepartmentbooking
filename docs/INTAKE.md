# The Mind Department - Intake System Documentation

## Loop MD-3: One-Time Intake Gate (GDPR-Safe)

**Date:** 2026-02-06  
**Status:** ✅ Backend Complete, Frontend In Progress

## Overview

The intake system ensures all participants complete a one-time profile before booking sessions. This collects essential safety information (emergency contact) and preferences while remaining GDPR-compliant by avoiding medical/diagnostic data.

## Backend Implementation

### Models

**IntakeProfile** (`backend/bookings/models_intake.py`)
- Core identity: full_name, email, phone
- Emergency contact: name, phone (safety requirement)
- Optional preferences: experience_level, goals, preferences
- GDPR consent: booking, marketing, privacy
- Auto-completion validation
- Unique email constraint

**IntakeWellbeingDisclaimer**
- Versioned disclaimer text
- One active disclaimer at a time
- Editable via Django admin

### API Endpoints

**POST /api/intake/**
- Create new intake profile
- Validates required fields and consents
- Returns profile with completion status

**GET /api/intake/status/?email={email}**
- Check if email has completed intake
- Returns: exists, completed, profile_id, is_valid_for_booking

**GET /api/intake/by_email/?email={email}**
- Retrieve full profile by email
- For returning users

**GET /api/intake-disclaimer/active/**
- Get current active disclaimer text
- Displayed during intake process

### Validation Rules

**Required for Booking:**
- full_name, email, phone
- emergency_contact_name, emergency_contact_phone
- consent_booking = true
- consent_privacy = true

**Optional:**
- experience_level
- goals
- preferences
- consent_marketing

**GDPR-Safe:**
- No medical history
- No diagnostic information
- No sensitive health data
- Clear consent mechanisms

## Frontend Implementation (In Progress)

### Intake Flow

**Check Status:**
1. User enters email on booking page
2. Frontend calls `/api/intake/status/?email={email}`
3. If completed → proceed to booking
4. If not completed → redirect to intake form

**Intake Form:**
1. Display wellbeing disclaimer
2. Collect required information
3. Collect optional preferences
4. Present consent checkboxes
5. Validate and submit
6. Return to booking flow

**Returning Users:**
- Intake status checked by email
- Existing profile reused
- Can update profile if needed

### UI/UX Principles

**Calm & Supportive:**
- Clear explanation of why information is needed
- Optional fields clearly marked
- No pressure or urgency
- Reassuring language

**GDPR Transparency:**
- Clear consent options
- Separate marketing consent
- Link to privacy policy
- Explanation of data usage

**Accessibility:**
- Clear labels
- Helpful placeholder text
- Inline validation
- Error messages that guide

## Exit Conditions

- ☑ No medical/diagnostic fields
- ☑ Wellbeing disclaimer included
- ☑ Intake stored and reused
- ☑ Backend API complete
- ☐ Frontend intake form (in progress)
- ☐ Redirect logic (pending)
- ☐ Update works (pending)

## Next Steps

1. Create frontend intake form component
2. Add intake status check to booking flow
3. Implement redirect logic
4. Test first-time vs returning user flows
5. Deploy and verify end-to-end

---

## Technical Notes

**Database:**
- IntakeProfile table with unique email index
- IntakeWellbeingDisclaimer table with version tracking

**API Security:**
- Email validation
- Consent validation
- Unique email enforcement

**Data Retention:**
- Profiles persist for returning users
- Can be updated via admin or API
- GDPR-compliant export/deletion (MD-7)

**Integration:**
- Booking system checks intake status
- Admin can view/manage profiles
- CSV export for compliance
