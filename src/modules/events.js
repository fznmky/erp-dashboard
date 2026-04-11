import { state, setState, renderEngine } from './state.js';
import { api } from '../api.js';
import { emptyQuote, emptyPO, emptyInvoice, emptyItem, emptyArticle, todayStr, getNextQN, getNextPONum, calcSummary, fmtNum, fmtMoney, esc, emptyCustomer, emptySupplier, getNextArticleNum, detectCategory, saveData, loadData } from './utils.js';
import { CURRENCIES, STATUS_MAP } from './constants.js';

export function bindEvents() {
  var els, el, i;
  // Nav
  els = document.querySelectorAll('[data-nav]');
  for (i = 0; i < els.length; i++) { (function (el) { el.onclick = function () { setState({ view: el.dataset.nav, current: null, showPDF: false, showCatalog: false, editArticle: null }); }; })(els[i]); }
  // Actions
  els = document.querySelectorAll('[data-action]');
  for (i = 0; i < els.length; i++) {
    (function (el) {
      el.onclick = function (e) {
        var a = el.dataset.action;
        if (a === 'new') setState({ view: 'editor', current: emptyQuote(state.quotes, state.company), showCatalog: false });
        else if (a === 'newpo') setState({ view: 'editor', current: emptyPO(state.purchaseOrders, state.company), showCatalog: false });
        else if (a === 'newinvoice') setState({ view: 'editor', current: emptyInvoice(state.invoices, state.company), showCatalog: false });
        else if (a === 'convertpo') {
           var base = JSON.parse(JSON.stringify(state.current));
           var po = emptyPO(state.purchaseOrders, state.company);
           po.items = base.items; po.relatedQuoteNumber = base.quoteNumber; po.taxRate = 0; po.reference = 'Quote ' + base.quoteNumber;
           setState({ view: 'editor', current: po, showCatalog: false });
        }
        else if (a === 'convertinv') {
           var base = JSON.parse(JSON.stringify(state.current));
           var inv = emptyInvoice(state.invoices, state.company);
           inv.customerName = base.customerName; inv.customerAddress = base.customerAddress; inv.customerCity = base.customerCity; inv.customerCountry = base.customerCountry;
           inv.customerContactPerson = base.customerContactPerson; inv.customerContactEmail = base.customerContactEmail; inv.customerContactPhone = base.customerContactPhone;
           inv.items = base.items; inv.relatedQuoteNumber = base.quoteNumber; inv.reference = 'Quote ' + base.quoteNumber;
           inv.taxRate = base.taxRate; inv.discount = base.discount; inv.discountPercent = base.discountPercent;
           inv.shippingCost = base.shippingCost; inv.packagingCost = base.packagingCost;
           setState({ view: 'editor', current: inv, showCatalog: false });
        }
        else if (a === 'savecontact') {
           var isPO = !!state.current.poNumber;
           var pref = isPO ? 'supplier' : 'customer';
           var cinfo = {
              id: Date.now(),
              name: state.current[pref+'Name']||'', address: state.current[pref+'Address']||'', city: state.current[pref+'City']||'', country: state.current[pref+'Country']||'',
              contactPerson: state.current[pref+'ContactPerson']||'', email: state.current[pref+'ContactEmail']||'', phone: state.current[pref+'ContactPhone']||''
           };
           if (!cinfo.name) return alert('Name is required to save a contact!');
           if (isPO) { state.suppliers.push(cinfo); saveData('qm_suppliers', state.suppliers); api.saveDatabase(state); }
           else { state.customers.push(cinfo); saveData('qm_customers', state.customers); api.saveDatabase(state); }
           alert('Saved to contacts!');
           renderEngine();
        }
        else if (a === 'cancel') setState({ view: 'dashboard', current: null, showCatalog: false });
        else if (a === 'save') saveCurrentDocument();
        else if (a === 'preview') setState({ showPDF: true, showCatalog: false });
        else if (a === 'closemodal') setState({ showPDF: false });
        else if (a === 'closemap') setState({ showMap: false });
        else if (a === 'closecontactmodal') { state.showContactModal = null; renderEngine(); }
        else if (a === 'printpdf') doPrint();
        else if (a === 'additem') { state.current.items.push(emptyItem()); renderEngine(); }
        else if (a === 'togglecatalog') { state.showCatalog = !state.showCatalog; renderEngine(); }
        else if (a === 'savesettings') saveSettings();
        else if (a === 'saveart') saveArticle();
        else if (a === 'clearart') { state.editArticle = emptyArticle(); renderEngine(); }
        else if (a === 'exportdata') exportData();
        else if (a === 'importdata') document.getElementById('import-file').click();
        else if (a === 'back') { setState({ view: 'home', current: null, showCatalog: false }); }
      };
    })(els[i]);
  }
  // Link to Quote dropdown for POs/Invoices
  els = document.querySelectorAll('[data-action="linkquote"]');
  for (i = 0; i < els.length; i++) { (function (el) { el.onchange = function () {
    if (state.current) {
      state.current.relatedQuoteNumber = el.value;
      state.current.reference = el.value ? 'Quote ' + el.value : '';
      renderEngine();
    }
  }; })(els[i]); }
  // Import file
  el = document.getElementById('import-file');
  if (el) el.onchange = importData;
  // Modal close
  els = document.querySelectorAll('.overlay[data-action="closemodal"]');
  for (i = 0; i < els.length; i++) { (function (el) { el.onclick = function (e) { if (e.target === el) setState({ showPDF: false }); }; })(els[i]); }
  els = document.querySelectorAll('.overlay[data-action="closemap"]');
  for (i = 0; i < els.length; i++) { (function (el) { el.onclick = function (e) { if (e.target === el) setState({ showMap: false }); }; })(els[i]); }
  els = document.querySelectorAll('.overlay[data-action="closecontactmodal"]');
  for (i = 0; i < els.length; i++) { (function (el) { el.onclick = function (e) { if (e.target === el) { state.showContactModal = null; renderEngine(); } }; })(els[i]); }

  // Pick contact
  els = document.querySelectorAll('[data-action="pickcontact"]');
  for (i = 0; i < els.length; i++) { (function (el) { el.onchange = function () { 
     var idx = parseInt(el.value);
     if (isNaN(idx)) return;
     var isPO = !!state.current.poNumber;
     var pref = isPO ? 'supplier' : 'customer';
     var arr = isPO ? state.suppliers : state.customers;
     var cinfo = arr[idx];
     if (cinfo) {
        state.current[pref+'Name'] = cinfo.name; state.current[pref+'Address'] = cinfo.address; state.current[pref+'City'] = cinfo.city; state.current[pref+'Country'] = cinfo.country;
        state.current[pref+'ContactPerson'] = cinfo.contactPerson; state.current[pref+'ContactEmail'] = cinfo.email; state.current[pref+'ContactPhone'] = cinfo.phone;
        renderEngine();
     }
  }; })(els[i]); }
  // Dashboard actions map bindings
  els = document.querySelectorAll('[data-opencontact]');
  for(i=0; i<els.length; i++) { (function(el) { el.onclick = function(e){
     e.stopPropagation();
     var arr = el.dataset.opencontact.split('-');
     state.showContactModal = arr[0];
     state.editingContact = parseInt(arr[1]);
     renderEngine();
  }; })(els[i]); }

  els = document.querySelectorAll('[data-mapopen]');
  for(i=0; i<els.length; i++) { (function(el) { el.onclick = function(e){
     e.stopPropagation();
     var parts = el.dataset.mapopen.split('-');
     var tg=null;
     if (parts[0]==='quote') tg = state.quotes[parseInt(parts[1])];
     if (parts[0]==='po') tg = state.purchaseOrders[parseInt(parts[1])];
     if (parts[0]==='inv') tg = state.invoices[parseInt(parts[1])];
     setState({view:'editor', current:JSON.parse(JSON.stringify(tg)), showCatalog:false});
  }; })(els[i]); }
  
  els = document.querySelectorAll('[data-showmap]');
  for(i=0; i<els.length; i++) { (function(el) { el.onclick = function(e){
     e.stopPropagation();
     var parts = el.dataset.showmap.split('-');
     var tType = parts[0], tIdx = parseInt(parts[1]);
     if (!parts[1]) { tType = 'quote'; tIdx = parseInt(parts[0]); }
     var tgt = state.quotes[tIdx];
     if (tType === 'po') { var rp = state.purchaseOrders[tIdx].relatedQuoteNumber; tgt = state.quotes.find(function(q){return q.quoteNumber===rp;}); }
     if (tType === 'inv') { var ri = state.invoices[tIdx].relatedQuoteNumber; tgt = state.quotes.find(function(q){return q.quoteNumber===ri;}); }
     if (tgt) setState({showMap:true, current:tgt});
     else alert('Cannot generate Relationship Map: No master Quote linked.');
  }; })(els[i]); }
  els = document.querySelectorAll('[data-createpo]');
  for(i=0; i<els.length; i++) { (function(el) { el.onclick = function(e){e.stopPropagation();var base = state.quotes[parseInt(el.dataset.createpo)]; var po = emptyPO(state.purchaseOrders, state.company); po.items=base.items; po.relatedQuoteNumber=base.quoteNumber; po.taxRate=0; po.reference='Quote '+base.quoteNumber; setState({view:'editor',current:po,showCatalog:false});}; })(els[i]); }
  els = document.querySelectorAll('[data-createinv]');
  for(i=0; i<els.length; i++) { (function(el) { el.onclick = function(e){e.stopPropagation();var base = state.quotes[parseInt(el.dataset.createinv)]; var inv = emptyInvoice(state.invoices, state.company); Object.assign(inv, {customerName:base.customerName, customerAddress:base.customerAddress, customerCity:base.customerCity, customerCountry:base.customerCountry, customerContactPerson:base.customerContactPerson, customerContactEmail:base.customerContactEmail, customerContactPhone:base.customerContactPhone, items:base.items, relatedQuoteNumber:base.quoteNumber, reference:'Quote '+base.quoteNumber, taxRate:base.taxRate, discount:base.discount, discountPercent:base.discountPercent, shippingCost:base.shippingCost, packagingCost:base.packagingCost}); setState({view:'editor',current:inv,showCatalog:false});}; })(els[i]); }

  els = document.querySelectorAll('[data-buttonedit]');
  for(i=0; i<els.length; i++) { (function(el) { el.onclick = function(e){
     e.stopPropagation();
     var parts = el.dataset.buttonedit.split('-');
     var tType = parts[0], tIdx = parseInt(parts[1]);
     var tg = null;
     if (tType === 'quotes') tg = state.quotes[tIdx];
     else if (tType === 'pos') tg = state.purchaseOrders[tIdx];
     else if (tType === 'invoices') tg = state.invoices[tIdx];
     setState({view:'editor', current:JSON.parse(JSON.stringify(tg)), showCatalog:false});
  }; })(els[i]); }

  els = document.querySelectorAll('[data-statustoggle]');
  for(i=0; i<els.length; i++) { (function(el) { el.onchange = function(e){
     e.stopPropagation();
     var p = el.dataset.statustoggle.split('-');
     var type = p[0], idx = parseInt(p[1]);
     var arr = type === 'quotes' ? state.quotes : (type === 'invoices' ? state.invoices : state.purchaseOrders);
     if (arr[idx]) {
        arr[idx].status = el.value;
        var sn = type === 'quotes' ? 'qm_quotes' : (type === 'invoices' ? 'qm_invoices' : 'qm_pos');
        saveData(sn, arr);
        if (typeof window !== 'undefined' && api) {
            if (type === 'quotes') api.saveDatabase(state);
            else if (type === 'pos') api.saveDatabase(state);
            else if (type === 'invoices') api.saveDatabase(state);
        }
        renderEngine();
     }
  }; })(els[i]); }

  // Dashboard rows - Double click to edit
  els = document.querySelectorAll('[data-edit]');
  for (i = 0; i < els.length; i++) { (function (el) { el.onclick=function(e){e.stopPropagation();}; el.ondblclick = function (e) { e.stopPropagation(); document.getSelection().removeAllRanges(); setState({ view: 'editor', current: JSON.parse(JSON.stringify(state.quotes[parseInt(el.dataset.edit)])), showCatalog: false }); }; })(els[i]); }
  els = document.querySelectorAll('[data-editpo]');
  for (i = 0; i < els.length; i++) { (function (el) { el.onclick=function(e){e.stopPropagation();}; el.ondblclick = function (e) { e.stopPropagation(); document.getSelection().removeAllRanges(); setState({ view: 'editor', current: JSON.parse(JSON.stringify(state.purchaseOrders[parseInt(el.dataset.editpo)])), showCatalog: false }); }; })(els[i]); }
  els = document.querySelectorAll('[data-editinvoice]');
  for (i = 0; i < els.length; i++) { (function (el) { el.onclick=function(e){e.stopPropagation();}; el.ondblclick = function (e) { e.stopPropagation(); document.getSelection().removeAllRanges(); setState({ view: 'editor', current: JSON.parse(JSON.stringify(state.invoices[parseInt(el.dataset.editinvoice)])), showCatalog: false }); }; })(els[i]); }

  els = document.querySelectorAll('[data-dup]');
  for (i = 0; i < els.length; i++) { (function (el) { el.onclick = function (e) { e.stopPropagation(); var o = state.quotes[parseInt(el.dataset.dup)]; var d = JSON.parse(JSON.stringify(o)); d.id = Date.now(); d.quoteNumber = getNextQN(state.quotes); d.date = todayStr(); d.status = 'draft'; setState({ view: 'editor', current: d, showCatalog: false }); }; })(els[i]); }
  els = document.querySelectorAll('[data-del]');
  for (i = 0; i < els.length; i++) { (function (el) { el.onclick = function (e) { 
    e.stopPropagation();
    var parts = el.dataset.del.split('-'); var t = parts[0]; var idx = parseInt(parts[1]);
    window.customConfirm('Delete this document?', function() { 
      if (t === 'quotes') { state.quotes.splice(idx, 1); saveData('qm_quotes', state.quotes); }
      else if (t === 'pos') { state.purchaseOrders.splice(idx, 1); saveData('qm_pos', state.purchaseOrders); }
      else if (t === 'invoices') { state.invoices.splice(idx, 1); saveData('qm_invoices', state.invoices); }
      if (typeof window !== 'undefined' && api) { api.saveDatabase(state); }
      renderEngine(); 
    }); 
  }; })(els[i]); }

  // Context menu
  document.body.onclick = function() {
    var menu = document.getElementById('context-menu');
    if (menu) menu.style.display = 'none';
  };
  
  els = document.querySelectorAll('[data-contextmenu]');
  for(i=0; i<els.length; i++) { (function(el) { el.oncontextmenu = function(e) {
     e.preventDefault();
     var parts = el.dataset.contextmenu.split('-');
     var t = parts[0], idx = parseInt(parts[1]);
     var menu = document.getElementById('context-menu');
     if (!menu) return;
     
     var html = '';
     if (t === 'quotes') {
        var qt = state.quotes[idx];
        var pos = state.purchaseOrders.filter(function(p){return p.relatedQuoteNumber === qt.quoteNumber;});
        var invs = state.invoices.filter(function(inv){return inv.relatedQuoteNumber === qt.quoteNumber;});
        
        html += '<div class="ctx-item" data-edit="'+idx+'">Edit Quote</div>';
        html += '<div style="height:1px;background:var(--border);margin:4px 0"></div>';
        html += '<div class="ctx-item" data-showmap="'+idx+'" style="color:#0284c7;font-weight:500;">View Relationship Map</div>';
        html += '<div style="height:1px;background:var(--border);margin:4px 0"></div>';

        html += '<div class="ctx-item" data-createpo="'+idx+'"><b>+ Create Purchase Order</b></div>';
        for(var p=0; p<pos.length; p++) {
           var poIdx = state.purchaseOrders.indexOf(pos[p]);
           html += '<div class="ctx-item" data-mapopen="po-'+poIdx+'">Open PO '+esc(pos[p].poNumber)+'</div>';
        }
        
        html += '<div style="height:1px;background:var(--border);margin:4px 0"></div>';
        html += '<div class="ctx-item" data-createinv="'+idx+'"><b>+ Create Invoice</b></div>';
        for(var p=0; p<invs.length; p++) {
           var invIdx = state.invoices.indexOf(invs[p]);
           html += '<div class="ctx-item" data-mapopen="inv-'+invIdx+'">Open Invoice '+esc(invs[p].invoiceNumber)+'</div>';
        }
        
        html += '<div class="ctx-item ctx-danger" data-del="quotes-'+idx+'">Delete Quote</div>';
     } else if (t === 'pos') {
        html += '<div class="ctx-item" data-editpo="'+idx+'">Edit Purchase Order</div>';
        html += '<div style="height:1px;background:var(--border);margin:4px 0"></div>';
        html += '<div class="ctx-item" data-showmap="po-'+idx+'" style="color:#0284c7;font-weight:500;">View Relationship Map</div>';
        html += '<div style="height:1px;background:var(--border);margin:4px 0"></div>';
        html += '<div class="ctx-item ctx-danger" data-del="pos-'+idx+'">Delete PO</div>';
     } else if (t === 'invoices') {
        html += '<div class="ctx-item" data-editinvoice="'+idx+'">Edit Invoice</div>';
        html += '<div style="height:1px;background:var(--border);margin:4px 0"></div>';
        html += '<div class="ctx-item" data-showmap="inv-'+idx+'" style="color:#0284c7;font-weight:500;">View Relationship Map</div>';
        html += '<div style="height:1px;background:var(--border);margin:4px 0"></div>';
        html += '<div class="ctx-item ctx-danger" data-del="invoices-'+idx+'">Delete Invoice</div>';
     } else if (t === 'customer') {
        html += '<div class="ctx-item" data-editcontact="customer-'+idx+'">Edit Profile</div>';
        html += '<div style="height:1px;background:var(--border);margin:4px 0"></div>';
        html += '<div class="ctx-item ctx-danger" data-del="customers-'+idx+'">Delete Customer</div>';
     } else if (t === 'supplier') {
        html += '<div class="ctx-item" data-editcontact="supplier-'+idx+'">Edit Profile</div>';
        html += '<div style="height:1px;background:var(--border);margin:4px 0"></div>';
        html += '<div class="ctx-item ctx-danger" data-del="suppliers-'+idx+'">Delete Supplier</div>';
     }
     
     menu.innerHTML = html;
     menu.style.display = 'block';
     menu.style.left = e.pageX + 'px';
     menu.style.top = e.pageY + 'px';
     
     // Bind context menu items
     var items = menu.querySelectorAll('.ctx-item');
     for (var j=0; j<items.length; j++) {
        items[j].onclick = function(ev) {
           var ds = this.dataset;
           if (ds.edit) setState({ view: 'editor', current: JSON.parse(JSON.stringify(state.quotes[parseInt(ds.edit)])), showCatalog: false });
           else if (ds.editpo) setState({ view: 'editor', current: JSON.parse(JSON.stringify(state.purchaseOrders[parseInt(ds.editpo)])), showCatalog: false });
           else if (ds.editinvoice) setState({ view: 'editor', current: JSON.parse(JSON.stringify(state.invoices[parseInt(ds.editinvoice)])), showCatalog: false });
           else if (ds.editcontact) {
               var p = ds.editcontact.split('-');
               setState({ showContactModal: p[0], editingContact: parseInt(p[1]) });
           }
           else if (ds.showmap) {
               var parts = ds.showmap.split('-');
               var tType = parts[0], tIdx = parseInt(parts[1]);
               if (!parts[1]) { tType = 'quote'; tIdx = parseInt(parts[0]); }
               var tgt = state.quotes[tIdx];
               if (tType === 'po') { var rp = state.purchaseOrders[tIdx].relatedQuoteNumber; tgt = state.quotes.find(function(q){return q.quoteNumber===rp;}); }
               if (tType === 'inv') { var ri = state.invoices[tIdx].relatedQuoteNumber; tgt = state.quotes.find(function(q){return q.quoteNumber===ri;}); }
               if (tgt) setState({showMap:true, current:JSON.parse(JSON.stringify(tgt))});
               else alert('Cannot generate Relationship Map: No master Quote linked.');
           }
           else if (ds.mapopen) {
               var parts = ds.mapopen.split('-');
               var tg=null;
               if (parts[0]==='quote') tg = state.quotes[parseInt(parts[1])];
               else if (parts[0]==='po') tg = state.purchaseOrders[parseInt(parts[1])];
               else if (parts[0]==='inv') tg = state.invoices[parseInt(parts[1])];
               setState({view:'editor', current:JSON.parse(JSON.stringify(tg)), showCatalog:false});
           }
           else if (ds.createpo) {
              var base = state.quotes[parseInt(ds.createpo)]; var po = emptyPO(state.purchaseOrders, state.company); po.items = base.items; po.relatedQuoteNumber = base.quoteNumber; po.taxRate = 0; po.reference = 'Quote ' + base.quoteNumber; setState({ view: 'editor', current: po, showCatalog: false });
           }
           else if (ds.createinv) {
              var base = state.quotes[parseInt(ds.createinv)]; var inv = emptyInvoice(state.invoices, state.company); Object.assign(inv, {customerName:base.customerName, customerAddress:base.customerAddress, customerCity:base.customerCity, customerCountry:base.customerCountry, customerContactPerson:base.customerContactPerson, customerContactEmail:base.customerContactEmail, customerContactPhone:base.customerContactPhone, items:base.items, relatedQuoteNumber:base.quoteNumber, reference:'Quote '+base.quoteNumber, taxRate:base.taxRate, discount:base.discount, discountPercent:base.discountPercent, shippingCost:base.shippingCost, packagingCost:base.packagingCost}); setState({ view: 'editor', current: inv, showCatalog: false });
           }
           else if (ds.del) {
               var dp = ds.del.split('-'); var tType = dp[0]; var tIdx = parseInt(dp[1]);
               window.customConfirm('Delete this profile or document permanently?', function() { 
                 if (tType === 'quotes') { state.quotes.splice(tIdx, 1); saveData('qm_quotes', state.quotes); }
                 else if (tType === 'pos') { state.purchaseOrders.splice(tIdx, 1); saveData('qm_pos', state.purchaseOrders); }
                 else if (tType === 'invoices') { state.invoices.splice(tIdx, 1); saveData('qm_invoices', state.invoices); }
                 else if (tType === 'customers') { state.customers.splice(tIdx, 1); saveData('qm_customers', state.customers); }
                 else if (tType === 'suppliers') { state.suppliers.splice(tIdx, 1); saveData('qm_suppliers', state.suppliers); }
                 if (api) { api.saveDatabase(state); }
                 renderEngine(); 
               });
           }
        };
     }
  }; })(els[i]); }
  // Editor fields
  els = document.querySelectorAll('[data-field]');
  for (i = 0; i < els.length; i++) { (function (el) { if (!state.current) return; var h = function () { state.current[el.dataset.field] = el.value; if (el.dataset.field === 'shippingCost' || el.dataset.field === 'packagingCost' || el.dataset.field === 'discount' || el.dataset.field === 'discountPercent' || el.dataset.field === 'taxRatePercent') updateSummary(); }; el.oninput = h; el.onchange = h; })(els[i]); }
  els = document.querySelectorAll('[data-item]');
  for (i = 0; i < els.length; i++) { (function (el) { el.oninput = function () { var idx = parseInt(el.dataset.item); state.current.items[idx][el.dataset.field] = el.value; updateItemTotal(idx); updateSummary(); if (el.tagName === 'TEXTAREA') { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }; if (el.tagName === 'TEXTAREA') { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; el.style.overflow = 'hidden'; } })(els[i]); }
  els = document.querySelectorAll('[data-rmitem]');
  for (i = 0; i < els.length; i++) { (function (el) { el.onclick = function () { if (state.current.items.length > 1) { state.current.items.splice(parseInt(el.dataset.rmitem), 1); renderEngine(); } }; })(els[i]); }
  // Settings
  els = document.querySelectorAll('[data-setting]');
  for (i = 0; i < els.length; i++) { (function (el) { var h = function () { var k = el.dataset.setting; state.company[k] = k === 'taxRate' ? parseFloat(el.value) : el.value; }; el.oninput = h; el.onchange = h; })(els[i]); }
  // Currency in editor
  els = document.querySelectorAll('[data-currencychange]');
  for (i = 0; i < els.length; i++) { (function (el) { el.onchange = function () { state.company.currency = el.value; saveData('qm_company', state.company); renderEngine(); }; })(els[i]); }
  // Dashboard filters
  els = document.querySelectorAll('[data-filter]');
  for (i = 0; i < els.length; i++) { els[i].oninput = applyDashboardFilters; els[i].onchange = applyDashboardFilters; }
  // Article form
  els = document.querySelectorAll('[data-artfield]');
  for (i = 0; i < els.length; i++) {
    (function (el) {
      if (!state.editArticle) state.editArticle = emptyArticle();
      var h = function () {
        state.editArticle[el.dataset.artfield] = el.value;
        if (el.dataset.artfield === 'category' && !state.editArticle._manualNum) {
          state.editArticle.articleNumber = getNextArticleNum(state.articles, el.value);
          var numInput = document.querySelector('[data-artfield="articleNumber"]');
          if (numInput) numInput.value = state.editArticle.articleNumber;
        }
      };
      el.oninput = h; el.onchange = h;
      if (el.dataset.artfield === 'articleNumber') { el.oninput = function () { state.editArticle.articleNumber = el.value; state.editArticle._manualNum = true; }; }
    })(els[i]);
  }
  // Auto-gen article num
  if (state.view === 'articles' && state.editArticle && !state.editArticle.articleNumber) {
    state.editArticle.articleNumber = getNextArticleNum(state.articles, state.editArticle.category || 'GEN');
    el = document.querySelector('[data-artfield="articleNumber"]');
    if (el) el.value = state.editArticle.articleNumber;
  }
  // Edit/delete article
  els = document.querySelectorAll('[data-editart]');
  for (i = 0; i < els.length; i++) { (function (el) { el.onclick = function () { state.editArticle = JSON.parse(JSON.stringify(state.articles[parseInt(el.dataset.editart)])); renderEngine(); }; })(els[i]); }
  els = document.querySelectorAll('[data-delart]');
  for (i = 0; i < els.length; i++) { (function (el) { el.onclick = function () { window.customConfirm('Delete this article?', function() { state.articles.splice(parseInt(el.dataset.delart), 1); saveData('qm_articles', state.articles); renderEngine(); }); }; })(els[i]); }
  // Pick from catalog
  els = document.querySelectorAll('[data-pickart]');
  for (i = 0; i < els.length; i++) {
    (function (el) {
      el.onclick = function () {
        var a = state.articles[parseInt(el.dataset.pickart)];
        if (a && state.current) {
          var newItem = emptyItem();
          newItem.articleNumber = a.articleNumber;
          newItem.description = a.description;
          newItem.material = a.material || '';
          newItem.specification = a.specification || '';
          newItem.ve = a.packSize || '1';
          newItem.unitPrice = a.defaultPrice || '';
          state.current.items.push(newItem);
          state.showCatalog = false;
          renderEngine();
        }
      };
    })(els[i]);
  }
}

export function applyDashboardFilters() {
  var rows = document.querySelectorAll('.data-table tbody tr[data-fqn]');
  var fqEl = document.querySelector('[data-filter="quote"]');
  var fcEl = document.querySelector('[data-filter="customer"]');
  var fdEl = document.querySelector('[data-filter="date"]');
  var fsEl = document.querySelector('[data-filter="status"]');
  var fq = fqEl ? fqEl.value : '';
  var fc = fcEl ? fcEl.value : '';
  var fd = fdEl ? fdEl.value : '';
  var fs = fsEl ? fsEl.value : '';
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var show = true;
    if (fq && r.dataset.fqn.indexOf(fq.toLowerCase()) === -1) show = false;
    if (fc && r.dataset.fcust.indexOf(fc.toLowerCase()) === -1) show = false;
    if (fd && r.dataset.fdate.indexOf(fd) === -1) show = false;
    if (fs && r.dataset.fstatus !== fs) show = false;
    r.style.display = show ? '' : 'none';
  }
}

