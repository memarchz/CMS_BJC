"use client";

import { useEffect, useRef, useState } from "react";
import { esc } from "../../lib/format";

type PhotoPreset = {
  title: string;
  brand: string;
  model: string;
  serial: string;
  type?: "nameplate" | "spec_sheet";
  data: Record<string, string | number>;
};

/* ========================================================
   PHOTO UPLOAD & LIVE CAMERA CAPTURE (AI NAMEPLATE SCANNER)
   ======================================================== */
const PHOTO_PRESETS: Record<string, PhotoPreset> = {
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
  },
  daikin_spec: {
    title: 'Daikin Inverter FTV50 - Product Specifications Sheet',
    brand: 'Daikin Industries, Ltd. (Japan)',
    model: 'FTV50QV1V',
    serial: 'DK26X-001234',
    type: 'spec_sheet',
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
      func: 'ปรับอุณหภูมิ 2-6°C สำหรับแช่อาหารสด พร้อมระบบละลายน้ำแข็ง Defrost Cycle',
      docs: 'Daikin_FTV50_Product_Specifications_Sheet.pdf',
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
    }
  },
  trane_spec: {
    title: 'Trane CenTraVac - Product Specifications Sheet',
    brand: 'Trane Commercial Systems, USA',
    model: 'CVHE-0500',
    serial: 'TRN-2026-CH098',
    type: 'spec_sheet',
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
      docs: 'Trane_CVHE_Product_Specifications_Sheet.pdf',
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
    }
  }
};

function generateSpecSheetSVG(title: string, brand: string, model: string, cap: string, power: string, util: string, dim: string, std: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340">
    <defs>
      <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#047857"/>
        <stop offset="100%" stop-color="#065f46"/>
      </linearGradient>
    </defs>
    <rect width="600" height="340" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
    <rect x="0" y="0" width="600" height="52" rx="12" fill="url(#headerGrad)"/>
    <rect x="0" y="44" width="600" height="8" fill="#047857"/>
    <text x="25" y="33" font-family="'Prompt', sans-serif" font-weight="bold" font-size="15" fill="#ffffff">PRODUCT SPECIFICATIONS SHEET</text>
    <text x="575" y="33" font-family="'Prompt', sans-serif" font-size="11" fill="#a7f3d0" text-anchor="end">TECHNICAL DATASHEET</text>

    <rect x="25" y="66" width="550" height="28" rx="6" fill="#f8fafc" stroke="#e2e8f0"/>
    <text x="35" y="85" font-family="'Prompt', sans-serif" font-weight="bold" font-size="12" fill="#0f172a">${esc(title)}</text>

    <g font-family="'Prompt', sans-serif" font-size="11" fill="#334155">
      <rect x="25" y="104" width="270" height="32" rx="6" fill="#f1f5f9"/>
      <text x="35" y="124" font-weight="bold" fill="#64748b">Manufacturer / Brand:</text>
      <text x="170" y="124" font-weight="bold" fill="#047857">${esc(brand)}</text>

      <rect x="305" y="104" width="270" height="32" rx="6" fill="#f1f5f9"/>
      <text x="315" y="124" font-weight="bold" fill="#64748b">Model Number:</text>
      <text x="420" y="124" font-weight="bold" fill="#0f172a">${esc(model)}</text>

      <rect x="25" y="142" width="270" height="32" rx="6" fill="#f8fafc" stroke="#e2e8f0"/>
      <text x="35" y="162" font-weight="bold" fill="#64748b">Capacity / Rating:</text>
      <text x="170" y="162" font-weight="600" fill="#0f172a">${esc(cap)}</text>

      <rect x="305" y="142" width="270" height="32" rx="6" fill="#f8fafc" stroke="#e2e8f0"/>
      <text x="315" y="162" font-weight="bold" fill="#64748b">Power Requirement:</text>
      <text x="440" y="162" font-weight="600" fill="#0f172a">${esc(power)}</text>

      <rect x="25" y="180" width="270" height="32" rx="6" fill="#f8fafc" stroke="#e2e8f0"/>
      <text x="35" y="200" font-weight="bold" fill="#64748b">Utility Requirement:</text>
      <text x="170" y="200" font-weight="600" fill="#0f172a">${esc(util || "-")}</text>

      <rect x="305" y="180" width="270" height="32" rx="6" fill="#f8fafc" stroke="#e2e8f0"/>
      <text x="315" y="200" font-weight="bold" fill="#64748b">Dimension &amp; Weight:</text>
      <text x="440" y="200" font-weight="600" fill="#0f172a">${esc(dim || "-")}</text>

      <rect x="25" y="218" width="550" height="32" rx="6" fill="#f8fafc" stroke="#e2e8f0"/>
      <text x="35" y="238" font-weight="bold" fill="#64748b">Certified Standards:</text>
      <text x="170" y="238" font-weight="600" fill="#0f172a">${esc(std || "ISO 9001 / CE / มอก.")}</text>
    </g>

    <rect x="25" y="260" width="550" height="38" rx="8" fill="#ecfdf5" stroke="#a7f3d0"/>
    <text x="40" y="284" font-family="'Prompt', sans-serif" font-weight="bold" font-size="11" fill="#047857">VERIFIED PRODUCT SPECIFICATIONS SHEET</text>
    <rect x="490" y="267" width="70" height="24" rx="4" fill="#047857"/>
    <text x="525" y="283" font-family="sans-serif" font-weight="bold" font-size="10" fill="#ffffff" text-anchor="middle">OFFICIAL</text>
  </svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.trim());
}

