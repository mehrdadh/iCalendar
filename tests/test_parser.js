#!/usr/bin/env node

/**
 * ICS/VCS Parser Test Suite
 * Tests the parsing of calendar files and conversion to Google Calendar API format
 *
 * Usage: node test_parser.js
 */

const fs = require('fs');
const path = require('path');

// ===== IMPORT PARSING FUNCTIONS FROM SHARED MODULE =====
const {
  parseCalendarFile,
  convertICSToGoogleCalendarEvent,
  parseICSDateTime,
  getFirstValue,
} = require('../parser.js');

// ===== TEST FRAMEWORK =====

class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  assert(condition, testName, expected, actual) {
    if (condition) {
      console.log(`  ✅ ${testName}`);
      this.passed++;
    } else {
      console.log(`  ❌ ${testName}`);
      console.log(`     Expected: ${expected}`);
      console.log(`     Actual:   ${actual}`);
      this.failed++;
    }
  }

  assertEquals(expected, actual, testName) {
    const expectedStr = JSON.stringify(expected);
    const actualStr = JSON.stringify(actual);
    const condition = expectedStr === actualStr;

    if (condition) {
      console.log(`  ✅ ${testName}`);
      this.passed++;
    } else {
      console.log(`  ❌ ${testName}`);
      console.log(`     Expected: ${expectedStr}`);
      console.log(`     Actual:   ${actualStr}`);
      this.failed++;
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    const total = this.passed + this.failed;
    const percentage = total > 0 ? ((this.passed / total) * 100).toFixed(1) : 0;
    console.log(`📊 Test Results: ${this.passed}/${total} passed (${percentage}%)`);
    console.log('='.repeat(60));

    if (this.failed === 0) {
      console.log('🎉 All tests passed!');
      process.exit(0);
    } else {
      console.log(`⚠️  ${this.failed} test(s) failed`);
      process.exit(1);
    }
  }
}

// ===== TEST CASES =====

function testSingleICS(runner) {
  console.log('\n📝 Test: Single Event ICS File');

  const filePath = path.join(__dirname, 'data', 'test_single.ics');

  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠️  File not found: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const parsed = parseCalendarFile(content);

  // Test parsing
  runner.assert(
    parsed.SUMMARY && parsed.SUMMARY[0] === 'Test Event',
    'Parse SUMMARY field',
    'Test Event',
    parsed.SUMMARY ? parsed.SUMMARY[0] : 'null'
  );

  runner.assert(
    parsed.DESCRIPTION &&
      parsed.DESCRIPTION[0] === 'This is a simple test event for testing purposes.',
    'Parse DESCRIPTION field',
    'This is a simple test event for testing purposes.',
    parsed.DESCRIPTION ? parsed.DESCRIPTION[0] : 'null'
  );

  runner.assert(
    parsed.LOCATION && parsed.LOCATION[0] === 'Test Location',
    'Parse LOCATION field',
    'Test Location',
    parsed.LOCATION ? parsed.LOCATION[0] : 'null'
  );

  runner.assert(
    parsed.DTSTART && parsed.DTSTART[0] === '20251018T140000Z',
    'Parse DTSTART field',
    '20251018T140000Z',
    parsed.DTSTART ? parsed.DTSTART[0] : 'null'
  );

  // Test conversion to Google Calendar format
  const googleEvent = convertICSToGoogleCalendarEvent(parsed);

  runner.assertEquals('Test Event', googleEvent.summary, 'Google Calendar API: summary');

  runner.assertEquals(
    'This is a simple test event for testing purposes.',
    googleEvent.description,
    'Google Calendar API: description'
  );

  runner.assertEquals('Test Location', googleEvent.location, 'Google Calendar API: location');

  runner.assertEquals(
    { dateTime: '2025-10-18T14:00:00Z', timeZone: 'UTC' },
    googleEvent.start,
    'Google Calendar API: start time'
  );

  runner.assertEquals(
    { dateTime: '2025-10-18T15:00:00Z', timeZone: 'UTC' },
    googleEvent.end,
    'Google Calendar API: end time'
  );

  console.log('\n  📋 Generated Google Calendar Event:');
  console.log('  ' + JSON.stringify(googleEvent, null, 2).replace(/\n/g, '\n  '));
}

function testSingleVCS(runner) {
  console.log('\n📝 Test: Single Event VCS File');

  const filePath = path.join(__dirname, 'data', 'test_single.vcs');

  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠️  File not found: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const parsed = parseCalendarFile(content);

  runner.assert(
    parsed.SUMMARY && parsed.SUMMARY[0] === 'Test Event',
    'Parse SUMMARY field',
    'Test Event',
    parsed.SUMMARY ? parsed.SUMMARY[0] : 'null'
  );

  const googleEvent = convertICSToGoogleCalendarEvent(parsed);

  runner.assertEquals('Test Event', googleEvent.summary, 'Google Calendar API: summary');

  runner.assertEquals(
    { dateTime: '2025-10-18T14:00:00Z', timeZone: 'UTC' },
    googleEvent.start,
    'Google Calendar API: start time'
  );
}

