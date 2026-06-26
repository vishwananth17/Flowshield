(function() {
  // Find script element to get config
  const scriptTag = document.currentScript || document.querySelector('script[src*="flowshield.js"]');
  const orgId = scriptTag ? scriptTag.getAttribute('data-flowshield-id') : null;
  
  if (!orgId) {
    console.warn('Flowshield AI: data-flowshield-id attribute is missing on the script tag.');
    return;
  }
  
  // Generate a simple browser fingerprint
  function getFingerprint() {
    try {
      const screenInfo = `${screen.width}x${screen.height}x${screen.colorDepth}`;
      const language = navigator.language || navigator.userLanguage || '';
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      const userAgent = navigator.userAgent || '';
      return btoa(`${screenInfo}|${language}|${timezone}|${userAgent}`).replace(/=/g, '');
    } catch(e) {
      return 'unknown_fingerprint';
    }
  }
  
  // Listen for clicks on checkout buttons
  document.addEventListener('click', function(e) {
    const target = e.target;
    if (!target) return;
    
    // Match common checkout buttons
    const isCheckoutBtn = target.hasAttribute('data-flowshield-checkout') ||
      target.matches('button[type="submit"][name="checkout"]') ||
      target.matches('.checkout-button') ||
      target.matches('.single_add_to_cart_button') ||
      (target.getAttribute('id') && target.getAttribute('id').toLowerCase().includes('checkout')) ||
      (target.getAttribute('class') && target.getAttribute('class').toLowerCase().includes('checkout'));
      
    if (isCheckoutBtn) {
      let amount = 0;
      let currency = 'INR';
      
      const amountEl = document.querySelector('[data-flowshield-amount]');
      if (amountEl) {
        amount = parseFloat(amountEl.getAttribute('data-flowshield-amount') || '0');
      }
      
      const currencyEl = document.querySelector('[data-flowshield-currency]');
      if (currencyEl) {
        currency = currencyEl.getAttribute('data-flowshield-currency') || 'INR';
      }
      
      // Perform analyze-light request
      fetch('https://flowshield-stdr.onrender.com/api/v1/transactions/analyze-light', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          org_id: orgId,
          amount: amount,
          currency: currency,
          fingerprint: getFingerprint(),
          device_id: window.navigator.userAgent
        })
      })
      .then(res => res.json())
      .then(data => {
        console.log('Flowshield AI Verification: Status =', data.risk);
      })
      .catch(err => {
        console.error('Flowshield AI Verification Error:', err);
      });
    }
  }, true);
})();
