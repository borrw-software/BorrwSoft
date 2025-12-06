import { ShieldOff, LogOut, Mail } from 'lucide-react'
import { supabase } from '../lib/supabase'
import '../styles/global.css'

interface AccessDeniedProps {
  userEmail?: string
}

export default function AccessDenied({ userEmail }: AccessDeniedProps) {
  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{ 
          width: '64px', 
          height: '64px', 
          borderRadius: '50%', 
          backgroundColor: '#f5f5f5', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          margin: '0 auto 24px'
        }}>
          <ShieldOff size={32} color="#000" />
        </div>
        
        <h1 className="auth-title">Access Restricted</h1>
        
        <p className="auth-subtitle" style={{ marginBottom: '24px' }}>
          Your account doesn't have permission to access this application yet.
        </p>

        {userEmail && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '8px',
            padding: '12px 16px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '0.875rem'
          }}>
            <Mail size={16} color="#000" />
            <span style={{ color: '#000' }}>{userEmail}</span>
          </div>
        )}

        <p style={{ 
          fontSize: '0.875rem', 
          color: '#666', 
          marginBottom: '32px',
          lineHeight: '1.6'
        }}>
          Please contact your administrator to request access.
        </p>

        <button 
          className="auth-button"
          onClick={handleSignOut}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '8px',
            width: '100%'
          }}
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  )
}

