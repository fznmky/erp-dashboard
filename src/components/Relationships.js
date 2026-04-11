import { state } from '../modules/state.js';
import { STATUS_MAP } from '../modules/constants.js';
import { calcSummary, fmtMoney, esc } from '../modules/utils.js';

export function renderRelationships() {
  var content = '<div class="tree-container">';
  if (!state.quotes.length) {
     return '<div class="page-header"><div><div class="page-title">Relationship Linkages</div><div class="page-subtitle">Track End-to-end Sales Cycles</div></div></div><div class="empty-state" style="margin-top:20px">No quotes exist yet.</div>';
  }
  state.quotes.forEach(function(q) {
     var invs = state.invoices.filter(function(i) { return i.relatedQuoteNumber === q.quoteNumber; });
     var pos = state.purchaseOrders.filter(function(p) { return p.relatedQuoteNumber === q.quoteNumber; });
     content += '<div class="tree-quote-group" style="margin-bottom:24px;padding:20px;border:1px solid var(--border);border-radius:8px;background:#fff">';
     content += '<div style="display:flex;align-items:center;margin-bottom:16px"><div style="background:var(--primary);color:#fff;padding:6px 14px;border-radius:6px;font-weight:600;font-size:14px;min-width:140px;text-align:center;box-shadow:0 2px 4px rgba(0,0,0,0.1)">Quote: ' + esc(q.quoteNumber) + '</div><div style="margin-left:12px;color:var(--text-muted);font-size:12px">Customer: <strong style="color:var(--text)">' + esc(q.customerName || '—') + '</strong></div></div>';
     content += '<div style="display:flex;padding-left:40px;position:relative">';
     content += '<div style="position:absolute;left:20px;top:0;bottom:0;width:2px;background:var(--border)"></div>';
     var childrenHtml = '';
     pos.forEach(function(p) {
        childrenHtml += '<div style="display:flex;align-items:center;margin-bottom:10px;position:relative"><div style="position:absolute;left:-20px;top:50%;width:20px;height:2px;background:var(--border)"></div><div style="background:#F1F5F9;border:1px solid #CBD5E1;padding:6px 14px;border-radius:6px;font-weight:600;font-size:13px;min-width:140px;text-align:center">PO: ' + esc(p.poNumber) + '</div><div style="margin-left:12px;color:var(--text-muted);font-size:12px">Supplier: <strong style="color:var(--text)">' + esc(p.supplierName || '—') + '</strong></div></div>';
     });
     invs.forEach(function(i) {
         childrenHtml += '<div style="display:flex;align-items:center;margin-bottom:10px;position:relative"><div style="position:absolute;left:-20px;top:50%;width:20px;height:2px;background:var(--border)"></div><div style="background:#FCF4F2;border:1px solid #E4C8C2;padding:6px 14px;border-radius:6px;font-weight:600;font-size:13px;min-width:140px;text-align:center;color:#b13e3b">INV: ' + esc(i.invoiceNumber) + '</div><div style="margin-left:12px;color:var(--text-muted);font-size:12px">Customer: <strong style="color:var(--text)">' + esc(i.customerName || '—') + '</strong></div></div>';
     });
     if (!childrenHtml) childrenHtml = '<div style="color:var(--text-muted);font-size:12px;font-style:italic;display:flex;align-items:center;height:32px"><div style="position:absolute;left:-20px;top:50%;width:20px;height:2px;background:var(--border);border-style:dashed"></div>No linked Purchase Orders or Invoices.</div>';
     content += '<div style="display:flex;flex-direction:column;width:100%">' + childrenHtml + '</div>';
     content += '</div></div>';
  });
  content += '</div>';
  return '<div class="page-header"><div><div class="page-title">Relationship Linkages</div><div class="page-subtitle">Track End-to-end Sales Cycles</div></div></div>' + content;
}

