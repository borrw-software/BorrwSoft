import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import ForgotPassword from './pages/ForgotPassword'
import DashboardHome from './pages/DashboardHome'
import Assets from './pages/Assets'
import type { Session } from '@supabase/supabase-js'
import './styles/dashboard.css'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    )
  }

  return (
    <Routes>
      {/* Auth Routes */}
      <Route 
        path="/signin" 
        element={session ? <Navigate to="/dashboard" replace /> : <SignIn />} 
      />
      <Route 
        path="/signup" 
        element={session ? <Navigate to="/dashboard" replace /> : <SignUp />} 
      />
      <Route 
        path="/forgot-password" 
        element={session ? <Navigate to="/dashboard" replace /> : <ForgotPassword />} 
      />

      {/* Dashboard Routes */}
      <Route 
        path="/dashboard" 
        element={session ? <DashboardHome session={session} /> : <Navigate to="/signin" replace />} 
      />
      <Route 
        path="/assets" 
        element={session ? <Assets session={session} /> : <Navigate to="/signin" replace />} 
      />

      {/* Default Route */}
      <Route 
        path="/" 
        element={<Navigate to={session ? "/dashboard" : "/signin"} replace />} 
      />

      {/* Catch all */}
      <Route 
        path="*" 
        element={<Navigate to={session ? "/dashboard" : "/signin"} replace />} 
      />
    </Routes>
  )
}

export default App
