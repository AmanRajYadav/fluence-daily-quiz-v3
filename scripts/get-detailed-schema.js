const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function getDetailedSchema() {
  console.log('\n=== DETAILED QUIZ_QUESTIONS SCHEMA ===\n');

  try {
    // Query information_schema for column details
    const { data: schema, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('*')
      .eq('table_name', 'quiz_questions')
      .order('ordinal_position');

    if (schemaError) {
      console.error('Error querying information_schema:', schemaError.message);
      console.log('\nNote: information_schema access may be restricted with ANON_KEY.');
      console.log('Falling back to sample data inspection...\n');

      // Fall back to inspecting actual data
      await inspectFromData();
    } else if (schema && schema.length > 0) {
      console.log('COLUMNS FROM INFORMATION_SCHEMA:');
      console.log('─'.repeat(120));
      console.log('Column Name'.padEnd(25) + ' | ' + 'Data Type'.padEnd(20) + ' | ' + 'Nullable'.padEnd(10) + ' | ' + 'Default'.padEnd(40));
      console.log('─'.repeat(120));

      schema.forEach(col => {
        const colName = col.column_name || '';
        const dataType = col.data_type || col.udt_name || '';
        const nullable = col.is_nullable || '';
        const defaultVal = col.column_default || '';

        console.log(
          colName.padEnd(25) + ' | ' +
          dataType.padEnd(20) + ' | ' +
          nullable.padEnd(10) + ' | ' +
          defaultVal.slice(0, 40).padEnd(40)
        );
      });
      console.log('─'.repeat(120));
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nFalling back to sample data inspection...\n');
    await inspectFromData();
  }
}

async function inspectFromData() {
  // Get multiple samples to better understand the schema
  const { data: samples, error } = await supabase
    .from('quiz_questions')
    .select('*')
    .limit(5);

  if (error) {
    console.error('Error fetching samples:', error);
    return;
  }

  if (!samples || samples.length === 0) {
    console.log('No data found in quiz_questions table');
    return;
  }

  console.log('DETAILED COLUMN ANALYSIS FROM SAMPLE DATA:');
  console.log('─'.repeat(120));
  console.log('Column Name'.padEnd(25) + ' | ' + 'JS Type'.padEnd(15) + ' | ' + 'Null Count'.padEnd(12) + ' | ' + 'Sample Values');
  console.log('─'.repeat(120));

  const columnStats = {};
  const sample = samples[0];

  // Initialize stats
  Object.keys(sample).forEach(key => {
    columnStats[key] = {
      types: new Set(),
      nullCount: 0,
      sampleValues: []
    };
  });

  // Analyze all samples
  samples.forEach(row => {
    Object.keys(row).forEach(key => {
      const value = row[key];
      if (value === null) {
        columnStats[key].nullCount++;
      } else {
        columnStats[key].types.add(typeof value);
        if (columnStats[key].sampleValues.length < 2) {
          columnStats[key].sampleValues.push(value);
        }
      }
    });
  });

  // Display results
  Object.keys(columnStats).forEach(key => {
    const stats = columnStats[key];
    const types = Array.from(stats.types).join('/');
    const nullInfo = `${stats.nullCount}/${samples.length}`;
    const sampleVal = stats.sampleValues
      .map(v => JSON.stringify(v).slice(0, 30))
      .join(', ')
      .slice(0, 50);

    console.log(
      key.padEnd(25) + ' | ' +
      types.padEnd(15) + ' | ' +
      nullInfo.padEnd(12) + ' | ' +
      sampleVal
    );
  });
  console.log('─'.repeat(120));

  // Check for foreign keys by examining UUID columns
  console.log('\n\nPOTENTIAL FOREIGN KEY RELATIONSHIPS:');
  console.log('─'.repeat(80));

  const uuidColumns = Object.keys(sample).filter(key => {
    const value = sample[key];
    return value && typeof value === 'string' &&
           /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  });

  if (uuidColumns.length > 0) {
    for (const col of uuidColumns) {
      let refTable = '';
      if (col === 'student_id') refTable = 'students';
      else if (col === 'institution_id') refTable = 'institutions';
      else if (col === 'class_id') refTable = 'classes';
      else if (col.endsWith('_id')) refTable = col.replace('_id', 's');

      console.log(`${col.padEnd(25)} → ${refTable || '(unknown table)'}`);
    }
  } else {
    console.log('No UUID columns detected');
  }
  console.log('─'.repeat(80));

  // Enum values
  console.log('\n\nENUM-LIKE COLUMNS (LOW CARDINALITY):');
  console.log('─'.repeat(80));

  // Get distinct values for likely enum columns
  const enumColumns = ['question_type', 'difficulty_level', 'approval_status', 'active'];

  for (const col of enumColumns) {
    const { data, error } = await supabase
      .from('quiz_questions')
      .select(col);

    if (!error && data) {
      const uniqueValues = [...new Set(data.map(row => row[col]))].filter(v => v !== null);
      console.log(`\n${col}:`);
      uniqueValues.forEach(val => {
        const count = data.filter(row => row[col] === val).length;
        console.log(`  - ${JSON.stringify(val)} (${count} rows)`);
      });
    }
  }
  console.log('\n' + '─'.repeat(80));

  // Check indexes (we can infer from query performance, but can't directly query)
  console.log('\n\nINDEX INFERENCE (based on common patterns):');
  console.log('─'.repeat(80));
  console.log('Likely indexed columns:');
  console.log('  - id (primary key)');
  console.log('  - student_id (foreign key, commonly indexed)');
  console.log('  - institution_id (foreign key, commonly indexed)');
  console.log('  - class_id (foreign key, commonly indexed)');
  console.log('  - active (boolean, often indexed for filtering)');
  console.log('  - created_at (timestamp, often indexed for sorting)');
  console.log('─'.repeat(80));

  // Additional metadata
  console.log('\n\nADDITIONAL METADATA:');
  console.log('─'.repeat(80));

  const { count } = await supabase
    .from('quiz_questions')
    .select('*', { count: 'exact', head: true });

  console.log(`Total rows: ${count}`);

  const { data: activeCount } = await supabase
    .from('quiz_questions')
    .select('active', { count: 'exact', head: true })
    .eq('active', true);

  console.log(`Active questions: ${activeCount?.length || 0}`);

  const { data: inactiveCount } = await supabase
    .from('quiz_questions')
    .select('active', { count: 'exact', head: true })
    .eq('active', false);

  console.log(`Inactive questions: ${inactiveCount?.length || 0}`);
  console.log('─'.repeat(80));
}

// Run the detailed schema check
getDetailedSchema()
  .then(() => {
    console.log('\n✅ Detailed schema inspection complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
