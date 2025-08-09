// frontend/script.js
// API base (backend must be running on this port)
const API_BASE = 'http://localhost:5000/api';

// Elements
const qInput = document.getElementById('q');
const suggestionsEl = document.getElementById('suggestions');
const resultsEl = document.getElementById('results');
const noResultsEl = document.getElementById('noResults');
const detailCard = document.getElementById('detailCard');
const pharmList = document.getElementById('pharmList');
const favList = document.getElementById('favList');
const citySel = document.getElementById('city');
const sortSel = document.getElementById('sortBy');
const showTypeSel = document.getElementById('showType');
const searchBtn = document.getElementById('searchBtn');
const exportBtn = document.getElementById('exportBtn');
const favViewBtn = document.getElementById('favViewBtn');
const themeBtn = document.getElementById('themeBtn');
const langBtn = document.getElementById('langBtn');
const voiceBtn = document.getElementById('voiceBtn');

const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const emailInput = document.getElementById('email');
const passInput = document.getElementById('password');
const profileName = document.getElementById('profileName');
const logoutBtn = document.getElementById('logoutBtn');

let state = {
  results: [],
  selected: null,
  favorites: JSON.parse(localStorage.getItem('am_favs')||'[]'),
  token: localStorage.getItem('am_token')||null,
  theme: localStorage.getItem('am_theme') || 'light'
};

function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme === 'dark' ? 'dark' : 'light');
  localStorage.setItem('am_theme', state.theme);
}
applyTheme();

function apiFetch(path, opts = {}) {
  opts.headers = opts.headers || {};
  if (state.token) opts.headers['Authorization'] = 'Bearer ' + state.token;
  return fetch(API_BASE + path, opts).then(r => r.json());
}

// Suggestions (local client-side quick)
let suggestionTimer;
qInput.addEventListener('input', (e) => {
  const v = e.target.value.trim();
  if (!v) { suggestionsEl.hidden = true; return; }
  clearTimeout(suggestionTimer);
  suggestionTimer = setTimeout(async () => {
    try {
      const list = await apiFetch(`/medicines?q=${encodeURIComponent(v)}&limit=8`);
      if (list && list.length) {
        suggestionsEl.innerHTML = list.map(m => `<div class="item" data-id="${m.id}"><strong>${m.name}</strong><div class="muted">${m.generic} • ${m.priceText}</div></div>`).join('');
        suggestionsEl.hidden = false;
        suggestionsEl.querySelectorAll('.item').forEach(it => it.addEventListener('click', () => {
          qInput.value = it.querySelector('strong').innerText;
          suggestionsEl.hidden = true;
          runSearch(qInput.value);
        }));
      } else {
        suggestionsEl.hidden = true;
      }
    } catch (err) {
      console.error('suggestion error', err);
      suggestionsEl.hidden = true;
    }
  }, 200);
});

document.addEventListener('click', (ev) => {
  if (!document.querySelector('.search-wrap').contains(ev.target)) suggestionsEl.hidden = true;
});

// Search / Render
async function runSearch(qRaw) {
  const q = (qRaw || qInput.value || '').trim();
  if (!q) { state.results = []; renderResults([]); return; }
  const city = citySel.value;
  const sort = sortSel.value;
  try {
    const list = await apiFetch(`/medicines?q=${encodeURIComponent(q)}&city=${encodeURIComponent(city)}&sort=${encodeURIComponent(sort)}&limit=50`);
    state.results = list;
    renderResults(list);
    renderPharmacies(); // refresh side pharmacy list
  } catch (err) {
    console.error('search error', err);
    // fallback: no results
    renderResults([]);
  }
}

