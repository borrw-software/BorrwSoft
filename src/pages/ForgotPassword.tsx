import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="auth-layout">
        <div className="auth-card">
          <div className="logo">
            <svg className="logo-icon" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="white"/>
              <path d="M8 10h16M8 16h12M8 22h8" stroke="#0a0a0a" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <span className="logo-text">Borrw</span>
          </div>

          <div className="auth-header">
            <h1 className="auth-title">Check your email</h1>
            <p className="auth-subtitle">
              We've sent a password reset link to <strong>{email}</strong>.
            </p>
          </div>

          <div className="auth-footer">
            <Link to="/signin">Back to Sign In</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="logo">
          <svg className="logo-icon" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="white"/>
            <path d="M8 10h16M8 16h12M8 22h8" stroke="#0a0a0a" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <span className="logo-text">Borrw</span>
        </div>

        <div className="auth-header">
          <h1 className="auth-title">Reset password</h1>
          <p className="auth-subtitle">Enter your email and we'll send you a reset link.</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <button 
            type="submit" 
            className={`btn btn-primary ${loading ? 'btn-loading' : ''}`}
            disabled={loading}
            style={{ marginTop: '8px' }}
          >
            Send Reset Link
          </button>
        </form>

        <div className="auth-footer">
          Remember your password? <Link to="/signin">Sign in</Link>
        </div>
      </div>
    </div>
  )
}

