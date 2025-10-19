// ===== FEATURE FLAGS =====
const ENABLE_EVENT_CACHING = false; // Set to false to disable event persistence across sessions

// Verify script is loaded
console.log('=== POPUP.JS LOADED ===');
console.log('Extension initialized at:', new Date().toISOString());
// console.error('ERROR TEST - If you see this, console is working!');
// console.warn('WARNING TEST - Console should show this!');

// Get DOM elements
const dropZone = document.getElementById('dropZone');
const fileInfo = document.getElementById('fileInfo');
const fileList = document.getElementById('fileList');
const errorMessage = document.getElementById('errorMessage');
const createEventBtn = document.getElementById('createEventBtn');
const successMessage = document.getElementById('successMessage');
const eventTitle = document.getElementById('eventTitle');
const calendarSelector = document.getElementById('calendarSelector');
const calendarDropdown = document.getElementById('calendarDropdown');

console.log('DOM elements loaded:', {
  dropZone: !!dropZone,
  fileInfo: !!fileInfo,
  createEventBtn: !!createEventBtn,
});

// Store parsed ICS data globally
let currentICSData = null;
let currentFileName = null;

// Get Client ID from manifest.json
const manifest = chrome.runtime.getManifest();
const GOOGLE_CLIENT_ID = manifest.oauth2.client_id;

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

// Check authorization status and restore event data when popup opens
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // First, check if user is authorized
    const isAuthorized = await checkAndRequestAuthorization();

    // If authorized, load calendars
    if (isAuthorized) {
      await loadCalendars();
    }

    // Then restore event data if available (if caching is enabled)
    if (ENABLE_EVENT_CACHING) {
      const stored = await chrome.storage.local.get(['eventData', 'fileName']);
      console.log('Checking storage for cached event:', stored);
      if (stored.eventData && stored.fileName) {
        console.log('Restoring cached event');
        currentICSData = stored.eventData;
        currentFileName = stored.fileName;
        displayICSAttributes(stored.fileName, stored.eventData, false); // false = don't save back to storage
      } else {
        console.log('No cached event found');
      }
    }
  } catch (error) {
    console.error('Error in DOMContentLoaded:', error);
  }
});

// Check if user is authorized, if not request authorization
async function checkAndRequestAuthorization() {
  try {
    // Check if we already have authorization
    const stored = await chrome.storage.local.get(['isAuthorized']);

    // If already authorized, nothing to do
    if (stored.isAuthorized) {
      console.log('User is already authorized');
      return true;
    }

    // Not authorized - prompt for authorization
    // This will show the auth flow every time until user completes it
    console.log('Not authorized - requesting authorization...');
    await promptForAuthorization();

    // Re-check authorization status after prompting
    const updated = await chrome.storage.local.get(['isAuthorized']);
    return updated.isAuthorized || false;
  } catch (error) {
    console.error('Error checking authorization:', error);
    return false;
  }
}

// Prompt user for authorization
async function promptForAuthorization() {
  try {
    // Show a friendly message
    showInfo("Welcome! Let's connect to your Google Calendar...");

    // Request authorization by attempting to get a token
    const response = await new Promise(resolve => {
      chrome.runtime.sendMessage(
        {
          action: 'requestAuthorization',
          clientId: GOOGLE_CLIENT_ID,
        },
        response => {
          if (chrome.runtime.lastError) {
            console.log('Authorization not completed:', chrome.runtime.lastError);
            resolve({ success: false, error: chrome.runtime.lastError.message });
            return;
          }
          resolve(response);
        }
      );
    });

    if (response && response.success) {
      // Mark as authorized
      await chrome.storage.local.set({
        isAuthorized: true,
      });
      showSuccess('Successfully connected to Google Calendar! ✓');

      // Hide success message after 3 seconds
      setTimeout(() => {
        successMessage.classList.add('hidden');
      }, 3000);
    } else {
      // Authorization not completed
      await chrome.storage.local.set({
        isAuthorized: false,
      });
      showError('Authorization was not completed. Please reopen the extension to try again.');
    }
  } catch (error) {
    console.log('Authorization not completed:', error.message);
    await chrome.storage.local.set({
      isAuthorized: false,
    });
  }
}

// Show info message
function showInfo(message) {
  // Reuse success message for info (you could create a separate info div if needed)
  successMessage.textContent = message;
  successMessage.classList.remove('hidden');
  successMessage.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
}

// Load user's calendars
async function loadCalendars() {
  try {
    console.log('Loading calendars...');

    // First, load from cache immediately
    const stored = await chrome.storage.local.get(['calendars']);
    if (stored.calendars && stored.calendars.length > 0) {
      console.log('Loading calendars from cache');
      populateCalendarDropdown(stored.calendars);
      calendarSelector.classList.remove('hidden');
    } else {
      // Show default while loading
      calendarDropdown.innerHTML = '<option value="primary">My Calendar</option>';
      calendarSelector.classList.remove('hidden');
    }

    // Then fetch fresh data in background
    const response = await new Promise(resolve => {
      chrome.runtime.sendMessage(
        {
          action: 'getCalendars',
          clientId: GOOGLE_CLIENT_ID,
        },
        response => {
          if (chrome.runtime.lastError) {
            console.log('Could not load calendars:', chrome.runtime.lastError);
            resolve({ success: false, error: chrome.runtime.lastError.message });
            return;
          }
          resolve(response);
        }
      );
    });

    if (response && response.success && response.calendars) {
      console.log('Calendars loaded from API:', response.calendars);

      // Update dropdown with fresh data
      populateCalendarDropdown(response.calendars);

      // Save calendars to storage
      await chrome.storage.local.set({ calendars: response.calendars });
    } else {
      console.log('Could not load calendars, using default:', response?.error);
      // If no cache and fetch failed, keep default
      if (!stored.calendars || stored.calendars.length === 0) {
        calendarDropdown.innerHTML = '<option value="primary">My Calendar</option>';
      }
    }
  } catch (error) {
    console.error('Error in loadCalendars:', error);
  }
}

