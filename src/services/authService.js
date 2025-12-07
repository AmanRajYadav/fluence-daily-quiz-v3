import { supabase } from './supabase';
import bcrypt from 'bcryptjs';

/**
 * Authentication Service for Fluence Quiz V3
 * Handles student and teacher authentication
 */

// ============================================
// STUDENT AUTHENTICATION
// ============================================

/**
 * Verify class code exists and is active
 */
export const verifyClassCode = async (classCode) => {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        institution:institutions(*),
        teacher:teachers(*)
      `)
      .eq('class_code', classCode.toUpperCase())
      .eq('active', true)
      .single();

    if (error) {
      console.error('[verifyClassCode] Error:', error);
      return { success: false, error: 'Invalid class code' };
    }

    if (!data) {
      return { success: false, error: 'Class code not found' };
    }

    return { success: true, class: data };
  } catch (error) {
    console.error('[verifyClassCode] Exception:', error);
    return { success: false, error: 'Failed to verify class code' };
  }
};

/**
 * Check if username is available in institution
 */
export const checkUsernameAvailability = async (institutionId, username) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('id')
      .eq('institution_id', institutionId)
      .eq('username', username.toLowerCase())
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('[checkUsernameAvailability] Error:', error);
      return { available: false, error: 'Failed to check username' };
    }

    return { available: !data, taken: !!data };
  } catch (error) {
    console.error('[checkUsernameAvailability] Exception:', error);
    return { available: false, error: 'Failed to check username' };
  }
};

/**
 * Register new student
 */
export const registerStudent = async (studentData) => {
  try {
    const { classCode, fullName, username, pin, phoneNumber, email, session } = studentData;

    // 1. Verify class code
    const classVerification = await verifyClassCode(classCode);
    if (!classVerification.success) {
      return classVerification;
    }

    const classData = classVerification.class;
    const institutionId = classData.institution_id;

    // 2. Check username availability
    const usernameCheck = await checkUsernameAvailability(institutionId, username);
    if (!usernameCheck.available) {
      return { success: false, error: 'Username already taken in this institution' };
    }

    // 3. Hash PIN (client-side for now, ideally server-side)
    const pinHash = await bcrypt.hash(pin, 10);

    // 4. Create student record
    const { data: student, error: studentError } = await supabase
      .from('students')
      .insert({
        institution_id: institutionId,
        full_name: fullName,
        username: username.toLowerCase(),
        pin_hash: pinHash,
        phone_number: phoneNumber,
        email: email || null,
        session: session,
        active: true
      })
      .select()
      .single();

    if (studentError) {
      console.error('[registerStudent] Student creation error:', studentError);
      return { success: false, error: 'Failed to create student account' };
    }

    // 5. Enroll student in class
    const { error: enrollmentError } = await supabase
      .from('student_class_enrollments')
      .insert({
        student_id: student.id,
        class_id: classData.id,
        status: 'active'
      });

    if (enrollmentError) {
      console.error('[registerStudent] Enrollment error:', enrollmentError);
      // Student created but enrollment failed - should rollback ideally
      return { success: false, error: 'Failed to enroll in class' };
    }

    // 6. Create session
    const userSession = createStudentSession(student, classData);

    return {
      success: true,
      student,
      class: classData,
      session: userSession
    };
  } catch (error) {
    console.error('[registerStudent] Exception:', error);
    return { success: false, error: 'Registration failed' };
  }
};

/**
 * Student login
 */
export const loginStudent = async (classCode, username, pin) => {
  try {
    // 1. Verify class code
    const classVerification = await verifyClassCode(classCode);
    if (!classVerification.success) {
      return classVerification;
    }

    const classData = classVerification.class;

    // 2. Find student by username in institution
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('institution_id', classData.institution_id)
      .eq('username', username.toLowerCase())
      .eq('active', true)
      .single();

    if (studentError || !student) {
      console.error('[loginStudent] Student not found:', studentError);

      // Log failed attempt
      await logLoginAttempt(username, classCode, false, 'Student not found');

      return { success: false, error: 'Invalid username or PIN' };
    }

    // 3. Verify PIN
    const pinMatch = await bcrypt.compare(pin, student.pin_hash);
    if (!pinMatch) {
      console.error('[loginStudent] PIN mismatch');

      // Log failed attempt
      await logLoginAttempt(username, classCode, false, 'Invalid PIN');

      return { success: false, error: 'Invalid username or PIN' };
    }

    // 4. Check if student is enrolled in this class
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('student_class_enrollments')
      .select('*')
      .eq('student_id', student.id)
      .eq('class_id', classData.id)
      .eq('status', 'active')
      .maybeSingle();

    if (enrollmentError || !enrollment) {
      console.error('[loginStudent] Not enrolled in class:', enrollmentError);
      return { success: false, error: 'You are not enrolled in this class' };
    }

    // 5. Update last login
    await supabase
      .from('students')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', student.id);

    // 6. Log successful attempt
    await logLoginAttempt(username, classCode, true, null);

    // 7. Create session
    const userSession = createStudentSession(student, classData);

    return {
      success: true,
      student,
      class: classData,
      session: userSession
    };
  } catch (error) {
    console.error('[loginStudent] Exception:', error);
    return { success: false, error: 'Login failed' };
  }
};

/**
 * Create student session (stored in localStorage)
 */
const createStudentSession = (student, classData) => {
  const session = {
    user_id: student.id,
    user_type: 'student',
    username: student.username,
    full_name: student.full_name,
    institution_id: student.institution_id,
    class_id: classData.id,
    class_code: classData.class_code,
    class_name: classData.class_name,
    session: student.session,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
  };

  // Save to localStorage
  localStorage.setItem('fluence_session', JSON.stringify(session));

  return session;
};

/**
 * Log login attempt for rate limiting
 */
const logLoginAttempt = async (identifier, classCode, success, failureReason) => {
  try {
    await supabase
      .from('login_attempts')
      .insert({
        identifier,
        class_code: classCode,
        success,
        failure_reason: failureReason
      });
  } catch (error) {
    console.error('[logLoginAttempt] Failed to log:', error);
  }
};

/**
 * Check rate limiting (3 attempts per 15 minutes)
 */
export const checkRateLimit = async (username, classCode) => {
  try {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('login_attempts')
      .select('*')
      .eq('identifier', username)
      .eq('class_code', classCode)
      .eq('success', false)
      .gte('attempted_at', fifteenMinutesAgo);

    if (error) {
      console.error('[checkRateLimit] Error:', error);
      return { allowed: true }; // Allow on error (fail open)
    }

    const failedAttempts = data?.length || 0;

    if (failedAttempts >= 3) {
      return {
        allowed: false,
        message: 'Too many failed attempts. Please try again in 15 minutes.',
        retryAfter: 15 * 60
      };
    }

    return { allowed: true, failedAttempts };
  } catch (error) {
    console.error('[checkRateLimit] Exception:', error);
    return { allowed: true }; // Allow on error
  }
};

// ============================================
// TEACHER AUTHENTICATION
// ============================================

/**
 * Teacher login
 */
export const loginTeacher = async (email, password) => {
  try {
    // 1. Find teacher by email
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select(`
        *,
        institution:institutions(*)
      `)
      .eq('email', email.toLowerCase())
      .eq('active', true)
      .single();

    if (teacherError || !teacher) {
      console.error('[loginTeacher] Teacher not found:', teacherError);

      // Log failed attempt
      await logLoginAttempt(email, null, false, 'Teacher not found');

      return { success: false, error: 'Invalid email or password' };
    }

    // 2. Verify password
    const passwordMatch = await bcrypt.compare(password, teacher.password_hash);
    if (!passwordMatch) {
      console.error('[loginTeacher] Password mismatch');

      // Log failed attempt
      await logLoginAttempt(email, null, false, 'Invalid password');

      return { success: false, error: 'Invalid email or password' };
    }

    // 3. Update last login
    await supabase
      .from('teachers')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', teacher.id);

    // 4. Log successful attempt
    await logLoginAttempt(email, null, true, null);

    // 5. Create session
    const session = createTeacherSession(teacher);

    return {
      success: true,
      teacher,
      session
    };
  } catch (error) {
    console.error('[loginTeacher] Exception:', error);
    return { success: false, error: 'Login failed' };
  }
};

/**
 * Create teacher session
 */
const createTeacherSession = (teacher) => {
  const session = {
    user_id: teacher.id,
    user_type: 'teacher',
    email: teacher.email,
    full_name: teacher.full_name,
    role: teacher.role,
    institution_id: teacher.institution_id,
    institution_name: teacher.institution?.name,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
  };

  // Save to localStorage
  localStorage.setItem('fluence_session', JSON.stringify(session));

  return session;
};

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * Get current session from localStorage
 */
export const getCurrentSession = () => {
  try {
    const sessionStr = localStorage.getItem('fluence_session');
    if (!sessionStr) return null;

    const session = JSON.parse(sessionStr);

    // Check if expired
    if (new Date(session.expires_at) < new Date()) {
      localStorage.removeItem('fluence_session');
      return null;
    }

    return session;
  } catch (error) {
    console.error('[getCurrentSession] Error:', error);
    return null;
  }
};

/**
 * Logout (clear session)
 */
export const logout = () => {
  localStorage.removeItem('fluence_session');
  window.location.href = '/'; // Redirect to landing page
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return getCurrentSession() !== null;
};

/**
 * Check if user is student
 */
export const isStudent = () => {
  const session = getCurrentSession();
  return session?.user_type === 'student';
};

/**
 * Check if user is teacher
 */
export const isTeacher = () => {
  const session = getCurrentSession();
  return session?.user_type === 'teacher';
};

/**
 * Check if user is admin (aman@fluence.ac)
 */
export const isAdmin = () => {
  const session = getCurrentSession();
  return session?.user_type === 'teacher' && session?.email === 'aman@fluence.ac';
};