function renderResults(list) {
  resultsEl.innerHTML = '';
  if (!list || list.length === 0) {
    noResultsEl.hidden = false;
    return;
  }
  noResultsEl.hidden = true;
  list.forEach(m => {
    const div = document.createElement('div');
    div.className = 'med-item';
    div.innerHTML = `<div class="med-info"><div class="med-name">${m.name} <span class="muted">(${m.generic})</span></div><div class="muted small">${m.desc} • ${m.priceText}</div></div>
    <div class="row">
      <button class="btn" data-fav="${m.id}">${state.favorites.includes(m.id)?'★':'☆'}</button>
      <button class="pill" data-id="${m.id}">View</button>
    </div>`;
    resultsEl.appendChild(div);
  });
  // attach
  resultsEl.querySelectorAll('.pill').forEach(b => b.addEventListener('click', () => selectMed(b.dataset.id)));
  resultsEl.querySelectorAll('[data-fav]').forEach(b => b.addEventListener('click', () => {
    const id = b.dataset.fav;
    toggleFav(id);
    renderResults(state.results);
  }));
}

async function selectMed(id) {
  try {
    const med = await apiFetch(`/medicines/${id}`);
    state.selected = med;
    renderDetail(med);
  } catch (err) {
    console.error('select med err', err);
  }
}

async function renderDetail(m) {
  detailCard.hidden = false;
  const city = citySel.value;
  const onlyVerified = showTypeSel.value === 'verified';
  try {
    const pharmResp = await apiFetch(`/pharmacies?city=${encodeURIComponent(city)}`);
    const nearby = pharmResp.filter(p => (!onlyVerified || p.verified) && (p.stock[m.id]||0) > 0);
    detailCard.innerHTML = `<h2>${m.name} <span class="muted small">(${m.generic})</span></h2><div class="muted">${m.desc}</div>
      <div style="margin-top:8px"><strong>Price:</strong> ${m.priceText} • <span class="muted">Expiry: ${m.expiry}</span></div>
      <div style="margin-top:12px"><strong>Alternatives:</strong>
        <div style="display:flex;gap:8px;margin-top:8px">${m.alternatives.map(a=>`<div class="pill" style="background:#fff">${a}</div>`).join('')}</div></div>
      <div style="margin-top:12px"><strong>Available at (${nearby.length}):</strong>
        <div style="margin-top:8px">${nearby.map(p=>`<div class="pharm"><div style="display:flex;justify-content:space-between;align-items:center"><div><strong>${p.name}</strong> <span class="muted">${p.city}</span></div><div class="muted">Qty: ${p.stock[m.id]||0}</div></div>
       <div style="margin-top:8px"><button class="btn order-btn" data-ph="${p.id}" data-med="${m.id}">Order from ${p.name}</button> <a href="https://wa.me/${p.contact.replace(/[^0-9]/g,'')}" target="_blank" class="btn primary">WhatsApp</a></div></div>`).join('')}</div></div>`;
    // attach order buttons
    detailCard.querySelectorAll('.order-btn').forEach(b => b.addEventListener('click', handleOrderFromButton));
  } catch(err) {
    console.error(err);
  }
}

async function handleOrderFromButton(e) {
  const pharmacyId = e.currentTarget.dataset.ph;
  const medId = e.currentTarget.dataset.med;
  const qty = 1;
  if (!state.token) return alert('Please login to place order');
  try {
    const res = await apiFetch('/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ id: medId, qty }], pharmacyId, address: 'User address' })
    });
    if (res.error) alert('Order failed: ' + res.error);
    else alert('Order placed: ' + res.order.id);
  } catch (err) {
    console.error(err);
    alert('Order error');
  }
}

async function renderPharmacies() {
  try {
    const p = await apiFetch('/pharmacies?city=all');
    pharmList.innerHTML = p.map(ph => `<div class="pharm"><strong>${ph.name}</strong><div class="muted">${ph.address} • ${ph.city}</div><div class="muted">Hours: ${ph.opening} • Rating: ${ph.rating}</div>
      <div style="margin-top:6px"><a href="tel:${ph.contact}" class="btn">Call</a> <a target="_blank" href="https://wa.me/${ph.contact.replace(/[^0-9]/g,'')}" class="btn primary">WhatsApp</a></div></div>`).join('');
  } catch(err) {
    console.error('pharm list', err);
  }
}

