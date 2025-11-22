import { ipfsClient } from '@/lib/ipfs/client'
import { litClient } from '@/lib/lit/client'
import { supabase } from '@/lib/supabase/client'

export interface UploadResult {
  success: boolean
  ipfsHash?: string
  fileId?: string
  error?: string
}

export interface FileMetadata {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  ipfsHash: string
  encryptedSymmetricKey: string
  accessControlConditions: any[]
  patientAddress: string
  authorizedDoctors: string[]
  uploadedAt: string
  recordType: string
}

export class FileUploadService {
  
  async uploadEncryptedFile(
    file: File,
    patientAddress: string,
    authorizedDoctors: string[] = [],
    recordType: string = 'general'
  ): Promise<UploadResult> {
    try {
      console.log('🚀 Starting encrypted file upload...')
      
      // Step 1: Connect to Lit Protocol
      await litClient.connect()
      console.log('✅ Connected to Lit Protocol')

      // Step 2: Encrypt the file using Lit Protocol
      console.log('🔒 Encrypting file with Lit Protocol...')
      const encryptionResult = await litClient.encryptFileBinary(file, patientAddress, authorizedDoctors)
      
      // Validate encryption result
      if (!encryptionResult || !encryptionResult.encryptedData || !encryptionResult.encryptedSymmetricKey) {
        throw new Error('Failed to encrypt file - encryption result is invalid')
      }
      
      const {
        encryptedData,
        encryptedSymmetricKey,
        accessControlConditions
      } = encryptionResult
      
      // Additional validation to ensure encryptedData is a valid Blob
      if (!(encryptedData instanceof Blob)) {
        throw new Error('Failed to encrypt file - encrypted data is not a valid Blob')
      }
      
      if (encryptedData.size === 0) {
        throw new Error('Failed to encrypt file - encrypted data is empty')
      }
      
      console.log('✅ File encrypted successfully', {
        originalSize: file.size,
        encryptedSize: encryptedData.size,
        hasSymmetricKey: !!encryptedSymmetricKey
      })

      // Step 3: Upload encrypted file to IPFS via Pinata
      console.log('☁️ Uploading encrypted file to IPFS...')
      const ipfsHash = await ipfsClient.uploadEncryptedFile(
        encryptedData,
        file.name,
        {
          patientAddress,
          authorizedDoctors,
          fileType: file.type,
          fileSize: file.size,
          recordType,
          dateCreated: new Date().toISOString()
        }
      )
      
      console.log('✅ File uploaded to IPFS:', ipfsHash)

      // Step 4: Validate session for database operations
      console.log('👤 Validating session...')

      const authData = localStorage.getItem('healthchain_auth')
      if (!authData) {
        throw new Error('No authentication data found. Please log in again.')
      }

      const auth = JSON.parse(authData)
      const sessionToken = auth.sessionToken || auth.session_token

      if (!sessionToken) {
        throw new Error('No session token found. Please log in again.')
      }

      const { data: sessionValidation, error: sessionError } = await supabase.rpc(
        'validate_session_and_get_user',
        { p_session_token: sessionToken }
      )

      if (sessionError || !sessionValidation?.success) {
        throw new Error(`Session validation failed: ${sessionValidation?.error || sessionError?.message}`)
      }

      console.log('✅ Session validated for user:', sessionValidation.user?.wallet_address)

      // Step 5: Store metadata in Supabase
      console.log('💾 Storing metadata in database...')
      
      // Match your existing database structure
      const fileMetadata = {
        // Use your existing columns
        patient_wallet: patientAddress.toLowerCase(), // Your table uses patient_wallet
        title: file.name, // Map to your existing title column
        description: `Encrypted health record: ${recordType}`,
        record_type: recordType,
        record_date: new Date().toISOString().split('T')[0], // Date only
        original_filename: file.name,
        file_size: file.size,
        mime_type: file.type,
        uploaded_at: new Date().toISOString(),
        
        // New columns for encryption (added by our fix)
        file_name: file.name,
        file_type: file.type,
        ipfs_hash: ipfsHash,
        encrypted_symmetric_key: encryptedSymmetricKey,
        access_control_conditions: accessControlConditions,
        authorized_doctors: authorizedDoctors.map(addr => addr.toLowerCase()),
        on_chain: false // Set to false since we're using IPFS
      }

      const { data, error } = await supabase
        .from('health_records')
        .insert([fileMetadata])
        .select()
        .single()

      if (error) {
        console.error('❌ Database error:', error)
        throw new Error(`Database error: ${error.message}`)
      }

      console.log('✅ Metadata stored in database')
      
      return {
        success: true,
        ipfsHash,
        fileId: data.id
      }

    } catch (error) {
      console.error('❌ Upload failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    } finally {
      // Clean up Lit Protocol connection
      await litClient.disconnect()
    }
  }

  // Get file list for a patient
  async getPatientFiles(patientAddress: string): Promise<FileMetadata[]> {
    try {
      const { data, error } = await supabase
        .from('health_records')
        .select('*')
        .eq('patient_wallet', patientAddress.toLowerCase()) // Use patient_wallet
        .order('uploaded_at', { ascending: false })

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return data.map(record => ({
        id: record.id,
        fileName: record.file_name || record.original_filename,
        fileType: record.file_type || record.mime_type,
        fileSize: record.file_size,
        ipfsHash: record.ipfs_hash,
        encryptedSymmetricKey: record.encrypted_symmetric_key,
        accessControlConditions: record.access_control_conditions ? JSON.parse(record.access_control_conditions) : [],
        patientAddress: record.patient_wallet,
        authorizedDoctors: record.authorized_doctors || [],
        uploadedAt: record.uploaded_at,
        recordType: record.record_type
      }))

    } catch (error) {
      console.error('❌ Failed to get patient files:', error)
      throw error
    }
  }

  // Grant access to a doctor
  async grantDoctorAccess(fileId: string, doctorAddress: string): Promise<boolean> {
    try {
      // This would require re-encrypting the file with new access control conditions
      // For now, we'll just update the authorized_doctors list in the database
      const { data: currentRecord, error: fetchError } = await supabase
        .from('health_records')
        .select('authorized_doctors')
        .eq('id', fileId)
        .single()

      if (fetchError) {
        throw new Error(`Fetch error: ${fetchError.message}`)
      }

      const currentDoctors = currentRecord.authorized_doctors || []
      if (!currentDoctors.includes(doctorAddress.toLowerCase())) {
        const updatedDoctors = [...currentDoctors, doctorAddress.toLowerCase()]

        const { error: updateError } = await supabase
          .from('health_records')
          .update({ authorized_doctors: updatedDoctors })
          .eq('id', fileId)

        if (updateError) {
          throw new Error(`Update error: ${updateError.message}`)
        }
      }

      return true
    } catch (error) {
      console.error('❌ Failed to grant doctor access:', error)
      return false
    }
  }
}

export const fileUploadService = new FileUploadService();