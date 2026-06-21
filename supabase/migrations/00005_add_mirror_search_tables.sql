
-- search_results 表
CREATE TABLE IF NOT EXISTS search_results (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id uuid REFERENCES reports(id) ON DELETE CASCADE,
  platform text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending | searching | completed | limited | failed
  results_count integer DEFAULT 0,
  results_data jsonb DEFAULT '[]'::jsonb,
  search_query text,
  created_at timestamptz DEFAULT now()
);

-- uploaded_files 表
CREATE TABLE IF NOT EXISTS uploaded_files (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id uuid REFERENCES reports(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_size integer,
  storage_path text NOT NULL,
  extracted_text text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE search_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "search_results_select_own" ON search_results
  FOR SELECT USING (
    report_id IN (SELECT id FROM reports WHERE user_id = auth.uid())
  );
CREATE POLICY "search_results_insert_service" ON search_results
  FOR INSERT WITH CHECK (true);
CREATE POLICY "search_results_update_service" ON search_results
  FOR UPDATE USING (true);

CREATE POLICY "uploaded_files_select_own" ON uploaded_files
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "uploaded_files_insert_own" ON uploaded_files
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "uploaded_files_update_own" ON uploaded_files
  FOR UPDATE USING (user_id = auth.uid());

-- Storage bucket for PDF uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('mirror-pdfs', 'mirror-pdfs', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "mirror_pdfs_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'mirror-pdfs' AND auth.uid() IS NOT NULL);
CREATE POLICY "mirror_pdfs_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'mirror-pdfs' AND auth.uid() IS NOT NULL);
CREATE POLICY "mirror_pdfs_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'mirror-pdfs' AND auth.uid() = owner);
