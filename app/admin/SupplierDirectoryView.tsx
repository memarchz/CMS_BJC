"use client";

import { Fragment, useState } from "react";
import { Suppliers, type Supplier } from "../../lib/suppliers";
import { Store, type Submission } from "../../lib/store";
import { fdt } from "../../lib/format";
import { ICON, SvgIcon } from "./SvgIcon";

type Props = {
  onBack: () => void;
  onOpenAddSupplier: () => void;
  onViewSupplierDetail: (sup: Supplier) => void;
  onViewSub?: (sub: Submission) => void;
};

export function SupplierDirectoryView({
  onBack,
  onOpenAddSupplier,
  onViewSupplierDetail,
  onViewSub,
}: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const [, setVersion] = useState(0);

  const sups = Suppliers.all();
  const allSubs = Store.all();

  let totalValue = 0;
  allSubs.forEach((s) => {
    totalValue += parseFloat(String(s.values?.price ?? "")) || 0;
  });

  const q = search.toLowerCase().trim();
  const filtered = sups.filter((s) => {
    const matchQ =
      !q ||
      (s.company && s.company.toLowerCase().includes(q)) ||
      (s.code && s.code.toLowerCase().includes(q)) ||
      (s.contact && s.contact.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.taxId && s.taxId.includes(q));
    const matchStatus = !statusFilter || s.status === statusFilter;
    return matchQ && matchStatus;
  });

  function handleStatusChange(email: string, newStatus: string) {
    Suppliers.save({ email, status: newStatus });
    setVersion((v) => v + 1);
  }

  return (
    <section id="view-suppliers" className="space-y-4 animate-fadein">
      {/* Top Bar with Back Button & Breadcrumbs */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onBack();
              }}
              className="hover:text-emerald-700 flex items-center gap-1 font-medium transition-colors"
            >
              <SvgIcon className="w-3.5 h-3.5" paths={[ICON.home]} />
              <span>หน้าหลัก</span>
            </a>
            <span>/</span>
            <span className="text-gray-700 font-semibold">ทะเบียนและข้อมูลคู่ค้า Supplier</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">ทะเบียนและข้อมูลคู่ค้า Supplier</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              Supplier Directory Full View
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 leading-relaxed">
            ดูรายชื่อนิติบุคคลคู่ค้า เลขประจำตัวผู้เสียภาษี ข้อมูลติดต่อ และประวัติรายการเครื่องจักรที่ส่งเข้ามาในระบบ
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onBack}
            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-3.5 py-2 rounded-lg font-medium text-xs sm:text-sm flex items-center gap-2 shadow-2xs transition-colors"
          >
            <SvgIcon className="w-4 h-4 text-gray-500" paths={[ICON.arrowLeft]} />
            <span>กลับหน้าหลัก</span>
          </button>
          <button
            type="button"
            onClick={onOpenAddSupplier}
            className="bg-green-600 hover:bg-green-700 text-white px-3.5 py-2 rounded-lg font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <span>+ เพิ่มคู่ค้าใหม่</span>
          </button>
        </div>
      </div>

      {/* 4 Stats Cards for Suppliers (matching Buyer StatCard pattern) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4" id="full-supplier-stats">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-xs font-medium text-gray-500">คู่ค้าทั้งหมด</div>
            <div className="text-3xl font-bold text-gray-900 mt-1">{sups.length}</div>
          </div>
          <div className="text-[11px] text-gray-400 mt-2">นิติบุคคลในระบบ</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-xs font-medium text-gray-500">อนุมัติแล้ว</div>
            <div className="text-3xl font-bold text-emerald-700 mt-1">{sups.filter((s) => s.status === "อนุมัติแล้ว").length}</div>
          </div>
          <div className="text-[11px] text-emerald-600 mt-2">พร้อมส่งมอบงาน</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-xs font-medium text-gray-500">รอตรวจสอบ</div>
            <div className="text-3xl font-bold text-amber-600 mt-1">{sups.filter((s) => s.status === "รอตรวจสอบ").length}</div>
          </div>
          <div className="text-[11px] text-amber-600 mt-2">รอแอดมินอนุมัติ</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-xs font-medium text-gray-500">มูลค่าสั่งซื้อรวม</div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-900 mt-1 font-mono">
              {(totalValue || 4545000).toLocaleString("th-TH")} <span className="text-xs font-normal text-gray-500">THB</span>
            </div>
          </div>
          <div className="text-[11px] text-gray-400 mt-2">ทุกสัญญา PO</div>
        </div>
      </div>

      {/* Filter Bar and Supplier Data Table */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative flex-1 min-w-[240px]">
              <input
                id="fullSupSearch"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาชื่อบริษัท, รหัส SUP, เลขประจำตัวผู้เสียภาษี, อีเมล..."
                className="inp text-xs !py-2 !pl-8"
              />
              <SvgIcon className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" paths={[ICON.search]} />
            </div>
            <select
              id="fullSupStatusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="inp text-xs !py-2 !w-auto"
            >
              <option value="">สถานะ: ทั้งหมด</option>
              <option value="อนุมัติแล้ว">อนุมัติแล้ว</option>
              <option value="รอตรวจสอบ">รอตรวจสอบ</option>
              <option value="ระงับชั่วคราว">ระงับชั่วคราว</option>
            </select>
          </div>
        </div>

        {/* Full Table */}
        <div className="bg-white overflow-x-auto border border-gray-100 rounded-2xl shadow-sm">
          <table className="w-full text-xs sm:text-sm text-left">
            <thead className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-200">
              <tr>
                <th className="p-3.5">รหัสคู่ค้า</th>
                <th className="p-3.5">ชื่อบริษัท / นิติบุคคล (คลิกดูรายการ)</th>
                <th className="p-3.5">เลขผู้เสียภาษี (Tax ID)</th>
                <th className="p-3.5">ผู้ติดต่อ & เบอร์โทร</th>
                <th className="p-3.5">อีเมล</th>
                <th className="p-3.5 text-center">รายการที่ส่ง</th>
                <th className="p-3.5 text-center">สถานะ</th>
                <th className="p-3.5 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody id="full-supplier-rows" className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-xs text-gray-400">
                    ไม่พบคู่ค้าตามเงื่อนไขที่ค้นหา
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const supplierSubs = allSubs.filter(
                    (item) =>
                      (item.email || "").toLowerCase() === (s.email || "").toLowerCase() ||
                      String(item.values?.sup || "").toLowerCase().includes(s.code.toLowerCase())
                  );
                  const itemCount = supplierSubs.length;
                  const isExpanded = expandedCode === s.code;

                  // Group items by category/block
                  const catMap: Record<string, number> = {};
                  supplierSubs.forEach((item) => {
                    const cat = String(item.values?.category || "ทั่วไป (Uncategorized)");
                    catMap[cat] = (catMap[cat] || 0) + 1;
                  });
                  const catBreakdown = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

                  return (
                    <Fragment key={s.code}>
                      <tr
                        className={`transition-colors ${
                          isExpanded ? "bg-emerald-50/50" : "hover:bg-gray-50/80"
                        }`}
                      >
                        <td className="p-3.5 font-mono font-semibold text-emerald-800 text-xs">{s.code}</td>
                        {/* Company Name with Dropdown Trigger */}
                        <td className="p-3.5">
                          <button
                            type="button"
                            onClick={() => {
                              setExpandedCode((prev) => (prev === s.code ? null : s.code));
                            }}
                            className="group/name text-left flex items-start gap-2.5 w-full cursor-pointer focus:outline-none"
                            aria-label={`เปิด/ปิดรายละเอียด ${s.company}`}
                            aria-expanded={isExpanded}
                            title={isExpanded ? "คลิกเพื่อย่อรายละเอียด" : "คลิกเพื่อดูรายการเครื่องจักรและสรุปหมวดหมู่"}
                          >
                            <div
                              className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                                isExpanded
                                  ? "bg-emerald-700 text-white shadow-2xs rotate-180"
                                  : "bg-gray-100 text-gray-500 group-hover/name:bg-emerald-100 group-hover/name:text-emerald-800"
                              }`}
                            >
                              <svg className="w-3.5 h-3.5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-gray-900 group-hover/name:text-emerald-800 transition-colors flex items-center gap-2 flex-wrap">
                                <span>{s.company}</span>
                                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  {itemCount} เครื่อง
                                </span>
                              </div>
                              <div className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">{s.address || "-"}</div>
                            </div>
                          </button>
                        </td>
                        <td className="p-3.5 font-mono text-gray-600 text-xs">{s.taxId || "-"}</td>
                        <td className="p-3.5">
                          <div className="text-gray-800 font-medium">{s.contact || "-"}</div>
                          <div className="text-[11px] text-gray-500">{s.phone || "-"}</div>
                        </td>
                        <td className="p-3.5 font-mono text-gray-600 text-xs">{s.email}</td>
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              if (itemCount > 0) {
                                setExpandedCode((prev) => (prev === s.code ? null : s.code));
                              }
                            }}
                            disabled={itemCount === 0}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                              itemCount > 0
                                ? isExpanded
                                  ? "bg-emerald-700 text-white shadow-xs cursor-pointer ring-2 ring-emerald-400"
                                  : "bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                                : "bg-gray-100 text-gray-400 cursor-default"
                            }`}
                            title={
                              itemCount > 0
                                ? isExpanded
                                  ? "คลิกเพื่อย่อรายละเอียด"
                                  : "จิ้มดูว่าแต่ละบล็อก/หมวดหมู่กรอกมากี่อัน"
                                : "ยังไม่มีรายการที่ส่ง"
                            }
                            aria-expanded={isExpanded}
                          >
                            <span>{`${itemCount} เครื่อง`}</span>
                            {itemCount > 0 && (
                              <span className="text-[10px] opacity-80 font-mono">
                                {isExpanded ? "▲" : "▼"}
                              </span>
                            )}
                          </button>
                        </td>
                        {/* Status Column with Interactive Badge and Indicator Dot */}
                        <td className="p-3.5 text-center">
                          <div className="relative inline-flex items-center">
                            <select
                              value={s.status || "อนุมัติแล้ว"}
                              onChange={(e) => handleStatusChange(s.email, e.target.value)}
                              className={`appearance-none text-xs font-semibold pl-6 pr-6 py-1 rounded-full border cursor-pointer transition-all shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                                s.status === "อนุมัติแล้ว"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                                  : s.status === "รอตรวจสอบ"
                                  ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                                  : "bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100"
                              }`}
                              title="คลิกเพื่อเปลี่ยนสถานะ"
                            >
                              <option value="อนุมัติแล้ว">อนุมัติแล้ว</option>
                              <option value="รอตรวจสอบ">รอตรวจสอบ</option>
                              <option value="ระงับชั่วคราว">ระงับชั่วคราว</option>
                            </select>
                            <span
                              className={`w-2 h-2 rounded-full absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                                s.status === "อนุมัติแล้ว"
                                  ? "bg-emerald-500"
                                  : s.status === "รอตรวจสอบ"
                                  ? "bg-amber-500 animate-pulse"
                                  : "bg-rose-500"
                              }`}
                            />
                            <svg
                              className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => onViewSupplierDetail(s)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-xs px-3 py-1.5 rounded-lg transition-all shadow-2xs"
                          >
                            ดูรายละเอียด
                          </button>
                        </td>
                      </tr>

                      {/* Inline breakdown panel when tapped */}
                      {isExpanded && (
                        <tr className="bg-emerald-50/30 border-y-2 border-emerald-200 animate-fadein">
                          <td colSpan={8} className="p-3 sm:p-5">
                            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-200 shadow-sm space-y-4">
                              {/* Header of expanded section */}
                              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base shrink-0">
                                    <SvgIcon className="w-5 h-5" paths={[ICON.doc]} />
                                  </div>
                                  <div>
                                    <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                      <span>รายการเครื่องจักรที่ส่งเข้ามา ({s.company})</span>
                                      <span className="bg-emerald-50 text-emerald-800 font-mono text-xs px-2 py-0.5 rounded border border-emerald-200">
                                        {s.code}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      สรุปจำนวนที่กรอกแยกตามบล็อก / หมวดหมู่ และรายการเครื่องจักรทั้งหมดของคู่ค้ารายนี้ ({itemCount} เครื่อง)
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => onViewSupplierDetail(s)}
                                    className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
                                  >
                                    ดูข้อมูลคู่ค้าฉบับเต็ม &rarr;
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setExpandedCode(null)}
                                    className="text-xs text-gray-500 hover:text-gray-800 px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
                                    title="ย่อแถว"
                                  >
                                    ▲ ปิด
                                  </button>
                                </div>
                              </div>

                              {/* Category breakdown pill list */}
                              <div>
                                <div className="text-xs font-bold text-gray-700 mb-2">
                                  จำนวนที่กรอกแยกตามแต่ละบล็อก / หมวดหมู่:
                                </div>
                                {catBreakdown.length === 0 ? (
                                  <p className="text-xs text-gray-400 italic">ยังไม่มีข้อมูลการส่งฟอร์ม</p>
                                ) : (
                                  <div className="flex flex-wrap gap-2">
                                    {catBreakdown.map(([catName, cnt]) => (
                                      <div
                                        key={catName}
                                        className="bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl px-3 py-1.5 text-xs font-medium flex items-center gap-2 shadow-2xs"
                                      >
                                        <span className="font-semibold text-gray-900">{catName}</span>
                                        <span className="bg-emerald-700 text-white rounded-full px-2 py-0.2 text-[10px] font-bold">
                                          {cnt} เครื่อง
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Machine list table */}
                              {supplierSubs.length > 0 && (
                                <div className="border border-gray-200 rounded-xl overflow-hidden mt-3">
                                  <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 text-xs font-bold text-gray-700 flex justify-between items-center">
                                    <span>ตารางเครื่องจักรที่ส่งเข้ามาทั้งหมด ({supplierSubs.length} รายการ)</span>
                                    <span className="text-[11px] font-normal text-gray-500">
                                      คลิก &quot;ดูฟอร์ม&quot; เพื่อตรวจสอบรายละเอียด
                                    </span>
                                  </div>
                                  <table className="w-full text-xs text-left">
                                    <thead className="bg-gray-100 text-gray-600 border-b border-gray-200">
                                      <tr>
                                        <th className="p-2.5">วันที่ส่ง</th>
                                        <th className="p-2.5">ชื่อเครื่องจักร / อุปกรณ์</th>
                                        <th className="p-2.5">บล็อก / หมวดหมู่</th>
                                        <th className="p-2.5">เลข PO / สัญญา</th>
                                        <th className="p-2.5">สถานะ</th>
                                        <th className="p-2.5 text-right">การจัดการ</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                      {supplierSubs.map((sub) => (
                                        <tr key={sub.id} className="hover:bg-gray-50/80 transition-colors">
                                          <td className="p-2.5 text-gray-500 whitespace-nowrap">{fdt(sub.at)}</td>
                                          <td className="p-2.5 font-bold text-gray-900">{sub.title}</td>
                                          <td className="p-2.5">
                                            <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[11px] font-medium border border-gray-200">
                                              {String(sub.values?.category || "ทั่วไป")}
                                            </span>
                                          </td>
                                          <td className="p-2.5 font-mono text-gray-600">{String(sub.values?.po || "-")}</td>
                                          <td className="p-2.5 whitespace-nowrap">
                                            <span
                                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                                                sub.status === "อนุมัติแล้ว" || sub.status === "ตรวจแล้ว"
                                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                                  : sub.status === "ส่งคืนให้ Buyer แก้ไข" ||
                                                    sub.status === "ส่งคืนให้ Supplier แก้ไข"
                                                  ? "bg-rose-50 text-rose-800 border-rose-200"
                                                  : "bg-amber-50 text-amber-800 border-amber-200"
                                              }`}
                                            >
                                              <span
                                                className={`w-1.5 h-1.5 rounded-full ${
                                                  sub.status === "อนุมัติแล้ว" || sub.status === "ตรวจแล้ว"
                                                    ? "bg-emerald-500"
                                                    : sub.status === "ส่งคืนให้ Buyer แก้ไข" ||
                                                      sub.status === "ส่งคืนให้ Supplier แก้ไข"
                                                    ? "bg-rose-500 animate-pulse"
                                                    : "bg-amber-500"
                                                }`}
                                              />
                                              <span>{sub.status || "รอตรวจ"}</span>
                                            </span>
                                          </td>
                                          <td className="p-2.5 text-right whitespace-nowrap">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (onViewSub) {
                                                  onViewSub(sub);
                                                } else {
                                                  onViewSupplierDetail(s);
                                                }
                                              }}
                                              className="bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold px-2.5 py-1 rounded text-xs transition-colors shadow-2xs"
                                            >
                                              ดูฟอร์ม &rarr;
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
