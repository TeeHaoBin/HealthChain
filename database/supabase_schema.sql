-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

-- ==========================================
-- TABLES
-- ==========================================

CREATE TABLE public.access_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_wallet text NOT NULL CHECK (patient_wallet ~ '^0x[a-f0-9]{40}$'::text),
  doctor_wallet text NOT NULL CHECK (doctor_wallet ~ '^0x[a-f0-9]{40}$'::text),
  purpose text NOT NULL CHECK (length(purpose) >= 10),
  urgency text DEFAULT 'routine'::text CHECK (urgency = ANY (ARRAY['routine'::text, 'urgent'::text, 'emergency'::text])),
  requested_record_ids ARRAY,
  status text DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'sent'::text, 'approved'::text, 'denied'::text, 'expired'::text, 'revoked'::text])),
  patient_response text,
  denial_reason text,
  created_at timestamp with time zone DEFAULT now(),
  sent_at timestamp with time zone,
  responded_at timestamp with time zone,
  expires_at timestamp with time zone DEFAULT (now() + '7 days'::interval),
  consent_document_hash text,
  legal_basis text DEFAULT 'healthcare_treatment'::text,
  jurisdiction text DEFAULT 'US'::text,
  snapshot_document_titles text[],
  CONSTRAINT access_requests_pkey PRIMARY KEY (id)
);
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.active_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_wallet text NOT NULL CHECK (patient_wallet ~ '^0x[a-f0-9]{40}$'::text),
  doctor_wallet text NOT NULL CHECK (doctor_wallet ~ '^0x[a-f0-9]{40}$'::text),
  record_ids ARRAY,
  permitted_actions ARRAY DEFAULT ARRAY['view'::text],
  granted_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT active_permissions_pkey PRIMARY KEY (id)
);
ALTER TABLE public.active_permissions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_wallet text NOT NULL CHECK (user_wallet ~ '^0x[a-f0-9]{40}$'::text),
  user_role text,
  action text NOT NULL CHECK (action = ANY (ARRAY['login'::text, 'logout'::text, 'view_record'::text, 'download_record'::text, 'upload_record'::text, 'grant_access'::text, 'revoke_access'::text, 'profile_update'::text])),
  resource_type text NOT NULL CHECK (resource_type = ANY (ARRAY['health_record'::text, 'user_profile'::text, 'access_permission'::text])),
  resource_id text,
  action_timestamp timestamp with time zone DEFAULT now(),
  ip_address inet,
  user_agent text,
  purpose_of_access text,
  success boolean NOT NULL DEFAULT true,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.doctor_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  license_number text UNIQUE,
  specialization text,
  hospital_name text,
  verification_status text DEFAULT 'pending'::text CHECK (verification_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'suspended'::text])),
  verification_documents jsonb DEFAULT '[]'::jsonb,
  admin_notes text,
  verified_at timestamp with time zone,
  verified_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT doctor_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT doctor_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT doctor_profiles_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id)
);
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.health_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_wallet text NOT NULL CHECK (patient_wallet ~ '^0x[a-f0-9]{40}$'::text),
  file_url text,
  file_hash text,
  title text NOT NULL,
  description text,
  record_type text NOT NULL CHECK (record_type = ANY (ARRAY['general'::text, 'lab-result'::text, 'prescription'::text, 'imaging'::text, 'discharge-summary'::text, 'visit-note'::text, 'other'::text])),
  record_date date NOT NULL,
  original_filename text,
  file_size integer CHECK (file_size > 0),
  mime_type text,
  uploaded_by uuid,
  uploaded_at timestamp with time zone DEFAULT now(),
  blockchain_record_id bigint,
  on_chain boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  encrypted_symmetric_key text,
  access_control_conditions jsonb,
  authorized_doctors ARRAY DEFAULT '{}'::text[],
  ipfs_hash text,
  file_name text NOT NULL,
  file_type text NOT NULL,
  CONSTRAINT health_records_pkey PRIMARY KEY (id),
  CONSTRAINT health_records_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id)
);
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.patient_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  date_of_birth date,
  emergency_contact_name text,
  emergency_contact_phone text,
  has_allergies boolean DEFAULT false,
  has_chronic_conditions boolean DEFAULT false,
  preferred_language text DEFAULT 'en'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT patient_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT patient_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  wallet_address text NOT NULL CHECK (wallet_address ~ '^0x[a-f0-9]{40}$'::text),
  session_token text NOT NULL UNIQUE,
  signature_used text NOT NULL,
  nonce_used text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  last_activity timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  ip_address inet NOT NULL,
  user_agent text,
  is_mobile boolean DEFAULT false,
  active boolean DEFAULT true,
  terminated_reason text,
  request_count integer DEFAULT 0,
  last_request_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_sessions_pkey PRIMARY KEY (id)
);
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  auth_user_id uuid UNIQUE,
  wallet_address text NOT NULL UNIQUE CHECK (wallet_address ~ '^0x[a-f0-9]{40}$'::text),
  email text,
  full_name text,
  phone_number text,
  role text NOT NULL DEFAULT 'patient'::text CHECK (role = ANY (ARRAY['patient'::text, 'doctor'::text, 'admin'::text])),
  profile_complete boolean DEFAULT false,
  last_login timestamp with time zone,
  failed_login_attempts integer DEFAULT 0,
  account_locked_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.transfer_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  
  -- Core parties
  patient_wallet text NOT NULL CHECK (patient_wallet ~ '^0x[a-f0-9]{40}$'::text),
  requesting_doctor_wallet text NOT NULL CHECK (requesting_doctor_wallet ~ '^0x[a-f0-9]{40}$'::text),
  source_doctor_wallet text NOT NULL CHECK (source_doctor_wallet ~ '^0x[a-f0-9]{40}$'::text),
  source_organization text,
  requesting_organization text,
  
  -- Request details
  requested_record_ids uuid[],
  snapshot_document_titles text[],
  purpose text NOT NULL CHECK (length(purpose) >= 10),
  urgency text DEFAULT 'routine'::text CHECK (urgency = ANY (ARRAY['routine'::text, 'urgent'::text, 'emergency'::text])),
  document_description text,
  
  -- Two-stage approval workflow
  patient_status text DEFAULT 'pending'::text CHECK (patient_status = ANY (ARRAY['pending'::text, 'approved'::text, 'denied'::text])),
  patient_responded_at timestamp with time zone,
  patient_denial_reason text,
  
  source_status text DEFAULT 'awaiting_upload'::text CHECK (source_status = ANY (ARRAY['awaiting_upload'::text, 'uploaded'::text, 'rejected'::text, 'granted'::text, 'failed'::text])),
  source_responded_at timestamp with time zone,
  source_failure_reason text,
  source_rejection_reason text,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + '14 days'::interval),
  
  CONSTRAINT transfer_requests_pkey PRIMARY KEY (id)
);
ALTER TABLE public.transfer_requests ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- FUNCTIONS
-- ==========================================