function updateItemTotal(i) {
  var it = state.current.items[i];
  var r = document.querySelectorAll('.items-tbl tbody tr')[i];
  if (r) { var tc = r.querySelector('.itm-total'); if (tc) { var cur = CURRENCIES[state.company.currency] || CURRENCIES.EUR; tc.textContent = fmtNum(itemTotal(it), state.company) + ' ' + cur.symbol; } }
}
function updateSummary() {
  var sm = calcSummary(state.current, state.company); var c = state.company;
  var dp = document.querySelector('[data-field="discountPercent"]');
  var da = document.querySelector('[data-field="discount"]');
  var tpEl = document.querySelector('[data-field="taxRatePercent"]');
  
  if (document.activeElement === tpEl) {
    state.current.taxRate = (parseFloat(tpEl.value)||0) / 100;
    sm = calcSummary(state.current, c); // Re-calc with new tax
  }
  
  if (document.activeElement === dp) {
    state.current.discount = (sm.subtotal * (parseFloat(dp.value)||0) / 100).toFixed(2);
    if (da) da.value = state.current.discount;
    sm = calcSummary(state.current, c); // Re-calc with new discount
  } else if (document.activeElement === da) {
    state.current.discountPercent = sm.subtotal > 0 ? ((parseFloat(da.value)||0) / sm.subtotal * 100).toFixed(2) : '0';
    if (dp) dp.value = state.current.discountPercent;
  } else if (dp && da) {
    state.current.discount = (sm.subtotal * (parseFloat(state.current.discountPercent)||0) / 100).toFixed(2);
    da.value = state.current.discount;
    sm = calcSummary(state.current, c); // Re-calc
  }

  var rows = document.querySelectorAll('.sum-row');
  if (rows.length >= 6) { 
    rows[0].querySelector('.mono').textContent = fmtMoney(sm.subtotal, c); 
    var ta = document.querySelector('[data-calc="taxAmount"]');
    if (ta) ta.textContent = fmtMoney(sm.taxAmount, c);
    else rows[4].querySelector('.mono').textContent = fmtMoney(sm.taxAmount, c); // Fallback
    rows[5].querySelector('.mono').textContent = fmtMoney(sm.grandTotal, c); 
  }
}

