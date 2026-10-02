const E=id=>document.getElementById(id);
const RL={supplier:['','Supplier','bg-green-100 text-green-800'],buyer:['','Buyer','bg-green-100 text-green-800'],admin:['','Admin','bg-gray-200 text-gray-800']};
const toast=m=>{const t=E('toast');if(!t)return;t.textContent=m;t.classList.remove('hidden');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.add('hidden'),2200)};
const fdt=t=>new Date(t).toLocaleString('th-TH',{dateStyle:'medium',timeStyle:'short'});
const esc=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const J={get:(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};

const LABELS_MAP = {
  assetCode: 'Asset Code',
  assetName: 'Asset Name',
  category: 'Category',
  subCat: 'Sub Category',
  brand: 'Brand/Manufacturer',
  model: 'Model No.',
  serial: 'Serial No.',
  mtnCode: 'MTN Asset Code (ใหม่)',
  company: 'Company',
  bu: 'Business Unit',
  branch: 'Branch/Site Code',
  floor: 'Floor/Area',
  resp: 'Responsible Person',
  cc: 'Cost Center',
  gl: 'GL Account (ใหม่)',
  subAcc: 'Sub Account (ใหม่)',
  wbs: 'WBS (ใหม่)',
  sup: 'Supplier Code / Name',
  po: 'Contract / PO No.',
  mfr: 'Brand / Manufacturer',
  series: 'Product Series',
  model2: 'Model No.',
  serial2: 'Serial No. / Batch',
  origin: 'Country of Origin',
  mfgDate: 'MFG Date',
  cap: 'Capacity / Rating',
  power: 'Power Requirement',
  util: 'Utility Requirement',
  dim: 'Dimension & Weight',
  opc: 'Operating Condition',
  std: 'Standard & Certificate',
  func: 'Functional Requirements (ใหม่)',
  docs: 'Document Attachment',
  wStart: 'Warranty Start',
  wEnd: 'Warranty End',
  wScope: 'Warranty Scope',
  wCond: 'Warranty Condition & Exclusion',
  wExt: 'Extended Warranty Option (THB/ปี)',
  sla: 'Response / Restore SLA (ชม.)',
  svc: 'Service Center & Contact',
  train: 'Training & Commissioning',
  spDocs: 'Spare Part List (แนบไฟล์เอกสาร)',
  spClass: 'Part Classification',
  spCur: 'Currency',
  spInt: 'Replacement Interval (ชม./เดือน)',
  lead: 'Lead Time (วัน)',
  minStock: 'Min. Stock Recommend',
  avail: 'Part Availability Guarantee (ปี)',
  life: 'Useful Life (ปี)',
  hrs: 'สมมติฐานชั่วโมงใช้งาน/ปี',
  design: 'Design Life / Duty Cycle',
  econ: 'Economic Life (ปี)',
  overhaul: 'Major Overhaul Year',
  resid: 'Expected Residual Value (%)',
  eos: 'End-of-Support Year',
  disp: 'Disposal / Recycle Guide',
  price: 'ราคาซื้อ (THB)',
  maint: 'Year 1-N Maintenance Cost (THB/ปี)',
  pm: 'PM Package Price',
  cons: 'Consumable Cost/Year (THB)',
  labor: 'Labor Rate (THB/ชม.)',
  energy: 'Energy Consumption (kWh/ชม.)',
  esc: 'Price Escalation Assumption (%)',
  tco: 'Total Cost of Ownership (Auto)',
  ef: 'Emission Factor (kgCO₂e/kWh)',
  cprice: 'ราคา Carbon Credit (THB/tCO₂e)',
  co2y: 'คาร์บอนที่ปล่อย (tCO₂e/ปี)',
  co2l: 'คาร์บอนตลอดอายุ (tCO₂e)',
  cval: 'มูลค่า Carbon Credit ที่ต้องชดเชย (THB)'
};

const MOCK_SUBS = [
  {
    id: 'mock-001',
    role: 'supplier',
    email: 'supplier@demo.co.th',
    at: Date.now() - 2 * 3600 * 1000,
    status: 'รอ Buyer ตรวจ',
    title: 'ตู้แช่เย็น Daikin FTV50QV1V',
    labels: LABELS_MAP,
    values: {
      assetName: 'ตู้แช่เย็น Daikin FTV50QV1V',
      category: 'Refrigeration system',
      subCat: '',
      brand: 'Daikin',
      model: 'FTV50QV1V',
      serial: 'DK26X001234',
      mtnCode: 'REF-1-1-0-001',
      company: 'บริษัท ตัวอย่างรีเทล จำกัด',
      bu: 'Retail',
      branch: 'BKK-001 (สาขาพระราม 9)',
      floor: 'B1 / โซนอาหารสด',
      resp: 'แผนกวิศวกรรมอาคาร',
      cc: 'CC-100245',
      gl: '1210-0100',
      subAcc: '1210-0101',
      wbs: 'P-2026-BKK-001',
      sup: 'SUP-00001 / บริษัท ตัวอย่างซัพพลาย จำกัด',
      po: 'PO-2026-004512',
      mfr: 'Daikin Industries, Ltd. (Japan)',
      series: 'Inverter FTV Series',
      model2: 'FTV50QV1V',
      serial2: 'DK26X001234',
      origin: 'Japan',
      mfgDate: '2026-02',
      cap: '18000 BTU / 2.5 kW',
      power: '380V 3P 50Hz / 2.5 kW',
      util: 'น้ำหล่อเย็น 0.5 ลบ.ม./ชม.',
      dim: '900×320×290 มม. / 38 กก.',
      opc: '0-43°C, RH ≤ 85%',
      std: 'มอก. 1155 / CE / ISO 9001 เลขที่ TH-2026-0456',
      func: 'ปรับอุณหภูมิ 2-6°C สำหรับแช่อาหารสด, ระบบละลายน้ำแข็งอัตโนมัติ Defrost Cycle',
      docs: 'Daikin_Catalog_FTV50.pdf, User_Manual_TH.pdf',
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
      cprice: 200,
      tco: '1,254,000 THB',
      co2y: '10.95',
      co2l: '109.50',
      cval: '21,900 THB'
    }
  },
  {
    id: 'mock-002',
    role: 'buyer',
    email: 'buyer@demo.co.th',
    at: Date.now() - 28 * 3600 * 1000,
    updatedAt: Date.now() - 4 * 3600 * 1000,
    updatedBy: 'buyer@demo.co.th',
    status: 'ตรวจ/แก้ไขแล้ว',
    title: 'เครื่องทำน้ำเย็น Trane Chiller 500 RT',
    labels: LABELS_MAP,
    values: {
      assetCode: 'AST-2026-CHL-001',
      assetName: 'เครื่องทำน้ำเย็น Chiller Trane 500 Ton',
      category: 'Chiller',
      subCat: '',
      brand: 'Trane',
      model: 'CVHE-0500',
      serial: 'TRN-2026-CH098',
      mtnCode: 'CHL-1-1-0-002',
      company: 'บริษัท ซุปเปอร์เซ็นเตอร์ จำกัด',
      bu: 'Retail',
      branch: 'BKK-001 (สาขาพระราม 9)',
      floor: 'ชั้นดาดฟ้า ห้อง Chiller Plant',
      resp: 'แผนกบริหารอาคารและสาธารณูปโภค',
      cc: 'CC-100110',
      gl: '1210-0200',
      subAcc: '1210-0205',
      wbs: 'P-2026-HVAC-01',
      sup: 'SUP-00088 / บริษัท เทรน (ประเทศไทย) จำกัด',
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
      cprice: 200,
      tco: '28,450,000 THB',
      co2y: '909.82',
      co2l: '22,745.50',
      cval: '4,549,100 THB'
    }
  },
  {
    id: 'mock-003',
    role: 'supplier',
    email: 'supplier@demo.co.th',
    at: Date.now() - 52 * 3600 * 1000,
    status: 'ส่งคืนให้ Buyer แก้ไข',
    returnReason: 'ขอให้ตรวจสอบใบรับประกันสินค้า (Warranty Document) เพิ่มเติม และแนบสเปกกล้อง 4K ให้ครบถ้วนตามสัญญาจัดซื้อ',
    returnedAt: Date.now() - 5 * 3600 * 1000,
    returnedBy: 'admin@demo.co.th',
    assignedBuyer: 'buyer2@demo.co.th',
    title: 'กล้องวงจรปิด Hikvision NVR 32CH + กล้อง 4K',
    labels: LABELS_MAP,
    values: {
      assetName: 'ระบบกล้อง CCTV 4K และเครื่องบันทึก NVR 32CH',
      category: 'Safety Equipment',
      subCat: 'CCTV',
      brand: 'Hikvision',
      model: 'DS-9632NI-I8',
      serial: 'HKV-2026-NVR32-09',
      mtnCode: 'SEC-2-1-0-005',
      company: 'บริษัท ซุปเปอร์เซ็นเตอร์ จำกัด',
      bu: 'Warehouse',
      branch: 'BKK-002 (DC วังน้อย)',
      floor: 'ห้องศูนย์ควบคุมความปลอดภัย (Control Room)',
      resp: 'แผนก Loss Prevention & Security',
      cc: 'CC-200501',
      gl: '1210-0400',
      subAcc: '1210-0402',
      wbs: 'P-2026-SEC-CCTV',
      sup: 'SUP-00001 / บริษัท ตัวอย่างซัพพลาย จำกัด',
      po: 'PO-2026-005119',
      mfr: 'Hikvision Digital Technology',
      series: 'Pro Series NVR & DarkFighter 4K',
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
      wCond: 'ไม่รวมความเสียหายจากฟ้าผ่าและไฟกระชาก (แนะนำติดตั้ง Surge Protection)',
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
      cprice: 200,
      tco: '596,250 THB',
      co2y: '1.53',
      co2l: '10.71',
      cval: '2,142 THB'
    }
  },
  {
    id: 'mock-004',
    role: 'buyer',
    email: 'buyer@demo.co.th',
    at: Date.now() - 96 * 3600 * 1000,
    updatedAt: Date.now() - 18 * 3600 * 1000,
    updatedBy: 'buyer@demo.co.th',
    status: 'ตรวจ/แก้ไขแล้ว',
    title: 'สะพานปรับระดับไฮดรอลิก Assa Abloy DL6010H',
    labels: LABELS_MAP,
    values: {
      assetCode: 'AST-2026-LOG-004',
      assetName: 'Assa Abloy Hydraulic Dock Leveler 10T',
      category: 'Logistic Equipment',
      subCat: 'Dock leveler',
      brand: 'Assa Abloy',
      model: 'DL6010H',
      serial: 'AA-2026-DL-031',
      mtnCode: 'LOG-3-1-0-004',
      company: 'บริษัท สยามโลจิสติกส์ ฮับ จำกัด',
      bu: 'Warehouse',
      branch: 'BKK-002 (DC วังน้อย)',
      floor: 'จุดโหลดสินค้า Gate 4-6',
      resp: 'แผนกปฏิบัติการคลังสินค้าและซัพพลายเชน',
      cc: 'CC-200100',
      gl: '1210-0600',
      subAcc: '1210-0601',
      wbs: 'P-2026-WH-UPGRADE',
      sup: 'SUP-00155 / บริษัท ครอว์ฟอร์ด ลอจิสติกส์ จำกัด',
      po: 'PO-2026-002980',
      mfr: 'Assa Abloy Entrance Systems, Sweden',
      series: 'DL6010 Heavy Duty Series',
      model2: 'DL6010H',
      serial2: 'AA-2026-DL-031',
      origin: 'Sweden',
      mfgDate: '2025-10',
      cap: '10,000 กก. (Dynamic Load 60 kN)',
      power: '380V 3P 50Hz / 1.5 kW',
      util: 'น้ำมันไฮดรอลิกสังเคราะห์ ISO VG 46',
      dim: '2,000×2,500×600 มม. / 1,150 กก.',
      opc: 'Loading Bay อุณหภูมิสภาพแวดล้อมภายนอก -5 ถึง 45°C',
      std: 'EN 1398, CE Mark, ISO 9001',
      func: 'ปรับระดับพื้นระหว่างคลังสินค้ากับกระบะรถบรรทุกแบบไฮดรอลิกกระบอกคู่พร้อมระบบความปลอดภัยฉุกเฉิน',
      docs: 'AssaAbloy_DL6010H_Manual.pdf, Warranty_Certificate.pdf',
      wStart: '2026-01-01',
      wEnd: '2028-12-31',
      wScope: 'อะไหล่+ค่าแรง',
      wCond: 'ต้องใช้งานไม่เกินพิกัดน้ำหนักที่กำหนด 10 ตัน',
      wExt: '25,000 / ปี',
      sla: 'ตอบรับ 4 / แก้ไข 24',
      svc: 'Assa Abloy Thailand Service Hotline / 02-333-2222',
      train: 'อบรมคนขับรถยกและเจ้าหน้าที่ตรวจเช็คประจำวัน 4 ชม.',
      spDocs: 'DockLeveler_SpareParts.xlsx',
      spClass: 'Critical',
      spCur: 'THB',
      spInt: '5,000 รอบ',
      lead: '15 วัน',
      minStock: 1,
      avail: 10,
      life: 15,
      hrs: 3500,
      design: '52,500 ชม. หรือ 100,000 Cycles',
      econ: 12,
      overhaul: 'ปีที่ 8 (โอเวอร์ฮอลกระบอกไฮดรอลิก) / 65,000 THB',
      resid: 5,
      eos: 2041,
      disp: 'ส่งโรงงานรีไซเคิลเศษเหล็ก และถ่ายน้ำมันไฮดรอลิกไปกำจัดอย่างถูกวิธี',
      price: 290000,
      maint: 18000,
      pm: '4,500 / ครั้ง × 2 ครั้ง/ปี',
      cons: 6000,
      labor: 400,
      energy: 1.5,
      esc: 3,
      ef: 0.4999,
      cprice: 200,
      tco: '745,500 THB',
      co2y: '2.62',
      co2l: '39.30',
      cval: '7,860 THB'
    }
  },
  {
    id: 'mock-005',
    role: 'supplier',
    email: 'supplier@demo.co.th',
    at: Date.now() - 130 * 3600 * 1000,
    status: 'รอ Buyer ตรวจ',
    title: 'ตู้ควบคุม MDB & Cap Bank Schneider 400kVAR',
    labels: LABELS_MAP,
    values: {
      assetName: 'Schneider MDB Main Distribution Board & Cap Bank 400kVAR',
      category: 'Electrical system',
      subCat: 'Cap bank',
      brand: 'Schneider Electric',
      model: 'VarSet Direct 400',
      serial: 'SE-2026-CB-400-88',
      mtnCode: 'ELE-1-1-0-003',
      company: 'บริษัท ซุปเปอร์เซ็นเตอร์ จำกัด',
      bu: 'Factory',
      branch: 'RYG-002 (โรงงานระยอง)',
      floor: 'ห้องหม้อแปลงไฟฟ้า (Substation)',
      resp: 'แผนกวิศวกรรมไฟฟ้าและพลังงาน',
      cc: 'CC-300120',
      gl: '1210-0300',
      subAcc: '1210-0301',
      wbs: 'P-2026-EE-CAP',
      sup: 'SUP-00001 / บริษัท ตัวอย่างซัพพลาย จำกัด',
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
      overhaul: 'ปีที่ 6 (เปลี่ยนชุดตัวเก็บประจุและ Magnetic Contactor) / 120,000 THB',
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
      cprice: 200,
      tco: '985,000 THB',
      co2y: '0.44',
      co2l: '5.28',
      cval: '1,056 THB'
    }
  },
  {
    id: 'mock-006',
    role: 'supplier',
    email: 'supplier@demo.co.th',
    at: Date.now() - 175 * 3600 * 1000,
    status: 'รอ Buyer ตรวจ',
    title: 'เครื่องผสมแป้งเบเกอรี่ Hobart 60 ลิตร',
    labels: LABELS_MAP,
    values: {
      assetName: 'เครื่องผสมแป้งเบเกอรี่ Hobart Legacy 60L',
      category: 'Super Equipment',
      subCat: 'Bakery Equipment',
      brand: 'Hobart',
      model: 'HL600 Legacy',
      serial: 'HB-2026-MX60-44',
      mtnCode: 'SUP-4-1-0-001',
      company: 'บริษัท ตัวอย่างรีเทล จำกัด',
      bu: 'Retail',
      branch: 'BKK-001 (สาขาพระราม 9)',
      floor: 'โซนเบเกอรี่และครัวผลิตสด',
      resp: 'แผนกอาหารสดและเบเกอรี่',
      cc: 'CC-100350',
      gl: '1210-0500',
      subAcc: '1210-0503',
      wbs: 'P-2026-BAKERY-01',
      sup: 'SUP-00001 / บริษัท ตัวอย่างซัพพลาย จำกัด',
      po: 'PO-2026-004120',
      mfr: 'Hobart Corporation, USA',
      series: 'Legacy Planetary Mixer',
      model2: 'HL600',
      serial2: 'HB-2026-MX60-44',
      origin: 'USA',
      mfgDate: '2025-09',
      cap: 'โถสแตนเลส Food Grade 60 ลิตร (60 Qt) / มอเตอร์ 2.7 HP',
      power: '380V 3P 50Hz / 2.0 kW',
      util: 'ระบบล้างทำความสะอาดด้วยน้ำอุ่น',
      dim: '724×1,032×1,556 มม. / 392 กก.',
      opc: 'ห้องครัวเบเกอรี่ 20-35°C',
      std: 'NSF International, UL Sanitation, CE Mark',
      func: 'ปรับความเร็ว 4 ระดับพร้อม Stir speed, ระบบยกโถด้วยไฟฟ้า Power Bowl Lift, หัวตีสลับถอดเร็ว Quick-Release',
      docs: 'Hobart_HL600_SpecSheet.pdf, User_Guide_TH.pdf',
      wStart: '2026-01-15',
      wEnd: '2028-01-14',
      wScope: 'อะไหล่+ค่าแรง',
      wCond: 'ห้ามผสมแป้งเกินอัตราส่วนความจุที่ระบุในคู่มือ',
      wExt: '20,000 / ปี',
      sla: 'ตอบรับ 4 / แก้ไข 24',
      svc: 'Food Machinery Service Center / 02-456-7890',
      train: 'อบรมพนักงานแผนกเบเกอรี่เรื่องความปลอดภัยและการทำความสะอาด 4 ชม.',
      spDocs: 'Hobart_HL600_SpareParts.pdf',
      spClass: 'Wear part',
      spCur: 'THB',
      spInt: '12,000 ชม.',
      lead: '14 วัน',
      minStock: 1,
      avail: 15,
      life: 15,
      hrs: 4000,
      design: '60,000 ชม.',
      econ: 12,
      overhaul: 'ปีที่ 7 (เปลี่ยนชุดเฟือง Planetary และซีล) / 45,000 THB',
      resid: 10,
      eos: 2041,
      disp: 'โครงสร้างสแตนเลสและโถผสมสามารถนำไปรีไซเคิลได้ 100%',
      price: 480000,
      maint: 22000,
      pm: '3,500 / ครั้ง × 3 ครั้ง/ปี',
      cons: 5000,
      labor: 450,
      energy: 2.0,
      esc: 3,
      ef: 0.4999,
      cprice: 200,
      tco: '1,296,000 THB',
      co2y: '4.00',
      co2l: '60.00',
      cval: '12,000 THB'
    }
  }
];

/* ที่เก็บรายการที่ส่งฟอร์ม (ตอนนี้ใช้ localStorage) */
const Store={
  all:()=>{
    let a=J.get('portal_subs',null);
    if(!a||!Array.isArray(a)||a.length===0){
      a=MOCK_SUBS;
      J.set('portal_subs',a);
    }
    return a;
  },
  put(r){
    const a=Store.all().filter(x=>x.id!=r.id);
    a.push(r);
    J.set('portal_subs',a);
  },
  update(id, partial){
    const list = Store.all();
    const idx = list.findIndex(x => x.id == id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...partial };
      J.set('portal_subs', list);
      return list[idx];
    }
    return null;
  },
  resetMock(){
    J.set('portal_subs',MOCK_SUBS);
    return MOCK_SUBS;
  }
};

