document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('loginForm');
  const status = document.getElementById('loginStatus');
  if (!form || !status) return;
  form.addEventListener('submit', event => event.preventDefault());
  let csrf;
  form.querySelector('button[type="submit"]').disabled = true;
  const show = message => { status.textContent = message; status.hidden = false; };
  try {
    const response = await fetch('/api/v1/auth/csrf', { credentials: 'same-origin' });
    const payload = await response.json();
    if (!response.ok) throw new Error('Auth unavailable');
    csrf = payload.data.csrf_token;
  } catch { show('Layanan autentikasi belum tersedia. Hubungi administrator.'); return; }
  form.querySelector('button[type="submit"]').disabled = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    status.hidden = true;
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        body: JSON.stringify({ username: form.username.value, password: form.password.value })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || 'Login gagal.');
      window.location.assign('/account');
    } catch (error) {
      show(error.message);
      button.disabled = false;
    }
  });
});