async function saveCurrentDocument() {
  var doc = state.current;
  var type = 'dashboard';
  var arr = state.quotes;
  if (doc.poNumber) { type = 'purchaseOrders'; arr = state.purchaseOrders; }
  else if (doc.invoiceNumber) { type = 'invoices'; arr = state.invoices; }

  for (var ai = 0; ai < doc.items.length; ai++) {
    var it = doc.items[ai];
    if (it.articleNumber && it.description) {
      var exists = false;
      for (var ei = 0; ei < state.articles.length; ei++) { if (state.articles[ei].articleNumber === it.articleNumber) { exists = true; break; } }
      if (!exists) {
        const newArt = {
          id: Date.now() + Math.random(),
          articleNumber: it.articleNumber,
          description: it.description,
          specification: it.specification || '',
          category: detectCategory(it.articleNumber),
          material: it.material || '',
          packSize: it.ve || '1',
          defaultPrice: it.unitPrice || ''
        };
        state.articles.push(newArt);
        saveData('qm_articles', state.articles);
        api.saveDatabase(state);
      }
    }
  }
  var idx = -1;
  for (var i = 0; i < arr.length; i++) { if (arr[i].id === doc.id) { idx = i; break; } }
  if (idx >= 0) arr[idx] = doc; else arr.unshift(doc);
  
  if (type === 'dashboard') saveData('qm_quotes', arr);
  else if (type === 'purchaseOrders') saveData('qm_pos', arr);
  else if (type === 'invoices') saveData('qm_invoices', arr);
  
  try {
    if (type === 'dashboard') await api.saveDatabase(state);
    else if (type === 'purchaseOrders') await api.saveDatabase(state);
    else if (type === 'invoices') await api.saveDatabase(state);
  } catch (err) { console.error('Failed to save to local API', err); }
  
  setState({ view: type, current: null, showCatalog: false });
}

