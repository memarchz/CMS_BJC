const SESSION = Auth.require(['supplier', 'buyer', 'admin']);
let role = SESSION && SESSION.role, step = 0, F = {}, editing = null;
const gf = g => g.f.filter(x => !x.only || x.only.includes(role));
const mySteps = () => STEPS.filter(s => s.roles.includes(role));
const allF = () => mySteps().flatMap(s => s.groups.flatMap(g => gf(g)));
// ช่องที่ถูกซ่อนตาม Category ที่เลือก (HIDE อยู่ใน data.js)
const hiddenKeys = () => new Set(HIDE[(E('category')?.value || '').trim()] || []);
const vis = x => !hiddenKeys().has(x.k);

function fieldHTML(x) {
  const badge = x.r == 'r' ? '<span class="text-red-500">*</span>' : x.r == 'o' ? '<span class="ml-1 text-[10px] bg-gray-200 text-gray-700 rounded px-1.5 py-0.5">แนะนำ</span>' : x.r == 'n' ? '<span class="ml-1 text-[10px] bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">ถ้ามี</span>' : '<span class="ml-1 text-[10px] bg-green-100 text-green-600 rounded px-1.5 py-0.5">คำนวณอัตโนมัติ</span>';
  let inp;
  if (x.t == 'select') {
    let opts = x.o || [];
    if (x.k === 'category' && role === 'buyer') {
      const allowed = Permissions.get(SESSION.email);
      opts = opts.filter(cat => allowed.some(a => String(a).trim().toLowerCase() === String(cat).trim().toLowerCase()));
    }
    const ph = x.k === 'subCat' ? '-- เลือก Sub Category --' : '-- เลือก --';
    inp = `<select id="${x.k}" class="inp"><option value="">${ph}</option>${opts.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('')}</select>`;
  }
  else if (x.t == 'textarea') inp = `<textarea id="${x.k}" rows="3" class="inp" placeholder="${x.p}"></textarea>`;
  else if (x.t == 'file') inp = `<label class="flex items-center gap-3 inp cursor-pointer" id="${x.k}_box"><input type="file" multiple class="hidden" onchange="fileChg('${x.k}',this)"><span class="bg-gray-100 rounded-lg px-3 py-1 text-sm">เลือกไฟล์</span><span id="${x.k}_n" class="text-sm text-gray-500 truncate">${x.p}</span></label>`;
  else if (x.t == 'calc') inp = `<input id="${x.k}" class="inp font-semibold" readonly placeholder="${x.p || 'รอข้อมูล...'}">`;
  else inp = `<input id="${x.k}" type="${x.t}" class="inp" placeholder="${x.p}" ${x.k == 'assetCode' ? 'readonly' : ''} value="${x.o ?? ''}">`;
  const wide = x.t == 'textarea' || x.t == 'file' ? 'sm:col-span-2' : '';
  return `<div id="${x.k}_wrap" class="${wide}"><label id="${x.k}_label" class="block text-sm font-medium mb-1">${x.l} ${badge}</label>${inp}</div>`;
}

function buildForm() {
  const st = mySteps(); step = 0; F = {};
  E('f-badge').className = 'text-xs px-2.5 py-1 rounded-full ' + RL[role][2]; E('f-badge').textContent = RL[role][1];
  E('steps').innerHTML = st.map((s, i) => `<div class="step hidden fadein" data-i="${i}"><h2 class="text-2xl font-bold mb-4">${s.title}</h2>${s.groups.map(g => `<div class="grp bg-white rounded-2xl shadow-sm mb-5 overflow-hidden"><div class="${g.c} text-white font-semibold px-5 py-3">${g.t}</div><div class="p-5 grid sm:grid-cols-2 gap-4">${gf(g).map(fieldHTML).join('')}</div></div>`).join('')}</div>`).join('');

  E('steps').oninput = e => {
    if (e.target.id == 'category') updateSub();
    calc(); refresh();
  };
  E('steps').onchange = e => {
    if (e.target.id == 'category') updateSub();
    if (e.target.id == 'subCat') e.target.classList.remove('bad');
    calc(); refresh();
  };

  if (E('backList')) {
    E('backList').classList.toggle('hidden', role == 'supplier');
    E('backList').href = role === 'admin' ? 'admin.html' : 'submissions.html';
  }
  updateSub();
  calc(); render();
}

