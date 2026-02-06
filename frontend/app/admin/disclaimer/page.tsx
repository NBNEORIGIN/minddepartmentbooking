'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import '../admin.css'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8001/api'

interface Disclaimer {
  id: number
  version: string
  content: string
  active: boolean
  created_at: string
}

interface IntakeProfile {
  id: number
  full_name: string
  email: string
  completed_date: string
  expires_at: string
  is_expired: boolean
}

export default function DisclaimerManagement() {
  const [disclaimer, setDisclaimer] = useState<Disclaimer | null>(null)
  const [profiles, setProfiles] = useState<IntakeProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [newVersion, setNewVersion] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [disclaimerRes, profilesRes] = await Promise.all([
        fetch(`${API_BASE}/intake-disclaimer/active/`),
        fetch(`${API_BASE}/intake-profiles/`)
      ])
      
      if (disclaimerRes.ok) {
        const disclaimerData = await disclaimerRes.json()
        setDisclaimer(disclaimerData)
        setNewContent(disclaimerData.content)
        setNewVersion(disclaimerData.version)
      }
      
      if (profilesRes.ok) {
        const profilesData = await profilesRes.json()
        setProfiles(profilesData)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDisclaimer = async () => {
    try {
      const response = await fetch(`${API_BASE}/intake-disclaimer/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: newVersion,
          content: newContent,
          active: true
        })
      })

      if (response.ok) {
        alert('Disclaimer updated successfully!')
        setEditing(false)
        fetchData()
      } else {
        alert('Failed to update disclaimer')
      }
    } catch (error) {
      alert('Error updating disclaimer')
    }
  }

  const handleExpireAll = async () => {
    if (!confirm('This will expire ALL client intake forms and require them to complete the form again on their next booking. Are you sure?')) {
      return
    }

    try {
      const response = await fetch(`${API_BASE}/intake-profiles/expire-all/`, {
        method: 'POST'
      })

      if (response.ok) {
        alert('All intake forms have been expired. Clients will need to renew on their next booking.')
        fetchData()
      } else {
        alert('Failed to expire forms')
      }
    } catch (error) {
      alert('Error expiring forms')
    }
  }

  const handleExpireOne = async (profileId: number, clientName: string) => {
    if (!confirm(`Expire intake form for ${clientName}? They will need to complete it again on their next booking.`)) {
      return
    }

    try {
      const response = await fetch(`${API_BASE}/intake-profiles/${profileId}/expire/`, {
        method: 'POST'
      })

      if (response.ok) {
        alert(`Intake form expired for ${clientName}`)
        fetchData()
      } else {
        alert('Failed to expire form')
      }
    } catch (error) {
      alert('Error expiring form')
    }
  }

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  const expiredProfiles = profiles.filter(p => p.is_expired)
  const activeProfiles = profiles.filter(p => !p.is_expired)

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div className="header-content">
          <img src="/mind-department-logo.png" alt="The Mind Department" className="admin-logo" />
          <h1>Disclaimer & Intake Management</h1>
        </div>
        <Link href="/admin" className="view-site-btn">Back to Dashboard</Link>
      </div>

      <div className="admin-content">
        {/* Disclaimer Section */}
        <div className="section-card" style={{ marginBottom: '30px' }}>
          <h2>Disclaimer Content</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            This disclaimer is shown to clients when they complete the intake form.
          </p>

          {!editing ? (
            <>
              <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                <strong>Version:</strong> {disclaimer?.version}<br />
                <strong>Raw HTML:</strong><br />
                <div style={{ marginTop: '10px', whiteSpace: 'pre-wrap', fontSize: '0.9em', color: '#666' }}>{disclaimer?.content}</div>
              </div>
              
              <div style={{ background: 'white', padding: '30px', borderRadius: '8px', marginBottom: '20px', border: '2px solid #8B6F47' }}>
                <h3 style={{ marginTop: 0, color: '#8B6F47' }}>Customer Preview</h3>
                <p style={{ color: '#666', fontSize: '0.9em', marginBottom: '20px' }}>This is how customers will see the disclaimer on the intake form:</p>
                <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', background: '#fafafa' }}>
                  <div dangerouslySetInnerHTML={{ __html: disclaimer?.content || '' }} />
                </div>
              </div>
              
              <button 
                onClick={() => setEditing(true)}
                style={{ background: '#8B6F47', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
              >
                Edit Disclaimer
              </button>
            </>
          ) : (
            <>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Version</label>
                <input
                  type="text"
                  value={newVersion}
                  onChange={(e) => setNewVersion(e.target.value)}
                  placeholder="e.g., 2.0"
                  style={{ width: '200px', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Content</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={6}
                  style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ddd', fontFamily: 'inherit' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={handleSaveDisclaimer}
                  style={{ background: '#4CAF50', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                >
                  Save Changes
                </button>
                <button 
                  onClick={() => {
                    setEditing(false)
                    setNewContent(disclaimer?.content || '')
                    setNewVersion(disclaimer?.version || '')
                  }}
                  style={{ background: '#999', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>

        {/* Renewal Management */}
        <div className="section-card" style={{ marginBottom: '30px' }}>
          <h2>Form Renewal Management</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Intake forms automatically expire after 1 year. You can also manually expire forms to require clients to renew.
          </p>
          
          <button 
            onClick={handleExpireAll}
            style={{ background: '#FF9800', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '500' }}
          >
            Expire All Forms (Trigger Renewal for Everyone)
          </button>
        </div>

        {/* Expired Forms */}
        {expiredProfiles.length > 0 && (
          <div className="section-card" style={{ marginBottom: '30px' }}>
            <h2 style={{ color: '#F44336' }}>Expired Forms ({expiredProfiles.length})</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              These clients need to renew their intake form before their next booking.
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Client</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Expired On</th>
                </tr>
              </thead>
              <tbody>
                {expiredProfiles.map(profile => (
                  <tr key={profile.id}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{profile.full_name}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{profile.email}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                      {new Date(profile.expires_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Active Forms */}
        <div className="section-card">
          <h2 style={{ color: '#4CAF50' }}>Active Forms ({activeProfiles.length})</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            These clients have valid intake forms.
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Client</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Email</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Completed</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Expires</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeProfiles.map(profile => (
                <tr key={profile.id}>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{profile.full_name}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{profile.email}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                    {new Date(profile.completed_date).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                    {new Date(profile.expires_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                    <button
                      onClick={() => handleExpireOne(profile.id, profile.full_name)}
                      style={{ background: '#FF9800', color: 'white', padding: '6px 12px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '0.9em' }}
                    >
                      Expire Now
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-footer">
        <p>The Mind Department</p>
      </div>
    </div>
  )
}
