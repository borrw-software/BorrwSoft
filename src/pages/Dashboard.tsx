import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'
import type { Profile } from '../lib/database.types'

interface DashboardProps {
  session: Session
}

export default function Dashboard({ session }: DashboardProps) {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (error) throw error
        setProfile(data)
      } catch (err) {
        console.error('Error loading profile:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [session.user.id])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/signin')
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    )
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="logo">
          <svg className="logo-icon" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="white"/>
            <path d="M8 10h16M8 16h12M8 22h8" stroke="#0a0a0a" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <span className="logo-text">Borrw</span>
        </div>
        <button onClick={handleSignOut} className="btn btn-secondary btn-signout">
          Sign Out
        </button>
      </header>

      <div className="dashboard-content">
        <div className="profile-card">
          <h2>Welcome, {profile?.full_name || 'User'}!</h2>
          <div className="profile-info">
            <div className="profile-row">
              <span className="profile-label">Full Name</span>
              <span className="profile-value">{profile?.full_name || '—'}</span>
            </div>
            <div className="profile-row">
              <span className="profile-label">Email</span>
              <span className="profile-value">{session.user.email}</span>
            </div>
            <div className="profile-row">
              <span className="profile-label">Organisation</span>
              <span className="profile-value">{profile?.organisation_name || '—'}</span>
            </div>
            <div className="profile-row">
              <span className="profile-label">Member Since</span>
              <span className="profile-value">
                {profile?.created_at 
                  ? new Date(profile.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })
                  : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

