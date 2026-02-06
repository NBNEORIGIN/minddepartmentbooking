'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import '../admin.css'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8001/api'

interface Service {
  id: number
  name: string
  description: string
  duration_minutes: number
  price: string
  active: boolean
}

export default function ServicesManagement() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await fetch(`${API_BASE}/services/`)
      const data = await response.json()
      setServices(data)
    } catch (error) {
      console.error('Failed to fetch services:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const serviceData = {
      name: formData.get('name'),
      description: formData.get('description'),
      duration_minutes: parseInt(formData.get('duration_minutes') as string),
      price: formData.get('price'),
      active: formData.get('active') === 'on'
    }

    try {
      const url = editingService 
        ? `${API_BASE}/services/${editingService.id}/`
        : `${API_BASE}/services/`
      
      const method = editingService ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData)
      })

      if (response.ok) {
        fetchServices()
        setShowForm(false)
        setEditingService(null)
      }
    } catch (error) {
      console.error('Failed to save service:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this service?')) return

    try {
      await fetch(`${API_BASE}/services/${id}/`, { method: 'DELETE' })
      fetchServices()
    } catch (error) {
      console.error('Failed to delete service:', error)
    }
  }

  if (loading) {
    return <div className="admin-container"><div className="loading">Loading...</div></div>
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div className="header-content">
          <img src="/logo.png" alt="House of Hair" className="admin-logo" />
          <h1>Services Management</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/admin" className="view-site-btn">Back to Dashboard</Link>
          <a href="/" className="view-site-btn">View Public Site</a>
        </div>
      </div>

      <div className="admin-content">
        <div className="section-header">
          <h2>Services</h2>
          <button 
            onClick={() => { setShowForm(true); setEditingService(null); }}
            className="action-btn"
            style={{ background: '#8B6F47', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
          >
            Add New Service
          </button>
        </div>

        {showForm && (
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', marginBottom: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <h3>{editingService ? 'Edit Service' : 'Add New Service'}</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Service Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    defaultValue={editingService?.name}
                    required
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Description</label>
                  <textarea 
                    name="description" 
                    defaultValue={editingService?.description}
                    rows={3}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Duration (minutes)</label>
                    <input 
                      type="number" 
                      name="duration_minutes" 
                      defaultValue={editingService?.duration_minutes}
                      required
                      style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Price (£)</label>
                    <input 
                      type="number" 
                      name="price" 
                      step="0.01"
                      defaultValue={editingService?.price}
                      required
                      style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input 
                      type="checkbox" 
                      name="active" 
                      defaultChecked={editingService?.active ?? true}
                    />
                    <span>Active (visible on booking site)</span>
                  </label>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" style={{ background: '#8B6F47', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                    {editingService ? 'Update Service' : 'Create Service'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setShowForm(false); setEditingService(null); }}
                    style={{ background: '#ccc', color: '#333', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        <div className="bookings-table">
          <table>
            <thead>
              <tr>
                <th>Service Name</th>
                <th>Description</th>
                <th>Duration</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.id}>
                  <td style={{ fontWeight: '500' }}>{service.name}</td>
                  <td>{service.description}</td>
                  <td>{service.duration_minutes} min</td>
                  <td>£{service.price}</td>
                  <td>
                    <span style={{ 
                      padding: '4px 12px', 
                      borderRadius: '20px', 
                      background: service.active ? '#4CAF50' : '#ccc',
                      color: 'white',
                      fontSize: '0.85em'
                    }}>
                      {service.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={() => { setEditingService(service); setShowForm(true); }}
                        className="action-btn"
                        style={{ background: '#8B6F47', color: 'white', padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(service.id)}
                        style={{ background: '#F44336', color: 'white', padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
