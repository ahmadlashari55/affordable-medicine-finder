/* ------------------ DATA ------------------ */
const MEDS = [
  {id:'m1',name:'Panadol',generic:'Paracetamol',price:25,priceText:'Rs.25/10',brands:['Panadol'],alternatives:['Paracet','Napa'],desc:'Analgesic/antipyretic',image:'',expiry:'2026-12',prescription:false},
  {id:'m2',name:'Augmentin',generic:'Amoxicillin + Clavulanic Acid',price:350,priceText:'Rs.350/10',brands:['Augmentin'],alternatives:['Amoclav'],desc:'Antibiotic',expiry:'2025-06',prescription:true},
  {id:'m3',name:'Disprin',generic:'Aspirin',price:15,priceText:'Rs.15/10',brands:['Disprin'],alternatives:['Ecosprin'],desc:'Pain relief, blood thinner',expiry:'2027-01',prescription:false},
  {id:'m4',name:'Flagyl',generic:'Metronidazole',price:80,priceText:'Rs.80/10',brands:['Flagyl'],alternatives:['Metrogyl'],desc:'Antiprotozoal',expiry:'2026-03',prescription:true},
  {id:'m5',name:'Napa',generic:'Paracetamol',price:22,priceText:'Rs.22/10',brands:['Napa'],alternatives:['Panadol'],desc:'Generic paracetamol',expiry:'2026-08',prescription:false}
];

const PHARMS = [
  {id:'p1',name:'Sehat Pharmacy',city:'Lahore',address:'Model Town',verified:true,stock:{m1:20,m2:5},contact:'+92300111222',lat:31.5204,lng:74.3587,opening:'9:00-21:00'},
  {id:'p2',name:'Clinix Pharmacy',city:'Karachi',address:'Gulshan',verified:true,stock:{m1:50,m3:10},contact:'+92215554444',lat:24.8607,lng:67.0011,opening:'8:00-22:00'},
  {id:'p3',name:'Imtiaz Pharmacy',city:'Karachi',address:'North Nazimabad',verified:false,stock:{m4:12,m2:2},contact:'+92216667777',lat:24.9570,lng:67.0685,opening:'9:00-20:00'},
  {id:'p4',name:'D.Watson',city:'Islamabad',address:'F-6 Markaz',verified:true,stock:{m1:5,m5:40},contact:'+9251123456',lat:33.6844,lng:73.0479,opening:'10:00-20:00'},
  {id:'p5',name:'Servaid Pharmacy',city:'Multan',address:'New Garden',verified:false,stock:{m2:3,m3:9},contact:'+9261333222',lat:30.1575,lng:71.5249,opening:'9:00-19:00'}
];

/* --------------- STATE & STORAGE --------------- */
let state = { results: [], selected: null, favorites: JSON.parse(localStorage.getItem('am_favs')||'[]'), lang:'en', theme: localStorage.getItem('am_theme')||'light' };

/* ------------------ DOM ------------------ */
const qInput = document.getElementById('q');
const dropdown = document.getElementById('dropdown');
const resultsEl = document.getElementById('results');
const noResultsEl = document.getElementById('noResults');
const detailEl = document.getElementById('detailCard');
const pharmListEl = document.getElementById('pharmList');
const favListEl = document.getElementById('favList');

/* ------------------ UTILS ------------------ */
function fuzzyMatch(s, q){ q=q.toLowerCase(); s=s.toLowerCase(); return s.includes(q); }
function saveFavs(){ localStorage.setItem('am_favs', JSON.stringify(state.favorites)); renderFavs(); }
function toggleFav(medId){ if(state.favorites.includes(medId)){ state.favorites = state.favorites.filter(x=>x!==medId); } else state.favorites.push(medId); saveFavs(); }
function isFav(medId){ return state.favorites.includes(medId); }

/* --------------- RENDERING --------------- */
function renderDropdown(list){ if(list.length===0){ dropdown.style.display='none'; return; } dropdown.innerHTML = list.map(m=>`<div class="item" data-id="${m.id}"><strong>${m.name}</strong><div class="muted small">${m.generic} • ${m.priceText}</div></div>`).join(''); dropdown.style.display='block'; dropdown.querySelectorAll('.item').forEach(it=>it.addEventListener('click',()=>{ qInput.value = it.querySelector('strong').innerText; dropdown.style.display='none'; runSearch(qInput.value); })); }