/* บัญชีทดลอง (Supplier / Buyer / Admin) */
const SEED=[
  {role:'supplier',email:'supplier@demo.co.th',pw:'demo1234',company:'บริษัท ตัวอย่างซัพพลาย จำกัด',code:'SUP-00001'},
  {role:'buyer',email:'buyer@demo.co.th',pw:'demo1234',company:'ฝ่ายจัดซื้อ 1 (ระบบทำความเย็น & HVAC)',status:'ใช้งานอยู่',updatedAtStr:'12 มิ.ย. 2568 14:32'},
  {role:'buyer',email:'buyer1@demo.co.th',pw:'demo1234',company:'บริษัท ตัวอย่าง จำกัด',status:'ใช้งานอยู่',updatedAtStr:'12 มิ.ย. 2568 14:32'},
  {role:'buyer',email:'buyer2@demo.co.th',pw:'demo1234',company:'บริษัท เอ็มเอส จำกัด',status:'รออนุมัติ',updatedAtStr:'10 มิ.ย. 2568 09:15'},
  {role:'buyer',email:'buyer3@demo.co.th',pw:'demo1234',company:'ห้างหุ้นส่วนจำกัด เคพี',status:'ใช้งานอยู่',updatedAtStr:'8 มิ.ย. 2568 16:20'},
  {role:'buyer',email:'buyer4@demo.co.th',pw:'demo1234',company:'บริษัท ซัพพลาย จำกัด',status:'ใช้งานอยู่',updatedAtStr:'6 มิ.ย. 2568 11:47'},
  {role:'admin',email:'admin@demo.co.th',pw:'demo1234',company:'ผู้ดูแลระบบ (Admin ตัวอย่าง)'}
];