function updateSub() {
  const catEl = E('category'), subEl = E('subCat'), subLbl = E('subCat_label');
  if (!catEl || !subEl) return;
  const c = catEl.value;
  const subList = CATS[c] || [];
  const hasSub = subList.length > 0;


  STEPS.forEach(s => s.groups.forEach(g => g.f.forEach(field => {
    if (field.k === 'subCat') {
      field.r = hasSub ? 'r' : 'n';
    }
  })));

  if (hasSub) {
    subEl.disabled = false;
    subEl.classList.remove('bg-gray-100', 'cursor-not-allowed');
    if (subLbl) {
      subLbl.innerHTML = 'Sub Category <span class="text-red-500">*</span>';
    }
    const curVal = subEl.value;
    subEl.innerHTML = '<option value="">-- เลือก Sub Category --</option>' + subList.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
    if (curVal && subList.includes(curVal)) {
      subEl.value = curVal;
    }
  } else {
    subEl.value = '';
    subEl.disabled = true;
    subEl.classList.remove('bad');
    subEl.classList.add('bg-gray-100', 'cursor-not-allowed');
    if (subLbl) {
      subLbl.innerHTML = 'Sub Category <span class="ml-1 text-[10px] bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">ไม่มี Sub Category</span>';
    }
    subEl.innerHTML = '<option value="">-- ไม่มี Sub Category --</option>';
  }
  applyHide();
}

function applyHide() {
  const hid = hiddenKeys();
  allF().forEach(x => { const w = E(x.k + '_wrap'); if (w) w.style.display = hid.has(x.k) ? 'none' : ''; });
  document.querySelectorAll('.grp').forEach(g => {
    const cells = [...g.querySelectorAll('[id$="_wrap"]')];
    g.style.display = cells.length && cells.every(c => c.style.display === 'none') ? 'none' : '';
  });
  if (typeof refresh === 'function' && E('tabs')) refresh();
}

function fileChg(k, el) { F[k] = [...el.files].map(f => f.name).join(', '); setFile(k) }
function setFile(k) { const n = E(k + '_n'); if (F[k]) { n.textContent = F[k]; n.className = 'text-sm text-green-600 truncate font-medium' } E(k + '_box').classList.remove('bad'); refresh() }
const val = x => x.t == 'file' ? (F[x.k] || '') : (E(x.k)?.value || '').trim();
const num = k => parseFloat(E(k)?.value) || 0;
const fmt = (n, d = 0) => n.toLocaleString('th-TH', { maximumFractionDigits: d });

function calc() {
  const tco = E('tco'); if (!tco) return;
  const kwhY = num('energy') * num('hrs'), life = num('life');
  const energyCost = kwhY * 4.5 * life;
  tco.value = num('price') ? fmt(num('price') + num('maint') * life + num('cons') * life + energyCost - num('price') * num('resid') / 100) + ' THB' : '';
  const y = kwhY * num('ef') / 1000;
  E('co2y').value = y ? fmt(y, 2) : ''; E('co2l').value = y && life ? fmt(y * life, 2) : '';
  E('cval').value = y && life && num('cprice') ? fmt(y * life * num('cprice')) + ' THB' : '';
}

function refresh() {
  const req = allF().filter(x => x.r == 'r' && vis(x));
  const done = req.filter(x => val(x)).length, p = Math.round(done / req.length * 100);
  E('pct').textContent = p + '%'; E('bar').style.width = p + '%';
  E('tabs').innerHTML = mySteps().map((s, i) => {
    const rq = s.groups.flatMap(g => gf(g)).filter(x => x.r == 'r' && vis(x)), ok = rq.every(x => val(x));
    return `<button onclick="step=${i};render()" class="shrink-0 text-sm rounded-full px-4 py-1.5 border ${i == step ? 'bg-green-700 text-white border-green-700 font-semibold' : 'bg-white hover:bg-gray-50 text-gray-700'}">${(i + 1) + '.'} ${s.title}${ok && rq.length ? ' (ครบ)' : ''}</button>`
  }).join('');
}

function render() {
  document.querySelectorAll('.step').forEach(d => d.classList.toggle('hidden', +d.dataset.i != step));
  const n = mySteps().length;
  E('prev').style.visibility = step ? 'visible' : 'hidden';
  const nx = E('next'); nx.textContent = step == n - 1 ? 'ส่งข้อมูล ' : 'ถัดไป →';
  scrollTo(0, 0); refresh();
}

function go(d) {
  const n = mySteps().length;
  if (d > 0 && step == n - 1) return submit();
  step = Math.min(n - 1, Math.max(0, step + d)); render();
}

function submit() {
  const miss = allF().filter(x => x.r == 'r' && vis(x) && !val(x));
  document.querySelectorAll('.bad').forEach(e => e.classList.remove('bad'));
  if (!miss.length) { const ed = !!editing; save(); E('done-t').textContent = ed ? 'บันทึกการแก้ไขเรียบร้อย รายการถูกอัปเดตในหน้ารายการที่ส่งมา' : (role == 'supplier' ? 'ส่งข้อมูลให้ Buyer ตรวจสอบเรียบร้อย' : 'บันทึกข้อมูลเรียบร้อย'); return E('done').classList.remove('hidden') }
  miss.forEach(x => E(x.k + (x.t == 'file' ? '_box' : '')).classList.add('bad'));
  const first = miss[0], si = mySteps().findIndex(s => s.groups.some(g => gf(g).includes(first)));
  step = si; render();
  setTimeout(() => { const el = E(first.k + (first.t == 'file' ? '_box' : '')); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus?.() }, 50);
  toast('ยังขาดช่องบังคับอีก ' + miss.length + ' ช่อง');
}