function renderResults(list){ resultsEl.innerHTML=''; if(list.length===0){ noResultsEl.style.display='block'; return; } noResultsEl.style.display='none'; list.forEach(m=>{ const el = document.createElement('div'); el.className='medItem'; el.innerHTML = `<div class="medInfo"><p class="medName">${m.name} <span class="muted small">(${m.generic})</span></p><div class="muted small">${m.desc} • ${m.priceText}</div></div><div class="row"><button class="iconBtn" data-fav="${m.id}" title="Toggle favourite">${isFav(m.id)?'★':'☆'}</button><button class="pill" data-id="${m.id}">View</button></div>`; resultsEl.appendChild(el); });
  // attach
  resultsEl.querySelectorAll('.pill').forEach(btn=>btn.addEventListener('click',()=>selectMed(btn.dataset.id)));
  resultsEl.querySelectorAll('[data-fav]').forEach(btn=>btn.addEventListener('click',()=>{ toggleFav(btn.dataset.fav); renderResults(state.results); }));
}

function renderDetail(med){ detailEl.style.display='block'; const city = document.getElementById('city').value; const onlyVerified = document.getElementById('showType').value==='verified'; const nearby = PHARMS.filter(p=> (city==='all'||p.city===city) && (!onlyVerified||p.verified) && (p.stock[med.id]||0)>0);
  detailEl.innerHTML = `<h2 style="margin:0">${med.name} <span class="muted small">(${med.generic})</span></h2><div class="muted small">${med.desc}</div><div class="row" style="margin-top:8px"><div><strong>Price:</strong> ${med.priceText}</div><div class="muted small">Expiry: ${med.expiry}</div></div><div class="detail"><div style="margin-top:8px"><strong>Alternatives:</strong><div class="altList">${med.alternatives.map(a=>`<div class="alt">${a}</div>`).join('')}</div></div><div style="margin-top:12px"><strong>Available at (${nearby.length}):</strong><div style="margin-top:8px">${nearby.map(p=>`<div class="pharm"><div class="row" style="justify-content:space-between"><div><h4 style="margin:0">${p.name} ${p.verified?'<span style="muted" style="color:var(--success)">✔</span>':''}</h4><div class="muted small">${p.address} • ${p.city}</div></div><div class="small">Qty: ${p.stock[med.id]||0}</div></div><div style="margin-top:6px" class="row"><a href="tel:${p.contact}" class="iconBtn">Call</a><a href="https://wa.me/${p.contact.replace(/[^0-9]/g,'')}?text=${encodeURIComponent('I want '+med.name)}" target="_blank" class="btn">WhatsApp</a><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address+' '+p.city)}" target="_blank" class="iconBtn">Map</a></div></div>`).join('')}</div></div></div>`;
}

function renderPharmacies(list){ pharmListEl.innerHTML = list.map(p=>`<div class="pharm"><h4 style="margin:0">${p.name} ${p.verified?'<span style="muted" style="color:var(--success)">✔</span>':''}</h4><div class="muted small">${p.address} • ${p.city}</div><div class="muted small">Hours: ${p.opening}</div><div style="margin-top:6px"><a href="tel:${p.contact}" class="iconBtn">Call</a> <a href="https://wa.me/${p.contact.replace(/[^0-9]/g,'')}" target="_blank" class="btn">WhatsApp</a></div></div>`).join(''); }

function renderFavs(){ const favs = state.favorites.map(id=>MEDS.find(m=>m.id===id)).filter(Boolean); if(favs.length===0){ favListEl.innerHTML='<div class="muted small">No favourites yet</div>'; return; } favListEl.innerHTML = favs.map(m=>`<div class="row" style="justify-content:space-between;padding:6px 0"><div><strong>${m.name}</strong> <div class="muted small">${m.generic}</div></div><div><button class="iconBtn" data-open="${m.id}">View</button><button class="iconBtn" data-remove="${m.id}">Remove</button></div></div>`).join(''); favListEl.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>selectMed(b.dataset.open))); favListEl.querySelectorAll('[data-remove]').forEach(b=>b.addEventListener('click',()=>{ state.favorites = state.favorites.filter(x=>x!==b.dataset.remove); saveFavs(); })); }