/* กำหนดสิทธิ์ Category ของ Buyer แต่ละคน */
const DEFAULT_BUYER_PERMS = {
  'buyer@demo.co.th': ['Chiller', 'Refrigeration system', 'Air condition / AHU', 'Cooling tower'],
  'buyer1@demo.co.th': ['Refrigeration system', 'Chiller', 'Electrical system'],
  'buyer2@demo.co.th': ['Safety Equipment', 'Logistic Equipment'],
  'buyer3@demo.co.th': ['Chiller', 'Super Equipment'],
  'buyer4@demo.co.th': ['Refrigeration system', 'Electrical system', 'Logistic Equipment']
};

const Permissions = {
  key: 'buyer_category_permissions',
  getAll() {
    let custom = J.get(this.key, null);
    if (!custom || typeof custom !== 'object' || Array.isArray(custom)) {
      custom = { ...DEFAULT_BUYER_PERMS };
      J.set(this.key, custom);
    }
    return custom;
  },
  get(email) {
    if (!email) return [];
    const all = this.getAll();
    const mail = String(email).trim().toLowerCase();
    const foundKey = Object.keys(all).find(k => k.toLowerCase() === mail);
    if (foundKey && Array.isArray(all[foundKey])) {
      return all[foundKey];
    }
    const defKey = Object.keys(DEFAULT_BUYER_PERMS).find(k => k.toLowerCase() === mail);
    if (defKey && Array.isArray(DEFAULT_BUYER_PERMS[defKey])) {
      return DEFAULT_BUYER_PERMS[defKey];
    }
    return [];
  },
  set(email, categories) {
    if (!email) return [];
    const all = this.getAll();
    const mail = String(email).trim().toLowerCase();
    all[mail] = Array.isArray(categories) ? categories : [];
    J.set(this.key, all);
    return all[mail];
  },
  delete(email) {
    if (!email) return;
    const all = this.getAll();
    const mail = String(email).trim().toLowerCase();
    delete all[mail];
    J.set(this.key, all);
  },
  canView(email, category, role) {
    if (role === 'admin' || role === 'supplier') return true;
    if (!category) return false;
    const allowed = this.get(email);
    if (!Array.isArray(allowed) || allowed.length === 0) return false;
    const catClean = String(category).trim().toLowerCase();
    return allowed.some(a => String(a).trim().toLowerCase() === catClean);
  },
  getBuyers() {
    const users = Auth.users().filter(u => u.role === 'buyer');
    const allPerms = this.getAll();
    const map = new Map();
    users.forEach(u => {
      const lower = u.email.toLowerCase();
      map.set(lower, {
        email: u.email,
        name: u.company || u.name || u.email,
        status: u.status || 'ใช้งานอยู่',
        updatedAtStr: u.updatedAtStr || '12 มิ.ย. 2568 14:32',
        categories: this.get(u.email)
      });
    });
    Object.keys(allPerms).forEach(k => {
      const lower = k.toLowerCase();
      if (!map.has(lower)) {
        map.set(lower, {
          email: k,
          name: 'Buyer (' + k.split('@')[0] + ')',
          status: 'ใช้งานอยู่',
          updatedAtStr: '12 มิ.ย. 2568 14:32',
          categories: this.get(k)
        });
      }
    });
    return Array.from(map.values());
  }
};

