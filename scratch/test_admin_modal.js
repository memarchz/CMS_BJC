const fs = require('fs');
const vm = require('vm');

const storage = {};
const elements = {};
function mockElement(id) {
  if (!elements[id]) {
    elements[id] = {
      id,
      textContent: '',
      value: '',
      innerHTML: '',
      classList: {
        add: () => {},
        remove: () => {},
        toggle: () => {},
        contains: () => false
      },
      querySelectorAll: () => [],
      closest: () => ({ className: '' })
    };
  }
  return elements[id];
}

const ctx = {
  console,
  setTimeout,
  clearTimeout,
  localStorage: {
    getItem: k => storage[k] || null,
    setItem: (k, v) => storage[k] = String(v),
    removeItem: k => delete storage[k]
  },
  sessionStorage: {
    getItem: k => storage[k] || null,
    setItem: (k, v) => storage[k] = String(v),
    removeItem: k => delete storage[k]
  },
  location: { href: 'http://localhost:3000/admin.html', replace: () => {} },
  document: {
    getElementById: mockElement,
    querySelectorAll: sel => [],
    addEventListener: () => {}
  },
  E: mockElement,
  esc: s => s,
  toast: msg => console.log('Toast:', msg),
  alert: msg => console.log('Alert:', msg),
  fdt: () => '02/10/2026'
};
ctx.window = ctx;
vm.createContext(ctx);

vm.runInContext(fs.readFileSync('js/data.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync('js/common.js', 'utf8'), ctx);
storage['portal_session'] = JSON.stringify({ role: 'admin', email: 'admin@demo.co.th', name: 'Admin Test' });
vm.runInContext(fs.readFileSync('js/admin.js', 'utf8'), ctx);

console.log('Testing openPermModal() without args:');
vm.runInContext('openPermModal()', ctx);
const mail1 = vm.runInContext('activeBuyerEmail', ctx);
console.log('activeBuyerEmail:', mail1);
if (!mail1) throw new Error('activeBuyerEmail is empty!');

console.log('Testing openPermModal(\"buyer2@demo.co.th\"):');
vm.runInContext('openPermModal(\"buyer2@demo.co.th\")', ctx);
const mail2 = vm.runInContext('activeBuyerEmail', ctx);
console.log('activeBuyerEmail:', mail2);
if (mail2 !== 'buyer2@demo.co.th') throw new Error('activeBuyerEmail mismatch');

console.log('Testing saveActivePerms:');
ctx.document.querySelectorAll = sel => [
  { value: 'Chiller', checked: true },
  { value: 'Super Equipment', checked: true }
];
vm.runInContext('saveActivePerms()', ctx);
const b2Perms = vm.runInContext('Permissions.get(\"buyer2@demo.co.th\")', ctx);
console.log('buyer2 saved perms:', b2Perms);
if (b2Perms.length !== 2 || !b2Perms.includes('Chiller')) throw new Error('saveActivePerms failed');

console.log('>>> ALL ADMIN MODAL TESTS PASSED! <<<');
