/**
 * ICS/VCS Calendar Parser
 * Shared parsing functions used by the extension and tests
 */

// Wrap in IIFE to avoid polluting global scope
(function () {
  'use strict';

  // ===== PARSING FUNCTIONS =====

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
        console.log('Detected VCS (vCalendar 1.0) format');
        break;
      } else if (line.trim().startsWith('VERSION:2.0')) {
        isVCS = false;
        console.log('Detected ICS (iCalendar 2.0) format');
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

    // Handle start time (REQUIRED by Google Calendar API)
    const dtstart = getFirstValue(icsData, 'DTSTART');
    if (!dtstart) {
      throw new Error(
        'Missing required field: DTSTART. Cannot create calendar event without a start time.'
      );
    }

    event.start = parseICSDateTime(dtstart);
    if (!event.start) {
      throw new Error(
        `Invalid DTSTART format: "${dtstart}". Cannot create calendar event with invalid start time.`
      );
    }

    // Handle end time (REQUIRED by Google Calendar API)
    const dtend = getFirstValue(icsData, 'DTEND');
    if (!dtend) {
      throw new Error(
        'Missing required field: DTEND. Cannot create calendar event without an end time.'
      );
    }

    event.end = parseICSDateTime(dtend);
    if (!event.end) {
      throw new Error(
        `Invalid DTEND format: "${dtend}". Cannot create calendar event with invalid end time.`
      );
    }

    // Validate that end is after start
    const startDate = event.start.dateTime || event.start.date;
    const endDate = event.end.dateTime || event.end.date;
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      throw new Error(
        'Invalid event: end time must be after start time. Please check the calendar file.'
      );
    }

    // Handle recurrence rules if present
    const rrule = getFirstValue(icsData, 'RRULE');
    if (rrule) {
      event.recurrence = [`RRULE:${rrule}`];
    }

    // Handle attendees
    const attendees = icsData['ATTENDEE'];
    if (attendees && attendees.length > 0) {
      event.attendees = attendees
        .map(attendee => {
          // Extract email from ATTENDEE field (format: mailto:email@example.com)
          const emailMatch = attendee.match(/mailto:([^\s]+)/i);
          if (emailMatch) {
            return { email: emailMatch[1] };
          }
          return null;
        })
        .filter(a => a !== null);
    }

    return event;
  }

  function getFirstValue(data, key) {
    return data[key] && data[key].length > 0 ? data[key][0] : null;
  }

  function parseICSDateTime(icsDateTime) {
    // ICS format: YYYYMMDDTHHMMSSZ or YYYYMMDD
    if (!icsDateTime) return null;

    // Remove any timezone info for simplicity
    icsDateTime = icsDateTime.replace(/;.*$/, '');

    // Validate that the string only contains digits, T, and Z
    if (!/^[0-9TZ]+$/.test(icsDateTime)) {
      console.warn('Invalid date format: contains non-numeric characters:', icsDateTime);
      return null;
    }

    if (icsDateTime.length === 8) {
      // Date only: YYYYMMDD
      const year = parseInt(icsDateTime.substring(0, 4), 10);
      const month = parseInt(icsDateTime.substring(4, 6), 10);
      const day = parseInt(icsDateTime.substring(6, 8), 10);

      // Validate date components
      if (month < 1 || month > 12 || day < 1 || day > 31) {
        console.warn('Invalid date values:', { year, month, day });
        return null;
      }

      // Validate date is real (e.g., not Feb 31)
      const testDate = new Date(year, month - 1, day);
      if (
        testDate.getFullYear() !== year ||
        testDate.getMonth() !== month - 1 ||
        testDate.getDate() !== day
      ) {
        console.warn('Invalid date (does not exist in calendar):', { year, month, day });
        return null;
      }

      return {
        date: `${icsDateTime.substring(0, 4)}-${icsDateTime.substring(
          4,
          6
        )}-${icsDateTime.substring(6, 8)}`,
      };
    } else if (icsDateTime.length >= 15 && icsDateTime.charAt(8) === 'T') {
      // DateTime: YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ
      const year = parseInt(icsDateTime.substring(0, 4), 10);
      const month = parseInt(icsDateTime.substring(4, 6), 10);
      const day = parseInt(icsDateTime.substring(6, 8), 10);
      const hour = parseInt(icsDateTime.substring(9, 11), 10);
      const minute = parseInt(icsDateTime.substring(11, 13), 10);
      const second = parseInt(icsDateTime.substring(13, 15), 10);

      // Validate date/time components
      if (
        month < 1 ||
        month > 12 ||
        day < 1 ||
        day > 31 ||
        hour < 0 ||
        hour > 23 ||
        minute < 0 ||
        minute > 59 ||
        second < 0 ||
        second > 59
      ) {
        console.warn('Invalid date/time values:', { year, month, day, hour, minute, second });
        return null;
      }

      // Validate date is real
      const testDate = new Date(year, month - 1, day, hour, minute, second);
      if (
        testDate.getFullYear() !== year ||
        testDate.getMonth() !== month - 1 ||
        testDate.getDate() !== day
      ) {
        console.warn('Invalid date/time (does not exist in calendar):', {
          year,
          month,
          day,
          hour,
          minute,
          second,
        });
        return null;
      }

      const yearStr = icsDateTime.substring(0, 4);
      const monthStr = icsDateTime.substring(4, 6);
      const dayStr = icsDateTime.substring(6, 8);
      const hourStr = icsDateTime.substring(9, 11);
      const minuteStr = icsDateTime.substring(11, 13);
      const secondStr = icsDateTime.substring(13, 15);

      // Check if it's UTC (ends with Z)
      if (icsDateTime.endsWith('Z')) {
        return {
          dateTime: `${yearStr}-${monthStr}-${dayStr}T${hourStr}:${minuteStr}:${secondStr}Z`,
          timeZone: 'UTC',
        };
      } else {
        return {
          dateTime: `${yearStr}-${monthStr}-${dayStr}T${hourStr}:${minuteStr}:${secondStr}`,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
      }
    }

    console.warn('Invalid date format: unexpected length or format:', icsDateTime);
    return null;
  }

  // ===== EXPORTS =====

  // CommonJS export for Node.js (tests)
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      parseCalendarFile,
      convertICSToGoogleCalendarEvent,
      parseICSDateTime,
      getFirstValue,
    };
  }

  // Browser global export (for extension and browser tests)
  if (typeof window !== 'undefined') {
    window.ICSParser = {
      parseCalendarFile,
      convertICSToGoogleCalendarEvent,
      parseICSDateTime,
      getFirstValue,
    };
  }
})(); // End of IIFE