function saveSettings() { saveData('qm_company', state.company); alert('Settings saved!'); renderEngine(); }

async function saveArticle() {
  if (!state.editArticle) return;
  var a = state.editArticle;
  if (!a.articleNumber) a.articleNumber = getNextArticleNum(state.articles, a.category || 'GEN');
  if (!a.description) { alert('Please enter a description.'); return; }
  var idx = -1;
  for (var i = 0; i < state.articles.length; i++) { if (state.articles[i].id === a.id) { idx = i; break; } }
  if (idx >= 0) state.articles[idx] = a;
  else { a.id = Date.now(); state.articles.push(a); }
  saveData('qm_articles', state.articles); // local fallback
  try { await api.saveDatabase(state); } catch (err) { console.error('Failed to save article to API', err); }
  state.editArticle = emptyArticle();
  renderEngine();
}

function exportData() {
  var data = { _format: 'astratech-quote-manager-backup', _version: 1, _exportedAt: new Date().toISOString(), company: state.company, quotes: state.quotes, articles: state.articles, purchaseOrders: state.purchaseOrders, invoices: state.invoices, customers: state.customers, suppliers: state.suppliers };
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a'); a.href = url; a.download = 'astratech-erp-backup_' + todayStr() + '.json'; a.click(); URL.revokeObjectURL(url);
}

