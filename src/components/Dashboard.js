import { state } from '../modules/state.js';
import { STATUS_MAP } from '../modules/constants.js';
import { calcSummary, fmtMoney, esc } from '../modules/utils.js';

export function renderDashboard(type) {
  if (!type) type = 'quotes';
  var q, docTitle, numField, custField, actionNew, editDataAttr;
  if (type === 'pos') {
    q = state.purchaseOrders; docTitle = 'Purchase Orders'; numField = 'poNumber'; custField = 'supplierName'; actionNew = 'newpo'; editDataAttr = 'data-editpo';
  } else if (type === 'invoices') {
    q = state.invoices; docTitle = 'Invoices'; numField = 'invoiceNumber'; custField = 'customerName'; actionNew = 'newinvoice'; editDataAttr = 'data-editinvoice';
  } else {
    q = state.quotes; docTitle = 'Quotes'; numField = 'quoteNumber'; custField = 'customerName'; actionNew = 'new'; editDataAttr = 'data-edit';
  }
  var c = state.company;
  var tv = q.reduce(function (s, qt) { return s + calcSummary(qt, c).grandTotal; }, 0);
  var dr = q.filter(function (x) { return x.status === 'draft'; }).length;
  var sn = q.filter(function (x) { return x.status === 'sent'; }).length;
  var content = '';
  if (!q.length) {
    content = '<div class="empty-state"><div class="empty-icon">\uD83D\uDCCB</div><div class="empty-title">No ' + docTitle.toLowerCase() + ' yet</div><div class="empty-sub">Create your first ' + docTitle.replace(/s$/, '').toLowerCase() + '</div><button class="btn btn-primary" data-action="' + actionNew + '">+ New ' + docTitle.replace(/s$/, '') + '</button></div>';
  } else {
    var statusOpts = '<option value="">All</option>';
    var keys = Object.keys(STATUS_MAP);
    for (var si = 0; si < keys.length; si++) { statusOpts += '<option value="' + keys[si] + '">' + STATUS_MAP[keys[si]].label + '</option>'; }
    var tb = '';
    for (var i = 0; i < q.length; i++) {
      var qt = q[i];
      var sm = calcSummary(qt, c);
      var st = STATUS_MAP[qt.status] || STATUS_MAP.draft;
      var cName = qt[custField] || qt.customerName || qt.supplierName;
      var cCity = qt.customerCity || qt.supplierCity || '';
      var actionHtml = '';
      if (type === 'quotes') {
        var pos = state.purchaseOrders.filter(function(p) { return p.relatedQuoteNumber === qt.quoteNumber; });
        var invs = state.invoices.filter(function(inv) { return inv.relatedQuoteNumber === qt.quoteNumber; });
        var poColor = pos.length > 0 ? '#10B981' : '#CBD5E1';
        var invColor = invs.length > 0 ? '#10B981' : '#CBD5E1';
        
        var poAction = '';
        if (pos.length === 0) poAction = 'data-createpo="'+i+'"';
        else if (pos.length === 1) poAction = 'data-mapopen="po-'+state.purchaseOrders.indexOf(pos[0])+'"';
        else poAction = 'data-showmap="'+i+'" title="Multiple POs linked \u2192 View Map"';

        var invAction = '';
        if (invs.length === 0) invAction = 'data-createinv="'+i+'"';
        else if (invs.length === 1) invAction = 'data-mapopen="inv-'+state.invoices.indexOf(invs[0])+'"';
        else invAction = 'data-showmap="'+i+'" title="Multiple Invoices linked \u2192 View Map"';
        
        actionHtml += '<button class="action-icon" title="Invoice" '+invAction+' style="color:'+invColor+'"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></button>';
        actionHtml += '<button class="action-icon" title="Purchase Order" '+poAction+' style="color:'+poColor+'"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg></button>';
        actionHtml += '<button class="action-icon" title="Edit" data-buttonedit="'+type+'-'+i+'"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>';
        actionHtml += '<button class="action-icon btn-danger" title="Delete" data-del="' + type + '-' + i + '"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>';
      } else {
        actionHtml += '<button class="action-icon" title="Edit" data-buttonedit="'+type+'-'+i+'"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>';
        actionHtml += '<button class="action-icon btn-danger" title="Delete" data-del="' + type + '-' + i + '"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>';
      }

      tb += '<tr '+editDataAttr+'="'+i+'" data-fqn="' + esc(qt[numField]).toLowerCase() + '" data-fcust="' + esc(cName || '').toLowerCase() + '" data-fdate="' + qt.date + '" data-fstatus="' + qt.status + '" data-contextmenu="'+type+'-'+i+'"><td style="font-family:var(--mono);font-size:11.5px">' + esc(qt[numField]) + '</td><td><div style="font-weight:500">' + (esc(cName) || '\u2014') + '</div><div style="font-size:10.5px;color:#94A3B8">' + esc(cCity) + '</div></td><td>' + esc(qt.date) + '</td><td><span class="badge ' + st.cls + '">' + st.label + '</span></td><td class="amount-cell">' + fmtMoney(sm.grandTotal, c) + '</td><td style="text-align:right" onclick="event.stopPropagation()"><div style="display:flex;justify-content:flex-end;gap:2px">' + actionHtml + '</div></td></tr>';
    }
    var contactHeader = type === 'pos' ? 'Supplier' : 'Customer';
    content = '<div class="table-wrap"><table class="data-table"><thead><tr><th>' + docTitle.replace(/s$/, '') + ' #</th><th>' + contactHeader + '</th><th>Date</th><th>Status</th><th style="text-align:right">Amount</th><th></th></tr>' +
      '<tr style="background:#F8FAFC"><th style="padding:2px 4px"><input class="filter-input" style="width:100%" placeholder="Filter..." data-filter="quote"/></th><th style="padding:2px 4px"><input class="filter-input" style="width:100%" placeholder="Filter..." data-filter="customer"/></th><th style="padding:2px 4px"><input class="filter-input" style="width:100%" placeholder="Filter..." data-filter="date"/></th><th style="padding:2px 4px"><select class="filter-input" style="width:100%" data-filter="status">' + statusOpts + '</select></th><th></th><th></th></tr>' +
      '</thead><tbody>' + tb + '</tbody></table></div>';
  }
  return '<div class="page-header"><div><div class="page-title">' + docTitle + '</div><div class="page-subtitle">' + q.length + ' document' + (q.length !== 1 ? 's' : '') + '</div></div><button class="btn btn-primary" data-action="' + actionNew + '">+ New ' + docTitle.replace(/s$/, '') + '</button></div><div class="stats-grid" style="grid-template-columns:1fr 1fr 1fr"><div class="stat-card"><div class="stat-label">Total Volume Tracker</div><div class="stat-value">' + q.length + ' Docs</div></div><div class="stat-card"><div class="stat-label">Total Initialized Drafts</div><div class="stat-value">' + dr + '</div></div><div class="stat-card"><div class="stat-label">Completed / Sent / Finalized</div><div class="stat-value" style="color:var(--primary)">' + sn + '</div></div></div>' + content;
}
