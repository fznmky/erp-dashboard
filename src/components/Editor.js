import { state } from '../modules/state.js';
import { STATUS_MAP, CURRENCIES } from '../modules/constants.js';
import { calcSummary, fmtMoney, esc, itemTotal, fmtNum } from '../modules/utils.js';

export function renderEditor() {
  var q = state.current, c = state.company, sm = calcSummary(q, c);
  var cur = CURRENCIES[c.currency] || CURRENCIES.EUR;
  var tp = Math.round((q.taxRate !== undefined ? q.taxRate : (c.taxRate || 0)) * 100);
  var type = 'quotes', pTitle = 'Quote', idf = 'quoteNumber';
  if (q.poNumber) { type = 'purchaseOrders'; pTitle = 'Purchase Order'; idf = 'poNumber'; }
  else if (q.invoiceNumber) { type = 'invoices'; pTitle = 'Invoice'; idf = 'invoiceNumber'; }
  var numLabel = type === 'purchaseOrders' ? 'PO Number' : (type === 'invoices' ? 'Invoice Number' : 'Quote Number');
  var clientHeader = type === 'purchaseOrders' ? 'Supplier Information' : 'Customer Information';
  var clientPrefix = type === 'purchaseOrders' ? 'supplier' : 'customer';

  /* Auto-fill sender fields from company settings if empty */
  if (!q.senderName && c.name) q.senderName = c.name;
  if (!q.senderStreet && c.street) q.senderStreet = c.street;
  if (!q.senderCity && c.city) q.senderCity = c.city;
  if (!q.senderPhone && c.phone) q.senderPhone = c.phone;
  if (!q.senderEmail && c.email) q.senderEmail = c.email;
  if (!q.senderWeb && c.web) q.senderWeb = c.web;
  if (!q.senderContactPerson && c.ceo) q.senderContactPerson = c.ceo;

  /* Status dropdown */
  var so = '';
  var skeys = Object.keys(STATUS_MAP);
  for (var si = 0; si < skeys.length; si++) { var sk = skeys[si]; so += '<option value="' + sk + '"' + (q.status === sk ? ' selected' : '') + '>' + STATUS_MAP[sk].label + '</option>'; }
  /* Status badge colour */
  var stCls = STATUS_MAP[q.status] ? STATUS_MAP[q.status].cls : 'badge-draft';

  var curOpts = '';
  var ckeys = Object.keys(CURRENCIES);
  for (var ci = 0; ci < ckeys.length; ci++) { var ck = ckeys[ci]; curOpts += '<option value="' + ck + '"' + (c.currency === ck ? ' selected' : '') + '>' + ck + ' (' + CURRENCIES[ck].symbol + ')</option>'; }

  /* Line items rows */
  var ir = '';
  for (var i = 0; i < q.items.length; i++) {
    var it = q.items[i];
    var t = itemTotal(it);
    ir += '<tr>' +
      '<td><input class="itm-input" style="width:50px;text-align:center" value="' + esc(it.pos || String((i + 1) * 10)) + '" data-item="' + i + '" data-field="pos"/></td>' +
      '<td><input class="itm-input" value="' + esc(it.articleNumber) + '" data-item="' + i + '" data-field="articleNumber" placeholder="Article #"/></td>' +
      '<td>' +
        '<input class="itm-input" value="' + esc(it.description) + '" data-item="' + i + '" data-field="description" placeholder="Description"/>' +
        '<input class="itm-input" value="' + esc(it.material) + '" data-item="' + i + '" data-field="material" placeholder="Material (optional)" style="margin-top:4px;font-size:11.5px;color:#64748B"/>' +
        '<textarea class="itm-input" data-item="' + i + '" data-field="specification" placeholder="Specification (optional) \u2014 press Enter for new line" style="margin-top:4px;font-size:11.5px;color:#64748B;min-height:40px;resize:vertical">' + esc(it.specification) + '</textarea>' +
      '</td>' +
      '<td><input class="itm-input narrow" value="' + esc(it.ve) + '" data-item="' + i + '" data-field="ve"/></td>' +
      '<td><input class="itm-input med" value="' + esc(it.quantity) + '" data-item="' + i + '" data-field="quantity" placeholder="0"/></td>' +
      '<td><input class="itm-input med" value="' + esc(it.unitPrice) + '" data-item="' + i + '" data-field="unitPrice" placeholder="0.00"/></td>' +
      '<td class="itm-total">' + fmtNum(t, c) + ' ' + cur.symbol + '</td>' +
      '<td><button class="remove-btn" data-rmitem="' + i + '">\u2715</button></td>' +
    '</tr>';
  }

  /* Catalog dropdown */
  var catalogDropdown = '';
  if (state.showCatalog && state.articles.length) {
    var citems = '';
    for (var ai = 0; ai < state.articles.length; ai++) {
      var a = state.articles[ai];
      citems += '<div class="catalog-list-item" data-pickart="' + ai + '"><div class="catalog-art-num">' + esc(a.articleNumber) + '</div><div class="catalog-art-desc">' + esc(a.description) + (a.specification ? ' \u2014 ' + esc(a.specification).substring(0, 60) : '') + '</div></div>';
    }
    catalogDropdown = '<div class="catalog-list">' + citems + '</div>';
  }

  /* Incoterms */
  var incoterms = ['DAP', 'DDP', 'EXW', 'FCA', 'CIF', 'FOB', 'CPT', 'CIP'];
  var incoOpts = '';
  for (var ii = 0; ii < incoterms.length; ii++) { incoOpts += '<option' + (q.deliveryTerms === incoterms[ii] ? ' selected' : '') + '>' + incoterms[ii] + '</option>'; }

  /* Convert buttons for quotes */
  var convertBtns = '';
  if (type === 'quotes') {
     convertBtns = '<button class="btn btn-sm btn-ghost" style="margin-right:8px" data-action="convertpo" title="Create a Supplier PO based on this Quote">Convert to PO</button><button class="btn btn-sm btn-ghost" style="margin-right:12px" data-action="convertinv" title="Create an Invoice to Customer based on this Quote">Convert to Invoice</button>';
  }

  /* Contact picker options */
  var contactOpts = '';
  if (type === 'purchaseOrders') {
     for(var ci=0; ci<state.suppliers.length; ci++) contactOpts += '<option value="'+ci+'">'+esc(state.suppliers[ci].name)+'</option>';
  } else {
     for(var ci=0; ci<state.customers.length; ci++) contactOpts += '<option value="'+ci+'">'+esc(state.customers[ci].name)+'</option>';
  }

  /* Link to Quote dropdown for POs and Invoices */
  var linkQuoteSection = '';
  if (type !== 'quotes' && state.quotes.length > 0) {
    var qOpts = '<option value="">-- Select Related Quote --</option>';
    for (var qi = 0; qi < state.quotes.length; qi++) {
      var qt = state.quotes[qi];
      var sel = (q.relatedQuoteNumber === qt.quoteNumber) ? ' selected' : '';
      qOpts += '<option value="' + esc(qt.quoteNumber) + '"' + sel + '>' + esc(qt.quoteNumber) + ' \u2014 ' + esc(qt.customerName || 'No client') + '</option>';
    }
    linkQuoteSection = '<div class="field" style="margin-top:12px"><label class="label">Link to Quote (Relationship Map)</label>' +
      '<select class="input" data-action="linkquote">' + qOpts + '</select></div>';
  }

  /* ═══ MAIN EDITOR LAYOUT ═══ */
  return '' +
    /* === Page header with title, status badge, and action buttons === */
    '<div class="page-header">' +
      '<div>' +
        '<div class="page-title" style="display:flex;align-items:center;gap:10px">' +
          '<button class="btn btn-sm btn-ghost" data-action="back" style="margin-right:4px">\u2190</button>' +
          pTitle + ' ' + esc(q[idf]) +
          '<span class="badge ' + stCls + '" style="font-size:11px;padding:4px 12px;margin-left:8px">' + (STATUS_MAP[q.status] ? STATUS_MAP[q.status].label : 'Draft') + '</span>' +
        '</div>' +
        '<div class="page-subtitle" style="margin-top:6px">' +
          '<select class="input" style="width:140px;padding:8px 12px;font-size:12.5px;border-radius:8px" data-field="status">' + so + '</select>' +
        '</div>' +
      '</div>' +
      '<div class="btn-group">' + convertBtns +
        '<button class="btn" data-action="cancel">Cancel</button>' +
        '<button class="btn" data-action="preview">Preview PDF</button>' +
        '<button class="btn btn-primary" data-action="save">Save</button>' +
      '</div>' +
    '</div>' +

    /* === Two-column form grid: Sender + Client === */
    '<div class="form-grid">' +
      '<div class="form-section">' +
        '<div class="section-title">Your Company (Sender)</div>' +
        '<div class="field" style="margin-bottom:12px"><label class="label">Company Name</label><input class="input" value="' + esc(q.senderName) + '" data-field="senderName"/></div>' +
        '<div class="form-row"><div class="field"><label class="label">Street / Area</label><input class="input" value="' + esc(q.senderStreet) + '" data-field="senderStreet"/></div><div class="field"><label class="label">ZIP / City / Country</label><input class="input" value="' + esc(q.senderCity) + '" data-field="senderCity"/></div></div>' +
        '<div class="form-row"><div class="field"><label class="label">Contact Person</label><input class="input" value="' + esc(q.senderContactPerson) + '" data-field="senderContactPerson"/></div><div class="field"><label class="label">Phone</label><input class="input" value="' + esc(q.senderPhone) + '" data-field="senderPhone"/></div></div>' +
        '<div class="form-row"><div class="field"><label class="label">Email</label><input class="input" value="' + esc(q.senderEmail) + '" data-field="senderEmail"/></div><div class="field"><label class="label">Website</label><input class="input" value="' + esc(q.senderWeb) + '" data-field="senderWeb"/></div></div>' +
      '</div>' +

      '<div class="form-section">' +
        '<div class="section-title" style="display:flex;justify-content:space-between;align-items:center">' + clientHeader +
          ' <select class="input" style="width:200px;padding:8px 10px;font-size:11.5px" data-action="pickcontact"><option value="">-- Autofill from Contacts --</option>' + contactOpts + '</select>' +
        '</div>' +
        '<div class="field" style="margin-bottom:12px"><label class="label">Company / Name</label><div style="display:flex;gap:8px"><input class="input" style="flex:1" value="' + esc(q[clientPrefix+'Name']) + '" data-field="' + clientPrefix + 'Name" placeholder="' + clientHeader.split(' ')[0] + ' name"/><button class="btn" title="Save to Contacts" data-action="savecontact">Save to Contacts</button></div></div>' +
        '<div class="field" style="margin-bottom:12px"><label class="label">Address</label><input class="input" value="' + esc(q[clientPrefix+'Address']) + '" data-field="' + clientPrefix + 'Address" placeholder="Street"/></div>' +
        '<div class="form-row"><div class="field"><label class="label">ZIP / City</label><input class="input" value="' + esc(q[clientPrefix+'City']) + '" data-field="' + clientPrefix + 'City" placeholder="12345 City"/></div><div class="field"><label class="label">Country</label><input class="input" value="' + esc(q[clientPrefix+'Country']) + '" data-field="' + clientPrefix + 'Country" placeholder="Country"/></div></div>' +
        '<div class="form-row three"><div class="field"><label class="label">Contact Person</label><input class="input" value="' + esc(q[clientPrefix+'ContactPerson']) + '" data-field="' + clientPrefix + 'ContactPerson"/></div><div class="field"><label class="label">Email</label><input class="input" value="' + esc(q[clientPrefix+'ContactEmail']) + '" data-field="' + clientPrefix + 'ContactEmail"/></div><div class="field"><label class="label">Phone</label><input class="input" value="' + esc(q[clientPrefix+'ContactPhone']) + '" data-field="' + clientPrefix + 'ContactPhone"/></div></div>' +
      '</div>' +
    '</div>' +

    /* === Document details === */
    '<div class="form-section" style="margin-top:16px">' +
      '<div class="section-title">' + pTitle + ' Details</div>' +
      '<div class="form-row"><div class="field"><label class="label">' + numLabel + '</label><input class="input" value="' + esc(q[idf]) + '" data-field="' + idf + '"/></div><div class="field"><label class="label">Currency</label><select class="input" data-currencychange="1">' + curOpts + '</select></div></div>' +
      '<div class="form-row three">' +
        '<div class="field"><label class="label">Date</label><input type="date" class="input" value="' + esc(q.date) + '" data-field="date"/></div>' +
        (type === 'invoices' ? '<div class="field"><label class="label">Payment Due Date</label><input type="date" class="input" value="' + esc(q.paymentDueDate) + '" data-field="paymentDueDate"/></div>' : '<div class="field"><label class="label">Valid Until</label><input type="date" class="input" value="' + esc(q.validUntil) + '" data-field="validUntil"/></div>') +
        '<div class="field"><label class="label">Reference</label><input class="input" value="' + esc(q.reference) + '" data-field="reference" placeholder="e.g. ' + (type==='purchaseOrders' ? 'Quote '+q.relatedQuoteNumber : 'RFQ / Project ref') + '"/></div>' +
      '</div>' +
      linkQuoteSection +
    '</div>' +

    /* === Line items === */
    '<div class="items-section">' +
      '<div class="section-title">Line Items</div>' +
      '<table class="items-tbl"><thead><tr>' +
        '<th style="width:50px;text-align:center">Pos.</th>' +
        '<th style="width:120px">Article #</th>' +
        '<th>Description</th>' +
        '<th style="width:55px" class="r">Pack</th>' +
        '<th style="width:80px" class="r">Qty</th>' +
        '<th style="width:90px" class="r">Price (' + cur.symbol + ')</th>' +
        '<th style="width:100px" class="r">Total (' + cur.symbol + ')</th>' +
        '<th style="width:30px"></th>' +
      '</tr></thead><tbody>' + ir + '</tbody></table>' +
      '<div style="margin-top:12px;display:flex;gap:8px;align-items:flex-start">' +
        '<button class="btn btn-sm" data-action="additem">+ Add Line Item</button>' +
        '<div class="catalog-dropdown"><button class="btn btn-sm" data-action="togglecatalog">\uD83D\uDCE6 From Catalog' + (state.articles.length ? ' (' + state.articles.length + ')' : '') + '</button>' + catalogDropdown + '</div>' +
      '</div>' +
    '</div>' +

    /* === Terms & Summary === */
    '<div class="summary-area">' +
      '<div class="summary-box">' +
        '<div class="section-title">Terms &amp; Conditions</div>' +
        '<div class="form-row"><div class="field"><label class="label">Delivery Terms (Incoterm)</label><div style="display:flex;gap:6px"><select class="input" data-field="deliveryTerms" style="width:100px">' + incoOpts + '</select><input class="input" value="' + esc(q.deliveryPlace) + '" data-field="deliveryPlace" placeholder="Location"/></div></div><div class="field"><label class="label">Delivery Time</label><input class="input" value="' + esc(q.deliveryTime) + '" data-field="deliveryTime" placeholder="e.g. approx. 31 weeks"/></div></div>' +
        '<div class="field" style="margin-bottom:12px"><label class="label">Payment Terms</label><input class="input" value="' + esc(q.paymentTerms) + '" data-field="paymentTerms"/></div>' +
        '<div class="field"><label class="label">Notes</label><textarea class="input" data-field="notes" placeholder="Additional notes...">' + esc(q.notes) + '</textarea></div>' +
      '</div>' +
      '<div class="summary-box">' +
        '<div class="section-title">Summary</div>' +
        '<div class="sum-row"><span>Subtotal</span><span class="mono">' + fmtMoney(sm.subtotal, c) + '</span></div>' +
        '<div class="sum-row"><span>Shipping</span><span style="display:flex;align-items:center;gap:4px"><input class="sum-inline-input" value="' + q.shippingCost + '" data-field="shippingCost"/><span style="font-size:11px;color:var(--text-muted)">' + cur.symbol + '</span></span></div>' +
        '<div class="sum-row"><span>Packaging</span><span style="display:flex;align-items:center;gap:4px"><input class="sum-inline-input" value="' + q.packagingCost + '" data-field="packagingCost"/><span style="font-size:11px;color:var(--text-muted)">' + cur.symbol + '</span></span></div>' +
        '<div class="sum-row"><span>Discount</span><span style="display:flex;align-items:center;gap:4px"><input class="sum-inline-input" style="width:36px" value="' + (q.discountPercent||'0') + '" data-field="discountPercent"/><span style="font-size:11px;color:var(--text-muted)">%</span> &nbsp; <input class="sum-inline-input" value="' + q.discount + '" data-field="discount"/><span style="font-size:11px;color:var(--text-muted)">' + cur.symbol + '</span></span></div>' +
        '<div class="sum-row"><span>' + (c.currency === 'INR' ? 'GST' : 'Tax') + '</span><span style="display:flex;align-items:center;gap:4px"><input class="sum-inline-input" style="width:36px" value="' + tp + '" data-field="taxRatePercent"/><span style="font-size:11px;color:var(--text-muted)">%</span> &nbsp; <span class="mono" style="width:72px;text-align:right" data-calc="taxAmount">' + fmtMoney(sm.taxAmount, c) + '</span></span></div>' +
        '<div class="sum-row total"><span>Grand Total</span><span class="mono">' + fmtMoney(sm.grandTotal, c) + '</span></div>' +
      '</div>' +
    '</div>' +

    /* === Attachments === */
    '<div class="form-section" style="margin-top:16px;background:#F8FAFC">' +
      '<div class="section-title">Attachments & Files</div>' +
      '<div>' + (q.attachments || []).map(function(a,idx){ 
         return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:#fff;border:1.5px solid #CBD5E1;border-radius:8px;margin-bottom:8px;box-shadow:0 1px 3px rgba(0,0,0,0.04)"><a href="' + a.url + '" target="_blank" style="font-size:13px;color:var(--primary);text-decoration:none;font-weight:500">\uD83D\uDCCE ' + esc(a.name) + '</a><button class="btn btn-sm btn-ghost btn-danger" style="margin:0;padding:2px 8px;height:auto" onclick="event.stopPropagation(); window.state.current.attachments.splice('+idx+',1); window.render()">Delete</button></div>';
      }).join('') + '</div>' + 
      '<div style="margin-top:12px"><input type="file" id="doc-attachments" multiple onchange="window.uploadAttachments(event)" style="font-size:12px;cursor:pointer" /></div>' +
    '</div>';
}
