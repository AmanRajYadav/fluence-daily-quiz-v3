#!/usr/bin/env node
/**
 * Schema Verification Script
 * Verifies quiz_questions table schema matches documentation
 * Run: node scripts/verify-schema.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Expected schema from migration files
const EXPECTED_SCHEMA = {
  columns: [
    { name: 'id', type: 'UUID', nullable: false, default: 'uuid_generate_v4()' },
    { name: 'institution_id', type: 'UUID', nullable: false, fk: 'institutions(id)' },
    { name: 'class_id', type: 'UUID', nullable: false, fk: 'classes(id)' },
    { name: 'student_id', type: 'UUID', nullable: false, fk: 'students(id)' },
    { name: 'question_text', type: 'TEXT', nullable: false },
    { name: 'question_type', type: 'TEXT', nullable: false, check: "IN ('mcq', 'true_false', 'short_answer', 'fill_blank', 'match', 'voice')" },
    { name: 'options', type: 'JSONB', nullable: true },
    { name: 'correct_answer', type: 'TEXT', nullable: false },
    { name: 'explanation', type: 'TEXT', nullable: true },
    { name: 'concept_name', type: 'TEXT', nullable: false },
    { name: 'difficulty_level', type: 'TEXT', nullable: true, default: "'medium'", check: "IN ('easy', 'medium', 'hard')" },
    { name: 'points', type: 'INTEGER', nullable: true, default: '10' },
    { name: 'active', type: 'BOOLEAN', nullable: true, default: 'true' },
    { name: 'created_date', type: 'DATE', nullable: true, default: 'CURRENT_DATE' },
    { name: 'edited_by', type: 'UUID', nullable: true, fk: 'teachers(id)' },
    { name: 'approved_by', type: 'UUID', nullable: true, fk: 'teachers(id)' },
    { name: 'approval_status', type: 'TEXT', nullable: true, default: "'approved'", check: "IN ('pending', 'approved', 'rejected')" },
    { name: 'created_at', type: 'TIMESTAMP', nullable: true, default: 'NOW()' },
    { name: 'updated_at', type: 'TIMESTAMP', nullable: true, default: 'NOW()' },
  ],
  enums: {
    question_type: ['mcq', 'true_false', 'short_answer', 'fill_blank', 'match', 'voice'],
    difficulty_level: ['easy', 'medium', 'hard'],
    approval_status: ['pending', 'approved', 'rejected'],
  },
};

async function verifySchema() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║        QUIZ_QUESTIONS TABLE SCHEMA VERIFICATION                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    // Get sample data to infer schema
    const { data: sample, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error fetching data:', error.message);
      return;
    }

    if (!sample || sample.length === 0) {
      console.error('❌ No data found in quiz_questions table');
      return;
    }

    const actualColumns = Object.keys(sample[0]);
    const expectedColumns = EXPECTED_SCHEMA.columns.map(c => c.name);

    // Compare columns
    console.log('📋 COLUMN VERIFICATION\n');
    console.log('─'.repeat(70));

    const missing = expectedColumns.filter(col => !actualColumns.includes(col));
    const extra = actualColumns.filter(col => !expectedColumns.includes(col));
    const matching = expectedColumns.filter(col => actualColumns.includes(col));

    console.log(`✅ Matching columns: ${matching.length}/${expectedColumns.length}`);

    if (missing.length > 0) {
      console.log(`\n⚠️  Missing columns (expected but not found):`);
      missing.forEach(col => {
        const spec = EXPECTED_SCHEMA.columns.find(c => c.name === col);
        console.log(`   - ${col} (${spec.type})`);
      });
    }

    if (extra.length > 0) {
      console.log(`\n⚠️  Extra columns (found but not expected):`);
      extra.forEach(col => console.log(`   - ${col}`));
    }

    console.log('─'.repeat(70));

    // Verify enum values
    console.log('\n🔤 ENUM VERIFICATION\n');
    console.log('─'.repeat(70));

    for (const [enumName, expectedValues] of Object.entries(EXPECTED_SCHEMA.enums)) {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select(enumName);

      if (error) {
        console.log(`❌ ${enumName}: Error - ${error.message}`);
        continue;
      }

      const actualValues = [...new Set(data.map(row => row[enumName]))].filter(v => v !== null);
      const unexpected = actualValues.filter(v => !expectedValues.includes(v));

      if (unexpected.length === 0) {
        console.log(`✅ ${enumName}: All values valid`);
        console.log(`   Expected: [${expectedValues.join(', ')}]`);
        console.log(`   Found: [${actualValues.join(', ')}]`);
      } else {
        console.log(`⚠️  ${enumName}: Unexpected values found`);
        console.log(`   Expected: [${expectedValues.join(', ')}]`);
        console.log(`   Found: [${actualValues.join(', ')}]`);
        console.log(`   Unexpected: [${unexpected.join(', ')}]`);
      }
      console.log('');
    }

    console.log('─'.repeat(70));

    // Verify foreign keys by checking if referenced tables exist
    console.log('\n🔗 FOREIGN KEY VERIFICATION\n');
    console.log('─'.repeat(70));

    const fkColumns = EXPECTED_SCHEMA.columns.filter(c => c.fk);

    for (const col of fkColumns) {
      const refTable = col.fk.split('(')[0];

      // Try to query the referenced table
      const { error } = await supabase
        .from(refTable)
        .select('id')
        .limit(1);

      if (error) {
        console.log(`⚠️  ${col.name} → ${col.fk}: Referenced table not accessible`);
      } else {
        console.log(`✅ ${col.name} → ${col.fk}: Valid`);
      }
    }

    console.log('─'.repeat(70));

    // Display full schema
    console.log('\n📊 COMPLETE SCHEMA\n');
    console.log('─'.repeat(100));
    console.log('Column Name'.padEnd(25) + 'Type'.padEnd(15) + 'Nullable'.padEnd(12) + 'Default/Constraint');
    console.log('─'.repeat(100));

    for (const col of EXPECTED_SCHEMA.columns) {
      const exists = actualColumns.includes(col.name);
      const icon = exists ? '✓' : '✗';
      const colName = `${icon} ${col.name}`.padEnd(25);
      const type = col.type.padEnd(15);
      const nullable = (col.nullable ? 'YES' : 'NO').padEnd(12);
      const extra = col.default || col.check || col.fk || '-';

      console.log(colName + type + nullable + extra);
    }

    console.log('─'.repeat(100));

    // Statistics
    console.log('\n📈 DATABASE STATISTICS\n');
    console.log('─'.repeat(70));

    const { count } = await supabase
      .from('quiz_questions')
      .select('*', { count: 'exact', head: true });

    console.log(`Total rows: ${count}`);

    // Count by type
    for (const [field, values] of Object.entries(EXPECTED_SCHEMA.enums)) {
      const { data } = await supabase
        .from('quiz_questions')
        .select(field);

      console.log(`\n${field}:`);
      for (const value of values) {
        const count = data.filter(row => row[field] === value).length;
        console.log(`  ${value.padEnd(20)} ${count.toString().padStart(4)} rows`);
      }
    }

    console.log('─'.repeat(70));

    console.log('\n✅ Schema verification complete!\n');

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run verification
verifySchema()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
