import test from 'node:test';
import assert from 'node:assert/strict';
import ejs from 'ejs';
import { fileURLToPath } from 'node:url';

const render = (name, data = {}) => ejs.renderFile(fileURLToPath(new URL(`../views/partials/_${name}.ejs`, import.meta.url)), data);

test('partials render with required data and optional defaults', async () => {
  for (const [name, data] of [
    ['modal', { id: 'example', title: 'Judul', body: '<p>Trusted markup</p>' }],
    ['toast', { message: 'Pesan' }], ['empty-state', { title: 'Kosong' }],
    ['pagination', {}], ['tabs', {}], ['timeline', {}]
  ]) {
    assert.ok((await render(name, data)).trim(), name);
  }
});

test('text content is escaped in all six partials', async () => {
  const text = '<script>alert(1)</script>';
  for (const [name, data] of [
    ['modal', { id: 'example', title: text, body: '' }],
    ['toast', { message: text }], ['empty-state', { title: text }],
    ['pagination', { pages: [{ number: text, href: '/items' }] }],
    ['tabs', { tabs: [{ id: 'all', label: text, href: '/items' }] }],
    ['timeline', { items: [{ title: text, meta: text, description: text }] }]
  ]) {
    const html = await render(name, data);
    assert.ok(!html.includes(text), name);
    assert.match(html, /&lt;script&gt;/, name);
  }
});

test('pagination and link tabs emit valid current-page attributes', async () => {
  const pagination = await render('pagination', { current: 1, pages: [{ number: 1, href: '/items?page=1' }], next: '/items?page=2' });
  assert.match(pagination, /aria-current="page"/);
  assert.match(pagination, /<span class="page-link" aria-disabled="true">Sebelumnya/);
  assert.match(pagination, /href="\/items\?page=2"/);
  const tabs = await render('tabs', { active: 'all', tabs: [{ id: 'all', label: 'Semua', href: '/items' }] });
  assert.match(tabs, /aria-current="page"/);
  assert.doesNotMatch(tabs, /role="tab/);
});

test('modal accepts only known Bootstrap sizes and trusted body markup', async () => {
  const html = await render('modal', { id: 'example', title: 'Judul', body: '<p>Isi</p>', size: 'lg', actions: '<button>Tutup</button>' });
  assert.match(html, /modal-lg/);
  assert.match(html, /<p>Isi<\/p>/);
  assert.match(html, /modal-footer/);
  const invalid = await render('modal', { id: 'example', title: '', body: '', size: 'invalid' });
  assert.doesNotMatch(invalid, /modal-invalid/);
});
