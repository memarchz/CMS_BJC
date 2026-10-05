"use client";

import { AdminModal } from "./AdminModal";
import { ICON, SvgIcon } from "./SvgIcon";
import type { Supplier } from "../../lib/suppliers";
import { Store } from "../../lib/store";
import { fdt } from "../../lib/format";

type Props = {
  open: boolean;
  onClose: () => void;
  supplier: Supplier | null;
  onFilterInMainList: () => void;
};

export function SupplierDetailModal({ open, onClose, supplier, onFilterInMainList }: Props) {
  const items = supplier
    ? Store.all().filter(
        (item) =>
          (item.email || "").toLowerCase() === supplier.email.toLowerCase() ||
          String(item.values?.sup || "").toLowerCase().includes(supplier.code.toLowerCase())
      )
    : [];
  let totalVal = 0;
  items.forEach((it) => {
    totalVal += parseFloat(String(it.values?.price ?? "")) || 0;
  });

  const catMap: Record<string, number> = {};
  items.forEach((it) => {
    const cat = String(it.values?.category || "ทั่วไป (Uncategorized)");
    catMap[cat] = (catMap[cat] || 0) + 1;
  });
  const catBreakdown = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

  return (
    <AdminModal
      open={open && supplier !== null}
      onClose={onClose}
      backdropClassName="bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      panelClassName="bg-white rounded-2xl w-full max-w-3xl my-6 p-6 sm:p-8 shadow-2xl border border-gray-100"
    >
      {supplier ? (
        <>
          <div className="flex justify-between items-start mb-4 border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xl shrink-0">
                <SvgIcon className="w-6 h-6" paths={[ICON.building]} />
              </div>
              <div>
                <h3 id="sd-company" className="text-lg font-bold text-gray-900">
                  {supplier.company}
                </h3>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                  <span
                    id="sd-code"
                    className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200"
                  >
                    {supplier.code}
                  </span>
                  <span
                    id="sd-status"
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      supplier.status === "อนุมัติแล้ว"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : supplier.status === "รอตรวจสอบ"
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-gray-100 text-gray-700 border-gray-200"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        supplier.status === "อนุมัติแล้ว"
                          ? "bg-emerald-500"
                          : supplier.status === "รอตรวจสอบ"
                          ? "bg-amber-500 animate-pulse"
                          : "bg-gray-400"
                      }`}
                    />
                    <span>{supplier.status || "อนุมัติแล้ว"}</span>
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">
              &times;
            </button>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-100 text-xs sm:text-sm">
            <div className="font-bold text-gray-800 mb-2">ข้อมูลนิติบุคคลและผู้ติดต่อ</div>
            <div className="grid sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div>
                <span className="text-gray-500">เลขประจำตัวผู้เสียภาษี (Tax ID):</span>{" "}
                <strong id="sd-tax" className="text-gray-900 font-semibold ml-1">
                  {supplier.taxId || "-"}
                </strong>
              </div>
              <div>
                <span className="text-gray-500">ผู้ติดต่อหลัก:</span>{" "}
                <strong id="sd-contact" className="text-gray-900 font-semibold ml-1">
                  {supplier.contact || "-"}
                </strong>
              </div>
              <div>
                <span className="text-gray-500">เบอร์โทรศัพท์:</span>{" "}
                <strong id="sd-phone" className="text-gray-900 font-semibold ml-1">
                  {supplier.phone || "-"}
                </strong>
              </div>
              <div>
                <span className="text-gray-500">อีเมลติดต่อ/เข้าสู่ระบบ:</span>{" "}
                <strong id="sd-email" className="text-gray-900 font-semibold ml-1">
                  {supplier.email || "-"}
                </strong>
              </div>
              <div className="sm:col-span-2">
                <span className="text-gray-500">ที่อยู่สำนักงานใหญ่:</span>{" "}
                <span id="sd-address" className="text-gray-800 ml-1">
                  {supplier.address || "-"}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <span>
                  เครื่องจักรและอุปกรณ์ที่ส่งมอบ (<span id="sd-item-count">{items.length}</span> รายการ)
                </span>
              </div>
              <div className="text-xs text-emerald-800 font-semibold">
                มูลค่าสั่งซื้อรวม:{" "}
                <span id="sd-total-value" className="text-sm font-bold text-emerald-900">
                  {totalVal.toLocaleString("th-TH")}
                </span>{" "}
                THB
              </div>
            </div>

            {catBreakdown.length > 0 && (
              <div className="mb-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>สรุปตามแต่ละบล็อก / หมวดหมู่ที่กรอกเข้ามา ({catBreakdown.length} หมวด):</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {catBreakdown.map(([cat, count]) => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1.5 bg-white text-gray-800 px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-medium shadow-2xs"
                    >
                      <span>{cat}</span>
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full text-[10px]">
                        {count} เครื่อง
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="max-h-[200px] overflow-y-auto border border-gray-100 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-100 text-gray-600">
                  <tr>
                    <th className="p-2.5">วันที่</th>
                    <th className="p-2.5">รายการเครื่องจักร</th>
                    <th className="p-2.5">หมวดหมู่</th>
                    <th className="p-2.5">ราคาซื้อ (THB)</th>
                    <th className="p-2.5">สถานะ</th>
                  </tr>
                </thead>
                <tbody id="sd-items-table" className="divide-y divide-gray-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-gray-400">
                        ยังไม่มีประวัติการส่งมอบเครื่องจักรในระบบ
                      </td>
                    </tr>
                  ) : (
                    items.map((it) => (
                      <tr key={it.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-2.5 text-gray-500 whitespace-nowrap">{fdt(it.at)}</td>
                        <td className="p-2.5 font-bold text-gray-900">{it.title}</td>
                        <td className="p-2.5 text-gray-600">{String(it.values?.category || "-")}</td>
                        <td className="p-2.5 font-mono text-emerald-800 font-semibold">
                          {it.values?.price ? parseFloat(String(it.values.price)).toLocaleString("th-TH") : "-"}
                        </td>
                        <td className="p-2.5 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              it.status === "ส่งคืนให้ Buyer แก้ไข"
                                ? "bg-rose-100 text-rose-800"
                                : it.status === "รอ Buyer ตรวจ"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {it.status || "ส่งแล้ว"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <button
              type="button"
              onClick={onFilterInMainList}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              กรองดูรายการของ Supplier เจ้านี้ในหน้ารายการหลัก
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-800 hover:bg-gray-900 text-white text-xs font-semibold px-5 py-2 rounded-xl transition-colors"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </>
      ) : null}
    </AdminModal>
  );
}
