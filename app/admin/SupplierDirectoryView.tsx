"use client";

import { useState } from "react";
import { Suppliers, type Supplier } from "../../lib/suppliers";
import { Store } from "../../lib/store";
import { ICON, SvgIcon } from "./SvgIcon";

type Props = {
  onBack: () => void;
  onOpenAddSupplier: () => void;
  onViewSupplierDetail: (sup: Supplier) => void;
};

export function SupplierDirectoryView({ onBack, onOpenAddSupplier, onViewSupplierDetail }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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

  return (
    <section id="view-suppliers" className="space-y-6 animate-fadein">
      {/* Top Bar with Back Button & Breadcrumbs */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
            <span className="text-emerald-800 font-semibold">รายชื่อ Supplier (Supplier Directory)</span>
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
            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2.5 rounded-2xl font-medium text-xs sm:text-sm flex items-center gap-2 shadow-2xs transition-colors"
          >
            <SvgIcon className="w-4 h-4 text-gray-500" paths={[ICON.arrowLeft]} />
            <span>กลับหน้าหลัก</span>
          </button>
          <button
            type="button"
            onClick={onOpenAddSupplier}
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-all"
          >
            <span>+ เพิ่มคู่ค้าใหม่</span>
          </button>
        </div>
      </div>

      {/* 4 Stats Cards for Suppliers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" id="full-supplier-stats">
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs">
          <div className="text-[11px] font-medium text-gray-500">คู่ค้าทั้งหมด</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{sups.length}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">นิติบุคคลในระบบ</div>
        </div>
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs">
          <div className="text-[11px] font-medium text-gray-500">อนุมัติแล้ว</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{sups.filter((s) => s.status === "อนุมัติแล้ว").length}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">พร้อมส่งมอบงาน</div>
        </div>
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs">
          <div className="text-[11px] font-medium text-gray-500">รอตรวจสอบ</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{sups.filter((s) => s.status === "รอตรวจสอบ").length}</div>
          <div className="text-[10px] text-amber-600 mt-0.5">รอแอดมินอนุมัติ</div>
        </div>
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs">
          <div className="text-[11px] font-medium text-gray-500">มูลค่าสั่งซื้อรวม</div>
          <div className="text-lg sm:text-xl font-bold text-emerald-900 mt-1 font-mono">
            {(totalValue || 4545000).toLocaleString("th-TH")} <span className="text-xs font-normal text-gray-500">THB</span>
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">ทุกสัญญา PO</div>
        </div>
      </div>

      {/* Filter Bar and Supplier Data Table */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative flex-1 min-w-[240px]">
              <input
                id="fullSupSearch"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาชื่อบริษัท, รหัส SUP, เลขประจำตัวผู้เสียภาษี, อีเมล..."
                className="inp text-xs !py-2.5 !pl-9"
              />
              <SvgIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" paths={[ICON.search]} />
            </div>
            <select
              id="fullSupStatusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="inp text-xs !py-2.5 !w-auto"
            >
              <option value="">สถานะ: ทั้งหมด</option>
              <option value="อนุมัติแล้ว">อนุมัติแล้ว</option>
              <option value="รอตรวจสอบ">รอตรวจสอบ</option>
            </select>
          </div>
        </div>

        {/* Full Table */}
        <div className="overflow-x-auto border border-gray-100 rounded-2xl">
          <table className="w-full text-xs sm:text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
              <tr>
                <th className="p-3.5">รหัสคู่ค้า</th>
                <th className="p-3.5">ชื่อบริษัท / นิติบุคคล</th>
                <th className="p-3.5">เลขผู้เสียภาษี (Tax ID)</th>
                <th className="p-3.5">ผู้ติดต่อ & เบอร์โทร</th>
                <th className="p-3.5">อีเมล</th>
                <th className="p-3.5 text-center">รายการที่ส่ง</th>
                <th className="p-3.5">สถานะ</th>
                <th className="p-3.5 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody id="full-supplier-rows" className="divide-y divide-gray-100">
              {filtered.map((s) => {
                const itemCount = allSubs.filter(
                  (item) =>
                    (item.email || "").toLowerCase() === (s.email || "").toLowerCase() ||
                    String(item.values?.sup || "").toLowerCase().includes(s.code.toLowerCase())
                ).length;
                return (
                  <tr key={s.code} className="hover:bg-gray-50/80 transition-colors">
                    <td className="p-3.5 font-mono font-semibold text-emerald-800 text-xs">{s.code}</td>
                    <td className="p-3.5">
                      <div className="font-bold text-gray-900">{s.company}</div>
                      <div className="text-[11px] text-gray-400 line-clamp-1">{s.address || "-"}</div>
                    </td>
                    <td className="p-3.5 font-mono text-gray-600 text-xs">{s.taxId || "-"}</td>
                    <td className="p-3.5">
                      <div className="text-gray-800 font-medium">{s.contact || "-"}</div>
                      <div className="text-[11px] text-gray-500">{s.phone || "-"}</div>
                    </td>
                    <td className="p-3.5 font-mono text-gray-600 text-xs">{s.email}</td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          itemCount > 0 ? "bg-emerald-100 text-emerald-800 font-bold" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {`${itemCount} เครื่อง`}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          s.status === "อนุมัติแล้ว"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {s.status || "อนุมัติแล้ว"}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => onViewSupplierDetail(s)}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-2xs"
                      >
                        ดูรายละเอียด
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 ? (
            <div id="full-supplier-empty" className="p-12 text-center text-gray-400 text-sm">
              ไม่พบคู่ค้าตามเงื่อนไขที่ค้นหา
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
