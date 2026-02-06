'use client'

import { useState, useEffect } from 'react'
import { format, addDays } from 'date-fns'
import './booking-compact.css'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8001/api'

interface Service {
  id: number
  name: string
  description: string
  duration_minutes: number
  price: string
  active: boolean
}

interface Staff {
  id: number
  name: string
  email: string
  photo_url?: string
  active: boolean
}

export default function CompactBookingPage() {
  const [services, setServices] = useState<Service[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string>('')
  
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [consent, setConsent] = useState(false)
  
  const [bookingComplete, setBookingComplete] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [servicesRes, staffRes] = await Promise.all([
        fetch(`${API_BASE}/services/`),
        fetch(`${API_BASE}/staff/`)
      ])

      if (!servicesRes.ok || !staffRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const servicesData = await servicesRes.json()
      const staffData = await staffRes.json()

      setServices(servicesData.filter((s: Service) => s.active))
      setStaff(staffData.filter((s: Staff) => s.active))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push(time)
      }
    }
    return slots
  }

  const generateDates = () => {
    const dates = []
    const today = new Date()
    for (let i = 0; i < 14; i++) {
      dates.push(addDays(today, i))
    }
    return dates
  }

  const handleSubmit = async () => {
    if (!selectedService || !selectedStaff || !selectedDate || !selectedTime) {
      setError('Please complete all booking steps')
      return
    }

    if (!customerName || !customerEmail || !customerPhone) {
      setError('Please fill in all customer details')
      return
    }

    if (!consent) {
      setError('Please accept the terms and conditions')
      return
    }

    try {
      const bookingData = {
        service: selectedService.id,
        staff: selectedStaff.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        client_name: customerName,
        client_email: customerEmail,
        client_phone: customerPhone,
        notes: notes,
      }
      
      const response = await fetch(`${API_BASE}/bookings/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      })

      if (!response.ok) {
        throw new Error('Failed to create booking')
      }

      setBookingComplete(true)
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="booking-container">
        <div className="booking-header">
          <h1>House of Hair</h1>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (bookingComplete) {
    return (
      <div className="booking-container">
        <div className="success-message">
          <h2>✓ Booking Confirmed!</h2>
          <p>Your appointment has been successfully booked.</p>
          <p><strong>Service:</strong> {selectedService?.name}</p>
          <p><strong>Stylist:</strong> {selectedStaff?.name}</p>
          <p><strong>Date:</strong> {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
          <p><strong>Time:</strong> {selectedTime}</p>
          <p><strong>Total:</strong> £{selectedService?.price}</p>
          <button className="submit-button" onClick={() => window.location.reload()}>
            Book Another Appointment
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="booking-container">
      <div className="booking-header">
        <img src="/logo.png" alt="House of Hair" style={{ height: '80px', marginBottom: '10px' }} />
        <h1>House of Hair</h1>
        <p>Professional Hair Salon - Book Your Appointment</p>
      </div>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
          <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      <div className="booking-grid">
        {/* Service Selection */}
        <div className="booking-section">
          <h2>1. Choose Service</h2>
          <div className="compact-service-grid">
            {services.map((service) => (
              <div
                key={service.id}
                className={`compact-service-card ${selectedService?.id === service.id ? 'selected' : ''}`}
                onClick={() => setSelectedService(service)}
              >
                <img src="/scissors.png" alt="" style={{ width: '30px', height: '30px', marginBottom: '8px', opacity: 0.7 }} />
                <h3>{service.name}</h3>
                <div className="price">£{service.price}</div>
                <div className="duration">{service.duration_minutes} min</div>
              </div>
            ))}
          </div>
        </div>

        {/* Staff Selection */}
        <div className="booking-section">
          <h2>2. Choose Stylist</h2>
          <div className="staff-grid">
            {staff.map((member) => (
              <div
                key={member.id}
                className={`staff-card ${selectedStaff?.id === member.id ? 'selected' : ''}`}
                onClick={() => setSelectedStaff(member)}
              >
                {member.photo_url ? (
                  <img src={member.photo_url} alt={member.name} className="staff-photo" />
                ) : (
                  <div className="staff-photo-placeholder">
                    {member.name.charAt(0)}
                  </div>
                )}
                <div className="staff-info">
                  <h3>{member.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Date Selection */}
        <div className="booking-section">
          <h2>3. Choose Date</h2>
          <div className="date-selector">
            {generateDates().slice(0, 9).map((date) => (
              <button
                key={date.toISOString()}
                className={`date-button ${selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') ? 'selected' : ''}`}
                onClick={() => setSelectedDate(date)}
              >
                <div>{format(date, 'EEE')}</div>
                <div>{format(date, 'd MMM')}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Time Selection */}
        <div className="booking-section">
          <h2>4. Choose Time</h2>
          <div className="time-slots">
            {generateTimeSlots().map((time) => (
              <button
                key={time}
                className={`time-slot ${selectedTime === time ? 'selected' : ''}`}
                onClick={() => setSelectedTime(time)}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Customer Details */}
      <div className="booking-section" style={{ marginTop: '20px' }}>
        <h2>5. Your Details</h2>
        <div className="customer-form">
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Your full name"
            />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="your.email@example.com"
            />
          </div>
          <div className="form-group">
            <label>Phone *</label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="07XXX XXXXXX"
            />
          </div>
          <div className="form-group">
            <label>Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests or notes"
              rows={3}
            />
          </div>
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="consent"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <label htmlFor="consent">I agree to the terms and conditions</label>
          </div>
        </div>
      </div>

      {/* Summary and Submit */}
      {selectedService && selectedStaff && selectedDate && selectedTime && (
        <div className="booking-summary">
          <h2>Booking Summary</h2>
          <div className="summary-item">
            <span>Service:</span>
            <span>{selectedService.name}</span>
          </div>
          <div className="summary-item">
            <span>Stylist:</span>
            <span>{selectedStaff.name}</span>
          </div>
          <div className="summary-item">
            <span>Date:</span>
            <span>{format(selectedDate, 'EEE, d MMM yyyy')}</span>
          </div>
          <div className="summary-item">
            <span>Time:</span>
            <span>{selectedTime}</span>
          </div>
          <div className="summary-item">
            <span>Duration:</span>
            <span>{selectedService.duration_minutes} min</span>
          </div>
          <div className="summary-item">
            <span>Total:</span>
            <span>£{selectedService.price}</span>
          </div>
          <button
            className="submit-button"
            onClick={handleSubmit}
            disabled={!consent || !customerName || !customerEmail || !customerPhone}
          >
            Confirm Booking
          </button>
        </div>
      )}
    </div>
  )
}
