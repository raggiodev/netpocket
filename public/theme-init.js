// NetPocket — apply the persisted theme before first paint (CSP-safe external script).
(function () {
  try {
    var raw = window.localStorage.getItem('netpocket:theme');
    var theme = raw ? JSON.parse(raw) : 'dark';
    if (theme !== 'light' && theme !== 'dark') theme = 'dark';
    var root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
  } catch (e) {
    /* storage unavailable: keep the dark default declared on <html> */
  }
})();
