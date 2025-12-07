-- ============================================
-- FLUENCE QUIZ V3 - MIGRATE V2 STUDENTS
-- ============================================
-- Migration: 003_migrate_v2_students.sql
-- Created: 2025-10-27
-- Purpose: Migrate existing v2 students (Anaya, Kavya) to v3 schema
-- ============================================

-- ⚠️ RUN THIS ONLY IF:
-- 1. You have v3 schema already applied (001_initial_schema.sql)
-- 2. You have institution and class created (002_seed_fluence_institution.sql)
-- 3. You have existing v2 students to migrate

-- ============================================
-- MIGRATION SCRIPT
-- ============================================

DO $$
DECLARE
  fluence_institution_id UUID;
  class6_id UUID;
  anaya_student_id UUID;
  kavya_student_id UUID;
  anaya_old_id TEXT := '98825c00-fb8f-46dc-bec7-3cdd8880efea'; -- Replace with actual v2 student_id if different
BEGIN
  -- ============================================
  -- Step 1: Get Institution and Class IDs
  -- ============================================

  SELECT id INTO fluence_institution_id
  FROM institutions
  WHERE code = 'FLUENCE';

  IF fluence_institution_id IS NULL THEN
    RAISE EXCEPTION 'Institution FLUENCE not found. Run 002_seed_fluence_institution.sql first!';
  END IF;

  SELECT id INTO class6_id
  FROM classes
  WHERE class_code = 'FLUENCE-CLASS6-2025';

  IF class6_id IS NULL THEN
    RAISE EXCEPTION 'Class FLUENCE-CLASS6-2025 not found. Run 002_seed_fluence_institution.sql first!';
  END IF;

  RAISE NOTICE 'Institution ID: %', fluence_institution_id;
  RAISE NOTICE 'Class 6 ID: %', class6_id;

  -- ============================================
  -- Step 2: Create Student - Anaya
  -- ============================================

  -- Check if Anaya already exists in v3
  SELECT id INTO anaya_student_id
  FROM students
  WHERE institution_id = fluence_institution_id
    AND username = 'anaya';

  IF anaya_student_id IS NULL THEN
    -- Create new student
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
      NULL, -- Add parent email if available
      '2025-26',
      true,
      false,
      true
    ) RETURNING id INTO anaya_student_id;

    RAISE NOTICE '✅ Anaya created - ID: %', anaya_student_id;
  ELSE
    RAISE NOTICE 'ℹ️  Anaya already exists - ID: %', anaya_student_id;
  END IF;

  -- ============================================
  -- Step 3: Enroll Anaya in Class 6
  -- ============================================

  -- Check if already enrolled
  IF NOT EXISTS (
    SELECT 1 FROM student_class_enrollments
    WHERE student_id = anaya_student_id AND class_id = class6_id
  ) THEN
    INSERT INTO student_class_enrollments (
      student_id,
      class_id,
      status
    ) VALUES (
      anaya_student_id,
      class6_id,
      'active'
    );
    RAISE NOTICE '✅ Anaya enrolled in Class 6';
  ELSE
    RAISE NOTICE 'ℹ️  Anaya already enrolled in Class 6';
  END IF;

  -- ============================================
  -- Step 4: Create Student - Kavya
  -- ============================================

  -- Check if Kavya already exists
  SELECT id INTO kavya_student_id
  FROM students
  WHERE institution_id = fluence_institution_id
    AND username = 'kavya';

  IF kavya_student_id IS NULL THEN
    -- Create new student
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
      NULL, -- Add parent email if available
      '2025-26',
      true,
      false,
      true
    ) RETURNING id INTO kavya_student_id;

    RAISE NOTICE '✅ Kavya created - ID: %', kavya_student_id;
  ELSE
    RAISE NOTICE 'ℹ️  Kavya already exists - ID: %', kavya_student_id;
  END IF;

  -- ============================================
  -- Step 5: Enroll Kavya in Class 6
  -- ============================================

  -- Check if already enrolled
  IF NOT EXISTS (
    SELECT 1 FROM student_class_enrollments
    WHERE student_id = kavya_student_id AND class_id = class6_id
  ) THEN
    INSERT INTO student_class_enrollments (
      student_id,
      class_id,
      status
    ) VALUES (
      kavya_student_id,
      class6_id,
      'active'
    );
    RAISE NOTICE '✅ Kavya enrolled in Class 6';
  ELSE
    RAISE NOTICE 'ℹ️  Kavya already enrolled in Class 6';
  END IF;

END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify students created and enrolled
SELECT
  s.username,
  s.full_name,
  s.phone_number,
  s.session,
  s.active,
  i.name as institution,
  c.class_name,
  c.class_code,
  e.status as enrollment_status,
  e.joined_at
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
  RAISE NOTICE 'STUDENT MIGRATION COMPLETED!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Students created and enrolled in Class 6';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Student Credentials:';
  RAISE NOTICE '   • Anaya - Username: anaya, PIN: 1234';
  RAISE NOTICE '   • Kavya - Username: kavya, PIN: 1234';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Login Flow (Student):';
  RAISE NOTICE '   1. Class Code: FLUENCE-CLASS6-2025';
  RAISE NOTICE '   2. Username: anaya (or kavya)';
  RAISE NOTICE '   3. PIN: 1234';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Next Steps:';
  RAISE NOTICE '   1. Update frontend with new login flow';
  RAISE NOTICE '   2. Update n8n workflow with class_id';
  RAISE NOTICE '   3. Test student login';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
END $$;
