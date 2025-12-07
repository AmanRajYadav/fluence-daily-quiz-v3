// FIXED DATA PROCESSING - Correct UUID mapping
// Extract transcription from webhook
const webhookData = $input.first().json;
const transcription = webhookData.body?.transcription || webhookData.transcription;
const metadata = webhookData.body?.metadata || webhookData.metadata || {};

// Extract student information
const studentName = metadata.student_name || 'Unknown Student';
const filename = metadata.filename || 'unknown_file.txt';
const processedDate = metadata.processed_date || new Date().toISOString();

// FIXED: Map to actual Supabase UUIDs
const getStudentId = (name) => {
  const nameLower = name.toLowerCase().trim();

  switch(nameLower) {
    case 'anaya':
      return '98825c00-fb8f-46dc-bec7-3cdd8880efea';
    case 'kavya':
      return '1d7b1b8a-6f8f-419b-be99-18baeb1dd9f7';
    case 'user':
      return 'afe01cd6-b3ac-461e-b8cb-3ef6ef8ef0b1';
    default:
      console.log(`⚠️ Unknown student: ${name}, using Anaya UUID as default`);
      return '98825c00-fb8f-46dc-bec7-3cdd8880efea';
  }
};

const studentId = getStudentId(studentName);

console.log('=== DATA PROCESSING ===');
console.log('Student Name:', studentName);
console.log('Student UUID:', studentId);
console.log('Filename:', filename);
console.log('Transcription Length:', transcription?.length || 0);

return [{
  json: {
    transcription: transcription,
    timestamp: processedDate,
    student_id: studentId,  // UUID for database
    student_name: studentName,
    filename: filename,
    processed_date: processedDate
  }
}];
