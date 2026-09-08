interface BadgeProps {
  variant: 'veg' | 'nonveg' | 'success' | 'warning' | 'error' | 'info' | 'default'
  children: React.ReactNode
}

const variants = {
  veg: 'badge-veg',
  nonveg: 'badge-nonveg',
  success: 'badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  warning: 'badge bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  error: 'badge bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  info: 'badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  default: 'badge bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

export function Badge({ variant, children }: BadgeProps) {
  return <span className={variants[variant]}>{children}</span>
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    available: { variant: 'success', label: 'Available' },
    partially_allocated: { variant: 'info', label: 'Partially Allocated' },
    fully_allocated: { variant: 'warning', label: 'Fully Allocated' },
    pending: { variant: 'warning', label: 'Pending' },
    claimed: { variant: 'info', label: 'Claimed' },
    completed: { variant: 'success', label: '✓ Food Received' },
    food_received: { variant: 'success', label: '✓ Food Received' },
    approved: { variant: 'success', label: 'Approved' },
    rejected: { variant: 'error', label: 'Rejected' },
    in_transit: { variant: 'info', label: 'In Transit' },
    accepted: { variant: 'success', label: 'Accepted' },
    en_route: { variant: 'info', label: 'En Route' },
    ngo_assigned: { variant: 'info', label: 'NGO Assigned' },
    pickup_started: { variant: 'info', label: 'Pickup Started' },
    collected: { variant: 'warning', label: 'Collected' },
    delivered: { variant: 'success', label: 'Delivered' },
    expired: { variant: 'error', label: 'Expired' },
    cancelled: { variant: 'error', label: 'Cancelled' },
  }
  const key = String(status || '').toLowerCase()
  const { variant, label } = map[key] || { variant: 'default' as const, label: status }
  return <Badge variant={variant}>{label}</Badge>
}
