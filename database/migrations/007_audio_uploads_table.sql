/**
 * Migration: Add audio_uploads Table
 * Purpose: Track class audio uploads and session metadata for SRS system
 * Date: November 19, 2025
 *
 * This table stores information about uploaded class audio files and their processing status.
 * Critical for SRS (Spaced Repetition System) to determine "when concept was first taught"
 */

-- Create audio_uploads table
CREATE TABLE IF NOT EXISTS audio_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign keys
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,  -- NULL for group classes

  -- File metadata
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size_mb DECIMAL(10, 2),

  -- Session metadata (CRITICAL for SRS - "when concept was taught")
  upload_date DATE NOT NULL,
  class_time TIME NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('group', 'personal')),

  -- Processing status
  uploaded_by UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  questions_generated INT DEFAULT 0,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_audio_uploads_class ON audio_uploads(class_id);
CREATE INDEX IF NOT EXISTS idx_audio_uploads_student ON audio_uploads(student_id) WHERE student_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audio_uploads_date ON audio_uploads(upload_date);
CREATE INDEX IF NOT EXISTS idx_audio_uploads_institution ON audio_uploads(institution_id);
CREATE INDEX IF NOT EXISTS idx_audio_uploads_status ON audio_uploads(processing_status);

-- Add comments for documentation
COMMENT ON TABLE audio_uploads IS 'Tracks class audio uploads and session metadata for SRS system';
COMMENT ON COLUMN audio_uploads.upload_date IS 'Date of class session - used by SRS to determine when concept was first taught';
COMMENT ON COLUMN audio_uploads.session_type IS 'Group class (student_id IS NULL) or personal session (student_id IS UUID)';
COMMENT ON COLUMN audio_uploads.processing_status IS 'pending → processing → completed (or failed)';
COMMENT ON COLUMN audio_uploads.questions_generated IS 'Count of quiz questions generated from this audio (typically 30)';

-- Enable Row Level Security (RLS)
ALTER TABLE audio_uploads ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Teachers can view uploads from their institution
CREATE POLICY audio_uploads_teacher_select ON audio_uploads
  FOR SELECT
  USING (
    institution_id IN (
      SELECT institution_id
      FROM teachers
      WHERE id = auth.uid()
    )
  );

-- RLS Policy: Teachers can insert uploads to their institution
CREATE POLICY audio_uploads_teacher_insert ON audio_uploads
  FOR INSERT
  WITH CHECK (
    institution_id IN (
      SELECT institution_id
      FROM teachers
      WHERE id = auth.uid()
    )
  );

-- RLS Policy: Teachers can update uploads from their institution
CREATE POLICY audio_uploads_teacher_update ON audio_uploads
  FOR UPDATE
  USING (
    institution_id IN (
      SELECT institution_id
      FROM teachers
      WHERE id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_audio_uploads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_audio_uploads_updated_at ON audio_uploads;
CREATE TRIGGER trigger_audio_uploads_updated_at
  BEFORE UPDATE ON audio_uploads
  FOR EACH ROW
  EXECUTE FUNCTION update_audio_uploads_updated_at();
