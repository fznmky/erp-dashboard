import { CURRENCIES } from './constants.js';

export function emptyItem() { return { pos: '', articleNumber: '', description: '', material: '', specification: '', ve: '1', quantity: '', unitPrice: '' }; }
export function emptyArticle() { return { id: Date.now(), articleNumber: '', description: '', specification: '', category: 'GEN', material: '', packSize: '1', defaultPrice: '' }; }
export function emptyQuote(quotes, company) {
  var last = quotes.length > 0 ? quotes[0] : null;
  return {
    id: Date.now(), quoteNumber: getNextQN(quotes), customerNumber: '', date: todayStr(), validUntil: '', reference: '',
    customerName: '', customerAddress: '', customerCity: '', customerCountry: '',
    customerContactPerson: '', customerContactEmail: '', customerContactPhone: '',
    senderName: last ? last.senderName : (company.name || ''),
    senderStreet: last ? last.senderStreet : (company.street || ''),
    senderCity: last ? last.senderCity : (company.city || ''),
    senderPhone: last ? last.senderPhone : (company.phone || ''),
    senderEmail: last ? last.senderEmail : (company.email || ''),
    senderWeb: last ? last.senderWeb : (company.web || ''),
    senderContactPerson: last ? last.senderContactPerson : (company.ceo || ''),
    items: [emptyItem()], deliveryTerms: 'DAP', deliveryPlace: '', deliveryTime: '',
    paymentTerms: '14 days net', notes: '',
    shippingCost: 0, packagingCost: 0, discountPercent: 0, discount: 0, taxRate: company.taxRate, attachments: []
  };
}
export function emptyPO(pos, company) {
  var last = pos.length > 0 ? pos[0] : null;
  return {
    id: Date.now(), poNumber: getNextPONum(pos), date: todayStr(), validUntil: '', reference: '',
    supplierName: '', supplierAddress: '', supplierCity: '', supplierCountry: '',
    supplierContactPerson: '', supplierContactEmail: '', supplierContactPhone: '',
    senderName: last ? last.senderName : (company.name || ''),
    senderStreet: last ? last.senderStreet : (company.street || ''),
    senderCity: last ? last.senderCity : (company.city || ''),
    senderPhone: last ? last.senderPhone : (company.phone || ''),
    senderEmail: last ? last.senderEmail : (company.email || ''),
    senderWeb: last ? last.senderWeb : (company.web || ''),
    senderContactPerson: last ? last.senderContactPerson : (company.ceo || ''),
    items: [emptyItem()], deliveryTerms: 'DAP', deliveryPlace: '', deliveryTime: '',
    paymentTerms: '14 days net', notes: '',
    shippingCost: 0, packagingCost: 0, discountPercent: 0, discount: 0, taxRate: company.taxRate, attachments: []
  };
}
export function emptyInvoice(invs, company) {
  var last = invs.length > 0 ? invs[0] : null;
  return {
    id: Date.now(), invoiceNumber: getNextInvoiceNum(invs), date: todayStr(), paymentDueDate: '', reference: '',
    customerName: '', customerAddress: '', customerCity: '', customerCountry: '',
    customerContactPerson: '', customerContactEmail: '', customerContactPhone: '',
    senderName: last ? last.senderName : (company.name || ''),
    senderStreet: last ? last.senderStreet : (company.street || ''),
    senderCity: last ? last.senderCity : (company.city || ''),
    senderPhone: last ? last.senderPhone : (company.phone || ''),
    senderEmail: last ? last.senderEmail : (company.email || ''),
    senderWeb: last ? last.senderWeb : (company.web || ''),
    senderContactPerson: last ? last.senderContactPerson : (company.ceo || ''),
    items: [emptyItem()], deliveryTerms: 'DAP', deliveryPlace: '', deliveryTime: '',
    paymentTerms: '14 days net', notes: '',
    shippingCost: 0, packagingCost: 0, discountPercent: 0, discount: 0, taxRate: company.taxRate, attachments: []
  };
}
export function getNextQN(quotes) { if (!quotes.length) return 'QT-0001'; var mx = 0; quotes.forEach(function (q) { var m = q.quoteNumber.match(/QT-(\d+)/); if (m) { var n = parseInt(m[1]); if (n > mx) mx = n; } }); return 'QT-' + String(mx + 1).padStart(4, '0'); }
export function getNextPONum(pos) { if (!pos.length) return 'PO-0001'; var mx = 0; pos.forEach(function (p) { var m = p.poNumber.match(/PO-(\d+)/); if (m) { var n = parseInt(m[1]); if (n > mx) mx = n; } }); return 'PO-' + String(mx + 1).padStart(4, '0'); }
export function getNextInvoiceNum(invs) { if (!invs.length) return 'INV-0001'; var mx = 0; invs.forEach(function (i) { var m = i.invoiceNumber.match(/INV-(\d+)/); if (m) { var n = parseInt(m[1]); if (n > mx) mx = n; } }); return 'INV-' + String(mx + 1).padStart(4, '0'); }
export function getNextArticleNum(articles, catKey) {
  var mx = 0;
  articles.forEach(function (a) { var m = a.articleNumber.match(new RegExp('^' + catKey + '-(\\d+)$')); if (m) { var n = parseInt(m[1]); if (n > mx) mx = n; } });
  return catKey + '-' + String(mx + 1).padStart(4, '0');
}
export function todayStr() { return new Date().toISOString().split('T')[0]; }
export function pf(v) { return parseFloat(v) || 0; }
export function itemTotal(it) { return pf(it.quantity) * pf(it.unitPrice); }
export function calcSummary(q, c) {
  var sub = q.items.reduce(function (s, i) { return s + itemTotal(i); }, 0);
  var sh = pf(q.shippingCost), pk = pf(q.packagingCost), dc = pf(q.discount);
  var net = sub + sh + pk - dc; var tr = q.taxRate !== undefined ? parseFloat(q.taxRate) : (parseFloat(c.taxRate) || 0); var tax = net * tr;
  return { subtotal: sub, shipping: sh, packaging: pk, discount: dc, netBeforeTax: net, taxRate: tr, taxAmount: tax, grandTotal: net + tax };
}
export function fmtMoney(a, c) { var cr = CURRENCIES[c.currency] || CURRENCIES.EUR; var d = cr.decimals !== undefined ? cr.decimals : 2; return Number(a || 0).toLocaleString(cr.locale, { minimumFractionDigits: d, maximumFractionDigits: d }) + ' ' + cr.symbol; }
export function fmtNum(a, c) { var cr = CURRENCIES[c.currency] || CURRENCIES.EUR; var d = cr.decimals !== undefined ? cr.decimals : 2; return Number(a || 0).toLocaleString(cr.locale, { minimumFractionDigits: d, maximumFractionDigits: d }); }
export function esc(s) { if (s == null) return ''; return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
export function escNl(s) { return esc(s).replace(/\n/g, '<br/>'); }

window.customConfirm = function(msg, callback) {
  var overlay = document.createElement('div');
  overlay.className = 'overlay dialog-overlay';
  overlay.style.zIndex = '9999';
  overlay.innerHTML = '<div style="background:#fff;border-radius:12px;width:380px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);overflow:hidden;animation:fadeIn 0.2s">' +
    '<div style="background:var(--primary);color:#fff;padding:16px 20px;font-weight:600;font-size:15px;display:flex;align-items:center;gap:10px">' +
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Please Confirm</div>' +
    '<div style="padding:24px 20px;font-size:14px;color:var(--text);line-height:1.5">' + esc(msg) + '</div>' + 
    '<div style="padding:16px 20px;background:#F8FAFC;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:10px">' +
    '<button class="btn btn-ghost" id="dlg-cancel">Cancel</button>' +
    '<button class="btn btn-primary" style="background:#DC2626;border-color:#DC2626;color:#fff" id="dlg-ok">Confirm Action</button>' +
    '</div></div>';
  document.body.appendChild(overlay);
  document.getElementById('dlg-cancel').onclick = function(){ overlay.remove(); };
  document.getElementById('dlg-ok').onclick = function(){ overlay.remove(); callback(); };
};
export function loadData(k, f) { try { var d = localStorage.getItem(k); return d ? JSON.parse(d) : f; } catch (e) { return f; } }
export function saveData(k, d) { try { localStorage.setItem(k, JSON.stringify(d)); } catch (e) { } }
window.saveData = saveData;

window.editContact = function(type, idx) {
  if(window.state) {
    window.state.showContactModal = type;
    window.state.editingContact = idx;
    if(window.render) window.render();
  }
};

export function emptyCustomer() { return { id: Date.now(), name: '', address: '', city: '', country: '', contactPerson: '', email: '', phone: '' }; }
export function emptySupplier() { return { id: Date.now(), name: '', address: '', city: '', country: '', contactPerson: '', email: '', phone: '' }; }

export function detectCategory(artNum) {
  var prefix = (artNum || '').split('-')[0].toUpperCase();
  for (var i = 0; i < window.state.categories.length; i++) { if (window.state.categories[i].key === prefix) return prefix; }
  return 'GEN';
}

window.addCategory = function() {
  var name = prompt("Enter the new category name (e.g. Electrical):");
  if (!name || !name.trim()) return;
  var key = prompt("Enter a 3-letter abbreviation for the key (e.g. ELC):");
  if (!key || key.trim().length !== 3) { alert("Key must be exactly 3 letters."); return; }
  key = key.trim().toUpperCase();
  var exists = window.state.categories.some(function(c){ return c.key === key || c.label.toLowerCase() === name.trim().toLowerCase(); });
  if (exists) { alert("Category with this key or name already exists!"); return; }
  window.state.categories.push({ key: key, label: name.trim() });
  window.saveData('qm_categories', window.state.categories);
  window.render();
};

window.deleteCategory = function() {
  var sel = document.querySelector('[data-artfield="category"]');
  if (!sel || !sel.value) return;
  var key = sel.value;
  if(key === 'GEN') { alert('Cannot delete the default General (GEN) category.'); return; }
  window.customConfirm('Permanently delete the ' + key + ' category?', function() {
    window.state.categories = window.state.categories.filter(function(c){ return c.key !== key; });
    window.saveData('qm_categories', window.state.categories);
    window.render();
  });
};