/* ========================================================
   ทะเบียนคู่ค้า (Supplier Directory & Profile Management)
   ======================================================== */
const DEFAULT_SUPPLIERS = [
  {
    code: 'SUP-00001',
    company: 'บริษัท ตัวอย่างซัพพลาย จำกัด',
    taxId: '0105558012345',
    contact: 'คุณสมศักดิ์ มั่นคง (ผู้จัดการฝ่ายขาย)',
    phone: '02-123-4567',
    email: 'supplier@demo.co.th',
    address: '88/12 อาคารเอ็กซิม ถนนพหลโยธิน แขวงพญาไท เขตพญาไท กรุงเทพฯ 10400',
    categories: ['Refrigeration system', 'Chiller', 'Safety Equipment', 'Electrical system'],
    status: 'อนุมัติแล้ว',
    registeredAt: Date.now() - 180 * 86400 * 1000
  },
  {
    code: 'SUP-00088',
    company: 'บริษัท เทรน (ประเทศไทย) จำกัด',
    taxId: '0105524098765',
    contact: 'คุณวิภาดา อริยะพร (วิศวกรบริการลูกค้า)',
    phone: '02-704-9999',
    email: 'trane.th@supplier.co.th',
    address: '112/5 ถนนร่มเกล้า แขวงคลองสามประเวศ เขตลาดกระบัง กรุงเทพฯ 10520',
    categories: ['Chiller', 'Cooling tower', 'Air condition / AHU'],
    status: 'อนุมัติแล้ว',
    registeredAt: Date.now() - 240 * 86400 * 1000
  },
  {
    code: 'SUP-00123',
    company: 'บริษัท สยามไดกิ้นเซลส์ จำกัด',
    taxId: '0105515033441',
    contact: 'คุณธีรเดช พัฒนศิลป์ (ฝ่ายบริการหลังการขาย)',
    phone: '02-715-3000',
    email: 'daikin.th@supplier.co.th',
    address: '22 ซอยอ่อนนุช 55/1 แขวงประเวศ เขตประเวศ กรุงเทพฯ 10250',
    categories: ['Refrigeration system', 'Air condition / AHU'],
    status: 'อนุมัติแล้ว',
    registeredAt: Date.now() - 300 * 86400 * 1000
  },
  {
    code: 'SUP-00155',
    company: 'บริษัท ครอว์ฟอร์ด ลอจิสติกส์ จำกัด',
    taxId: '0105549077123',
    contact: 'คุณประสิทธิ์ อุดมชัย (ฝ่ายขายอุปกรณ์คลังสินค้า)',
    phone: '02-333-2222',
    email: 'crawford.logistics@supplier.co.th',
    address: '99 หมู่ 3 ตำบลบางเสาธง อำเภอบางเสาธง สมุทรปราการ 10570',
    categories: ['Logistic Equipment', 'Fork lift'],
    status: 'อนุมัติแล้ว',
    registeredAt: Date.now() - 150 * 86400 * 1000
  },
  {
    code: 'SUP-00210',
    company: 'บริษัท ชไนเดอร์ อิเล็คทริค (ไทยแลนด์) จำกัด',
    taxId: '0105521045678',
    contact: 'คุณกิตติศักดิ์ เลิศวณิชย์ (วิศวกรฝ่ายระบบไฟฟ้ากำลัง)',
    phone: '02-617-5555',
    email: 'schneider.th@supplier.co.th',
    address: '44 อาคารอับดุลราฮิม เพลส ชั้น 13 ถนนพระราม 4 แขวงสีลม เขตบางรัก กรุงเทพฯ 10500',
    categories: ['Electrical system'],
    status: 'อนุมัติแล้ว',
    registeredAt: Date.now() - 210 * 86400 * 1000
  },
  {
    code: 'SUP-00305',
    company: 'บริษัท ฮิควิชั่น ดิจิตอล เทคโนโลยี (ประเทศไทย) จำกัด',
    taxId: '0105562019874',
    contact: 'คุณจิราภรณ์ วงศ์สวัสดิ์ (ฝ่ายโครงการและพันธมิตรคู่ค้า)',
    phone: '02-999-8888',
    email: 'hikvision.th@supplier.co.th',
    address: '555 อาคารรสา ทาวเวอร์ 2 ชั้น 18 ถนนพหลโยธิน แขวงจตุจักร เขตจตุจักร กรุงเทพฯ 10900',
    categories: ['Safety Equipment'],
    status: 'อนุมัติแล้ว',
    registeredAt: Date.now() - 120 * 86400 * 1000
  }
];

