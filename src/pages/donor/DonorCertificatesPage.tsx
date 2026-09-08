import { Download, QrCode, Award } from 'lucide-react'
import { DonorShell } from '../../components/donor/DonorShell'
import { DashboardHeader } from '../../components/layout/DashboardLayout'
import { useDonorCertificates } from '../../hooks/useDynamicContent'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'

export default function DonorCertificatesPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const { certificates } = useDonorCertificates()

  return (
    <DonorShell fab={false}>
      <DashboardHeader
        title="Certificates"
        subtitle="Download verified certificates for food donations, environmental impact, and community service."
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certificates.map((cert) => (
          <div key={cert.id} className="glass-card p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Award className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-bold text-sm">{cert.type}</p>
                <p className="text-xs text-text-secondary">{cert.period}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm mb-6">
              <p><span className="text-text-secondary">Organization:</span> {user?.organization || 'Food Bridge Partner'}</p>
              <p><span className="text-text-secondary">Meals served:</span> {cert.meals.toLocaleString()}</p>
              <p><span className="text-text-secondary">Donations:</span> {cert.donations}</p>
              <p><span className="text-text-secondary">CO₂ saved:</span> {cert.co2SavedKg} kg</p>
              <p><span className="text-text-secondary">Issued:</span> {cert.issuedAt.toLocaleDateString()}</p>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 mb-4">
              <QrCode className="w-8 h-8 text-primary" />
              <div>
                <p className="text-xs font-mono">{cert.id}</p>
                <p className="text-[10px] text-text-secondary">QR verification enabled</p>
              </div>
            </div>

            <p className="text-xs text-text-secondary italic mb-4">Digitally signed by Food Bridge  Tamil Nadu</p>

            <Button
              variant="primary"
              className="w-full"
              icon={Download}
              onClick={() => {
                if (cert.certificateUrl) {
                  window.open(cert.certificateUrl, '_blank')
                  toast(`${cert.type} PDF opened`, 'success')
                } else {
                  toast('Certificate file is not available yet', 'warning')
                }
              }}
            >
              Download PDF
            </Button>
          </div>
        ))}
      </div>
    </DonorShell>
  )
}
