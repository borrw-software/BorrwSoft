import { useState, useEffect, useRef } from 'react'
import { Search, Package, LogOut, Filter, MapPin, ScanLine } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Asset, Profile } from '../lib/database.types'
import { STATUS_LABELS, CATEGORY_LABELS, CONDITION_LABELS } from '../lib/database.types'
import type { Session } from '@supabase/supabase-js'
import ScannerModal from '../components/ScannerModal'
import '../styles/dashboard.css'

interface UserAssetsViewProps {
  session: Session
}

export default function UserAssetsView({ session }: UserAssetsViewProps) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showScanner, setShowScanner] = useState(false)
  const [scanResult, setScanResult] = useState<string | null>(null)
  const highlightedCardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadData()
  }, [session.user.id])

  async function loadData() {
    try {
      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      setProfile(profileData)

      // Load all assets (read-only view)
      if (profileData?.organisation_id) {
        const { data: assetsData, error } = await supabase
          .from('assets')
          .select('*')
          .eq('organisation_id', profileData.organisation_id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setAssets(assetsData || [])
      }
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const handleScanSuccess = (scannedText: string) => {
    setShowScanner(false)
    setScanResult(scannedText)
    
    // Set the search query to the scanned text
    setSearchQuery(scannedText)
    
    // Clear filters to show all matching results
    setStatusFilter('all')
    setCategoryFilter('all')

    // Scroll to results after a short delay
    setTimeout(() => {
      if (highlightedCardRef.current) {
        highlightedCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 300)

    // Clear the highlight after 5 seconds
    setTimeout(() => {
      setScanResult(null)
    }, 5000)
  }

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = 
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.asset_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.location?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || asset.category === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })

  // Group assets by status for quick stats
  const stats = {
    total: assets.length,
    available: assets.filter(a => a.status === 'available').length,
    borrowed: assets.filter(a => a.status === 'borrowed').length,
  }

  if (loading) {
    return (
      <div className="user-assets-layout">
        <div className="loading-container">
          <div className="loading-spinner" />
        </div>
      </div>
    )
  }

  return (
    <div className="user-assets-layout">
      {/* Header */}
      <header className="user-assets-header">
        <div className="user-assets-header-left">
          <div className="user-assets-logo">
            <Package size={20} />
          </div>
          <div>
            <h1 className="user-assets-title">Borrw</h1>
            <p className="user-assets-org">{profile?.organisation_name || 'Assets'}</p>
          </div>
        </div>
        <div className="user-assets-header-right">
          <button 
            className="scan-button"
            onClick={() => setShowScanner(true)}
          >
            <ScanLine size={20} />
            <span className="scan-button-text">Scan</span>
          </button>
          <div className="user-assets-user-info">
            <span className="user-assets-user-name">{profile?.full_name}</span>
            <span className="user-assets-user-email">{session.user.email}</span>
          </div>
          <button onClick={handleSignOut} className="btn btn-ghost" title="Sign Out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="user-assets-main">
        {/* Welcome Section */}
        <div className="user-assets-welcome">
          <h2>Welcome, {profile?.full_name?.split(' ')[0]}!</h2>
          <p>Browse available assets in your organisation</p>
        </div>

        {/* Quick Stats */}
        <div className="user-assets-stats">
          <div className="user-stat-card">
            <div className="user-stat-value">{stats.total}</div>
            <div className="user-stat-label">Total Assets</div>
          </div>
          <div className="user-stat-card available">
            <div className="user-stat-value">{stats.available}</div>
            <div className="user-stat-label">Available</div>
          </div>
          <div className="user-stat-card borrowed">
            <div className="user-stat-value">{stats.borrowed}</div>
            <div className="user-stat-label">Borrowed</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="user-assets-filters">
          <div className="user-assets-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="user-assets-filter-group">
            <Filter size={16} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="borrowed">Borrowed</option>
              <option value="in_maintenance">In Maintenance</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="equipment">Equipment</option>
              <option value="car">Car</option>
              <option value="electronics">Electronics</option>
            </select>
          </div>
        </div>

        {/* Scan Result Banner */}
        {scanResult && filteredAssets.length > 0 && (
          <div className="scan-result-banner">
            <ScanLine size={18} />
            <span>Found {filteredAssets.length} asset{filteredAssets.length !== 1 ? 's' : ''} matching "{scanResult}"</span>
          </div>
        )}

        {/* Assets Grid */}
        {filteredAssets.length === 0 ? (
          <div className="user-assets-empty">
            <Package size={48} />
            <h3>No assets found</h3>
            <p>
              {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No assets are available in your organisation yet'}
            </p>
          </div>
        ) : (
          <div className="user-assets-grid">
            {filteredAssets.map((asset, index) => {
              const isHighlighted = scanResult && (
                asset.asset_id.toLowerCase().includes(scanResult.toLowerCase()) ||
                asset.serial_number?.toLowerCase().includes(scanResult.toLowerCase())
              )
              return (
              <div 
                key={asset.id} 
                className={`user-asset-card ${isHighlighted ? 'highlighted' : ''}`}
                ref={isHighlighted && index === 0 ? highlightedCardRef : null}
              >
                {/* Asset Image */}
                <div className="user-asset-image">
                  {asset.image_url ? (
                    <img src={asset.image_url} alt={asset.name} />
                  ) : (
                    <div className="user-asset-image-placeholder">
                      <Package size={32} />
                    </div>
                  )}
                  <span className={`user-asset-status-badge ${asset.status}`}>
                    {STATUS_LABELS[asset.status]}
                  </span>
                </div>

                {/* Asset Info */}
                <div className="user-asset-info">
                  <div className="user-asset-header">
                    <h3 className="user-asset-name">{asset.name}</h3>
                    <span className={`badge badge-${asset.category}`}>
                      {CATEGORY_LABELS[asset.category]}
                    </span>
                  </div>

                  <p className="user-asset-id">ID: {asset.asset_id}</p>

                  {(asset.brand || asset.model_name) && (
                    <p className="user-asset-model">
                      {[asset.brand, asset.model_name].filter(Boolean).join(' ')}
                      {asset.model_year && ` (${asset.model_year})`}
                    </p>
                  )}

                  <div className="user-asset-meta">
                    {asset.location && (
                      <span className="user-asset-meta-item">
                        <MapPin size={14} />
                        {asset.location}
                      </span>
                    )}
                    {asset.condition && (
                      <span className={`user-asset-condition ${asset.condition}`}>
                        {CONDITION_LABELS[asset.condition]}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="user-assets-footer">
        <p>Contact your administrator to borrow or request assets</p>
      </footer>

      {/* Floating Scan Button (Mobile) */}
      <button 
        className="floating-scan-button"
        onClick={() => setShowScanner(true)}
        title="Scan Asset"
      >
        <ScanLine size={24} />
      </button>

      {/* Scanner Modal */}
      {showScanner && (
        <ScannerModal
          onClose={() => setShowScanner(false)}
          onScanSuccess={handleScanSuccess}
        />
      )}
    </div>
  )
}

