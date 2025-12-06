import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import ForgotPassword from './pages/ForgotPassword'
import DashboardHome from './pages/DashboardHome'
import Assets from './pages/Assets'
import UserAssetsView from './pages/UserAssetsView'
import type { Session } from '@supabase/supabase-js'
import type { UserRole } from './lib/database.types'
import './styles/dashboard.css'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        fetchUserRole(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        fetchUserRole(session.user.id)
      } else {
        setUserRole(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchUserRole(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (error) throw error
      setUserRole(data?.role || 'user')
    } catch (err) {
      console.error('Error fetching user role:', err)
      setUserRole('user')
    } finally {
      setLoading(false)
    }
  }

  const isAdmin = userRole === 'admin'

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    )
  }

  // Helper to render admin-only routes
  const renderAdminRoute = (component: React.ReactNode) => {
    if (!session) return <Navigate to="/signin" replace />
    if (!isAdmin) return <Navigate to="/browse" replace />
    return component
  }

  // Helper to render user-only routes (redirect admins to dashboard)
  const renderUserRoute = (component: React.ReactNode) => {
    if (!session) return <Navigate to="/signin" replace />
    if (isAdmin) return <Navigate to="/dashboard" replace />
    return component
  }

  // Determine default route based on role
  const getDefaultRoute = () => {
    if (!session) return "/signin"
    return isAdmin ? "/dashboard" : "/browse"
  }

  return (
    <Routes>
      {/* Auth Routes */}
      <Route 
        path="/signin" 
        element={session ? <Navigate to={getDefaultRoute()} replace /> : <SignIn />} 
      />
      <Route 
        path="/signup" 
        element={session ? <Navigate to={getDefaultRoute()} replace /> : <SignUp />} 
      />
      <Route 
        path="/forgot-password" 
        element={session ? <Navigate to={getDefaultRoute()} replace /> : <ForgotPassword />} 
      />

      {/* User Assets Browse - For regular users ONLY */}
      <Route 
        path="/browse" 
        element={renderUserRoute(<UserAssetsView session={session!} />)} 
      />

      {/* Dashboard Routes - Admin Only */}
      <Route 
        path="/dashboard" 
        element={renderAdminRoute(<DashboardHome session={session!} />)} 
      />
      <Route 
        path="/assets" 
        element={renderAdminRoute(<Assets session={session!} />)} 
      />

      {/* Default Route */}
      <Route 
        path="/" 
        element={<Navigate to={getDefaultRoute()} replace />} 
      />

      {/* Catch all */}
      <Route 
        path="*" 
        element={<Navigate to={getDefaultRoute()} replace />} 
      />
    </Routes>
  )
}

export default App
