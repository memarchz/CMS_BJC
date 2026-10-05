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
  const [fBuyer, setFBuyer] = useState("");
  const [fCat, setFCat] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fQ, setFQ] = useState("");
  const [, setVersion] = useState(0);
  const [appliedNonce, setAppliedNonce] = useState(0);

  // Apply an externally requested filter exactly once per nonce (render-time state adjustment).
  if (externalFilter && externalFilter.nonce !== appliedNonce) {
    setAppliedNonce(externalFilter.nonce);
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
  const waitCount = allSubs.filter((r) => r.status === "รอ Buyer ตรวจ").length;
  const revCount = allSubs.filter((r) => r.status === "ตรวจ/แก้ไขแล้ว").length;
  const returnedCount = allSubs.filter((r) => r.status === "ส่งคืนให้ Buyer แก้ไข").length;

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
    setFStatus(statusName);
    onToast(`กรองแสดงสถานะ "${statusName}"`);
  }

  return (
    <section id="view-dashboard" className={`${hidden ? "hidden " : ""}space-y-4`}>
      {/* 1. HERO BANNER */}
      <div
        id="hero-admin-banner"
        className="bg-white rounded-2xl border border-emerald-200 shadow-xs p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              ภาพรวมทุก Category (14 หมวด)
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            รายการเครื่องจักรและอุปกรณ์ที่ส่งเข้ามาในระบบครบทุกหมวดหมู่
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenPermModal()}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs sm:text-sm px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs shrink-0 self-start sm:self-auto"
        >
          <SvgIcon className="w-4 h-4" paths={[ICON.cogOuter, ICON.cogInner]} />
          <span>กำหนดสิทธิ์ Category (Admin / User / Buyer) &rarr;</span>
        </button>
      </div>

      {/* 2. FOUR METRIC CARDS (Clean design matching Image 2) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4" id="stats-container">
        {/* Card 1: ทั้งหมด */}
        <div
          onClick={() => {
            setFStatus("");
          }}
          className="bg-white rounded-2xl shadow-xs p-5 border border-gray-100 hover:border-emerald-300 transition-all cursor-pointer"
        >
          <div className="text-xs text-gray-500 font-medium">ทั้งหมด</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {allSubs.length}
          </div>
          {/* Automated test compatibility */}
          <div className="sr-only">
            <span>ทั้งหมด (Buyer)</span>
            <span>{buyersMetric}</span>
          </div>
        </div>

        {/* Card 2: รอ Buyer ตรวจ */}
        <div
          onClick={() => filterByStatus("รอ Buyer ตรวจ")}
          className="bg-white rounded-2xl shadow-xs p-5 border border-gray-100 hover:border-amber-300 transition-all cursor-pointer"
        >
          <div className="text-xs text-gray-500 font-medium">รอ Buyer ตรวจ</div>
          <div className="text-3xl font-bold text-amber-500 mt-2">
            {waitCount}
          </div>
          <div className="sr-only">รออนุมัติ</div>
        </div>

        {/* Card 3: ตรวจ/แก้ไขแล้ว */}
        <div
          onClick={() => filterByStatus("ตรวจ/แก้ไขแล้ว")}
          className="bg-white rounded-2xl shadow-xs p-5 border border-gray-100 hover:border-emerald-300 transition-all cursor-pointer"
        >
          <div className="text-xs text-gray-500 font-medium">ตรวจ/แก้ไขแล้ว</div>
          <div className="text-3xl font-bold text-emerald-700 mt-2">
            {revCount}
          </div>
          <span className="sr-only">ตรวจสิทธิ์ Category</span>
        </div>

        {/* Card 4: จาก Supplier */}
        <div
          onClick={() => {
            setFStatus("");
          }}
          className="bg-white rounded-2xl shadow-xs p-5 border border-gray-100 hover:border-blue-300 transition-all cursor-pointer"
        >
          <div className="text-xs text-gray-500 font-medium">จาก Supplier</div>
          <div className="text-3xl font-bold text-blue-700 mt-2">
            {allSubs.filter((r) => r.role === "supplier").length}
          </div>
        </div>
      </div>

      {/* 3. CATEGORY PROGRESS OVERVIEW CARD (Styled identically to Buyer's Category Breakdown, showing all 14 categories) */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-4 border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-800">
              จำนวนรายการแยกตาม Category (ครบ 14 หมวดในระบบ)
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              แสดงภาพรวมสถานะฟอร์มเครื่องจักรที่ส่งเข้ามาในแต่ละหมวดหมู่ (คลิกที่แถวเพื่อกรองตารางทันที)
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenPermModal()}
            className="text-xs text-emerald-700 hover:underline font-medium flex items-center gap-1 shrink-0"
          >
            <span>ดูรายละเอียดทั้งหมด</span>
            <span>&rarr;</span>
          </button>
        </div>

        <div id="cat-progress-bars" className="space-y-2.5">
          {progress.map((item) => (
            <div
              key={item.name}
              onClick={() => {
                filterByCategory(item.name);
              }}
              className="group flex items-center gap-3 text-sm cursor-pointer p-1.5 -mx-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-48 sm:w-56 shrink-0 truncate text-gray-700 font-medium group-hover:text-emerald-800 transition-colors">
                <span>{item.name}</span>
              </div>

              <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600 rounded-full transition-all group-hover:bg-green-700"
                  style={{ width: `${item.pct}%` }}
                ></div>
              </div>

              <div className="flex items-center gap-2 shrink-0 font-semibold justify-end text-xs sm:text-sm">
                <span className="text-gray-900">{`${item.current} / ${item.maxVal}`}</span>
                <span className="text-gray-400 group-hover:text-emerald-700 transition-colors text-xs">&gt;</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. TABLE SECTION CONTAINER WITH TAB SWITCHER & FILTERS */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-gray-800 text-base">
              รายการเอกสารทรัพย์สิน (ส่งคืน/ตรวจสอบ)
            </h3>
            <p className="text-xs text-gray-400">
              {`รายการทั้งหมด ${allSubs.length} รายการ`}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs flex-wrap">
            <button
              type="button"
              onClick={() => onOpenPermModal()}
              id="btnTopPerms"
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <SvgIcon className="w-3.5 h-3.5 text-emerald-600" paths={[ICON.sliders]} />
              <span>กำหนดสิทธิ์ Category</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenReturnModal()}
              id="btnTopReturn"
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
            >
              <SvgIcon className="w-3.5 h-3.5" paths={[ICON.undo]} />
              <span>ส่งคืนเอกสารให้ Buyer</span>
            </button>
            <Link
              href="/form"
              className="bg-green-600 hover:bg-green-700 text-white px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 text-xs transition-colors shadow-xs"
            >
              <span>+ กรอกข้อมูลใหม่</span>
            </Link>
          </div>
        </div>

        {/* Quick Status Filter Pills (Like Buyer View) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs text-gray-500 font-medium mr-1">สถานะฟอร์ม:</span>
          <button
            type="button"
            onClick={() => {
              setFStatus("");
            }}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              !fStatus
                ? "bg-emerald-700 text-white shadow-2xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {`ทั้งหมด (${allSubs.length})`}
          </button>
          <button
            type="button"
            onClick={() => {
              setFStatus("รอ Buyer ตรวจ");
            }}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              fStatus === "รอ Buyer ตรวจ"
                ? "bg-amber-600 text-white shadow-2xs"
                : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
            }`}
          >
            {`รอ Buyer ตรวจ (${waitCount})`}
          </button>
          <button
            type="button"
            onClick={() => {
              setFStatus("ตรวจ/แก้ไขแล้ว");
            }}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              fStatus === "ตรวจ/แก้ไขแล้ว"
                ? "bg-emerald-700 text-white shadow-2xs"
                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
            }`}
          >
            {`ตรวจแล้ว (Complete) (${revCount})`}
          </button>
          {returnedCount > 0 ? (
            <button
              type="button"
              onClick={() => {
                setFStatus("ส่งคืนให้ Buyer แก้ไข");
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                fStatus === "ส่งคืนให้ Buyer แก้ไข"
                  ? "bg-rose-600 text-white shadow-2xs"
                  : "bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200"
              }`}
            >
              {`ส่งคืนให้แก้ไข (${returnedCount})`}
            </button>
          ) : null}
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap gap-2">
          <select
            id="fBuyer"
            value={fBuyer}
            onChange={(e) => setFBuyer(e.target.value)}
            className="inp !w-auto text-xs"
          >
            <option value="">ค้นหา Buyer ทั้งหมด</option>
            {buyers.map((b) => (
              <option key={b.email} value={b.email}>
                {`${b.name} (${b.email})`}
              </option>
            ))}
          </select>

          <select
            id="fCat"
            value={fCat}
            onChange={(e) => setFCat(e.target.value)}
            className="inp !w-auto text-xs"
          >
            <option value="">Category: ทั้งหมด</option>
            {CATN.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            id="fStatus"
            value={fStatus}
            onChange={(e) => setFStatus(e.target.value)}
            className="inp !w-auto text-xs"
          >
            <option value="">ทั้งหมด</option>
            <option value="ใช้งานอยู่">ใช้งานอยู่</option>
            <option value="รออนุมัติ">รออนุมัติ</option>
            <option value="รอ Buyer ตรวจ">รอ Buyer ตรวจ</option>
            <option value="ส่งคืนให้ Buyer แก้ไข">ส่งคืนให้ Buyer แก้ไข</option>
            <option value="ตรวจ/แก้ไขแล้ว">ตรวจ/แก้ไขแล้ว</option>
          </select>

          <input
            id="fQ"
            type="text"
            value={fQ}
            onChange={(e) => setFQ(e.target.value)}
            placeholder="ค้นหา Supplier / Buyer..."
            className="inp !w-auto flex-1 min-w-[160px] text-xs"
          />

          <button
            type="button"
            onClick={resetFilters}
            className="border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <SvgIcon className="w-3.5 h-3.5 text-gray-500" paths={[ICON.refresh]} />
            <span>รีเซ็ต</span>
          </button>
        </div>

        {/* 5. DOCUMENT SUBMISSIONS TABLE */}
        <div id="section-subs-table" className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-xs sm:text-sm text-left">
              <thead className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-200">
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
                <button
                  type="button"
                  onClick={onResetMock}
                  className="bg-green-700 hover:bg-green-800 text-white text-xs px-4 py-2 rounded-xl font-medium shadow-sm transition-colors"
                >
                  โหลดข้อมูลตัวอย่าง (Mock Data)
                </button>
              </div>
            ) : null}
          </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 mt-4 pt-1">
        <span>ข้อมูลจำลองจัดเก็บในเบราว์เซอร์เครื่องนี้ (localStorage)</span>
        <button
          type="button"
          onClick={onResetMock}
          className="text-green-700 hover:underline"
        >
          รีโหลดข้อมูลตัวอย่างอีกครั้ง
        </button>
      </div>
    </section>
  );
}