export function renderMapOverlay() {
  var q = state.current;
  if (!q) return '';
  var cname = q.customerName || '—';
  var qSm = calcSummary(q, state.company);
  var qVal = fmtMoney(qSm.grandTotal, q.currency || state.company.currency);
  var qIdx = state.quotes.findIndex(function(x){return x.quoteNumber===q.quoteNumber;});
  var qCard = '<div class="map-card quote-card" style="cursor:pointer" data-action="closemap" data-mapopen="quote-'+qIdx+'"><div class="map-tag">Quote</div><div class="map-id">'+esc(q.quoteNumber)+'</div><div class="map-desc" title="'+esc(cname)+'">'+esc(cname)+'</div><div style="font-family:var(--mono);font-size:12px;font-weight:600;margin-top:2px">'+qVal+'</div><div class="map-status badge '+(STATUS_MAP[q.status]||STATUS_MAP.draft).cls+'" style="margin-top:6px">'+(STATUS_MAP[q.status]||STATUS_MAP.draft).label+'</div></div>';

  var invs = state.invoices.filter(function(i) { return i.relatedQuoteNumber === q.quoteNumber; });
  var pos = state.purchaseOrders.filter(function(p) { return p.relatedQuoteNumber === q.quoteNumber; });

  var mapHtml = '<div style="display:flex;flex-direction:column;align-items:center;">' + qCard + '<div style="width:2px;height:30px;background:var(--border)"></div>';
  
  if (pos.length > 0 || invs.length > 0) {
     var items = [];
     pos.forEach(function(p) { 
        var idx=state.purchaseOrders.findIndex(function(x){return x.poNumber===p.poNumber;}); 
        items.push({type:'Purchase Order', id:p.poNumber, st:STATUS_MAP[p.status]||STATUS_MAP.draft, name:p.supplierName, cls:'po-card', sm:calcSummary(p,state.company), idx:idx, m:'po'}); 
     });
     invs.forEach(function(i) { 
        var idx=state.invoices.findIndex(function(x){return x.invoiceNumber===i.invoiceNumber;}); 
        items.push({type:'Invoice', id:i.invoiceNumber, st:STATUS_MAP[i.status]||STATUS_MAP.draft, name:i.customerName, cls:'inv-card', sm:calcSummary(i,state.company), idx:idx, m:'inv'}); 
     });

     var childrenHtml = '<div style="display:flex;position:relative;">';
     if (items.length > 1) {
        var pc = 100 / (items.length * 2);
        childrenHtml += '<div style="position:absolute;top:0;left:' + pc + '%;right:' + pc + '%;height:2px;background:var(--border);"></div>';
     }

     items.forEach(function(item) {
        var val = fmtMoney(item.sm.grandTotal, q.currency || state.company.currency);
        childrenHtml += '<div style="display:flex;flex-direction:column;align-items:center;padding:0 15px;">';
        childrenHtml += '<div style="width:2px;height:25px;background:var(--border);"></div>';
        childrenHtml += '<div class="map-card '+item.cls+'" style="cursor:pointer" data-action="closemap" data-mapopen="'+item.m+'-'+item.idx+'"><div class="map-tag">'+item.type+'</div><div class="map-id">'+esc(item.id)+'</div><div class="map-desc" title="'+esc(item.name||'—')+'">'+esc(item.name||'—')+'</div><div style="font-family:var(--mono);font-size:12px;font-weight:600;margin-top:2px">'+val+'</div><div class="map-status badge '+item.st.cls+'" style="margin-top:6px">'+item.st.label+'</div></div>';
        childrenHtml += '</div>';
     });
     childrenHtml += '</div>';
     mapHtml += childrenHtml;
  } else {
     mapHtml += '<div style="font-size:12px;color:var(--text-muted);font-style:italic;margin-top:10px">No documents linked to this Quote.</div>';
  }
  mapHtml += '</div>';

  return '<div class="overlay" data-action="closemap" style="background:rgba(15,23,42,0.6)"><div class="pdf-container" style="max-width:800px;background:#fff;padding:0;border-radius:12px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.1);max-height:90vh;overflow-y:auto" onclick="event.stopPropagation()"><div style="display:flex;justify-content:space-between;align-items:center;padding:30px 40px;border-bottom:1px solid var(--border)"><h2 style="margin:0;font-size:18px;font-weight:600">Relationship Map</h2><button class="btn btn-ghost" data-action="closemap">\u2715</button></div><div style="background:#F8FAFC;padding:50px 40px">' + mapHtml + '</div></div></div>';
}
