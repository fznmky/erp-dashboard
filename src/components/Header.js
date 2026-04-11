import { state } from '../modules/state.js';
import { esc } from '../modules/utils.js';

export function renderHeader() {
  /* Properly formatted company name */
  var rawName = state.company.name || 'Astratech Solutions';
  /* Title-case the name */
  var cname = rawName.split(' ').map(function(w) {
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }).join(' ');

  /* Back button: Show when not on home */
  var backBtn = '';
  if (state.view !== 'home') {
    backBtn = '<button class="back-btn" id="header-back" title="Go back">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>' +
    '</button>';
  }

  return '<div class="top-header">' +
    '<div class="greeting-box">' +
      backBtn +
      '<div class="greeting-text">' +
        '<h2>' + esc(cname) + '</h2>' +
        '<p id="header-clock"></p>' +
      '</div>' +
    '</div>' +
    '<div class="header-right">' +
      '<div class="search-wrapper" id="search-wrapper">' +
        '<div class="search-bar">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>' +
          '<input type="text" id="global-search" placeholder="Search quotes, invoices, contacts\u2026" autocomplete="off" />' +
          '<kbd class="search-shortcut">Ctrl+K</kbd>' +
        '</div>' +
        '<div class="search-results" id="search-results"></div>' +
      '</div>' +
      '<button class="account-btn" data-nav="settings">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 8.92a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>' +
        'Settings' +
      '</button>' +
    '</div>' +
  '</div>';
}
