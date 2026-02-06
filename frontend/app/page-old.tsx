'use client'

import { useState, useEffect } from 'react'
import { format, addDays, isSameDay } from 'date-fns'
import Image from 'next/image'

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

interface TimeSlot {
  start_time: string
  end_time: string
  available: boolean
  reason?: string
}

export default function BookingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [services, setServices] = useState<Service[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [consent, setConsent] = useState(false)
  
  const [bookingComplete, setBookingComplete] = useState(false)
  const [bookingReference, setBookingReference] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedService && selectedStaff && selectedDate) {
      fetchTimeSlots()
    }
  }, [selectedService, selectedStaff, selectedDate])

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

      setServices(servicesData)
      setStaff(staffData)
      setLoading(false)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const fetchTimeSlots = async () => {
    if (!selectedService || !selectedStaff || !selectedDate) return
    
    setLoadingSlots(true)
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const url = `${API_BASE}/bookings/slots/?staff_id=${selectedStaff.id}&service_id=${selectedService.id}&date=${dateStr}`
      console.log('Fetching time slots from:', url)
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Failed to fetch time slots')
      }
      
      const data = await response.json()
      console.log('Time slots response:', data)
      
      // Handle different response formats
      const slots = data.slots || data || []
      console.log('Parsed slots:', slots)
      
      setTimeSlots(slots)
      setLoadingSlots(false)
    } catch (err: any) {
      console.error('Error fetching time slots:', err)
      setError(err.message)
      setLoadingSlots(false)
    }
  }

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service)
    setCurrentStep(2)
  }

  const handleStaffSelect = (staffMember: Staff) => {
    setSelectedStaff(staffMember)
    setCurrentStep(3)
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setSelectedTime('')
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    setCurrentStep(4)
  }

  const handleSubmitBooking = async () => {
    if (!selectedService || !selectedStaff || !selectedDate || !selectedTime) {
      setError('Please complete all booking details')
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
      
      console.log('Submitting booking:', bookingData)
      
      const response = await fetch(`${API_BASE}/bookings/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      })

      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.text()
        console.error('Booking error response:', errorData)
        throw new Error(`Failed to create booking: ${errorData}`)
      }

      const data = await response.json()
      console.log('Booking created:', data)
      setBookingReference(data.id || 'CONFIRMED')
      setBookingComplete(true)
      setCurrentStep(5)
    } catch (err: any) {
      console.error('Booking submission error:', err)
      setError(err.message)
    }
  }

  const generateDateButtons = () => {
    const dates = []
    const today = new Date()
    
    for (let i = 0; i < 14; i++) {
      dates.push(addDays(today, i))
    }
    
    return dates
  }

  if (loading) {
    return (
      <div className="container">
        <div className="header">
          <img src="/logo.png" alt="House of Hair" className="header-logo" />
          <p>Professional Hair Salon - Book Your Appointment</p>
        </div>
        <div className="loading">Loading</div>
      </div>
    )
  }

  if (bookingComplete) {
    return (
      <div className="container">
        <div className="header">
          <img src="/logo.png" alt="House of Hair" className="header-logo" />
          <p>Professional Hair Salon</p>
        </div>
        <div className="success">
          <h3>✓ Booking Confirmed!</h3>
          <p>Your appointment has been successfully booked.</p>
          <p><strong>Reference:</strong> #{bookingReference}</p>
          <div className="summary-box" style={{ marginTop: '30px' }}>
            <div className="summary-item">
              <span className="summary-label">Service:</span>
              <span className="summary-value">{selectedService?.name}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Stylist:</span>
              <span className="summary-value">{selectedStaff?.name}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Date:</span>
              <span className="summary-value">{selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Time:</span>
              <span className="summary-value">{selectedTime}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Duration:</span>
              <span className="summary-value">{selectedService?.duration_minutes} minutes</span>
            </div>
            <div className="summary-item">
              <span className="summary-label summary-total">Total:</span>
              <span className="summary-value summary-total">£{selectedService?.price}</span>
            </div>
          </div>
          <p style={{ marginTop: '20px', color: '#666' }}>
            A confirmation email has been sent to {customerEmail}
          </p>
          <button className="button" onClick={() => window.location.reload()} style={{ marginTop: '30px' }}>
            Book Another Appointment
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="header">
        <img src="/logo.png" alt="House of Hair" className="header-logo" />
        <p>Professional Hair Salon - Book Your Appointment</p>
      </div>

      {error && (
        <div className="error">
          <strong>Error:</strong> {error}
          <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>
      )}

      <div className="step-indicator">
        <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
          <div className="step-number">1</div>
          <div className="step-label">Service</div>
        </div>
        <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
          <div className="step-number">2</div>
          <div className="step-label">Stylist</div>
        </div>
        <div className={`step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
          <div className="step-number">3</div>
          <div className="step-label">Date & Time</div>
        </div>
        <div className={`step ${currentStep >= 4 ? 'active' : ''} ${currentStep > 4 ? 'completed' : ''}`}>
          <div className="step-number">4</div>
          <div className="step-label">Details</div>
        </div>
        <div className={`step ${currentStep >= 5 ? 'active' : ''}`}>
          <div className="step-number">5</div>
          <div className="step-label">Confirm</div>
        </div>
      </div>

      <div className="card">
        <h2>Step 1: Choose a Service</h2>
        <div className="grid">
          {services.map((service) => (
            <div
              key={service.id}
              className={`service-card ${selectedService?.id === service.id ? 'selected' : ''}`}
              onClick={() => handleServiceSelect(service)}
            >
              <img src="/scissors.png" alt="" className="service-icon" />
              <h3>{service.name}</h3>
              <div className="service-price">£{service.price}</div>
              <div className="service-duration">{service.duration_minutes} minutes</div>
              {service.description && (
                <div className="service-description">{service.description}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedService && (
        <div className="card">
          <h2>Step 2: Choose Your Stylist</h2>
          <div className="grid">
            {staff.map((member) => (
              <div
                key={member.id}
                className={`service-card ${selectedStaff?.id === member.id ? 'selected' : ''}`}
                onClick={() => handleStaffSelect(member)}
              >
                <h3>{member.name}</h3>
                <div className="service-description">{member.email}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedService && selectedStaff && (
        <div className="card">
          <h2>Step 3: Select Date & Time</h2>
          
          <h3>Choose a Date</h3>
          <div className="date-picker">
            {generateDateButtons().map((date) => (
              <button
                key={date.toISOString()}
                className={`date-button ${selectedDate && isSameDay(date, selectedDate) ? 'selected' : ''}`}
                onClick={() => handleDateSelect(date)}
              >
                <div className="date-day">{format(date, 'EEE')}</div>
                <div className="date-number">{format(date, 'd')}</div>
                <div className="date-day">{format(date, 'MMM')}</div>
              </button>
            ))}
          </div>

          {selectedDate && (
            <>
              <h3>Available Times for {format(selectedDate, 'EEEE, MMMM d')}</h3>
              {loadingSlots ? (
                <div className="loading">Loading available times</div>
              ) : timeSlots.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-medium)' }}>
                  No available time slots for this date. Please select another date.
                </div>
              ) : (
                <div className="time-slots">
                  {timeSlots.map((slot, index) => {
                    const timeStr = slot.start_time ? format(new Date(slot.start_time), 'HH:mm') : 'N/A'
                    return (
                      <button
                        key={slot.start_time || index}
                        className={`time-slot ${selectedTime === timeStr ? 'selected' : ''}`}
                        disabled={!slot.available}
                        onClick={() => handleTimeSelect(timeStr)}
                        style={{ color: slot.available ? 'var(--text-dark)' : 'var(--text-light)' }}
                      >
                        {timeStr}
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {selectedService && selectedStaff && selectedDate && selectedTime && currentStep >= 4 && (
        <div className="card">
          <h2>Step 4: Your Details</h2>
          
          <div className="summary-box">
            <div className="summary-item">
              <span className="summary-label">Service:</span>
              <span className="summary-value">{selectedService.name}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Stylist:</span>
              <span className="summary-value">{selectedStaff.name}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Date & Time:</span>
              <span className="summary-value">
                {format(selectedDate, 'EEEE, MMMM d')} at {selectedTime}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Duration:</span>
              <span className="summary-value">{selectedService.duration_minutes} minutes</span>
            </div>
            <div className="summary-item">
              <span className="summary-label summary-total">Price:</span>
              <span className="summary-value summary-total">£{selectedService.price}</span>
            </div>
          </div>

          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="form-group">
            <label>Email Address *</label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Phone Number *</label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="07XXX XXXXXX"
              required
            />
          </div>

          <div className="form-group">
            <label>Special Requests (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests or notes for your stylist..."
            />
          </div>

          <div className="checkbox-group">
            <input
              type="checkbox"
              id="consent"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <label htmlFor="consent">
              I agree to receive booking confirmation and reminder emails. I understand the cancellation policy.
            </label>
          </div>

          <div className="button-group">
            <button className="button button-secondary" onClick={() => setCurrentStep(3)}>
              Back
            </button>
            <button 
              className="button" 
              onClick={handleSubmitBooking}
              disabled={!customerName || !customerEmail || !customerPhone || !consent}
            >
              Confirm Booking
            </button>
          </div>
        </div>
      )}

      <div className="footer">
        <div className="status-badge status-connected">
          ✓ Backend API Connected
        </div>
        <p style={{ marginTop: '15px' }}>
          {services.length} services • {staff.length} stylists available
        </p>
        <p style={{ marginTop: '10px', fontSize: '0.85rem' }}>
          67 Bondgate Within, Alnwick, NE66 1HZ
        </p>
      </div>
    </div>
  )
}
