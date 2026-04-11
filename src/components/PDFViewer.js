import { state } from '../modules/state.js';
import { CURRENCIES } from '../modules/constants.js';
import { calcSummary, fmtNum, pf, itemTotal, esc, escNl } from '../modules/utils.js';

export function renderPDFOverlay() {
  var q = state.current, c = state.company, sm = calcSummary(q, c);
  var cur = CURRENCIES[c.currency] || CURRENCIES.EUR;
  var tp = Math.round((q.taxRate !== undefined ? q.taxRate : (c.taxRate || 0)) * 100);
  
  var isPO = !!q.poNumber;
  var isInvoice = !!q.invoiceNumber;
  var docTitle = isPO ? 'Purchase Order' : (isInvoice ? 'Invoice' : 'Quotation');
  var docNumLabel = isPO ? 'PO Number' : (isInvoice ? 'Invoice Number' : 'Quote Number');
  var docNumVal = isPO ? q.poNumber : (isInvoice ? q.invoiceNumber : q.quoteNumber);
  var docIntro = isPO ? 'Please supply the following items:' : (isInvoice ? 'Thank you for your business. Please find your invoice for the following items:' : 'Thank you for your interest. We are pleased to offer you the following items:');
  var cp = isPO ? 'supplier' : 'customer';

  var ih = '';
  for (var i = 0; i < q.items.length; i++) {
    var it = q.items[i]; var t = itemTotal(it);
    ih += '<tr><td class="l">' + esc(it.pos || String((i + 1) * 10)) + '</td><td class="l"><div style="font-weight:500">' + esc(it.articleNumber) + '</div><div>' + esc(it.description) + (it.material ? ' <span style="color:#64748B">\u2014 ' + esc(it.material) + '</span>' : '') + '</div>' + (it.specification ? '<div class="pdf-item-spec">' + escNl(it.specification) + '</div>' : '') + '</td><td class="r">' + esc(it.ve) + '</td><td class="r mono">' + fmtNum(pf(it.quantity), c) + '</td><td class="r mono">' + fmtNum(pf(it.unitPrice), c) + '</td><td class="r mono">' + fmtNum(t, c) + '</td></tr>';
  }
  var sl = [q.senderName, q.senderStreet, q.senderCity].filter(Boolean).join(' \u00B7 ');
  return '<div class="overlay" data-action="closemodal"><div class="modal" onclick="event.stopPropagation()">' +
    '<div class="modal-bar no-print"><span>Preview \u2014 ' + esc(docNumVal) + '</span><div class="btn-group"><button class="btn btn-sm" data-action="printpdf">\u2399 Export PDF</button><button class="btn btn-sm btn-ghost" data-action="closemodal">\u2715</button></div></div>' +
    '<div id="pdf-content" class="pdf"><div class="pdf-body">' +
    '<div class="pdf-head"><div style="flex:1"><div class="pdf-sender-line">' + esc(sl) + '</div><div class="pdf-addr"><strong>' + (esc(q[cp+'Name']) || (isPO ? 'Supplier Name' : 'Customer Name')) + '</strong><br/>' +
    (q[cp+'Address'] ? esc(q[cp+'Address']) + '<br/>' : '') +
    (q[cp+'City'] ? esc(q[cp+'City']) + '<br/>' : '') +
    (q[cp+'Country'] ? esc(q[cp+'Country']) : '') +
    (q[cp+'ContactPerson'] ? '<br/><span style="color:#475569;font-size:10.5px">Attn: ' + esc(q[cp+'ContactPerson']) + '</span>' : '') +
    (q[cp+'ContactEmail'] ? '<br/><span style="color:#475569;font-size:10.5px">' + esc(q[cp+'ContactEmail']) + '</span>' : '') +
    (q[cp+'ContactPhone'] ? '<span style="color:#475569;font-size:10.5px"> \u00B7 ' + esc(q[cp+'ContactPhone']) + '</span>' : '') +
    '</div></div>' +
    '<div class="pdf-right"><div class="pdf-brand">' + esc(q.senderName || c.name) + '<span style="color:#C6A8A1;font-size:24px;line-height:0">.</span></div>' +
    '<div class="pdf-doc-title" style="margin-top:10px">' + docTitle + '</div>' +
    '<table class="pdf-meta"><tbody>' +
    '<tr><td class="lbl">' + docNumLabel + '</td><td class="val">' + esc(docNumVal) + '</td></tr>' +
    '<tr><td class="lbl">Date</td><td class="val">' + esc(q.date) + '</td></tr>' +
    (isInvoice ? '<tr><td class="lbl">Payment Due</td><td class="val">' + (esc(q.paymentDueDate) || '\u2014') + '</td></tr>' : '<tr><td class="lbl">Valid Until</td><td class="val">' + (esc(q.validUntil) || '\u2014') + '</td></tr>') +
    '<tr><td class="lbl">Currency</td><td class="val">' + c.currency + '</td></tr>' +
    (q.reference ? '<tr><td class="lbl">Reference</td><td class="val pdf-ref">' + esc(q.reference) + '</td></tr>' : '') +
    '</tbody></table></div></div>' +
    '<div class="pdf-greeting">Dear Sir or Madam,</div>' +
    '<div class="pdf-intro">' + docIntro + '</div>' +
    '<table class="pdf-tbl"><thead><tr><th class="l" style="width:36px">Pos.</th><th class="l">Article # / Description</th><th class="r" style="width:36px">Pack</th><th class="r" style="width:68px">Quantity</th><th class="r" style="width:68px">Price ' + cur.symbol + '</th><th class="r" style="width:82px">Net ' + cur.symbol + '</th></tr></thead><tbody>' + ih + '</tbody></table>' +
    '<div class="pdf-sum-area"><div class="pdf-sum">' +
    '<div class="pdf-sum-row"><span>Subtotal</span><span class="mono">' + fmtNum(sm.subtotal, c) + '</span></div>' +
    (sm.shipping > 0 ? '<div class="pdf-sum-row"><span>Shipping</span><span class="mono">' + fmtNum(sm.shipping, c) + '</span></div>' : '') +
    (sm.packaging > 0 ? '<div class="pdf-sum-row"><span>Packaging</span><span class="mono">' + fmtNum(sm.packaging, c) + '</span></div>' : '') +
    (sm.discount > 0 ? '<div class="pdf-sum-row"><span>Discount</span><span class="mono">-' + fmtNum(sm.discount, c) + '</span></div>' : '') +
    (sm.taxRate > 0 ? '<div class="pdf-sum-row"><span>' + (c.currency === 'INR' ? 'GST' : 'Tax') + ' (' + tp + '%)</span><span class="mono">' + fmtNum(sm.taxAmount, c) + '</span></div>' : '') +
    '<div class="pdf-sum-row total"><span>Grand Total ' + c.currency + '</span><span class="mono">' + fmtNum(sm.grandTotal, c) + '</span></div>' +
    '</div></div>' +
    '<div class="pdf-terms">' +
    '<div class="pdf-terms-row"><span class="pdf-terms-label">Delivery Terms:</span><span>' + esc(q.deliveryTerms) + ' ' + (esc(q.deliveryPlace) || '') + '</span></div>' +
    (q.deliveryTime ? '<div class="pdf-terms-row"><span class="pdf-terms-label">Delivery Time:</span><span>' + esc(q.deliveryTime) + '</span></div>' : '') +
    '<div class="pdf-terms-row"><span class="pdf-terms-label">Payment Terms:</span><span>' + esc(q.paymentTerms) + '</span></div>' +
    '</div>' +
    '<div class="pdf-closing"><p>' + (isPO ? 'We look forward to confirming this order.' : 'We look forward to your business and thank you for your trust.') + '</p><p style="margin-top:8px">Kind regards,</p><p style="margin-top:6px;font-weight:600">' + esc(q.senderContactPerson || c.ceo) + '</p><p style="color:#64748B">' + esc(q.senderName || c.name) + '</p></div>' +
    (q.notes ? '<div style="margin-top:14px;font-size:10px;color:#64748B;font-style:italic;border-top:1px solid #E2E8F0;padding-top:8px">' + escNl(q.notes) + '</div>' : '') +
    '</div>' +
    '<div class="pdf-footer"><div class="pdf-footer-col"><div style="font-weight:500;color:#64748B">' + esc(q.senderName || c.name) + '</div><div>' + esc(q.senderStreet || c.street) + '</div><div>' + esc(q.senderCity || c.city) + '</div>' + (q.senderPhone ? '<div>T: ' + esc(q.senderPhone) + '</div>' : '') + (q.senderEmail ? '<div>' + esc(q.senderEmail) + '</div>' : '') + '</div>' +
    '<div class="pdf-footer-col">' + (q.senderWeb ? '<div>' + esc(q.senderWeb) + '</div>' : '') + '</div></div>' +
    '</div></div></div>';
}