CREATE OR REPLACE FUNCTION public.normalize_wallet_address()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.wallet_address = LOWER(NEW.wallet_address);
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_with_supabase_auth(p_wallet_address text, p_auth_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  user_record RECORD;
  needs_profile BOOLEAN DEFAULT FALSE;
BEGIN
  -- Normalize wallet address
  p_wallet_address := LOWER(p_wallet_address);
  
  -- Check if user already exists in our healthcare system
  SELECT * INTO user_record 
  FROM users 
  WHERE wallet_address = p_wallet_address;
  
  IF NOT FOUND THEN
    -- New user - create healthcare profile
    INSERT INTO users (
      auth_user_id,
      wallet_address,
      role,
      profile_complete
    ) VALUES (
      p_auth_user_id,
      p_wallet_address,
      'patient',  -- Default role
      FALSE
    ) RETURNING * INTO user_record;
    
    needs_profile := TRUE;
  ELSE
    -- Existing user - link to Supabase auth if not already linked
    IF user_record.auth_user_id IS NULL THEN
      UPDATE users 
      SET 
        auth_user_id = p_auth_user_id,
        last_login = NOW()
      WHERE id = user_record.id
      RETURNING * INTO user_record;
    ELSE
      -- Update last login
      UPDATE users 
      SET last_login = NOW()
      WHERE id = user_record.id
      RETURNING * INTO user_record;
    END IF;
  END IF;
  
  -- Log authentication
  INSERT INTO audit_logs (
    user_wallet,
    user_role,
    action,
    resource_type,
    resource_id,
    purpose_of_access,
    success
  ) VALUES (
    user_record.wallet_address,
    user_record.role,
    'login',
    'user_profile',
    user_record.id::TEXT,
    'User authentication via Web3',
    TRUE
  );
  
  -- Return user data
  RETURN json_build_object(
    'user', json_build_object(
      'id', user_record.id,
      'auth_user_id', user_record.auth_user_id,
      'wallet_address', user_record.wallet_address,
      'role', user_record.role,
      'full_name', user_record.full_name,
      'email', user_record.email,
      'profile_complete', user_record.profile_complete,
      'needs_profile', needs_profile
    )
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_authenticated_user()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  current_user_id UUID;
  wallet_from_auth TEXT;
  result JSON;
BEGIN
  -- Get current authenticated user
  current_user_id := auth.uid();
  
  -- If no authenticated user, return error
  IF current_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'No authenticated user found',
      'auth_uid', null,
      'wallet_address', null
    );
  END IF;
  
  -- Get wallet address from auth metadata
  SELECT raw_user_meta_data->>'wallet_address' 
  INTO wallet_from_auth
  FROM auth.users 
  WHERE id = current_user_id;
  
  -- If no wallet in auth metadata, return error
  IF wallet_from_auth IS NULL THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'No wallet address found in auth metadata',
      'auth_uid', current_user_id,
      'wallet_address', null
    );
  END IF;
  
  -- Call the existing sync function
  SELECT sync_with_supabase_auth(wallet_from_auth, current_user_id) INTO result;
  
  RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_wallet_from_session_token(p_session_token text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    user_wallet TEXT;
BEGIN
    -- Get wallet from active session
    SELECT wallet_address INTO user_wallet
    FROM user_sessions
    WHERE session_token = p_session_token
    AND active = TRUE
    AND expires_at > NOW()
    LIMIT 1;
    
    RETURN LOWER(user_wallet);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_current_wallet_address()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  wallet_addr TEXT;
BEGIN
  SELECT raw_user_meta_data->>'wallet_address' INTO wallet_addr
  FROM auth.users 
  WHERE id = auth.uid();
  
  RETURN LOWER(wallet_addr);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.ensure_user_registered()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  user_wallet TEXT;
BEGIN
  -- Get wallet address from auth metadata  
  SELECT raw_user_meta_data->>'wallet_address' INTO user_wallet
  FROM auth.users 
  WHERE id = NEW.id;
  
  IF user_wallet IS NOT NULL THEN
    -- Ensure user exists in users table
    INSERT INTO users (auth_user_id, wallet_address, role, email, status, created_at, updated_at)
    VALUES (
      NEW.id,
      LOWER(user_wallet),
      'patient', -- Default role
      NEW.email,
      'active',
      NOW(),
      NOW()
    )
    ON CONFLICT (auth_user_id) DO UPDATE SET
      wallet_address = LOWER(user_wallet),
      email = EXCLUDED.email,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.complete_user_profile(p_user_id uuid, p_full_name text, p_email text, p_phone_number text DEFAULT NULL::text, p_role text DEFAULT 'patient'::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  user_record RECORD;
BEGIN
  -- Update user profile
  UPDATE users 
  SET 
    full_name = p_full_name,
    email = p_email,
    phone_number = p_phone_number,
    role = p_role,
    profile_complete = TRUE,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING * INTO user_record;
  
  -- Create role-specific profile
  IF p_role = 'patient' THEN
    INSERT INTO patient_profiles (user_id) VALUES (p_user_id);
  ELSIF p_role = 'doctor' THEN
    INSERT INTO doctor_profiles (user_id) VALUES (p_user_id);
  END IF;
  
  -- Log profile completion
  INSERT INTO audit_logs (
    user_wallet,
    user_role,
    action,
    resource_type,
    resource_id,
    purpose_of_access,
    success
  ) VALUES (
    user_record.wallet_address,
    user_record.role,
    'profile_update',
    'user_profile',
    user_record.id::TEXT,
    'Profile completion (KYC)',
    TRUE
  );
  
  RETURN json_build_object(
    'success', TRUE,
    'user', json_build_object(
      'id', user_record.id,
      'wallet_address', user_record.wallet_address,
      'role', user_record.role,
      'full_name', user_record.full_name,
      'profile_complete', user_record.profile_complete
    )
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_session_and_get_user(p_session_token text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    session_record RECORD;
    user_record RECORD;
BEGIN
    -- Check if session is valid (matching production schema logic)
    SELECT * INTO session_record
    FROM user_sessions
    WHERE session_token = p_session_token
    AND active = TRUE
    AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid or expired session'
        );
    END IF;
    
    -- Get user information
    SELECT * INTO user_record
    FROM users
    WHERE wallet_address = session_record.wallet_address;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not found'
        );
    END IF;
    
    -- Update last activity
    UPDATE user_sessions 
    SET last_activity = NOW()
    WHERE id = session_record.id;
    
    RETURN json_build_object(
        'success', true,
        'user', json_build_object(
            'id', user_record.id,
            'wallet_address', user_record.wallet_address,
            'email', user_record.email,
            'full_name', user_record.full_name,
            'role', user_record.role
        ),
        'session', json_build_object(
            'id', session_record.id,
            'expires_at', session_record.expires_at
        )
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.insert_health_record_with_session(p_session_token text, p_patient_wallet text, p_title text, p_description text, p_record_type text, p_record_date date, p_file_url text, p_file_hash text, p_original_filename text, p_file_size integer, p_mime_type text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    session_validation JSON;
    user_wallet TEXT;
    new_record_id UUID;
    user_id UUID;
BEGIN
    -- Validate session
    session_validation := validate_session_and_get_user(p_session_token);
    
    IF (session_validation->>'success')::BOOLEAN = FALSE THEN
        RETURN session_validation;
    END IF;
    
    -- Get user wallet from session
    user_wallet := session_validation->'user'->>'wallet_address';
    user_id := (session_validation->'user'->>'id')::UUID;
    
    -- Verify the patient_wallet matches the authenticated user
    IF LOWER(p_patient_wallet) != LOWER(user_wallet) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Patient wallet does not match authenticated user'
        );
    END IF;
    
    -- Insert the health record (bypasses RLS because function is SECURITY DEFINER)
    INSERT INTO health_records (
        patient_wallet,
        title,
        description,
        record_type,
        record_date,
        file_url,
        file_hash,
        original_filename,
        file_size,
        mime_type,
        uploaded_by
    ) VALUES (
        LOWER(p_patient_wallet),
        p_title,
        p_description,
        p_record_type,
        p_record_date,
        p_file_url,
        p_file_hash,
        p_original_filename,
        p_file_size,
        p_mime_type,
        user_id
    ) RETURNING id INTO new_record_id;
    
    RETURN json_build_object(
        'success', true,
        'record_id', new_record_id,
        'message', 'Health record created successfully'
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_wallet_from_auth()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    user_wallet TEXT;
    session_wallet TEXT;
BEGIN
    -- First, try to get from Supabase auth (if exists)
    SELECT LOWER(raw_user_meta_data->>'wallet_address') INTO user_wallet
    FROM auth.users 
    WHERE id = auth.uid();
    
    -- If Supabase auth exists, get from users table
    IF user_wallet IS NOT NULL THEN
        SELECT LOWER(wallet_address) INTO user_wallet
        FROM users
        WHERE auth_user_id = auth.uid()
        LIMIT 1;
        
        RETURN user_wallet;
    END IF;
    
    -- If no Supabase auth, this function won't work with custom sessions
    -- Return NULL to indicate custom session validation needed
    RETURN NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.debug_auth_status()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  current_user_id UUID;
  wallet_from_auth TEXT;
  user_exists_in_users BOOLEAN;
BEGIN
  current_user_id := auth.uid();
  
  -- Get wallet from auth
  SELECT raw_user_meta_data->>'wallet_address' 
  INTO wallet_from_auth
  FROM auth.users 
  WHERE id = current_user_id;
  
  -- Check if user exists in users table
  SELECT EXISTS(
    SELECT 1 FROM users 
    WHERE auth_user_id = current_user_id 
    OR wallet_address = LOWER(wallet_from_auth)
  ) INTO user_exists_in_users;
  
  RETURN json_build_object(
    'auth_uid', current_user_id,
    'wallet_from_auth', wallet_from_auth,
    'user_exists_in_users_table', user_exists_in_users,
    'is_authenticated', current_user_id IS NOT NULL
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.can_access_record(p_doctor_wallet text, p_record_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  record_patient_wallet TEXT;
  has_permission BOOLEAN DEFAULT FALSE;
BEGIN
  -- Return false if doctor wallet is null
  IF p_doctor_wallet IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get the patient wallet for this record
  SELECT patient_wallet INTO record_patient_wallet
  FROM health_records
  WHERE id = p_record_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if doctor has active permission
  SELECT EXISTS(
    SELECT 1 FROM active_permissions 
    WHERE LOWER(doctor_wallet) = LOWER(p_doctor_wallet)
    AND LOWER(patient_wallet) = LOWER(record_patient_wallet)
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
    AND p_record_id = ANY(record_ids)
  ) INTO has_permission;
  
  RETURN has_permission;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.auth_web3_secure(wallet_address text, signature text, message text, nonce text, ip_address text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  user_record RECORD;
  session_token TEXT;
BEGIN
  -- Normalize wallet address
  wallet_address := LOWER(wallet_address);
  
  -- Check if user exists
  SELECT * INTO user_record 
  FROM users 
  WHERE users.wallet_address = auth_web3_secure.wallet_address;
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'User not found');
  END IF;
  
  -- Generate simple session token for development
  session_token := encode(gen_random_bytes(32), 'hex');
  
  -- 🆕 ADD THIS: Save session to user_sessions table
  INSERT INTO user_sessions (
    user_id,
    wallet_address,
    session_token,
    signature_used,
    nonce_used,
    ip_address,
    expires_at,
    user_agent,
    is_mobile,
    active
  ) VALUES (
    user_record.id,
    wallet_address,
    session_token,
    signature,
    nonce,
    ip_address::inet,
    NOW() + INTERVAL '24 hours',
    'Web3 Browser',
    FALSE,
    TRUE
  );
  
  -- Update last login (your original code)
  UPDATE users 
  SET last_login = NOW()
  WHERE id = user_record.id;
  
  -- Return exactly what you had before (your original code)
  RETURN json_build_object(
    'success', TRUE,
    'user', json_build_object(
      'id', user_record.id,
      'wallet_address', user_record.wallet_address,
      'role', user_record.role,
      'full_name', user_record.full_name,
      'profile_complete', user_record.profile_complete
    ),
    'session_token', session_token
  );
END;
$function$
;


-- 1. INVALIDATE SESSION FUNCTION
-- Called during logout to mark session as inactive
CREATE OR REPLACE FUNCTION public.invalidate_session(p_session_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rows_affected INTEGER;
BEGIN
  UPDATE user_sessions 
  SET 
    active = FALSE,
    terminated_reason = 'user_logout',
    last_activity = NOW()
  WHERE session_token = p_session_token
    AND active = TRUE;
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  
  IF rows_affected > 0 THEN
    RETURN json_build_object(
      'success', TRUE,
      'message', 'Session invalidated successfully'
    );
  ELSE
    RETURN json_build_object(
      'success', FALSE,
      'message', 'Session not found or already inactive'
    );
  END IF;
END;
$$;

-- 2. CLEANUP OLD SESSIONS FUNCTION  
-- Can be called manually or via a scheduled job
CREATE OR REPLACE FUNCTION public.cleanup_old_sessions()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete sessions that are:
  -- 1. Expired (past expires_at)
  -- 2. Inactive and older than 7 days
  DELETE FROM user_sessions 
  WHERE expires_at < NOW() 
     OR (active = FALSE AND last_activity < NOW() - INTERVAL '7 days');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN json_build_object(
    'success', TRUE,
    'deleted_count', deleted_count,
    'cleaned_at', NOW()
  );
END;
$$;

-- ==========================================
-- TRIGGERS
-- ==========================================

CREATE TRIGGER normalize_wallet_trigger 
BEFORE INSERT OR UPDATE ON public.users 
FOR EACH ROW EXECUTE FUNCTION normalize_wallet_address();

CREATE TRIGGER update_users_updated_at 
BEFORE UPDATE ON public.users 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Note: This trigger requires permissions on the auth schema
-- CREATE TRIGGER ensure_user_registered_trigger 
-- AFTER INSERT ON auth.users 
-- FOR EACH ROW EXECUTE FUNCTION ensure_user_registered();

-- ==========================================
-- ROW LEVEL SECURITY POLICIES
-- ==========================================

CREATE POLICY "allow_all_access_requests" ON public.access_requests
AS PERMISSIVE FOR ALL
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "allow_all_users" ON public.users
AS PERMISSIVE FOR ALL
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "users_own_data_insert" ON public.users
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK ((auth_user_id = auth.uid()));

CREATE POLICY "users_own_data_select" ON public.users
AS PERMISSIVE FOR SELECT
TO authenticated
USING ((auth_user_id = auth.uid()));

CREATE POLICY "users_own_data_update" ON public.users
AS PERMISSIVE FOR UPDATE
TO authenticated
USING ((auth_user_id = auth.uid()))
WITH CHECK ((auth_user_id = auth.uid()));

CREATE POLICY "doctors_can_select_permitted_records" ON public.health_records
AS PERMISSIVE FOR SELECT
TO public
USING (can_access_record(get_user_wallet_from_auth(), id));

CREATE POLICY "patients_can_insert_own_records" ON public.health_records
AS PERMISSIVE FOR INSERT
TO public
WITH CHECK ((lower(patient_wallet) = get_user_wallet_from_auth()));

CREATE POLICY "patients_can_select_own_records" ON public.health_records
AS PERMISSIVE FOR SELECT
TO public
USING ((lower(patient_wallet) = get_user_wallet_from_auth()));

CREATE POLICY "patients_can_update_own_records" ON public.health_records
AS PERMISSIVE FOR UPDATE
TO public
USING ((lower(patient_wallet) = get_user_wallet_from_auth()))
WITH CHECK ((lower(patient_wallet) = get_user_wallet_from_auth()));

CREATE POLICY "allow_all_doctor_profiles" ON public.doctor_profiles
AS PERMISSIVE FOR ALL
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "allow_all_patient_profiles" ON public.patient_profiles
AS PERMISSIVE FOR ALL
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "own_audit_logs" ON public.audit_logs
AS PERMISSIVE FOR SELECT
TO public
USING ((user_wallet = ( SELECT users.wallet_address
   FROM users
  WHERE (users.auth_user_id = auth.uid()))));

CREATE POLICY "allow_session_operations" ON public.user_sessions
AS PERMISSIVE FOR ALL
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "allow_all_transfer_requests" ON public.transfer_requests
AS PERMISSIVE FOR ALL
TO public
USING (true)
WITH CHECK (true);
