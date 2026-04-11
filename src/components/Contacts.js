import { state } from '../modules/state.js';
import { calcSummary, fmtMoney, esc, fmtNum } from '../modules/utils.js';

export function renderContactModal() {
  var type = state.showContactModal;
  var idx = state.editingContact;
  var list = type === 'customer' ? state.customers : state.suppliers;
  var c = idx >= 0 ? list[idx] : {name:'', address:'', city:'', country:'', contactPerson:'', phone:'', email:''};
  
  var statsHtml = '';
  if (idx >= 0 && c.name) {
     var docs = [];
     if (type === 'customer') {
         docs = state.invoices.filter(function(i){ return i.customerName === c.name; });
     } else {
         docs = state.purchaseOrders.filter(function(i){ return i.supplierName === c.name; });
     }
     
     var totalV = 0;
     var latestOrder = '—';
     var artMap = {};
     var orderCount = docs.length;
     var totalItems = 0;

     docs.forEach(function(d) {
        var sm = calcSummary(d, state.company);
        var curM = sm.grandTotal;
        
        // If currency mismatches base, logic relies on numerical raw dump unless advanced fx conversion mapped
        totalV += curM; 
        
        if (latestOrder === '—' || new Date(d.date) > new Date(latestOrder)) { latestOrder = d.date; }
        (d.items || []).forEach(function(it) {
            if(!it.articleNumber) return;
            if(!artMap[it.articleNumber]) artMap[it.articleNumber] = {desc:it.description, qty:0, sum:0};
            var qValue = (parseFloat(it.quantity)||0);
            totalItems += qValue;
            artMap[it.articleNumber].qty += qValue;
            artMap[it.articleNumber].sum += ((parseFloat(it.price)||0) * qValue);
        });
     });

     var artRows = Object.keys(artMap).map(function(k) {
        var a = artMap[k]; return '<tr style="border-bottom:1px solid #e2e8f0"><td style="font-family:var(--mono);font-size:11px;padding:6px 4px">'+esc(k)+'</td><td style="padding:6px 4px">'+esc(a.desc)+'</td><td class="r" style="padding:6px 4px">'+a.qty+'</td><td class="r" style="padding:6px 4px">'+fmtMoney(a.sum, state.company.currency||'EUR')+'</td></tr>';
     }).join('');

     if(artRows === '') artRows = '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);font-style:italic;padding:12px">No specific item volumes recorded yet.</td></tr>';

     var docsHtml = docs.map(function(d) {
        var no = type==='customer' ? d.invoiceNumber : d.poNumber;
        var cur = d.currency || state.company.currency || 'EUR';
        return '<div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--border);padding:6px 0;font-size:12px"><span><strong class="mono" style="margin-right:8px;color:var(--primary)">'+esc(no)+'</strong> <span style="color:#64748B">'+esc(d.date)+'</span></span><span style="font-family:var(--mono)">'+fmtMoney(calcSummary(d,state.company).grandTotal, cur)+'</span></div>';
     }).join('') || '<div style="font-size:12px;color:var(--text-muted);font-style:italic">No documented history.</div>';

      var ltitle = type === 'customer' ? 'Total Revenue Generated' : 'Total Spend Generated';
      var topTitle = type === 'customer' ? 'Total Items Sold' : 'Total Items Bought';
      statsHtml = '<div style="margin-top:24px;padding-top:24px;border-top:1px solid var(--border)">'+
          '<h3 style="margin:0 0 16px 0;font-size:15px;color:var(--primary)">CRM Analytics & History</h3>'+
          '<div class="stats-grid" style="grid-template-columns:1fr 1fr 1fr;margin-bottom:20px"><div class="stat-card" style="padding:15px;background:#fff"><div class="stat-label">'+topTitle+'</div><div class="stat-value">'+fmtNum(totalItems, state.company)+' Items</div></div><div class="stat-card" style="padding:15px;background:#fff"><div class="stat-label">Latest Transaction</div><div class="stat-value" style="font-size:16px">'+latestOrder+'</div></div><div class="stat-card" style="padding:15px;background:#F8FAFC;border:1px solid #cbd5e1"><div class="stat-label">'+ltitle+'</div><div class="stat-value" style="color:var(--primary)">'+fmtMoney(totalV, state.company.currency||'EUR')+'</div></div></div>'+
          '<div style="display:flex;flex-direction:column;gap:24px">'+
         '<div style="width:100%"><h4 style="margin:0 0 10px 0;font-size:12px;text-transform:uppercase;color:var(--text-muted);letter-spacing:0.5px">Historical Article Volumes</h4><div class="table-wrap" style="max-height:240px;overflow-y:auto;box-shadow:none;border:1px solid var(--border)"><table class="data-table" style="font-size:11px;width:100%"><thead><tr style="background:#F1F5F9"><th style="padding:6px 4px">Article No.</th><th style="padding:6px 4px">Description</th><th class="r" style="padding:6px 4px">Qty</th><th class="r" style="padding:6px 4px">Total Invested</th></tr></thead><tbody>'+artRows+'</tbody></table></div></div>'+
         '<div style="width:100%"><h4 style="margin:0 0 10px 0;font-size:12px;text-transform:uppercase;color:var(--text-muted);letter-spacing:0.5px">Linked Documents</h4><div style="max-height:240px;overflow-y:auto;padding-right:8px;border:1px solid var(--border);border-radius:6px;background:#fff;padding:10px">'+docsHtml+'</div></div>'+
         '</div></div>';
  }

  var mTitle = idx >= 0 ? ('Edit ' + (type==='customer'?'Customer':'Supplier') + ' profile') : ('Register New ' + (type==='customer'?'Customer':'Supplier'));
  
  var html = '<div class="overlay" data-action="closecontactmodal" style="background:rgba(15,23,42,0.6)"><div class="pdf-container" style="max-width:900px;background:#fff;padding:0;border-radius:12px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);overflow-y:auto;max-height:95vh;display:flex;flex-direction:column" onclick="event.stopPropagation()">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:24px 30px;border-bottom:1px solid var(--border)"><h2 style="margin:0;font-size:18px;font-weight:600">'+mTitle+'</h2><button class="btn btn-ghost" data-action="closecontactmodal">\u2715</button></div>'+
      '<div style="padding:30px;flex:1;background:#FAFAFA"><div id="contactEditorFields" style="display:flex;flex-direction:column;gap:14px;background:#fff;padding:20px;border-radius:8px;border:1px solid var(--border)">'+
        '<div class="field" style="margin-bottom:12px"><label class="label">Company / Legal Name</label><input class="input" id="cModalName" value="'+esc(c.name||'')+'" placeholder="Acme Corp."/></div>'+
        '<div class="form-row three"><div class="field"><label class="label">Address / Street</label><input class="input" id="cModalAddr" value="'+esc(c.address||'')+'"/></div><div class="field"><label class="label">City / ZIP</label><input class="input" id="cModalCity" value="'+esc(c.city||'')+'"/></div><div class="field"><label class="label">Country</label><input class="input" id="cModalCountry" value="'+esc(c.country||'')+'"/></div></div>'+
        '<div class="form-row three"><div class="field"><label class="label">Primary Contact Person</label><input class="input" id="cModalContact" value="'+esc(c.contactPerson||'')+'"/></div><div class="field"><label class="label">Email Address</label><input class="input" id="cModalEmail" value="'+esc(c.email||'')+'"/></div><div class="field"><label class="label">Phone Number</label><input class="input" id="cModalPhone" value="'+esc(c.phone||'')+'"/></div></div>'+
      '</div>'+
      '<div class="form-section" style="margin-top:20px;padding:20px;background:#fff;border-radius:8px;border:1px solid var(--border)"><h3 style="margin:0 0 16px 0;font-size:15px;color:var(--text)">Company Documents (Attachments)</h3>'+
      '<div>' + (c.attachments || []).map(function(a,aidx){ 
          return '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:#FAFAFA;border:1px solid #CBD5E1;border-radius:6px;margin-bottom:8px;"><a href="' + a.url + '" target="_blank" style="font-size:13px;color:var(--primary);text-decoration:none;font-weight:500">\uD83D\uDCCE ' + esc(a.name) + '</a><button class="btn btn-sm btn-ghost btn-danger" style="margin:0;padding:2px 8px;height:auto" onclick="event.stopPropagation(); window.state.'+(type==='customer'?'customers':'suppliers')+'['+idx+'].attachments.splice('+aidx+',1); window.render()">Delete</button></div>';
      }).join('') + '</div>' + 
      '<div style="margin-top:10px"><input type="file" id="contact-attachments" multiple onchange="window.uploadAttachments(event)" style="font-size:12px;cursor:pointer" /></div></div>' +
      statsHtml+'</div>'+
      '<div style="padding:20px 30px;background:#fff;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:12px;border-radius:0 0 12px 12px">'+
        '<button class="btn btn-ghost" data-action="closecontactmodal">Cancel</button>'+
        '<button class="btn btn-primary" onclick="window.saveContactModal()" style="padding-left:24px;padding-right:24px">Save Profile Details</button>'+
      '</div></div></div>';

  return html;
}

