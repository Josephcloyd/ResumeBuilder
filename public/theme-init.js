// Applies the saved (or system) colour theme before first paint to avoid a light flash.
// Loaded as an external file because the CSP disallows inline scripts.
(function () {
  var theme = 'light';
  try {
    var saved = localStorage.getItem('resumeflow:theme');
    if (saved === 'light' || saved === 'dark') theme = saved;
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches) theme = 'dark';
  } catch (e) {}
  document.documentElement.setAttribute('data-theme', theme);
  if (theme === 'dark') {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', '#131B2B');
  }
})();
