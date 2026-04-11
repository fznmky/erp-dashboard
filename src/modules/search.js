import { state } from './state.js';
import { calcSummary, fmtMoney, esc } from './utils.js';

/**
 * Global Search Engine
 * Searches across all data types: quotes, invoices, POs, customers, suppliers, articles
 * Returns categorized, ranked results with match context
 */

/* Normalize string for matching: lowercase, trim, collapse whitespace */
function norm(s) { return (s || '').toString().toLowerCase().trim().replace(/\s+/g, ' '); }

/* Check if all search terms appear somewhere in the text (AND logic) */
function matchesAll(text, terms) {
  var n = norm(text);
  for (var i = 0; i < terms.length; i++) {
    if (n.indexOf(terms[i]) === -1) return false;
  }
  return true;
}

/* Highlight matching terms in a string */
function highlight(text, terms) {
  if (!text) return '';
  var result = esc(text);
  for (var i = 0; i < terms.length; i++) {
    if (!terms[i]) continue;
    var regex = new RegExp('(' + terms[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    result = result.replace(regex, '<mark>$1</mark>');
  }
  return result;
}

/* Score a result: higher = better match */
function scoreMatch(text, terms, fullQuery) {
  var n = norm(text);
  var q = norm(fullQuery);
  var score = 0;
  
  /* Massive boost if the exact search query appears exactly as-is in this specific field */
  if (n === q) score += 1000;
  else if (n.indexOf(q) !== -1) score += 500;
  else if (n.indexOf(q) === 0) score += 750;

  /* Individual word scoring */
  for (var i = 0; i < terms.length; i++) {
    if (n === terms[i]) score += 100;         // Exact word match
    else if (n.indexOf(terms[i]) === 0) score += 50; // Starts with word
    else if (n.indexOf(terms[i]) !== -1) score += 20; // Contains word
  }
  return score;
}

export function globalSearch(query) {
  if (!query || !query.trim()) return [];
  
  var terms = norm(query).split(' ').filter(function(t) { return t.length > 0; });
  if (!terms.length) return [];

  var results = [];
  var c = state.company;

  /* ══ Search Quotes ══ */
  for (var qi = 0; qi < state.quotes.length; qi++) {
    var q = state.quotes[qi];
    var searchable = [q.quoteNumber, q.customerName, q.reference, q.date, q.status].join(' ');
    // Also search line item descriptions
    for (var li = 0; li < q.items.length; li++) {
      searchable += ' ' + (q.items[li].articleNumber || '') + ' ' + (q.items[li].description || '');
    }
    if (matchesAll(searchable, terms)) {
      var sm = calcSummary(q, c);
      results.push({
        type: 'quote',
        category: 'Quotes',
        icon: '\uD83D\uDCC4',
        title: q.quoteNumber,
        subtitle: q.customerName || 'No customer',
        detail: fmtMoney(sm.grandTotal, c),
        badge: q.status,
        score: scoreMatch(q.quoteNumber, terms, query) + scoreMatch(q.customerName, terms, query),
        action: { view: 'editor', idx: qi, source: 'quotes' }
      });
    }
  }

  /* ══ Search Invoices ══ */
  for (var ii = 0; ii < state.invoices.length; ii++) {
    var inv = state.invoices[ii];
    var searchable = [inv.invoiceNumber, inv.customerName, inv.reference, inv.date, inv.status].join(' ');
    for (var li = 0; li < inv.items.length; li++) {
      searchable += ' ' + (inv.items[li].articleNumber || '') + ' ' + (inv.items[li].description || '');
    }
    if (matchesAll(searchable, terms)) {
      var sm = calcSummary(inv, c);
      results.push({
        type: 'invoice',
        category: 'Invoices',
        icon: '\uD83E\uDDFE',
        title: inv.invoiceNumber,
        subtitle: inv.customerName || 'No customer',
        detail: fmtMoney(sm.grandTotal, c),
        badge: inv.status,
        score: scoreMatch(inv.invoiceNumber, terms, query) + scoreMatch(inv.customerName, terms, query),
        action: { view: 'editor', idx: ii, source: 'invoices' }
      });
    }
  }

  /* ══ Search Purchase Orders ══ */
  for (var pi = 0; pi < state.purchaseOrders.length; pi++) {
    var po = state.purchaseOrders[pi];
    var searchable = [po.poNumber, po.supplierName, po.reference, po.date, po.status].join(' ');
    for (var li = 0; li < po.items.length; li++) {
      searchable += ' ' + (po.items[li].articleNumber || '') + ' ' + (po.items[li].description || '');
    }
    if (matchesAll(searchable, terms)) {
      var sm = calcSummary(po, c);
      results.push({
        type: 'po',
        category: 'Purchase Orders',
        icon: '\uD83D\uDED2',
        title: po.poNumber,
        subtitle: po.supplierName || 'No supplier',
        detail: fmtMoney(sm.grandTotal, c),
        badge: po.status,
        score: scoreMatch(po.poNumber, terms, query) + scoreMatch(po.supplierName, terms, query),
        action: { view: 'editor', idx: pi, source: 'purchaseOrders' }
      });
    }
  }

  /* ══ Search Customers ══ */
  for (var ci = 0; ci < state.customers.length; ci++) {
    var cust = state.customers[ci];
    var searchable = [cust.name, cust.email, cust.phone, cust.city, cust.country, cust.contactPerson].join(' ');
    if (matchesAll(searchable, terms)) {
      results.push({
        type: 'customer',
        category: 'Contacts',
        icon: '\uD83D\uDC64',
        title: cust.name || 'Unnamed',
        subtitle: [cust.city, cust.country].filter(Boolean).join(', ') || 'No location',
        detail: cust.email || cust.phone || '',
        badge: 'customer',
        score: scoreMatch(cust.name, terms, query) + 5,
        action: { view: 'contacts', contactType: 'customer', idx: ci }
      });
    }
  }

  /* ══ Search Suppliers ══ */
  for (var si = 0; si < state.suppliers.length; si++) {
    var sup = state.suppliers[si];
    var searchable = [sup.name, sup.email, sup.phone, sup.city, sup.country, sup.contactPerson].join(' ');
    if (matchesAll(searchable, terms)) {
      results.push({
        type: 'supplier',
        category: 'Contacts',
        icon: '\uD83C\uDFED',
        title: sup.name || 'Unnamed',
        subtitle: [sup.city, sup.country].filter(Boolean).join(', ') || 'No location',
        detail: sup.email || sup.phone || '',
        badge: 'supplier',
        score: scoreMatch(sup.name, terms, query) + 5,
        action: { view: 'contacts', contactType: 'supplier', idx: si }
      });
    }
  }

  /* ══ Search Articles ══ */
  for (var ai = 0; ai < state.articles.length; ai++) {
    var art = state.articles[ai];
    var searchable = [art.articleNumber, art.description, art.specification, art.material, art.category].join(' ');
    if (matchesAll(searchable, terms)) {
      results.push({
        type: 'article',
        category: 'Articles',
        icon: '\uD83D\uDCE6',
        title: art.articleNumber,
        subtitle: art.description || 'No description',
        detail: art.category || '',
        badge: 'article',
        score: scoreMatch(art.articleNumber, terms, query) + scoreMatch(art.description, terms, query),
        action: { view: 'articles', articleIdx: ai }
      });
    }
  }

  /* Sort by score descending, then alphabetically */
  results.sort(function(a, b) {
    if (b.score !== a.score) return b.score - a.score;
    return (a.title || '').localeCompare(b.title || '');
  });

  /* Add highlighted versions */
  for (var ri = 0; ri < results.length; ri++) {
    results[ri].highlightTitle = highlight(results[ri].title, terms);
    results[ri].highlightSubtitle = highlight(results[ri].subtitle, terms);
  }

  /* Cap at 20 results */
  return results.slice(0, 20);
}

/* Group results by category for display */
export function groupResults(results) {
  var groups = {};
  var order = ['Quotes', 'Invoices', 'Purchase Orders', 'Contacts', 'Articles'];
  for (var i = 0; i < results.length; i++) {
    var r = results[i];
    if (!groups[r.category]) groups[r.category] = [];
    groups[r.category].push(r);
  }
  var sorted = [];
  for (var o = 0; o < order.length; o++) {
    if (groups[order[o]]) {
      sorted.push({ name: order[o], items: groups[order[o]] });
    }
  }
  return sorted;
}
