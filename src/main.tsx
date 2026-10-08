import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider } from './context/AuthContext'
import { NotificationPopupProvider } from './context/NotificationPopupContext'
import { NotificationPopupContainer } from './components/notifications/NotificationPopupContainer'
import { CallProvider } from './context/CallContext'
import { AudioCallModal } from './components/call/AudioCallModal'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <NotificationPopupProvider>
              <CallProvider>
                <App />
                <NotificationPopupContainer />
                <AudioCallModal />
              </CallProvider>
            </NotificationPopupProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
