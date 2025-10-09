// Get DOM elements
const dropZone = document.getElementById('dropZone');
const fileInfo = document.getElementById('fileInfo');
const fileList = document.getElementById('fileList');
const errorMessage = document.getElementById('errorMessage');
const createEventBtn = document.getElementById('createEventBtn');
const successMessage = document.getElementById('successMessage');
const eventTitle = document.getElementById('eventTitle');

// Store parsed ICS data globally
let currentICSData = null;
let currentFileName = null;

// Your Client ID - you can change this
// const GOOGLE_CLIENT_ID = '464187272652-jopvbqtpda8bmoaajn1qj9lg8erstd2j.apps.googleusercontent.com';
const GOOGLE_CLIENT_ID = '464187272652-0cjnf3o7e61ufk4lf6fvhulrra1hs3vs.apps.googleusercontent.com';

// Button text constants
const BUTTON_TEXT_DEFAULT = 'Add to Calendar';
const BUTTON_TEXT_PROCESSING = 'Processing...';
const BUTTON_TEXT_AUTHENTICATING = 'Authenticating...';
const BUTTON_TEXT_ADDING = 'Adding to Calendar...';

// Listen for status updates from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'statusUpdate') {
    if (createEventBtn) {
      createEventBtn.textContent = request.status;
    }
  }
});

// Restore event data when popup opens
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const stored = await chrome.storage.local.get(['eventData', 'fileName']);
    if (stored.eventData && stored.fileName) {
      currentICSData = stored.eventData;
      currentFileName = stored.fileName;
      displayICSAttributes(stored.fileName, stored.eventData);
    }
  } catch (error) {
    console.error('Error restoring event data:', error);
  }
});

// Prevent default drag behaviors
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropZone.addEventListener(eventName, preventDefaults, false);
  document.body.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

// Highlight drop zone when item is dragged over it
['dragenter', 'dragover'].forEach(eventName => {
  dropZone.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
  dropZone.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
  dropZone.classList.add('highlight');
}

function unhighlight(e) {
  dropZone.classList.remove('highlight');
}

// Handle dropped files
dropZone.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;
  
  handleFiles(files);
}

function handleFiles(files) {
  // Clear previous displays
  clearEventDisplay();
  
  // Only handle single file
  if (files.length === 0) return;
  
  const file = files[0];
  
  // Check if file has .ics extension
  if (!file.name.toLowerCase().endsWith('.ics')) {
    showError('Unsupported file type. Please upload an .ics file.');
    return;
  }
  
  // Read and parse the .ics file
  readICSFile(file);
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove('hidden');
}

function readICSFile(file) {
  const reader = new FileReader();
  
  reader.onload = function(e) {
    const content = e.target.result;
    const icsData = parseICS(content);
    displayICSAttributes(file.name, icsData);
  };
  
  reader.onerror = function() {
    showError('Error reading file. Please try again.');
  };
  
  reader.readAsText(file);
}

function parseICS(content) {
  const lines = content.split(/\r\n|\n|\r/);
  const attributes = {};
  let inEvent = false;
  
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
    
    // Parse key-value pairs
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex);
      const value = line.substring(colonIndex + 1);
      
      // Handle special keys with parameters (e.g., DTSTART;TZID=...)
      const semicolonIndex = key.indexOf(';');
      const cleanKey = semicolonIndex > 0 ? key.substring(0, semicolonIndex) : key;
      
      // Store the attribute
      if (!attributes[cleanKey]) {
        attributes[cleanKey] = [];
      }
      attributes[cleanKey].push(value);
    }
  });
  
  return attributes;
}

function displayICSAttributes(fileName, attributes) {
  // Store data globally
  currentICSData = attributes;
  currentFileName = fileName;
  
  // Save to storage for persistence
  chrome.storage.local.set({
    eventData: attributes,
    fileName: fileName
  }).catch(error => {
    console.error('Error saving event data:', error);
  });
  
  fileInfo.classList.remove('hidden');
  createEventBtn.classList.remove('hidden');
  
  // Check if we have data
  if (Object.keys(attributes).length === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'empty-message';
    emptyMsg.textContent = 'No event data found in this ICS file.';
    fileList.appendChild(emptyMsg);
    createEventBtn.classList.add('hidden');
    eventTitle.textContent = 'Event';
    return;
  }
  
  // Get the event title (SUMMARY) and set it as the heading
  const summary = attributes['SUMMARY'];
  if (summary && summary.length > 0) {
    eventTitle.textContent = summary[0];
  } else {
    eventTitle.textContent = 'Untitled Event';
  }
  
  // Define the fields we want to display in order (without SUMMARY since it's in the title)
  const fieldsToDisplay = [
    { key: 'DTSTART', label: 'Start Time' },
    { key: 'DTEND', label: 'End Time' },
    { key: 'LOCATION', label: 'Location' }
  ];
  
  // Display only the specified fields
  fieldsToDisplay.forEach(field => {
    const values = attributes[field.key];
    if (values && values.length > 0) {
      const value = values[0]; // Take first value
      
      const attrDiv = document.createElement('div');
      attrDiv.className = 'attribute-item';
      
      const keySpan = document.createElement('span');
      keySpan.className = 'attr-key';
      keySpan.textContent = field.label;
      
      const valueSpan = document.createElement('span');
      valueSpan.className = 'attr-value';
      valueSpan.textContent = formatAttributeValue(field.key, value);
      
      attrDiv.appendChild(keySpan);
      attrDiv.appendChild(valueSpan);
      fileList.appendChild(attrDiv);
    }
  });
}