/* --------------- SEARCH & INTERACTIONS --------------- */
function runSearch(qraw){ const q = (qraw||qInput.value||'').trim(); if(!q){ state.results = []; renderResults([]); detailEl.style.display='none'; return; }
  // fuzzy search: name or generic
  let res = MEDS.filter(m=> fuzzyMatch(m.name,q) || fuzzyMatch(m.generic,q));
  const sortBy = document.getElementById('sortBy').value;
  if(sortBy==='priceLow') res.sort((a,b)=>a.price-b.price);
  if(sortBy==='priceHigh') res.sort((a,b)=>b.price-a.price);
  state.results = res; renderResults(res); renderPharmacies(PHARMS.filter(p=> document.getElementById('city').value==='all' || p.city===document.getElementById('city').value));
}

function selectMed(id){ const med = MEDS.find(m=>m.id===id); state.selected = med; renderDetail(med); window.scrollTo({top:200,behavior:'smooth'}); }

// suggestions while typing
qInput.addEventListener('input', (e)=>{ const v = e.target.value.trim(); if(!v){ dropdown.style.display='none'; return; } const matches = MEDS.filter(m=> fuzzyMatch(m.name,v) || fuzzyMatch(m.generic,v)).slice(0,8); renderDropdown(matches); });

// keyboard shortcut to focus /
document.addEventListener('keydown',(e)=>{ if(e.key==='/' && document.activeElement!==qInput){ e.preventDefault(); qInput.focus(); } });

// voice search (webkit)
const voiceBtn = document.getElementById('voiceBtn'); if('webkitSpeechRecognition' in window){ const rec = new webkitSpeechRecognition(); rec.lang='en-US'; rec.onresult=e=>{ const t = e.results[0][0].transcript; qInput.value = t; runSearch(t); }; voiceBtn.addEventListener('click',()=>rec.start()); } else { voiceBtn.style.opacity=0.5; voiceBtn.title='Voice not supported'; }

// search button
document.getElementById('searchBtn').addEventListener('click', ()=>runSearch(qInput.value));

// city change
document.getElementById('city').addEventListener('change', ()=>{ renderPharmacies(PHARMS.filter(p=> document.getElementById('city').value==='all' || p.city===document.getElementById('city').value)); if(state.selected) renderDetail(state.selected); });

// sort / filters
['sortBy','showType'].forEach(id=>document.getElementById(id).addEventListener('change', ()=>runSearch(qInput.value)));

