import { api } from './api.js';
import { state, setRenderEngine, setState } from './modules/state.js';
import { bindEvents } from './modules/events.js';
import { loadData, emptyArticle, emptyItem } from './modules/utils.js';
import { globalSearch, groupResults } from './modules/search.js';

import { renderSidebar } from './components/Sidebar.js';
import { renderHeader } from './components/Header.js';
import { renderHome } from './components/Home.js';
import { renderDashboard } from './components/Dashboard.js';
import { renderContacts, renderContactModal } from './components/Contacts.js';
import { renderRelationships, renderMapOverlay } from './components/Relationships.js';
import { renderEditor } from './components/Editor.js';
import { renderArticles } from './components/Articles.js';
import { renderSettings } from './components/Settings.js';
import { renderPDFOverlay } from './components/PDFViewer.js';

/* ══════════════════════════════════════
   NAVIGATION HISTORY (for back button)
══════════════════════════════════════ */
var navHistory = [];
var isNavigatingBack = false;

// Patch setState to track nav history
var originalSetState = setState;

/* ══════════════════════════════════════
   RENDER ORCHESTRATOR
══════════════════════════════════════ */
function renderPage() {
  if (state.view === 'home' || (state.view === 'dashboard' && !state.quotes)) return renderHome();
  if (state.view === 'dashboard') return renderDashboard('quotes');
  if (state.view === 'purchaseOrders') return renderDashboard('pos');
  if (state.view === 'invoices') return renderDashboard('invoices');
  if (state.view === 'contacts') return renderContacts();
  if (state.view === 'relationships') return renderRelationships();
  if (state.view === 'editor') return renderEditor();
  if (state.view === 'articles') return renderArticles();
  if (state.view === 'settings') return renderSettings();
  return '';
}

/* ══════════════════════════════════════
   LIVE CLOCK
══════════════════════════════════════ */
var clockInterval = null;
function updateClock() {
  var el = document.getElementById('header-clock');
  if (!el) return;
  var now = new Date();
  var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var h = now.getHours();
  var ampm = h >= 12 ? 'PM' : 'AM';
  var h12 = h % 12 || 12;
  var mm = String(now.getMinutes()).padStart(2, '0');
  var ss = String(now.getSeconds()).padStart(2, '0');
  var dd = String(now.getDate()).padStart(2, '0');
  el.textContent = days[now.getDay()] + ', ' + dd + ' ' + months[now.getMonth()] + ' ' + now.getFullYear() + '  \u2022  ' + h12 + ':' + mm + ':' + ss + ' ' + ampm;
}

function render() {
  // Track navigation history
  if (!isNavigatingBack && navHistory.length > 0) {
    var last = navHistory[navHistory.length - 1];
    if (last !== state.view) {
      navHistory.push(state.view);
    }
  } else if (!isNavigatingBack && navHistory.length === 0) {
    navHistory.push(state.view);
  }
  isNavigatingBack = false;

  var app = document.getElementById('app');
  if (!app) return;
  app.innerHTML = renderSidebar() + '<div class="main-wrapper">' + renderHeader() + '<div class="main">' + renderPage() + '</div></div><div id="context-menu" class="ctx-menu"></div>';
  if (state.showPDF && state.current) app.innerHTML += renderPDFOverlay();
  if (state.showMap && state.current) app.innerHTML += renderMapOverlay();
  if (state.showContactModal) app.innerHTML += renderContactModal();
  bindEvents();
  
  // Sidebar toggle
  var toggleBtn = document.getElementById('sidebar-toggle');
  if (toggleBtn) {
    toggleBtn.onclick = function() {
      state.sidebarExpanded = !state.sidebarExpanded;
      render();
    };
  }

  // Back button
  var backBtn = document.getElementById('header-back');
  if (backBtn) {
    backBtn.onclick = function() {
      if (navHistory.length > 1) {
        isNavigatingBack = true;
        navHistory.pop(); // remove current
        var prev = navHistory[navHistory.length - 1];
        state.view = prev;
        state.current = null;
        state.showPDF = false;
        state.showCatalog = false;
        render();
      } else {
        isNavigatingBack = true;
        state.view = 'home';
        state.current = null;
        state.showPDF = false;
        state.showCatalog = false;
        render();
      }
    };
  }
  
  // Browser back button support
  if (window.history && window.history.pushState) {
    // Only push state if not navigating back
    if (!isNavigatingBack) {
      window.history.pushState({ view: state.view }, '', '');
    }
  }

  // Start clock
  updateClock();
  if (clockInterval) clearInterval(clockInterval);
  clockInterval = setInterval(updateClock, 1000);

  // ═══ GLOBAL SEARCH ═══
  bindGlobalSearch();
}

// Browser back button handler
window.addEventListener('popstate', function(e) {
  if (navHistory.length > 1) {
    isNavigatingBack = true;
    navHistory.pop();
    var prev = navHistory[navHistory.length - 1];
    state.view = prev;
    state.current = null;
    state.showPDF = false;
    state.showCatalog = false;
    render();
  }
});

// Wire the render engine to state and window so event handlers can trigger it
setRenderEngine(render);

