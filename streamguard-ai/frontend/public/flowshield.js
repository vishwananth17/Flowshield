/**
 * Flowshield AI — Client-Side Fraud Telemetry & Risk Analysis SDK
 * Version: 1.2.0
 * Usage: <script src="https://flowshield-ai.vercel.app/flowshield.js" data-api-key="YOUR_API_KEY"></script>
 */
(function (window, document) {
  'use strict';

  var API_BASE_URL = 'https://flowshield-stdr.onrender.com/api/v1';
  var STORAGE_KEY = 'fs_device_id';

  // 1. Generate or retrieve persistent Device Fingerprint ID
  function getDeviceId() {
    var deviceId = localStorage.getItem(STORAGE_KEY);
    if (!deviceId) {
      deviceId = 'fp_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem(STORAGE_KEY, deviceId);
    }
    return deviceId;
  }

  // 2. Generate Canvas Fingerprint Hash
  function getCanvasHash() {
    try {
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = "14px 'Arial'";
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Flowshield,AI!#123', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Flowshield,AI!#123', 4, 17);
      var str = canvas.toDataURL();
      var hash = 0;
      for (var i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
      }
      return 'cvs_' + Math.abs(hash).toString(16);
    } catch (e) {
      return 'cvs_unsupported';
    }
  }

  // 3. Gather Client Telemetry Data
  function getTelemetry() {
    return {
      device_fingerprint: getDeviceId(),
      canvas_hash: getCanvasHash(),
      screen_resolution: window.screen ? window.screen.width + 'x' + window.screen.height : 'unknown',
      viewport_size: window.innerWidth + 'x' + window.innerHeight,
      color_depth: window.screen ? window.screen.colorDepth : 24,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      timezone_offset: new Date().getTimezoneOffset(),
      language: navigator.language || navigator.userLanguage || 'en-US',
      platform: navigator.platform || 'unknown',
      hardware_concurrency: navigator.hardwareConcurrency || 4,
      touch_support: ('ontouchstart' in window) || (navigator.maxTouchPoints > 0),
      current_url: window.location.href,
      referrer: document.referrer || ''
    };
  }

  // 4. Extract API Key from Script Tag attributes or global config
  function getApiKey() {
    if (window.FlowshieldConfig && window.FlowshieldConfig.apiKey) {
      return window.FlowshieldConfig.apiKey;
    }
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var key = scripts[i].getAttribute('data-api-key');
      if (key) return key;
    }
    return null;
  }

  // 5. Core API Sender
  function analyzeTransaction(txData, callback) {
    var apiKey = getApiKey();
    if (!apiKey) {
      console.warn('[Flowshield AI] Warning: Missing data-api-key. Please specify your API Key.');
    }

    var telemetry = getTelemetry();
    var payload = {
      amount: parseFloat(txData.amount || txData.total_price || 0.0),
      currency: (txData.currency || 'INR').toUpperCase(),
      merchant: {
        id: txData.merchant_id || window.location.hostname,
        name: txData.merchant_name || window.location.hostname,
        category: txData.merchant_category || '5999',
        country: txData.merchant_country || 'IN'
      },
      card: {
        last_four: String(txData.card_last_four || txData.last_four || '4242').slice(-4),
        type: txData.card_type || 'credit_card',
        issuing_country: txData.card_country || 'IN'
      },
      customer: {
        id: String(txData.customer_id || txData.email || 'cust_anonymous'),
        email: txData.customer_email || txData.email || '',
        ip: txData.customer_ip || '127.0.0.1',
        device_fingerprint: telemetry.device_fingerprint,
        country: txData.customer_country || 'IN',
        city: txData.customer_city || 'Mumbai'
      },
      channel: 'web_sdk',
      external_id: String(txData.order_id || txData.external_id || 'order_' + Date.now())
    };

    var xhr = new XMLHttpRequest();
    xhr.open('POST', API_BASE_URL + '/transactions/analyze', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    if (apiKey) {
      xhr.setRequestHeader('X-API-Key', apiKey);
    }

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            var response = JSON.parse(xhr.responseText);
            if (typeof callback === 'function') callback(null, response);
          } catch (e) {
            if (typeof callback === 'function') callback(e, null);
          }
        } else {
          var err = new Error('Flowshield API Error: ' + xhr.statusText);
          if (typeof callback === 'function') callback(err, null);
        }
      }
    };

    xhr.send(JSON.stringify(payload));
  }

  // 6. Public Flowshield Global Interface
  var Flowshield = {
    version: '1.2.0',
    getDeviceId: getDeviceId,
    getTelemetry: getTelemetry,
    analyze: function (txData, callback) {
      return analyzeTransaction(txData, callback);
    },
    init: function (config) {
      if (config) {
        window.FlowshieldConfig = Object.assign(window.FlowshieldConfig || {}, config);
      }
      console.log('[Flowshield AI] SDK Initialized. Telemetry Device Hash:', getDeviceId());
    }
  };

  // Auto-init on script load
  window.Flowshield = Flowshield;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { Flowshield.init(); });
  } else {
    Flowshield.init();
  }

})(window, document);
