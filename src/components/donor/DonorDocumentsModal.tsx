import { X, FileText, CheckCircle2, Download, ExternalLink, ShieldCheck } from 'lucide-react'
import { Button } from '../ui/Button'

interface DonorDocumentsModalProps {
  onClose: () => void
  organizationName?: string
}

export function DonorDocumentsModal({ onClose, organizationName = 'ICT GRAND CHOLA' }: DonorDocumentsModalProps) {
  const documents = [
    {
      id: 'fssai-cert',
      title: 'FSSAI Food Safety License',
      number: '12423002000492',
      issuer: 'Food Safety and Standards Authority of India',
      validTill: 'Nov 2027',
      status: 'Verified',
      fileSize: '1.4 MB',
      type: 'PDF',
    },
    {
      id: 'org-reg',
      title: 'Commercial Business Registration',
      number: 'TN-CHE-2021-99841',
      issuer: 'Ministry of Corporate Affairs / Govt of Tamil Nadu',
      validTill: 'Permanent',
      status: 'Verified',
      fileSize: '840 KB',
      type: 'PDF',
    },
    {
      id: 'hygiene-affidavit',
      title: 'FoodBridge Surplus Food Safety Undertaking',
      number: 'FB-AUD-2026-CHOLA',
      issuer: 'FoodBridge Quality Assurance Desk',
      validTill: 'Annual Renewal (2027)',
      status: 'Verified',
      fileSize: '512 KB',
      type: 'PDF',
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary-light flex items-center justify-center border border-primary/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Verified Organization Documents</h2>
              <p className="text-xs text-slate-400">{organizationName} • FoodBridge Compliance Desk</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>All compliance files are digitally stamped, active, and verified by FoodBridge inspection team.</span>
          </div>

          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-700/60 flex items-center justify-center text-primary-light shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-slate-100">{doc.title}</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {doc.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">ID: {doc.number}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{doc.issuer} • Valid: {doc.validTill}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => alert(`Document preview for ${doc.title}`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/70 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Preview
                  </button>
                  <button
                    onClick={() => alert(`Downloading verified copy of ${doc.title}`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary-light border border-primary/30 text-xs font-medium transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <Button variant="secondary" onClick={onClose} className="px-5 py-2 text-xs">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
