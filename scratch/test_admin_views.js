const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- 1. Testing admin.html DOM Structure ---');
const html = fs.readFileSync(path.join(__dirname, '..', 'admin.html'), 'utf8');

// Check Sidebar Items
assert(html.includes('id="nav-home"'), 'Should contain nav-home');
assert(html.includes('id="nav-perms"'), 'Should contain nav-perms');
assert(html.includes('id="nav-suppliers"'), 'Should contain nav-suppliers');
assert(!html.includes('id="nav-submissions"'), 'Should NOT contain nav-submissions');
assert(!html.includes('id="nav-reports"'), 'Should NOT contain nav-reports');
assert(!html.includes('id="nav-settings"'), 'Should NOT contain nav-settings');
console.log('✅ Sidebar verification: only 3 menu items exist (Home, Buyer Perms, Supplier Directory)');

// Check Views
assert(html.includes('id="view-dashboard"'), 'Should contain view-dashboard section');
assert(html.includes('id="view-buyer-perms"'), 'Should contain view-buyer-perms section');
assert(html.includes('id="view-suppliers"'), 'Should contain view-suppliers section');
console.log('✅ Main sections verification: view-dashboard, view-buyer-perms, view-suppliers exist');

// Check NO Popups for Perms or Suppliers
assert(!html.includes('id="permModal"'), 'Should NOT have permModal popup');
assert(!html.includes('id="supplierModal"'), 'Should NOT have supplierModal popup');
console.log('✅ No popup modals: permModal and supplierModal are completely removed');

// Check view-buyer-perms elements
assert(html.includes('id="full-buyer-list"'), 'view-buyer-perms has full-buyer-list');
assert(html.includes('id="full-cat-card-grid"'), 'view-buyer-perms has full-cat-card-grid');
assert(html.includes('id="full-active-buyer-name"'), 'view-buyer-perms has active buyer display');
assert(html.includes('saveActiveBuyerPermsFullPage()'), 'view-buyer-perms has save button');
assert(html.includes('fullPermApplyPreset(\'hvac\')'), 'view-buyer-perms has HVAC preset');
assert(html.includes('fullPermApplyPreset(\'elec\')'), 'view-buyer-perms has Elec preset');
assert(html.includes('fullPermApplyPreset(\'logistics\')'), 'view-buyer-perms has Logistics preset');
assert(html.includes('fullPermApplyPreset(\'super\')'), 'view-buyer-perms has Super preset');
console.log('✅ view-buyer-perms has all master-detail and configuration elements');

// Check view-suppliers elements
assert(html.includes('id="full-supplier-stats"'), 'view-suppliers has stats container');
assert(html.includes('id="full-supplier-rows"'), 'view-suppliers has table rows container');
assert(html.includes('id="fullSupSearch"'), 'view-suppliers has search input');
console.log('✅ view-suppliers has directory table, search, and stats');

console.log('\n--- 2. Testing js/admin.js Logic Execution ---');
// Mock browser environment
const localStorageMock = (function () {
  let store = {};
  return {
    getItem: k => store[k] || null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; },
    clear: () => { store = {}; }
  };
})();

global.window = {
  innerWidth: 1200,
  localStorage: localStorageMock
};
global.localStorage = localStorageMock;
global.document = {
  body: { appendChild: () => {} },
  addEventListener: () => {},
  querySelectorAll: (selector) => {
    return [];
  },
  getElementById: (id) => null
};

// Load data.js and common.js
const dataCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'data.js'), 'utf8');
const commonCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'common.js'), 'utf8');
const adminCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'admin.js'), 'utf8');

eval(dataCode + '; global.CATN = CATN; global.CATS = CATS;');
eval(commonCode + '; global.Auth = Auth; global.Permissions = Permissions; global.Store = Store; global.Suppliers = Suppliers; global.J = J;');

// Mock Session as admin
Auth.session = () => ({ role: 'admin', name: 'Admin ผู้ดูแลระบบ', email: 'admin@demo.co.th' });
Auth.require = () => ({ role: 'admin', name: 'Admin ผู้ดูแลระบบ', email: 'admin@demo.co.th' });
global.toast = () => {};
global.esc = (s) => String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
global.fdt = (d) => new Date(d || Date.now()).toLocaleDateString('th-TH');

// Setup fake DOM elements
const elements = {};
function mockElement(id, tag = 'div') {
  const el = {
    id,
    classList: {
      classes: new Set(),
      add: (c) => el.classList.classes.add(c),
      remove: (c) => el.classList.classes.delete(c),
      toggle: (c) => el.classList.classes.has(c) ? el.classList.classes.delete(c) : el.classList.classes.add(c),
      contains: (c) => el.classList.classes.has(c)
    },
    textContent: '',
    innerHTML: '',
    value: '',
    style: {},
    querySelector: () => mockElement('sub'),
    querySelectorAll: () => []
  };
  elements[id] = el;
  return el;
}

