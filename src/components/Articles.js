import { state } from '../modules/state.js';
import { CURRENCIES } from '../modules/constants.js';
import { emptyArticle, esc, fmtNum, pf } from '../modules/utils.js';

export function renderArticles() {
  var arts = state.articles, c = state.company;
  var cur = CURRENCIES[c.currency] || CURRENCIES.EUR;
  var ea = state.editArticle || emptyArticle();
  var catOpts = '';
  for (var ci = 0; ci < state.categories.length; ci++) {
    var ct = state.categories[ci];
    catOpts += '<option value="' + ct.key + '"' + (ea.category === ct.key ? ' selected' : '') + '>' + ct.key + ' \u2014 ' + ct.label + '</option>';
  }
  var form = '<div class="form-section" style="margin-bottom:16px">' +
    '<div class="section-title">' + (ea.id && arts.some(function (a) { return a.id === ea.id; }) ? 'Edit Article' : 'New Article') + '</div>' +
    '<div class="form-row three">' +
    '<div class="field"><label class="label">Category</label><div style="display:flex;gap:4px"><select class="input" style="flex:1" data-artfield="category">' + catOpts + '</select><button class="btn btn-primary" style="padding:0 8px;border-radius:4px" title="Add a new custom category" onclick="window.addCategory()">+</button><button class="btn btn-ghost btn-danger" style="padding:0 8px;border-radius:4px" title="Delete selected category" onclick="window.deleteCategory()">✕</button></div></div>' +
    '<div class="field"><label class="label">Article Number</label><input class="input" value="' + esc(ea.articleNumber) + '" data-artfield="articleNumber" placeholder="Auto-generated"/></div>' +
    '<div class="field"><label class="label">Material</label><input class="input" value="' + esc(ea.material) + '" data-artfield="material" placeholder="e.g. Stainless Steel 316"/></div>' +
    '</div>' +
    '<div class="form-row">' +
    '<div class="field"><label class="label">Description</label><textarea class="input" data-artfield="description" placeholder="Part description" style="min-height:70px">' + esc(ea.description) + '</textarea></div>' +
    '<div class="field"><label class="label">Specification (multiline)</label><textarea class="input" data-artfield="specification" placeholder="e.g. DN50 PN16\nDIN EN 1092-1\nFlange type B1" style="min-height:70px">' + esc(ea.specification) + '</textarea></div>' +
    '</div>' +
    '<div class="form-row three">' +
    '<div class="field"><label class="label">Pack Size (VE)</label><input class="input" value="' + esc(ea.packSize) + '" data-artfield="packSize"/></div>' +
    '<div class="field"><label class="label">Default Price (' + cur.symbol + ')</label><input class="input" value="' + esc(ea.defaultPrice) + '" data-artfield="defaultPrice" placeholder="0.00"/></div>' +
    '<div class="field" style="justify-content:flex-end"><div class="btn-group"><button class="btn" data-action="clearart">Clear</button><button class="btn btn-primary" data-action="saveart">Save Article</button></div></div>' +
    '</div></div>';
  var tb = '';
  if (!arts.length) {
    tb = '<div class="empty-state"><div class="empty-icon">\uD83D\uDCE6</div><div class="empty-title">No articles in catalog</div><div class="empty-sub">Add your first article above</div></div>';
  } else {
    var rows = '';
    for (var i = 0; i < arts.length; i++) {
      var a = arts[i];
      var cat = null;
      for (var j = 0; j < state.categories.length; j++) { if (state.categories[j].key === a.category) { cat = state.categories[j]; break; } }
      rows += '<tr ondblclick="event.stopPropagation(); window.state.editArticle=window.state.articles['+i+']; window.render()" style="cursor:pointer" title="Double click to edit"><td style="font-family:var(--mono);font-size:11.5px">' + esc(a.articleNumber) + '</td><td><span class="badge badge-draft">' + (cat ? cat.label : a.category) + '</span></td><td><div style="font-weight:500">' + esc(a.description) + '</div>' + (a.specification ? '<div style="font-size:10.5px;color:#94A3B8;white-space:pre-line">' + esc(a.specification) + '</div>' : '') + '</td><td>' + esc(a.material) + '</td><td style="text-align:right;font-family:var(--mono);font-size:11.5px">' + (a.defaultPrice ? fmtNum(pf(a.defaultPrice), c) + ' ' + cur.symbol : '\u2014') + '</td><td style="text-align:right" onclick="event.stopPropagation()"><button class="btn btn-sm btn-ghost btn-danger" data-delart="' + i + '" title="Delete">\u2715</button></td></tr>';
    }
    tb = '<div class="table-wrap"><table class="data-table"><thead><tr><th>Article #</th><th>Category</th><th>Description</th><th>Material</th><th style="text-align:right">Price</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }
  return '<div class="page-header"><div><div class="page-title">Article Catalog</div><div class="page-subtitle">' + arts.length + ' article' + (arts.length !== 1 ? 's' : '') + '</div></div></div>' + form + tb;
}