function importData(e) {
  var file = e.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function (ev) {
    try {
      var data = JSON.parse(ev.target.result);
      if (data._format === 'astratech-quote-manager-backup') {
        window.customConfirm('This will replace ALL current data with the backup. Continue?', function() {
          if (data.company) { state.company = data.company; saveData('qm_company', data.company); }
          if (data.quotes) { state.quotes = data.quotes; saveData('qm_quotes', data.quotes); }
          if (data.articles) { state.articles = data.articles; saveData('qm_articles', data.articles); }
          if (data.purchaseOrders) { state.purchaseOrders = data.purchaseOrders; saveData('qm_pos', data.purchaseOrders); }
          if (data.invoices) { state.invoices = data.invoices; saveData('qm_invoices', data.invoices); }
          if (data.customers) { state.customers = data.customers; saveData('qm_customers', data.customers); }
          if (data.suppliers) { state.suppliers = data.suppliers; saveData('qm_suppliers', data.suppliers); }
          alert('Full backup restored successfully!');
          renderEngine();
        });
      } else if (data.quoteNumber) {
        var qIdx = -1; for (var qi = 0; qi < state.quotes.length; qi++) { if (state.quotes[qi].id === data.id) { qIdx = qi; break; } }
        if (qIdx >= 0) { state.quotes[qIdx] = data; } else { state.quotes.unshift(data); }
        saveData('qm_quotes', state.quotes); alert('Quote ' + data.quoteNumber + ' imported successfully!');
      } else if (data.articleNumber) {
        var aIdx = -1; for (var ai = 0; ai < state.articles.length; ai++) { if (state.articles[ai].id === data.id) { aIdx = ai; break; } }
        if (aIdx >= 0) { state.articles[aIdx] = data; } else { state.articles.push(data); }
        saveData('qm_articles', state.articles); alert('Article ' + data.articleNumber + ' imported successfully!');
      } else { alert('Unrecognized file format.'); return; }
      renderEngine();
    } catch (err) { alert('Error reading file: ' + err.message); }
  };
  reader.readAsText(file);
  e.target.value = '';
}