function autofill() {
  let c = 0;
  allF().forEach(x => {
    const v = S[x.k]; if (v === undefined) return;
    if (x.t == 'file') { F[x.k] = v; setFile(x.k) } else { E(x.k).value = v }
    c++;
  });
  updateSub();
  if (S.subCat && E('subCat')) E('subCat').value = S.subCat;
  calc(); refresh(); toast('กรอกข้อมูลตัวอย่างให้แล้ว ' + c + ' ช่อง ตรวจสอบและแก้ไขได้');
}

function save() {
  const values = {}, labels = {}; allF().forEach(x => { if (x.t != 'calc' && vis(x)) { values[x.k] = val(x); labels[x.k] = x.l } });
  const mail = SESSION.email; let rec;
  if (editing) rec = {
    ...editing,
    values: { ...editing.values, ...values },
    labels: { ...editing.labels, ...labels },
    status: 'ตรวจ/แก้ไขแล้ว',
    updatedAt: Date.now(),
    updatedBy: mail,
    fixedAt: Date.now(),
    returnedFixed: editing.status === 'ส่งคืนให้ Buyer แก้ไข'
  };
  else rec = { id: 's' + Date.now(), role, email: mail, at: Date.now(), status: role == 'supplier' ? 'รอ Buyer ตรวจ' : 'ส่งแล้ว', values, labels };
  rec.title = rec.values.assetName || rec.values.model2 || rec.values.sup || '(ไม่มีชื่อ)';
  Store.put(rec);
}

function doneBack() { location.href = role == 'supplier' ? 'form.html' : (role == 'admin' ? 'admin.html' : 'submissions.html'); }

function init() {
  buildForm(); E('who').textContent = SESSION.name;
  const eid = new URLSearchParams(location.search).get('edit') || sessionStorage.getItem('edit_id');
  sessionStorage.removeItem('edit_id');
  const r = role != 'supplier' && eid && Store.all().find(x => x.id == eid);
  if (r) {
    if (role === 'buyer' && !Permissions.canView(SESSION.email, r.values?.category, role)) {
      alert('คุณไม่มีสิทธิ์เข้าถึงหรือแก้ไขรายการในหมวด "' + (r.values?.category || 'ไม่ระบุ') + '"\nเนื่องจากอยู่นอกเหนือสิทธิ์ Category ที่ Admin กำหนดให้');
      location.replace('submissions.html');
      return;
    }
    editing = r;
    allF().forEach(x => { const v = r.values[x.k]; if (v === undefined || v === '') return; if (x.t == 'file') { F[x.k] = v; setFile(x.k) } else E(x.k).value = v });
    updateSub();
    if (r.values.subCat && E('subCat')) E('subCat').value = r.values.subCat;
    calc(); refresh();
    const b = E('editbar'); b.classList.remove('hidden'); b.firstElementChild.textContent = 'กำลังแก้ไข: ' + r.title + ' (ส่งโดย ' + r.email + ') ตรวจแล้วกดส่งข้อมูลเพื่อบันทึก';


    const returnBanner = E('return-alert-banner');
    if (returnBanner) {
      if (r.status === 'ส่งคืนให้ Buyer แก้ไข' || r.returnReason) {
        returnBanner.classList.remove('hidden');
        E('return-alert-reason').textContent = r.returnReason || 'โปรดตรวจสอบความถูกต้องของข้อมูลและเอกสารแนบตามที่ได้รับแจ้ง';
        E('return-alert-meta').textContent = `ส่งคืนเมื่อ: ${fdt(r.returnedAt || r.at)} โดย ${r.returnedBy || 'Admin'}`;
      } else {
        returnBanner.classList.add('hidden');
      }
    }
  } else if (role == 'supplier') { E('sup').value = (SESSION.code ? SESSION.code + ' / ' : '') + SESSION.name; refresh() }
}

/* ========================================================
   PHOTO UPLOAD & LIVE CAMERA CAPTURE (AI NAMEPLATE SCANNER)
   ======================================================== */
