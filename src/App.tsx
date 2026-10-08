import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import LandingPage from './pages/LandingPage'
import DonorDashboard from './pages/donor/DonorDashboard'
import AddDonationPage from './pages/donor/AddDonationPage'
import DonorDonationsPage from './pages/donor/DonorDonationsPage'
import DonorPickupsPage from './pages/donor/DonorPickupsPage'
import DonorAnalyticsPage from './pages/donor/DonorAnalyticsPage'
import DonorProfilePage from './pages/donor/DonorProfilePage'
import DonorMessagesPage from './pages/donor/DonorMessagesPage'
import DonorHistoryPage from './pages/donor/DonorHistoryPage'
import DonorSettingsPage from './pages/donor/DonorSettingsPage'
import ReceiverDashboard from './pages/receiver/ReceiverDashboard'
import ReceiverDonationsPage from './pages/receiver/ReceiverDonationsPage'
import ReceiverRequestsPage from './pages/receiver/ReceiverRequestsPage'
import ReceiverSchedulePage from './pages/receiver/ReceiverSchedulePage'
import ReceiverAnalyticsPage from './pages/receiver/ReceiverAnalyticsPage'
import ReceiverProfilePage from './pages/receiver/ReceiverProfilePage'
import ReceiverMessagesPage from './pages/receiver/ReceiverMessagesPage'
import { LoginGatewayPage } from './pages/auth/login/LoginGatewayPage'
import { DonorLoginPage } from './pages/auth/login/DonorLoginPage'
import { ReceiverLoginPage } from './pages/auth/login/ReceiverLoginPage'
import { AdminLoginPage } from './pages/auth/login/AdminLoginPage'
import { SignupGatewayPage } from './pages/auth/signup/SignupGatewayPage'
import { DonorSignupPage } from './pages/auth/signup/DonorSignupPage'
import { ReceiverSignupPage } from './pages/auth/signup/ReceiverSignupPage'
import PendingApprovalPage from './pages/auth/PendingApprovalPage'
import { ForgotPasswordPage, ResetPasswordPage, VerifyEmailPage } from './pages/auth/AuthPages'
import { RegistrationSuccessPage } from './pages/auth/RegistrationSuccessPage'
import AdminPortal from './pages/admin/AdminPortal'
import FoodNeedsPage from './pages/donor/FoodNeedsPage'
import FoodNeedsMapPage from './pages/donor/FoodNeedsMapPage'
import NeedFoodPage from './pages/receiver/NeedFoodPage'
import AvailableFoodMapPage from './pages/receiver/AvailableFoodMapPage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { useAuth } from './context/AuthContext'

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

