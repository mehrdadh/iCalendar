// Options page script for iCalendar Extension

console.log('=== OPTIONS PAGE LOADED ===');

// Get DOM elements
const defaultCalendarSelect = document.getElementById('defaultCalendar');
const themeModeSelect = document.getElementById('themeMode');

// Default settings
const DEFAULT_SETTINGS = {
  defaultCalendar: '', // Empty string means "Use last selected"
  themeMode: 'light', // 'light', 'dark', or 'system'
};

// Load settings when page opens
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();

  // Add change listeners for auto-save
  defaultCalendarSelect.addEventListener('change', saveSetting);
  themeModeSelect.addEventListener('change', saveSetting);
});

// Load settings from storage
async function loadSettings() {
  try {
    const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    console.log('Loaded settings:', settings);

    // Apply settings to UI
    defaultCalendarSelect.value = settings.defaultCalendar || '';
    themeModeSelect.value = settings.themeMode || 'light';
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Save setting on change
async function saveSetting() {
  try {
    const settings = {
      defaultCalendar: defaultCalendarSelect.value,
      themeMode: themeModeSelect.value,
    };

    await chrome.storage.sync.set(settings);
    console.log('Settings auto-saved:', settings);
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}
