import { state } from '../modules/state.js';
import { CURRENCIES, TAX_OPTIONS } from '../modules/constants.js';
import { esc } from '../modules/utils.js';

export function renderSettings() {
  var c = state.company;
  var co = '';
  var ckeys = Object.keys(CURRENCIES);
  for (var i = 0; i < ckeys.length; i++) { var k = ckeys[i]; co += '<option value="' + k + '"' + (c.currency === k ? ' selected' : '') + '>' + k + ' \u2014 ' + CURRENCIES[k].name + ' (' + CURRENCIES[k].symbol + ')</option>'; }
  var to = '';
  for (var ti = 0; ti < TAX_OPTIONS.length; ti++) { var t = TAX_OPTIONS[ti]; to += '<option value="' + t.value + '"' + (c.taxRate == t.value ? ' selected' : '') + '>' + t.label + '</option>'; }
  var fields = [['name', 'Company Name'], ['tagline', 'Tagline'], ['street', 'Street / Area'], ['city', 'ZIP / City / Country'], ['phone', 'Phone'], ['email', 'Email'], ['web', 'Website'], ['ceo', 'Contact Person / CEO']];
  var fieldsHtml = '';
  for (var fi = 0; fi < fields.length; fi++) { fieldsHtml += '<div class="field" style="margin-bottom:10px"><label class="label">' + fields[fi][1] + '</label><input class="input" value="' + esc(c[fields[fi][0]]) + '" data-setting="' + fields[fi][0] + '"/></div>'; }
  return '<div class="page-header"><div><div class="page-title">Company Settings</div><div class="page-subtitle">Default values for new quotes</div></div><button class="btn btn-primary" data-action="savesettings">Save Settings</button></div>' +
    '<div class="settings-grid"><div class="form-section"><div class="section-title">Company Details</div>' + fieldsHtml + '</div>' +
    '<div class="form-section"><div class="section-title">Currency &amp; Tax</div>' +
    '<div class="field" style="margin-bottom:10px"><label class="label">Currency</label><select class="input" data-setting="currency">' + co + '</select></div>' +
    '<div class="field" style="margin-bottom:10px"><label class="label">Default Tax Rate</label><select class="input" data-setting="taxRate">' + to + '</select></div>' +
    '<div style="margin-top:20px;padding:14px;background:#F8FAFC;border-radius:4px;font-size:11px;color:var(--text-muted);line-height:1.6"><strong style="color:var(--text)">How it works:</strong><br/>Settings here set defaults for new quotes. Each quote has its own "Your Company" section you can override per-quote. Company info &amp; Notes carry over from last quote.</div>' +
    '</div></div>' +
    '<div class="backup-section"><div class="section-title">Data Backup</div>' +
    '<p style="font-size:12px;color:var(--text-muted);margin-bottom:12px">All data is stored in your browser\'s local storage. Use the buttons below to export a backup file or import data from a backup.</p>' +
    '<div class="btn-group"><button class="btn" data-action="exportdata">\u2B07 Export Backup (JSON)</button><button class="btn" data-action="importdata">\u2B06 Import Backup</button></div>' +
    '<input type="file" id="import-file" accept=".json" style="display:none"/>' +
    '</div>';
}