export default function App() {
  const location = useLocation()
  const { user } = useAuth()

  const dashboardTarget =
    user?.role === 'admin' || user?.role === 'super_admin'
      ? '/admin'
      : user?.role === 'receiver'
        ? '/receiver'
        : '/donor'

  return (
    <Routes location={location}>
      <Route path="/" element={<PageWrapper><LandingPage /></PageWrapper>} />
      <Route path="/auth/login" element={<PageWrapper><LoginGatewayPage /></PageWrapper>} />
        <Route path="/auth/login/donor" element={<PageWrapper><DonorLoginPage /></PageWrapper>} />
        <Route path="/auth/login/receiver" element={<PageWrapper><ReceiverLoginPage /></PageWrapper>} />
        <Route path="/auth/login/admin" element={<PageWrapper><AdminLoginPage /></PageWrapper>} />
        <Route path="/admin/login" element={<PageWrapper><AdminLoginPage /></PageWrapper>} />
        <Route path="/auth/signup" element={<PageWrapper><SignupGatewayPage /></PageWrapper>} />
        <Route path="/auth/signup/donor" element={<PageWrapper><DonorSignupPage /></PageWrapper>} />
        <Route path="/auth/signup/receiver" element={<PageWrapper><ReceiverSignupPage /></PageWrapper>} />
        <Route path="/auth/register" element={<Navigate to="/auth/signup" replace />} />
        <Route path="/auth/forgot-password" element={<PageWrapper><ForgotPasswordPage /></PageWrapper>} />
        <Route path="/auth/reset-password" element={<PageWrapper><ResetPasswordPage /></PageWrapper>} />
        <Route path="/auth/verify-email" element={<PageWrapper><VerifyEmailPage /></PageWrapper>} />
        <Route path="/auth/registration-success" element={<PageWrapper><RegistrationSuccessPage /></PageWrapper>} />
        <Route path="/pending" element={<PageWrapper><PendingApprovalPage /></PageWrapper>} />
        <Route path="/dashboard" element={<Navigate to={dashboardTarget} replace />} />

        <Route
          path="/admin"
          element={
            <PageWrapper>
              <ProtectedRoute roles={['admin', 'super_admin']}>
                <AdminPortal />
              </ProtectedRoute>
            </PageWrapper>
          }
        />

        <Route
          path="/donor"
          element={
            <PageWrapper>
              <ProtectedRoute roles={['donor']}>
                <DonorDashboard />
              </ProtectedRoute>
            </PageWrapper>
          }
        />
        <Route
          path="/donor/add"
          element={
            <PageWrapper>
              <ProtectedRoute roles={['donor']}>
                <AddDonationPage />
              </ProtectedRoute>
            </PageWrapper>
          }
        />
        <Route
          path="/donor/donations"
          element={
            <PageWrapper>
              <ProtectedRoute roles={['donor']}>
                <DonorDonationsPage />
              </ProtectedRoute>
            </PageWrapper>
          }
        />
        <Route
          path="/donor/needs"
          element={
            <PageWrapper>
              <ProtectedRoute roles={['donor']}>
                <FoodNeedsPage />
              </ProtectedRoute>
            </PageWrapper>
          }
        />
        <Route
          path="/donor/needs-map"
          element={
            <PageWrapper>
              <ProtectedRoute roles={['donor']}>
                <FoodNeedsMapPage />
              </ProtectedRoute>
            </PageWrapper>
          }
        />
        <Route
          path="/donor/pickups"
          element={
            <PageWrapper>
              <ProtectedRoute roles={['donor']}>
                <DonorPickupsPage />
              </ProtectedRoute>
            </PageWrapper>
          }
        />
        <Route
          path="/donor/analytics"
          element={
            <PageWrapper>
              <ProtectedRoute roles={['donor']}>
                <DonorAnalyticsPage />
              </ProtectedRoute>
            </PageWrapper>
          }
        />
        <Route
          path="/donor/certificates"
          element={<Navigate to="/donor" replace />}
        />
        <Route
          path="/donor/profile"
          element={
            <PageWrapper>
              <ProtectedRoute roles={['donor']}>
                <DonorProfilePage />
              </ProtectedRoute>
            </PageWrapper>
          }
        />
        <Route
          path="/donor/messages"
          element={
            <PageWrapper>
              <ProtectedRoute roles={['donor']}>
                <DonorMessagesPage />
              </ProtectedRoute>
            </PageWrapper>
          }
        />
        <Route
          path="/donor/history"
          element={
            <PageWrapper>
              <ProtectedRoute roles={['donor']}>
                <DonorHistoryPage />
              </ProtectedRoute>
            </PageWrapper>
          }
        />
        <Route
          path="/donor/settings"
          element={
            <PageWrapper>
              <ProtectedRoute roles={['donor']}>
                <DonorSettingsPage />
              </ProtectedRoute>
            </PageWrapper>
          }
        />

        <Route
          path="/receiver"
          element={
            <PageWrapper>
              <ProtectedRoute roles={['receiver']}>
                <ReceiverDashboard />
              </ProtectedRoute>
            </PageWrapper>
          }
        />
        <Route
          path="/receiver/donations"
          element={
            <PageWrapper>
              <ProtectedRoute roles={['receiver']}>
                <ReceiverDonationsPage />
              </ProtectedRoute>
            </PageWrapper>
          }
        />
        <Route
          path="/receiver/need-food"
          element={
            <PageWrapper>
              <ProtectedRoute roles={['receiver']}>
                <NeedFoodPage />
              </ProtectedRoute>
            </PageWrapper>
          }
        />
        <Route
          path="/receiver/needs"
          element={
            <PageWrapper>
              <ProtectedRoute roles={['receiver']}>
                <NeedFoodPage />
              </ProtectedRoute>
            </PageWrapper>
          }
        />
        <Route
          path="/receiver/map"
          element={
            <PageWrapper>
              <ProtectedRoute roles={['receiver']}>
                <AvailableFoodMapPage />
              </ProtectedRoute>
            </PageWrapper>
          }
        />
        <Route
          path="/receiver/requests"
          element={
            <PageWrapper>
              <ProtectedRoute roles={['receiver']}>
                <ReceiverRequestsPage />
              </ProtectedRoute>
            </PageWrapper>
          }
        />
        <Route
          path="/receiver/schedule"
          element={
            <PageWrapper>
              <ProtectedRoute roles={['receiver']}>
                <ReceiverSchedulePage />
              </ProtectedRoute>
            </PageWrapper>
          }
        />
        <Route
          path="/receiver/analytics"
          element={
            <PageWrapper>
              <ProtectedRoute roles={['receiver']}>
                <ReceiverAnalyticsPage />
              </ProtectedRoute>
            </PageWrapper>
          }
        />
        <Route
          path="/receiver/profile"
          element={
            <PageWrapper>
              <ProtectedRoute roles={['receiver']}>
                <ReceiverProfilePage />
              </ProtectedRoute>
            </PageWrapper>
          }
        />
        <Route
          path="/receiver/messages"
          element={
            <PageWrapper>
              <ProtectedRoute roles={['receiver']}>
                <ReceiverMessagesPage />
              </ProtectedRoute>
            </PageWrapper>
          }
        />

        <Route
          path="*"
          element={
            <PageWrapper>
              <Navigate to="/" replace />
            </PageWrapper>
          }
        />
      </Routes>
  )
}
