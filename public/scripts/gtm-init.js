(function () {
  var meta = document.querySelector('meta[name="gtm-container-id"]');
  var id = meta && meta.content;
  if (!id) return;
  // Standard GTM bootstrap, deferred until script load so it never blocks
  // HTML parsing or LCP.
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  var f = document.getElementsByTagName('script')[0];
  var j = document.createElement('script');
  j.async = true;
  j.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(id);
  f.parentNode.insertBefore(j, f);
})();