// export CSV
document.getElementById('exportBtn').addEventListener('click', ()=>{
  const rows = state.results.map(m=>[m.name,m.generic,m.priceText,m.desc].join(','));
  if(rows.length===0) return alert('No results to export');
  const csv = 'Name,Generic,Price,Description\n' + rows.join('\n');
  const blob = new Blob([csv],{type:'text/csv'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download = 'medicines.csv'; a.click(); URL.revokeObjectURL(url);
});

/* --------------- THEME & LANG --------------- */
const themeBtn = document.getElementById('themeBtn'); function applyTheme(t){ document.documentElement.setAttribute('data-theme', t==='dark'?'dark':'light'); localStorage.setItem('am_theme', t); } applyTheme(state.theme);
themeBtn.addEventListener('click', ()=>{ state.theme = (state.theme==='dark'?'light':'dark'); applyTheme(state.theme); });

// language toggle (basic)
const langBtn = document.getElementById('langBtn'); langBtn.addEventListener('click', ()=>{ state.lang = state.lang==='en'?'ur':'en'; langBtn.innerText = state.lang==='en'?'اردو':'EN'; alert('Language toggle: only UI labels change in this prototype. Full Urdu content requires translations.'); });

/* --------------- INIT --------------- */
renderPharmacies(PHARMS); renderFavs();
/* main front-end behavior for static prototype */

// ----- state -----
const state = {
  results: [],
  selected: null,
  favorites: JSON.parse(localStorage.getItem('am_favs')||'[]'),
  lang: 'en',
  theme: localStorage.getItem('am_theme')||'light'
};

// DOM
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

// ----- helpers -----
function fuzzy(s,q){ return s.toLowerCase().includes(q.toLowerCase()); }
function saveFavs(){ localStorage.setItem('am_favs', JSON.stringify(state.favorites)); renderFavs(); }
function toggleFav(id){ state.favorites = state.favorites.includes(id) ? state.favorites.filter(x=>x!==id) : [...state.favorites,id]; saveFavs(); }
function isFav(id){ return state.favorites.includes(id); }
function applyTheme(){ document.documentElement.setAttribute('data-theme', state.theme==='dark' ? 'dark' : 'light'); localStorage.setItem('am_theme', state.theme); }

// ----- rendering -----
function renderSuggestions(list){
  if(!list || list.length===0){ suggestionsEl.hidden = true; return; }
  suggestionsEl.innerHTML = list.map(m=>`<div class="item" data-id="${m.id}"><strong>${m.name}</strong><div class="muted">${m.generic} • ${m.priceText}</div></div>`).join('');
  suggestionsEl.hidden = false;
  suggestionsEl.querySelectorAll('.item').forEach(it=>it.addEventListener('click', ()=>{ qInput.value = it.querySelector('strong').innerText; suggestionsEl.hidden=true; runSearch(qInput.value); }));
}

function renderResults(list){
  resultsEl.innerHTML = '';
  if(!list || list.length===0){ noResultsEl.hidden = false; return; }
  noResultsEl.hidden = true;
  list.forEach(m=>{
    const div = document.createElement('div'); div.className = 'med-item';
    div.innerHTML = `
      <div class="med-info">
        <div class="med-name">${m.name} <span class="muted">(${m.generic})</span></div>
        <div class="muted small">${m.desc} • ${m.priceText}</div>
      </div>
      <div class="row">
        <button class="btn" data-fav="${m.id}">${isFav(m.id)?'★':'☆'}</button>
        <button class="pill" data-id="${m.id}">View</button>
      </div>
    `;
    resultsEl.appendChild(div);
  });

  // attach events
  resultsEl.querySelectorAll('.pill').forEach(b=>b.addEventListener('click', ()=>selectMed(b.dataset.id)));
  resultsEl.querySelectorAll('[data-fav]').forEach(b=>b.addEventListener('click', ()=>{ toggleFav(b.dataset.fav); renderResults(state.results); }));
}

function renderDetail(m){
  detailCard.hidden = false;
  const city = citySel.value;
  const onlyVerified = showTypeSel.value === 'verified';
  const nearby = PHARMS.filter(p=> (city==='all' || p.city===city) && (!onlyVerified || p.verified) && (p.stock[m.id]||0)>0 );
  detailCard.innerHTML = `
    <h2>${m.name} <span class="muted">(${m.generic})</span></h2>
    <div class="muted">${m.desc}</div>
    <div style="margin-top:8px"><strong>Price:</strong> ${m.priceText} • <span class="muted">Expiry: ${m.expiry}</span></div>
    <div style="margin-top:12px"><strong>Alternatives:</strong>
      <div style="display:flex;gap:8px;margin-top:8px">${m.alternatives.map(a=>`<div class="pill" style="background:#fff">${a}</div>`).join('')}</div>
    </div>
    <div style="margin-top:12px"><strong>Available at (${nearby.length}):</strong>
      <div style="margin-top:8px">${nearby.map(p=>`<div class="pharm"><div style="display:flex;justify-content:space-between;align-items:center"><div><strong>${p.name}</strong> <span class="muted">${p.city}</span></div><div class="muted">Qty: ${p.stock[m.id]||0}</div></div>
      <div style="margin-top:8px"><a href="tel:${p.contact}" class="btn">Call</a> <a target="_blank" href="https://wa.me/${p.contact.replace(/[^0-9]/g,'')}?text=${encodeURIComponent('I want '+m.name)}" class="btn primary">WhatsApp</a></div></div>`).join('')}</div>
    </div>
  `;
  // scroll into view
  detailCard.scrollIntoView({behavior:'smooth',block:'center'});
}

function renderPharmacies(){
  const city = citySel.value;
  const list = PHARMS.filter(p => city==='all' || p.city===city);
  pharmList.innerHTML = list.map(p=>`<div class="pharm"><strong>${p.name}</strong><div class="muted">${p.address} • ${p.city}</div><div class="muted">Hours: ${p.opening}</div><div style="margin-top:6px"><a href="tel:${p.contact}" class="btn">Call</a> <a target="_blank" href="https://wa.me/${p.contact.replace(/[^0-9]/g,'')}" class="btn primary">WhatsApp</a></div></div>`).join('');
}

function renderFavs(){
  const favs = state.favorites.map(id => MEDS.find(m=>m.id===id)).filter(Boolean);
  if(favs.length===0){ favList.innerHTML = '<div class="muted">No favourites yet</div>'; return; }
  favList.innerHTML = favs.map(m=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0"><div><strong>${m.name}</strong><div class="muted small">${m.generic}</div></div><div><button class="btn" data-open="${m.id}">View</button> <button class="btn" data-remove="${m.id}">Remove</button></div></div>`).join('');
  favList.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click', ()=>selectMed(b.dataset.open)));
  favList.querySelectorAll('[data-remove]').forEach(b=>b.addEventListener('click', ()=>{ state.favorites = state.favorites.filter(x=>x!==b.dataset.remove); saveFavs(); }));
}

// ----- search logic -----
function runSearch(qRaw){
  const q = (qRaw || qInput.value || '').trim();
  if(!q){ state.results = []; renderResults([]); return; }
  let res = MEDS.filter(m => fuzzy(m.name, q) || fuzzy(m.generic, q));
  // sorting
  if(sortSel.value === 'priceLow') res.sort((a,b)=>a.price-b.price);
  if(sortSel.value === 'priceHigh') res.sort((a,b)=>b.price-a.price);
  state.results = res;
  renderResults(res);
  renderPharmacies();
}

// ----- interactions -----
qInput.addEventListener('input', e=>{
  const v = e.target.value.trim();
  if(!v){ suggestionsEl.hidden = true; return; }
  const matches = MEDS.filter(m => fuzzy(m.name, v) || fuzzy(m.generic, v)).slice(0,8);
  renderSuggestions(matches);
});

// keyboard focus shortcut
document.addEventListener('keydown', e => { if(e.key==='/' && document.activeElement !== qInput){ e.preventDefault(); qInput.focus(); } });

// search button
searchBtn.addEventListener('click', ()=>runSearch());

// city / filter changes
citySel.addEventListener('change', ()=>{ renderPharmacies(); if(state.selected) renderDetail(state.selected); });
sortSel.addEventListener('change', ()=>runSearch());
showTypeSel.addEventListener('change', ()=>runSearch());

// export CSV
exportBtn.addEventListener('click', ()=>{
  if(!state.results || state.results.length===0) return alert('No results to export');
  const rows = state.results.map(m => [m.name, m.generic, m.priceText, m.desc].map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(','));
  const csv = 'Name,Generic,Price,Description\n' + rows.join('\n');
  const blob = new Blob([csv], {type:'text/csv'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'medicines.csv'; a.click(); URL.revokeObjectURL(url);
});

// favorites view
favViewBtn.addEventListener('click', ()=> renderFavs());

// toggle theme
themeBtn.addEventListener('click', ()=>{ state.theme = state.theme === 'dark' ? 'light' : 'dark'; applyTheme(); });
applyTheme();

// language toggle (UI only stub)
langBtn.addEventListener('click', ()=>{ state.lang = state.lang === 'en' ? 'ur' : 'en'; langBtn.innerText = state.lang === 'en' ? 'اردو' : 'EN'; alert('Language toggle switched. To fully support Urdu you will replace labels/text with Urdu translations (manual).'); });

// voice search (WebKit)
if('webkitSpeechRecognition' in window){
  const rec = new webkitSpeechRecognition();
  rec.lang = 'en-US';
  rec.onresult = e => { const text = e.results[0][0].transcript; qInput.value = text; runSearch(text); };
  voiceBtn.addEventListener('click', ()=>rec.start());
} else {
  voiceBtn.style.opacity = 0.5; voiceBtn.title = 'Voice not supported';
}

// select a medicine by id
function selectMed(id){
  const med = MEDS.find(m=>m.id===id);
  if(!med) return;
  state.selected = med;
  renderDetail(med);
}

// init
renderPharmacies();
renderFavs();
