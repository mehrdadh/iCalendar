// ===== FEATURE FLAGS =====
const ENABLE_EVENT_CACHING = false; // Set to false to disable event persistence across sessions

// Verify script is loaded
console.log('=== POPUP.JS LOADED ===');
console.log('Extension initialized at:', new Date().toISOString());

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
const signOutBtn = document.getElementById('signOutBtn');

// Special value for "Load more calendars" option
const LOAD_MORE_CALENDARS_VALUE = '__load_more_calendars__';

console.log('DOM elements loaded:', {
  dropZone: !!dropZone,
  fileInfo: !!fileInfo,
  createEventBtn: !!createEventBtn,
});

// Store parsed ICS data globally
let currentICSData = null;
let currentFileName = null;

// Handle calendar dropdown selection
calendarDropdown.addEventListener('change', async e => {
  if (e.target.value === LOAD_MORE_CALENDARS_VALUE) {
    console.log('User selected "Load more calendars..."');

    // Reset to previous valid selection temporarily
    const options = Array.from(calendarDropdown.options);
    const primaryOption = options.find(opt => opt.value === 'primary');
    if (primaryOption) {
      calendarDropdown.value = 'primary';
    }

    // Trigger authorization for calendar list access
    try {
      const granted = await promptForCalendarListAccess();

      if (granted) {
        // Reload calendars now that user has granted access
        await loadCalendars();
      }
    } catch (error) {
      console.log('Error during calendar list authorization:', error);
    }
  }
});

// Handle sign-out button
signOutBtn.addEventListener('click', async () => {
  console.log('User clicked sign out');

  // Confirm with user
  if (
    !confirm(
      'Are you sure you want to sign out? This will revoke all access to your Google Calendar.'
    )
  ) {
    return;
  }

  // Disable button during sign out
  signOutBtn.disabled = true;
  signOutBtn.style.opacity = '0.5';

  try {
    await signOut();

    // Show success message
    showSuccess('Successfully signed out! Please reopen the extension to sign in again.');

    // Hide sign-out button
    signOutBtn.classList.add('hidden');

    // After 2 seconds, close the popup
    setTimeout(() => {
      window.close();
    }, 2000);
  } catch (error) {
    console.log('Error during sign out:', error);
    showError('Failed to sign out: ' + error.message);

    // Re-enable button
    signOutBtn.disabled = false;
    signOutBtn.style.opacity = '1';
  }
});

// Get Client ID from manifest.json
const manifest = chrome.runtime.getManifest();
const GOOGLE_CLIENT_ID = manifest.oauth2.client_id;

// Button text constants
const BUTTON_TEXT_DEFAULT = 'Add to Calendar';
const BUTTON_TEXT_PROCESSING = 'Processing...';
const BUTTON_TEXT_AUTHENTICATING = 'Authenticating...';
const BUTTON_TEXT_ADDING = 'Adding to Calendar...';

// Success message constant
const SUCCESS_MESSAGE_EVENT_ADDED = 'Event added to Google Calendar! ✓';

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
    // Check authorization states
    // hasBasicAccess: Can add events to primary calendar (essential)
    // hasCalendarListAccess: Can read calendar list (optional)
    const stored = await chrome.storage.local.get(['hasBasicAccess', 'hasCalendarListAccess']);
    const hasBasicAccess = stored.hasBasicAccess || false;
    const hasCalendarListAccess = stored.hasCalendarListAccess || false;

    console.log('Authorization state:', { hasBasicAccess, hasCalendarListAccess });

    // Show sign-out button if user has basic access
    if (hasBasicAccess) {
      signOutBtn.classList.remove('hidden');
    }

    // Track if we just authorized in this session
    let justAuthorized = false;

    // If user doesn't have basic access yet, automatically prompt for authorization
    if (!hasBasicAccess) {
      console.log('No basic access - prompting for authorization...');
      await promptForBasicAuthorization();

      // After successful authorization, show sign-out button
      const updatedStored = await chrome.storage.local.get(['hasBasicAccess']);
      if (updatedStored.hasBasicAccess) {
        signOutBtn.classList.remove('hidden');
        justAuthorized = true;
      }
    }

    // Load calendars based on access state
    if (hasCalendarListAccess || justAuthorized) {
      // User has calendar list access OR just completed authorization
      // Try to load calendars automatically
      console.log('Loading calendars...');
      await loadCalendars();
    } else {
      console.log('No calendar list access, showing default calendar option');
      showDefaultCalendarWithLoadMore();
      calendarSelector.classList.remove('hidden');
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
    console.log('Error in DOMContentLoaded:', error);
  }
});

