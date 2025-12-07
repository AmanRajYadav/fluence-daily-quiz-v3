-- ============================================
-- FIX TEACHER PASSWORD HASH
-- ============================================
-- Purpose: Update teacher password hash to correct bcrypt hash for "aman@123"
-- Run this in Supabase SQL Editor
-- ============================================

UPDATE teachers
SET password_hash = '$2b$10$lwad2CwpE.8Nx4i5XyInGOfyA9jR58uBNchScX4PbiYxbeK2bNk66'
WHERE email = 'aman@fluence.ac';

-- Verify update
SELECT
  'Teacher password updated' as status,
  email,
  full_name,
  role,
  updated_at
FROM teachers
WHERE email = 'aman@fluence.ac';