function formatAttributeValue(key, value) {
  // Format date/time values
  if (key.includes('DT') || key === 'DTSTAMP' || key === 'CREATED' || key === 'LAST-MODIFIED') {
    return formatDateTime(value);
  }
  
  // Truncate very long values
  if (value.length > 100) {
    return value.substring(0, 100) + '...';
  }
  
  return value;
}

function formatDateTime(dateTimeStr) {
  // ICS format: YYYYMMDDTHHMMSSZ or YYYYMMDD
  if (dateTimeStr.length === 8) {
    // Date only: YYYYMMDD
    const year = dateTimeStr.substring(0, 4);
    const month = dateTimeStr.substring(4, 6);
    const day = dateTimeStr.substring(6, 8);
    return `${year}-${month}-${day}`;
  } else if (dateTimeStr.length >= 15) {
    // DateTime: YYYYMMDDTHHMMSS
    const year = dateTimeStr.substring(0, 4);
    const month = dateTimeStr.substring(4, 6);
    const day = dateTimeStr.substring(6, 8);
    const hour = dateTimeStr.substring(9, 11);
    const minute = dateTimeStr.substring(11, 13);
    const second = dateTimeStr.substring(13, 15);
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  }
  
  return dateTimeStr;
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Clear functionality - resets when a new file is dropped
function clearEventDisplay() {
  fileList.innerHTML = '';
  fileInfo.classList.add('hidden');
  errorMessage.classList.add('hidden');
  successMessage.classList.add('hidden');
  createEventBtn.classList.add('hidden');
  eventTitle.textContent = 'Event';
  currentICSData = null;
  currentFileName = null;
  
  // Clear storage
  chrome.storage.local.remove(['eventData', 'fileName']).catch(error => {
    console.error('Error clearing event data:', error);
  });
}

// Create event button functionality
createEventBtn.addEventListener('click', async () => {
  if (!currentICSData) {
    showError('No ICS data available. Please load a file first.');
    return;
  }
  
  // Disable button and show initial loading state
  createEventBtn.disabled = true;
  createEventBtn.textContent = BUTTON_TEXT_PROCESSING;
  errorMessage.classList.add('hidden');
  successMessage.classList.add('hidden');
  
  try {
    const eventData = convertICSToGoogleCalendarEvent(currentICSData);
    console.log('Event data to send:', eventData);
    
    // Send message to background script with Client ID
    // forceAuth: false - will use cached token if available
    chrome.runtime.sendMessage(
      { 
        action: 'createCalendarEvent', 
        eventData: eventData,
        clientId: GOOGLE_CLIENT_ID,
        forceAuth: false  // Use cached token if available
      },
      (response) => {
        // Check for runtime errors
        if (chrome.runtime.lastError) {
          console.error('Runtime error:', chrome.runtime.lastError);
          createEventBtn.disabled = false;
          createEventBtn.textContent = BUTTON_TEXT_DEFAULT;
          showError(`Connection error: ${chrome.runtime.lastError.message}`);
          return;
        }
        
        console.log('Response from background:', response);
        createEventBtn.disabled = false;
        createEventBtn.textContent = BUTTON_TEXT_DEFAULT;
        
        if (response && response.success) {
          showSuccess('Event created successfully in Google Calendar! ✓');
          // Clear the event data after successful creation
          clearEventDisplay();
        } else {
          const errorMsg = response?.error || 'Unknown error occurred';
          console.error('Failed to create event:', errorMsg);
          showError(`Failed to create event: ${errorMsg}`);
        }
      }
    );
  } catch (error) {
    console.error('Error in createEventBtn click handler:', error);
    createEventBtn.disabled = false;
    createEventBtn.textContent = BUTTON_TEXT_DEFAULT;
    showError(`Error: ${error.message}`);
  }
});

function showSuccess(message) {
  successMessage.textContent = message;
  successMessage.classList.remove('hidden');
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
      // Extract email from ATTENDEE field (format: mailto:email@example.com)
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
  // ICS format: YYYYMMDDTHHMMSSZ or YYYYMMDD
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
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };
    }
  }
  
  return null;
}

// Optional: Click to browse files
dropZone.addEventListener('click', () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.ics';
  input.multiple = false;
  
  input.addEventListener('change', (e) => {
    handleFiles(e.target.files);
  });
  
  input.click();
});
