// Theme Management for iCalendar Extension
// Handles light/dark/system theme modes across all pages

console.log('=== THEME MANAGER LOADED ===');

// Default theme mode
const DEFAULT_THEME = 'light';

// Initialize theme when page loads
(async function initializeTheme() {
  try {
    // Get saved theme preference
    const { themeMode } = await chrome.storage.sync.get({ themeMode: DEFAULT_THEME });
    console.log('Loaded theme preference:', themeMode);

    // Apply the theme
    applyTheme(themeMode);

    // Listen for system theme changes (when in 'system' mode)
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', async e => {
      const { themeMode } = await chrome.storage.sync.get({ themeMode: DEFAULT_THEME });
      if (themeMode === 'system') {
        const systemTheme = e.matches ? 'dark' : 'light';
        console.log('System theme changed to:', systemTheme);
        setThemeAttribute(systemTheme);
      }
    });

    // Listen for theme changes from storage (e.g., changed in options page)
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'sync' && changes.themeMode) {
        const newTheme = changes.themeMode.newValue;
        console.log('Theme changed in storage to:', newTheme);
        applyTheme(newTheme);
      }
    });
  } catch (error) {
    console.error('Error initializing theme:', error);
    // Fallback to light theme
    setThemeAttribute('light');
  }
})();

/**
 * Apply theme based on mode (light, dark, or system)
 * @param {string} mode - 'light', 'dark', or 'system'
 */
function applyTheme(mode) {
  let actualTheme = mode;

  if (mode === 'system') {
    // Detect system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    actualTheme = prefersDark ? 'dark' : 'light';
    console.log('System preference detected:', actualTheme);
  }

  setThemeAttribute(actualTheme);
}

/**
 * Set the theme attribute on the HTML element
 * @param {string} theme - 'light' or 'dark'
 */
function setThemeAttribute(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  console.log('Theme applied:', theme);
}

/**
 * Get the current active theme
 * @returns {string} 'light' or 'dark'
 */
function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'light';
}

// Export for use in other scripts if needed
if (typeof window !== 'undefined') {
  window.themeManager = {
    applyTheme,
    getCurrentTheme,
  };
}
