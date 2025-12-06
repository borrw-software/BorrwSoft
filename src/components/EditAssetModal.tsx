import { useState, useRef, useCallback } from 'react'
import { X, Upload, Image as ImageIcon, Trash2, Download, QrCode } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../lib/supabase'
import type { Asset, AssetCategory, AssetStatus, AssetCondition } from '../lib/database.types'
import { ASSET_CATEGORIES, ASSET_STATUSES, ASSET_CONDITIONS, CATEGORY_LABELS, STATUS_LABELS, CONDITION_LABELS } from '../lib/database.types'
import CustomSelect from './CustomSelect'

interface EditAssetModalProps {
  asset: Asset
  organisationId: string
  onClose: () => void
  onAssetUpdated: (asset: Asset) => void
}

export default function EditAssetModal({ asset, organisationId, onClose, onAssetUpdated }: EditAssetModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(asset.image_url)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'qrcode'>('details')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const qrCodeRef = useRef<HTMLDivElement>(null)

  // Form state - pre-filled with asset data
  const [formData, setFormData] = useState({
    name: asset.name,
    asset_id: asset.asset_id,
    category: asset.category,
    asset_type: asset.asset_type || '',
    brand: asset.brand || '',
    model_make: asset.model_make || '',
    model_name: asset.model_name || '',
    model_year: asset.model_year?.toString() || '',
    colour: asset.colour || '',
    serial_number: asset.serial_number || '',
    purchase_date: asset.purchase_date || '',
    purchase_price: asset.purchase_price?.toString() || '',
    warranty_expiration_date: asset.warranty_expiration_date || '',
    location: asset.location || '',
    status: asset.status,
    condition: asset.condition || 'good' as AssetCondition,
    last_inspection_date: asset.last_inspection_date || '',
    notes: asset.notes || '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Image handling functions
  const handleImageSelect = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, WebP, or GIF)')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    setError(null)
    setImageFile(file)

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleImageSelect(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return imagePreview // Return existing URL if no new image

    setUploadingImage(true)
    try {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${organisationId}/${asset.id}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('asset-images')
        .upload(fileName, imageFile, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('asset-images')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (err) {
      console.error('Error uploading image:', err)
      return imagePreview
    } finally {
      setUploadingImage(false)
    }
  }

  // QR Code download function
  const downloadQRCode = useCallback(() => {
    if (!qrCodeRef.current) return

    const svg = qrCodeRef.current.querySelector('svg')
    if (!svg) return

    // Create a canvas to convert SVG to PNG
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const img = new Image()
    
    img.onload = () => {
      canvas.width = 300
      canvas.height = 350 // Extra space for text
      
      // White background
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Draw QR code
      ctx.drawImage(img, 25, 20, 250, 250)
      
      // Add asset ID text
      ctx.fillStyle = 'black'
      ctx.font = 'bold 16px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(formData.asset_id, canvas.width / 2, 300)
      
      // Add asset name
      ctx.font = '12px Arial'
      ctx.fillText(formData.name.substring(0, 30), canvas.width / 2, 325)
      
      // Download
      const link = document.createElement('a')
      link.download = `QR-${formData.asset_id}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }, [formData.asset_id, formData.name])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!formData.name.trim()) {
      setError('Asset name is required')
      setLoading(false)
      return
    }

    if (!formData.asset_id.trim()) {
      setError('Asset ID is required')
      setLoading(false)
      return
    }

    try {
      const imageUrl = await uploadImage()

      const { data, error } = await supabase
        .from('assets')
        .update({
          name: formData.name.trim(),
          asset_id: formData.asset_id.trim(),
          category: formData.category,
          asset_type: formData.asset_type.trim() || null,
          brand: formData.brand.trim() || null,
          model_make: formData.model_make.trim() || null,
          model_name: formData.model_name.trim() || null,
          model_year: formData.model_year ? parseInt(formData.model_year) : null,
          colour: formData.colour.trim() || null,
          serial_number: formData.serial_number.trim() || null,
          purchase_date: formData.purchase_date || null,
          purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
          warranty_expiration_date: formData.warranty_expiration_date || null,
          location: formData.location.trim() || null,
          status: formData.status,
          condition: formData.condition,
          last_inspection_date: formData.last_inspection_date || null,
          notes: formData.notes.trim() || null,
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', asset.id)
        .select()
        .single()

      if (error) throw error
      onAssetUpdated(data)
    } catch (err: any) {
      console.error('Error updating asset:', err)
      setError(err.message || 'Failed to update asset')
    } finally {
      setLoading(false)
    }
  }

  // QR code data - includes asset ID and a URL that can be used to look up the asset
  const qrCodeData = JSON.stringify({
    id: formData.asset_id,
    name: formData.name,
    org: organisationId
  })

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Edit Asset</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button 
            className={`modal-tab ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          <button 
            className={`modal-tab ${activeTab === 'qrcode' ? 'active' : ''}`}
            onClick={() => setActiveTab('qrcode')}
          >
            <QrCode size={16} />
            QR Code
          </button>
        </div>

        {activeTab === 'details' ? (
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && (
                <div className="error-message" style={{ marginBottom: '16px' }}>
                  {error}
                </div>
              )}

              {/* Asset Image */}
              <div className="form-section">
                <div className="form-section-title">Asset Image</div>
                <div 
                  className={`image-upload-area ${isDragging ? 'dragging' : ''} ${imagePreview ? 'has-image' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !imagePreview && fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileInputChange}
                    style={{ display: 'none' }}
                  />
                  
                  {imagePreview ? (
                    <div className="image-preview-container">
                      <img src={imagePreview} alt="Asset preview" className="image-preview" />
                      <div className="image-preview-overlay">
                        <button
                          type="button"
                          className="image-action-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            fileInputRef.current?.click()
                          }}
                          title="Change image"
                        >
                          <Upload size={18} />
                        </button>
                        <button
                          type="button"
                          className="image-action-btn image-action-btn-danger"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeImage()
                          }}
                          title="Remove image"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="image-upload-placeholder">
                      <ImageIcon size={32} />
                      <span className="image-upload-text">
                        Drag and drop an image here, or click to browse
                      </span>
                      <span className="image-upload-hint">
                        JPEG, PNG, WebP, GIF • Max 5MB
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Basic Information */}
              <div className="form-section">
                <div className="form-section-title">Basic Information</div>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label htmlFor="name">Asset Name *</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="e.g., MacBook Pro 16-inch"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="category">Category *</label>
                    <CustomSelect
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={(value) => setFormData(prev => ({ ...prev, category: value as AssetCategory }))}
                      options={ASSET_CATEGORIES.map(cat => ({
                        value: cat,
                        label: CATEGORY_LABELS[cat]
                      }))}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="asset_id">Asset ID *</label>
                    <input
                      id="asset_id"
                      name="asset_id"
                      type="text"
                      value={formData.asset_id}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="status">Status *</label>
                    <CustomSelect
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={(value) => setFormData(prev => ({ ...prev, status: value as AssetStatus }))}
                      options={ASSET_STATUSES.map(status => ({
                        value: status,
                        label: STATUS_LABELS[status]
                      }))}
                      showStatusDot={true}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="asset_type">Asset Type</label>
                    <input
                      id="asset_type"
                      name="asset_type"
                      type="text"
                      placeholder="e.g., Laptop, Sedan, Drill"
                      value={formData.asset_type}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="brand">Brand</label>
                    <input
                      id="brand"
                      name="brand"
                      type="text"
                      placeholder="e.g., Apple, Toyota"
                      value={formData.brand}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Model Details */}
              <div className="form-section">
                <div className="form-section-title">Model Details</div>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="model_make">Make / Manufacturer</label>
                    <input
                      id="model_make"
                      name="model_make"
                      type="text"
                      placeholder="e.g., Dell, Ford"
                      value={formData.model_make}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="model_name">Model Name</label>
                    <input
                      id="model_name"
                      name="model_name"
                      type="text"
                      placeholder="e.g., XPS 15, F-150"
                      value={formData.model_name}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="model_year">Year</label>
                    <input
                      id="model_year"
                      name="model_year"
                      type="number"
                      placeholder="e.g., 2024"
                      min="1900"
                      max="2100"
                      value={formData.model_year}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="colour">Colour</label>
                    <input
                      id="colour"
                      name="colour"
                      type="text"
                      placeholder="e.g., Silver, Black"
                      value={formData.colour}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="serial_number">Serial Number</label>
                    <input
                      id="serial_number"
                      name="serial_number"
                      type="text"
                      placeholder="Manufacturer serial number"
                      value={formData.serial_number}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Purchase & Warranty */}
              <div className="form-section">
                <div className="form-section-title">Purchase & Warranty</div>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="purchase_date">Purchase Date</label>
                    <input
                      id="purchase_date"
                      name="purchase_date"
                      type="date"
                      value={formData.purchase_date}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="purchase_price">Purchase Price</label>
                    <input
                      id="purchase_price"
                      name="purchase_price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.purchase_price}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="warranty_expiration_date">Warranty Expiration</label>
                    <input
                      id="warranty_expiration_date"
                      name="warranty_expiration_date"
                      type="date"
                      value={formData.warranty_expiration_date}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Location & Condition */}
              <div className="form-section">
                <div className="form-section-title">Location & Condition</div>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="location">Location</label>
                    <input
                      id="location"
                      name="location"
                      type="text"
                      placeholder="e.g., Office A, Warehouse"
                      value={formData.location}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="condition">Condition</label>
                    <CustomSelect
                      id="condition"
                      name="condition"
                      value={formData.condition}
                      onChange={(value) => setFormData(prev => ({ ...prev, condition: value as AssetCondition }))}
                      options={ASSET_CONDITIONS.map(cond => ({
                        value: cond,
                        label: CONDITION_LABELS[cond]
                      }))}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="last_inspection_date">Last Inspection Date</label>
                    <input
                      id="last_inspection_date"
                      name="last_inspection_date"
                      type="date"
                      value={formData.last_inspection_date}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="notes">Notes</label>
                    <textarea
                      id="notes"
                      name="notes"
                      placeholder="Additional notes about this asset..."
                      value={formData.notes}
                      onChange={handleChange}
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading || uploadingImage}
              >
                {uploadingImage ? 'Uploading...' : loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          /* QR Code Tab */
          <div className="modal-body">
            <div className="qr-code-container">
              <div className="qr-code-preview" ref={qrCodeRef}>
                <QRCodeSVG 
                  value={qrCodeData}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              
              <div className="qr-code-info">
                <h3>{formData.name}</h3>
                <p className="qr-code-id">{formData.asset_id}</p>
                <p className="qr-code-hint">
                  Scan this QR code to quickly find this asset
                </p>
              </div>

              <button 
                className="btn btn-primary qr-download-btn"
                onClick={downloadQRCode}
              >
                <Download size={18} />
                Download QR Code
              </button>

              <p className="qr-code-tip">
                Print and attach this QR code to your asset for easy scanning
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

