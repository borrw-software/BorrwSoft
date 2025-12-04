import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, Plus, ArrowRight, TrendingUp, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Asset, Profile, AssetSummary } from '../lib/database.types'
import { STATUS_LABELS, CATEGORY_LABELS } from '../lib/database.types'
import DashboardLayout from '../components/DashboardLayout'
import type { Session } from '@supabase/supabase-js'

interface DashboardHomeProps {
  session: Session
}

export default function DashboardHome({ session }: DashboardHomeProps) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [recentAssets, setRecentAssets] = useState<Asset[]>([])
  const [summary, setSummary] = useState<AssetSummary | null>(null)
  const [loading, setLoading] = useState(true)

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

      if (profileData?.organisation_id) {
        // Load recent assets
        const { data: assetsData } = await supabase
          .from('assets')
          .select('*')
          .eq('organisation_id', profileData.organisation_id)
          .order('created_at', { ascending: false })
          .limit(5)

        setRecentAssets(assetsData || [])

        // Load summary
        const { data: summaryData } = await supabase
          .from('asset_summary')
          .select('*')
          .eq('organisation_id', profileData.organisation_id)
          .single()

        setSummary(summaryData)
      }
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
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
        <h1 className="page-title">Dashboard</h1>
        <div className="page-actions">
          <Link to="/assets" className="btn btn-primary">
            <Plus size={16} />
            Add New Asset
          </Link>
        </div>
      </div>

      {/* Page Content */}
      <div className="page-content">
        {/* Welcome Message */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '4px' }}>
            Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}!
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            Here's an overview of your assets
          </p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Assets</div>
            <div className="stat-value">{summary?.total_assets || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Available</div>
            <div className="stat-value">{summary?.available_count || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Borrowed</div>
            <div className="stat-value">{summary?.borrowed_count || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">In Maintenance</div>
            <div className="stat-value">{summary?.maintenance_count || 0}</div>
          </div>
        </div>

        {/* Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Recent Assets */}
          <div className="table-container">
            <div className="table-header">
              <h2 className="table-title">Recent Assets</h2>
              <Link to="/assets" className="btn btn-ghost btn-sm">
                View All
                <ArrowRight size={14} />
              </Link>
            </div>

            {recentAssets.length === 0 ? (
              <div className="empty-state">
                <Package />
                <h3>No assets yet</h3>
                <p>Add your first asset to get started</p>
                <Link to="/assets" className="btn btn-primary btn-sm">
                  <Plus size={14} />
                  Add Asset
                </Link>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Category</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAssets.map((asset) => (
                    <tr key={asset.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{asset.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          {asset.asset_id}
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${asset.category}`}>
                          {CATEGORY_LABELS[asset.category]}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${asset.status}`}>
                          {STATUS_LABELS[asset.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Quick Stats */}
          <div className="table-container">
            <div className="table-header">
              <h2 className="table-title">Asset Breakdown</h2>
            </div>
            <div style={{ padding: '20px' }}>
              {/* Category Breakdown */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  By Category
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="badge badge-car">Car</span>
                    </span>
                    <span style={{ fontWeight: 600 }}>{summary?.car_count || 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="badge badge-equipment">Equipment</span>
                    </span>
                    <span style={{ fontWeight: 600 }}>{summary?.equipment_count || 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="badge badge-electronics">Electronics</span>
                    </span>
                    <span style={{ fontWeight: 600 }}>{summary?.electronics_count || 0}</span>
                  </div>
                </div>
              </div>

              {/* Alerts */}
              {((summary?.needs_repair_count || 0) > 0 || (summary?.expired_warranty_count || 0) > 0) && (
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    Alerts
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(summary?.needs_repair_count || 0) > 0 && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        padding: '10px 12px',
                        backgroundColor: '#fef3c7',
                        borderRadius: '8px',
                        fontSize: '0.8125rem'
                      }}>
                        <AlertTriangle size={16} style={{ color: '#92400e' }} />
                        <span style={{ color: '#92400e' }}>
                          {summary?.needs_repair_count} asset(s) need repair
                        </span>
                      </div>
                    )}
                    {(summary?.expired_warranty_count || 0) > 0 && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        padding: '10px 12px',
                        backgroundColor: '#fee2e2',
                        borderRadius: '8px',
                        fontSize: '0.8125rem'
                      }}>
                        <AlertTriangle size={16} style={{ color: '#991b1b' }} />
                        <span style={{ color: '#991b1b' }}>
                          {summary?.expired_warranty_count} warranty(s) expired
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Empty state for alerts */}
              {(summary?.needs_repair_count || 0) === 0 && (summary?.expired_warranty_count || 0) === 0 && (summary?.total_assets || 0) > 0 && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  padding: '10px 12px',
                  backgroundColor: '#dcfce7',
                  borderRadius: '8px',
                  fontSize: '0.8125rem'
                }}>
                  <TrendingUp size={16} style={{ color: '#166534' }} />
                  <span style={{ color: '#166534' }}>
                    All assets in good standing
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

