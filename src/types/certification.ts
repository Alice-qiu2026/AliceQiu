export type CertificationLevel = 'basic' | 'standard' | 'gold';
export type CertificationStatus = 'pending' | 'ai_review' | 'manual_review' | 'approved' | 'rejected';

export interface CertificationApplication {
  id: string;
  user_id: string;
  level: CertificationLevel;
  full_name: string;
  id_type: 'passport' | 'id_card';
  id_number: string;
  marital_status: 'single' | 'married' | 'divorced' | 'widowed' | null;
  relationship_questionnaire: string | null;
  voice_note_url: string | null;
  id_document_url: string | null;
  marriage_certificate_url: string | null;
  asset_proof_url: string | null;
  no_crime_record_url: string | null;
  status: CertificationStatus;
  ai_review_result: Record<string, unknown> | null;
  admin_note: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}