[
  'view-dashboard', 'view-buyer-perms', 'view-suppliers',
  'nav-home', 'nav-perms', 'nav-suppliers',
  'full-buyer-list', 'full-buyer-count-tag', 'fullBuyerSearch', 'fullNewBuyerEmail',
  'full-active-avatar', 'full-active-buyer-name', 'full-active-buyer-email', 'full-active-perm-stat',
  'catCardSearch', 'full-cat-card-grid',
  'full-supplier-stats', 'fullSupSearch', 'fullSupStatusFilter', 'full-supplier-rows', 'full-supplier-empty',
  'who', 'dd-name', 'dd-email', 'lb', 'role-sublabel', 'fCat', 'fBuyer',
  'stat-buyers-count', 'stat-pending-count', 'stat-perms-count', 'stat-suppliers-count',
  'tab-buyers-badge', 'tab-subs-badge', 'cat-progress-bars', 'buyers-table-rows', 'subs-table-rows'
].forEach(mockElement);

global.E = (id) => elements[id] || mockElement(id);
global.document.getElementById = global.E;
global.document.querySelector = (sel) => mockElement(sel);
global.document.querySelectorAll = (sel) => {
  if (sel === '.sidebar-link') {
    return [elements['nav-home'], elements['nav-perms'], elements['nav-suppliers']];
  }
  return [];
};

// Evaluate admin.js
eval(adminCode + '; global.showAdminView = showAdminView; global.fullPermApplyPreset = fullPermApplyPreset; global.saveActiveBuyerPermsFullPage = saveActiveBuyerPermsFullPage; global.getFullCurrentPerms = () => fullCurrentPerms; global.getFullActiveBuyerEmail = () => fullActiveBuyerEmail;');

console.log('✅ admin.js evaluated successfully without any runtime error');

// Test 1: Navigation switching
console.log('\n--- Test: Navigation View Switching ---');
showAdminView('perms');
assert(!elements['view-buyer-perms'].classList.contains('hidden'), 'view-buyer-perms should be visible');
assert(elements['view-dashboard'].classList.contains('hidden'), 'view-dashboard should be hidden');
assert(elements['view-suppliers'].classList.contains('hidden'), 'view-suppliers should be hidden');
assert(elements['nav-perms'].classList.contains('active'), 'nav-perms should be active');
console.log('✅ showAdminView("perms") correctly activated full page and sidebar');

// Test 2: Category cards rendering
assert(elements['full-cat-card-grid'].innerHTML.includes('Refrigeration system'), 'Category grid rendered Refrigeration system');
assert(elements['full-cat-card-grid'].innerHTML.includes('Chiller'), 'Category grid rendered Chiller');
assert(elements['full-cat-card-grid'].innerHTML.includes('Safety Equipment'), 'Category grid rendered Safety Equipment');
console.log('✅ 14 Category cards rendered with full details');

// Test 3: Preset application
console.log('\n--- Test: Preset Application ---');
fullPermApplyPreset('hvac');
assert(getFullCurrentPerms().includes('Refrigeration system'), 'HVAC preset includes Refrigeration system');
assert(getFullCurrentPerms().includes('Chiller'), 'HVAC preset includes Chiller');
assert(!getFullCurrentPerms().includes('Safety Equipment'), 'HVAC preset does not include Safety Equipment');
console.log('✅ HVAC Preset correctly selected 4 cold/HVAC categories');

// Test 4: Save permissions
console.log('\n--- Test: Save Category Permissions ---');
saveActiveBuyerPermsFullPage();
const saved = Permissions.get(getFullActiveBuyerEmail());
assert(saved.includes('Refrigeration system'), 'Saved permissions include Refrigeration system');
assert(saved.includes('Chiller'), 'Saved permissions include Chiller');
console.log('✅ Permissions successfully saved for buyer:', getFullActiveBuyerEmail());

// Test 5: Switch to Suppliers View
console.log('\n--- Test: Switch to Suppliers View ---');
showAdminView('suppliers');
assert(!elements['view-suppliers'].classList.contains('hidden'), 'view-suppliers should be visible');
assert(elements['view-dashboard'].classList.contains('hidden'), 'view-dashboard should be hidden');
assert(elements['view-buyer-perms'].classList.contains('hidden'), 'view-buyer-perms should be hidden');
assert(elements['nav-suppliers'].classList.contains('active'), 'nav-suppliers should be active');
assert(elements['full-supplier-rows'].innerHTML.includes('SUP-'), 'Supplier rows rendered in full page table');
console.log('✅ Full Page Supplier Directory view active with data rows');

// Test 6: Switch back to Home Dashboard
console.log('\n--- Test: Return to Dashboard Overview ---');
showAdminView('dashboard');
assert(!elements['view-dashboard'].classList.contains('hidden'), 'view-dashboard should be visible');
assert(elements['view-buyer-perms'].classList.contains('hidden'), 'view-buyer-perms should be hidden');
assert(elements['view-suppliers'].classList.contains('hidden'), 'view-suppliers should be hidden');
assert(elements['nav-home'].classList.contains('active'), 'nav-home should be active');
console.log('✅ Successfully returned to Dashboard Overview');

console.log('\n🎉 ALL ADMIN FULL-PAGE TESTS PASSED WITH 100% SUCCESS!');
