const fs = require('fs');
const vm = require('vm');

const storage = {};
const ctx = {
  console,
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
  location: { href: 'http://localhost:3000/', replace: () => {} }
};
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('js/data.js', 'utf8') + '\n' + fs.readFileSync('js/common.js', 'utf8'), ctx);

console.log('--- TEST 1: Default Permissions ---');
const b1Perms = vm.runInContext("Permissions.get('buyer@demo.co.th')", ctx);
console.log('buyer@demo.co.th default perms:', b1Perms);

console.log('--- TEST 2: Update Permissions ---');
vm.runInContext("Permissions.set('buyer@demo.co.th', ['Chiller'])", ctx);
const updatedPerms = vm.runInContext("Permissions.get('buyer@demo.co.th')", ctx);
console.log('Updated perms:', updatedPerms);

console.log('--- TEST 3: canView enforcement ---');
const canChiller = vm.runInContext("Permissions.canView('buyer@demo.co.th', 'Chiller', 'buyer')", ctx);
const canRef = vm.runInContext("Permissions.canView('buyer@demo.co.th', 'Refrigeration system', 'buyer')", ctx);
const adminCanRef = vm.runInContext("Permissions.canView('admin@demo.co.th', 'Refrigeration system', 'admin')", ctx);
console.log('Buyer can view Chiller:', canChiller);
console.log('Buyer can view Refrigeration:', canRef);
console.log('Admin can view Refrigeration:', adminCanRef);

console.log('--- TEST 4: getBuyers list ---');
const buyers = vm.runInContext("Permissions.getBuyers()", ctx);
console.log('Total buyers:', buyers.length);
const bObj = buyers.find(b => b.email === 'buyer@demo.co.th');
console.log('bObj categories:', bObj ? bObj.categories : null);

if (canChiller && !canRef && adminCanRef && bObj && bObj.categories[0] === 'Chiller') {
  console.log('>>> ALL PERMISSION TESTS PASSED! <<<');
} else {
  console.error('>>> TEST FAILED! <<<');
  process.exit(1);
}
