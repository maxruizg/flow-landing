(function () {
  var meta = document.querySelector('meta[name="ga-measurement-id"]');
  var id = meta && meta.content;
  if (!id) return;
  var tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
  document.head.appendChild(tag);
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;
  gtag('js', new Date());
  gtag('config', id, { anonymize_ip: true });
})();
