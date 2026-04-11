import { state, renderEngine } from '../modules/state.js';
import { STATUS_MAP } from '../modules/constants.js';
import { calcSummary, fmtMoney, esc } from '../modules/utils.js';

export function renderHome() {
   var c = state.company;
   var qtRev = state.quotes.filter(function(q){return q.status!=='draft';}).reduce(function(s,q){return s+calcSummary(q,c).grandTotal;}, 0);
   var invRev = state.invoices.filter(function(i){return i.status!=='draft';}).reduce(function(s,i){return s+calcSummary(i,c).grandTotal;}, 0);
   var poSpend = state.purchaseOrders.filter(function(po){return po.status!=='draft';}).reduce(function(s,po){return s+calcSummary(po,c).grandTotal;}, 0);
   
   var combinedFeed = [];
   state.quotes.forEach(function(q, i){ combinedFeed.push({date: q.date, type: 'Quote', num: q.quoteNumber, name: q.customerName, total: calcSummary(q, c).grandTotal, st: q.status, oType: 'quotes', oIdx: i}); });
   state.invoices.forEach(function(q, i){ combinedFeed.push({date: q.date, type: 'Invoice', num: q.invoiceNumber, name: q.customerName, total: calcSummary(q, c).grandTotal, st: q.status, oType: 'invoices', oIdx: i}); });
   state.purchaseOrders.forEach(function(q, i){ combinedFeed.push({date: q.date, type: 'PO', num: q.poNumber, name: q.supplierName, total: calcSummary(q, c).grandTotal, st: q.status, oType: 'pos', oIdx: i}); });
   
   combinedFeed.sort(function(a,b){ return (new Date(b.date) - new Date(a.date)); });
   var feedList = combinedFeed.slice(0, 10);
   
   /* Format date as DD-MM-YYYY */
   function fmtDate(d) {
     if (!d) return '\u2014';
     var parts = d.split('-');
     if (parts.length === 3) return parts[2] + '-' + parts[1] + '-' + parts[0];
     return d;
   }

   var feedHtml = '';
   if (!feedList.length) feedHtml = '<div style="padding:20px;text-align:center;color:#64748b;font-size:13px">No recent activity yet.</div>';
   else {
      feedList.forEach(function(f) {
         var getAvatar = function(name) { return (name||'UN').substring(0,2).toUpperCase(); };
         var pillColor = f.st === 'sent' || f.st === 'accepted' ? '#4ADE80' : (f.st === 'draft' ? '#CBD5E1' : '#FF7B7B');
         var pillBg = f.st === 'sent' || f.st === 'accepted' ? '#DCFCE7' : (f.st === 'draft' ? '#F1F5F9' : '#FEE2E2');
         var pillText = f.st === 'sent' || f.st === 'accepted' ? 'Success' : (f.st === 'draft' ? 'Process' : 'Failed');
         var dblAttr = f.oType === 'quotes' ? 'data-edit' : (f.oType === 'invoices' ? 'data-editinvoice' : 'data-editpo');
         var typeLabel = f.type;
         
         feedHtml += '<div class="feed-row-new" data-contextmenu="'+f.oType+'-'+f.oIdx+'" '+dblAttr+'="'+f.oIdx+'">' +
           '<div style="display:flex;align-items:center;gap:16px;flex:2">' +
             '<div class="feed-avatar">' + getAvatar(f.name) + '</div>' +
             '<div><div style="font-weight:600;font-size:13.5px;color:var(--text)">' + esc(f.name || '\u2014') + '</div>' +
             '<div style="font-size:10px;color:var(--text-muted)">' + typeLabel + ' ' + esc(f.num) + '</div></div>' +
           '</div>' +
           '<div style="flex:1.2;font-size:12px;color:var(--text-muted)">' + fmtDate(f.date) + '</div>' +
           '<div style="flex:1"><span style="background:'+pillBg+';color:'+pillColor+';padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;display:inline-flex;align-items:center;gap:4px"><span style="width:6px;height:6px;border-radius:50%;background:'+pillColor+'"></span> ' + pillText + '</span></div>' +
           '<div style="flex:1;text-align:right;font-family:var(--mono);font-weight:600;font-size:13px">' + (f.oType === 'pos' ? '-' : '') + fmtMoney(f.total, c) + '</div>' +
         '</div>';
      });
   }

   return '<div class="dashboard-grid">' +
     '<div>' +
       '<div style="display:flex;justify-content:space-between;align-items:center">' +
         '<div style="font-size:16px;font-weight:700;color:var(--text)">Metrics overview</div>' +
         '<div style="font-size:12px;color:var(--text-muted);cursor:pointer">See all</div>' +
       '</div>' +
       '<div class="premium-cards">' +
         '<div class="erp-card dark">' +
           '<div class="card-title">' +
             '<span>Total Invoiced Revenue</span>' +
             '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>' +
           '</div>' +
           '<div>' +
             '<div class="card-amount">' + fmtMoney(invRev, c) + '</div>' +
           '</div>' +
           '<div class="card-bottom">' +
             '<div style="display:flex;align-items:center;gap:4px"><span style="color:#4ADE80">\u2191 12%</span> vs last month</div>' +
             '<div style="font-size:11px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase">All Time</div>' +
           '</div>' +
         '</div>' +
         '<div class="erp-card">' +
           '<div class="card-title">' +
             '<span>Active Quotes Pipeline</span>' +
             '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>' +
           '</div>' +
           '<div>' +
             '<div class="card-amount" style="color:var(--text)">' + fmtMoney(qtRev, c) + '</div>' +
           '</div>' +
           '<div class="card-bottom">' +
             '<div style="display:flex;align-items:center;gap:4px"><span style="color:var(--text-muted)">Currently active</span></div>' +
             '<div style="font-size:11px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase">Pending</div>' +
           '</div>' +
         '</div>' +
       '</div>' +
       '<div class="quick-actions">' +
         '<button class="action-pill primary" data-action="new"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line></svg> New Quote</button>' +
         '<button class="action-pill primary" data-action="newpo"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> New PO</button>' +
         '<button class="action-pill primary" data-action="newinvoice"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path></svg> New Invoice</button>' +
         '<button class="action-pill primary" data-nav="articles"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg> Master Article</button>' +
       '</div>' +
       '<div class="feed-header">' +
         '<div style="flex:2">Recent Activity</div>' +
         '<div style="flex:1.2">Date</div>' +
         '<div style="flex:1">Status</div>' +
         '<div style="flex:1;text-align:right">Amount</div>' +
       '</div>' +
       '<div class="feed-list">' + feedHtml + '</div>' +
     '</div>' +
     '<div>' +
       '<div class="statistic-panel">' +
         '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:40px">' +
           '<div style="font-size:15px;font-weight:700;color:var(--text);display:flex;align-items:center;gap:6px">Data Breakdown <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></div>' +
           '<div style="font-size:11px;color:var(--text-muted);background:#F8FAFC;padding:4px 8px;border-radius:12px">All Time <svg width="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="6 9 12 15 18 9"></polyline></svg></div>' +
         '</div>' +
         '<div style="width:200px;height:200px;border-radius:50%;border:20px solid var(--primary);border-top-color:var(--blue);border-right-color:var(--blue);margin:0 auto;position:relative;display:flex;align-items:center;justify-content:center">' +
           '<div style="text-align:center"><div style="font-size:12px;color:var(--text-muted);font-weight:500;margin-bottom:2px">Total Value</div><div style="font-size:22px;font-weight:700;letter-spacing:-0.5px">' + fmtMoney(qtRev+invRev, c) + '</div></div>' +
         '</div>' +
         '<div style="display:flex;justify-content:center;gap:16px;margin:30px 0;font-size:11px;color:var(--text-muted);font-weight:500">' +
           '<div style="display:flex;align-items:center;gap:6px"><div style="width:12px;height:12px;background:var(--blue);border-radius:4px"></div> Quotes/Invoices</div>' +
           '<div style="display:flex;align-items:center;gap:6px"><div style="width:12px;height:12px;background:var(--primary);border-radius:4px"></div> Procurement Spend</div>' +
         '</div>' +
         '<div style="display:flex;flex-direction:column;gap:12px">' +
           '<div style="display:flex;justify-content:space-between;align-items:center">' +
             '<div style="display:flex;align-items:center;gap:12px"><div style="width:40px;height:40px;border-radius:12px;background:var(--blue);display:flex;align-items:center;justify-content:center;color:#fff"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path></svg></div>' +
             '<div><div style="font-size:13px;font-weight:600;color:var(--text)">Quotes Generated</div><div style="font-size:10px;color:var(--text-muted)">' + state.quotes.length + ' documents</div></div></div>' +
             '<div style="font-weight:700;font-size:13.5px;font-family:var(--mono)">' + state.quotes.filter(function(q){return q.status==='sent'}).length + ' sent</div>' +
           '</div>' +
           '<div style="display:flex;justify-content:space-between;align-items:center">' +
             '<div style="display:flex;align-items:center;gap:12px"><div style="width:40px;height:40px;border-radius:12px;background:#4ADE80;display:flex;align-items:center;justify-content:center;color:#fff"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path></svg></div>' +
             '<div><div style="font-size:13px;font-weight:600;color:var(--text)">Invoices Issued</div><div style="font-size:10px;color:var(--text-muted)">' + state.invoices.length + ' documents</div></div></div>' +
             '<div style="font-weight:700;font-size:13.5px;font-family:var(--mono)">' + state.invoices.filter(function(q){return q.status==='sent'}).length + ' sent</div>' +
           '</div>' +
           '<div style="display:flex;justify-content:space-between;align-items:center">' +
             '<div style="display:flex;align-items:center;gap:12px"><div style="width:40px;height:40px;border-radius:12px;background:#2D2F36;display:flex;align-items:center;justify-content:center;color:#fff"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg></div>' +
             '<div><div style="font-size:13px;font-weight:600;color:var(--text)">Purchase Orders</div><div style="font-size:10px;color:var(--text-muted)">' + state.purchaseOrders.length + ' records</div></div></div>' +
             '<div style="font-weight:700;font-size:13.5px;font-family:var(--mono);color:#FF7B7B">-' + fmtMoney(poSpend, c) + '</div>' +
           '</div>' +
         '</div>' +
       '</div>' +
     '</div>' +
   '</div>';
}
