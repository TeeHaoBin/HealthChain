export type UserRole = 'patient' | 'doctor' | 'admin'

export interface User {
  id: string
  wallet_address: string
  role: UserRole
  full_name: string
  email: string
  phone_number: string
  verified: boolean
  created_at: string
  updated_at: string

  // Doctor-specific fields
  license_number?: string
  specialization?: string
  hospital_affiliation?: string
}

export interface EHRRecord {
  id: string
  patient_id: string
  title: string
  description: string
  file_type: string
  file_size: number
  ipfs_hash: string
  encryption_key_id: string
  created_at: string
  updated_at: string
  tags: string[]
  permissionStatus?: 'granted' | 'pending' | 'none'
}

export interface AccessRequest {
  id: string
  doctor_id: string
  patient_id: string
  record_id?: string // null for general access
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  requested_at: string
  responded_at?: string
  expires_at?: string

  // Populated fields
  doctor?: User
  patient?: User
  record?: EHRRecord
}

export interface AccessLog {
  id: string
  accessor_id: string
  patient_id: string
  record_id: string
  action: 'view' | 'download' | 'share'
  ip_address: string
  user_agent: string
  accessed_at: string

  // Populated fields
  accessor?: User
  patient?: User
  record?: EHRRecord
}

export interface NotificationData {
  id: string
  user_id: string
  type: 'access_request' | 'access_granted' | 'access_denied' | 'verification_required'
  title: string
  message: string
  read: boolean
  created_at: string
  data?: any // Additional context data
}