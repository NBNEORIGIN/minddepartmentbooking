'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import '../admin.css'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8001/api'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

interface BusinessHours {
  id?: number
  day_of_week: number
  is_open: boolean
  open_time: string
  close_time: string
}

interface StaffSchedule {
  id?: number
  staff: number
  staff_name?: string
  day_of_week: number
  is_working: boolean
  start_time: string
  end_time: string
}

interface Staff {
  id: number
  name: string
}

interface Closure {
  id?: number
  date: string
  reason: string
  all_day: boolean
  start_time?: string
  end_time?: string
}

export default function ScheduleManagement() {
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([])
  const [staffSchedules, setStaffSchedules] = useState<StaffSchedule[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [closures, setClosures] = useState<Closure[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStaff, setSelectedStaff] = useState<number | null>(null)
  const [showClosureForm, setShowClosureForm] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      console.log('Fetching data from:', API_BASE)
      
      const [staffRes, closuresRes, businessHoursRes] = await Promise.all([
        fetch(`${API_BASE}/staff/`),
        fetch(`${API_BASE}/closures/`).catch(() => ({ ok: false, json: async () => [] })),
        fetch(`${API_BASE}/business-hours/`).catch(() => ({ ok: false, json: async () => [] }))
      ])
      
      console.log('Staff response status:', staffRes.status)
      
      const staffData = await staffRes.json()
      const closuresData = await closuresRes.json()
      const businessHoursData = await businessHoursRes.json()
      
      console.log('Staff data:', staffData)
      console.log('Business hours data:', businessHoursData)
      
      setStaff(Array.isArray(staffData) ? staffData : [])
      setClosures(Array.isArray(closuresData) ? closuresData : [])
      
      // Initialize business hours from API or create defaults
      if (businessHoursData && businessHoursData.length > 0) {
        setBusinessHours(businessHoursData)
      } else {
        initializeBusinessHours()
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      initializeBusinessHours()
    } finally {
      setLoading(false)
    }
  }

  const initializeBusinessHours = () => {
    const defaultHours: BusinessHours[] = DAYS.map((_, index) => ({
      day_of_week: index,
      is_open: index < 6, // Mon-Sat open by default
      open_time: '09:00',
      close_time: '17:00'
    }))
    setBusinessHours(defaultHours)
  }

  const handleBusinessHoursChange = (dayIndex: number, field: string, value: any) => {
    setBusinessHours(prev => prev.map(h => 
      h.day_of_week === dayIndex ? { ...h, [field]: value } : h
    ))
  }

  const saveBusinessHours = async () => {
    try {
      console.log('Saving business hours:', businessHours)
      
      for (const hours of businessHours) {
        const method = hours.id ? 'PUT' : 'POST'
        const url = hours.id 
          ? `${API_BASE}/business-hours/${hours.id}/`
          : `${API_BASE}/business-hours/`
        
        console.log(`${method} ${url}`, hours)
        
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(hours)
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('Save failed:', response.status, errorText)
          throw new Error(`Failed to save: ${response.status}`)
        }
        
        const savedData = await response.json()
        console.log('Saved:', savedData)
      }
      
      alert('Business hours saved successfully!')
      // Refetch to get updated data with IDs
      await fetchData()
    } catch (error) {
      console.error('Failed to save business hours:', error)
      alert('Failed to save business hours: ' + error)
    }
  }

  const loadStaffSchedule = async (staffId: number) => {
    try {
      const response = await fetch(`${API_BASE}/staff-schedules/?staff=${staffId}`)
      const data = await response.json()
      
      if (data.length === 0) {
        // Initialize default schedule for staff
        const defaultSchedule: StaffSchedule[] = DAYS.map((_, index) => ({
          staff: staffId,
          day_of_week: index,
          is_working: index < 6,
          start_time: '09:00',
          end_time: '17:00'
        }))
        setStaffSchedules(defaultSchedule)
      } else {
        setStaffSchedules(data)
      }
    } catch (error) {
      console.error('Failed to load staff schedule:', error)
    }
  }

  const handleStaffScheduleChange = (dayIndex: number, field: string, value: any) => {
    setStaffSchedules(prev => prev.map(s => 
      s.day_of_week === dayIndex ? { ...s, [field]: value } : s
    ))
  }

  const saveStaffSchedule = async () => {
    if (!selectedStaff) return
    
    try {
      for (const schedule of staffSchedules) {
        const method = schedule.id ? 'PUT' : 'POST'
        const url = schedule.id 
          ? `${API_BASE}/staff-schedules/${schedule.id}/`
          : `${API_BASE}/staff-schedules/`
        
        await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...schedule, staff: selectedStaff })
        })
      }
      alert('Staff schedule saved successfully!')
    } catch (error) {
      console.error('Failed to save staff schedule:', error)
      alert('Failed to save staff schedule')
    }
  }

  const handleClosureSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const closureData = {
      date: formData.get('date'),
      reason: formData.get('reason'),
      all_day: formData.get('all_day') === 'on',
      start_time: formData.get('all_day') === 'on' ? null : formData.get('start_time'),
      end_time: formData.get('all_day') === 'on' ? null : formData.get('end_time')
    }

    try {
      await fetch(`${API_BASE}/closures/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(closureData)
      })
      
      fetchData()
      setShowClosureForm(false)
    } catch (error) {
      console.error('Failed to add closure:', error)
      alert('Failed to add closure')
    }
  }

  const deleteClosure = async (id: number) => {
    if (!confirm('Delete this closure?')) return
    
    try {
      await fetch(`${API_BASE}/closures/${id}/`, { method: 'DELETE' })
      fetchData()
    } catch (error) {
      console.error('Failed to delete closure:', error)
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
          <h1>Opening Hours & Schedules</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/admin" className="view-site-btn">Back to Dashboard</Link>
          <a href="/" className="view-site-btn">View Public Site</a>
        </div>
      </div>

      <div className="admin-content">
        {/* Business Hours */}
        <div style={{ background: 'white', padding: '30px', borderRadius: '12px', marginBottom: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h2 style={{ marginTop: 0 }}>Business Opening Hours</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>Set your salon's opening hours for each day of the week.</p>
          
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Day</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Open</th>
                <th style={{ padding: '12px' }}>Opening Time</th>
                <th style={{ padding: '12px' }}>Closing Time</th>
              </tr>
            </thead>
            <tbody>
              {businessHours.map((hours, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px', fontWeight: '500' }}>{DAYS[index]}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={hours.is_open}
                      onChange={(e) => handleBusinessHoursChange(index, 'is_open', e.target.checked)}
                    />
                  </td>
                  <td style={{ padding: '12px' }}>
                    <input 
                      type="time" 
                      value={hours.open_time}
                      onChange={(e) => handleBusinessHoursChange(index, 'open_time', e.target.value)}
                      disabled={!hours.is_open}
                      style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }}
                    />
                  </td>
                  <td style={{ padding: '12px' }}>
                    <input 
                      type="time" 
                      value={hours.close_time}
                      onChange={(e) => handleBusinessHoursChange(index, 'close_time', e.target.value)}
                      disabled={!hours.is_open}
                      style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <button 
            onClick={saveBusinessHours}
            style={{ marginTop: '20px', background: '#8B6F47', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '500' }}
          >
            Save Business Hours
          </button>
        </div>

        {/* Staff Schedules */}
        <div style={{ background: 'white', padding: '30px', borderRadius: '12px', marginBottom: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h2 style={{ marginTop: 0 }}>Staff Working Hours</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>Set individual working hours for each staff member.</p>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Select Staff Member:</label>
            <select 
              value={selectedStaff || ''}
              onChange={(e) => {
                const staffId = parseInt(e.target.value)
                setSelectedStaff(staffId)
                loadStaffSchedule(staffId)
              }}
              style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '8px', width: '300px' }}
            >
              <option value="">Choose a staff member...</option>
              {staff.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {selectedStaff && staffSchedules.length > 0 && (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ddd' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Day</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Working</th>
                    <th style={{ padding: '12px' }}>Start Time</th>
                    <th style={{ padding: '12px' }}>End Time</th>
                  </tr>
                </thead>
                <tbody>
                  {staffSchedules.map((schedule, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px', fontWeight: '500' }}>{DAYS[schedule.day_of_week]}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={schedule.is_working}
                          onChange={(e) => handleStaffScheduleChange(schedule.day_of_week, 'is_working', e.target.checked)}
                        />
                      </td>
                      <td style={{ padding: '12px' }}>
                        <input 
                          type="time" 
                          value={schedule.start_time}
                          onChange={(e) => handleStaffScheduleChange(schedule.day_of_week, 'start_time', e.target.value)}
                          disabled={!schedule.is_working}
                          style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }}
                        />
                      </td>
                      <td style={{ padding: '12px' }}>
                        <input 
                          type="time" 
                          value={schedule.end_time}
                          onChange={(e) => handleStaffScheduleChange(schedule.day_of_week, 'end_time', e.target.value)}
                          disabled={!schedule.is_working}
                          style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <button 
                onClick={saveStaffSchedule}
                style={{ marginTop: '20px', background: '#8B6F47', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '500' }}
              >
                Save Staff Schedule
              </button>
            </>
          )}
        </div>

        {/* Closures */}
        <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ margin: 0 }}>Business Closures</h2>
              <p style={{ color: '#666', margin: '5px 0 0 0' }}>Add holidays, special closures, or blocked dates.</p>
            </div>
            <button 
              onClick={() => setShowClosureForm(true)}
              style={{ background: '#8B6F47', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '500' }}
            >
              Add Closure
            </button>
          </div>

          {showClosureForm && (
            <form onSubmit={handleClosureSubmit} style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
              <div style={{ display: 'grid', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Date</label>
                  <input 
                    type="date" 
                    name="date" 
                    required
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Reason</label>
                  <input 
                    type="text" 
                    name="reason" 
                    placeholder="e.g., Christmas Day, Staff Training"
                    required
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input type="checkbox" name="all_day" defaultChecked />
                    <span>All Day Closure</span>
                  </label>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" style={{ background: '#8B6F47', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                    Add Closure
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowClosureForm(false)}
                    style={{ background: '#ccc', color: '#333', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}

          {closures.length === 0 ? (
            <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>No closures scheduled</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Reason</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Type</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {closures.map(closure => (
                  <tr key={closure.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>{new Date(closure.date).toLocaleDateString()}</td>
                    <td style={{ padding: '12px' }}>{closure.reason}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {closure.all_day ? 'All Day' : `${closure.start_time} - ${closure.end_time}`}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button 
                        onClick={() => deleteClosure(closure.id!)}
                        style={{ background: '#F44336', color: 'white', padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
