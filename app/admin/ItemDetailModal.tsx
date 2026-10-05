"use client";

import { AdminModal } from "./AdminModal";
import type { Submission } from "../../lib/store";
import type { Supplier } from "../../lib/suppliers";
import { Suppliers } from "../../lib/suppliers";
import { LABELS_MAP } from "../../lib/mockData";
import { fdt } from "../../lib/format";

type Props = {
  open: boolean;
  onClose: () => void;
  sub: Submission | null;
  onReturn: (id: string) => void;
  onEdit: (id: string) => void;
  onViewSupplier?: (sup: Supplier) => void;
};

export function ItemDetailModal({ open, onClose, sub, onReturn, onEdit, onViewSupplier }: Props) {
  const supObj = sub ? Suppliers.get(sub.email) || Suppliers.get(String(sub.values?.sup ?? "")) : null;
  const returned = sub ? sub.status === "ส่งคืนให้ Buyer แก้ไข" || !!sub.returnReason : false;

  return (
    <AdminModal
      open={open && sub !== null}
      onClose={onClose}
      backdropClassName="bg-black/40 backdrop-blur-xs z-50 flex items-start justify-center p-4 overflow-y-auto"
      panelClassName="bg-white rounded-2xl w-full max-w-2xl my-8 p-6 sm:p-7 shadow-2xl border border-gray-100 animate-fadein"
    >
      {sub ? (
        <>
          <div className="flex justify-between items-start mb-4 border-b pb-3">
            <div>
              <h3 id="m-t" className="text-lg font-bold text-gray-900">
                {sub.title}
              </h3>
              <p id="m-s" className="text-xs text-gray-500 mt-0.5">
                {fdt(sub.at) + " / " + sub.email}
                {sub.updatedBy ? (
                  <>
                    <br />
                    <span className="text-emerald-700 font-semibold">
                      {"แก้ไขล่าสุด " + fdt(sub.updatedAt ?? sub.at) + " โดย " + sub.updatedBy}
                    </span>
                  </>
                ) : null}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">
              &times;
            </button>
          </div>

          {/* Returned Alert Card inside Detail Modal if document was returned */}
          {returned ? (
            <div id="modal-return-notice" className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs">
              <div className="font-bold text-rose-900 flex items-center gap-2">
                <span>เอกสารนี้ถูก Admin ส่งคืนให้ Buyer ตรวจสอบ / แก้ไข</span>
              </div>
              <div className="mt-2 p-3 bg-white rounded-xl border border-rose-100 text-rose-900 font-medium text-xs">
                <span className="text-rose-500 font-semibold block text-[10px] mb-0.5">หมายเหตุจาก Admin:</span>
                <span id="modal-return-reason-text">{sub.returnReason || "-"}</span>
              </div>
              <div id="modal-return-meta-text" className="text-[11px] text-rose-700 mt-2">
                {`ส่งคืนเมื่อ: ${fdt(sub.returnedAt ?? sub.at)} โดย ${sub.returnedBy || "Admin"} ${
                  sub.assignedBuyer ? "(มอบหมายให้: " + sub.assignedBuyer + ")" : ""
                }`}
              </div>
            </div>
          ) : null}

          <div id="m-b">
            {/* Supplier Card */}
            {supObj ? (
              <div className="mb-4 p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-emerald-900 flex items-center gap-2">
                    <span>{"ข้อมูลคู่ค้า: " + supObj.company}</span>
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                      {supObj.code}
                    </span>
                  </div>
                  <div className="text-gray-600 mt-1">
                    ผู้ติดต่อ: <strong>{supObj.contact}</strong> | โทร: <strong>{supObj.phone}</strong> | เลขผู้เสียภาษี:{" "}
                    <strong>{supObj.taxId}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onViewSupplier?.(supObj);
                  }}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-3 py-1.5 rounded-xl shadow-xs shrink-0"
                >
                  ดูโปรไฟล์
                </button>
              </div>
            ) : null}

            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-xs sm:text-sm max-h-[50vh] overflow-y-auto p-1 border-t border-gray-100 pt-3">
              {Object.entries(sub.values || {})
                .filter(([, v]) => v != null && v !== "")
                .map(([k, v]) => (
                  <div key={k} className="border-b border-gray-100 pb-2">
                    <dt className="text-gray-500 text-[11px] font-medium">{sub.labels?.[k] || LABELS_MAP[k] || k}</dt>
                    <dd className="font-semibold text-gray-900 break-words mt-0.5">{String(v)}</dd>
                  </div>
                ))}
            </dl>
            <div className="flex items-center justify-between gap-2 mt-5 pt-3 border-t">
              <button onClick={onClose} className="border rounded-xl px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                ปิด
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onClose();
                    onReturn(sub.id);
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-4 py-2 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <span>ส่งคืนให้ Buyer แก้ไข</span>
                </button>
                <button
                  onClick={() => onEdit(sub.id)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl px-5 py-2 text-xs font-semibold shadow-xs transition-colors"
                >
                  แก้ไขรายการนี้
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </AdminModal>
  );
}