function testMultipleICS(runner) {
  console.log('\n📝 Test: Multiple Events ICS File');

  const filePath = path.join(__dirname, 'data', 'test_multiple.ics');

  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠️  File not found: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const parsed = parseCalendarFile(content);

  // Note: Current parser only captures FIRST event from multi-event files
  runner.assert(
    parsed.SUMMARY && parsed.SUMMARY.length > 0,
    'Parse returns event data',
    'Has data',
    parsed.SUMMARY ? 'Has data' : 'No data'
  );

  runner.assert(
    parsed.SUMMARY && parsed.SUMMARY[0] === 'Morning Standup',
    'First event captured',
    'Morning Standup',
    parsed.SUMMARY ? parsed.SUMMARY[0] : 'null'
  );

  console.log(`  ℹ️  Note: Parser currently handles only the first event in multi-event files`);
}

function testMultipleVCS(runner) {
  console.log('\n📝 Test: Multiple Events VCS File');

  const filePath = path.join(__dirname, 'data', 'test_multiple.vcs');

  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠️  File not found: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const parsed = parseCalendarFile(content);

  runner.assert(
    parsed.SUMMARY && parsed.SUMMARY.length > 0,
    'Parse returns event data',
    'Has data',
    parsed.SUMMARY ? 'Has data' : 'No data'
  );
}

function testDateTimeParsing(runner) {
  console.log('\n📝 Test: DateTime Parsing Functions');

  // Test UTC datetime
  const utcResult = parseICSDateTime('20251018T140000Z');
  runner.assertEquals(
    { dateTime: '2025-10-18T14:00:00Z', timeZone: 'UTC' },
    utcResult,
    'Parse UTC datetime format'
  );

  // Test date only
  const dateResult = parseICSDateTime('20251018');
  runner.assertEquals({ date: '2025-10-18' }, dateResult, 'Parse date-only format');

  // Test local datetime
  const localResult = parseICSDateTime('20251018T140000');
  runner.assert(
    localResult && localResult.dateTime === '2025-10-18T14:00:00',
    'Parse local datetime format',
    '2025-10-18T14:00:00',
    localResult ? localResult.dateTime : 'null'
  );

  // Test null input
  const nullResult = parseICSDateTime(null);
  runner.assertEquals(null, nullResult, 'Handle null input');

  // Test empty string
  const emptyResult = parseICSDateTime('');
  runner.assertEquals(null, emptyResult, 'Handle empty string');
}

