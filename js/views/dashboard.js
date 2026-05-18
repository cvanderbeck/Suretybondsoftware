window.Views = window.Views || {};
Views.dashboard = {
  render() {
    const bonds = DB.bonds();
    const accts = DB.accounts();
    const pipe  = DB.pipeline();
    const inv   = DB.invoices();

    const activeBonds = bonds.filter(b => b.status === 'Active');
    const totalPremium = activeBonds.reduce((s,b)=>s+(b.premium||0),0);
    const totalCommission = activeBonds.reduce((s,b)=>s + (b.premium||0)*(b.commissionRate||0)/100, 0);
    const pendingUW = bonds.filter(b => b.status === 'Pending UW').length;
    const pipeTotal = pipe.filter(p => !['Won','Lost'].includes(p.stage)).reduce((s,p)=>s+(p.amount||0),0);
    const openInv = inv.filter(i => i.status === 'Open' || i.status === 'Draft').reduce((s,i)=>s+i.amount,0);

    // bonds by type (for donut)
    const byType = {};
    bonds.forEach(b => byType[b.type] = (byType[b.type]||0) + 1);

    // premium by month (last 6 fictional months)
    const months = ['Dec','Jan','Feb','Mar','Apr','May'];
    const premiumByMonth = [12450, 14200, 9870, 22150, 18900, 24400];

    document.getElementById('view').innerHTML = `
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="section-title">Dashboard</h1>
          <p class="section-sub">Welcome back, Casey — here's where your agency stands.</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn-secondary" onclick="Views.dashboard.exportReport()">Export Bonds Report (PDF)</button>
          <button class="btn-primary"   onclick="App.go('pipeline')">View Pipeline</button>
        </div>
      </div>

      ${(() => {
        const dupes = (window.Duplicates ? Duplicates.detect() : []);
        const pending = DB.intakes ? DB.intakes().filter(f => f.status === 'submitted').length : 0;
        const alerts = [];
        if (pending) alerts.push({
          color: 'bg-violet-50 border-violet-200 text-violet-800',
          icon: '📨',
          html: `<b>${pending} intake form${pending===1?'':'s'}</b> submitted and waiting to be imported.`,
          cta: `<button class="btn-secondary text-violet-800" onclick="App.go('forms'); setTimeout(()=>Views.forms._setSection('pending'), 50);">Review →</button>`,
        });
        if (dupes.length) alerts.push({
          color: 'bg-rose-50 border-rose-200 text-rose-800',
          icon: '⚠',
          html: `<b>${dupes.length} possible duplicate account group${dupes.length===1?'':'s'}</b> detected — review and merge.`,
          cta: `<button class="btn-secondary text-rose-800" onclick="App.go('forms'); setTimeout(()=>Views.forms._setSection('duplicates'), 50);">Resolve →</button>`,
        });
        if (!alerts.length) return '';
        return `<div class="space-y-2 mb-5">
          ${alerts.map(a => `
            <div class="${a.color} border rounded-lg px-4 py-2 flex items-center justify-between text-sm">
              <div><span class="mr-2">${a.icon}</span>${a.html}</div>
              ${a.cta}
            </div>`).join('')}
        </div>`;
      })()}

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="stat-card">
          <div class="stat-label">Active Bonds</div>
          <div class="stat-value">${activeBonds.length}</div>
          <div class="stat-delta-up">+2 this month</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">In-Force Premium</div>
          <div class="stat-value">${U.usd(totalPremium)}</div>
          <div class="stat-delta-up">+11.2% YTD</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Projected Commission</div>
          <div class="stat-value">${U.usd(totalCommission)}</div>
          <div class="stat-delta-up">+8.4% vs last year</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Renewals · next 30d</div>
          <div class="stat-value">${(() => {
            const t = new Date();
            return activeBonds.filter(b => {
              const d = Math.ceil((new Date(b.expires)-t)/86400000);
              return d <= 30 && d >= -30;
            }).length;
          })()}</div>
          <div class="stat-delta-up">${pipe.filter(p=>p.stage==='Bid Awaiting').length} bids awaiting · ${U.usd(pipeTotal)} pipeline</div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div class="card lg:col-span-2">
          <div class="card-header"><div class="card-title">Premium Written — Last 6 Months</div></div>
          <div class="p-5"><canvas id="chart-premium" height="120"></canvas></div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">Bond Mix by Type</div></div>
          <div class="p-5"><canvas id="chart-types" height="180"></canvas></div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div class="card lg:col-span-2">
          <div class="card-header">
            <div class="card-title">Upcoming Renewals (next 90 days)</div>
            <button class="btn-ghost" onclick="App.go('renewals')">Open workflow →</button>
          </div>
          <table class="tbl">
            <thead><tr><th>Bond #</th><th>Principal</th><th>Obligee</th><th class="text-right">Amount</th><th>Expires</th><th>Status</th></tr></thead>
            <tbody>
              ${(() => {
                const today = new Date();
                const upcoming = activeBonds
                  .map(b => ({ b, days: Math.ceil((new Date(b.expires) - today)/86400000) }))
                  .filter(x => x.days <= 90 && x.days >= -30)
                  .sort((a,b) => a.days - b.days)
                  .slice(0, 6);
                if (!upcoming.length) return `<tr><td colspan="6" class="text-center text-slate-400 py-6">No bonds expiring in the next 90 days.</td></tr>`;
                return upcoming.map(({b, days}) => {
                  const a = DB.findAccount(b.accountId) || {};
                  const ren = DB.renewals().find(r => r.bondId === b.id);
                  const stLabel = ren ? Views.renewals.STATUS_LABEL[ren.status] : 'Upcoming';
                  const stClass = ren ? Views.renewals.STATUS_BADGE[ren.status] : 'badge-slate';
                  const dayBadge = days < 0
                    ? `<span class="badge badge-rose">Overdue ${Math.abs(days)}d</span>`
                    : days <= 30 ? `<span class="badge badge-amber">${days}d</span>`
                    : `<span class="badge badge-slate">${days}d</span>`;
                  const onClick = ren
                    ? `App.go('renewals'); setTimeout(()=>Views.renewals.open('${ren.id}'), 50);`
                    : `App.go('renewals');`;
                  return `<tr class="cursor-pointer" onclick="${onClick}">
                    <td class="font-medium text-brand-700">${b.number}</td>
                    <td>${U.esc(a.name)}</td>
                    <td class="max-w-[14rem] truncate">${U.esc(b.obligee)}</td>
                    <td class="text-right">${U.usd(b.amount)}</td>
                    <td>${U.date(b.expires)} ${dayBadge}</td>
                    <td><span class="badge ${stClass}">${stLabel}</span></td>
                  </tr>`;
                }).join('');
              })()}
            </tbody>
          </table>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">Pending Underwriting</div>
            <button class="btn-ghost" onclick="App.go('accounts')">All accounts →</button>
          </div>
          <div class="p-5 space-y-3">
            ${DB.uw().map(uw => {
              const b = DB.findBond(uw.bondId) || {};
              const a = DB.findAccount(b.accountId) || {};
              const done = uw.requirements.filter(r => r.status === 'received').length;
              const pct  = Math.round(done/uw.requirements.length*100);
              return `
                <div class="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer" onclick="App.go('accounts'); setTimeout(()=>Views.accounts.open('${a.id}'), 50);">
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="text-sm font-medium text-slate-800">${U.esc(a.name)}</div>
                      <div class="text-xs text-slate-500">${b.number} · ${U.esc(b.obligee||'')}</div>
                    </div>
                    <span class="text-xs text-slate-600">${done}/${uw.requirements.length}</span>
                  </div>
                  <div class="progress mt-2"><div style="width:${pct}%"></div></div>
                </div>`;
            }).join('')}
          </div>
        </div>
      </div>

      <div class="card mt-4">
        <div class="card-header">
          <div class="card-title">Leads Pipeline — Top of Funnel</div>
          <button class="btn-ghost" onclick="App.go('leads')">All leads →</button>
        </div>
        <div class="p-4">
          ${(() => {
            const open = DB.leads().filter(l => l.status === 'open');
            if (!open.length) return '<div class="text-sm text-ink-300">No open leads. Click <b>New Lead</b> in the Leads Pipeline to add one.</div>';
            const counts = {};
            (DB.leadStages ? DB.leadStages() : []).forEach(s => counts[s] = open.filter(l => l.stage === s).length);
            const totalPremium = open.reduce((s,l) => s + (l.estimatedAnnualPremium||0), 0);
            const top = open.slice().sort((a,b) => (b.probability||0) - (a.probability||0)).slice(0, 5);
            return `
              <div class="grid grid-cols-4 gap-3 mb-4">
                <div><div class="field-label">Open Leads</div><div class="text-lg font-semibold">${open.length}</div></div>
                <div><div class="field-label">Est. Annual Premium</div><div class="text-lg font-semibold">${U.usd(totalPremium)}</div></div>
                <div><div class="field-label">Top Stage</div><div class="text-sm">${U.esc(Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0] || '—')}</div></div>
                <div><div class="field-label">Following Up Soon</div><div class="text-sm">${open.filter(l => l.nextFollowUp && new Date(l.nextFollowUp) <= new Date(Date.now()+7*86400000)).length} in next 7d</div></div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
                ${top.map(l => `
                  <div class="border border-cream-200 rounded-lg p-3 cursor-pointer hover:bg-cream-50"
                       onclick="App.go('leads'); setTimeout(()=>Views.leads.open('${l.id}'), 50);">
                    <div class="text-sm font-semibold text-ink-700 truncate">${U.esc(l.companyName)}</div>
                    <div class="text-xs text-ink-300 truncate">${U.esc(l.stage)} · ${l.probability}%</div>
                    <div class="text-xs text-ink-300 mt-1">${l.estimatedAnnualPremium?U.usd(l.estimatedAnnualPremium)+' est':''}</div>
                  </div>`).join('')}
              </div>`;
          })()}
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <div class="card">
          <div class="card-header">
            <div class="card-title">Aggregate Capacity — At Capacity</div>
            <button class="btn-ghost" onclick="App.go('accounts')">All accounts →</button>
          </div>
          <div class="p-4">
            ${(() => {
              const rows = DB.accounts()
                .map(a => ({ a, cap: Views.accounts.capacityFor(a.id) }))
                .filter(x => x.cap.aggregate)
                .sort((x,y) => y.cap.pct - x.cap.pct)
                .slice(0, 6);
              if (!rows.length) return '<div class="text-sm text-ink-300">No accounts with an aggregate limit set.</div>';
              return rows.map(({a, cap}) => `
                <div class="py-2 border-b border-cream-100 last:border-b-0 cursor-pointer hover:bg-cream-50 -mx-2 px-2 rounded"
                     onclick="App.go('accounts'); setTimeout(()=>Views.accounts.open('${a.id}'), 50);">
                  <div class="flex items-center justify-between">
                    <div class="text-sm font-medium text-ink-700 truncate">${U.esc(a.name)}</div>
                    <div class="text-xs ${cap.tone.text} font-medium">${cap.pct}%</div>
                  </div>
                  <div class="progress mt-1"><div class="${cap.tone.bar}" style="width:${Math.min(100,cap.pct)}%"></div></div>
                  <div class="flex items-center justify-between text-[11px] text-ink-300 mt-1">
                    <span>${U.usd(cap.used)} of ${U.usd(cap.aggregate)} · ${cap.openCount} open</span>
                    <span>${U.usd(cap.remaining)} avail.</span>
                  </div>
                </div>
              `).join('');
            })()}
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">Bonds Above Single Limit</div>
            <button class="btn-ghost" onclick="App.go('bonds')">All bonds →</button>
          </div>
          <div class="p-4">
            ${(() => {
              const flagged = [];
              DB.accounts().forEach(a => {
                const cap = Views.accounts.capacityFor(a.id);
                cap.overSingle.forEach(b => flagged.push({ a, cap, b }));
              });
              if (!flagged.length) return '<div class="text-sm text-ink-300">All open bonds are within their single bond limit. ✓</div>';
              return flagged.slice(0, 6).map(({a, cap, b}) => `
                <div class="py-2 border-b border-cream-100 last:border-b-0 cursor-pointer hover:bg-cream-50 -mx-2 px-2 rounded"
                     onclick="Views.bonds.open('${b.id}')">
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="text-sm font-medium text-ink-700">${b.number}</div>
                      <div class="text-xs text-ink-300">${U.esc(a.name)} · ${U.esc(b.obligee||'')}</div>
                    </div>
                    <div class="text-right">
                      <div class="text-sm font-semibold text-rose-700">${U.usd(b.amount)}</div>
                      <div class="text-[11px] text-ink-300">single limit ${U.usd(cap.single)}</div>
                    </div>
                  </div>
                </div>
              `).join('');
            })()}
          </div>
        </div>
      </div>
    `;

    // charts
    new Chart(document.getElementById('chart-premium'), {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: 'Premium',
          data: premiumByMonth,
          fill: true,
          borderColor: '#3a5dff',
          backgroundColor: 'rgba(58, 93, 255, 0.10)',
          tension: 0.35,
          pointBackgroundColor: '#3a5dff',
        }]
      },
      options: {
        plugins: { legend: { display: false }},
        scales: { y: { ticks: { callback: v => '$' + (v/1000) + 'k' } } }
      }
    });

    new Chart(document.getElementById('chart-types'), {
      type: 'doughnut',
      data: {
        labels: Object.keys(byType),
        datasets: [{
          data: Object.values(byType),
          backgroundColor: ['#3a5dff','#8eadff','#22c55e','#f59e0b','#a855f7','#ef4444']
        }]
      },
      options: { plugins: { legend: { position: 'bottom', labels: { boxWidth: 10 } } } }
    });
  },

  exportReport() {
    const doc = PDF.bondReport(DB.bonds().filter(b => b.status === 'Active'));
    doc.save('Active_Bonds_Report.pdf');
    U.toast('PDF report exported');
  }
};