// Populate calendar dropdown with calendar list
function populateCalendarDropdown(calendars) {
  // Save current selection
  const currentSelection = calendarDropdown.value;

  // Clear dropdown
  calendarDropdown.innerHTML = '';

  // Add calendars to dropdown
  calendars.forEach(calendar => {
    const option = document.createElement('option');
    option.value = calendar.id;
    option.textContent = calendar.summary;

    // Mark primary calendar
    if (calendar.primary) {
      option.textContent += ' (Primary)';
      option.selected = true;
    }

    calendarDropdown.appendChild(option);
  });

  // Restore previous selection if it still exists
  if (
    currentSelection &&
    Array.from(calendarDropdown.options).some(opt => opt.value === currentSelection)
  ) {
    calendarDropdown.value = currentSelection;
  }
}

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

  // Check if file has .ics or .vcs extension
  const fileName = file.name.toLowerCase();
  if (!fileName.endsWith('.ics') && !fileName.endsWith('.vcs')) {
    showError('Unsupported file type. Please upload an .ics or .vcs file.');
    return;
  }

  // Read and parse the calendar file
  readCalendarFile(file);
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove('hidden');
}

function readCalendarFile(file) {
  const reader = new FileReader();

  reader.onload = function (e) {
    const content = e.target.result;
    const calendarData = parseCalendarFile(content);
    displayICSAttributes(file.name, calendarData);
  };

  reader.onerror = function () {
    showError('Error reading file. Please try again.');
  };

  reader.readAsText(file);
}

// ===== PARSER FUNCTIONS =====
// Parser functions are now imported from parser.js (loaded before this script in popup.html)
// Access them via window.ICSParser
const { parseCalendarFile, convertICSToGoogleCalendarEvent, parseICSDateTime, getFirstValue } =
  window.ICSParser;

function displayICSAttributes(fileName, attributes, saveToStorage = true) {
  // Store data globally
  currentICSData = attributes;
  currentFileName = fileName;

  // Save to storage for persistence (only if caching is enabled and requested)
  if (saveToStorage && ENABLE_EVENT_CACHING) {
    console.log('Saving event to storage:', fileName);
    chrome.storage.local
      .set({
        eventData: attributes,
        fileName: fileName,
      })
      .then(() => {
        console.log('✓ Event saved to storage');
      })
      .catch(error => {
        console.log('Could not save event data to cache:', error.message);
      });
  } else if (!saveToStorage) {
    console.log('Skipping save to storage (restoring from cache)');
  } else {
    console.log('Skipping save to storage (caching disabled)');
  }

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
    { key: 'LOCATION', label: 'Location' },
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
async function clearEventDisplay() {
  console.log('clearEventDisplay() called');
  fileList.innerHTML = '';
  fileInfo.classList.add('hidden');
  errorMessage.classList.add('hidden');
  successMessage.classList.add('hidden');
  createEventBtn.classList.add('hidden');
  eventTitle.textContent = 'Event';
  currentICSData = null;
  currentFileName = null;

  // Clear storage (only if caching is enabled)
  if (ENABLE_EVENT_CACHING) {
    try {
      console.log('Attempting to clear storage...');
      await chrome.storage.local.remove(['eventData', 'fileName']);
      console.log('✓ Event data cleared from storage');

      // Verify it's actually cleared
      const check = await chrome.storage.local.get(['eventData', 'fileName']);
      console.log('Storage after clear:', check);
    } catch (error) {
      console.log('Could not clear event data from cache:', error.message);
    }
  }
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

    // Get selected calendar ID
    const calendarId = calendarDropdown.value || 'primary';
    console.log('Selected calendar:', calendarId);

    // Send message to background script with Client ID
    // forceAuth: false - will use cached token if available
    chrome.runtime.sendMessage(
      {
        action: 'createCalendarEvent',
        eventData: eventData,
        calendarId: calendarId,
        clientId: GOOGLE_CLIENT_ID,
        forceAuth: false, // Use cached token if available
      },
      response => {
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
          // Show success message
          showSuccess('Event added to Google Calendar! ✓');

          // After 2 seconds, fade out and clear
          setTimeout(() => {
            // Add fade-out class
            fileInfo.style.transition = 'opacity 0.5s ease';
            successMessage.style.transition = 'opacity 0.5s ease';
            fileInfo.style.opacity = '0';
            successMessage.style.opacity = '0';

            // After fade completes, clear everything
            setTimeout(async () => {
              await clearEventDisplay();
              // Reset opacity for next time
              fileInfo.style.opacity = '1';
              successMessage.style.opacity = '1';
            }, 500); // Wait for fade animation
          }, 2000); // Show success for 2 seconds
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
  successMessage.style.background = ''; // Reset to default green
  successMessage.classList.remove('hidden');
}

// ===== FILE BROWSER =====
// Optional: Click to browse files
dropZone.addEventListener('click', () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.ics,.vcs';
  input.multiple = false;

  input.addEventListener('change', e => {
    handleFiles(e.target.files);
  });

  input.click();
});
