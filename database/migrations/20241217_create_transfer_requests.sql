-- Migration: Create transfer_requests table for doctor-to-doctor transfers
-- This table is completely isolated from the existing access_requests table
-- Date: 2024-12-17

-- Create new transfer_requests table
CREATE TABLE IF NOT EXISTS public.transfer_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  
  -- Core parties
  patient_wallet text NOT NULL CHECK (patient_wallet ~ '^0x[a-f0-9]{40}$'::text),
  requesting_doctor_wallet text NOT NULL CHECK (requesting_doctor_wallet ~ '^0x[a-f0-9]{40}$'::text),
  source_doctor_wallet text NOT NULL CHECK (source_doctor_wallet ~ '^0x[a-f0-9]{40}$'::text),
  source_organization text,
  
  -- Request details
  requested_record_ids uuid[],
  snapshot_document_titles text[],
  purpose text NOT NULL CHECK (length(purpose) >= 10),
  urgency text DEFAULT 'routine'::text CHECK (urgency = ANY (ARRAY['routine'::text, 'urgent'::text, 'emergency'::text])),
  
  -- Two-stage approval workflow
  patient_status text DEFAULT 'pending'::text CHECK (patient_status = ANY (ARRAY['pending'::text, 'approved'::text, 'denied'::text])),
  patient_responded_at timestamp with time zone,
  patient_denial_reason text,
  
  source_status text DEFAULT 'awaiting_patient'::text CHECK (source_status = ANY (ARRAY['awaiting_patient'::text, 'pending'::text, 'granted'::text, 'failed'::text])),
  source_responded_at timestamp with time zone,
  source_failure_reason text,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + '14 days'::interval),
  
  CONSTRAINT transfer_requests_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.transfer_requests ENABLE ROW LEVEL SECURITY;

-- Simple permissive policy (matches existing access_requests pattern)
CREATE POLICY "allow_all_transfer_requests" ON public.transfer_requests
AS PERMISSIVE FOR ALL TO public
USING (true) WITH CHECK (true);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_transfer_requests_patient ON public.transfer_requests(patient_wallet);
CREATE INDEX IF NOT EXISTS idx_transfer_requests_requesting_doctor ON public.transfer_requests(requesting_doctor_wallet);
CREATE INDEX IF NOT EXISTS idx_transfer_requests_source_doctor ON public.transfer_requests(source_doctor_wallet);
CREATE INDEX IF NOT EXISTS idx_transfer_requests_patient_status ON public.transfer_requests(patient_status);
CREATE INDEX IF NOT EXISTS idx_transfer_requests_source_status ON public.transfer_requests(source_status);

-- Comment for documentation
COMMENT ON TABLE public.transfer_requests IS 'Doctor-to-doctor health record transfer requests with two-stage patient consent workflow';