/* ══════════════════════════════════════
   GLOBAL SEARCH EVENTS
══════════════════════════════════════ */
function bindGlobalSearch() {
  var input = document.getElementById('global-search');
  var resultsBox = document.getElementById('search-results');
  if (!input || !resultsBox) return;

  var currentResults = [];
  var activeIndex = -1;

  function renderResults(results) {
    if (!results || results.length === 0) {
      resultsBox.innerHTML = '<div class="search-empty">' +
        '<div class="search-empty-icon">\uD83D\uDD0D</div>' +
        'No matching items found' +
      '</div>';
      return;
    }

    var html = '';
    var groups = groupResults(results);
    var flatIndex = 0;

    for (var i = 0; i < groups.length; i++) {
      var g = groups[i];
      html += '<div class="search-category">' + g.name + '</div>';
      for (var j = 0; j < g.items.length; j++) {
        var item = g.items[j];
        item._flatIndex = flatIndex;
        html += '<div class="search-result-item" data-index="' + flatIndex + '">' +
          '<div class="search-result-icon">' + item.icon + '</div>' +
          '<div class="search-result-info">' +
            '<div class="search-result-title">' + item.highlightTitle + '</div>' +
            '<div class="search-result-sub">' + item.highlightSubtitle + '</div>' +
          '</div>' +
          '<div class="search-result-right">' +
            (item.detail ? '<div class="search-result-amount">' + item.detail + '</div>' : '') +
            (item.badge ? '<div class="search-result-badge badge-' + item.badge.toLowerCase() + '">' + item.badge + '</div>' : '') +
          '</div>' +
        '</div>';
        flatIndex++;
      }
    }
    
    html += '<div class="search-footer">' +
      '<span style="display:flex;gap:4px;align-items:center"><kbd>\u2191</kbd><kbd>\u2193</kbd> to navigate</span>' +
      '<span style="display:flex;gap:4px;align-items:center"><kbd>\u21B5</kbd> to select</span>' +
      '<span style="display:flex;gap:4px;align-items:center"><kbd>ESC</kbd> to close</span>' +
    '</div>';

    resultsBox.innerHTML = html;

    // Bind click events
    var items = resultsBox.querySelectorAll('.search-result-item');
    for (var k = 0; k < items.length; k++) {
      items[k].onclick = function() {
        var idx = parseInt(this.getAttribute('data-index'));
        executeSearchAction(currentResults[idx].action);
      };
      items[k].onmouseenter = function() {
        var idx = parseInt(this.getAttribute('data-index'));
        setActiveIndex(idx);
      };
    }
  }

  function setActiveIndex(idx) {
    if (idx < 0) idx = 0;
    if (idx >= currentResults.length) idx = currentResults.length - 1;
    activeIndex = idx;
    var items = resultsBox.querySelectorAll('.search-result-item');
    for (var i = 0; i < items.length; i++) {
      if (i === activeIndex) items[i].classList.add('active');
      else items[i].classList.remove('active');
    }
    if (activeIndex >= 0 && items[activeIndex]) {
      items[activeIndex].scrollIntoView({ block: 'nearest' });
    }
  }

  function executeSearchAction(action) {
    resultsBox.classList.remove('visible');
    input.value = '';
    input.blur();

    if (action.view === 'editor') {
      state.current = state[action.source][action.idx];
      state.editArticle = null;
      setState({ view: 'editor', showCatalog: false });
    } else if (action.view === 'contacts') {
      setState({ view: 'contacts', showContactModal: action.idx });
    } else if (action.view === 'articles') {
      state.editArticle = JSON.parse(JSON.stringify(state.articles[action.articleIdx]));
      setState({ view: 'articles' });
    }
  }

  var debounceTimer;
  input.oninput = function() {
    var query = input.value;
    if (!query) {
      resultsBox.classList.remove('visible');
      return;
    }
    
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function() {
      currentResults = globalSearch(query);
      activeIndex = -1;
      renderResults(currentResults);
      resultsBox.classList.add('visible');
    }, 150);
  };

  input.onkeydown = function(e) {
    if (!resultsBox.classList.contains('visible') && input.value) {
      if (e.key !== 'Escape') {
        resultsBox.classList.add('visible');
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(activeIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(activeIndex - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < currentResults.length) {
        executeSearchAction(currentResults[activeIndex].action);
      }
    } else if (e.key === 'Escape') {
      resultsBox.classList.remove('visible');
      input.blur();
    }
  };

  input.onfocus = function() {
    if (input.value && currentResults.length > 0) {
      resultsBox.classList.add('visible');
    }
  };

  // Close on outside click
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.search-wrapper')) {
      resultsBox.classList.remove('visible');
    }
  });

  // Ctrl+K shortcut
  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      input.focus();
    }
  });
}


/* ══════════════════════════════════════
   INIT
══════════════════════════════════════ */
async function initApp() {
  let localQuotes = loadData('qm_quotes', []);
  let localArticles = loadData('qm_articles', []);

  try {
    const db = await api.getDatabase();
    if (Object.keys(db).length > 0) {
      if (db.quotes) state.quotes = db.quotes;
      if (db.articles) state.articles = db.articles;
      if (db.purchaseOrders) state.purchaseOrders = db.purchaseOrders;
      if (db.invoices) state.invoices = db.invoices;
      if (db.customers) state.customers = db.customers;
      if (db.suppliers) state.suppliers = db.suppliers;
      if (db.company) state.company = db.company;
    } else {
      // First boot: try local storage payload
      state.quotes = localQuotes;
      state.articles = localArticles;
      // Mirror it immediately into the new database structure
      api.saveDatabase({
        quotes: state.quotes, articles: state.articles,
        purchaseOrders: state.purchaseOrders, invoices: state.invoices,
        customers: state.customers, suppliers: state.suppliers, company: state.company
      }).catch(console.warn);
    }
  } catch (err) {
    console.warn('API not reachable, falling back to local storage', err);
    state.quotes = localQuotes;
    state.articles = localArticles;
  }

  if (!state.editArticle) state.editArticle = emptyArticle();
  render();
}

document.addEventListener('DOMContentLoaded', initApp);
// If it's already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(initApp, 1);
}