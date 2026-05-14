// ---------- Formatting / DOM / modal / toast helpers ----------
window.U = (() => {
  const usd = (n) => (n ?? 0).toLocaleString('en-US', { style:'currency', currency:'USD', maximumFractionDigits: 0 });
  const usdC = (n) => (n ?? 0).toLocaleString('en-US', { style:'currency', currency:'USD' });
  const date = (s) => {
    if (!s) return '';
    const d = new Date(s);
    if (isNaN(d)) return s;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  const datetime = (s) => {
    if (!s) return '';
    const d = new Date(s);
    if (isNaN(d)) return s;
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };
  const esc = (s='') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const $  = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  const uid = (pfx='X') => `${pfx}-${Date.now().toString(36)}-${Math.floor(Math.random()*1e4).toString(36)}`;

  function fileSize(bytes) {
    if (!bytes) return '0 B';
    const u = ['B','KB','MB','GB']; let i=0; let n=bytes;
    while (n >= 1024 && i < u.length-1) { n/=1024; i++; }
    return `${n.toFixed(n<10?1:0)} ${u[i]}`;
  }

  const statusBadge = (s) => {
    const map = {
      'Active':       'badge-green',
      'Pending UW':   'badge-amber',
      'Expired':      'badge-slate',
      'Cancelled':    'badge-rose',
      'Paid':         'badge-green',
      'Open':         'badge-amber',
      'Draft':        'badge-slate',
      'received':     'badge-green',
      'pending':      'badge-amber',
      'Prospect':     'badge-slate',
      'Quoting':      'badge-violet',
      'Submitted':    'badge-blue',
      'Bid Awaiting': 'badge-amber',
      'Won':          'badge-green',
      'Lost':         'badge-rose',
    };
    return `<span class="badge ${map[s] || 'badge-slate'}">${esc(s)}</span>`;
  };

  // -- Modal --
  function modal({ title, body, footer, size='md' }) {
    const root = document.getElementById('modal-root');
    const id = 'mdl-' + Math.random().toString(36).slice(2,8);
    root.innerHTML = `
      <div id="${id}" class="modal-backdrop">
        <div class="modal ${size==='lg'?'modal-lg':''}">
          <div class="modal-header">
            <h3 class="text-base font-semibold text-slate-900">${title}</h3>
            <button class="text-slate-400 hover:text-slate-700 text-xl leading-none" data-close>&times;</button>
          </div>
          <div class="modal-body">${body || ''}</div>
          ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
        </div>
      </div>`;
    const el = document.getElementById(id);
    const close = () => { el.remove(); };
    el.addEventListener('click', e => { if (e.target === el) close(); });
    el.querySelector('[data-close]')?.addEventListener('click', close);
    return { el, close };
  }
  function closeModals() { document.getElementById('modal-root').innerHTML = ''; }

  // -- Toast --
  function toast(msg, type='success') {
    const root = document.getElementById('toast-root');
    const color = { success: 'bg-emerald-600', info: 'bg-slate-800', warn: 'bg-amber-600', error: 'bg-rose-600' }[type] || 'bg-slate-800';
    const el = document.createElement('div');
    el.className = `toast ${color}`;
    el.innerHTML = `<span>${esc(msg)}</span>`;
    root.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .25s'; }, 2400);
    setTimeout(() => el.remove(), 2700);
  }

  return { usd, usdC, date, datetime, esc, $, $$, uid, fileSize, statusBadge, modal, closeModals, toast };
})();
