// Dark Mode Toggle Script

(function () {
  const darkModeToggle = document.getElementById('darkModeToggle');
  const html = document.documentElement;
  const DARK_MODE_KEY = 'microblog-dark-mode';

  // Load saved preference or use system preference
  function initDarkMode() {
    const savedMode = localStorage.getItem(DARK_MODE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDarkMode = savedMode ? JSON.parse(savedMode) : prefersDark;

    setDarkMode(isDarkMode);
  }

  // Set dark mode and update UI
  function setDarkMode(isDark) {
    html.setAttribute('data-bs-theme', isDark ? 'dark' : 'light');
    localStorage.setItem(DARK_MODE_KEY, JSON.stringify(isDark));
    updateIcon(isDark);
  }

  // Update button icon
  function updateIcon(isDark) {
    const icon = darkModeToggle.querySelector('i');
    if (isDark) {
      icon.className = 'bi bi-sun-fill';
      darkModeToggle.title = 'Switch to light mode';
      darkModeToggle.setAttribute('aria-label', 'Switch to light mode');
    } else {
      icon.className = 'bi bi-moon-stars-fill';
      darkModeToggle.title = 'Switch to dark mode';
      darkModeToggle.setAttribute('aria-label', 'Switch to dark mode');
    }
  }

  // Toggle dark mode on button click
  darkModeToggle.addEventListener('click', () => {
    const isDark = html.getAttribute('data-bs-theme') === 'dark';
    setDarkMode(!isDark);
  });

  // Initialize on page load
  initDarkMode();

  // Listen to system theme changes
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', (e) => {
      const savedMode = localStorage.getItem(DARK_MODE_KEY);
      if (!savedMode) {
        setDarkMode(e.matches);
      }
    });
})();
