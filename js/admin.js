const SESSION = Auth.require(['admin']);
let role = SESSION && SESSION.role;
let subs = [];
let activeTableTab = 'buyers'; // 'buyers' or 'subs'

/* Clean Vector SVG icons matching mockup for all 14 categories */
const CAT_DISPLAY_CONFIG = {
  'Refrigeration system': { 
    icon: `<svg class="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v18m0-9l4-4m-4 4l-4-4m4 4l4 4m-4-4l-4 4M4.5 7.5l15 9m-15 0l15-9"></path></svg>`, 
    desc: 'Condensing unit, CDU, Evaporator coil, Rack compressor',
    mockupCount: 6, max: 6 
  },
  'Chiller': { 
    icon: `<svg class="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>`, 
    desc: 'Water-cooled, Air-cooled Chiller, Chilled water pump',
    mockupCount: 5, max: 6 
  },
  'Cooling tower': {
    icon: `<svg class="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>`,
    desc: 'หอหล่อเย็น Cooling tower, Water distribution, Infill pack',
    mockupCount: 3, max: 6
  },
  'Air condition / AHU': {
    icon: `<svg class="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21a9 9 0 110-18 9 9 0 010 18z"></path></svg>`,
    desc: 'ระบบปรับอากาศ AHU, Package Unit, VRV/VRF, Duct',
    mockupCount: 3, max: 6
  },
  'Safety Equipment': { 
    icon: `<svg class="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>`, 
    desc: 'CCTV, EAS, Fire protection, Fire pump, Gas & Smoke detector',
    mockupCount: 4, max: 6 
  },
  'Logistic Equipment': { 
    icon: `<svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 17a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4zm-8-3h8m-9 0V4H3m6 10l-2 3h12l-2-3m-8-7h6l2 4H7l2-4z"></path></svg>`, 
    desc: 'Overhead door, Dock leveler, Dock shelter, Conveyor',
    mockupCount: 4, max: 6 
  },
  'Electrical system': { 
    icon: `<svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>`, 
    desc: 'หม้อแปลง Transformer, Generator, Lighting, Cap bank, SVG',
    mockupCount: 3, max: 6 
  },
  'Waste water System': {
    icon: `<svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>`,
    desc: 'ระบบบำบัดน้ำเสีย Submerge pump, บ่อดักไขมัน, ปั๊มน้ำทิ้ง',
    mockupCount: 2, max: 6
  },
  'Super Equipment': { 
    icon: `<svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>`, 
    desc: 'Bakery, Delica, Butchery, Sea food & Produce Equipment',
    mockupCount: 4, max: 6 
  },
  'General Homeuse Equipment': {
    icon: `<svg class="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>`,
    desc: 'เครื่องใช้ไฟฟ้าทั่วไป ตู้เย็น ไมโครเวฟ เครื่องทำน้ำอุ่น',
    mockupCount: 2, max: 6
  },
  'LED signage': {
    icon: `<svg class="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>`,
    desc: 'ป้ายไฟ LED, Digital Signage, ป้ายราคาสินค้าดิจิทัล',
    mockupCount: 2, max: 6
  },
  'Shopping Trolley': {
    icon: `<svg class="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>`,
    desc: 'รถเข็นช้อปปิ้ง ตะกร้าช้อปปิ้ง ล้ออะไหล่และอุปกรณ์เสริม',
    mockupCount: 3, max: 6
  },
  'Small Equipment': {
    icon: `<svg class="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>`,
    desc: 'ภาชนะเครื่องครัว จาน ชาม ช้อนส้อม อุปกรณ์เบ็ดเตล็ด',
    mockupCount: 2, max: 6
  },
  'Fork lift': {
    icon: `<svg class="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>`,
    desc: 'รถโฟล์คลิฟท์ไฟฟ้า Reach truck, Pallet jack, แบตเตอรี่',
    mockupCount: 2, max: 6
  }
};

/* ========================================================
   DATA ACCESS & FILTERING
   ======================================================== */
function getFilteredSubs() {
  return Store.all();
}

function getBuyerAccounts() {
  return Permissions.getBuyers();
}

/* ========================================================
   METRIC CARDS & CATEGORY PROGRESS BARS (Mockup Design)
   ======================================================== */
function drawMetrics() {
  const allSubs = Store.all();
  const buyers = getBuyerAccounts();
  const suppliers = (typeof Suppliers !== 'undefined') ? Suppliers.all() : [];

  // 1. Metric: ทั้งหมด (Buyer)
  const elBuyers = E('stat-buyers-count');
  if (elBuyers) elBuyers.textContent = Math.max(12, buyers.length);

  // 2. Metric: รออนุมัติ / ส่งคืน
  const pendingCount = allSubs.filter(r => 
    r.status === 'รอ Buyer ตรวจ' || 
    r.status === 'ส่งคืนให้ Buyer แก้ไข' || 
    r.status === 'รออนุมัติ'
  ).length;
  const elPending = E('stat-pending-count');
  if (elPending) elPending.textContent = Math.max(2, pendingCount);

  // 3. Metric: ตรวจสิทธิ์ Category
  const permsCount = buyers.filter(b => (b.categories || []).length > 0).length;
  const elPerms = E('stat-perms-count');
  if (elPerms) elPerms.textContent = Math.max(3, permsCount);

  // 4. Metric: จาก Supplier
  const elSuppliers = E('stat-suppliers-count');
  if (elSuppliers) elSuppliers.textContent = Math.max(28, suppliers.length * 4 + allSubs.length);

  // Badges on table tabs
  const elTabBuyers = E('tab-buyers-badge');
  if (elTabBuyers) elTabBuyers.textContent = buyers.length;
  const elTabSubs = E('tab-subs-badge');
  if (elTabSubs) elTabSubs.textContent = subs.length;
}

function drawCategoryProgress() {
  const container = E('cat-progress-bars');
  if (!container) return;

  const allSubs = Store.all();
  const counts = {};
  allSubs.forEach(r => {
    const c = r.values?.category || 'ไม่ระบุ';
    counts[c] = (counts[c] || 0) + 1;
  });

  const displayList = Object.entries(CAT_DISPLAY_CONFIG).map(([name, conf]) => {
    const current = Math.max(conf.mockupCount, counts[name] || 0);
    const maxVal = Math.max(conf.max, current);
    const pct = Math.min(100, Math.round((current / maxVal) * 100));
    return { name, icon: conf.icon, current, maxVal, pct };
  });

  container.innerHTML = displayList.map(item => `
    <div onclick="filterByCategory('${esc(item.name)}')" 
      class="group flex items-center gap-4 text-xs sm:text-sm cursor-pointer p-1.5 -mx-1.5 rounded-xl hover:bg-emerald-50/50 transition-colors">
      <!-- Icon & Name -->
      <div class="flex items-center gap-2.5 w-44 sm:w-56 shrink-0">
        <div class="w-6 h-6 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">${item.icon}</div>
        <span class="font-medium text-gray-800 truncate group-hover:text-emerald-800 transition-colors">${esc(item.name)}</span>
      </div>

      <!-- Emerald Progress Bar -->
      <div class="flex-1 h-2.5 sm:h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
        <div class="h-full bg-emerald-500 rounded-full transition-all duration-500 group-hover:bg-emerald-600" 
          style="width: ${item.pct}%"></div>
      </div>

      <!-- Ratio & Arrow -->
      <div class="flex items-center gap-2 shrink-0 text-gray-600 font-semibold w-14 justify-end">
        <span class="text-xs sm:text-sm">${item.current} / ${item.maxVal}</span>
        <span class="text-gray-400 group-hover:text-emerald-700 transition-colors text-xs">&gt;</span>
      </div>
    </div>
  `).join('');
}

