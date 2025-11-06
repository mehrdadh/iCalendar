// Google Analytics 4 Configuration
// Measurement ID from Google Analytics

(function () {
  // Your Google Analytics Measurement ID
  const GA_MEASUREMENT_ID = 'G-XGF33QBV2F';

  // Only load analytics if Measurement ID is configured
  if (GA_MEASUREMENT_ID && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
    // Load Google Analytics gtag.js
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      dataLayer.push(arguments);
    }
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, {
      anonymize_ip: true, // Privacy-friendly: anonymize IP addresses
      cookie_flags: 'SameSite=None;Secure',
    });

    console.log('Google Analytics loaded:', GA_MEASUREMENT_ID);
  } else {
    console.log('Google Analytics not configured. Add your Measurement ID to analytics.js');
  }
})();