const PHOTO_PRESETS = {
  daikin: {
    title: 'Daikin Inverter FTV50 Series',
    brand: 'Daikin Industries, Ltd. (Japan)',
    model: 'FTV50QV1V',
    serial: 'DK26X-001234',
    data: {
      assetName: 'ตู้แช่เย็น Daikin Inverter FTV50',
      category: 'Refrigeration system',
      subCat: '',
      brand: 'Daikin',
      model: 'FTV50QV1V',
      serial: 'DK26X-001234',
      mtnCode: 'REF-1-1-0-001',
      po: 'PO-2026-004512',
      mfr: 'Daikin Industries, Ltd. (Japan)',
      series: 'Inverter FTV Series',
      model2: 'FTV50QV1V',
      serial2: 'DK26X-001234',
      origin: 'Japan',
      mfgDate: '2026-03',
      cap: '18,000 BTU / 2.5 kW',
      power: '380V 3P 50Hz / 2.5 kW',
      util: 'น้ำหล่อเย็น 0.5 ลบ.ม./ชม.',
      dim: '900×320×290 มม. / 38 กก.',
      opc: '0-43°C, RH ≤ 85%',
      std: 'มอก. 1155 / CE / ISO 9001 เลขที่ TH-2026-0456',
      func: 'ปรับอุณหภูมิ 2-6°C สำหรับแช่อาหารสด, ระบบละลายน้ำแข็งอัตโนมัติ Defrost Cycle',
      docs: 'Daikin_Catalog_FTV50.pdf, nameplate_daikin.jpg',
      wStart: '2026-04-01',
      wEnd: '2029-03-31',
      wScope: 'อะไหล่+ค่าแรง',
      wCond: 'ใช้อะไหล่แท้ Daikin เท่านั้น และต้องตรวจเช็คตามระยะเวลาที่กำหนด',
      wExt: '12,000 / ปี',
      sla: 'ตอบรับ 4 / แก้ไข 24',
      svc: 'Daikin Service Call Center / 02-123-4567 / service@daikin.co.th',
      train: 'อบรมช่างบำรุงรักษา 4 ชม./ครั้ง พร้อมมอบคู่มือการใช้งาน',
      spDocs: 'SparePartList_FTV50.xlsx',
      spClass: 'Critical',
      spCur: 'THB',
      spInt: '8,000 ชม.',
      lead: '15 วัน (มี Stock ในไทย)',
      minStock: 2,
      avail: 10,
      life: 10,
      hrs: 8760,
      design: '87,600 ชม. / ใช้งานต่อเนื่อง 24 ชม.',
      econ: 8,
      overhaul: 'ปีที่ 6 / งบประมาณ 45,000 THB',
      resid: 10,
      eos: 2038,
      disp: 'ถ่ายสารทำความเย็น R-410A ก่อนทิ้ง ส่งโรงงานรีไซเคิลที่ได้รับอนุญาต',
      price: 180000,
      maint: 12000,
      pm: '2,500 / ครั้ง × 4 ครั้ง/ปี',
      cons: 3500,
      labor: 450,
      energy: 2.5,
      esc: 3,
      ef: 0.4999,
      cprice: 200
    }
  },
  trane: {
    title: 'Trane CenTraVac Chiller 500 Ton',
    brand: 'Trane Commercial Systems, USA',
    model: 'CVHE-0500',
    serial: 'TRN-2026-CH098',
    data: {
      assetName: 'เครื่องทำน้ำเย็น Chiller Trane 500 Ton',
      category: 'Chiller',
      subCat: '',
      brand: 'Trane',
      model: 'CVHE-0500',
      serial: 'TRN-2026-CH098',
      mtnCode: 'CHL-1-1-0-002',
      po: 'PO-2026-003881',
      mfr: 'Trane Commercial Systems, USA',
      series: 'CenTraVac Series',
      model2: 'CVHE-0500',
      serial2: 'TRN-2026-CH098',
      origin: 'USA',
      mfgDate: '2025-11',
      cap: '500 RT / 1,758 kW',
      power: '380V 3P 50Hz / 350 kW',
      util: 'น้ำหล่อเย็น Cooling Tower 1,500 GPM',
      dim: '4,800×2,400×2,600 มม. / 8,500 กก.',
      opc: 'ห้องเครื่อง Chiller Room 15-35°C',
      std: 'AHRI 550/590, ASME Section VIII, มอก.',
      func: 'ปรับโหลดการทำความเย็นอัตโนมัติด้วย VFD 10-100%, ควบคุมผ่านระบบ BAS/BMS',
      docs: 'Trane_CVHE_Submittal.pdf, Commissioning_Report.pdf',
      wStart: '2026-01-15',
      wEnd: '2029-01-14',
      wScope: 'อะไหล่+ค่าแรง',
      wCond: 'ต้องบำรุงรักษาโดยช่างผู้เชี่ยวชาญจาก Trane Thailand เท่านั้น',
      wExt: '150,000 / ปี',
      sla: 'ตอบรับ 2 / แก้ไข 12',
      svc: 'Trane Call Center 24hr / 02-704-9999',
      train: 'อบรมการใช้งานและการแก้ไขปัญหาเบื้องต้น 16 ชม.',
      spDocs: 'Trane_CVHE_SpareParts.xlsx',
      spClass: 'Critical',
      spCur: 'THB',
      spInt: '10,000 ชม.',
      lead: '30 วัน',
      minStock: 1,
      avail: 15,
      life: 25,
      hrs: 6500,
      design: '162,500 ชม.',
      econ: 20,
      overhaul: 'ปีที่ 10 / 850,000 THB',
      resid: 5,
      eos: 2050,
      disp: 'ดูดเก็บสารทำความเย็น R-1233zd ตามมาตรฐานสิ่งแวดล้อมสากล',
      price: 4200000,
      maint: 180000,
      pm: '25,000 / ครั้ง × 4 ครั้ง/ปี',
      cons: 45000,
      labor: 600,
      energy: 280,
      esc: 2.5,
      ef: 0.4999,
      cprice: 200
    }
  },
  schneider: {
    title: 'Schneider VarSet Direct 400kVAR',
    brand: 'Schneider Electric (France)',
    model: 'VarSet Direct 400',
    serial: 'SE-2026-CB-400-88',
    data: {
      assetName: 'Schneider MDB & Cap Bank 400kVAR',
      category: 'Electrical system',
      subCat: 'Cap bank',
      brand: 'Schneider Electric',
      model: 'VarSet Direct 400',
      serial: 'SE-2026-CB-400-88',
      mtnCode: 'ELE-1-1-0-003',
      po: 'PO-2026-001889',
      mfr: 'Schneider Electric (France)',
      series: 'VarSet Series',
      model2: 'VarSet Direct 400',
      serial2: 'SE-2026-CB-400-88',
      origin: 'France',
      mfgDate: '2025-12',
      cap: '400 kVAR / 400V 50Hz (8 Steps)',
      power: '400V 3P 50Hz',
      util: 'พัดลมระบายความร้อนในตัวตู้คอนโทรล',
      dim: '800×600×2,000 มม. / 420 กก.',
      opc: 'ห้องไฟฟ้าควบคุมอุณหภูมิ ไม่เกิน 40°C',
      std: 'IEC 61439-1/-2, IEC 61921',
      func: 'ปรับปรุงค่าตัวประกอบกำลัง (Power Factor > 0.95) อัตโนมัติ ป้องกันค่าปรับจากการไฟฟ้า',
      docs: 'Schneider_VarSet_Catalog.pdf, Single_Line_Diagram.dwg',
      wStart: '2026-01-01',
      wEnd: '2029-01-01',
      wScope: 'อะไหล่+ค่าแรง',
      wCond: 'ติดตั้งและทดสอบโดยวิศวกรไฟฟ้าที่ได้รับใบอนุญาต',
      wExt: '35,000 / ปี',
      sla: 'ตอบรับ 2 / แก้ไข 12',
      svc: 'Schneider Customer Care Center / 02-617-5555',
      train: 'การตั้งค่าไมโครโปรเซสเซอร์ Varplus Logic Controller 4 ชม.',
      spDocs: 'Capacitor_Can_Spares.pdf',
      spClass: 'Critical',
      spCur: 'THB',
      spInt: '25,000 ชม.',
      lead: '20 วัน',
      minStock: 2,
      avail: 12,
      life: 12,
      hrs: 8760,
      design: '105,120 ชม.',
      econ: 10,
      overhaul: 'ปีที่ 6 (เปลี่ยนชุดตัวเก็บประจุ) / 120,000 THB',
      resid: 5,
      eos: 2038,
      disp: 'แยกชิ้นส่วนทองแดง เหล็ก และตัวเก็บประจุส่งโรงงานบำบัดกากอุตสาหกรรม',
      price: 580000,
      maint: 25000,
      pm: '6,000 / ครั้ง × 2 ครั้ง/ปี',
      cons: 4000,
      labor: 500,
      energy: 0.1,
      esc: 2.5,
      ef: 0.4999,
      cprice: 200
    }
  },
  hikvision: {
    title: 'Hikvision DarkFighter NVR 32CH',
    brand: 'Hikvision Digital Technology',
    model: 'DS-9632NI-I8',
    serial: 'HKV-2026-NVR32-09',
    data: {
      assetName: 'ระบบกล้อง CCTV 4K และ NVR 32CH',
      category: 'Safety Equipment',
      subCat: 'CCTV',
      brand: 'Hikvision',
      model: 'DS-9632NI-I8',
      serial: 'HKV-2026-NVR32-09',
      mtnCode: 'SEC-2-1-0-005',
      po: 'PO-2026-005119',
      mfr: 'Hikvision Digital Technology',
      series: 'Pro Series NVR DarkFighter',
      model2: 'DS-9632NI-I8',
      serial2: 'HKV-2026-NVR32-09',
      origin: 'China',
      mfgDate: '2026-01',
      cap: '32 Channels 4K (12MP) / 8 SATA HDDs รวม 80TB',
      power: '220V 1P 50Hz / 300W',
      util: 'LAN Gigabit PoE Switch 10Gbps Uplink',
      dim: '445×400×90 มม. (2U Rack) / 12.5 กก.',
      opc: 'ห้องแอร์ Server Room 18-25°C',
      std: 'CE, FCC, UL, มอก. 1195',
      func: 'บันทึกภาพตลอด 24 ชม., AI คัดกรองคนและยานพาหนะ, ระบบแจ้งเตือนบุกรุกแบบเรียลไทม์',
      docs: 'Hikvision_NVR_Datasheet.pdf, CCTV_Layout_Diagram.pdf',
      wStart: '2026-02-01',
      wEnd: '2029-01-31',
      wScope: 'On-site',
      wCond: 'ไม่รวมความเสียหายจากฟ้าผ่าและไฟกระชาก',
      wExt: '18,000 / ปี',
      sla: 'ตอบรับ 4 / แก้ไข 24',
      svc: 'Security Solutions Hot Line / 02-999-8888',
      train: 'อบรมเจ้าหน้าที่ฝ่ายความปลอดภัย 8 ชม.',
      spDocs: 'HDD_WD_Purple_Enterprise.pdf',
      spClass: 'Wear part',
      spCur: 'THB',
      spInt: '35,000 ชม.',
      lead: '7 วัน',
      minStock: 2,
      avail: 7,
      life: 7,
      hrs: 8760,
      design: '61,320 ชม. ต่อเนื่อง 24/7',
      econ: 5,
      overhaul: 'ปีที่ 4 (เปลี่ยน HDD ทั้งหมด) / 95,000 THB',
      resid: 0,
      eos: 2033,
      disp: 'ทำลายข้อมูลใน Harddisk ตามมาตรฐาน PDPA ก่อนส่งกำจัด E-waste',
      price: 340000,
      maint: 24000,
      pm: '3,500 / ครั้ง × 2 ครั้ง/ปี',
      cons: 5000,
      labor: 500,
      energy: 0.35,
      esc: 2,
      ef: 0.4999,
      cprice: 200
    }
  }
};

