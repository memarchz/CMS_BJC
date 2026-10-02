const SESSION = Auth.require(['buyer', 'admin']);
let role = SESSION && SESSION.role;
let subs = [];

function getAccessibleSubs() {
  const all = Store.all();
  if (role === 'admin') return all;
  return all.filter(r => Permissions.canView(SESSION.email, r.values?.category, role));
}

function drawList() {
  const accessible = getAccessibleSubs();
  const m = new Map();
  accessible.forEach(r => m.set(r.id, r));
  const all = [...m.values()].sort((x, y) => y.at - x.at);

  const src = E('fSrc')?.value || '';
  const cat = E('fCat')?.value || '';
  const status = E('fStatus')?.value || '';
  const q = (E('fQ')?.value || '').toLowerCase().trim();

  const filtered = all.filter(r => {
    const matchSrc = !src || r.role === src;
    const matchCat = !cat || (r.values?.category || '').trim().toLowerCase() === cat.trim().toLowerCase();
    const matchStatus = !status || r.status === status;
    const matchQ = !q || 
      JSON.stringify(r.values || {}).toLowerCase().includes(q) || 
      (r.email || '').toLowerCase().includes(q) || 
      (r.title || '').toLowerCase().includes(q) ||
      (r.returnReason || '').toLowerCase().includes(q);
    return matchSrc && matchCat && matchStatus && matchQ;
  });

  // Calculate Stat counts
  const waitCount = all.filter(r => r.status === 'รอ Buyer ตรวจ').length;
  const revCount = all.filter(r => r.status === 'ตรวจ/แก้ไขแล้ว').length;
  const supCount = all.filter(r => r.role === 'supplier').length;
  const returnedCount = all.filter(r => r.status === 'ส่งคืนให้ Buyer แก้ไข').length;

  // 4 Stat Cards (Original Buyer Design)
  const statsEl = E('stats');
  if (statsEl) {
    statsEl.innerHTML = [
      ['ทั้งหมด', all.length, 'text-gray-900'],
      ['รอ Buyer ตรวจ', waitCount, 'text-amber-600'],
      ['ตรวจ/แก้ไขแล้ว', revCount, 'text-emerald-700'],
      ['จาก Supplier', supCount, 'text-blue-700']
    ].map(([l, n, col]) => `
      <div class="bg-white rounded-2xl shadow-xs p-4 border border-gray-100">
        <div class="text-xs text-gray-500 font-medium">${l}</div>
        <div class="text-3xl font-bold ${col} mt-1">${n}</div>
      </div>
    `).join('');
  }

  // Returned documents alert banner for Buyer
  const alertBanner = E('buyer-returned-alert');
  if (alertBanner) {
    if (returnedCount > 0) {
      alertBanner.classList.remove('hidden');
      E('buyer-returned-text').textContent = `พบ ${returnedCount} รายการที่ Admin ส่งคืนและรอการตรวจสอบ/แก้ไขของคุณ`;
    } else {
      alertBanner.classList.add('hidden');
    }
  }

  // Category Bar Chart (Original Buyer Design)
  const cnt = {};
  all.forEach(r => {
    const c = r.values?.category || 'ไม่ระบุ';
    cnt[c] = (cnt[c] || 0) + 1;
  });
  const mx = Math.max(1, ...Object.values(cnt));

  const barsEl = E('bars');
  if (barsEl) {
    barsEl.innerHTML = Object.keys(cnt).length ?
      Object.entries(cnt).sort((x, y) => y[1] - x[1]).map(([c, n]) => `
        <div class="flex items-center gap-3 text-sm">
          <div class="w-48 shrink-0 truncate text-gray-700 font-medium">${esc(c)}</div>
          <div class="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
            <div class="h-full bg-green-600 rounded-full transition-all" style="width:${(n / mx) * 100}%"></div>
          </div>
          <div class="w-8 text-right font-semibold text-gray-900">${n}</div>
        </div>
      `).join('') : '<p class="text-sm text-gray-500">ยังไม่มีข้อมูล</p>';
  }

  // Empty state
  const emptyEl = E('empty');
  if (emptyEl) {
    emptyEl.classList.toggle('hidden', filtered.length > 0);
    const buyerCats = (role === 'buyer') ? Permissions.get(SESSION.email) : ['all'];
    const emptyMsg = emptyEl.querySelector('p');
    if (emptyMsg) {
      if (role === 'buyer' && (!buyerCats || buyerCats.length === 0)) {
        emptyMsg.textContent = 'บัญชีของคุณยังไม่ได้รับมอบหมายสิทธิ์ใน Category ใด จึงไม่สามารถแสดงรายการได้ (กรุณาติดต่อ Admin)';
      } else {
        emptyMsg.textContent = 'ยังไม่มีรายการที่ส่งเข้ามาตามเงื่อนไขที่เลือก';
      }
    }
  }

  // Table rows rendering
  const rowsEl = E('rows');
  if (rowsEl) {
    rowsEl.innerHTML = filtered.map((r, i) => {
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
        <tr class="border-t hover:bg-gray-50 transition-colors ${isReturned ? 'bg-rose-50/30' : ''}">
          <td class="p-3 whitespace-nowrap text-gray-500 text-xs">${fdt(r.at)}</td>
          <td class="p-3">
            <div class="font-semibold text-gray-900">${esc(r.title)}</div>
            ${r.returnReason ? `<div class="text-[11px] text-rose-600 mt-0.5 truncate max-w-xs font-medium">หมายเหตุส่งคืน: "${esc(r.returnReason)}"</div>` : ''}
          </td>
          <td class="p-3 text-gray-700">
            <span class="inline-flex items-center px-2 py-0.5 rounded-lg bg-gray-100 text-xs font-medium">
              ${esc(r.values?.category || '-')}
            </span>
          </td>
          <td class="p-3 text-gray-600 text-xs">${esc(r.values?.subCat || '-')}</td>
          <td class="p-3 text-gray-600 text-xs">
            <div class="font-medium text-gray-800">${esc(r.values?.sup?.split('/')[1]?.trim() || r.email)}</div>
            <div class="text-gray-400 font-mono text-[11px]">${esc(r.email)}</div>
          </td>
          <td class="p-3 whitespace-nowrap">${statusBadge}</td>
          <td class="p-3 text-right whitespace-nowrap">
            <button onclick="view(${i})" class="text-gray-700 hover:text-green-700 hover:underline mr-3 font-medium text-xs">ดู</button>
            <button onclick="editSub(${i})" class="text-green-700 hover:text-green-900 font-semibold hover:underline text-xs">แก้ไข</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  window._a = filtered;
}

function filterReturnedOnly() {
  const el = E('fStatus');
  if (el) el.value = 'ส่งคืนให้ Buyer แก้ไข';
  drawList();
}

function view(i) {
  const r = window._a[i];
  if (!r) return;

  E('m-t').textContent = r.title;
  E('m-s').innerHTML = esc(fdt(r.at) + ' / ' + r.email) + 
    (r.updatedBy ? '<br><span class="text-green-700">แก้ไขล่าสุด ' + esc(fdt(r.updatedAt) + ' โดย ' + r.updatedBy) + '</span>' : '');

  // Return Notice inside modal
  const retBox = E('modal-return-box');
  if (retBox) {
    if (r.status === 'ส่งคืนให้ Buyer แก้ไข' || r.returnReason) {
      retBox.classList.remove('hidden');
      E('modal-return-reason').textContent = r.returnReason || '-';
      E('modal-return-meta').textContent = `ส่งคืนเมื่อ: ${fdt(r.returnedAt || r.at)} โดย ${r.returnedBy || 'Admin'} ${r.assignedBuyer ? '(มอบหมายให้: ' + r.assignedBuyer + ')' : ''}`;
    } else {
      retBox.classList.add('hidden');
    }
  }

  E('m-b').innerHTML = `
    <dl class="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm max-h-[60vh] overflow-y-auto p-1">
      ${Object.entries(r.values || {}).filter(([k, v]) => v != null && v !== '').map(([k, v]) => `
        <div class="border-b border-gray-100 pb-2">
          <dt class="text-gray-500 text-xs font-medium">${esc(r.labels?.[k] || (typeof LABELS_MAP !== 'undefined' ? LABELS_MAP[k] : k) || k)}</dt>
          <dd class="font-semibold text-gray-900 break-words mt-0.5">${esc(v)}</dd>
        </div>
      `).join('')}
    </dl>
    <div class="flex justify-end gap-2 mt-5 pt-3 border-t">
      <button onclick="E('modal').classList.add('hidden')" class="border rounded-xl px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">ปิด</button>
      <button onclick="editSub(${i})" class="bg-green-700 hover:bg-green-800 text-white rounded-xl px-5 py-2 text-sm font-semibold shadow-sm transition-colors">แก้ไขรายการนี้</button>
    </div>
  `;
  E('modal').classList.remove('hidden');
}

function editSub(i) {
  const item = window._a[i];
  if (!item) return;
  if (role === 'buyer' && !Permissions.canView(SESSION.email, item.values?.category, role)) {
    toast('คุณไม่มีสิทธิ์เข้าถึงหรือแก้ไขรายการในหมวด ' + (item.values?.category || ''));
    return;
  }
  sessionStorage.setItem('edit_id', item.id);
  location.href = 'form.html?edit=' + encodeURIComponent(item.id);
}

function resetMockData() {
  Store.resetMock();
  drawList();
  toast('รีเซ็ตข้อมูลตัวอย่างเรียบร้อย');
}

/* ========================================================
   INITIAL SETUP
   ======================================================== */
if (SESSION) {
  if (E('who')) E('who').textContent = SESSION.name || (role === 'admin' ? 'Admin' : 'Buyer');
  if (E('lb')) E('lb').textContent = role === 'admin' ? 'Admin' : 'Buyer';

  if (role === 'admin') {
    const adminLink = E('admin-switch-link');
    if (adminLink) adminLink.classList.remove('hidden');
  }

  // Populate Category Filter dropdown and Scope Banner
  if (role === 'buyer') {
    const allowed = Permissions.get(SESSION.email);
    const banner = E('buyer-perm-banner');
    const tagsContainer = E('buyer-perm-tags');

    if (banner && tagsContainer) {
      banner.classList.remove('hidden');
      if (allowed.length === 0) {
        tagsContainer.innerHTML = '<span class="text-xs text-rose-700 bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg font-medium">ยังไม่ได้รับมอบหมายสิทธิ์ Category ใด (กรุณาติดต่อ Admin)</span>';
      } else {
        tagsContainer.innerHTML = allowed.map(cat => `
          <span class="inline-flex items-center text-xs px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-medium border border-emerald-200">
            ${esc(cat)}
          </span>
        `).join('');
      }
    }

    const fCatEl = E('fCat');
    if (fCatEl) {
      fCatEl.innerHTML = '<option value="">Category: ทั้งหมดตามสิทธิ์</option>' +
        allowed.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
    }
  } else {
    // Admin viewing submissions
    const fCatEl = E('fCat');
    if (fCatEl) {
      fCatEl.innerHTML = '<option value="">Category: ทั้งหมด</option>' +
        CATN.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
    }
  }

  drawList();
}
