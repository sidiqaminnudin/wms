
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-progress]').forEach(el => {
    const inner = el.querySelector('span');
    if (inner) inner.style.width = `${el.dataset.progress}%`;
  });
});
