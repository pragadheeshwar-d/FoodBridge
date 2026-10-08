import { useEffect, useState } from 'react'
import { DonorShell } from '../../components/donor/DonorShell'
import { DashboardHeader } from '../../components/layout/DashboardLayout'
import { Input, Select } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/api'

export default function DonorSettingsPage() {
  const { toast } = useToast()
  const { user, refreshUser } = useAuth()
  const [organization, setOrganization] = useState(user?.organization || '')
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [address, setAddress] = useState(user?.address || '')
  const [emailAlerts, setEmailAlerts] = useState('all')
  const [pickupReminder, setPickupReminder] = useState('30')
  const [language, setLanguage] = useState('en')
  const [darkMode, setDarkMode] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/services/settings')
      .then((res) => {
        const settings = res.data.settings || {}
        setEmailAlerts(settings.notification_preferences || 'all')
        setPickupReminder(settings.pickup_reminder || '30')
        setLanguage(settings.language || 'en')
        setDarkMode(Boolean(settings.dark_mode))
      })
      .catch(() => undefined)
  }, [])

  const saveSettings = async () => {
    setSaving(true)
    try {
      await api.put('/auth/profile', { organization, name, phone, address })
      await api.put('/services/settings', {
        notification_preferences: emailAlerts,
        pickup_reminder: pickupReminder,
        language,
        dark_mode: darkMode,
      })
      await refreshUser()
      toast('Settings saved successfully', 'success')
    } catch (error) {
      console.error('Settings save failed', error)
      toast('Failed to save settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DonorShell fab={false}>
      <DashboardHeader
        title="Settings"
        subtitle={`Manage notifications, pickup preferences, and account security for ${user?.organization || user?.name}.`}
      />

      <div className="max-w-2xl space-y-6">
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-bold">Organization Details</h3>
          <Input label="Organization Name" value={organization} onChange={(e) => setOrganization(e.target.value)} />
          <Input label="Contact Person" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Email" type="email" value={user?.email || ''} disabled />
          <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input label="Pickup Address" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>

        <div className="glass-card p-6 space-y-4">
          <h3 className="font-bold">Notification Preferences</h3>
          <Select label="Email Alerts" value={emailAlerts} onChange={(e) => setEmailAlerts(e.target.value)} options={[
            { value: 'all', label: 'All activity' },
            { value: 'important', label: 'Important only' },
            { value: 'none', label: 'None' },
          ]} />
          <Select label="Pickup Reminders" value={pickupReminder} onChange={(e) => setPickupReminder(e.target.value)} options={[
            { value: '30', label: '30 minutes before' },
            { value: '60', label: '1 hour before' },
            { value: '120', label: '2 hours before' },
          ]} />
          <Select label="Language" value={language} onChange={(e) => setLanguage(e.target.value)} options={[
            { value: 'en', label: 'English' },
            { value: 'hi', label: 'Hindi' },
            { value: 'ta', label: 'Tamil' },
          ]} />
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} />
            Dark mode preference
          </label>
        </div>

        <Button variant="primary" loading={saving} onClick={saveSettings}>
          Save Changes
        </Button>
      </div>
    </DonorShell>
  )
}
