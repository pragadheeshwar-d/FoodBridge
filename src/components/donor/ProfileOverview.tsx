import { MapPin, Phone, Mail, Award, CheckCircle2, Edit2, Key, Building } from 'lucide-react'
import { Button } from '../ui/Button'

export interface ProfileMetric {
  label: string
  value: string | number
}

export interface ProfileData {
  avatar: string
  name: string
  organization: string
  email: string
  phone: string
  address: string
  memberSince: string
  isVerified: boolean
  metrics: ProfileMetric[]
  badge?: {
    label: string
  }
}

interface ProfileOverviewProps {
  profile: ProfileData
  onEditProfile?: () => void
  onUpdateOrg?: () => void
  onChangePassword?: () => void
}

export function ProfileOverview({ 
  profile,
  onEditProfile,
  onUpdateOrg,
  onChangePassword 
}: ProfileOverviewProps) {
  return (
    <div className="grid lg:grid-cols-3 gap-6 mb-8">
      {/* Left side */}
      <div className="lg:col-span-1 glass-card p-6 text-center">
        <img 
          src={profile.avatar} 
          alt={profile.name} 
          className="w-24 h-24 rounded-2xl object-cover mx-auto ring-4 ring-primary/10" 
        />
        <h2 className="text-xl font-bold mt-4">{profile.name}</h2>
        <p className="text-sm font-semibold text-primary mt-1">{profile.organization}</p>
        
        <div className="mt-6 text-left space-y-3 text-sm">
          <p className="flex items-center gap-2 text-text-secondary">
            <Mail className="w-4 h-4 text-primary" /> {profile.email}
          </p>
          <p className="flex items-center gap-2 text-text-secondary">
            <Phone className="w-4 h-4 text-primary" /> {profile.phone}
          </p>
          <p className="flex items-start gap-2 text-text-secondary">
            <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" /> {profile.address}
          </p>
        </div>
      </div>

      {/* Right side */}
      <div className="lg:col-span-2 glass-card p-6 flex flex-col justify-between">
        <div className="space-y-6">
          <h3 className="font-bold text-lg mb-4 border-b border-gray-100 dark:border-gray-800 pb-4">
            Account Information
          </h3>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-text-secondary mb-1">Member since</p>
              <p className="font-semibold">{profile.memberSince}</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-1">Verification status</p>
              {profile.isVerified ? (
                <p className="font-semibold text-green-600 dark:text-green-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Verified
                </p>
              ) : (
                <p className="font-semibold text-gray-500">Unverified</p>
              )}
            </div>
            {profile.metrics.map((metric, idx) => (
              <div key={idx}>
                <p className="text-xs text-text-secondary mb-1">{metric.label}</p>
                <p className="font-semibold text-xl">{metric.value}</p>
              </div>
            ))}
            {profile.badge && (
              <div className="sm:col-span-2">
                <p className="text-xs text-text-secondary mb-1">Contribution level</p>
                <p className="font-semibold text-yellow-600 dark:text-yellow-500 flex items-center gap-1.5">
                  <Award className="w-5 h-5" /> {profile.badge.label}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
          {onEditProfile && <Button variant="primary" icon={Edit2} onClick={onEditProfile}>Edit Profile</Button>}
          {onUpdateOrg && <Button variant="secondary" icon={Building} onClick={onUpdateOrg}>Update Organization Details</Button>}
          {onChangePassword && <Button variant="ghost" icon={Key} onClick={onChangePassword}>Change Password</Button>}
        </div>
      </div>
    </div>
  )
}
