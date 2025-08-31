-- Create storage bucket for deal attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'deal-attachments',
  'deal-attachments',
  true,
  10485760, -- 10MB limit
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies for deal attachments
CREATE POLICY "Users can upload attachments for their own deals" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'deal-attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view attachments for their own deals" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'deal-attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update attachments for their own deals" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'deal-attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete attachments for their own deals" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'deal-attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admin policies
CREATE POLICY "Admins can manage all attachments" ON storage.objects
  FOR ALL USING (
    bucket_id = 'deal-attachments' AND
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.role = 'admin'
    )
  );