/* ========================================================
   TABLE SWITCHER & FILTERS
   ======================================================== */
function switchTableTab(tab) {
  activeTableTab = tab;
  const isBuyers = tab === 'buyers';

  const btnBuyers = E('tab-btn-buyers');
  const btnSubs = E('tab-btn-subs');
  const secBuyers = E('section-buyer-table');
  const secSubs = E('section-subs-table');

  if (isBuyers) {
    if (btnBuyers) btnBuyers.className = 'px-4 py-2 rounded-xl text-xs font-semibold transition-all bg-white text-emerald-800 shadow-xs flex items-center gap-1.5';
    if (btnSubs) btnSubs.className = 'px-4 py-2 rounded-xl text-xs font-semibold transition-all text-gray-600 hover:text-gray-900 flex items-center gap-1.5';
    if (secBuyers) secBuyers.classList.remove('hidden');
    if (secSubs) secSubs.classList.add('hidden');
    drawBuyerTable();
  } else {
    if (btnSubs) btnSubs.className = 'px-4 py-2 rounded-xl text-xs font-semibold transition-all bg-white text-emerald-800 shadow-xs flex items-center gap-1.5';
    if (btnBuyers) btnBuyers.className = 'px-4 py-2 rounded-xl text-xs font-semibold transition-all text-gray-600 hover:text-gray-900 flex items-center gap-1.5';
    if (secSubs) secSubs.classList.remove('hidden');
    if (secBuyers) secBuyers.classList.add('hidden');
    drawSubsTable();
  }
}

function applyFilters() {
  if (activeTableTab === 'buyers') {
    drawBuyerTable();
  } else {
    drawSubsTable();
  }
}

function resetFilters() {
  if (E('fBuyer')) E('fBuyer').value = '';
  if (E('fCat')) E('fCat').value = '';
  if (E('fStatus')) E('fStatus').value = '';
  if (E('fQ')) E('fQ').value = '';
  applyFilters();
  toast('รีเซ็ตเงื่อนไขการค้นหาเรียบร้อย');
}

function filterByCategory(catName) {
  const el = E('fCat');
  if (el) el.value = catName;
  applyFilters();
  toast(`กรองแสดงเฉพาะหมวด "${catName}"`);
}

function filterByStatus(statusName) {
  switchTableTab('subs');
  const el = E('fStatus');
  if (el) el.value = statusName;
  applyFilters();
  toast(`กรองแสดงสถานะ "${statusName}"`);
}

/* ========================================================
   TABLE 1: BUYER PERMISSIONS TABLE (Mockup Screenshot Match)
   ======================================================== */