const Suppliers = {
  key: 'portal_suppliers',
  all() {
    let list = J.get(this.key, null);
    if (!list || !Array.isArray(list)) {
      list = [...DEFAULT_SUPPLIERS];
      J.set(this.key, list);
    }
    // รวมผู้ใช้ที่ลงทะเบียนผ่านหน้า register.html ด้วย
    const regUsers = J.get('portal_users', []).filter(u => u.role === 'supplier');
    regUsers.forEach(u => {
      if (!list.some(s => s.email.toLowerCase() === u.email.toLowerCase())) {
        list.push({
          code: u.code || 'SUP-' + String(list.length + 1).padStart(5, '0'),
          company: u.company || u.name || u.email,
          taxId: u.taxId || '-',
          contact: u.contact || '-',
          phone: u.phone || '-',
          email: u.email,
          address: u.address || '-',
          categories: u.categories || [],
          status: u.status || 'อนุมัติแล้ว',
          registeredAt: u.registeredAt || Date.now()
        });
      }
    });
    return list;
  },
  get(term) {
    const q = String(term || '').toLowerCase().trim();
    if (!q) return null;
    return this.all().find(s => 
      s.email.toLowerCase() === q || 
      s.code.toLowerCase() === q ||
      s.company.toLowerCase().includes(q)
    );
  },
  save(sup) {
    const list = this.all();
    const idx = list.findIndex(s => s.email.toLowerCase() === sup.email.toLowerCase());
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...sup };
    } else {
      if (!sup.code) {
        sup.code = 'SUP-' + String(list.length + 1).padStart(5, '0');
      }
      list.push(sup);
    }
    J.set(this.key, list);
  },
  delete(email) {
    let list = this.all();
    list = list.filter(s => s.email.toLowerCase() !== email.toLowerCase());
    J.set(this.key, list);
  }
};

