// Theme Management for iCalendar Extension
// Handles light/dark/system theme modes across all pages

console.log('=== THEME MANAGER LOADED ===');

// Default theme mode - uses system preference with light mode fallback
const DEFAULT_THEME = 'system';

// Initialize theme when page loads
(async function initializeTheme() {
  try {
    // Get saved theme preference
    const { themeMode } = await chrome.storage.sync.get({ themeMode: DEFAULT_THEME });
    console.log('Loaded theme preference:', themeMode);

    // Apply the theme
    applyTheme(themeMode);

    // Listen for system theme changes (when in 'system' mode)
    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      if (mediaQuery && mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', async e => {
          const { themeMode } = await chrome.storage.sync.get({ themeMode: DEFAULT_THEME });
          if (themeMode === 'system') {
            const systemTheme = e.matches ? 'dark' : 'light';
            console.log('System theme changed to:', systemTheme);
            setThemeAttribute(systemTheme);
          }
        });
      }
    } catch (error) {
      console.warn('Could not set up system theme change listener:', error);
    }

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
    try {
      // Detect system preference
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      // Check if matchMedia is supported and working
      if (mediaQuery && typeof mediaQuery.matches === 'boolean') {
        actualTheme = mediaQuery.matches ? 'dark' : 'light';
        console.log('System preference detected:', actualTheme);
      } else {
        // Fallback to light if system detection is not supported
        console.warn('System theme detection not supported, falling back to light mode');
        actualTheme = 'light';
      }
    } catch (error) {
      // Fallback to light mode if system detection fails
      console.error('Error detecting system theme, falling back to light mode:', error);
      actualTheme = 'light';
    }
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
