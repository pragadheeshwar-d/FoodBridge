import { X, Download, QrCode } from 'lucide-react'
import { Button } from './Button'

interface QrPreviewModalProps {
  open: boolean
  onClose: () => void
  title: string
  qrImage?: string
  token?: string
  status?: string
  expiresAt?: string
}

export function QrPreviewModal({
  open,
  onClose,
  title,
  qrImage,
  token,
  status,
  expiresAt,
}: QrPreviewModalProps) {
  if (!open) return null

  const downloadQr = () => {
    if (!qrImage) return
    const link = document.createElement('a')
    link.href = qrImage
    link.download = `${title.replace(/\s+/g, '-').toLowerCase()}-qr.png`
    link.click()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Pickup QR</p>
            <h2 className="text-xl font-bold mt-1">{title}</h2>
          </div>
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="rounded-3xl bg-gray-50 dark:bg-gray-800/50 p-6 flex items-center justify-center">
            {qrImage ? (
              <img src={qrImage} alt="Pickup QR" className="w-full max-w-xs rounded-2xl shadow-lg" />
            ) : (
              <div className="text-center text-text-secondary">
                <QrCode className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>QR code is not available yet.</p>
              </div>
            )}
          </div>

          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/50 p-4">
              <p className="text-xs uppercase tracking-wide text-text-secondary">Status</p>
              <p className="font-semibold mt-1">{status || 'Active'}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/50 p-4">
              <p className="text-xs uppercase tracking-wide text-text-secondary">Token</p>
              <p className="font-mono text-xs mt-1 break-all">{token || 'Unavailable'}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/50 p-4">
              <p className="text-xs uppercase tracking-wide text-text-secondary">Expires</p>
              <p className="font-semibold mt-1">{expiresAt ? new Date(expiresAt).toLocaleString() : 'N/A'}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={onClose}>
              Close
            </Button>
            <Button variant="primary" className="flex-1" icon={Download} onClick={downloadQr} disabled={!qrImage}>
              Download QR
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