// Prompt user for basic authorization (to add events)
async function promptForBasicAuthorization() {
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
      // Mark as having basic access
      await chrome.storage.local.set({
        hasBasicAccess: true,
      });
      showSuccess('Successfully connected to Google Calendar! ✓');

      // Hide success message after 3 seconds
      setTimeout(() => {
        successMessage.classList.add('hidden');
      }, 3000);

      return true;
    } else {
      // Authorization not completed
      showInfo('Authorization was not completed. Please reopen the extension to try again.');
      return false;
    }
  } catch (error) {
    console.log('Authorization not completed:', error.message);
    showInfo('Authorization was not completed. Please reopen the extension to try again.');
    return false;
  }
}

// Prompt user for calendar list access (optional, to see all calendars)
async function promptForCalendarListAccess() {
  try {
    // Show a friendly message
    showInfo('Loading your calendars...');

    // Request authorization (will reuse existing token if user already has basic access)
    const response = await new Promise(resolve => {
      chrome.runtime.sendMessage(
        {
          action: 'requestAuthorization',
          clientId: GOOGLE_CLIENT_ID,
        },
        response => {
          if (chrome.runtime.lastError) {
            console.log('Calendar list access not granted:', chrome.runtime.lastError);
            resolve({ success: false, error: chrome.runtime.lastError.message });
            return;
          }
          resolve(response);
        }
      );
    });

    if (response && response.success) {
      // Mark as having basic access AND calendar list access
      await chrome.storage.local.set({
        hasBasicAccess: true,
        hasCalendarListAccess: true,
      });

      return true;
    } else {
      // Authorization not completed - that's okay, user can still use primary calendar
      showInfo('Calendar list not loaded. You can still add events to your primary calendar.');
      setTimeout(() => {
        successMessage.classList.add('hidden');
      }, 3000);
      return false;
    }
  } catch (error) {
    console.log('Calendar list access not granted:', error.message);
    showInfo('Calendar list not loaded. You can still add events to your primary calendar.');
    setTimeout(() => {
      successMessage.classList.add('hidden');
    }, 3000);
    return false;
  }
}