let camStream = null;
let camFacing = 'environment';
let activeScannedImage = null;
let activeScannedData = null;

function generateNameplateSVG(brand, model, serial, power, cap) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340">
    <defs>
      <linearGradient id="metal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e293b"/>
        <stop offset="50%" stop-color="#334155"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
      <linearGradient id="plate" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#f8fafc"/>
        <stop offset="100%" stop-color="#e2e8f0"/>
      </linearGradient>
    </defs>
    <rect width="600" height="340" rx="16" fill="url(#metal)" stroke="#475569" stroke-width="4"/>
    <circle cx="20" cy="20" r="7" fill="#64748b" stroke="#334155" stroke-width="2"/>
    <circle cx="580" cy="20" r="7" fill="#64748b" stroke="#334155" stroke-width="2"/>
    <circle cx="20" cy="320" r="7" fill="#64748b" stroke="#334155" stroke-width="2"/>
    <circle cx="580" cy="320" r="7" fill="#64748b" stroke="#334155" stroke-width="2"/>
    <rect x="35" y="35" width="530" height="270" rx="10" fill="url(#plate)" stroke="#cbd5e1" stroke-width="2"/>
    <rect x="35" y="35" width="530" height="50" rx="10" fill="#047857"/>
    <text x="55" y="68" font-family="'Prompt', sans-serif" font-weight="bold" font-size="19" fill="#ffffff">SPECIFICATION NAMEPLATE</text>
    <text x="540" y="68" font-family="'Prompt', sans-serif" font-size="13" fill="#a7f3d0" text-anchor="end">CERTIFIED INDUSTRIAL</text>
    <g font-family="'Prompt', monospace, sans-serif" font-size="13" fill="#0f172a">
      <text x="55" y="115" font-weight="bold" fill="#64748b">MANUFACTURER / BRAND:</text>
      <text x="250" y="115" font-weight="bold" font-size="14" fill="#047857">${esc(brand)}</text>
      <text x="55" y="145" font-weight="bold" fill="#64748b">MODEL NO.:</text>
      <text x="250" y="145" font-weight="bold" font-size="15" fill="#0f172a">${esc(model)}</text>
      <text x="55" y="175" font-weight="bold" fill="#64748b">SERIAL / BATCH NO.:</text>
      <text x="250" y="175" font-weight="bold" font-size="14" fill="#0369a1">${esc(serial)}</text>
      <text x="55" y="205" font-weight="bold" fill="#64748b">CAPACITY / RATING:</text>
      <text x="250" y="205" font-size="13">${esc(cap)}</text>
      <text x="55" y="235" font-weight="bold" fill="#64748b">POWER SPECIFICATION:</text>
      <text x="250" y="235" font-size="13">${esc(power)}</text>
    </g>
    <g fill="#0f172a">
      <rect x="55" y="260" width="3" height="26"/><rect x="62" y="260" width="5" height="26"/><rect x="71" y="260" width="2" height="26"/><rect x="77" y="260" width="6" height="26"/><rect x="87" y="260" width="3" height="26"/><rect x="94" y="260" width="4" height="26"/><rect x="102" y="260" width="2" height="26"/><rect x="108" y="260" width="5" height="26"/><rect x="117" y="260" width="3" height="26"/><rect x="124" y="260" width="6" height="26"/><rect x="134" y="260" width="4" height="26"/><rect x="142" y="260" width="3" height="26"/><rect x="149" y="260" width="6" height="26"/>
      <text x="55" y="298" font-family="monospace" font-size="9" fill="#475569">${esc(serial)}</text>
    </g>
    <rect x="420" y="255" width="45" height="26" rx="4" fill="#f1f5f9" stroke="#94a3b8"/>
    <text x="442" y="272" font-family="sans-serif" font-weight="bold" font-size="10" fill="#334155" text-anchor="middle">CE</text>
    <rect x="475" y="255" width="70" height="26" rx="4" fill="#f1f5f9" stroke="#94a3b8"/>
    <text x="510" y="272" font-family="sans-serif" font-weight="bold" font-size="10" fill="#334155" text-anchor="middle">ISO 9001</text>
  </svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.trim());
}

