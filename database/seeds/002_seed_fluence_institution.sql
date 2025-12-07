-- ============================================
-- FLUENCE QUIZ V3 - SEED DATA
-- ============================================
-- Seed: 002_seed_fluence_institution.sql
-- Created: 2025-10-27
-- Purpose: Create Fluence institution, teacher account, and Class 6
-- ============================================

-- ============================================
-- 1. CREATE FLUENCE INSTITUTION
-- ============================================

INSERT INTO institutions (code, name, owner_email, subscription_status)
VALUES (
  'FLUENCE',
  'Fluence',
  'aman@fluence.ac',
  'active'
)
RETURNING id, code, name;

-- Store institution_id for use in subsequent inserts
DO $$
DECLARE
  fluence_institution_id UUID;
  aman_teacher_id UUID;
  class6_id UUID;
BEGIN
  -- Get Fluence institution ID
  SELECT id INTO fluence_institution_id
  FROM institutions
  WHERE code = 'FLUENCE';

  RAISE NOTICE 'Fluence Institution ID: %', fluence_institution_id;

  -- ============================================
  -- 2. CREATE TEACHER ACCOUNT (Aman Raj Yadav)
  -- ============================================

  -- Password: Create a temporary password hash for "aman@123"
  -- You'll need to change this on first login
  -- Using bcrypt hash for "aman@123"
  INSERT INTO teachers (
    institution_id,
    email,
    password_hash,
    full_name,
    phone_number,
    role,
    active,
    email_verified
  )
  VALUES (
    fluence_institution_id,
    'aman@fluence.ac',
    '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', -- bcrypt hash of "aman@123"
    'Aman Raj Yadav',
    '+917999502978',
    'admin',
    true,
    true
  )
  RETURNING id INTO aman_teacher_id;

  RAISE NOTICE 'Teacher Account Created - ID: %', aman_teacher_id;
  RAISE NOTICE 'Email: aman@fluence.ac';
  RAISE NOTICE 'Temporary Password: aman@123 (CHANGE ON FIRST LOGIN!)';

  -- ============================================
  -- 3. CREATE CLASS 6 (2025-26 Session)
  -- ============================================

  INSERT INTO classes (
    institution_id,
    teacher_id,
    class_code,
    class_name,
    session,
    subject,
    description,
    active,
    max_students
  )
  VALUES (
    fluence_institution_id,
    aman_teacher_id,
    'FLUENCE-CLASS6-2025',
    'Class 6',
    '2025-26',
    'General',
    'Class 6 comprehensive learning program for 2025-26 academic session',
    true,
    100
  )
  RETURNING id INTO class6_id;

  RAISE NOTICE 'Class 6 Created - ID: %', class6_id;
  RAISE NOTICE 'Class Code: FLUENCE-CLASS6-2025';
  RAISE NOTICE 'Students can use this code to join the class';

END $$;

-- ============================================
-- 4. VERIFICATION QUERIES
-- ============================================

-- Verify institution created
SELECT
  'Institution' as entity,
  id,
  code,
  name,
  owner_email,
  subscription_status,
  created_at
FROM institutions
WHERE code = 'FLUENCE';

-- Verify teacher created
SELECT
  'Teacher' as entity,
  t.id,
  t.email,
  t.full_name,
  t.phone_number,
  t.role,
  t.active,
  i.code as institution_code
FROM teachers t
JOIN institutions i ON t.institution_id = i.id
WHERE t.email = 'aman@fluence.ac';

-- Verify class created
SELECT
  'Class' as entity,
  c.id,
  c.class_code,
  c.class_name,
  c.session,
  c.subject,
  c.active,
  c.max_students,
  t.full_name as teacher_name,
  i.code as institution_code
FROM classes c
JOIN institutions i ON c.institution_id = i.id
JOIN teachers t ON c.teacher_id = t.id
WHERE c.class_code = 'FLUENCE-CLASS6-2025';

-- ============================================
-- 5. SUMMARY
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'SEED DATA COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Institution: Fluence (Code: FLUENCE)';
  RAISE NOTICE '✅ Teacher: Aman Raj Yadav (aman@fluence.ac)';
  RAISE NOTICE '✅ Temporary Password: aman@123';
  RAISE NOTICE '✅ Class: Class 6 (FLUENCE-CLASS6-2025)';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Next Steps:';
  RAISE NOTICE '1. Login as teacher: aman@fluence.ac / aman@123';
  RAISE NOTICE '2. Change password on first login';
  RAISE NOTICE '3. Share class code with students: FLUENCE-CLASS6-2025';
  RAISE NOTICE '4. Students register at: fluence.ac (coming soon)';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
END $$;
