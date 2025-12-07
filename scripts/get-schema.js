const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function getQuizQuestionsSchema() {
  console.log('\n=== QUIZ_QUESTIONS TABLE SCHEMA ===\n');

  try {
    console.log('Attempting to query table structure...\n');

    // Get a sample row to understand the structure
    const { data: sampleData, error: sampleError } = await supabase
      .from('quiz_questions')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('Error fetching sample data:', sampleError);
    } else if (sampleData && sampleData.length > 0) {
      console.log('COLUMNS (from sample data):');
      console.log('─'.repeat(80));
      const sample = sampleData[0];
      Object.keys(sample).forEach(key => {
        const value = sample[key];
        const type = typeof value;
        console.log(`${key.padEnd(30)} | ${type.padEnd(20)} | Sample: ${JSON.stringify(value).slice(0, 40)}`);
      });
      console.log('─'.repeat(80));
    }

    // Try to get enum values by querying distinct values
    console.log('\n\nENUM VALUES (from actual data):\n');
    console.log('─'.repeat(80));

    // Get distinct question_types
    const { data: questionTypes, error: qtError } = await supabase
      .from('quiz_questions')
      .select('question_type')
      .not('question_type', 'is', null);

    if (!qtError && questionTypes) {
      const uniqueTypes = [...new Set(questionTypes.map(q => q.question_type))];
      console.log('question_type enum values:');
      uniqueTypes.forEach(type => console.log(`  - ${type}`));
    }

    // Get distinct difficulty_levels
    const { data: difficultyLevels, error: dlError } = await supabase
      .from('quiz_questions')
      .select('difficulty_level')
      .not('difficulty_level', 'is', null);

    if (!dlError && difficultyLevels) {
      const uniqueLevels = [...new Set(difficultyLevels.map(d => d.difficulty_level))];
      console.log('\ndifficulty_level enum values:');
      uniqueLevels.forEach(level => console.log(`  - ${level}`));
    }

    console.log('─'.repeat(80));

    // Check for approval_status column
    console.log('\n\nCHECKING SPECIFIC COLUMNS:\n');
    console.log('─'.repeat(80));

    const { data: checkApproval, error: approvalError } = await supabase
      .from('quiz_questions')
      .select('approval_status')
      .limit(1);

    if (approvalError) {
      console.log('❌ approval_status column: NOT FOUND');
      console.log('   Error:', approvalError.message);
    } else {
      console.log('✅ approval_status column: EXISTS');
      if (checkApproval && checkApproval.length > 0) {
        console.log('   Sample value:', checkApproval[0].approval_status);
      }
    }

    // Check for other important columns
    const columnsToCheck = [
      'id',
      'student_id',
      'institution_id',
      'created_by',
      'question_text',
      'question_type',
      'difficulty_level',
      'active',
      'created_at',
      'updated_at',
      'concept_id',
      'explanation'
    ];

    console.log('\n\nCOLUMN EXISTENCE CHECK:\n');
    console.log('─'.repeat(80));

    for (const col of columnsToCheck) {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select(col)
        .limit(1);

      if (error) {
        console.log(`❌ ${col.padEnd(30)} NOT FOUND`);
      } else {
        console.log(`✅ ${col.padEnd(30)} EXISTS`);
      }
    }

    console.log('─'.repeat(80));

    // Get total count
    const { count, error: countError } = await supabase
      .from('quiz_questions')
      .select('*', { count: 'exact', head: true });

    if (!countError) {
      console.log(`\n\nTOTAL ROWS IN quiz_questions: ${count}\n`);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the schema check
getQuizQuestionsSchema()
  .then(() => {
    console.log('\n✅ Schema check complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