function openPhotoModal() {
  E('photoModal').classList.remove('hidden');
  retakePhoto();
  setPhotoTab('cam');
}

function closePhotoModal() {
  stopCamera();
  E('photoModal').classList.add('hidden');
}

function setPhotoTab(tab) {
  ['cam', 'file', 'preset'].forEach(t => {
    const btn = E('tab-' + t);
    const panel = E('panel-' + t);
    if (t === tab) {
      btn.className = 'py-2 rounded-xl transition-all bg-emerald-700 text-white shadow-xs flex items-center justify-center gap-1.5';
      panel.classList.remove('hidden');
    } else {
      btn.className = 'py-2 rounded-xl transition-all text-gray-600 hover:text-gray-900 flex items-center justify-center gap-1.5';
      panel.classList.add('hidden');
    }
  });

  if (tab === 'cam') {
    startCamera();
  } else {
    stopCamera();
  }
}

async function startCamera() {
  const video = E('camVideo');
  const statusEl = E('cam-status');
  if (!video) return;

  stopCamera();

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    if (statusEl) statusEl.textContent = 'อุปกรณ์ไม่รองรับ Live Camera กรุณาใช้แท็บอัปโหลดรูปภาพ';
    return;
  }

  try {
    if (statusEl) statusEl.textContent = 'กำลังเปิดกล้อง...';
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: camFacing,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });
    camStream = stream;
    video.srcObject = stream;
    video.onloadedmetadata = () => {
      video.play();
      if (statusEl) statusEl.textContent = 'กล้องพร้อมทำงาน - จัดป้ายเนมเพลทให้อยู่ในกรอบ';
    };
  } catch (err) {
    console.warn('Camera error:', err);
    if (statusEl) statusEl.textContent = 'ไม่สามารถเปิดกล้องได้ (สิทธิ์ถูกปฏิเสธ หรือไม่มีกล้อง) กรุณาใช้แท็บ "อัปโหลดรูป" หรือ "ตัวอย่างเนมเพลท"';
  }
}

