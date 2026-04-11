import { DEFAULT_COMPANY } from './constants.js';
import { loadData } from './utils.js';

export const state = {
  view: 'home',
  quotes: [],
  purchaseOrders: [],
  invoices: [],
  customers: [],
  suppliers: [],
  company: loadData('qm_company', DEFAULT_COMPANY),
  categories: loadData('qm_categories', [{key: 'GEN', label: 'General'}]),
  articles: [],
  current: null,
  showPDF: false,
  showMap: false,
  showCatalog: false,
  showContactModal: null,
  editingContact: -1,
  editArticle: null,
  sidebarExpanded: false
};

window.state = state;

// This will be set by main.js to break circular dependency with render()
export let renderEngine = () => {};
export function setRenderEngine(fn) { renderEngine = fn; window.render = fn; }

export function setState(p) {
  for (var k in p) { if (p.hasOwnProperty(k)) state[k] = p[k]; }
  renderEngine();
}
