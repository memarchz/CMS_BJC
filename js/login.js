let currentRole = new URLSearchParams(location.search).get('role')
  || sessionStorage.getItem('selected_role')
  || localStorage.getItem('selected_role')
  || 'supplier';
if (!RL[currentRole]) currentRole = 'supplier';
sessionStorage.setItem('selected_role', currentRole);

let selectedBuyerDemo = 'buyer@demo.co.th';

function setBuyerDemo(email) {
  selectedBuyerDemo = email;
  const user = SEED.find(x => x.email === email);
  if (!user) return;
  const m = E('l-mail');
  const p = E('l-pw');
  if (m) {
    m.value = user.email;
    m.placeholder = user.email;
  }
  if (p) {
    p.value = user.pw;
  }
  updateBuyerPills();
}

function updateBuyerPills() {
  const b1 = E('btn-b1');
  const b2 = E('btn-b2');
  if (!b1 || !b2) return;
  if (selectedBuyerDemo === 'buyer@demo.co.th') {
    b1.className = 'p-2.5 rounded-xl border bg-white text-left transition-all border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs';
    b2.className = 'p-2.5 rounded-xl border bg-white text-left transition-all border-gray-200 hover:border-emerald-300';
  } else {
    b2.className = 'p-2.5 rounded-xl border bg-white text-left transition-all border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs';
    b1.className = 'p-2.5 rounded-xl border bg-white text-left transition-all border-gray-200 hover:border-emerald-300';
  }
}

function applyCredentials() {
  let seedUser;
  if (currentRole === 'buyer') {
    seedUser = SEED.find(x => x.email === selectedBuyerDemo) || SEED.find(x => x.role === 'buyer');
  } else {
    seedUser = SEED.find(x => x.role === currentRole);
  }
  if (!seedUser) return;
  const m = E('l-mail');
  const p = E('l-pw');
  if (m) {
    m.name = currentRole + '_user_email';
    m.value = seedUser.email;
    m.placeholder = seedUser.email;
  }
  if (p) {
    p.name = currentRole + '_user_password';
    p.value = seedUser.pw;
  }
  if (currentRole === 'buyer') updateBuyerPills();
}

function updateRoleUI() {
  const roleInfo = RL[currentRole] || RL['supplier'];

  // Title update
  const titleEl = E('login-title');
  if (titleEl) {
    titleEl.textContent = 'เข้าสู่ระบบ ' + roleInfo[1];
  }

  // Description update
  const descs = {
    supplier: 'กรอกข้อมูลเครื่องจักร สเปค ประกัน อะไหล่ และงบซ่อม',
    buyer: 'ตรวจและแก้ไขข้อมูลที่ Supplier ส่งมา ดูทะเบียนทรัพย์สิน',
    admin: 'ดูภาพรวมรายการทั้งหมดและจัดการข้อมูล'
  };
  E('l-role').textContent = descs[currentRole] || ('เข้าสู่ระบบในฐานะ ' + roleInfo[1]);

  // Buyer demo pills toggle
  const buyerPills = E('buyer-demo-pills');
  if (buyerPills) {
    buyerPills.classList.toggle('hidden', currentRole !== 'buyer');
  }

  // Submit button text
  const submitBtn = E('btn-submit');
  if (submitBtn) {
    submitBtn.innerHTML = '<span>เข้าสู่ระบบ ' + roleInfo[1] + '</span> <span class="ml-1">&rarr;</span>';
  }

  // Role Badge
  const badge = E('role-badge');
  if (badge) {
    badge.className = 'text-xs px-3 py-1 rounded-full font-semibold ' + roleInfo[2];
    badge.textContent = roleInfo[1];
  }

  // Highlight Tabs
  ['supplier', 'buyer', 'admin'].forEach(r => {
    const tab = E('tab-' + r);
    if (tab) {
      if (r === currentRole) {
        tab.className = 'py-2 text-xs sm:text-sm font-bold rounded-xl transition-all bg-[#0b6330] text-white shadow-sm';
      } else {
        tab.className = 'py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all text-gray-600 hover:text-gray-900 hover:bg-gray-200/60';
      }
    }
  });

  // Registration link only for Supplier
  const regEl = E('reg');
  if (regEl) {
    regEl.classList.toggle('hidden', currentRole !== 'supplier');
  }

  applyCredentials();
  E('err').classList.add('hidden');
}

function switchRole(role) {
  if (!RL[role]) return;
  currentRole = role;
  sessionStorage.setItem('selected_role', role);
  localStorage.setItem('selected_role', role);
  try {
    const url = new URL(location.href);
    url.searchParams.set('role', role);
    history.replaceState(null, '', url.toString());
  } catch(e) {}
  updateRoleUI();
}

// Initial UI setup
updateRoleUI();

// Guard against asynchronous browser password managers overwriting input
[50, 150, 300, 600].forEach(delay => setTimeout(applyCredentials, delay));
window.addEventListener('load', applyCredentials);
window.addEventListener('pageshow', applyCredentials);

E('f').onsubmit = e => {
  e.preventDefault();
  E('err').classList.add('hidden');
  const mail = E('l-mail').value.trim();
  const pw = E('l-pw').value;
  const s = Auth.login(currentRole, mail, pw);
  if (!s) {
    E('err').classList.remove('hidden');
    return;
  }
  location.href = Auth.home(s.role);
};