// Favorites
function toggleFav(id) {
  if (state.favorites.includes(id)) state.favorites = state.favorites.filter(x => x !== id);
  else state.favorites.push(id);
  localStorage.setItem('am_favs', JSON.stringify(state.favorites));
  renderFavs();
}

function renderFavs() {
  if (!state.favorites || state.favorites.length === 0) { favList.innerText = 'No favourites yet'; return; }
  favList.innerHTML = '<ul>' + state.favorites.map(id => `<li data-id="${id}">${id} <button class="btn open-fav" data-id="${id}">Open</button> <button class="btn remove-fav" data-id="${id}">Remove</button></li>`).join('') + '</ul>';
  favList.querySelectorAll('.open-fav').forEach(b => b.addEventListener('click', e => selectMed(e.target.dataset.id)));
  favList.querySelectorAll('.remove-fav').forEach(b => b.addEventListener('click', e => { state.favorites = state.favorites.filter(x => x !== e.target.dataset.id); localStorage.setItem('am_favs', JSON.stringify(state.favorites)); renderFavs(); }));
}

// Export CSV
exportBtn.addEventListener('click', () => {
  if (!state.results || state.results.length === 0) return alert('No results');
  const rows = state.results.map(m => [m.name, m.generic, m.priceText, m.desc].map(x => `"${String(x).replace(/"/g,'""')}"`).join(','));
  const csv = 'Name,Generic,Price,Desc\n' + rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'medicines.csv'; a.click();
});

// Auth: register / login
registerBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim(), password = passInput.value.trim();
  if (!email || !password) return alert('email & password required');
  try {
    const res = await apiFetch('/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'WebUser', email, password })
    });
    if (res.error) return alert(res.error);
    state.token = res.token; localStorage.setItem('am_token', res.token); alert('Registered & logged in');
    renderProfile();
  } catch (err) { console.error(err); alert('Register failed'); }
});

loginBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim(), password = passInput.value.trim();
  if (!email || !password) return alert('email & password required');
  try {
    const res = await apiFetch('/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
    });
    if (res.error) return alert(res.error);
    state.token = res.token; localStorage.setItem('am_token', res.token); alert('Logged in');
    renderProfile();
  } catch (err) { console.error(err); alert('Login failed'); }
});

logoutBtn.addEventListener('click', () => {
  state.token = null; localStorage.removeItem('am_token'); alert('Logged out'); renderProfile();
});

async function renderProfile() {
  if (!state.token) { document.getElementById('profile').hidden = true; return; }
  try {
    const me = await apiFetch('/me');
    if (me.error) { alert('Profile error'); return; }
    document.getElementById('profile').hidden = false;
    profileName.innerText = me.user.name + ' (' + me.user.email + ')';
  } catch (err) { console.error('profile', err); }
}

// voice search
if ('webkitSpeechRecognition' in window) {
  const rec = new webkitSpeechRecognition(); rec.lang = 'en-US';
  rec.onresult = (e) => { qInput.value = e.results[0][0].transcript; runSearch(qInput.value); };
  voiceBtn.addEventListener('click', () => rec.start());
} else voiceBtn.style.opacity = 0.5;

// keyboard shortcut to focus
document.addEventListener('keydown', e => { if (e.key === '/' && document.activeElement !== qInput) { e.preventDefault(); qInput.focus(); } });

// click handlers
searchBtn.addEventListener('click', () => runSearch(qInput.value));
citySel.addEventListener('change', () => runSearch(qInput.value));
sortSel.addEventListener('change', () => runSearch(qInput.value));
showTypeSel.addEventListener('change', () => runSearch(qInput.value));
favViewBtn.addEventListener('click', () => renderFavs());
applyTheme();
renderPharmacies();
renderFavs();