export function renderContacts() {
  var content = '<div class="grid" style="display:grid;grid-template-columns:1fr 1fr;gap:20px">';
  var cb = '';
  if (!state.customers.length) cb = '<div class="empty-state" style="padding:24px;font-size:13px;background:#F8FAFC;border:2px dashed #CBD5E1">No customers registered yet. Track all sales profiles here.</div>';
  else {
    state.customers.forEach(function(c, i) {
      cb += '<div class="contact-card" data-contextmenu="customer-'+i+'" ondblclick="event.stopPropagation(); window.editContact(\'customer\', '+i+');" style="padding:16px;border:1px solid var(--border);border-radius:8px;margin-bottom:12px;cursor:pointer;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,0.03)"><div style="display:flex;justify-content:space-between"><div style="font-weight:600;font-size:15px;color:var(--text)">'+esc(c.name)+'</div><button class="btn btn-sm btn-ghost btn-danger" style="margin:0;padding:2px 8px;height:auto" onclick="event.stopPropagation(); window.customConfirm(\'Delete customer profile permanently?\', function(){ window.state.customers.splice('+i+', 1); window.saveData(\'qm_customers\', window.state.customers); window.render(); });">Delete</button></div><div style="font-size:12px;color:var(--text-muted);margin-top:6px;font-weight:500">'+esc(c.contactPerson)+' \u00b7 '+esc(c.email)+' \u00b7 '+esc(c.phone)+'</div><div style="font-size:11px;color:#94A3B8;margin-top:8px;display:flex;align-items:center;gap:4px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>'+esc(c.address)+', '+esc(c.city)+' '+esc(c.country)+'</div></div>';
    });
  }
  content += '<div><div class="section-title" style="margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;font-size:16px">Customers <button class="btn btn-sm" onclick="window.state.showContactModal=\'customer\';window.state.editingContact=-1;window.render()" style="background:#0F172A;color:#fff;box-shadow:0 2px 4px rgba(15,23,42,0.15)">+ Add Customer</button></div>'+cb+'</div>';
  
  var sb = '';
  if (!state.suppliers.length) sb = '<div class="empty-state" style="padding:24px;font-size:13px;background:#F8FAFC;border:2px dashed #CBD5E1">No suppliers registered yet. Track all procurement profiles here.</div>';
  else {
    state.suppliers.forEach(function(s, i) {
      sb += '<div class="contact-card" data-contextmenu="supplier-'+i+'" ondblclick="event.stopPropagation(); window.editContact(\'supplier\', '+i+');" style="padding:16px;border:1px solid var(--border);border-radius:8px;margin-bottom:12px;cursor:pointer;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,0.03)"><div style="display:flex;justify-content:space-between"><div style="font-weight:600;font-size:15px;color:var(--text)">'+esc(s.name)+'</div><button class="btn btn-sm btn-ghost btn-danger" style="margin:0;padding:2px 8px;height:auto" onclick="event.stopPropagation(); window.customConfirm(\'Delete supplier profile permanently?\', function(){ window.state.suppliers.splice('+i+', 1); window.saveData(\'qm_suppliers\', window.state.suppliers); window.render(); });">Delete</button></div><div style="font-size:12px;color:var(--text-muted);margin-top:6px;font-weight:500">'+esc(s.contactPerson)+' \u00b7 '+esc(s.email)+' \u00b7 '+esc(s.phone)+'</div><div style="font-size:11px;color:#94A3B8;margin-top:8px;display:flex;align-items:center;gap:4px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>'+esc(s.address)+', '+esc(s.city)+' '+esc(s.country)+'</div></div>';
    });
  }
  content += '<div><div class="section-title" style="margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;font-size:16px">Suppliers <button class="btn btn-sm" onclick="window.state.showContactModal=\'supplier\';window.state.editingContact=-1;window.render()" style="background:#0F172A;color:#fff;box-shadow:0 2px 4px rgba(15,23,42,0.15)">+ Add Supplier</button></div>'+sb+'</div>';
  content += '</div>';
  return '<div class="page-header"><div><div class="page-title">Contact Directory</div><div class="page-subtitle">Manage all business relationships</div></div></div>' + content;
}
