/**
 * n8n Code Node: Prepare Transcription Prompt
 *
 * Purpose: Build dynamic prompt for Gemini transcription based on session type
 *
 * Input: Webhook data + Gemini file URI
 * Output: Formatted prompt for transcription
 */

const webhookData = $('Webhook').first().json;
const geminiFile = $('Upload to Gemini File API').first().json;
const fileUri = geminiFile.file?.uri || geminiFile.file?.name;

console.log('[Transcription Prompt] Building prompt for:', webhookData.metadata.session_type);

// Base transcription requirements
const basePrompt = `Transcribe this English class recording in detail with maximum accuracy.

CRITICAL REQUIREMENTS:
1. **Speaker Labels**: Identify and label all speakers clearly
   - Teacher/Instructor (main speaker)
   - Student1, Student2, etc. (for student questions/answers)

2. **Timestamps**: Add timestamps at major topic changes
   - Format: [HH:MM:SS]
   - Mark beginning of new concepts/topics

3. **Formatting**:
   - Clear paragraph breaks for different concepts
   - Proper punctuation and grammar
   - Preserve technical terms exactly as spoken
   - Use bullet points for lists when appropriate

4. **Content Accuracy**: This transcript will be used to generate quiz questions, so:
   - Preserve ALL key concepts and definitions
   - Include ALL examples given by the teacher
   - Include ALL questions asked by students
   - Include ALL answers/explanations provided
   - Do NOT summarize or condense content
   - Do NOT skip technical details

5. **Structure**:
   - Start with brief topic heading if clear from intro
   - Organize by concepts/topics discussed
   - Keep related content together

FOCUS ON:
- Key concepts and definitions
- Examples and applications
- Common mistakes or misconceptions mentioned
- Important facts, dates, formulas, or rules
- Student questions and teacher responses

AVOID:
- Summarizing (give full detail)
- Removing repetitions (reinforcement is important)
- Correcting the teacher's teaching style (preserve authenticity)
`;

// Session-specific additions
let sessionSpecific = '';

if (webhookData.metadata.session_type === 'group') {
  sessionSpecific = `\n\nNOTE: This is a GROUP CLASS recording with multiple students.
- Pay special attention to different student voices
- Label students as Student1, Student2, etc. (in order of first speech)
- Include ALL student interactions and questions
`;
} else if (webhookData.metadata.session_type === 'personal') {
  sessionSpecific = `\n\nNOTE: This is a PERSONAL TUTORING session (one-on-one).
- Label speakers as: Teacher and Student
- Pay special attention to personalized explanations
- Include the student's specific difficulties or questions
`;
}

// Class context (if available)
const classInfo = webhookData.metadata.class_id ?
  `\n\nCLASS: ${webhookData.metadata.class_id}` : '';

const dateInfo = webhookData.metadata.class_date ?
  `\nDATE: ${webhookData.metadata.class_date}` : '';

// Combine full prompt
const fullPrompt = basePrompt + sessionSpecific + classInfo + dateInfo;

// Prepare request body for Gemini API
const requestBody = {
  contents: [{
    parts: [
      {
        fileData: {
          mimeType: 'audio/mpeg',
          fileUri: fileUri
        }
      },
      {
        text: fullPrompt
      }
    ]
  }],
  generationConfig: {
    temperature: 0.1,  // Low temperature for factual accuracy
    maxOutputTokens: 65536,  // Max for Gemini 2.0 Flash (handle long transcripts)
    topP: 0.95,
    topK: 40
  }
};

console.log('[Transcription Prompt] Prompt length:', fullPrompt.length, 'characters');
console.log('[Transcription Prompt] File URI:', fileUri);

return [{
  json: {
    request_body: requestBody,
    prompt: fullPrompt,
    file_uri: fileUri,
    upload_id: webhookData.upload_id
  }
}];
