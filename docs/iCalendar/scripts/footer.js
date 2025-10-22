/**
 * Footer component for all pages
 * Automatically detects the page location and adjusts links accordingly
 */
(function () {
  // Detect if we're in a subdirectory
  const isSubdirectory =
    window.location.pathname.includes('/privacy-policy/') ||
    window.location.pathname.includes('/terms-of-service/');
  const baseUrl = isSubdirectory ? '../' : './';

  const footerHTML = `
    <footer>
      <nav>
        <a href="${baseUrl}">Home</a>
        <span>•</span>
        <a href="${baseUrl}privacy-policy/">Privacy Policy</a>
        <span>•</span>
        <a href="${baseUrl}terms-of-service/">Terms of Service</a>
        <span>•</span>
        <a href="https://github.com/mehrdadh/iCalendar">GitHub</a>
        <span>•</span>
        <a href="https://github.com/mehrdadh/iCalendar/issues">Report Issue</a>
      </nav>
    </footer>
  `;

  // Insert footer when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', insertFooter);
  } else {
    insertFooter();
  }

  function insertFooter() {
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder) {
      footerPlaceholder.outerHTML = footerHTML;
    }
  }
})();
