'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'
import '../admin.css'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8001/api'

interface Client {
  id: number
  name: string
  email: string
  phone: string
  total_bookings: number
  total_spent: string
  last_booking_date: string | null
  marketing_consent: boolean
  created_at: string
}

export default function ClientsManagement() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const response = await fetch(`${API_BASE}/clients/`)
      const data = await response.json()
      setClients(data)
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  )

  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Total Bookings', 'Total Spent', 'Last Booking', 'Marketing Consent', 'Joined']
    const rows = filteredClients.map(c => [
      c.id,
      c.name,
      c.email,
      c.phone,
      c.total_bookings,
      `£${c.total_spent}`,
      c.last_booking_date ? format(new Date(c.last_booking_date), 'MMM d, yyyy') : 'Never',
      c.marketing_consent ? 'Yes' : 'No',
      format(new Date(c.created_at), 'MMM d, yyyy')
    ])
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clients-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const exportMarketingList = () => {
    const marketingClients = filteredClients.filter(c => c.marketing_consent)
    const headers = ['Name', 'Email', 'Phone', 'Last Booking', 'Total Bookings']
    const rows = marketingClients.map(c => [
      c.name,
      c.email,
      c.phone,
      c.last_booking_date ? format(new Date(c.last_booking_date), 'MMM d, yyyy') : 'Never',
      c.total_bookings
    ])
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `marketing-list-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return <div className="admin-container"><div className="loading">Loading...</div></div>
  }

  const marketingConsentCount = clients.filter(c => c.marketing_consent).length

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div className="header-content">
          <img src="/logo.png" alt="House of Hair" className="admin-logo" />
          <h1>Client Database</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/admin" className="view-site-btn">Back to Dashboard</Link>
          <a href="/" className="view-site-btn">View Public Site</a>
        </div>
      </div>

      <div className="admin-content">
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div className="stat-card">
            <div className="stat-number">{clients.length}</div>
            <div className="stat-label">Total Clients</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{marketingConsentCount}</div>
            <div className="stat-label">Marketing Consent</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              £{clients.reduce((sum, c) => sum + parseFloat(c.total_spent || '0'), 0).toFixed(2)}
            </div>
            <div className="stat-label">Total Revenue</div>
          </div>
        </div>

        <div className="section-header" style={{ marginTop: '40px' }}>
          <h2>Client List</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={exportMarketingList}
              style={{ background: '#FF9800', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '500' }}
            >
              Export Marketing List
            </button>
            <button 
              onClick={exportToCSV}
              style={{ background: '#4CAF50', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '500' }}
            >
              Export All Clients
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Search clients by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            style={{ width: '100%', maxWidth: '500px' }}
          />
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <p style={{ margin: 0, color: '#666', fontSize: '0.9em' }}>
            <strong>GDPR Notice:</strong> Only clients who have given marketing consent can be contacted for promotional purposes. 
            Use "Export Marketing List" to get only clients who have opted in. All client data must be handled in accordance with GDPR regulations.
          </p>
        </div>

        <div className="bookings-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Bookings</th>
                <th>Total Spent</th>
                <th>Last Booking</th>
                <th>Marketing</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
                    No clients found
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id}>
                    <td style={{ fontWeight: '500' }}>{client.name}</td>
                    <td>{client.email}</td>
                    <td>{client.phone}</td>
                    <td>{client.total_bookings}</td>
                    <td>£{client.total_spent}</td>
                    <td>
                      {client.last_booking_date 
                        ? format(new Date(client.last_booking_date), 'MMM d, yyyy')
                        : 'Never'
                      }
                    </td>
                    <td>
                      <span style={{ 
                        padding: '4px 12px', 
                        borderRadius: '20px', 
                        background: client.marketing_consent ? '#4CAF50' : '#ccc',
                        color: 'white',
                        fontSize: '0.85em'
                      }}>
                        {client.marketing_consent ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td>{format(new Date(client.created_at), 'MMM d, yyyy')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
