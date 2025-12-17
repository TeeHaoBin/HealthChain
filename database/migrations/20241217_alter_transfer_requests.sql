-- Migration: Alter transfer_requests table for revised workflow
-- Flow: Doctor B (requester) → Doctor A (provider uploads) → Patient (approves) → Doctor B (views)

-- Add document description field (what document is being requested)
ALTER TABLE public.transfer_requests 
ADD COLUMN IF NOT EXISTS document_description text;

-- Add provider rejection reason field
ALTER TABLE public.transfer_requests 
ADD COLUMN IF NOT EXISTS source_rejection_reason text;

-- Update source_status constraint to include new states
-- New states: awaiting_upload, uploaded, rejected, granted, failed
ALTER TABLE public.transfer_requests 
DROP CONSTRAINT IF EXISTS transfer_requests_source_status_check;

ALTER TABLE public.transfer_requests 
ADD CONSTRAINT transfer_requests_source_status_check 
CHECK (source_status IN ('awaiting_upload', 'uploaded', 'rejected', 'granted', 'failed'));

-- Update default value for source_status
ALTER TABLE public.transfer_requests 
ALTER COLUMN source_status SET DEFAULT 'awaiting_upload';

-- Update any existing records with old status values
UPDATE public.transfer_requests 
SET source_status = 'awaiting_upload' 
WHERE source_status = 'awaiting_patient';

UPDATE public.transfer_requests 
SET source_status = 'awaiting_upload' 
WHERE source_status = 'pending';

-- Add index for document_description searches (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_transfer_requests_document_description 
ON public.transfer_requests USING gin(to_tsvector('english', document_description));
