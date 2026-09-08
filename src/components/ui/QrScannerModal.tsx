import { useEffect, useRef, useState } from 'react'
import { X, ScanLine, Loader2 } from 'lucide-react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { Button } from './Button'

interface QrScannerModalProps {
  open: boolean
  onClose: () => void
  onScan: (token: string) => Promise<void> | void
}

export function QrScannerModal({ open, onClose, onScan }: QrScannerModalProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const [manualToken, setManualToken] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) {
      scannerRef.current?.clear().catch(() => {})
      scannerRef.current = null
      return
    }

    const scanner = new Html5QrcodeScanner('qr-reader', {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
    }, false)

    scanner.render(
      async (decodedText) => {
        setBusy(true)
        try {
          await onScan(decodedText)
        } finally {
          setBusy(false)
        }
      },
      () => {
        // Ignore scan errors while the camera is actively reading frames.
      },
    )

    scannerRef.current = scanner

    return () => {
      scanner.clear().catch(() => {})
      scannerRef.current = null
    }
  }, [open, onScan])

  if (!open) return null

  const submitManual = async () => {
    if (!manualToken.trim()) return
    setBusy(true)
    try {
      await onScan(manualToken.trim())
      setManualToken('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Verify Pickup</p>
            <h2 className="text-xl font-bold mt-1">Scan QR Code</h2>
          </div>
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-black">
            <div id="qr-reader" className="min-h-[320px]" />
          </div>

          <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/50 p-4 space-y-3">
            <p className="text-sm text-text-secondary">
              Use the camera scanner above or paste the QR token if the camera is unavailable.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                className="input-field flex-1"
                placeholder="Paste QR token"
              />
              <Button variant="primary" icon={busy ? Loader2 : ScanLine} onClick={submitManual} loading={busy}>
                Verify
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
