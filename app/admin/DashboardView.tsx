"use client";

import { useState } from "react";
import Link from "next/link";
import { Store, type Submission } from "../../lib/store";
import { Permissions } from "../../lib/permissions";
import { Suppliers, type Supplier } from "../../lib/suppliers";
import { CATN } from "../../lib/catalog";
import { fdt } from "../../lib/format";
import { StatusBadge } from "../../components/StatusBadge";
import { CAT_DISPLAY_CONFIG } from "./catDisplay";
import { ICON, SvgIcon } from "./SvgIcon";
import { resolveSupplier } from "./resolveSupplier";

type Props = {
  onOpenPermModal: (email?: string) => void;
  onOpenReturnModal: (subId?: string) => void;
  onViewSub: (sub: Submission) => void;
  onSwitchToView: (view: "perms" | "suppliers") => void;
  onViewSupplier: (sup: Supplier) => void;
  onEditSub: (subId: string) => void;
  onResetMock: () => void;
  onToast: (message: string) => void;
  /** Set by the page shell (e.g. "filter main list by supplier"); applied once per nonce. */
  externalFilter?: { q: string; nonce: number } | null;
  /** Mirrors the original `hidden` class on #view-dashboard while another view is shown. */
  hidden?: boolean;
};

const TAB_ON =
  "px-4 py-2 rounded-xl text-xs font-semibold transition-all bg-white text-emerald-800 shadow-xs flex items-center gap-1.5";
const TAB_OFF =
  "px-4 py-2 rounded-xl text-xs font-semibold transition-all text-gray-600 hover:text-gray-900 flex items-center gap-1.5";

