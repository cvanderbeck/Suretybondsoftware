window.Views = window.Views || {};
Views.commissions = {
  render() {
    const bonds = DB.bonds().filter(b => b.premium > 0);
    const total = bonds.reduce((s,b) => s + (b.premium||0)*(b.commissionRate||0)/100, 0);
    const ytd = bonds.filter(b => b.effective && new Date(b.effective).getFullYear() === 2026)
                     .reduce((s,b) => s + (b.premium||0)*(b.commissionRate||0)/100, 0);
    // Group by partner
    const byPartner = {};
    bonds.forEach(b => {
      const p = DB.findPartner(b.partnerId) || { id: '?', name: 'Unknown' };
      const c = (b.premium||0)*(b.commissionRate||0)/100;
      if (!byPartner[p.id]) byPartner[p.id] = { partner: p, count: 0, premium: 0, commission: 0 };
      byPartner[p.id].count++;
      byPartner[p.id].premium += b.premium||0;
      byPartner[p.id].commission += c;
    });

    document.getElementById('view').innerHTML = `
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="section-title">Commissions</h1>
          <p class="section-sub">Each bond carries a commission percentage. Track earnings by bond and by surety.</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn-secondary" onclick="Views.commissions.exportCSV()">Export CSV</button>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="stat-card"><div class="stat-label">Total Commission (in-force)</div><div class="stat-value">${U.usd(total)}</div></div>
        <div class="stat-card"><div class="stat-label">YTD Commission</div><div class="stat-value">${U.usd(ytd)}</div><div class="stat-delta-up">+12% vs prior YTD</div></div>
        <div class="stat-card"><div class="stat-label">Average Commission %</div><div class="stat-value">${(bonds.reduce((s,b)=>s+b.commissionRate,0)/(bonds.length||1)).toFixed(1)}%</div></div>
      </div>

      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="card col-span-1">
          <div class="card-header"><div class="card-title">By Surety Partner</div></div>
          <table class="tbl">
            <thead><tr><th>Partner</th><th class="text-right">Bonds</th><th class="text-right">Commission</th></tr></thead>
            <tbody>
              ${Object.values(byPartner).sort((a,b)=>b.commission-a.commission).map(r=>`
                <tr><td>${U.esc(r.partner.name)}</td><td class="text-right">${r.count}</td><td class="text-right">${U.usd(r.commission)}</td></tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div class="card col-span-2">
          <div class="card-header"><div class="card-title">By Bond</div></div>
          <table class="tbl">
            <thead><tr><th>Bond #</th><th>Principal</th><th>Type</th><th class="text-right">Premium</th><th class="text-right">Comm.%</th><th class="text-right">Commission</th></tr></thead>
            <tbody>
              ${bonds.map(b=>{
                const a = DB.findAccount(b.accountId) || {};
                const c = (b.premium||0)*(b.commissionRate||0)/100;
                return `<tr>
                  <td class="font-medium text-brand-700 cursor-pointer" onclick="Views.bonds.open('${b.id}')">${b.number}</td>
                  <td>${U.esc(a.name||'')}</td>
                  <td>${U.esc(b.type)}</td>
                  <td class="text-right">${U.usd(b.premium)}</td>
                  <td class="text-right">${b.commissionRate}%</td>
                  <td class="text-right font-medium text-emerald-700">${U.usd(c)}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  exportCSV() {
    const rows = [['Bond #','Principal','Type','Partner','Premium','Commission %','Commission']];
    DB.bonds().filter(b => b.premium > 0).forEach(b => {
      const a = DB.findAccount(b.accountId) || {};
      const p = DB.findPartner(b.partnerId) || {};
      rows.push([b.number, a.name||'', b.type, p.name||'', b.premium, b.commissionRate+'%', (b.premium*b.commissionRate/100).toFixed(2)]);
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download='commissions.csv'; a.click();
    U.toast('Commissions exported');
  }
};
