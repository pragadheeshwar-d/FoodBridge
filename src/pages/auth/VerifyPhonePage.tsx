import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Phone } from 'lucide-react'
import { AuthShell } from './AuthShell'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { verificationService } from '../../services/verificationService'

export function VerifyPhonePage() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSendOtp = async () => {
    if (!user?.phone) {
      toast('No phone number on record.', 'error')
      return
    }
    setLoading(true)
    try {
      await verificationService.sendPhoneOTP(user.phone)
      setSent(true)
      toast('OTP sent to your phone!', 'success')
    } catch (e: any) {
      toast(e?.response?.data?.error || 'Failed to send OTP.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp) {
      setError('OTP is required.')
      return
    }
    setLoading(true)
    try {
      await verificationService.verifyPhoneOTP(otp)
      toast('Phone verified successfully!', 'success')
      await refreshUser()
      navigate('/dashboard')
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Invalid OTP.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Verify your phone"
      subtitle="We need to verify your phone number to complete your profile."
    >
      {!sent ? (
        <div className="space-y-6">
          <p className="text-text-secondary">
            We will send a one-time password to your registered phone number: 
            <span className="block font-medium text-text-primary mt-1">{user?.phone || 'Unknown'}</span>
          </p>
          <Button
            variant="primary"
            className="w-full"
            loading={loading}
            onClick={handleSendOtp}
          >
            Send OTP
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => navigate('/dashboard')}
          >
            Skip for now
          </Button>
        </div>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-6">
          <Input
            label="One-Time Password"
            value={otp}
            onChange={(e) => {
              setOtp(e.target.value)
              setError('')
            }}
            error={error}
            icon={Phone}
            placeholder="Enter the 6-digit code"
            maxLength={6}
          />
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            loading={loading}
          >
            Verify Phone
          </Button>
          <p className="text-sm text-center text-text-secondary">
            Didn't receive the code?{' '}
            <button
              type="button"
              className="font-medium text-primary hover:underline"
              onClick={handleSendOtp}
              disabled={loading}
            >
              Resend
            </button>
          </p>
        </form>
      )}
    </AuthShell>
  )
}
