// Options page script for iCalendar Extension

console.log('=== OPTIONS PAGE LOADED ===');

// Get DOM elements
const defaultCalendarSelect = document.getElementById('defaultCalendar');
const segmentButtons = document.querySelectorAll('.segment-btn');
const kofiBtn = document.getElementById('kofiBtn');
const buyMeACoffeeBtn = document.getElementById('buyMeACoffeeBtn');

// Default settings
const DEFAULT_SETTINGS = {
  defaultCalendar: '', // Empty string means "Use last selected"
  themeMode: 'system', // 'light', 'dark', or 'system' (defaults to system with light fallback)
};

// Load settings when page opens
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();

  // Add change listener for calendar
  defaultCalendarSelect.addEventListener('change', saveSetting);

  // Add click listeners for theme segment buttons
  segmentButtons.forEach(btn => {
    btn.addEventListener('click', handleThemeChange);
  });

  // Set up donation buttons with tracking URLs
  if (kofiBtn) {
    setupDonationButton(kofiBtn, 'mehrdadh');
  }
  if (buyMeACoffeeBtn) {
    setupDonationButton(buyMeACoffeeBtn, 'mehrdadh');
  }
});

// Close options page with Escape key
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    window.close();
  }
});

// Load settings from storage
async function loadSettings() {
  try {
    const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    console.log('Loaded settings:', settings);

    // Apply settings to UI
    defaultCalendarSelect.value = settings.defaultCalendar || '';

    // Set active theme button (default to 'system' if not set)
    const activeTheme = settings.themeMode || 'system';
    updateSegmentedControl(activeTheme);
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Update segmented control UI
function updateSegmentedControl(selectedTheme) {
  segmentButtons.forEach(btn => {
    const isActive = btn.dataset.theme === selectedTheme;
    btn.setAttribute('aria-checked', isActive.toString());
  });
}

// Handle theme change
async function handleThemeChange(event) {
  const selectedTheme = event.currentTarget.dataset.theme;
  console.log('Theme changed to:', selectedTheme);

  // Update UI immediately
  updateSegmentedControl(selectedTheme);

  // Save to storage
  try {
    await chrome.storage.sync.set({ themeMode: selectedTheme });
    console.log('Theme auto-saved:', selectedTheme);
  } catch (error) {
    console.error('Error saving theme:', error);
  }
}

// Save calendar setting on change
async function saveSetting() {
  try {
    const settings = {
      defaultCalendar: defaultCalendarSelect.value,
    };

    await chrome.storage.sync.set(settings);
    console.log('Settings auto-saved:', settings);
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

// Set up donation button with UTM parameters
function setupDonationButton(button, username) {
  const platform = button.dataset.platform;
  const source = button.dataset.source;

  // Build base URLs
  const baseUrls = {
    kofi: `https://ko-fi.com/${username}`,
    buymeacoffee: `https://buymeacoffee.com/${username}`,
  };

  const baseUrl = baseUrls[platform];
  if (!baseUrl) {
    console.error('Unknown platform:', platform);
    return;
  }

  // Add UTM parameters
  const utmParams = new URLSearchParams({
    utm_source: 'icalendar',
    utm_medium: source,
    utm_content: 'button',
  });

  // Set the href with UTM parameters
  button.href = `${baseUrl}?${utmParams.toString()}`;
}
