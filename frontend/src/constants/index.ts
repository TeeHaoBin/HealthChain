export const APP_CONFIG = {
  name: 'HealthChain',
  description: 'Decentralized Healthcare Records Management',
  version: '1.0.0',
  network: {
    chainId: 11155111, // Sepolia testnet
    name: 'Sepolia',
    rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY'
  }
}

export const ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
  
  // Patient routes
  PATIENT: {
    DASHBOARD: '/patient/dashboard',
    UPLOAD: '/patient/upload',
    REQUESTS: '/patient/requests',
    LOGS: '/patient/logs'
  },
  
  // Doctor routes
  DOCTOR: {
    DASHBOARD: '/doctor/dashboard',
    REQUEST: '/doctor/request',
    VIEW: '/doctor/view',
    HISTORY: '/doctor/history'
  },
  
  // Admin routes
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    VERIFY: '/admin/verify',
    LOGS: '/admin/logs'
  }
}

export const ROLES = {
  PATIENT: 'patient' as const,
  DOCTOR: 'doctor' as const,
  ADMIN: 'admin' as const
}

export const ACCESS_REQUEST_STATUS = {
  PENDING: 'pending' as const,
  APPROVED: 'approved' as const,
  REJECTED: 'rejected' as const,
  EXPIRED: 'expired' as const
}

export const FILE_TYPES = {
  PDF: 'application/pdf',
  IMAGE: 'image/*',
  DICOM: 'application/dicom'
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export const ACCESS_DURATION = {
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
  ONE_WEEK: 7 * 24 * 60 * 60 * 1000,
  ONE_MONTH: 30 * 24 * 60 * 60 * 1000
}