function testCorruptedFiles(runner) {
  console.log('\n📝 Test: Corrupted File Handling');

  const corruptedFiles = [
    {
      file: 'test_corrupted_missing_begin.ics',
      shouldThrow: false,
      shouldConvert: true,
    },
    {
      file: 'test_corrupted_missing_end.ics',
      shouldThrow: false,
      shouldConvert: true,
    },
    {
      file: 'test_corrupted_invalid_dates.ics',
      shouldThrow: true,
      errorContains: 'Invalid date format',
    },
    {
      file: 'test_corrupted_missing_fields.ics',
      shouldThrow: true,
      errorContains: 'Missing required field',
    },
    {
      file: 'test_corrupted_mismatched_tags.ics',
      shouldThrow: false,
      shouldConvert: true,
    },
    {
      file: 'test_corrupted_truncated.ics',
      shouldThrow: false,
      shouldConvert: true,
      // Note: This file has valid DTSTART/DTEND before truncation, so it parses successfully
    },
    {
      file: 'test_corrupted_nested_error.ics',
      shouldThrow: false,
      shouldConvert: true,
    },
    {
      file: 'test_corrupted_malformed_properties.ics',
      shouldThrow: true,
      errorContains: 'Missing required field',
      // Note: Malformed properties (missing colon) are skipped, so DTSTART is missing, not invalid
    },
    {
      file: 'test_corrupted_empty.ics',
      shouldThrow: true,
      errorContains: 'Missing required field',
    },
    {
      file: 'test_corrupted_invalid_version.ics',
      shouldThrow: false,
      shouldConvert: true,
    },
    {
      file: 'test_corrupted_missing_begin.vcs',
      shouldThrow: false,
      shouldConvert: true,
    },
    {
      file: 'test_corrupted_missing_end.vcs',
      shouldThrow: false,
      shouldConvert: true,
    },
    {
      file: 'test_corrupted_invalid_dates.vcs',
      shouldThrow: true,
      errorContains: 'Invalid date format',
    },
    {
      file: 'test_corrupted_missing_fields.vcs',
      shouldThrow: true,
      errorContains: 'Missing required field',
    },
    {
      file: 'test_corrupted_truncated.vcs',
      shouldThrow: false,
      shouldConvert: true,
      // Note: This file has valid DTSTART/DTEND before truncation, so it parses successfully
    },
    {
      file: 'test_corrupted_empty.vcs',
      shouldThrow: true,
      errorContains: 'Missing required field',
    },
    {
      file: 'test_corrupted_malformed_properties.vcs',
      shouldThrow: true,
      errorContains: 'Missing required field',
      // Note: Malformed properties (missing colon) are skipped, so DTSTART is missing, not invalid
    },
    {
      file: 'test_corrupted_wrong_format.vcs',
      shouldThrow: false,
      shouldConvert: true,
    },
  ];

  corruptedFiles.forEach(testCase => {
    const filePath = path.join(__dirname, 'data', testCase.file);

    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠️  File not found: ${testCase.file}`);
      return;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const parsed = parseCalendarFile(content);

      // Test should not crash during parsing
      runner.assert(
        true,
        `${testCase.file}: Parser handles without crashing`,
        'No crash',
        'No crash'
      );

      // For empty files, parsed should be empty object
      if (testCase.file.includes('empty')) {
        runner.assert(
          Object.keys(parsed).length === 0,
          `${testCase.file}: Empty file returns empty object`,
          'Empty object',
          `Keys: ${Object.keys(parsed).length}`
        );
      }

      // Try to convert to Google Calendar event
      try {
        const googleEvent = convertICSToGoogleCalendarEvent(parsed);

        if (testCase.shouldThrow) {
          runner.assert(
            false,
            `${testCase.file}: Should throw error with message containing "${testCase.errorContains}"`,
            `Error: ${testCase.errorContains}`,
            'No error thrown'
          );
        } else {
          runner.assert(
            googleEvent !== null && typeof googleEvent === 'object',
            `${testCase.file}: Converts to Google event object successfully`,
            'Valid object',
            typeof googleEvent
          );
        }
      } catch (conversionError) {
        if (testCase.shouldThrow) {
          runner.assert(
            conversionError.message.includes(testCase.errorContains),
            `${testCase.file}: Throws expected error`,
            `Error containing "${testCase.errorContains}"`,
            conversionError.message
          );
        } else {
          runner.assert(
            false,
            `${testCase.file}: Should not throw exception`,
            'No exception',
            `Exception: ${conversionError.message}`
          );
        }
      }
    } catch (error) {
      runner.assert(
        false,
        `${testCase.file}: Parsing should not throw exception`,
        'No exception',
        `Exception: ${error.message}`
      );
    }
  });
}

function testCorruptedDateHandling(runner) {
  console.log('\n📝 Test: Corrupted Date Handling');

  // Test invalid date formats - should return null
  const invalidDates = [
    { input: 'INVALID-DATE-FORMAT', reason: 'contains non-numeric characters' },
    { input: '2025-10-18T15:00:00', reason: 'uses dashes instead of compact format' },
    { input: 'NOT-A-VALID-DATE', reason: 'completely invalid format' },
    { input: '2025/10/18 15:00:00', reason: 'uses slashes and spaces' },
    { input: '', reason: 'empty string' },
    { input: '20251301T120000Z', reason: 'invalid month (13)' },
    { input: '20250231T120000Z', reason: 'invalid date (Feb 31)' },
    { input: '20251018T250000Z', reason: 'invalid hour (25)' },
  ];

  invalidDates.forEach(testCase => {
    try {
      const result = parseICSDateTime(testCase.input);

      // Parser should not crash on invalid dates
      runner.assert(
        true,
        `Invalid date "${testCase.input}" (${testCase.reason}) - parser handles without crashing`,
        'No crash',
        'No crash'
      );

      // Invalid dates should return null
      runner.assert(
        result === null,
        `Invalid date "${testCase.input}" returns null`,
        'null',
        result === null ? 'null' : JSON.stringify(result)
      );
    } catch (error) {
      runner.assert(
        false,
        `Invalid date "${testCase.input}" should not throw`,
        'No exception',
        `Exception: ${error.message}`
      );
    }
  });

  // Test valid dates to ensure validation isn't too strict
  const validDates = [
    { input: '20251018', expected: { date: '2025-10-18' } },
    { input: '20251018T140000Z', expected: { dateTime: '2025-10-18T14:00:00Z', timeZone: 'UTC' } },
  ];

  validDates.forEach(testCase => {
    const result = parseICSDateTime(testCase.input);
    runner.assertEquals(
      testCase.expected,
      result,
      `Valid date "${testCase.input}" parses correctly`
    );
  });

  console.log('  ℹ️  Note: Parser now validates date formats and returns null for invalid dates');
}

// ===== RUN ALL TESTS =====

function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 ICS/VCS Parser Test Suite');
  console.log('='.repeat(60));

  const runner = new TestRunner();

  try {
    testSingleICS(runner);
    testSingleVCS(runner);
    testMultipleICS(runner);
    testMultipleVCS(runner);
    testDateTimeParsing(runner);
    testCorruptedFiles(runner);
    testCorruptedDateHandling(runner);
  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  }

  runner.printSummary();
}

// Run tests if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  parseCalendarFile,
  convertICSToGoogleCalendarEvent,
  parseICSDateTime,
  getFirstValue,
};
