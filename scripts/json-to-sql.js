#!/usr/bin/env node

/**
 * JSON to SQL Converter for Quiz Questions
 *
 * Converts AI-generated question JSON to Supabase SQL INSERT statements
 *
 * Usage:
 *   node scripts/json-to-sql.js <json-file> <student-uuid>
 *
 * Example:
 *   node scripts/json-to-sql.js manual-questions/questions-anaya-2025-10-05.json 98825c00-fb8f-46dc-bec7-3cdd8880efea
 */

const fs = require('fs');
const path = require('path');

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('❌ Error: Missing arguments\n');
  console.log('Usage: node scripts/json-to-sql.js <json-file> <student-uuid>\n');
  console.log('Example:');
  console.log('  node scripts/json-to-sql.js manual-questions/questions-anaya-2025-10-05.json 98825c00-fb8f-46dc-bec7-3cdd8880efea\n');
  process.exit(1);
}

const jsonFilePath = args[0];
const studentUuid = args[1];

// Validate UUID format
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!uuidRegex.test(studentUuid)) {
  console.error(`❌ Error: Invalid UUID format: ${studentUuid}\n`);
  console.log('UUID should be in format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx\n');
  process.exit(1);
}

// Read JSON file
let questionsData;
try {
  const jsonContent = fs.readFileSync(jsonFilePath, 'utf8');
  questionsData = JSON.parse(jsonContent);
} catch (error) {
  console.error(`❌ Error reading JSON file: ${error.message}\n`);
  process.exit(1);
}

// Validate JSON structure
if (!questionsData.questions || !Array.isArray(questionsData.questions)) {
  console.error('❌ Error: JSON must have a "questions" array\n');
  process.exit(1);
}

const questions = questionsData.questions;

if (questions.length !== 30) {
  console.error(`⚠️  Warning: Expected 30 questions, found ${questions.length}\n`);
}

// Validate question type distribution
const typeCounts = questions.reduce((acc, q) => {
  acc[q.question_type] = (acc[q.question_type] || 0) + 1;
  return acc;
}, {});

console.log('\n📊 Question Distribution:');
console.log(`   MCQ:          ${typeCounts.mcq || 0} (expected: 9)`);
console.log(`   True/False:   ${typeCounts.true_false || 0} (expected: 5)`);
console.log(`   Short Answer: ${typeCounts.short_answer || 0} (expected: 6)`);
console.log(`   Fill Blank:   ${typeCounts.fill_blank || 0} (expected: 6)`);
console.log(`   Match:        ${typeCounts.match || 0} (expected: 4)`);
console.log(`   TOTAL:        ${questions.length} (expected: 30)\n`);

// Escape single quotes for SQL
function escapeSql(str) {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

// Convert options to JSONB string
function optionsToJsonb(options) {
  if (!options) return 'NULL';
  // JSON.stringify already escapes internal quotes properly
  // But we need to escape single quotes for PostgreSQL
  const jsonString = JSON.stringify(options);
  const escapedJson = jsonString.replace(/'/g, "''");
  return `'${escapedJson}'::jsonb`;
}

// Generate SQL
const sqlStatements = [];

// 1. Deactivate old questions
sqlStatements.push(`-- Step 1: Deactivate old questions for student ${studentUuid}`);
sqlStatements.push(`UPDATE quiz_questions`);
sqlStatements.push(`SET active = false`);
sqlStatements.push(`WHERE student_id = '${studentUuid}'`);
sqlStatements.push(`  AND active = true;\n`);

// 2. Insert new questions
sqlStatements.push(`-- Step 2: Insert new 30 questions`);
sqlStatements.push(`INSERT INTO quiz_questions`);
sqlStatements.push(`  (student_id, question_text, question_type, options, correct_answer, concept_tested, difficulty, explanation, active, created_date)`);
sqlStatements.push(`VALUES`);

const valueRows = questions.map((q, index) => {
  const questionText = escapeSql(q.question_text);
  const correctAnswer = escapeSql(q.correct_answer);
  const conceptTested = escapeSql(q.concept_tested || 'General');
  const difficulty = q.difficulty || 'medium';
  const explanation = escapeSql(q.explanation || '');
  const options = optionsToJsonb(q.options);

  return `  ('${studentUuid}', '${questionText}', '${q.question_type}', ${options}, '${correctAnswer}', '${conceptTested}', '${difficulty}', '${explanation}', true, CURRENT_DATE)`;
});

sqlStatements.push(valueRows.join(',\n') + ';\n');

// 3. Verification queries
sqlStatements.push(`-- Step 3: Verify insertion`);
sqlStatements.push(`SELECT COUNT(*) as active_questions`);
sqlStatements.push(`FROM quiz_questions`);
sqlStatements.push(`WHERE student_id = '${studentUuid}'`);
sqlStatements.push(`  AND active = true;`);
sqlStatements.push(`-- Expected: 30\n`);

sqlStatements.push(`-- Step 4: Check question type distribution`);
sqlStatements.push(`SELECT`);
sqlStatements.push(`  question_type,`);
sqlStatements.push(`  COUNT(*) as count`);
sqlStatements.push(`FROM quiz_questions`);
sqlStatements.push(`WHERE student_id = '${studentUuid}'`);
sqlStatements.push(`  AND active = true`);
sqlStatements.push(`GROUP BY question_type`);
sqlStatements.push(`ORDER BY question_type;`);

// Write SQL to file
const outputFileName = path.basename(jsonFilePath, '.json') + '.sql';
const outputPath = path.join('manual-questions', outputFileName);

// Ensure output directory exists
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const sqlContent = sqlStatements.join('\n');
fs.writeFileSync(outputPath, sqlContent, 'utf8');

console.log(`✅ SQL file generated: ${outputPath}\n`);
console.log('📋 Next Steps:');
console.log('   1. Review the generated SQL file');
console.log('   2. Open Supabase SQL Editor: https://supabase.com/dashboard/project/wvzvfzjjiamjkibegvip/sql');
console.log('   3. Copy-paste the SQL content');
console.log('   4. Execute the queries');
console.log('   5. Verify 25 questions inserted');
console.log('   6. Test in quiz app: http://localhost:3000\n');

// Also output to console for immediate copy-paste
console.log('📄 SQL Content (copy-paste to Supabase):');
console.log('═'.repeat(80));
console.log(sqlContent);
console.log('═'.repeat(80) + '\n');
