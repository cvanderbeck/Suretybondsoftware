// Inline SVG icons for sidebar — keyed by `data-i` attribute.
window.Icons = (() => {
  const svg = (path) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">${path}</svg>`;
  const map = {
    dashboard:  svg('<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>'),
    pipeline:   svg('<path d="M3 6h18"/><path d="M3 12h12"/><path d="M3 18h6"/>'),
    leads:      svg('<circle cx="11" cy="8" r="4"/><path d="M3 21v-1a6 6 0 0112 0v1"/><path d="M19 8v6M22 11h-6"/>'),
    accounts:   svg('<circle cx="9" cy="8" r="4"/><path d="M3 21v-1a6 6 0 0112 0v1"/><circle cx="17" cy="8" r="3"/><path d="M21 21v-1a4 4 0 00-4-4"/>'),
    bonds:      svg('<path d="M14 3h7v7"/><path d="M21 3l-9 9"/><rect x="3" y="3" width="11" height="18" rx="2"/>'),
    renewals:   svg('<path d="M3 12a9 9 0 1015-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 01-15 6.7L3 16"/><path d="M3 21v-5h5"/>'),
    uw:         svg('<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h7"/>'),
    calc:       svg('<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8"/><path d="M8 12h.01"/><path d="M12 12h.01"/><path d="M16 12h.01"/><path d="M8 16h.01"/><path d="M12 16h.01"/><path d="M16 16h.01"/>'),
    docs:       svg('<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/>'),
    commissions:svg('<circle cx="12" cy="12" r="10"/><path d="M15 9.5a3 3 0 10-3 2.5 3 3 0 11-3 2.5"/><path d="M12 6v2M12 16v2"/>'),
    invoice:    svg('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/>'),
    email:      svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 7 9-7"/>'),
    partners:   svg('<path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/>'),
    settings:   svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.4 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.4 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.6 1.7 1.7 0 00-1.9.4l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.4-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.4-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.4H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.4l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.4 1.9V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>'),
  };
  return {
    mount() {
      document.querySelectorAll('i[data-i]').forEach(el => {
        const k = el.getAttribute('data-i');
        if (map[k]) el.innerHTML = map[k];
      });
    }
  };
})();
