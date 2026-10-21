document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-progress]').forEach(element => {
    const inner = element.querySelector('span');
    const value = Number(element.dataset.progress);
    if (inner && Number.isFinite(value)) inner.style.width = `${Math.max(0, Math.min(100, value))}%`;
  });

  document.querySelectorAll('[data-preview-toast]').forEach(button => button.addEventListener('click', () => {
    const toast = button.closest('section')?.querySelector('.toast');
    if (toast && window.bootstrap?.Toast) window.bootstrap.Toast.getOrCreateInstance(toast).show();
  }));

  const sidebar = document.getElementById('appSidebar');
  if (!sidebar) return;
  const toggles = [...document.querySelectorAll('[data-sidebar-toggle]')];
  const mobile = window.matchMedia('(max-width: 1120px)');
  const content = document.querySelector('main.content');
  let opener;
  let backdrop;

  function setOpen(open, restoreFocus = true) {
    open = mobile.matches && open;
    if (!open && sidebar.contains(document.activeElement)) {
      const target = mobile.matches ? (opener || toggles[0]) : content?.querySelector('input, button, a[href]');
      target?.focus();
    }
    sidebar.classList.toggle('open', open);
    sidebar.inert = mobile.matches && !open;
    if (sidebar.inert) sidebar.setAttribute('aria-hidden', 'true');
    else sidebar.removeAttribute('aria-hidden');
    toggles.forEach(button => button.setAttribute('aria-expanded', String(open)));
    document.body.classList.toggle('sidebar-is-open', open);
    backdrop?.remove();
    backdrop = undefined;
    if (open) {
      backdrop = document.createElement('div');
      backdrop.className = 'sidebar-backdrop';
      backdrop.setAttribute('aria-hidden', 'true');
      backdrop.addEventListener('click', () => setOpen(false));
      document.body.appendChild(backdrop);
      sidebar.querySelector('a[href]')?.focus();
    } else if (restoreFocus && mobile.matches) {
      opener?.focus();
    }
  }

  toggles.forEach(button => button.addEventListener('click', () => {
    opener = button;
    setOpen(!sidebar.classList.contains('open'));
  }));
  document.addEventListener('keydown', event => {
    if (!sidebar.classList.contains('open')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === 'Tab') {
      const links = [...sidebar.querySelectorAll('a[href], button:not([disabled])')];
      const first = links[0];
      const last = links.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  });
  mobile.addEventListener('change', () => setOpen(false, false));
  setOpen(false, false);
});