const Auth={
  users:()=>SEED.concat(J.get('portal_users',[])),
  session(){try{return JSON.parse(sessionStorage.getItem('portal_session'))}catch(e){return null}},
  login(role,email,pw){
    const cleanMail=(email||'').trim().toLowerCase();
    let u=Auth.users().find(x=>x.role==role&&x.email.toLowerCase()==cleanMail&&x.pw==pw);
    if(!u){
      u=Auth.users().find(x=>x.email.toLowerCase()==cleanMail&&x.pw==pw);
      if(u) role=u.role;
    }
    if(!u)return null;
    const s={role:u.role,email:u.email,name:u.company||u.email,code:u.code||''};
    sessionStorage.setItem('portal_session',JSON.stringify(s));
    return s;
  },
  register(d){
    if(Auth.users().some(x=>x.email.toLowerCase()==d.email.toLowerCase()))return{error:'อีเมลนี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบ'};
    const us=J.get('portal_users',[]);
    us.push({role:'supplier',code:'SUP-'+String(us.length+2).padStart(5,'0'),...d});
    J.set('portal_users',us);
    return{ok:Auth.login('supplier',d.email,d.pw)};
  },
  home: r => r == 'supplier' ? 'form.html' : (r == 'admin' ? 'admin.html' : 'submissions.html'),
  require(roles){
    const s=Auth.session();
    if(!s){
      location.replace('login.html?role='+(roles[0]||'supplier'));
      return null;
    }
    if(!roles.includes(s.role)){
      location.replace(Auth.home(s.role));
      return null;
    }
    return s;
  },
  logout(){
    sessionStorage.removeItem('portal_session');
    sessionStorage.removeItem('selected_role');
    localStorage.removeItem('selected_role');
    location.href='index.html';
  }
};
