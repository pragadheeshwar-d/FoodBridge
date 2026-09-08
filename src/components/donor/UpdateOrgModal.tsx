import { useState } from 'react'
import { Building, X } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input, Select } from '../ui/Input'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import api from '../../lib/api'

interface UpdateOrgModalProps {
  onClose: () => void
}

export function UpdateOrgModal({ onClose }: UpdateOrgModalProps) {
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()

  const [businessType, setBusinessType] = useState(user?.businessType || '')
  const [operatingHours, setOperatingHours] = useState(user?.operatingHours || '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      await api.put('/auth/profile', {
        business_type: businessType,
        operating_hours: operatingHours,
      })

      await refreshUser()
      toast('Organization details updated successfully!', 'success')
      onClose()
    } catch (error: any) {
      toast(error?.response?.data?.message || 'Failed to update organization details', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Building className="w-5 h-5 text-primary" />
            Update Organization Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Select
            label="Business/Organization Type"
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            options={[
              { value: '', label: 'Select type...' },
              { value: 'Restaurant', label: 'Restaurant' },
              { value: 'Hotel', label: 'Hotel' },
              { value: 'Supermarket', label: 'Supermarket' },
              { value: 'Caterer', label: 'Caterer' },
              { value: 'NGO', label: 'NGO' },
              { value: 'Community Center', label: 'Community Center' },
              { value: 'Other', label: 'Other' },
            ]}
          />
          
          <Input
            label="Operating Hours"
            value={operatingHours}
            onChange={(e) => setOperatingHours(e.target.value)}
            placeholder="e.g. 9 AM - 6 PM"
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              loading={loading}
            >
              Save Details
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
