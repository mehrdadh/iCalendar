#!/usr/bin/env node

/**
 * ICS/VCS Parser Test Suite
 * Tests the parsing of calendar files and conversion to Google Calendar API format
 * 
 * Usage: node test_parser.js
 */

const fs = require('fs');
const path = require('path');

// ===== PARSING FUNCTIONS (from popup.js) =====

function parseCalendarFile(content) {
  // First, unfold lines (both ICS and VCS spec: lines starting with space/tab are continuations)
  const unfoldedContent = content.replace(/\r\n /g, '').replace(/\n /g, '').replace(/\r /g, '');
  
  const lines = unfoldedContent.split(/\r\n|\n|\r/);
  const attributes = {};
  let inEvent = false;
  let isVCS = false;
  
  // Detect if this is a VCS (vCalendar 1.0) or ICS (iCalendar 2.0) file
  for (const line of lines) {
    if (line.trim().startsWith('VERSION:1.0')) {
      isVCS = true;
      console.log('  📝 Detected VCS (vCalendar 1.0) format');
      break;
    } else if (line.trim().startsWith('VERSION:2.0')) {
      isVCS = false;
      console.log('  📝 Detected ICS (iCalendar 2.0) format');
      break;
    }
  }
  
  lines.forEach(line => {
    line = line.trim();
    
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      return;
    }
    
    if (line === 'END:VEVENT') {
      inEvent = false;
      return;
    }
    
    if (!inEvent) return;
    
    // Parse key-value pairs
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex);
      let value = line.substring(colonIndex + 1);
      
      // Handle special keys with parameters (e.g., DTSTART;TZID=...)
      const semicolonIndex = key.indexOf(';');
      const cleanKey = semicolonIndex > 0 ? key.substring(0, semicolonIndex) : key;
      
      // Decode escape sequences
      value = value.replace(/\\n/g, '\n');
      value = value.replace(/\\,/g, ',');
      value = value.replace(/\\;/g, ';');
      value = value.replace(/\\\\/g, '\\');
      
      // Handle VCS-specific fields
      let mappedKey = cleanKey;
      if (isVCS) {
        if (cleanKey === 'AALARM') {
          mappedKey = 'AALARM';
        }
      }
      
      // Store the attribute
      if (!attributes[mappedKey]) {
        attributes[mappedKey] = [];
      }
      attributes[mappedKey].push(value);
    }
  });
  
  return attributes;
}

function convertICSToGoogleCalendarEvent(icsData) {
  const event = {
    summary: getFirstValue(icsData, 'SUMMARY') || 'Untitled Event',
    description: getFirstValue(icsData, 'DESCRIPTION') || '',
    location: getFirstValue(icsData, 'LOCATION') || '',
  };
  
  // Handle start time
  const dtstart = getFirstValue(icsData, 'DTSTART');
  if (dtstart) {
    event.start = parseICSDateTime(dtstart);
  }
  
  // Handle end time
  const dtend = getFirstValue(icsData, 'DTEND');
  if (dtend) {
    event.end = parseICSDateTime(dtend);
  }
  
  // Handle recurrence rules if present
  const rrule = getFirstValue(icsData, 'RRULE');
  if (rrule) {
    event.recurrence = [`RRULE:${rrule}`];
  }
  
  // Handle attendees
  const attendees = icsData['ATTENDEE'];
  if (attendees && attendees.length > 0) {
    event.attendees = attendees.map(attendee => {
      const emailMatch = attendee.match(/mailto:([^\s]+)/i);
      if (emailMatch) {
        return { email: emailMatch[1] };
      }
      return null;
    }).filter(a => a !== null);
  }
  
  return event;
}

function getFirstValue(data, key) {
  return data[key] && data[key].length > 0 ? data[key][0] : null;
}

function parseICSDateTime(icsDateTime) {
  if (!icsDateTime) return null;
  
  // Remove any timezone info for simplicity
  icsDateTime = icsDateTime.replace(/;.*$/, '');
  
  if (icsDateTime.length === 8) {
    // Date only: YYYYMMDD
    const year = icsDateTime.substring(0, 4);
    const month = icsDateTime.substring(4, 6);
    const day = icsDateTime.substring(6, 8);
    return { date: `${year}-${month}-${day}` };
  } else if (icsDateTime.length >= 15) {
    // DateTime: YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ
    const year = icsDateTime.substring(0, 4);
    const month = icsDateTime.substring(4, 6);
    const day = icsDateTime.substring(6, 8);
    const hour = icsDateTime.substring(9, 11);
    const minute = icsDateTime.substring(11, 13);
    const second = icsDateTime.substring(13, 15);
    
    // Check if it's UTC (ends with Z)
    if (icsDateTime.endsWith('Z')) {
      return { 
        dateTime: `${year}-${month}-${day}T${hour}:${minute}:${second}Z`,
        timeZone: 'UTC'
      };
    } else {
      return { 
        dateTime: `${year}-${month}-${day}T${hour}:${minute}:${second}`,
        timeZone: 'America/Los_Angeles' // Default timezone for testing
      };
    }
  }
  
  return null;
}

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
    parsed.DESCRIPTION && parsed.DESCRIPTION[0] === 'This is a simple test event for testing purposes.',
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
  
  runner.assertEquals(
    'Test Event',
    googleEvent.summary,
    'Google Calendar API: summary'
  );
  
  runner.assertEquals(
    'This is a simple test event for testing purposes.',
    googleEvent.description,
    'Google Calendar API: description'
  );
  
  runner.assertEquals(
    'Test Location',
    googleEvent.location,
    'Google Calendar API: location'
  );
  
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
  
  runner.assertEquals(
    'Test Event',
    googleEvent.summary,
    'Google Calendar API: summary'
  );
  
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
  runner.assertEquals(
    { date: '2025-10-18' },
    dateResult,
    'Parse date-only format'
  );
  
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
  runner.assertEquals(
    null,
    nullResult,
    'Handle null input'
  );
  
  // Test empty string
  const emptyResult = parseICSDateTime('');
  runner.assertEquals(
    null,
    emptyResult,
    'Handle empty string'
  );
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
  getFirstValue
};

