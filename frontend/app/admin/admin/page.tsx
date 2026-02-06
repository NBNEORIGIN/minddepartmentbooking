'use client'
// The Mind Department Admin Dashboard
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'
import './admin.css'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8001/api'

interface Booking {
  id: number
  client_name: string
  client_email: string
  client_phone: string
  service_name: string
  staff_name: string
  start_time: string
  end_time: string
  status: string
  price: number
  notes: string
  created_at: string
}

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      const response = await fetch(`${API_BASE}/bookings/`)
      const data = await response.json()
      setBookings(data)
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredBookings = bookings.filter(booking => {
    const matchesFilter = filter === 'all' || booking.status === filter
    const matchesSearch = 
      booking.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.client_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.service_name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#4CAF50'
      case 'pending': return '#FF9800'
      case 'cancelled': return '#F44336'
      case 'completed': return '#2196F3'
      default: return '#9E9E9E'
    }
  }

  const exportToCSV = () => {
    const headers = ['ID', 'Client Name', 'Email', 'Phone', 'Service', 'Staff', 'Date', 'Time', 'Status', 'Price', 'Notes']
    const rows = filteredBookings.map(b => [
      b.id,
      b.client_name,
      b.client_email,
      b.client_phone,
      b.service_name,
      b.staff_name,
      format(new Date(b.start_time), 'MMM d, yyyy'),
      format(new Date(b.start_time), 'h:mm a'),
      b.status,
      `£${b.price}`,
      b.notes || ''
    ])
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bookings-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading">Loading bookings...</div>
      </div>
    )
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div className="header-content">
          <img src="/mind-department-logo.png" alt="The Mind Department" className="admin-logo" />
          <h1>The Mind Department Management</h1>
        </div>
        <a href="/" className="view-site-btn">View Public Site</a>
      </div>

      <div className="admin-content">
        <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', flexWrap: 'wrap' }}>
          <Link href="/admin/services" style={{ background: '#8B6F47', color: 'white', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: '500' }}>
            Manage Services
          </Link>
          <Link href="/admin/staff" style={{ background: '#8B6F47', color: 'white', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: '500' }}>
            Manage Staff
          </Link>
          <Link href="/admin/schedules" style={{ background: '#8B6F47', color: 'white', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: '500' }}>
            Opening Hours & Schedules
          </Link>
          <Link href="/admin/clients" style={{ background: '#8B6F47', color: 'white', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: '500' }}>
            Client Database
          </Link>
          <button 
            onClick={exportToCSV}
            style={{ background: '#4CAF50', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '500' }}
          >
            Export to CSV
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{bookings.length}</div>
            <div className="stat-label">Total Bookings</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {bookings.filter(b => b.status === 'confirmed').length}
            </div>
            <div className="stat-label">Confirmed</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {bookings.filter(b => b.status === 'pending').length}
            </div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              £{bookings.reduce((sum, b) => sum + (b.price || 0), 0).toFixed(2)}
            </div>
            <div className="stat-label">Total Revenue</div>
          </div>
        </div>

        <div className="bookings-section">
          <div className="section-header">
            <h2>Bookings</h2>
            <div className="controls">
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="bookings-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Client</th>
                  <th>Service</th>
                  <th>Staff</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
                      No bookings found
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td>#{booking.id}</td>
                      <td>
                        <div className="client-info">
                          <div className="client-name">{booking.client_name}</div>
                          <div className="client-email">{booking.client_email}</div>
                          <div className="client-phone">{booking.client_phone}</div>
                        </div>
                      </td>
                      <td>{booking.service_name}</td>
                      <td>{booking.staff_name}</td>
                      <td>
                        <div className="datetime-info">
                          <div>{format(new Date(booking.start_time), 'MMM d, yyyy')}</div>
                          <div className="time">{format(new Date(booking.start_time), 'h:mm a')}</div>
                        </div>
                      </td>
                      <td>
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(booking.status) }}
                        >
                          {booking.status}
                        </span>
                      </td>
                      <td>£{booking.price}</td>
                      <td>
                        <button 
                          className="action-btn"
                          onClick={() => setViewingBooking(booking)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="admin-footer">
        <p>The Mind Department</p>
      </div>

      {viewingBooking && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '40px', borderRadius: '12px', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
            <h2 style={{ marginTop: 0, color: '#8B6F47' }}>Booking Details</h2>
            <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
              <div>
                <strong>Booking ID:</strong> #{viewingBooking.id}
              </div>
              <div>
                <strong>Client Name:</strong> {viewingBooking.client_name}
              </div>
              <div>
                <strong>Email:</strong> {viewingBooking.client_email}
              </div>
              <div>
                <strong>Phone:</strong> {viewingBooking.client_phone}
              </div>
              <div>
                <strong>Service:</strong> {viewingBooking.service_name}
              </div>
              <div>
                <strong>Staff Member:</strong> {viewingBooking.staff_name}
              </div>
              <div>
                <strong>Date:</strong> {format(new Date(viewingBooking.start_time), 'EEEE, MMMM d, yyyy')}
              </div>
              <div>
                <strong>Time:</strong> {format(new Date(viewingBooking.start_time), 'h:mm a')} - {format(new Date(viewingBooking.end_time), 'h:mm a')}
              </div>
              <div>
                <strong>Status:</strong> <span style={{ 
                  padding: '4px 12px', 
                  borderRadius: '20px', 
                  background: getStatusColor(viewingBooking.status),
                  color: 'white',
                  fontSize: '0.85em'
                }}>
                  {viewingBooking.status}
                </span>
              </div>
              <div>
                <strong>Price:</strong> £{viewingBooking.price}
              </div>
              {viewingBooking.notes && (
                <div>
                  <strong>Notes:</strong> {viewingBooking.notes}
                </div>
              )}
              <div>
                <strong>Created:</strong> {format(new Date(viewingBooking.created_at), 'MMM d, yyyy h:mm a')}
              </div>
            </div>
            <button 
              onClick={() => setViewingBooking(null)}
              style={{ marginTop: '30px', background: '#8B6F47', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', width: '100%' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