function generateNameplateSVG(brand: string, model: string, serial: string, power: string, cap: string): string {
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


type Props = {
  open: boolean;
  onClose: () => void;
  onApply: (data: Record<string, string>, imageDataUrl: string) => void;
  role: string;
  buyerAllowedCategories?: string[];
};

type Tab = "cam" | "file";
type Stage = "capture" | "scanning" | "preview" | "error";
type CamFacing = "environment" | "user";

const CAM_UNSUPPORTED = "อุปกรณ์ไม่รองรับ Live Camera กรุณาใช้แท็บอัปโหลดรูปภาพ";
const CAM_DENIED =
  'ไม่สามารถเปิดกล้องได้ (สิทธิ์ถูกปฏิเสธ หรือไม่มีกล้อง) กรุณาใช้แท็บ "อัปโหลดรูป"';

function cameraSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.mediaDevices && !!navigator.mediaDevices.getUserMedia;
}

export function PhotoScanModal(props: Props) {
  if (!props.open) return null;
  return <PhotoScanModalBody {...props} />;
}

function PhotoScanModalBody({ onClose, onApply, role, buyerAllowedCategories }: Props) {
  const [tab, setTab] = useState<Tab>("cam");
  const [facing, setFacing] = useState<CamFacing>("environment");
  const [stage, setStage] = useState<Stage>("capture");
  const [scanError, setScanError] = useState("");
  // Present only for a real AI read; preset samples leave these empty.
  const [scanConfidence, setScanConfidence] = useState("");
  const [scanNote, setScanNote] = useState("");
  const [camStatus, setCamStatus] = useState(() => (cameraSupported() ? "กำลังเชื่อมต่อกล้อง..." : CAM_UNSUPPORTED));
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [scannedData, setScannedData] = useState<Record<string, string | number> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  // Start the live camera on the camera tab; always stop the stream in cleanup
  // (also covers React Strict Mode's double effect invocation).
  useEffect(() => {
    if (tab !== "cam") return;
    if (!cameraSupported()) return;
    let cancelled = false;
    const video = videoRef.current;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCamStatus("กำลังเปิดกล้อง...");
    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (video) {
          video.srcObject = stream;
          video.onloadedmetadata = () => {
            video.play();
            setCamStatus("กล้องพร้อมทำงาน - จัดป้ายเนมเพลทให้อยู่ในกรอบ");
          };
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.warn("Camera error:", err);
        setCamStatus(CAM_DENIED);
      });
    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (video) video.srcObject = null;
    };
  }, [tab, facing]);

  function takeSnapshot() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    stopCamera();
    void scanPhotoWithAI(dataUrl);
  }

  function handleFileUpload(input: HTMLInputElement) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      void scanPhotoWithAI(String(e.target?.result ?? ""), file.name);
    };
    reader.readAsDataURL(file);
  }

  /**
   * The four sample nameplates are canned demo data and never touch the API, so a
   * demo still works with no key, no network and no quota left.
   */
  function selectSamplePreset(key: string) {
    const p = PHOTO_PRESETS[key] || PHOTO_PRESETS.daikin;
    let svgDataUrl: string;
    if (p.type === "spec_sheet") {
      svgDataUrl = generateSpecSheetSVG(
        p.title,
        p.brand,
        p.model,
        String(p.data.cap || ""),
        String(p.data.power || ""),
        String(p.data.util || ""),
        String(p.data.dim || ""),
        String(p.data.std || "")
      );
    } else {
      svgDataUrl = generateNameplateSVG(p.brand, p.model, p.serial, String(p.data.power), String(p.data.cap));
    }
    setScannedImage(svgDataUrl);
    setScannedData(p.data);
    setScanConfidence("");
    setScanNote("");
    setScanError("");
    setStage("preview");
  }

  /** Sends a real photo to Gemini (server-side) and shows whatever it could read. */
  async function scanPhotoWithAI(imgData: string, fileName?: string) {
    setScannedImage(imgData);
    setScannedData(null);
    setScanError("");
    setScanConfidence("");
    setScanNote("");
    setStage("scanning");

    try {
      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: imgData }),
      });
      const payload = (await res.json()) as {
        fields?: Record<string, string>;
        confidence?: string;
        note?: string;
        isNameplate?: boolean;
        docType?: string;
        error?: string;
      };

      if (!res.ok) {
        setScanError(payload.error || "เรียกใช้ AI ไม่สำเร็จ กรุณาลองใหม่");
        setStage("error");
        return;
      }
      if (payload.isNameplate === false) {
        setScanError(payload.note || "รูปนี้ไม่ใช่ป้าย Nameplate หรือเอกสาร Product Specifications Sheet กรุณาถ่ายป้ายข้อมูลบนตัวเครื่องหรือเอกสารสเปก");
        setStage("error");
        return;
      }

      const fields = payload.fields || {};
      if (Object.keys(fields).length === 0) {
        setScanError(payload.note || "อ่านข้อมูลจากรูปนี้ไม่ได้ กรุณาถ่ายหรืออัปโหลดให้ชัดเจนขึ้น");
        setStage("error");
        return;
      }

      // The attachment name is factual metadata about the photo, not a model reading.
      setScannedData({ ...fields, docs: fileName || "scanned_specification_doc.jpg" });
      setScanConfidence(payload.confidence || "");
      setScanNote(payload.note || "");
      setStage("preview");
    } catch (err) {
      console.warn("OCR call failed:", err);
      setScanError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่");
      setStage("error");
    }
  }

  function retakePhoto() {
    setStage("capture");
    setScanError("");
    setFileInputKey((k) => k + 1);
  }

  function applyPhotoDataToForm() {
    if (!scannedData) return;
    const category = String(scannedData.category ?? "");
    // ตรวจสอบสิทธิ์ Category หากผู้ใช้คือ Buyer
    if (
      role === "buyer" &&
      !(
        category &&
        (buyerAllowedCategories || []).some((a) => String(a).trim().toLowerCase() === category.trim().toLowerCase())
      )
    ) {
      alert(`บัญชีของคุณไม่มีสิทธิ์ในหมวด "${category}"\n(ได้รับสิทธิ์เฉพาะหมวดที่ Admin กำหนดให้)`);
      return;
    }
    const stringData: Record<string, string> = {};
    Object.entries(scannedData).forEach(([k, v]) => {
      stringData[k] = String(v);
    });
    onApply(stringData, scannedImage || "");
    onClose();
  }

  const tabClass = (t: Tab) =>
    t === tab
      ? "py-2 rounded-xl transition-all bg-emerald-700 text-white shadow-xs flex items-center justify-center gap-1.5"
      : "py-2 rounded-xl transition-all text-gray-600 hover:text-gray-900 flex items-center justify-center gap-1.5";

  const d = scannedData;
  const extracted: [string, string | number | undefined][] = d
    ? [
        ["ยี่ห้อ / Brand", d.brand],
        ["รุ่น / Model No.", d.model || d.model2],
        ["หมายเลขเครื่อง (Serial)", d.serial || d.serial2],
        ["หมวดหมู่ (Category)", d.category],
        ["Sub Category", d.subCat],
        ["พิกัด / Capacity", d.cap],
        ["ระบบไฟฟ้า (Power)", d.power],
        ["Utility Requirement", d.util],
        ["ขนาด & น้ำหนัก (Dimension)", d.dim],
        ["Operating Condition", d.opc],
        ["มาตรฐานรับรอง", d.std],
        ["Functional Requirements", d.func],
        ["อายุการใช้งาน (Useful Life)", d.life ? `${d.life} ปี` : undefined],
        // A real read often misses one or both of these, so don't render "undefined".
        ["ประเทศผู้ผลิต (Origin)", [d.origin, d.mfgDate && "(" + d.mfgDate + ")"].filter(Boolean).join(" ")],
      ]
    : [];

  return (
    <div
      id="photoModal"
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl w-full max-w-2xl my-6 p-6 sm:p-8 shadow-2xl border border-gray-100 animate-fadein">
        {/* Modal Header */}
        <div className="flex justify-between items-start mb-4 border-b pb-3.5">
          <div>
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                ></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              <h3 className="text-xl font-bold text-gray-900">ถ่ายภาพเพื่อกรอกข้อมูลอัตโนมัติ</h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              ถ่ายภาพป้าย Nameplate หรืออัปโหลดเอกสารสเปกสินค้า เพื่อให้ AI สแกนและกรอกข้อมูลลงฟอร์มอัตโนมัติ
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">
            &times;
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1 rounded-2xl mb-4 text-xs sm:text-sm font-semibold">
          <button type="button" onClick={() => setTab("cam")} id="tab-cam" className={tabClass("cam")}>
            <span>ถ่ายรูปจากกล้อง</span>
          </button>
          <button type="button" onClick={() => setTab("file")} id="tab-file" className={tabClass("file")}>
            <span>อัปโหลดรูป</span>
          </button>
        </div>

        {/* STAGE 1: Capture / Selection Stage */}
        <div id="capture-stage" className={stage === "capture" ? "" : "hidden"}>
          {/* Tab 1: Camera Live Stream */}
          <div id="panel-cam" className={`space-y-3${tab === "cam" ? "" : " hidden"}`}>
            <div className="relative bg-slate-900 rounded-2xl overflow-hidden aspect-video flex items-center justify-center border border-slate-700">
              <video ref={videoRef} id="camVideo" autoPlay playsInline muted className="w-full h-full object-cover"></video>
              {/* Camera Overlay Guide */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-4">
                <div className="text-[11px] bg-black/60 text-emerald-400 px-3 py-1 rounded-full font-medium shadow-sm">
                  วางป้าย Nameplate ให้อยู่ในกรอบสี่เหลี่ยม
                </div>
                <div className="w-3/4 h-2/3 border-2 border-dashed border-emerald-400/80 rounded-xl relative shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-400"></div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-400"></div>
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-400"></div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-400"></div>
                </div>
                <div id="cam-status" className="text-xs text-white/80 bg-black/40 px-2 py-0.5 rounded">
                  {camStatus}
                </div>
              </div>
              <canvas ref={canvasRef} id="camCanvas" className="hidden"></canvas>
            </div>

            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}
                id="btn-switch-cam"
                className="text-xs border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-3.5 py-2.5 rounded-xl font-medium flex items-center gap-1.5 transition-all"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  ></path>
                </svg>
                <span>สลับกล้อง</span>
              </button>
              <button
                type="button"
                onClick={takeSnapshot}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
                <span>กดถ่ายภาพนี้</span>
              </button>
            </div>
          </div>

          {/* Tab 2: Upload File View */}
          <div id="panel-file" className={tab === "file" ? "" : "hidden"}>
            <label
              htmlFor="nameplateFileInput"
              className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all bg-emerald-50/30 hover:bg-emerald-50/60 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-xs">
                <svg className="w-7 h-7 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  ></path>
                </svg>
              </div>
              <div className="text-sm font-bold text-gray-800 mb-1">คลิกเพื่อเลือกรูปภาพ หรือลากไฟล์มาวางที่นี่</div>
              <div className="text-xs text-gray-500 mb-3">รองรับไฟล์ JPG, PNG, WEBP หรือถ่ายจากกล้องมือถือ</div>
              <span className="text-xs bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl shadow-xs group-hover:bg-emerald-800 transition-colors">
                เลือกไฟล์จากเครื่อง
              </span>
              <input
                key={fileInputKey}
                type="file"
                id="nameplateFileInput"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target)}
              />
            </label>
            <div className="mt-3 flex items-start gap-2.5 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl text-xs text-emerald-900">
              <span className="text-base shrink-0 mt-0.5">📄</span>
              <div>
                <div className="font-bold">รองรับเอกสาร 2 รูปแบบ:</div>
                <div className="text-gray-600 text-[11px] mt-0.5 leading-relaxed">
                  1) <strong>ป้าย Nameplate บนตัวเครื่อง</strong>: สำหรับสแกน Model, Brand, Serial No., พิกัดกำลังไฟ<br />
                  2) <strong>Product Specifications Sheet (Datasheet)</strong>: สำหรับสแกนสเปกครบถ้วน เช่น ขนาด &amp; น้ำหนัก, Utility, มาตรฐาน, และเงื่อนไขการทำงาน
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STAGE 1.5: waiting on the AI read */}
        <div id="scanning-stage" className={stage === "scanning" ? "" : "hidden"}>
          <div className="relative bg-slate-900 rounded-2xl overflow-hidden aspect-video flex items-center justify-center border border-slate-700">
            {scannedImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={scannedImage} alt="Nameplate" className="w-full h-full object-cover opacity-60" />
            ) : null}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-pulse"></div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <svg className="w-8 h-8 text-emerald-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              <div className="text-xs text-white/90 bg-black/50 px-3 py-1 rounded-full font-medium">
                กำลังสแกนและอ่านข้อมูลด้วย AI...
              </div>
            </div>
          </div>
          <p className="text-[11px] text-gray-500 text-center mt-3">ใช้เวลาประมาณ 2-5 วินาที กรุณารอสักครู่</p>
        </div>

        {/* STAGE 1.5b: the read failed, or the photo was not a nameplate */}
        <div id="scan-error-stage" className={`${stage === "error" ? "" : "hidden "}space-y-4`}>
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex items-start gap-3">
            <svg className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              ></path>
            </svg>
            <div>
              <div className="font-bold text-rose-900 text-sm mb-1">สแกนข้อมูลจากรูปภาพไม่สำเร็จ</div>
              <p className="text-xs text-rose-800 leading-relaxed">{scanError}</p>
              <p className="text-[11px] text-rose-600/90 mt-2">
                กรุณาถ่ายภาพใหม่อีกครั้ง หรือเลือกไฟล์ภาพที่มีความคมชัดและแสงสว่างเพียงพอ
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end pt-3 border-t">
            <button
              type="button"
              onClick={retakePhoto}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-md hover:shadow-lg transition-all"
            >
              ถ่ายใหม่ / เลือกรูปใหม่
            </button>
          </div>
        </div>

        {/* STAGE 2: Scanning & Extracted Data Preview Stage */}
        <div id="preview-stage" className={`${stage === "preview" ? "" : "hidden "}space-y-4`}>
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Photo Preview with Scanning Animation */}
            <div className="relative bg-slate-900 rounded-2xl overflow-hidden aspect-video flex items-center justify-center border border-slate-700">
              {scannedImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img id="scannedImagePreview" src={scannedImage} alt="Scanned Preview" className="w-full h-full object-cover" />
              ) : null}
              {/* Laser Scan Line Effect */}
              <div
                id="laserScanLine"
                className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-pulse"
              ></div>
              <div
                id="scanBadge"
                className="absolute top-2 left-2 text-[10px] bg-emerald-600/90 text-white font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm"
              >
                <span>
                  {scanConfidence === "high"
                    ? "สแกนสำเร็จ (AI OCR • ชัดเจน)"
                    : scanConfidence === "medium"
                      ? "สแกนสำเร็จ (AI OCR • อ่านได้บางส่วน)"
                      : scanConfidence === "low"
                        ? "สแกนสำเร็จ (AI OCR • ภาพไม่ชัด)"
                        : "สแกนสำเร็จ (AI OCR)"}
                </span>
              </div>
            </div>

            {/* Extracted Data Summary Box */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-xs flex flex-col justify-between">
              <div>
                <div className="font-bold text-emerald-900 text-sm mb-2 flex items-center gap-1.5">
                  <span>ข้อมูลที่ตรวจพบจากรูปภาพ</span>
                </div>
                <div className="space-y-1.5 max-h-[170px] overflow-y-auto pr-1" id="extracted-fields-list">
                  {extracted.map(([label, v]) => (
                    <div key={label} className="flex items-start justify-between gap-2 border-b border-emerald-100/80 pb-1">
                      <span className="text-gray-500 text-[11px] shrink-0">{label}:</span>
                      <strong className="text-emerald-950 font-semibold text-right truncate">{String(v || "-")}</strong>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-[11px] text-emerald-700 mt-2 pt-2 border-t border-emerald-200/60 font-medium">
                {scanNote ? scanNote : "พร้อมนำข้อมูลข้างต้นกรอกลงในฟอร์มทันที"}
                {scanConfidence ? (
                  <span className="block text-emerald-600/80 font-normal mt-1">
                    ช่องที่ไม่มีข้อมูลบนป้ายหรือเอกสาร กรุณากรอกเองในฟอร์ม
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t">
            <button
              type="button"
              onClick={retakePhoto}
              className="border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium px-4 py-2 rounded-xl text-xs transition-colors"
            >
              ถ่ายใหม่ / เลือกรูปใหม่
            </button>
            <button
              type="button"
              onClick={applyPhotoDataToForm}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <span>นำข้อมูลและรูปถ่ายเข้าฟอร์ม (Auto-Fill)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