function doPrint() {
  var el = document.getElementById('pdf-content'); if (!el) return;
  var now = new Date(); var dd = String(now.getDate()).padStart(2, '0'); var mm = String(now.getMonth() + 1).padStart(2, '0'); var yyyy = now.getFullYear();
  var fn = state.current.quoteNumber || state.current.poNumber || state.current.invoiceNumber || 'Document';
  var fileName = fn + '_' + dd + '-' + mm + '-' + yyyy + '.pdf';
  
  if (typeof window !== 'undefined' && window.html2pdf && window.api) {
      var opt = { margin: 0, filename: fileName, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
      window.html2pdf().set(opt).from(el).outputPdf('datauristring').then(function(pdfBase64) {
          var docType = state.current.poNumber ? 'pos' : (state.current.invoiceNumber ? 'invoices' : 'quotes');
          window.api.savePDF(docType, fileName, pdfBase64).catch(console.error);
      });
  }

  var w = window.open('', '_blank');
  var hdr = '';
  var styles = document.querySelectorAll('style'); for(var i=0; i<styles.length; i++) hdr += styles[i].outerHTML;
  var links = document.querySelectorAll('link[rel="stylesheet"]'); for(var i=0; i<links.length; i++) hdr += links[i].outerHTML;
  w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>' + fn + '</title><link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>' + hdr + '<style>*{margin:0;padding:0;box-sizing:border-box}:root{--primary:#0F172A;--mono:"JetBrains Mono",monospace;--font:"Roboto",sans-serif}html,body{height:100%;font-family:var(--font);-webkit-font-smoothing:antialiased}.pdf{min-height:100%;height:auto;padding:0;width:auto}@page{margin:12mm 10mm;size:A4}</style></head><body>' + el.outerHTML + '</body></html>');
  w.document.close();
  setTimeout(function () { w.print(); }, 600);
}

window.uploadAttachments = async function(e) {
  var fileObj = e.target.files;
  if (!fileObj || fileObj.length === 0) return;
  var q, docType, docNum;
  if (state.showContactModal) {
     if (state.editingContact === -1) {
        state.editingContact = state.showContactModal === 'customer' ? state.customers.length : state.suppliers.length;
        var newC = state.showContactModal === 'customer' ? emptyCustomer() : emptySupplier();
        newC.attachments = [];
        if (state.showContactModal === 'customer') state.customers.push(newC); else state.suppliers.push(newC);
     }
     q = state.showContactModal === 'customer' ? state.customers[state.editingContact] : state.suppliers[state.editingContact];
     docType = state.showContactModal === 'customer' ? 'customers' : 'suppliers';
     docNum = q.id;
  } else {
     if (!state.current) return;
     q = state.current;
     docType = q.poNumber ? 'purchaseOrders' : (q.invoiceNumber ? 'invoices' : 'quotes');
     docNum = q.quoteNumber || q.poNumber || q.invoiceNumber;
  }
  if (!q.attachments) q.attachments = [];
  
  for(var i=0; i<fileObj.length; i++) {
     let file = fileObj[i]; let reader = new FileReader();
     reader.onload = async function(e) {
         try {
            let res = await fetch('/api/upload-attachment', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ docType: docType, docNumber: docNum, filename: file.name, fileData: e.target.result }) });
            let data = await res.json();
            if (data.success) { q.attachments.push({ name: file.name, url: data.url }); renderEngine(); } else alert('Failed to upload file: ' + data.error);
         } catch(err) { console.error('Upload Error', err); alert(err.message); }
     };
     reader.readAsDataURL(file);
  }
};

window.saveContactModal = async function() {
   var type = state.showContactModal;
   var idx = state.editingContact;
   var list = type === 'customer' ? state.customers : state.suppliers;
   var tgt = idx >= 0 ? list[idx] : {};
   tgt.name = document.getElementById('cModalName').value; tgt.address = document.getElementById('cModalAddr').value; tgt.city = document.getElementById('cModalCity').value; tgt.country = document.getElementById('cModalCountry').value; tgt.contactPerson = document.getElementById('cModalContact').value; tgt.email = document.getElementById('cModalEmail').value; tgt.phone = document.getElementById('cModalPhone').value;
   if (!tgt.name) { alert("Company / Name is exceptionally required."); return; }
   if (idx === -1) { tgt.id = Date.now(); list.push(tgt); }
   saveData(type === 'customer' ? 'qm_customers' : 'qm_suppliers', list);
   try { if (type === 'customer') await api.saveDatabase(state); else await api.saveDatabase(state); } catch(err) { console.error("Failed to sync backend Contact", err); }
   state.showContactModal = null;
   renderEngine();
};
