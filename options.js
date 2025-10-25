// Options page script for iCalendar Extension

console.log('=== OPTIONS PAGE LOADED ===');

// Get DOM elements
const defaultCalendarSelect = document.getElementById('defaultCalendar');
const themeModeSelect = document.getElementById('themeMode');
const saveBtn = document.getElementById('saveBtn');
const resetBtn = document.getElementById('resetBtn');
const statusMessage = document.getElementById('statusMessage');

// Default settings
const DEFAULT_SETTINGS = {
  defaultCalendar: '', // Empty string means "Use last selected"
  themeMode: 'system', // 'system', 'light', or 'dark'
};

// Load settings when page opens
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
});

// Load settings from storage
async function loadSettings() {
  try {
    const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    console.log('Loaded settings:', settings);

    // Apply settings to UI
    defaultCalendarSelect.value = settings.defaultCalendar || '';
    themeModeSelect.value = settings.themeMode || 'system';
  } catch (error) {
    console.error('Error loading settings:', error);
    showStatus('Failed to load settings', 'error');
  }
}

// Save settings
saveBtn.addEventListener('click', async () => {
  try {
    const settings = {
      defaultCalendar: defaultCalendarSelect.value,
      themeMode: themeModeSelect.value,
    };

    await chrome.storage.sync.set(settings);
    console.log('Settings saved:', settings);

    showStatus('Settings saved successfully! ✓', 'success');

    // Hide status after 3 seconds
    setTimeout(() => {
      statusMessage.classList.add('hidden');
    }, 3000);
  } catch (error) {
    console.error('Error saving settings:', error);
    showStatus('Failed to save settings', 'error');
  }
});

// Reset to defaults
resetBtn.addEventListener('click', async () => {
  try {
    await chrome.storage.sync.set(DEFAULT_SETTINGS);
    console.log('Settings reset to defaults');

    // Update UI
    defaultCalendarSelect.value = DEFAULT_SETTINGS.defaultCalendar;
    themeModeSelect.value = DEFAULT_SETTINGS.themeMode;

    showStatus('Settings reset to defaults', 'success');

    // Hide status after 3 seconds
    setTimeout(() => {
      statusMessage.classList.add('hidden');
    }, 3000);
  } catch (error) {
    console.error('Error resetting settings:', error);
    showStatus('Failed to reset settings', 'error');
  }
});

// Show status message
function showStatus(message, type = 'success') {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  statusMessage.classList.remove('hidden');
}