export function DashboardView({
  onOpenPermModal,
  onOpenReturnModal,
  onViewSub,
  onSwitchToView,
  onViewSupplier,
  onEditSub,
  onResetMock,
  onToast,
  externalFilter,
  hidden = false,
}: Props) {
  const [tableTab, setTableTab] = useState<"buyers" | "subs">("buyers");
  const [fBuyer, setFBuyer] = useState("");
  const [fCat, setFCat] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fQ, setFQ] = useState("");
  const [, setVersion] = useState(0);
  const [appliedNonce, setAppliedNonce] = useState(0);

  // Apply an externally requested filter exactly once per nonce (render-time state adjustment).
  if (externalFilter && externalFilter.nonce !== appliedNonce) {
    setAppliedNonce(externalFilter.nonce);
    setTableTab("subs");
    setFQ(externalFilter.q);
  }

  const allSubs = Store.all();
  const buyers = Permissions.getBuyers();
  const suppliers = Suppliers.all();

  // ---- Metrics (js/admin.js:94-126) ----
  const pendingCount = allSubs.filter(
    (r) => r.status === "รอ Buyer ตรวจ" || r.status === "ส่งคืนให้ Buyer แก้ไข" || r.status === "รออนุมัติ"
  ).length;
  const permsCount = buyers.filter((b) => (b.categories || []).length > 0).length;
  const buyersMetric = Math.max(12, buyers.length);
  const pendingMetric = Math.max(2, pendingCount);
  const permsMetric = Math.max(3, permsCount);
  const suppliersMetric = Math.max(28, suppliers.length * 4 + allSubs.length);

  // ---- Category progress (js/admin.js:128-168) ----
  const counts: Record<string, number> = {};
  allSubs.forEach((r) => {
    const c = String(r.values?.category || "ไม่ระบุ");
    counts[c] = (counts[c] || 0) + 1;
  });
  const progress = Object.entries(CAT_DISPLAY_CONFIG).map(([name, conf]) => {
    const current = Math.max(conf.mockupCount, counts[name] || 0);
    const maxVal = Math.max(conf.max, current);
    const pct = Math.min(100, Math.round((current / maxVal) * 100));
    return { name, conf, current, maxVal, pct };
  });

  // ---- Filters ----
  const qBuyer = fBuyer.toLowerCase().trim();
  const qCat = fCat.trim();
  const qStatus = fStatus.trim();
  const qText = fQ.toLowerCase().trim();

  const filteredBuyers = buyers.filter((b) => {
    const cats = b.categories || [];
    const matchBuyer = !qBuyer || b.email.toLowerCase().includes(qBuyer) || b.name.toLowerCase().includes(qBuyer);
    const matchCat = !qCat || cats.includes(qCat);
    const matchStatus = !qStatus || (b.status || "ใช้งานอยู่") === qStatus;
    const matchQ =
      !qText ||
      b.name.toLowerCase().includes(qText) ||
      b.email.toLowerCase().includes(qText) ||
      cats.some((c) => c.toLowerCase().includes(qText));
    return matchBuyer && matchCat && matchStatus && matchQ;
  });

  const byId = new Map<string, Submission>();
  allSubs.forEach((r) => byId.set(r.id, r));
  const sortedSubs = Array.from(byId.values()).sort((x, y) => y.at - x.at);
  const filteredSubs = sortedSubs.filter((r) => {
    const matchBuyer =
      !qBuyer || (r.assignedBuyer || "").toLowerCase().includes(qBuyer) || (r.email || "").toLowerCase().includes(qBuyer);
    const matchCat = !qCat || r.values?.category === qCat;
    const matchStatus = !qStatus || r.status === qStatus;
    const matchQ =
      !qText ||
      JSON.stringify(r.values || {}).toLowerCase().includes(qText) ||
      (r.email || "").toLowerCase().includes(qText) ||
      (r.title || "").toLowerCase().includes(qText) ||
      (r.returnReason || "").toLowerCase().includes(qText);
    return matchBuyer && matchCat && matchStatus && matchQ;
  });

  function resetFilters() {
    setFBuyer("");
    setFCat("");
    setFStatus("");
    setFQ("");
    onToast("รีเซ็ตเงื่อนไขการค้นหาเรียบร้อย");
  }

  function filterByCategory(catName: string) {
    setFCat(catName);
    onToast(`กรองแสดงเฉพาะหมวด "${catName}"`);
  }

  function filterByStatus(statusName: string) {
    setTableTab("subs");
    setFStatus(statusName);
    onToast(`กรองแสดงสถานะ "${statusName}"`);
  }

  function filterSubsByBuyer(buyerEmail: string) {
    setTableTab("subs");
    setFBuyer(buyerEmail);
  }

  function deleteBuyerPrompt(buyerEmail: string) {
    if (confirm(`คุณต้องการลบ Buyer "${buyerEmail}" หรือไม่?`)) {
      Permissions.delete(buyerEmail);
      setVersion((v) => v + 1);
      onToast(`ลบ Buyer ${buyerEmail} เรียบร้อยแล้ว`);
    }
  }

  return (
    <section id="view-dashboard" className={`${hidden ? "hidden " : ""}space-y-6`}>
      {/* 1. HERO BANNER: Admin Full View */}
      <div
        id="hero-admin-banner"
        className="bg-gradient-to-r from-[#dcfce7]/90 via-[#e0f7ee]/90 to-[#e0f2fe]/80 border border-emerald-200/60 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center text-xl shadow-sm shrink-0">
            <SvgIcon className="w-6 h-6" paths={[ICON.shield]} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Admin Full View</h2>
              <span className="bg-[#dcfce7] text-emerald-800 border border-emerald-300 text-xs font-semibold px-3 py-0.5 rounded-full">
                ทุก Category
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
              คุณสามารถดูข้อมูล จัดการสิทธิ์ของ Buyer
              <br className="hidden sm:inline" />
              และเข้าถึงข้อมูล Supplier ได้ทุก Category ในระบบ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5 justify-between lg:justify-end">
          {/* Clean Laptop Checklist Vector Illustration */}
          <div className="hidden md:flex items-center justify-center">
            <svg className="w-24 h-16" viewBox="0 0 100 68" fill="none">
              <rect x="10" y="8" width="80" height="48" rx="5" fill="#047857" />
              <rect x="15" y="13" width="70" height="38" rx="3" fill="#f0fdf4" />
              <path d="M26 23 L31 28 L43 18" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M26 37 L31 42 L43 32" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="48" y1="23" x2="74" y2="23" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
              <line x1="48" y1="37" x2="74" y2="37" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
              <path d="M2 58 L98 58 L94 64 L6 64 Z" fill="#94a3b8" />
            </svg>
          </div>
          {/* CTA Button */}
          <button
            type="button"
            onClick={() => onOpenPermModal()}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm px-5 py-3 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center gap-2 shrink-0"
          >
            <SvgIcon className="w-4 h-4" paths={[ICON.cogOuter, ICON.cogInner]} />
            <span>กำหนดสิทธิ์ Category ของ Buyer &rarr;</span>
          </button>
        </div>
      </div>

      {/* 2. FOUR METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="stats-container">
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg mb-3">
              <SvgIcon className="w-5 h-5" paths={[ICON.users]} />
            </div>
            <div className="text-xs text-gray-500 font-medium">ทั้งหมด (Buyer)</div>
            <div id="stat-buyers-count" className="text-3xl font-bold text-gray-900 mt-1">
              {buyersMetric}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTableTab("buyers")}
            className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-1 mt-3"
          >
            <span>ดูรายชื่อ Buyer ทั้งหมด</span>
            <span>&rarr;</span>
          </button>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-lg mb-3">
              <SvgIcon className="w-5 h-5" paths={[ICON.clock]} />
            </div>
            <div className="text-xs text-gray-500 font-medium">รออนุมัติ</div>
            <div id="stat-pending-count" className="text-3xl font-bold text-gray-900 mt-1">
              {pendingMetric}
            </div>
          </div>
          <button
            type="button"
            onClick={() => filterByStatus("รอ Buyer ตรวจ")}
            className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1 mt-3"
          >
            <span>ดูรายละเอียด</span>
            <span>&rarr;</span>
          </button>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-lg mb-3">
              <SvgIcon className="w-5 h-5" paths={[ICON.checkCircle]} />
            </div>
            <div className="text-xs text-gray-500 font-medium">ตรวจสิทธิ์ Category</div>
            <div id="stat-perms-count" className="text-3xl font-bold text-gray-900 mt-1">
              {permsMetric}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenPermModal()}
            className="text-xs text-purple-600 font-semibold hover:underline flex items-center gap-1 mt-3"
          >
            <span>ดูรายละเอียด</span>
            <span>&rarr;</span>
          </button>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-lg mb-3">
              <SvgIcon className="w-5 h-5" paths={[ICON.building]} />
            </div>
            <div className="text-xs text-gray-500 font-medium">จาก Supplier</div>
            <div id="stat-suppliers-count" className="text-3xl font-bold text-gray-900 mt-1">
              {suppliersMetric}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSwitchToView("suppliers")}
            className="text-xs text-amber-700 font-semibold hover:underline flex items-center gap-1 mt-3"
          >
            <span>ดูรายชื่อ Supplier ทั้งหมด</span>
            <span>&rarr;</span>
          </button>
        </div>
      </div>

      {/* 3. CATEGORY PROGRESS OVERVIEW CARD */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <SvgIcon className="w-4 h-4" paths={[ICON.shield]} />
            </div>
            <h3 className="font-bold text-base text-gray-900">ภาพรวมรายการกำหนดสิทธิ์ Category</h3>
          </div>
          <button
            type="button"
            onClick={() => onOpenPermModal()}
            className="text-xs text-gray-500 hover:text-emerald-700 font-medium flex items-center gap-1"
          >
            <span>ดูรายละเอียดทั้งหมด</span>
            <span>&rarr;</span>
          </button>
        </div>

        <div id="cat-progress-bars" className="space-y-3.5">
          {progress.map((item) => (
            <div
              key={item.name}
              onClick={() => filterByCategory(item.name)}
              className="group flex items-center gap-4 text-xs sm:text-sm cursor-pointer p-1.5 -mx-1.5 rounded-xl hover:bg-emerald-50/50 transition-colors"
            >
              <div className="flex items-center gap-2.5 w-44 sm:w-56 shrink-0">
                <div className="w-6 h-6 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                  <SvgIcon className={item.conf.iconClass} paths={item.conf.iconPaths} />
                </div>
                <span className="font-medium text-gray-800 truncate group-hover:text-emerald-800 transition-colors">
                  {item.name}
                </span>
              </div>

              <div className="flex-1 h-2.5 sm:h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500 group-hover:bg-emerald-600"
                  style={{ width: `${item.pct}%` }}
                ></div>
              </div>

              <div className="flex items-center gap-2 shrink-0 text-gray-600 font-semibold w-14 justify-end">
                <span className="text-xs sm:text-sm">{`${item.current} / ${item.maxVal}`}</span>
                <span className="text-gray-400 group-hover:text-emerald-700 transition-colors text-xs">&gt;</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. TABLE SECTION CONTAINER WITH TAB SWITCHER & FILTERS */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
          <div className="flex items-center gap-2 bg-gray-100/80 p-1 rounded-2xl w-fit">
            <button
              type="button"
              id="tab-btn-buyers"
              onClick={() => setTableTab("buyers")}
              className={tableTab === "buyers" ? TAB_ON : TAB_OFF}
            >
              <span>สิทธิ์และสถานะ Buyer</span>
              <span
                id="tab-buyers-badge"
                className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.2 rounded-full font-bold"
              >
                {buyers.length}
              </span>
            </button>
            <button
              type="button"
              id="tab-btn-subs"
              onClick={() => setTableTab("subs")}
              className={tableTab === "subs" ? TAB_ON : TAB_OFF}
            >
              <span>รายการเอกสารทรัพย์สิน (ส่งคืน/ตรวจสอบ)</span>
              <span id="tab-subs-badge" className="bg-gray-200 text-gray-700 text-[10px] px-2 py-0.2 rounded-full font-bold">
                {allSubs.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs flex-wrap">
            <button
              type="button"
              onClick={() => onOpenPermModal()}
              id="btnTopPerms"
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3.5 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <SvgIcon className="w-3.5 h-3.5 text-emerald-600" paths={[ICON.sliders]} />
              <span>กำหนดสิทธิ์ Category</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenReturnModal()}
              id="btnTopReturn"
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3.5 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition-colors"
            >
              <SvgIcon className="w-3.5 h-3.5" paths={[ICON.undo]} />
              <span>ส่งคืนเอกสารให้ Buyer</span>
            </button>
            <Link
              href="/form"
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-xl font-semibold flex items-center gap-1 transition-colors"
            >
              <span>+ กรอกข้อมูลใหม่</span>
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 items-end pt-1">
          <div>
            <label htmlFor="fBuyer" className="block text-[11px] font-semibold text-gray-500 mb-1">
              ค้นหา Buyer
            </label>
            <select
              id="fBuyer"
              value={fBuyer}
              onChange={(e) => setFBuyer(e.target.value)}
              className="inp text-xs !py-2 !rounded-xl"
            >
              <option value="">ค้นหา Buyer ทั้งหมด</option>
              {buyers.map((b) => (
                <option key={b.email} value={b.email}>
                  {`${b.name} (${b.email})`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="fCat" className="block text-[11px] font-semibold text-gray-500 mb-1">
              Category
            </label>
            <select id="fCat" value={fCat} onChange={(e) => setFCat(e.target.value)} className="inp text-xs !py-2 !rounded-xl">
              <option value="">Category: ทั้งหมด</option>
              {CATN.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="fStatus" className="block text-[11px] font-semibold text-gray-500 mb-1">
              สถานะ
            </label>
            <select
              id="fStatus"
              value={fStatus}
              onChange={(e) => setFStatus(e.target.value)}
              className="inp text-xs !py-2 !rounded-xl"
            >
              <option value="">ทั้งหมด</option>
              <option value="ใช้งานอยู่">ใช้งานอยู่</option>
              <option value="รออนุมัติ">รออนุมัติ</option>
              <option value="รอ Buyer ตรวจ">รอ Buyer ตรวจ</option>
              <option value="ส่งคืนให้ Buyer แก้ไข">ส่งคืนให้ Buyer แก้ไข</option>
              <option value="ตรวจ/แก้ไขแล้ว">ตรวจ/แก้ไขแล้ว</option>
            </select>
          </div>

          <div>
            <label htmlFor="fQ" className="block text-[11px] font-semibold text-gray-500 mb-1">
              ค้นหาคำค้น
            </label>
            <div className="relative">
              <input
                id="fQ"
                type="text"
                value={fQ}
                onChange={(e) => setFQ(e.target.value)}
                placeholder="ค้นหา Supplier / Buyer..."
                className="inp text-xs !py-2 !rounded-xl w-full pl-8"
              />
              <SvgIcon className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3" paths={[ICON.search]} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetFilters}
              className="w-full border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold py-2 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5 h-[38px]"
            >
              <SvgIcon className="w-3.5 h-3.5 text-gray-500" paths={[ICON.refresh]} />
              <span>รีเซ็ต</span>
            </button>
          </div>
        </div>

        {/* 5A. BUYER PERMISSIONS TABLE */}
        {tableTab === "buyers" ? (
          <div id="section-buyer-table" className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="w-full text-xs sm:text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <input type="checkbox" className="rounded text-emerald-600 focus:ring-emerald-500" />
                  </th>
                  <th className="p-3 w-14">ลำดับ</th>
                  <th className="p-3">ชื่อ Buyer</th>
                  <th className="p-3">อีเมล</th>
                  <th className="p-3">Category ที่เข้าถึง</th>
                  <th className="p-3">สถานะ</th>
                  <th className="p-3 whitespace-nowrap">วันที่อัปเดต</th>
                  <th className="p-3 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody id="buyer-table-rows" className="divide-y divide-gray-100">
                {filteredBuyers.map((b, idx) => {
                  const cats = b.categories || [];
                  const isApproved = (b.status || "ใช้งานอยู่") === "ใช้งานอยู่";
                  return (
                    <tr key={b.email} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-3 text-center">
                        <input type="checkbox" className="rounded text-emerald-600 focus:ring-emerald-500" />
                      </td>
                      <td className="p-3 text-gray-500 font-mono text-xs font-medium">{idx + 1}</td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => onOpenPermModal(b.email)}
                          className="text-left font-semibold text-gray-900 hover:text-emerald-700 transition-colors"
                        >
                          {b.name}
                        </button>
                      </td>
                      <td className="p-3 text-gray-600 font-mono text-xs">{b.email}</td>
                      <td className="p-3">
                        <div
                          onClick={() => onOpenPermModal(b.email)}
                          className="flex flex-wrap max-w-xs sm:max-w-md cursor-pointer group"
                          title="คลิกเพื่อแก้ไขสิทธิ์"
                        >
                          {cats.length > 0 ? (
                            cats.map((c) => (
                              <span
                                key={c}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80 mr-1 mb-1"
                              >
                                {c}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400 italic">ยังไม่กำหนดสิทธิ์</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isApproved
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isApproved ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                          <span>{b.status || "ใช้งานอยู่"}</span>
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap text-gray-500 text-xs">{b.updatedAtStr || "12 มิ.ย. 2568 14:32"}</td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenPermModal(b.email)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors shadow-2xs"
                          >
                            <SvgIcon className="w-3.5 h-3.5 text-emerald-600" paths={[ICON.edit]} />
                            <span>กำหนดสิทธิ์</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => filterSubsByBuyer(b.email)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                            title="ดูเอกสารที่รับผิดชอบ"
                          >
                            <SvgIcon className="w-4 h-4" paths={[ICON.doc]} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteBuyerPrompt(b.email)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="ลบ Buyer"
                          >
                            <SvgIcon className="w-4 h-4" paths={[ICON.trash]} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredBuyers.length === 0 ? (
              <div id="buyer-table-empty" className="p-8 text-center text-gray-400 text-sm">
                ไม่พบบัญชี Buyer ตามเงื่อนไขที่ค้นหา
              </div>
            ) : null}
          </div>
        ) : (
          /* 5B. DOCUMENT SUBMISSIONS TABLE */
          <div id="section-subs-table" className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="w-full text-xs sm:text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <input type="checkbox" className="rounded text-emerald-600 focus:ring-emerald-500" />
                  </th>
                  <th className="p-3">วันที่ส่ง</th>
                  <th className="p-3">รายการ / ทรัพย์สิน</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">ผู้ส่ง (Supplier)</th>
                  <th className="p-3">สถานะ</th>
                  <th className="p-3 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody id="subs-table-rows" className="divide-y divide-gray-100">
                {filteredSubs.map((r) => {
                  const isReturned = r.status === "ส่งคืนให้ Buyer แก้ไข";
                  const supString = r.values?.sup ? String(r.values.sup) : "";
                  return (
                    <tr key={r.id} className={`hover:bg-gray-50/80 transition-colors ${isReturned ? "bg-rose-50/30" : ""}`}>
                      <td className="p-3 text-center">
                        <input type="checkbox" className="rounded text-emerald-600 focus:ring-emerald-500" />
                      </td>
                      <td className="p-3 whitespace-nowrap text-gray-500 text-xs">{fdt(r.at)}</td>
                      <td className="p-3">
                        <div className="font-bold text-gray-900">{r.title}</div>
                        {r.returnReason ? (
                          <div className="text-[11px] text-rose-600 mt-0.5 truncate max-w-xs font-medium">
                            {`ส่งคืน: "${r.returnReason}"`}
                          </div>
                        ) : null}
                      </td>
                      <td className="p-3 text-gray-700">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-gray-100 text-xs font-medium">
                          {String(r.values?.category || "-")}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600 text-xs">
                        <button
                          type="button"
                          onClick={() => onViewSupplier(resolveSupplier(r.email, supString))}
                          className="text-left hover:underline"
                        >
                          <div className="font-semibold text-gray-800">{supString.split("/")[1]?.trim() || r.email}</div>
                          <div className="text-gray-400 font-mono text-[11px]">{r.email}</div>
                        </button>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => onViewSub(r)}
                            className="text-xs text-gray-600 hover:text-emerald-700 font-semibold px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
                          >
                            ดู
                          </button>
                          <button
                            onClick={() => onEditSub(r.id)}
                            className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold px-2 py-1 rounded-md hover:bg-emerald-50 transition-colors"
                          >
                            แก้ไข
                          </button>
                          <button
                            onClick={() => onOpenReturnModal(r.id)}
                            className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold px-2.5 py-1 rounded-lg transition-colors shadow-2xs"
                          >
                            ส่งคืน Buyer
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredSubs.length === 0 ? (
              <div id="subs-table-empty" className="p-10 text-center text-gray-400">
                <p className="mb-2">ยังไม่มีรายการที่ส่งเข้ามา</p>
                <button onClick={onResetMock} className="bg-emerald-700 text-white text-xs px-4 py-2 rounded-xl">
                  รีโหลด Mock Data
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