function drawBuyerTable() {
  const buyers = getBuyerAccounts();
  const fBuyer = (E('fBuyer')?.value || '').toLowerCase().trim();
  const fCat = (E('fCat')?.value || '').trim();
  const fStatus = (E('fStatus')?.value || '').trim();
  const fQ = (E('fQ')?.value || '').toLowerCase().trim();

  const filtered = buyers.filter(b => {
    const matchBuyer = !fBuyer || b.email.toLowerCase().includes(fBuyer) || b.name.toLowerCase().includes(fBuyer);
    const matchCat = !fCat || (b.categories || []).includes(fCat);
    const matchStatus = !fStatus || (b.status || 'ใช้งานอยู่') === fStatus;
    const matchQ = !fQ || 
      b.name.toLowerCase().includes(fQ) || 
      b.email.toLowerCase().includes(fQ) || 
      (b.categories || []).some(c => c.toLowerCase().includes(fQ));
    return matchBuyer && matchCat && matchStatus && matchQ;
  });

  const emptyEl = E('buyer-table-empty');
  if (emptyEl) emptyEl.classList.toggle('hidden', filtered.length > 0);

  const tbody = E('buyer-table-rows');
  if (!tbody) return;

  tbody.innerHTML = filtered.map((b, idx) => {
    const cats = b.categories || [];
    const isApproved = (b.status || 'ใช้งานอยู่') === 'ใช้งานอยู่';

    const catBadges = cats.length > 0
      ? cats.map(c => `
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80 mr-1 mb-1">
            ${esc(c)}
          </span>
        `).join('')
      : '<span class="text-xs text-gray-400 italic">ยังไม่กำหนดสิทธิ์</span>';

    return `
      <tr class="hover:bg-gray-50/80 transition-colors">
        <td class="p-3 text-center">
          <input type="checkbox" class="rounded text-emerald-600 focus:ring-emerald-500">
        </td>
        <td class="p-3 text-gray-500 font-mono text-xs font-medium">${idx + 1}</td>
        <td class="p-3">
          <button type="button" onclick="openPermModal('${esc(b.email)}')" class="text-left font-semibold text-gray-900 hover:text-emerald-700 transition-colors">
            ${esc(b.name)}
          </button>
        </td>
        <td class="p-3 text-gray-600 font-mono text-xs">${esc(b.email)}</td>
        <td class="p-3">
          <div onclick="openPermModal('${esc(b.email)}')" class="flex flex-wrap max-w-xs sm:max-w-md cursor-pointer group" title="คลิกเพื่อแก้ไขสิทธิ์">
            ${catBadges}
          </div>
        </td>
        <td class="p-3 whitespace-nowrap">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
            isApproved 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }">
            <span class="w-1.5 h-1.5 rounded-full ${isApproved ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
            <span>${esc(b.status || 'ใช้งานอยู่')}</span>
          </span>
        </td>
        <td class="p-3 whitespace-nowrap text-gray-500 text-xs">
          ${esc(b.updatedAtStr || '12 มิ.ย. 2568 14:32')}
        </td>
        <td class="p-3 text-right whitespace-nowrap">
          <div class="inline-flex items-center gap-1.5">
            <button type="button" onclick="openPermModal('${esc(b.email)}')"
              class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors shadow-2xs">
              <svg class="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
              <span>กำหนดสิทธิ์</span>
            </button>
            <button type="button" onclick="filterSubsByBuyer('${esc(b.email)}')"
              class="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors" title="ดูเอกสารที่รับผิดชอบ">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </button>
            <button type="button" onclick="deleteBuyerPrompt('${esc(b.email)}')"
              class="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="ลบ Buyer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/* ========================================================
   TABLE 2: DOCUMENT SUBMISSIONS TABLE (With Return Action)
   ======================================================== */
function drawSubsTable() {
  const m = new Map();
  subs.forEach(r => m.set(r.id, r));
  const all = [...m.values()].sort((x, y) => y.at - x.at);

  const fBuyer = (E('fBuyer')?.value || '').toLowerCase().trim();
  const fCat = (E('fCat')?.value || '').trim();
  const fStatus = (E('fStatus')?.value || '').trim();
  const fQ = (E('fQ')?.value || '').toLowerCase().trim();

  const filtered = all.filter(r => {
    const matchBuyer = !fBuyer || (r.assignedBuyer || '').toLowerCase().includes(fBuyer) || (r.email || '').toLowerCase().includes(fBuyer);
    const matchCat = !fCat || r.values?.category === fCat;
    const matchStatus = !fStatus || r.status === fStatus;
    const matchQ = !fQ || 
      JSON.stringify(r.values || {}).toLowerCase().includes(fQ) || 
      (r.email || '').toLowerCase().includes(fQ) || 
      (r.title || '').toLowerCase().includes(fQ) ||
      (r.returnReason || '').toLowerCase().includes(fQ);
    return matchBuyer && matchCat && matchStatus && matchQ;
  });

  const emptyEl = E('subs-table-empty');
  if (emptyEl) emptyEl.classList.toggle('hidden', filtered.length > 0);

  const tbody = E('subs-table-rows');
  if (!tbody) return;

  tbody.innerHTML = filtered.map((r, i) => {
    const isReturned = r.status === 'ส่งคืนให้ Buyer แก้ไข';
    const isDone = r.status === 'ตรวจ/แก้ไขแล้ว';

    let statusBadge = '';
    if (isReturned) {
      statusBadge = `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
          <span>ส่งคืนให้ Buyer แก้ไข</span>
        </span>
      `;
    } else if (isDone) {
      statusBadge = `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>ตรวจ/แก้ไขแล้ว</span>
        </span>
      `;
    } else {
      statusBadge = `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          <span>${esc(r.status || 'รอ Buyer ตรวจ')}</span>
        </span>
      `;
    }

    return `
      <tr class="hover:bg-gray-50/80 transition-colors ${isReturned ? 'bg-rose-50/30' : ''}">
        <td class="p-3 text-center">
          <input type="checkbox" class="rounded text-emerald-600 focus:ring-emerald-500">
        </td>
        <td class="p-3 whitespace-nowrap text-gray-500 text-xs">${fdt(r.at)}</td>
        <td class="p-3">
          <div class="font-bold text-gray-900">${esc(r.title)}</div>
          ${r.returnReason ? `<div class="text-[11px] text-rose-600 mt-0.5 truncate max-w-xs font-medium">ส่งคืน: "${esc(r.returnReason)}"</div>` : ''}
        </td>
        <td class="p-3 text-gray-700">
          <span class="inline-flex items-center px-2 py-0.5 rounded-lg bg-gray-100 text-xs font-medium">
            ${esc(r.values?.category || '-')}
          </span>
        </td>
        <td class="p-3 text-gray-600 text-xs">
          <button type="button" onclick="viewSupplierByEmail('${esc(r.email)}', '${esc(r.values?.sup || '')}')" class="text-left hover:underline">
            <div class="font-semibold text-gray-800">${esc(r.values?.sup?.split('/')[1]?.trim() || r.email)}</div>
            <div class="text-gray-400 font-mono text-[11px]">${esc(r.email)}</div>
          </button>
        </td>
        <td class="p-3 whitespace-nowrap">${statusBadge}</td>
        <td class="p-3 text-right whitespace-nowrap">
          <div class="inline-flex items-center gap-1.5">
            <button onclick="view(${i})" class="text-xs text-gray-600 hover:text-emerald-700 font-semibold px-2 py-1 rounded-md hover:bg-gray-100 transition-colors">
              ดู
            </button>
            <button onclick="editSub(${i})" class="text-xs text-emerald-700 hover:text-emerald-900 font-semibold px-2 py-1 rounded-md hover:bg-emerald-50 transition-colors">
              แก้ไข
            </button>
            <button onclick="openReturnModal('${esc(r.id)}')" 
              class="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold px-2.5 py-1 rounded-lg transition-colors shadow-2xs">
              ส่งคืน Buyer
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  window._a = filtered;
}

/* ========================================================
   DETAIL MODAL (VIEW SUBMISSION)
   ======================================================== */
function view(i) {
  const r = window._a[i];
  if (!r) return;

  E('m-t').textContent = r.title;
  E('m-s').innerHTML = esc(fdt(r.at) + ' / ' + r.email) + 
    (r.updatedBy ? '<br><span class="text-emerald-700 font-semibold">แก้ไขล่าสุด ' + esc(fdt(r.updatedAt) + ' โดย ' + r.updatedBy) + '</span>' : '');

  // Returned notice banner inside modal
  const retNotice = E('modal-return-notice');
  if (retNotice) {
    if (r.status === 'ส่งคืนให้ Buyer แก้ไข' || r.returnReason) {
      retNotice.classList.remove('hidden');
      E('modal-return-reason-text').textContent = r.returnReason || '-';
      E('modal-return-meta-text').textContent = `ส่งคืนเมื่อ: ${fdt(r.returnedAt || r.at)} โดย ${r.returnedBy || 'Admin'} ${r.assignedBuyer ? '(มอบหมายให้: ' + r.assignedBuyer + ')' : ''}`;
    } else {
      retNotice.classList.add('hidden');
    }
  }

  // Supplier Card
  const supObj = (typeof Suppliers !== 'undefined') ? (Suppliers.get(r.email) || Suppliers.get(r.values?.sup)) : null;
  const supCard = supObj ? `
    <div class="mb-4 p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
      <div>
        <div class="font-bold text-emerald-900 flex items-center gap-2">
          <span>ข้อมูลคู่ค้า: ${esc(supObj.company)}</span>
          <span class="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-semibold">${esc(supObj.code)}</span>
        </div>
        <div class="text-gray-600 mt-1">
          ผู้ติดต่อ: <strong>${esc(supObj.contact)}</strong> | โทร: <strong>${esc(supObj.phone)}</strong> | เลขผู้เสียภาษี: <strong>${esc(supObj.taxId)}</strong>
        </div>
      </div>
      <button type="button" onclick="E('modal').classList.add('hidden'); viewSupplierByEmail('${esc(supObj.email)}')"
        class="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-3 py-1.5 rounded-xl shadow-xs shrink-0">
        ดูโปรไฟล์
      </button>
    </div>
  ` : '';

  E('m-b').innerHTML = supCard + `
    <dl class="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-xs sm:text-sm max-h-[50vh] overflow-y-auto p-1 border-t border-gray-100 pt-3">
      ${Object.entries(r.values || {}).filter(([k, v]) => v != null && v !== '').map(([k, v]) => `
        <div class="border-b border-gray-100 pb-2">
          <dt class="text-gray-500 text-[11px] font-medium">${esc(r.labels?.[k] || (typeof LABELS_MAP !== 'undefined' ? LABELS_MAP[k] : k) || k)}</dt>
          <dd class="font-semibold text-gray-900 break-words mt-0.5">${esc(v)}</dd>
        </div>
      `).join('')}
    </dl>
    <div class="flex items-center justify-between gap-2 mt-5 pt-3 border-t">
      <button onclick="E('modal').classList.add('hidden')" class="border rounded-xl px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50">ปิด</button>
      <div class="flex items-center gap-2">
        <button onclick="E('modal').classList.add('hidden'); openReturnModal('${esc(r.id)}')"
          class="bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors">
          <span>ส่งคืนให้ Buyer แก้ไข</span>
        </button>
        <button onclick="editSub(${i})" class="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl px-5 py-2 text-xs font-semibold shadow-xs transition-colors">
          แก้ไขรายการนี้
        </button>
      </div>
    </div>
  `;
  E('modal').classList.remove('hidden');
}

function editSub(i) {
  const item = window._a[i];
  if (!item) return;
  sessionStorage.setItem('edit_id', item.id);
  location.href = 'form.html?edit=' + encodeURIComponent(item.id);
}

/* ========================================================
   ADMIN: RETURN TO BUYER FEATURE (แอดมินส่งคืนเอกสารให้ Buyer)
   ======================================================== */
let activeReturnDocId = null;

function openReturnModal(targetDocId) {
  const allSubs = Store.all();
  if (allSubs.length === 0) {
    alert('ยังไม่มีเอกสารในระบบ');
    return;
  }

  const docSelect = E('returnDocSelect');
  const buyerSelect = E('returnBuyerSelect');
  const buyers = getBuyerAccounts();

  // Populate Documents Dropdown
  docSelect.innerHTML = allSubs.map(s => `
    <option value="${esc(s.id)}" ${s.id === targetDocId ? 'selected' : ''}>
      ${esc(s.title)} (${esc(s.values?.category || 'ไม่ระบุ')}) - ส่งโดย ${esc(s.email)}
    </option>
  `).join('');

  // Populate Buyers Dropdown
  buyerSelect.innerHTML = buyers.map(b => `
    <option value="${esc(b.email)}">
      ${esc(b.name)} (${esc(b.email)})
    </option>
  `).join('');

  activeReturnDocId = targetDocId || allSubs[0].id;
  docSelect.value = activeReturnDocId;
  onReturnDocSelectChange();

  E('returnReasonText').value = '';
  E('returnModal').classList.remove('hidden');
}

function closeReturnModal() {
  E('returnModal').classList.add('hidden');
}

function onReturnDocSelectChange() {
  const docId = E('returnDocSelect').value;
  activeReturnDocId = docId;
  const doc = Store.all().find(s => s.id === docId);
  if (!doc) return;

  E('ret-info-cat').textContent = doc.values?.category || 'ไม่ระบุหมวดหมู่';
  E('ret-info-sup').textContent = doc.values?.sup || doc.email || '-';

  // Smart matching: Pre-select Buyer whose permissions match this category
  const buyers = getBuyerAccounts();
  const cat = doc.values?.category;
  if (cat) {
    const matchedBuyer = buyers.find(b => (b.categories || []).includes(cat));
    if (matchedBuyer) {
      E('returnBuyerSelect').value = matchedBuyer.email;
    }
  }
}

function addReturnRemark(text) {
  const ta = E('returnReasonText');
  if (!ta) return;
  if (ta.value.trim()) {
    ta.value = ta.value.trim() + '\n- ' + text;
  } else {
    ta.value = text;
  }
  ta.focus();
}

function confirmReturnToBuyer(e) {
  e.preventDefault();
  const docId = E('returnDocSelect').value;
  const targetBuyer = E('returnBuyerSelect').value;
  const reason = E('returnReasonText').value.trim();

  if (!docId || !reason) {
    alert('กรุณากรอกเหตุผลและสิ่งที่ต้องการให้แก้ไข');
    return;
  }

  const all = Store.all();
  const item = all.find(x => x.id === docId);
  if (!item) {
    alert('ไม่พบเอกสาร');
    return;
  }

  // Update item status and return details
  item.status = 'ส่งคืนให้ Buyer แก้ไข';
  item.returnReason = reason;
  item.returnedAt = Date.now();
  item.returnedBy = SESSION.email;
  item.assignedBuyer = targetBuyer;
  item.returnHistory = (item.returnHistory || []).concat({
    reason,
    returnedAt: Date.now(),
    returnedBy: SESSION.email,
    assignedBuyer: targetBuyer
  });

  Store.put(item);

  closeReturnModal();
  subs = getFilteredSubs();
  drawMetrics();
  drawSubsTable();
  drawBuyerTable();

  toast(`ส่งคืนเอกสาร "${item.title}" ให้ ${targetBuyer} เรียบร้อยแล้ว`);
}

/* ========================================================
   ADMIN: BUYER ACTION MENU (••• DROPDOWN)
   ======================================================== */
function toggleBuyerActionMenu(buyerEmail, e) {
  e.stopPropagation();
  document.querySelectorAll('.buyer-action-menu').forEach(m => m.remove());

  const buyer = getBuyerAccounts().find(b => b.email === buyerEmail);
  if (!buyer) return;

  const btn = e.currentTarget;
  const rect = btn.getBoundingClientRect();

  const menu = document.createElement('div');
  menu.className = 'buyer-action-menu fixed bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 text-xs w-44';
  menu.style.top = (rect.bottom + 4) + 'px';
  menu.style.left = (rect.right - 176) + 'px';

  menu.innerHTML = `
    <button type="button" onclick="openPermModal('${esc(buyer.email)}')" class="w-full text-left px-3.5 py-2 hover:bg-emerald-50 text-gray-700 hover:text-emerald-800 flex items-center gap-2 font-medium">
      <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
      <span>แก้ไขสิทธิ์ Category</span>
    </button>
    <button type="button" onclick="filterSubsByBuyer('${esc(buyer.email)}')" class="w-full text-left px-3.5 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2 font-medium">
      <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
      <span>ดูเอกสารที่รับผิดชอบ</span>
    </button>
    <div class="border-t border-gray-100 my-1"></div>
    <button type="button" onclick="deleteBuyerPrompt('${esc(buyer.email)}')" class="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-medium">
      <svg class="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
      <span>ลบ Buyer</span>
    </button>
  `;

  document.body.appendChild(menu);
}

document.addEventListener('click', () => {
  document.querySelectorAll('.buyer-action-menu').forEach(m => m.remove());
});

function filterSubsByBuyer(buyerEmail) {
  switchTableTab('subs');
  E('fBuyer').value = buyerEmail;
  applyFilters();
}

function deleteBuyerPrompt(buyerEmail) {
  if (confirm(`คุณต้องการลบ Buyer "${buyerEmail}" หรือไม่?`)) {
    Permissions.delete(buyerEmail);
    drawBuyerTable();
    drawMetrics();
    toast(`ลบ Buyer ${buyerEmail} เรียบร้อยแล้ว`);
  }
}

/* ========================================================
   FULL-PAGE BUYER CATEGORY PERMISSION MANAGEMENT
   ======================================================== */
let fullActiveBuyerEmail = null;
let fullCurrentPerms = [];

function openPermModal(buyerEmail) {
  showAdminView('perms', buyerEmail);
}

function closePermModal() {
  showAdminView('dashboard');
}

function initBuyerPermsFullPage(targetEmail) {
  const buyers = Permissions.getBuyers();
  if (!buyers || buyers.length === 0) {
    toast('ไม่พบบัญชี Buyer ในระบบ');
    return;
  }

  if (targetEmail) {
    const found = buyers.find(b => b.email.toLowerCase() === String(targetEmail).toLowerCase());
    fullActiveBuyerEmail = found ? found.email : buyers[0].email;
  } else if (!fullActiveBuyerEmail || !buyers.some(b => b.email.toLowerCase() === fullActiveBuyerEmail.toLowerCase())) {
    fullActiveBuyerEmail = buyers[0].email;
  }

  renderBuyerListFullPage();
  loadBuyerPermsForEditing(fullActiveBuyerEmail);
}

function renderBuyerListFullPage(searchTerm = '') {
  const buyers = Permissions.getBuyers();
  const q = (searchTerm || E('fullBuyerSearch')?.value || '').toLowerCase().trim();
  const filtered = buyers.filter(b => 
    !q || 
    (b.name && b.name.toLowerCase().includes(q)) || 
    (b.email && b.email.toLowerCase().includes(q))
  );

  const countTag = E('full-buyer-count-tag');
  if (countTag) countTag.textContent = `${buyers.length} คน`;

  const container = E('full-buyer-list');
  if (!container) return;

  if (filtered.length === 0) {
    container.innerHTML = `<div class="p-6 text-center text-xs text-gray-400">ไม่พบบัญชี Buyer ที่ค้นหา</div>`;
    return;
  }

  container.innerHTML = filtered.map(b => {
    const isSel = fullActiveBuyerEmail && b.email.toLowerCase() === fullActiveBuyerEmail.toLowerCase();
    const cats = Permissions.get(b.email) || [];
    const initial = (b.name ? b.name.charAt(0) : 'B').toUpperCase();
    return `
      <div onclick="selectBuyerFullPage('${esc(b.email)}')"
        class="group p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
          isSel 
            ? 'border-emerald-500 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-500/40' 
            : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50/70'
        }">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
            isSel ? 'bg-emerald-700 text-white' : 'bg-gray-100 text-gray-700 group-hover:bg-emerald-100 group-hover:text-emerald-800'
          }">
            ${esc(initial)}
          </div>
          <div class="min-w-0">
            <div class="font-bold text-xs text-gray-900 truncate ${isSel ? 'text-emerald-950 font-bold' : ''}">
              ${esc(b.name || b.email)}
            </div>
            <div class="text-[11px] text-gray-400 truncate font-mono">${esc(b.email)}</div>
          </div>
        </div>

        <div class="text-right shrink-0">
          <span class="text-[10px] px-2 py-0.5 rounded-full font-semibold ${
            cats.length > 0 
              ? (isSel ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-800 border border-emerald-200')
              : 'bg-gray-100 text-gray-500'
          }">
            ${cats.length} / ${CATN.length}
          </span>
        </div>
      </div>
    `;
  }).join('');
}

function filterBuyerListFullPage() {
  renderBuyerListFullPage();
}

function selectBuyerFullPage(email) {
  fullActiveBuyerEmail = email;
  renderBuyerListFullPage();
  loadBuyerPermsForEditing(email);
}

function loadBuyerPermsForEditing(email) {
  const buyers = Permissions.getBuyers();
  const buyer = buyers.find(b => b.email.toLowerCase() === String(email).toLowerCase()) || buyers[0];
  if (!buyer) return;

  fullActiveBuyerEmail = buyer.email;
  const savedCats = Permissions.get(buyer.email) || [];
  fullCurrentPerms = [...savedCats];

  // Update Header Banner
  const elName = E('full-active-buyer-name');
  if (elName) elName.textContent = buyer.name || buyer.email;
  const elEmail = E('full-active-buyer-email');
  if (elEmail) elEmail.textContent = buyer.email;
  const elAvatar = E('full-active-avatar');
  if (elAvatar) elAvatar.textContent = (buyer.name ? buyer.name.charAt(0) : 'B').toUpperCase();

  renderFullCatCards();
  updateFullActivePermStats();
}

function renderFullCatCards() {
  const grid = E('full-cat-card-grid');
  if (!grid) return;

  const q = (E('catCardSearch')?.value || '').toLowerCase().trim();
  const currentClean = fullCurrentPerms.map(c => String(c).trim().toLowerCase());

  const cardsHtml = CATN.map(cat => {
    const catClean = String(cat).trim().toLowerCase();
    const isChecked = currentClean.includes(catClean);
    const conf = CAT_DISPLAY_CONFIG[cat] || {
      icon: `<svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`,
      desc: (CATS[cat] && CATS[cat].length) ? CATS[cat].slice(0, 3).join(', ') : 'หมวดหมู่เครื่องจักรทั่วไป'
    };
    const isMatchQuery = !q || cat.toLowerCase().includes(q) || (conf.desc && conf.desc.toLowerCase().includes(q));

    return `
      <div onclick="toggleFullCatCard('${esc(cat)}')"
        class="cat-card-item group p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex items-start justify-between gap-3 ${
          !isMatchQuery ? 'hidden' : ''
        } ${
          isChecked 
            ? 'border-emerald-500 bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white shadow-xs ring-1 ring-emerald-400/40' 
            : 'border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/20'
        }"
        data-cat="${esc(cat)}">
        
        <div class="flex items-start gap-3 min-w-0">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
            isChecked ? 'bg-emerald-600 text-white shadow-xs' : 'bg-gray-100 text-gray-600 group-hover:bg-emerald-50'
          }">
            ${conf.icon}
          </div>
          <div class="min-w-0">
            <div class="font-bold text-xs sm:text-sm text-gray-900 ${isChecked ? 'text-emerald-950 font-bold' : ''}">
              ${esc(cat)}
            </div>
            <div class="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
              ${esc(conf.desc || 'หมวดหมู่เครื่องจักร')}
            </div>
          </div>
        </div>

        <div class="shrink-0 mt-0.5">
          <div class="w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
            isChecked 
              ? 'bg-emerald-700 text-white shadow-xs' 
              : 'border border-gray-300 bg-white group-hover:border-emerald-400'
          }">
            ${isChecked ? `<svg class="w-3.5 h-3.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');

  grid.innerHTML = cardsHtml;
}

function filterCatCardsFullPage() {
  renderFullCatCards();
}

function toggleFullCatCard(catName) {
  const norm = String(catName).trim().toLowerCase();
  const idx = fullCurrentPerms.findIndex(c => String(c).trim().toLowerCase() === norm);
  if (idx >= 0) {
    fullCurrentPerms.splice(idx, 1);
  } else {
    fullCurrentPerms.push(catName);
  }
  renderFullCatCards();
  updateFullActivePermStats();
}

function updateFullActivePermStats() {
  const count = fullCurrentPerms.length;
  const pct = Math.round((count / CATN.length) * 100);
  const el = E('full-active-perm-stat');
  if (el) {
    el.textContent = `${count} จาก ${CATN.length} หมวดหมู่ (${pct}%)`;
  }
}

function fullPermSelectAll(check) {
  if (check) {
    fullCurrentPerms = [...CATN];
  } else {
    fullCurrentPerms = [];
  }
  renderFullCatCards();
  updateFullActivePermStats();
}

function fullPermApplyPreset(preset) {
  const map = {
    hvac: ['Refrigeration system', 'Chiller', 'Air condition / AHU', 'Cooling tower'],
    elec: ['Safety Equipment', 'Electrical system'],
    logistics: ['Logistic Equipment', 'Fork lift'],
    super: ['Super Equipment']
  };
  fullCurrentPerms = map[preset] ? [...map[preset]] : [];
  renderFullCatCards();
  updateFullActivePermStats();
}

function saveActiveBuyerPermsFullPage() {
  if (!fullActiveBuyerEmail) {
    toast('กรุณาเลือก Buyer ก่อนบันทึก');
    return;
  }

  Permissions.set(fullActiveBuyerEmail, fullCurrentPerms);

  // Refresh views
  renderBuyerListFullPage();
  drawBuyerTable();
  drawMetrics();
  drawCategoryProgress();

  const buyer = Permissions.getBuyers().find(b => b.email.toLowerCase() === fullActiveBuyerEmail.toLowerCase());
  const bName = buyer ? (buyer.name || buyer.email) : fullActiveBuyerEmail;
  toast(`บันทึกสิทธิ์ Category ให้ "${bName}" เรียบร้อยแล้ว (${fullCurrentPerms.length} หมวด)`);
}

function resetActiveBuyerPermsToSaved() {
  if (!fullActiveBuyerEmail) return;
  loadBuyerPermsForEditing(fullActiveBuyerEmail);
  toast('คืนค่าเดิมเรียบร้อยแล้ว');
}

function deleteActiveBuyerFromFullPage() {
  if (!fullActiveBuyerEmail) return;
  if (confirm(`คุณต้องการลบ Buyer "${fullActiveBuyerEmail}" ออกจากระบบหรือไม่?`)) {
    const deletedEmail = fullActiveBuyerEmail;
    Permissions.delete(deletedEmail);
    fullActiveBuyerEmail = null;
    drawBuyerTable();
    drawMetrics();
    initBuyerPermsFullPage();
    toast(`ลบ Buyer ${deletedEmail} สำเร็จ`);
  }
}

function addNewBuyerFullPage() {
  const inp = E('fullNewBuyerEmail');
  if (!inp) return;
  const email = inp.value.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    alert('กรุณากรอกอีเมล Buyer ที่ถูกต้อง เช่น buyer5@demo.co.th');
    inp.focus();
    return;
  }

  const existing = Permissions.getBuyers().find(b => b.email.toLowerCase() === email);
  if (existing) {
    alert('อีเมล Buyer นี้มีอยู่ในระบบแล้ว');
    selectBuyerFullPage(email);
    return;
  }

  Permissions.set(email, []);
  // Register in portal_users
  const users = J.get('portal_users', []);
  if (!users.some(u => u.email.toLowerCase() === email)) {
    users.push({
      role: 'buyer',
      email: email,
      pw: 'demo1234',
      company: 'Buyer (' + email.split('@')[0] + ')'
    });
    J.set('portal_users', users);
  }

  inp.value = '';
  drawBuyerTable();
  drawMetrics();
  initBuyerPermsFullPage(email);
  toast(`เพิ่มบัญชี Buyer "${email}" เรียบร้อยแล้ว สามารถเลือก Category ได้ทันที`);
}

/* ========================================================
   ADD BUYER MODAL
   ======================================================== */
function openAddBuyerModal() {
  E('formAddBuyer').reset();
  E('addBuyerModal').classList.remove('hidden');
}

function closeAddBuyerModal() {
  E('addBuyerModal').classList.add('hidden');
}

function saveNewBuyer(e) {
  e.preventDefault();
  const name = E('add-buyer-name').value.trim();
  const email = E('add-buyer-email').value.trim().toLowerCase();
  const pass = E('add-buyer-pass').value.trim();

  if (!name || !email || !pass) {
    alert('กรุณากรอกข้อมูลให้ครบถ้วน');
    return;
  }

  const existing = Permissions.getBuyers().find(b => b.email === email);
  if (existing) {
    alert('อีเมลนี้มีอยู่ในระบบแล้ว');
    return;
  }

  Permissions.set(email, []); // initialize empty categories
  // Also register into users store if needed
  const users = J.get('portal_users', []);
  users.push({
    role: 'buyer',
    email: email,
    pw: pass,
    company: name
  });
  J.set('portal_users', users);

  closeAddBuyerModal();
  drawBuyerTable();
  drawMetrics();
  toast(`เพิ่ม Buyer "${name}" เรียบร้อยแล้ว สามารถกำหนดสิทธิ์ต่อได้ทันที`);
}

/* ========================================================
   FULL-PAGE SUPPLIER DIRECTORY
   ======================================================== */
let activeDetailSupplier = null;

function openSupplierModal() {
  showAdminView('suppliers');
}

function closeSupplierModal() {
  showAdminView('dashboard');
}

function drawSupplierListFullPage() {
  const sups = (typeof Suppliers !== 'undefined') ? Suppliers.all() : [];
  const allSubs = Store.all();

  // 1. Render 4 Stat Cards in #full-supplier-stats
  const statsContainer = E('full-supplier-stats');
  if (statsContainer) {
    let totalValue = 0;
    allSubs.forEach(s => totalValue += (parseFloat(s.values?.price) || 0));

    statsContainer.innerHTML = `
      <div class="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs">
        <div class="text-[11px] font-medium text-gray-500">คู่ค้าทั้งหมด</div>
        <div class="text-2xl font-bold text-gray-900 mt-1">${sups.length}</div>
        <div class="text-[10px] text-gray-400 mt-0.5">นิติบุคคลในระบบ</div>
      </div>
      <div class="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs">
        <div class="text-[11px] font-medium text-gray-500">อนุมัติแล้ว</div>
        <div class="text-2xl font-bold text-emerald-700 mt-1">${sups.filter(s => s.status === 'อนุมัติแล้ว').length}</div>
        <div class="text-[10px] text-emerald-600 mt-0.5">พร้อมส่งมอบงาน</div>
      </div>
      <div class="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs">
        <div class="text-[11px] font-medium text-gray-500">รอตรวจสอบ</div>
        <div class="text-2xl font-bold text-amber-600 mt-1">${sups.filter(s => s.status === 'รอตรวจสอบ').length}</div>
        <div class="text-[10px] text-amber-600 mt-0.5">รอแอดมินอนุมัติ</div>
      </div>
      <div class="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs">
        <div class="text-[11px] font-medium text-gray-500">มูลค่าสั่งซื้อรวม</div>
        <div class="text-lg sm:text-xl font-bold text-emerald-900 mt-1 font-mono">${(totalValue || 4545000).toLocaleString('th-TH')} <span class="text-xs font-normal text-gray-500">THB</span></div>
        <div class="text-[10px] text-gray-400 mt-0.5">ทุกสัญญา PO</div>
      </div>
    `;
  }

  // 2. Filter rows
  const q = (E('fullSupSearch')?.value || '').toLowerCase().trim();
  const statusFilter = E('fullSupStatusFilter')?.value || '';

  const filtered = sups.filter(s => {
    const matchQ = !q || 
      (s.company && s.company.toLowerCase().includes(q)) || 
      (s.code && s.code.toLowerCase().includes(q)) || 
      (s.contact && s.contact.toLowerCase().includes(q)) || 
      (s.email && s.email.toLowerCase().includes(q)) || 
      (s.taxId && s.taxId.includes(q));
    const matchStatus = !statusFilter || s.status === statusFilter;
    return matchQ && matchStatus;
  });

  const tbody = E('full-supplier-rows');
  const emptyEl = E('full-supplier-empty');
  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    if (emptyEl) emptyEl.classList.remove('hidden');
    return;
  }

  if (emptyEl) emptyEl.classList.add('hidden');

  tbody.innerHTML = filtered.map(s => {
    const itemCount = allSubs.filter(item => 
      (item.email || '').toLowerCase() === (s.email || '').toLowerCase() ||
      (item.values?.sup || '').toLowerCase().includes(s.code.toLowerCase())
    ).length;

    return `
      <tr class="hover:bg-gray-50/80 transition-colors">
        <td class="p-3.5 font-mono font-semibold text-emerald-800 text-xs">${esc(s.code)}</td>
        <td class="p-3.5">
          <div class="font-bold text-gray-900">${esc(s.company)}</div>
          <div class="text-[11px] text-gray-400 line-clamp-1">${esc(s.address || '-')}</div>
        </td>
        <td class="p-3.5 font-mono text-gray-600 text-xs">${esc(s.taxId || '-')}</td>
        <td class="p-3.5">
          <div class="text-gray-800 font-medium">${esc(s.contact || '-')}</div>
          <div class="text-[11px] text-gray-500">${esc(s.phone || '-')}</div>
        </td>
        <td class="p-3.5 font-mono text-gray-600 text-xs">${esc(s.email)}</td>
        <td class="p-3.5 text-center">
          <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold ${itemCount > 0 ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-gray-100 text-gray-500'}">
            ${itemCount} เครื่อง
          </span>
        </td>
        <td class="p-3.5">
          <span class="px-2.5 py-1 rounded-full text-xs font-semibold ${
            s.status === 'อนุมัติแล้ว' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
          }">
            ${esc(s.status || 'อนุมัติแล้ว')}
          </span>
        </td>
        <td class="p-3.5 text-right">
          <button type="button" onclick="openSupplierDetailModalByCode('${esc(s.code)}')"
            class="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-2xs">
            ดูรายละเอียด
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function drawSupplierList() {
  drawSupplierListFullPage();
}

function openSupplierDetailModalByCode(code) {
  const sup = Suppliers.get(code);
  if (!sup) return;
  openSupplierDetailModal(sup);
}

function openSupplierDetailModal(sup) {
  activeDetailSupplier = sup;
  E('sd-company').textContent = sup.company;
  E('sd-code').textContent = sup.code;
  E('sd-tax').textContent = sup.taxId || '-';
  E('sd-contact').textContent = sup.contact || '-';
  E('sd-phone').textContent = sup.phone || '-';
  E('sd-email').textContent = sup.email || '-';
  E('sd-address').textContent = sup.address || '-';

  // Find their submitted items
  const all = Store.all();
  const items = all.filter(item => 
    (item.email || '').toLowerCase() === sup.email.toLowerCase() ||
    (item.values?.sup || '').toLowerCase().includes(sup.code.toLowerCase())
  );

  let totalVal = 0;
  items.forEach(it => totalVal += (parseFloat(it.values?.price) || 0));

  E('sd-item-count').textContent = items.length;
  E('sd-total-value').textContent = totalVal.toLocaleString('th-TH');

  const tableBody = E('sd-items-table');
  if (items.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-400">ยังไม่มีประวัติการส่งมอบเครื่องจักรในระบบ</td></tr>`;
  } else {
    tableBody.innerHTML = items.map(it => `
      <tr class="hover:bg-gray-50 transition-colors">
        <td class="p-2.5 text-gray-500 whitespace-nowrap">${fdt(it.at)}</td>
        <td class="p-2.5 font-bold text-gray-900">${esc(it.title)}</td>
        <td class="p-2.5 text-gray-600">${esc(it.values?.category || '-')}</td>
        <td class="p-2.5 font-mono text-emerald-800 font-semibold">${it.values?.price ? parseFloat(it.values.price).toLocaleString('th-TH') : '-'}</td>
        <td class="p-2.5 whitespace-nowrap">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold ${it.status === 'ส่งคืนให้ Buyer แก้ไข' ? 'bg-rose-100 text-rose-800' : it.status === 'รอ Buyer ตรวจ' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}">
            ${esc(it.status || 'ส่งแล้ว')}
          </span>
        </td>
      </tr>
    `).join('');
  }

  E('supplierDetailModal').classList.remove('hidden');
}

function closeSupplierDetailModal() {
  E('supplierDetailModal').classList.add('hidden');
}

function viewSupplierByEmail(email, supString) {
  let sup = Suppliers.get(email);
  if (!sup && supString) sup = Suppliers.get(supString);
  if (!sup) {
    sup = {
      code: 'SUP-NEW',
      company: supString || email,
      taxId: '-',
      contact: 'เจ้าหน้าที่ประสานงาน',
      phone: '-',
      email: email,
      address: '-',
      status: 'อนุมัติแล้ว'
    };
  }
  openSupplierDetailModal(sup);
}

function filterMainListBySupplier() {
  if (!activeDetailSupplier) return;
  closeSupplierDetailModal();
  closeSupplierModal();
  switchTableTab('subs');
  E('fQ').value = activeDetailSupplier.email;
  applyFilters();
  toast(`กรองแสดงเฉพาะรายการของ "${activeDetailSupplier.company}"`);
}

function openAddSupplierModal() {
  E('addSupplierModal').classList.remove('hidden');
  E('formAddSup').reset();
}

function closeAddSupplierModal() {
  E('addSupplierModal').classList.add('hidden');
}

function saveNewSupplier(e) {
  e.preventDefault();
  const company = E('add-company').value.trim();
  const taxId = E('add-tax').value.trim();
  const code = E('add-code').value.trim();
  const contact = E('add-contact').value.trim();
  const phone = E('add-phone').value.trim();
  const email = E('add-email').value.trim().toLowerCase();
  const address = E('add-address').value.trim();

  if (!/^\d{13}$/.test(taxId)) {
    alert('เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก');
    return;
  }

  Suppliers.save({
    code: code || undefined,
    company,
    taxId,
    contact,
    phone,
    email,
    address,
    status: 'อนุมัติแล้ว',
    registeredAt: Date.now()
  });

  closeAddSupplierModal();
  drawSupplierList();
  drawMetrics();
  toast(`เพิ่มคู่ค้า "${company}" เข้าสู่ระบบเรียบร้อย`);
}

function resetMockData() {
  Store.resetMock();
  subs = getFilteredSubs();
  drawMetrics();
  drawCategoryProgress();
  drawBuyerTable();
  drawSubsTable();
  toast('รีเซ็ตข้อมูลตัวอย่าง Mock Data สำเร็จ (' + subs.length + ' รายการ)');
}

/* ========================================================
   SIDEBAR & UI TOGGLES
   ======================================================== */
function toggleSidebar() {
  const sb = E('sidebar');
  if (sb) sb.classList.toggle('-translate-x-full');
}

function toggleNotifDropdown() {
  const dd = E('notifDropdown');
  if (dd) dd.classList.toggle('hidden');
}

function toggleUserDropdown() {
  const dd = E('userDropdown');
  if (dd) dd.classList.toggle('hidden');
}

function showAdminView(viewName, targetBuyerEmail) {
  if (!viewName || viewName === 'home') viewName = 'dashboard';

  const vDashboard = E('view-dashboard');
  const vPerms = E('view-buyer-perms');
  const vSuppliers = E('view-suppliers');

  if (vDashboard) vDashboard.classList.add('hidden');
  if (vPerms) vPerms.classList.add('hidden');
  if (vSuppliers) vSuppliers.classList.add('hidden');

  // Update sidebar active link states
  document.querySelectorAll('.sidebar-link').forEach(l => {
    l.classList.remove('active');
    const icon = l.querySelector('svg');
    if (icon) {
      icon.classList.remove('text-emerald-600');
      icon.classList.add('text-gray-500');
    }
  });

  if (viewName === 'dashboard') {
    if (vDashboard) vDashboard.classList.remove('hidden');
    const nav = E('nav-home');
    if (nav) {
      nav.classList.add('active');
      const icon = nav.querySelector('svg');
      if (icon) { icon.classList.remove('text-gray-500'); icon.classList.add('text-emerald-600'); }
    }
    drawMetrics();
    drawCategoryProgress();
    if (activeTableTab === 'buyers') drawBuyerTable();
    else drawSubsTable();
  } else if (viewName === 'perms') {
    if (vPerms) vPerms.classList.remove('hidden');
    const nav = E('nav-perms');
    if (nav) {
      nav.classList.add('active');
      const icon = nav.querySelector('svg');
      if (icon) { icon.classList.remove('text-gray-500'); icon.classList.add('text-emerald-600'); }
    }
    initBuyerPermsFullPage(targetBuyerEmail);
  } else if (viewName === 'suppliers') {
    if (vSuppliers) vSuppliers.classList.remove('hidden');
    const nav = E('nav-suppliers');
    if (nav) {
      nav.classList.add('active');
      const icon = nav.querySelector('svg');
      if (icon) { icon.classList.remove('text-gray-500'); icon.classList.add('text-emerald-600'); }
    }
    drawSupplierListFullPage();
  }

  // Scroll main container to top
  const mainEl = document.querySelector('main');
  if (mainEl) mainEl.scrollTop = 0;

  // Auto-close sidebar on mobile
  const sb = E('sidebar');
  if (sb && !sb.classList.contains('-translate-x-full') && window.innerWidth < 1024) {
    toggleSidebar();
  }
}

function navClick(type) {
  showAdminView(type);
}

/* ========================================================
   INITIAL SETUP
   ======================================================== */
if (SESSION) {
  if (E('who')) E('who').textContent = SESSION.name || 'Admin';
  if (E('dd-name')) E('dd-name').textContent = SESSION.name || 'Admin';
  if (E('dd-email')) E('dd-email').textContent = SESSION.email;
  if (E('lb')) E('lb').textContent = 'Admin';
  if (E('role-sublabel')) E('role-sublabel').textContent = 'ผู้ดูแลระบบ';

  // Populate filter dropdowns
  const fCatEl = E('fCat');
  if (fCatEl) {
    fCatEl.innerHTML = '<option value="">Category: ทั้งหมด</option>' + 
      CATN.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
  }

  const fBuyerEl = E('fBuyer');
  if (fBuyerEl) {
    const buyers = getBuyerAccounts();
    fBuyerEl.innerHTML = '<option value="">ค้นหา Buyer ทั้งหมด</option>' +
      buyers.map(b => `<option value="${esc(b.email)}">${esc(b.name)} (${esc(b.email)})</option>`).join('');
  }

  subs = getFilteredSubs();
  drawMetrics();
  drawCategoryProgress();
  switchTableTab('buyers');
}