// Sign out and revoke access
async function signOut() {
  console.log('Signing out...');

  try {
    // Send message to background to revoke token with Google
    const response = await new Promise(resolve => {
      chrome.runtime.sendMessage(
        {
          action: 'revokeToken',
          clientId: GOOGLE_CLIENT_ID,
        },
        response => {
          if (chrome.runtime.lastError) {
            console.log('Error revoking token:', chrome.runtime.lastError);
            resolve({ success: false, error: chrome.runtime.lastError.message });
            return;
          }
          resolve(response);
        }
      );
    });

    if (response && !response.success) {
      console.log('Token revocation failed (non-critical):', response.error);
      // Continue with local cleanup even if revoke fails
    }

    // Clear all local data
    await chrome.storage.local.clear();

    console.log('All local data cleared');

    // Reset UI
    calendarSelector.classList.add('hidden');
    showDefaultCalendarWithLoadMore();

    // Clear any displayed events
    await clearEventDisplay();

    return true;
  } catch (error) {
    console.log('Error during sign out:', error);
    throw error;
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

    // First, load from cache immediately (optimistic UI)
    const stored = await chrome.storage.local.get(['calendars']);
    let hadCachedCalendars = false;

    if (stored.calendars && stored.calendars.length > 0) {
      console.log('Loading calendars from cache (optimistic)');
      populateCalendarDropdown(stored.calendars);
      calendarSelector.classList.remove('hidden');
      hadCachedCalendars = true;
    } else {
      // Show default while loading
      showDefaultCalendarWithLoadMore();
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

      // Save calendars to storage and mark as having calendar list access
      await chrome.storage.local.set({
        calendars: response.calendars,
        hasCalendarListAccess: true,
      });
    } else {
      console.log('Could not load calendars - Response:', {
        success: response?.success,
        error: response?.error,
        isAuthError: response?.isAuthError,
        statusCode: response?.statusCode,
      });

      // Check if this is an auth error (401/403)
      const isAuthError =
        response?.isAuthError || response?.statusCode === 401 || response?.statusCode === 403;

      if (isAuthError) {
        console.log('Auth error detected - token is invalid, clearing all access');

        // When we get 401/403, it means the OAuth token is completely invalid
        // (not just calendar list access, but ALL access including event creation)
        // So we need to clear everything and reset to initial state

        // Clear calendar cache
        await chrome.storage.local.remove(['calendars']);

        // Clear the invalid token
        await chrome.storage.local.remove(['cachedAccessToken', 'tokenExpiryTime']);

        // Reset BOTH access flags - the entire OAuth consent was revoked
        await chrome.storage.local.set({
          hasBasicAccess: false,
          hasCalendarListAccess: false,
        });

        // ALWAYS replace the dropdown with default, even if we showed cached calendars earlier
        console.log(
          'Replacing dropdown with default (had cached calendars:',
          hadCachedCalendars,
          ')'
        );
        showDefaultCalendarWithLoadMore();

        // Verify everything was cleared
        const check = await chrome.storage.local.get([
          'calendars',
          'hasCalendarListAccess',
          'hasBasicAccess',
          'cachedAccessToken',
        ]);
        console.log('After clearing - Storage state:', check);
        console.log('Dropdown now shows:', calendarDropdown.innerHTML.substring(0, 100));

        // Show message to user that they need to re-authorize
        showInfo('Access was revoked. Please reopen the extension to reconnect.');
      } else {
        // Non-auth error (network, rate limit, etc.)
        // If no cache and fetch failed, show default with "Load more" option
        if (!hadCachedCalendars) {
          showDefaultCalendarWithLoadMore();
        }
        // If we have cache, keep showing it (user can still use it during temporary network issues)
        console.log('Non-auth error - keeping cached calendars if available');
      }
    }
  } catch (error) {
    console.log('Error in loadCalendars:', error);
  }
}

// Show default calendar dropdown with "Load more calendars..." option
function showDefaultCalendarWithLoadMore() {
  const currentSelection = calendarDropdown.value;

  calendarDropdown.innerHTML = `
    <option value="primary">Primary Calendar</option>
    <option disabled>─────────────</option>
    <option value="${LOAD_MORE_CALENDARS_VALUE}">📋 Load more calendars...</option>
  `;

  // Restore selection if it was primary
  if (currentSelection === 'primary') {
    calendarDropdown.value = 'primary';
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
          console.log('Runtime error:', chrome.runtime.lastError);
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
          showSuccess(SUCCESS_MESSAGE_EVENT_ADDED);

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
          console.log('Failed to create event:', errorMsg);
          showError(`Failed to create event: ${errorMsg}`);
        }
      }
    );
  } catch (error) {
    console.log('Error in createEventBtn click handler:', error);
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

// Expose functions and constants for screenshot helper
window.showSuccess = showSuccess;
window.SUCCESS_MESSAGE_EVENT_ADDED = SUCCESS_MESSAGE_EVENT_ADDED;
