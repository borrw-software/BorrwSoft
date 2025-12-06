import { useState, useEffect } from 'react'
import { Plus, Search, Package, Edit, Trash2, QrCode } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Asset, Profile } from '../lib/database.types'
import { STATUS_LABELS, CATEGORY_LABELS, CONDITION_LABELS } from '../lib/database.types'
import DashboardLayout from '../components/DashboardLayout'
import AddAssetModal from '../components/AddAssetModal'
import EditAssetModal from '../components/EditAssetModal'
import type { Session } from '@supabase/supabase-js'

interface AssetsProps {
  session: Session
}

export default function Assets({ session }: AssetsProps) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)

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

      // Load assets if we have an organisation
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

  const filteredAssets = assets.filter(asset => {
    const query = searchQuery.toLowerCase()
    return (
      asset.name.toLowerCase().includes(query) ||
      asset.asset_id.toLowerCase().includes(query) ||
      asset.brand?.toLowerCase().includes(query) ||
      asset.serial_number?.toLowerCase().includes(query) ||
      asset.location?.toLowerCase().includes(query)
    )
  })

  const handleAssetAdded = (newAsset: Asset) => {
    setAssets(prev => [newAsset, ...prev])
    setShowAddModal(false)
  }

  const handleAssetUpdated = (updatedAsset: Asset) => {
    setAssets(prev => prev.map(a => a.id === updatedAsset.id ? updatedAsset : a))
    setEditingAsset(null)
  }

  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return

    try {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', assetId)

      if (error) throw error
      setAssets(prev => prev.filter(a => a.id !== assetId))
    } catch (err) {
      console.error('Error deleting asset:', err)
      alert('Failed to delete asset')
    }
  }

  // Calculate stats
  const stats = {
    total: assets.length,
    available: assets.filter(a => a.status === 'available').length,
    borrowed: assets.filter(a => a.status === 'borrowed').length,
    maintenance: assets.filter(a => a.status === 'in_maintenance').length,
  }

  if (loading) {
    return (
      <DashboardLayout profile={profile}>
        <div className="loading-container">
          <div className="loading-spinner" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout profile={profile}>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Assets</h1>
        <div className="page-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} />
            Add Asset
          </button>
        </div>
      </div>

      {/* Page Content */}
      <div className="page-content">
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Assets</div>
            <div className="stat-value">{stats.total}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Available</div>
            <div className="stat-value">{stats.available}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Borrowed</div>
            <div className="stat-value">{stats.borrowed}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">In Maintenance</div>
            <div className="stat-value">{stats.maintenance}</div>
          </div>
        </div>

        {/* Assets Table */}
        <div className="table-container">
          <div className="table-header">
            <h2 className="table-title">All Assets</h2>
            <div className="table-actions">
              <div className="search-input">
                <Search />
                <input
                  type="text"
                  placeholder="Search assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {filteredAssets.length === 0 ? (
            <div className="empty-state">
              <Package />
              <h3>No assets found</h3>
              <p>
                {searchQuery 
                  ? 'Try adjusting your search query'
                  : 'Get started by adding your first asset'}
              </p>
              {!searchQuery && (
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowAddModal(true)}
                >
                  <Plus size={16} />
                  Add Asset
                </button>
              )}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Asset ID</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Brand / Model</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Condition</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((asset) => (
                  <tr key={asset.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                      {asset.asset_id}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{asset.name}</div>
                      {asset.serial_number && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          SN: {asset.serial_number}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-${asset.category}`}>
                        {CATEGORY_LABELS[asset.category]}
                      </span>
                    </td>
                    <td>
                      <div>{asset.brand || '—'}</div>
                      {(asset.model_make || asset.model_name) && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          {[asset.model_make, asset.model_name].filter(Boolean).join(' ')}
                          {asset.model_year && ` (${asset.model_year})`}
                        </div>
                      )}
                    </td>
                    <td>{asset.location || '—'}</td>
                    <td>
                      <span className={`badge badge-${asset.status}`}>
                        {STATUS_LABELS[asset.status]}
                      </span>
                    </td>
                    <td>
                      {asset.condition ? (
                        <span className={`badge badge-${asset.condition}`}>
                          {CONDITION_LABELS[asset.condition]}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button 
                          className="btn btn-ghost btn-icon btn-sm"
                          title="Edit & QR Code"
                          onClick={() => setEditingAsset(asset)}
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          className="btn btn-ghost btn-icon btn-sm"
                          title="Delete"
                          onClick={() => handleDeleteAsset(asset.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Asset Modal */}
      {showAddModal && profile?.organisation_id && (
        <AddAssetModal
          organisationId={profile.organisation_id}
          userId={session.user.id}
          onClose={() => setShowAddModal(false)}
          onAssetAdded={handleAssetAdded}
        />
      )}

      {/* Edit Asset Modal */}
      {editingAsset && profile?.organisation_id && (
        <EditAssetModal
          asset={editingAsset}
          organisationId={profile.organisation_id}
          onClose={() => setEditingAsset(null)}
          onAssetUpdated={handleAssetUpdated}
        />
      )}
    </DashboardLayout>
  )
}