function stopCamera() {
  if (camStream) {
    camStream.getTracks().forEach(track => track.stop());
    camStream = null;
  }
  const video = E('camVideo');
  if (video) video.srcObject = null;
}

function switchCameraFacing() {
  camFacing = camFacing === 'environment' ? 'user' : 'environment';
  startCamera();
}

function takeSnapshot() {
  const video = E('camVideo');
  const canvas = E('camCanvas');
  if (!video || !canvas) return;

  const w = video.videoWidth || 640;
  const h = video.videoHeight || 480;
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, w, h);

  const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
  stopCamera();
  processScannedPhoto(dataUrl, 'camera');
}

function handleFileUpload(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = e => {
    processScannedPhoto(e.target.result, 'upload', file.name);
  };
  reader.readAsDataURL(file);
}

function selectSamplePreset(key) {
  const p = PHOTO_PRESETS[key] || PHOTO_PRESETS.daikin;
  const svgDataUrl = generateNameplateSVG(
    p.brand,
    p.model,
    p.serial,
    p.data.power,
    p.data.cap
  );
  processScannedPhoto(svgDataUrl, key);
}

function processScannedPhoto(imgData, sourceKey, fileName) {
  activeScannedImage = imgData;

  let preset = PHOTO_PRESETS[sourceKey];
  if (!preset) {
    // สำหรับรูปที่ถ่ายจากกล้องสด หรืออัปโหลดจากไฟล์ ให้จำลองผล OCR ที่สมจริง
    const randomSerial = 'DK26X-' + Math.floor(100000 + Math.random() * 900000);
    preset = {
      title: 'Daikin Inverter FTV50 (สแกนจากกล้อง)',
      data: {
        ...PHOTO_PRESETS.daikin.data,
        serial: randomSerial,
        serial2: randomSerial,
        docs: fileName ? fileName + ', Daikin_Catalog.pdf' : 'nameplate_camera_capture.jpg'
      }
    };
  }

  activeScannedData = preset.data;

  // แสดงรูปใน Preview Stage
  E('scannedImagePreview').src = imgData;

  // แสดงตารางสรุปข้อมูลที่ AI OCR ตรวจพบ
  const fields = [
    ['ยี่ห้อ / Brand', activeScannedData.brand],
    ['รุ่น / Model No.', activeScannedData.model],
    ['หมายเลขเครื่อง (Serial)', activeScannedData.serial],
    ['หมวดหมู่ (Category)', activeScannedData.category],
    ['พิกัด / Capacity', activeScannedData.cap],
    ['ระบบไฟฟ้า (Power)', activeScannedData.power],
    ['ประเทศผู้ผลิต (Origin)', activeScannedData.origin + ' (' + activeScannedData.mfgDate + ')'],
    ['มาตรฐานรับรอง', activeScannedData.std]
  ];

  E('extracted-fields-list').innerHTML = fields.map(([label, val]) => `
    <div class="flex items-start justify-between gap-2 border-b border-emerald-100/80 pb-1">
      <span class="text-gray-500 text-[11px] shrink-0">${esc(label)}:</span>
      <strong class="text-emerald-950 font-semibold text-right truncate">${esc(val || '-')}</strong>
    </div>
  `).join('');

  // สลับไปยัง Preview Stage
  E('capture-stage').classList.add('hidden');
  E('preview-stage').classList.remove('hidden');
}

