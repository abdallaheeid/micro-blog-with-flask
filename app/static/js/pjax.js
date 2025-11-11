// Lightweight PJAX-like navigation
// Intercepts internal link clicks and replaces the main content container
// Requires server to render full HTML (we parse and extract the container)

(function () {
  const containerSelector = '.container.mt-3';

  function isSameOrigin(url) {
    try {
      const u = new URL(url, location.href);
      return u.origin === location.origin;
    } catch (e) {
      return false;
    }
  }

  async function fetchAndReplace(url, push = true) {
    try {
      const res = await fetch(url, { credentials: 'same-origin' });
      if (!res.ok) {
        // fallback to full navigation if fetch fails
        location.href = url;
        return;
      }
      const text = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      const newContainer = doc.querySelector(containerSelector);
      if (!newContainer) {
        // can't find the fragment we need — full navigation
        location.href = url;
        return;
      }
      const current = document.querySelector(containerSelector);
      if (!current) {
        // unexpected: replace the body
        document.documentElement.innerHTML = text;
        return;
      }
      // replace content
      current.innerHTML = newContainer.innerHTML;
      // update title
      document.title = doc.title || document.title;
      // update URL
      if (push) history.pushState({ url: url }, '', url);
      // reset scroll
      window.scrollTo(0, 0);
      // dispatch custom event so other scripts can re-bind
      window.dispatchEvent(
        new CustomEvent('pjax:complete', { detail: { url } })
      );
    } catch (err) {
      console.error('PJAX load failed', err);
      location.href = url;
    }
  }

  // delegate click handler
  document.addEventListener('click', function (e) {
    // only left-click without modifier keys
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    )
      return;
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    // allow anchor-only hash navigation
    if (href.startsWith('#')) return;
    // absolute URL with different origin
    if (!isSameOrigin(href)) return;
    // skip links with target or download or data-no-pjax
    if (a.target && a.target !== '_self') return;
    if (a.hasAttribute('download') || a.hasAttribute('data-no-pjax')) return;
    // skip if link has rel="external"
    if ((a.getAttribute('rel') || '').split(/\s+/).includes('external')) return;

    // At this point we consider it an internal link to handle via PJAX
    e.preventDefault();
    const url = new URL(href, location.href).href;
    fetchAndReplace(url, true);
  });

  // handle back/forward
  window.addEventListener('popstate', function (e) {
    fetchAndReplace(location.href, false);
  });

  // optional: re-run this file's init when pjax:complete fires (useful for re-binding UI behavior)
  window.addEventListener('pjax:complete', function () {
    // for now, simply re-run any modules that need to bind to content
    // e.g., profile image script listens for DOMContentLoaded only; if it needs to rebind,
    // you can call its init function here. As a minimal step, we'll re-run DOMContentLoaded handlers.
    document.dispatchEvent(new Event('DOMContentLoaded'));
  });
})();
