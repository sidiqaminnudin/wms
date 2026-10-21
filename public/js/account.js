document.addEventListener('DOMContentLoaded', async () => {
  const status = document.getElementById('accountStatus');
  const data = document.getElementById('accountData');
  const select = document.getElementById('companySelect');
  let csrf;
  const fail = message => { status.textContent = message; status.hidden = false; };
  const request = async (path, body) => {
    const response = await fetch(`/api/v1/auth${path}`, {
      method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf || '' },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const payload = response.status === 204 ? null : await response.json();
    if (!response.ok) {
      if (response.status === 401) window.location.assign('/login');
      throw new Error(payload?.error?.message || 'Permintaan gagal. Coba lagi.');
    }
    return payload?.data;
  };
  document.getElementById('switchCompany').onclick = async () => {
    try {
      const result = await request('/active-company', { company_id: select.value });
      csrf = result.csrf_token;
      window.location.reload();
    } catch (error) { fail(error.message); }
  };
  document.getElementById('logout').onclick = async () => {
    try { await request('/logout', {}); window.location.assign('/login'); }
    catch (error) { fail(error.message); }
  };
  try {
    csrf = (await request('/csrf')).csrf_token;
    const me = await request('/me');
    document.getElementById('userName').textContent = me.user.name;
    me.allowed_companies.forEach(company => select.add(new Option(`${company.code} — ${company.name}`, company.id, false, company.id === me.active_company_id)));
    data.hidden = false;
    status.hidden = true;
    const list = document.getElementById('warehouseList');
    const warehouses = me.permissions.includes('warehouse.read') ? await request('/warehouses') : [];
    const labels = warehouses.length ? warehouses.map(item => `${item.code} — ${item.name}`) : ['Belum ada gudang yang dapat diakses.'];
    labels.forEach(text => { const item = document.createElement('li'); item.textContent = text; list.appendChild(item); });
  } catch (error) { fail(error.message); }
});