function retakePhoto() {
  E('preview-stage').classList.add('hidden');
  E('capture-stage').classList.remove('hidden');
  const fileInput = E('nameplateFileInput');
  if (fileInput) fileInput.value = '';
}

function applyPhotoDataToForm() {
  if (!activeScannedData) return;

  // ตรวจสอบสิทธิ์ Category หากผู้ใช้คือ Buyer
  if (role === 'buyer' && !Permissions.canView(SESSION.email, activeScannedData.category, role)) {
    alert(`บัญชีของคุณไม่มีสิทธิ์ในหมวด "${activeScannedData.category}"\n(ได้รับสิทธิ์เฉพาะหมวดที่ Admin กำหนดให้)`);
    return;
  }

  let filledCount = 0;
  allF().forEach(field => {
    const v = activeScannedData[field.k];
    if (v !== undefined && v !== '') {
      if (field.t === 'file') {
        F[field.k] = v;
        setFile(field.k);
      } else {
        const el = E(field.k);
        if (el) el.value = v;
      }
      filledCount++;
    }
  });

  // แนบรูปถ่ายเนมเพลทลงในช่องเอกสารอัตโนมัติ
  const docName = 'nameplate_capture.jpg';
  if (!F['docs'] || !F['docs'].includes(docName)) {
    F['docs'] = docName + (F['docs'] ? ', ' + F['docs'] : '');
    setFile('docs');
  }

  // อัปเดตรูป Thumbnail และแถบแจ้งเตือนบนฟอร์ม
  const badge = E('nameplate-preview-badge');
  if (badge && activeScannedImage) {
    E('formNameplateThumb').src = activeScannedImage;
    E('formNameplateInfo').textContent = `${activeScannedData.brand || ''} ${activeScannedData.model || ''} | S/N: ${activeScannedData.serial || ''}`;
    badge.classList.remove('hidden');
  }

  updateSub();
  if (activeScannedData.subCat && E('subCat')) E('subCat').value = activeScannedData.subCat;

  calc();
  refresh();
  closePhotoModal();

  toast(`สแกนเนมเพลทและกรอกข้อมูลอัตโนมัติสำเร็จ (${filledCount} ช่อง)`);
}

if (SESSION) init();

