'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import '../admin.css'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8001/api'

interface Staff {
  id?: number
  name: string
  email: string
  phone: string
  photo_url?: string
  bio: string
  active: boolean
  services?: number[]
}

interface Service {
  id: number
  name: string
}

export default function StaffManagement() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [staffRes, servicesRes] = await Promise.all([
        fetch(`${API_BASE}/staff/`),
        fetch(`${API_BASE}/services/`)
      ])
      const staffData = await staffRes.json()
      const servicesData = await servicesRes.json()
      setStaff(staffData)
      setServices(servicesData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const selectedServices = Array.from(formData.getAll('services')).map(id => parseInt(id as string))
    
    const staffData = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone') || '',
      photo_url: formData.get('photo_url') || '',
      bio: formData.get('bio') || '',
      active: formData.get('active') === 'on',
      service_ids: selectedServices
    }

    try {
      const url = editingStaff 
        ? `${API_BASE}/staff/${editingStaff.id}/`
        : `${API_BASE}/staff/`
      
      const method = editingStaff ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffData)
      })

      if (response.ok) {
        fetchData()
        setShowForm(false)
        setEditingStaff(null)
      }
    } catch (error) {
      console.error('Failed to save staff:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return

    try {
      await fetch(`${API_BASE}/staff/${id}/`, { method: 'DELETE' })
      fetchData()
    } catch (error) {
      console.error('Failed to delete staff:', error)
    }
  }

  const getServiceNames = (serviceIds: number[]) => {
    return serviceIds
      .map(id => services.find(s => s.id === id)?.name)
      .filter(Boolean)
      .join(', ')
  }

  if (loading) {
    return <div className="admin-container"><div className="loading">Loading...</div></div>
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div className="header-content">
          <img src="/logo.png" alt="House of Hair" className="admin-logo" />
          <h1>Staff Management</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/admin" className="view-site-btn">Back to Dashboard</Link>
          <a href="/" className="view-site-btn">View Public Site</a>
        </div>
      </div>

      <div className="admin-content">
        <div className="section-header">
          <h2>Staff Members</h2>
          <button 
            onClick={() => { setShowForm(true); setEditingStaff(null); }}
            className="action-btn"
            style={{ background: '#8B6F47', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
          >
            Add New Staff
          </button>
        </div>

        {showForm && (
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', marginBottom: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <h3>{editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    defaultValue={editingStaff?.name}
                    required
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Email</label>
                    <input 
                      type="email" 
                      name="email" 
                      defaultValue={editingStaff?.email}
                      required
                      style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Phone</label>
                    <input 
                      type="tel" 
                      name="phone" 
                      defaultValue={editingStaff?.phone}
                      style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Photo URL</label>
                  <input 
                    type="url" 
                    name="photo_url" 
                    defaultValue={editingStaff?.photo_url}
                    placeholder="https://example.com/photo.jpg"
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                  />
                  <small style={{ color: '#666', fontSize: '0.85rem' }}>Enter a URL to a staff member photo</small>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Bio</label>
                  <textarea 
                    name="bio" 
                    defaultValue={editingStaff?.bio}
                    rows={3}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500' }}>Services (hold Ctrl/Cmd to select multiple)</label>
                  <select 
                    name="services" 
                    multiple 
                    defaultValue={editingStaff?.services?.map(String) || []}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', minHeight: '120px' }}
                  >
                    {(services || []).map(service => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input 
                      type="checkbox" 
                      name="active" 
                      defaultChecked={editingStaff?.active ?? true}
                    />
                    <span>Active (available for bookings)</span>
                  </label>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" style={{ background: '#8B6F47', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                    {editingStaff ? 'Update Staff' : 'Create Staff'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setShowForm(false); setEditingStaff(null); }}
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
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Services</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => (
                <tr key={member.id}>
                  <td style={{ fontWeight: '500' }}>{member.name}</td>
                  <td>{member.email}</td>
                  <td>{member.phone || '-'}</td>
                  <td>{getServiceNames(member.services || []) || 'None'}</td>
                  <td>
                    <span style={{ 
                      padding: '4px 12px', 
                      borderRadius: '20px', 
                      background: member.active ? '#4CAF50' : '#ccc',
                      color: 'white',
                      fontSize: '0.85em'
                    }}>
                      {member.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={() => { setEditingStaff(member); setShowForm(true); }}
                        className="action-btn"
                        style={{ background: '#8B6F47', color: 'white', padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => member.id && handleDelete(member.id)}
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
