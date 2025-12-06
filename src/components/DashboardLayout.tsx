import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Package, 
  Wrench, 
  Calendar, 
  FileText, 
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Profile } from '../lib/database.types'

interface DashboardLayoutProps {
  children: React.ReactNode
  profile: Profile | null
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Assets', href: '/assets', icon: Package },
  { name: 'Maintenance', href: '/maintenance', icon: Wrench, disabled: true },
  { name: 'Bookings', href: '/bookings', icon: Calendar, disabled: true },
  { name: 'Reports', href: '/reports', icon: FileText, disabled: true },
]

export default function DashboardLayout({ children, profile }: DashboardLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  // Close sidebar when pressing Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/signin')
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="dashboard-layout">
      {/* Mobile Overlay */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/dashboard" className="sidebar-brand">
            <div className="sidebar-logo">
              <Package size={20} />
            </div>
            <div>
              <div className="sidebar-title">Borrw</div>
              <div className="sidebar-subtitle">{profile?.organisation_name || 'Workspace'}</div>
            </div>
          </Link>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Menu</div>
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.disabled ? '#' : item.href}
                className={`nav-item ${location.pathname === item.href ? 'active' : ''} ${item.disabled ? 'disabled' : ''}`}
                style={item.disabled ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
              >
                <item.icon />
                {item.name}
              </Link>
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          <Link to="/settings" className="nav-item" style={{ opacity: 0.5, pointerEvents: 'none' }}>
            <Settings />
            Settings
          </Link>
          <button onClick={handleSignOut} className="nav-item">
            <LogOut />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Inject mobile toggle function to children */}
        {typeof children === 'function' 
          ? children({ toggleSidebar: () => setSidebarOpen(prev => !prev) })
          : children
        }
      </main>

      {/* Fixed Mobile Menu Toggle */}
      <button 
        className="mobile-menu-toggle mobile-menu-fixed"
        onClick={() => setSidebarOpen(prev => !prev)}
        aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
    </div>
  )
}



