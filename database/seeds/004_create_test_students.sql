-- ============================================
-- FLUENCE QUIZ V3 - CREATE TEST STUDENTS
-- ============================================
-- Seed: 004_create_test_students.sql
-- Created: 2025-10-27
-- Purpose: Create fresh test students (Anaya, Kavya) for workflow testing
-- ============================================

-- ⚠️ RUN THIS AFTER:
-- 1. 001_initial_schema.sql (creates tables)
-- 2. 002_seed_fluence_institution.sql (creates institution + teacher + class)

-- ============================================
-- CREATE TEST STUDENTS
-- ============================================

DO $$
DECLARE
  -- 🎯 ACTUAL IDs FROM VERIFICATION RESULTS
  fluence_institution_id UUID := 'e5dd424c-3bdb-4671-842c-a9c5b6c8495d';  -- FLUENCE institution
  class6_id UUID := '6ac05c62-da19-4c28-a09d-f6295c660ca2';               -- FLUENCE-CLASS6-2025 class
  anaya_student_id UUID;
  kavya_student_id UUID;
BEGIN
  -- IDs are hardcoded from verification results, no need to check

  -- ============================================
  -- Create Student 1: Anaya
  -- ============================================

  INSERT INTO students (
    institution_id,
    full_name,
    username,
    pin_hash,
    phone_number,
    parent_email,
    session,
    active,
    email_verified,
    phone_verified
  ) VALUES (
    fluence_institution_id,
    'Anaya',
    'anaya',
    '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', -- bcrypt hash of "1234"
    '+917999502978',
    NULL, -- Add parent email if you want
    '2025-26',
    true,
    false,
    true
  )
  ON CONFLICT (institution_id, username) DO UPDATE
    SET full_name = EXCLUDED.full_name
  RETURNING id INTO anaya_student_id;

  RAISE NOTICE '✅ Anaya created/updated - ID: %', anaya_student_id;

  -- Enroll Anaya in Class 6
  INSERT INTO student_class_enrollments (student_id, class_id, status)
  VALUES (anaya_student_id, class6_id, 'active')
  ON CONFLICT (student_id, class_id) DO NOTHING;

  RAISE NOTICE '✅ Anaya enrolled in Class 6';

  -- ============================================
  -- Create Student 2: Kavya
  -- ============================================

  INSERT INTO students (
    institution_id,
    full_name,
    username,
    pin_hash,
    phone_number,
    parent_email,
    session,
    active,
    email_verified,
    phone_verified
  ) VALUES (
    fluence_institution_id,
    'Kavya',
    'kavya',
    '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', -- bcrypt hash of "1234"
    '+917999502978',
    NULL, -- Add parent email if you want
    '2025-26',
    true,
    false,
    true
  )
  ON CONFLICT (institution_id, username) DO UPDATE
    SET full_name = EXCLUDED.full_name
  RETURNING id INTO kavya_student_id;

  RAISE NOTICE '✅ Kavya created/updated - ID: %', kavya_student_id;

  -- Enroll Kavya in Class 6
  INSERT INTO student_class_enrollments (student_id, class_id, status)
  VALUES (kavya_student_id, class6_id, 'active')
  ON CONFLICT (student_id, class_id) DO NOTHING;

  RAISE NOTICE '✅ Kavya enrolled in Class 6';

END $$;

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify students created and enrolled
SELECT
  s.id,
  s.username,
  s.full_name,
  s.phone_number,
  i.name as institution,
  c.class_name,
  c.class_code,
  e.status as enrollment_status
FROM students s
JOIN institutions i ON s.institution_id = i.id
JOIN student_class_enrollments e ON s.id = e.student_id
JOIN classes c ON e.class_id = c.id
WHERE s.username IN ('anaya', 'kavya')
ORDER BY s.username;

-- ============================================
-- SUMMARY
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'TEST STUDENTS CREATED!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Student Credentials:';
  RAISE NOTICE '   • Anaya - Username: anaya, PIN: 1234';
  RAISE NOTICE '   • Kavya - Username: kavya, PIN: 1234';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Login Flow:';
  RAISE NOTICE '   1. Class Code: FLUENCE-CLASS6-2025';
  RAISE NOTICE '   2. Username: anaya (or kavya)';
  RAISE NOTICE '   3. PIN: 1234';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Ready to test n8n workflow!';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
END $$;
