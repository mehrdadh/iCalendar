# Test Suite for ICS/VCS Calendar Parser

This directory contains test files and test suites for validating the ICS/VCS calendar file parsing and conversion
to Google Calendar API format.

## Test Data Files

The `data/` directory contains sample calendar files for testing:

### Single Event Files

- **test_single.ics** - ICS format (iCalendar 2.0) with a single test event
- **test_single.vcs** - VCS format (vCalendar 1.0) with a single test event

### Multiple Event Files

- **test_multiple.ics** - ICS format with 5 events for testing multiple event parsing
- **test_multiple.vcs** - VCS format with 5 events for testing multiple event parsing

### Example Files

- **example-tomorrow.ics** - Real-world example with 3 diverse events including alarms

## Test Suites

### 1. Browser-Based Tests (`test_parser.html`)

An interactive HTML test runner that can be opened directly in a browser.

**How to Run:**

```bash
# Simply open the file in your browser
open tests/test_parser.html
# or
google-chrome tests/test_parser.html
```

**Features:**

- ✅ Visual test results with pass/fail indicators
- 🎨 Color-coded output (green for pass, red for fail)
- 📊 Test summary with percentage
- 🔍 Detailed diff view for failed tests
- 🖱️ Interactive "Run All Tests" button

**What it Tests:**

- Parsing of ICS and VCS files
- Correct extraction of event attributes (SUMMARY, LOCATION, DESCRIPTION, etc.)
- DateTime parsing (UTC, local, date-only formats)
- Conversion to Google Calendar API format
- Validation of output structure

### 2. Command-Line Tests (`test_parser.js`)

A Node.js-based test runner for automated testing and CI/CD pipelines.

**How to Run:**

```bash
# From the project root
node tests/test_parser.js

# Or make it executable and run directly
chmod +x tests/test_parser.js
./tests/test_parser.js
```

**Features:**

- 🚀 Fast command-line execution
- 📝 Detailed console output with emojis
- ✅ Exit code 0 for success, 1 for failure (CI/CD friendly)
- 📊 Test statistics and summary
- 🔍 Shows expected vs actual values for failures

**What it Tests:**

- All browser tests plus:
- Actual file reading from `data/` directory
- Integration with the real test files
- Validates example-tomorrow.ics file

## Test Coverage

The test suites validate the following functionality:

### Parsing Tests

- ✅ ICS (iCalendar 2.0) format detection
- ✅ VCS (vCalendar 1.0) format detection
- ✅ VEVENT extraction from calendar files
- ✅ Attribute parsing (SUMMARY, DESCRIPTION, LOCATION, DTSTART, DTEND)
- ✅ Escape sequence handling (\\n, \\,, \\;, \\\\)
- ✅ Line unfolding (continuation lines)
- ✅ First event extraction from multi-event files

### DateTime Parsing Tests

- ✅ UTC datetime format (YYYYMMDDTHHMMSSZ)
- ✅ Local datetime format (YYYYMMDDTHHMMSS)
- ✅ Date-only format (YYYYMMDD)
- ✅ Null/empty input handling
- ✅ Timezone detection and assignment

### Google Calendar API Conversion Tests

- ✅ Event summary mapping
- ✅ Event description mapping
- ✅ Event location mapping
- ✅ Start time conversion to RFC3339 format
- ✅ End time conversion to RFC3339 format
- ✅ Date vs DateTime handling
- ✅ Timezone preservation

## Expected Google Calendar API Format

The parser converts calendar events to the following Google Calendar API format:

```javascript
{
  "summary": "Event Title",
  "description": "Event description text",
  "location": "Event Location",
  "start": {
    "dateTime": "2025-10-18T14:00:00Z",  // or "date": "2025-10-18" for all-day events
    "timeZone": "UTC"                     // or local timezone
  },
  "end": {
    "dateTime": "2025-10-18T15:00:00Z",
    "timeZone": "UTC"
  },
  "recurrence": ["RRULE:..."],           // optional, if RRULE present
  "attendees": [                          // optional, if ATTENDEE present
    { "email": "attendee@example.com" }
  ]
}
```

## Known Limitations

The current parser implementation has the following limitations:

1. **Multi-Event Files**: When multiple events exist in a single calendar file, only the FIRST event is captured
   and parsed. Subsequent events are ignored.

2. **VCS AALARM**: VCS alarm fields (AALARM) are parsed but not converted to Google Calendar API format (as Google
   Calendar uses a different reminder system).

3. **Timezone Handling**: Complex timezone specifications (TZID parameters) are simplified. Local times default to
   the system timezone.

4. **Recurrence**: Only basic RRULE support is implemented. Complex recurrence patterns may not be fully supported.

## Adding New Tests

To add new test cases:

### For Browser Tests (test_parser.html)

1. Add a new test function following the pattern of existing tests
2. Call the function from `runAllTests()`
3. Use `assert()` or `assertEquals()` to validate results

### For Command-Line Tests (test_parser.js)

1. Add a new test function that accepts `runner` parameter
2. Call the function from `main()`
3. Use `runner.assert()` or `runner.assertEquals()` for validation

Example:

```javascript
function testNewFeature(runner) {
  console.log('\n📝 Test: New Feature');

  const result = yourFunction('input');

  runner.assertEquals('expected value', result, 'Test description');
}
```

## CI/CD Integration

To integrate tests into a CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Run Parser Tests
  run: node tests/test_parser.js
```

The test script returns exit code 0 on success and 1 on failure, making it suitable for automated testing.

## Troubleshooting

### Tests Not Finding Files

If you see "File not found" errors, ensure you're running the tests from the project root:

```bash
cd /path/to/chrome_extension
node tests/test_parser.js
```

### Browser Tests Not Loading

Make sure to open the HTML file through a web server or directly in the browser. Some browsers may block file://
protocol features.

### DateTime Timezone Issues

The tests expect specific timezone behavior. If running in different timezones, some assertions about local
datetime parsing may need adjustment.

## Contributing

When adding new test data files:

1. Place them in the `data/` directory
2. Follow the naming convention: `test_<description>.<ics|vcs>`
3. Include at least one test case that validates the new file
4. Update this README with information about the new test file

## References

- [iCalendar RFC 5545](https://tools.ietf.org/html/rfc5545) - ICS format specification
- [vCalendar 1.0 Spec](https://www.imc.org/pdi/vcal-10.txt) - VCS format specification
- [Google Calendar API](https://developers.google.com/calendar/api/v3/reference/events) - Event resource format
