/**
 * Header component for all pages
 * Automatically detects the page location and adjusts links accordingly
 */
(function () {
  // Detect if we're in a subdirectory
  const isSubdirectory =
    window.location.pathname.includes('/privacy-policy/') ||
    window.location.pathname.includes('/terms-of-service/');
  const baseUrl = isSubdirectory ? '../' : './';
  const logoPath = isSubdirectory ? '../logo_512x512.png' : 'logo_512x512.png';

  const headerHTML = `
    <header>
      <div class="logo">
        <img src="${logoPath}" alt="iCalendar Logo" />
      </div>
      <h1>iCalendar</h1>
      <p class="tagline">Import calendar files to Google Calendar with simple drag and drop</p>
      <div class="cta-buttons">
        <a
          href="https://chromewebstore.google.com/detail/icalendar/dbbbojhlacnjcejnlfhbignjignbpgfd"
          class="btn btn-primary"
          >📦 Install Extension</a
        >
        <a href="https://github.com/mehrdadh/iCalendar" class="btn btn-secondary"
          >⭐ View on GitHub</a
        >
      </div>
    </header>
  `;

  // Insert header when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', insertHeader);
  } else {
    insertHeader();
  }

  function insertHeader() {
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (headerPlaceholder) {
      headerPlaceholder.outerHTML = headerHTML;
    }
  }
})();
