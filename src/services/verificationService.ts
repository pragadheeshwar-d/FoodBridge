import api from '../lib/api'

export const verificationService = {
  getStatus: async () => (await api.get('/verification/status')).data,
  submitVerification: async (data: FormData) => await api.post('/verification/submit', data),
  resubmitVerification: async (data: FormData) => await api.put('/verification/resubmit', data),
  sendPhoneOTP: async (phone: string) => await api.post('/verification/phone/send-otp', { phone }),
  verifyPhoneOTP: async (code: string) => await api.post('/verification/phone/verify-otp', { otp_code: code }),
  getRequests: async (status?: string) => (await api.get('/verification/admin/requests', { params: { status } })).data,
  getRequestDetail: async (id: number) => (await api.get(`/verification/admin/requests/${id}`)).data,
  reviewRequest: async (id: number, action: string, reason?: string) => await api.put(`/verification/admin/requests/${id}/review`, { action, reason })
}
