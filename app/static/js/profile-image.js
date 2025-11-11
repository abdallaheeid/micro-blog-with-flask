// Encapsulate init so we can run it on initial load and after PJAX swaps
function initProfileImage() {
  const wrapper = document.querySelector('.profile-image-wrapper');
  if (!wrapper) return;
  const btn = document.getElementById('changeProfileBtn');
  const fileInput = document.getElementById('profileFileInput');
  const img = document.getElementById('profileImage');
  const username = wrapper.dataset.username;

  // make sure we don't attach duplicate handlers: remove existing listeners by cloning
  // (simple way to avoid duplicates)
  const replaceHandler = (el) => {
    if (!el) return null;
    const cloned = el.cloneNode(true);
    el.parentNode.replaceChild(cloned, el);
    return cloned;
  };

  // ensure fresh elements
  const freshBtn =
    replaceHandler(btn) || document.getElementById('changeProfileBtn');
  const freshFile =
    replaceHandler(fileInput) || document.getElementById('profileFileInput');

  // show change button on hover (JS fallback; CSS handles hover as well)
  wrapper.addEventListener('mouseenter', () => {
    if (freshBtn) freshBtn.style.display = 'inline-block';
  });
  wrapper.addEventListener('mouseleave', () => {
    if (freshBtn) freshBtn.style.display = 'none';
  });

  if (freshBtn) {
    freshBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (freshFile) freshFile.click();
    });
  }

  if (freshFile) {
    freshFile.addEventListener('change', async () => {
      const file = freshFile.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('file', file);
      // include CSRF token taken from the rendered form field
      const csrfInput = document.querySelector('input[name="csrf_token"]');
      if (csrfInput) {
        formData.append('csrf_token', csrfInput.value);
      }
      // show spinner
      const spinner = freshBtn.querySelector('#uploadSpinner');
      const icon = freshBtn.querySelector('#changeIcon');
      if (spinner) spinner.classList.remove('d-none');
      if (icon) icon.classList.add('d-none');
      freshBtn.disabled = true;

      try {
        const resp = await fetch(
          `/user/${encodeURIComponent(username)}/upload_profile_image`,
          {
            method: 'POST',
            body: formData,
            credentials: 'same-origin',
          }
        );
        const data = await resp.json();
        if (resp.ok && data.success) {
          // update image src (cache-bust)
          if (img) img.src = data.url + '?t=' + Date.now();
        } else {
          alert(data.error || 'Upload failed');
        }
      } catch (err) {
        console.error(err);
        alert('Upload failed');
      } finally {
        // clear input
        if (freshFile) freshFile.value = '';
        // hide spinner
        if (spinner) spinner.classList.add('d-none');
        if (icon) icon.classList.remove('d-none');
        freshBtn.disabled = false;
      }
    });
  }
}

// run on initial load
document.addEventListener('DOMContentLoaded', initProfileImage);
// run after PJAX swaps
window.addEventListener('pjax:complete', initProfileImage);
