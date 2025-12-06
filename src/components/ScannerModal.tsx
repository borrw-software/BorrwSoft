import { useEffect, useRef, useState } from 'react'
import { X, Camera, AlertCircle, CheckCircle } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'

interface ScannerModalProps {
  onClose: () => void
  onScanSuccess: (decodedText: string) => void
}

export default function ScannerModal({ onClose, onScanSuccess }: ScannerModalProps) {
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [lastScanned, setLastScanned] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    startScanner()
    
    return () => {
      stopScanner()
    }
  }, [])

  const startScanner = async () => {
    try {
      setError(null)
      setScanning(true)

      const html5QrCode = new Html5Qrcode('scanner-container')
      scannerRef.current = html5QrCode

      await html5QrCode.start(
        { facingMode: 'environment' }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          // On successful scan
          setLastScanned(decodedText)
          
          // Vibrate if supported
          if (navigator.vibrate) {
            navigator.vibrate(100)
          }

          // Stop scanning and notify parent
          stopScanner()
          onScanSuccess(decodedText)
        },
        () => {
          // QR code not found - this is called continuously, ignore
        }
      )
    } catch (err: any) {
      console.error('Scanner error:', err)
      setScanning(false)
      
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera permissions and try again.')
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.')
      } else {
        setError('Unable to start camera. Please try again.')
      }
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
      } catch (err) {
        // Ignore errors when stopping
      }
      scannerRef.current = null
    }
    setScanning(false)
  }

  const handleClose = () => {
    stopScanner()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="scanner-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="scanner-header">
          <h2>Scan Asset</h2>
          <button className="modal-close" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        {/* Scanner Container */}
        <div className="scanner-body">
          {error ? (
            <div className="scanner-error">
              <AlertCircle size={48} />
              <p>{error}</p>
              <button className="btn btn-primary" onClick={startScanner}>
                Try Again
              </button>
            </div>
          ) : (
            <>
              <div className="scanner-viewport">
                <div id="scanner-container" ref={containerRef} />
                <div className="scanner-overlay">
                  <div className="scanner-frame">
                    <div className="scanner-corner top-left" />
                    <div className="scanner-corner top-right" />
                    <div className="scanner-corner bottom-left" />
                    <div className="scanner-corner bottom-right" />
                  </div>
                </div>
              </div>
              <p className="scanner-hint">
                <Camera size={16} />
                Point your camera at a QR code or barcode
              </p>
            </>
          )}

          {lastScanned && (
            <div className="scanner-result">
              <CheckCircle size={20} />
              <span>Scanned: {lastScanned}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

