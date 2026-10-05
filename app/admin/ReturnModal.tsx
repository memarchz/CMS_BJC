"use client";

import { useRef, useState } from "react";
import { AdminModal } from "./AdminModal";
import { ICON, SvgIcon } from "./SvgIcon";
import { Store, type Submission } from "../../lib/store";
import { Permissions } from "../../lib/permissions";
import { Auth } from "../../lib/auth";

const QUICK_REMARKS: [string, string][] = [
  ["รูปเนมเพลทไม่ชัดเจน", "ขอรูปถ่ายเนมเพลท / Serial ให้ชัดเจน"],
  ["เอกสาร Warranty ไม่ครบ", "สัญญาและเอกสารแนบ Warranty ไม่ครบถ้วน"],
  ["ราคาไม่ตรง PO", "ราคาซื้อไม่ตรงกับสัญญาและใบสั่งซื้อ PO ล่าสุด"],
  ["ระบุสเปกและ Sub Category", "กรุณาระบุ Sub Category และสเปกพิกัดทางไฟฟ้าให้ชัดเจน"],
];

type ReturnEntry = { reason: string; returnedAt: number; returnedBy: string; assignedBuyer: string };
type ReturnedSubmission = Submission & { returnHistory?: ReturnEntry[] };

type Props = {
  open: boolean;
  onClose: () => void;
  subId?: string;
  /** Called after a successful return with the toast message to display. */
  onDone?: (message: string) => void;
};

function matchBuyer(docId: string, fallback: string): string {
  const doc = Store.all().find((s) => s.id === docId);
  const cat = doc?.values?.category;
  if (cat) {
    const matched = Permissions.getBuyers().find((b) => (b.categories || []).includes(String(cat)));
    if (matched) return matched.email;
  }
  return fallback;
}

function ReturnForm({ subId, onClose, onDone }: Omit<Props, "open">) {
  const allSubs = Store.all();
  const buyers = Permissions.getBuyers();
  const initialDoc = subId || allSubs[0]?.id || "";
  const [docId, setDocId] = useState(initialDoc);
  const [buyerEmail, setBuyerEmail] = useState(() => matchBuyer(initialDoc, buyers[0]?.email || ""));
  const [reason, setReason] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);

  const doc = allSubs.find((s) => s.id === docId);

  function onDocChange(id: string) {
    setDocId(id);
    // Smart matching: pre-select the Buyer whose permissions match this category
    setBuyerEmail((prev) => matchBuyer(id, prev));
  }

  function addRemark(text: string) {
    setReason((prev) => (prev.trim() ? prev.trim() + "\n- " + text : text));
    taRef.current?.focus();
  }

  function confirmReturn(e: React.FormEvent) {
    e.preventDefault();
    const text = reason.trim();
    if (!docId || !text) {
      alert("กรุณากรอกเหตุผลและสิ่งที่ต้องการให้แก้ไข");
      return;
    }
    const item: ReturnedSubmission | undefined = Store.all().find((x) => x.id === docId);
    if (!item) {
      alert("ไม่พบเอกสาร");
      return;
    }
    const by = Auth.session()?.email || "";
    const now = Date.now();
    const updated: ReturnedSubmission = {
      ...item,
      status: "ส่งคืนให้ Buyer แก้ไข",
      returnReason: text,
      returnedAt: now,
      returnedBy: by,
      assignedBuyer: buyerEmail,
      returnHistory: (item.returnHistory || []).concat({
        reason: text,
        returnedAt: now,
        returnedBy: by,
        assignedBuyer: buyerEmail,
      }),
    };
    Store.put(updated);
    onClose();
    onDone?.(`ส่งคืนเอกสาร "${item.title}" ให้ ${buyerEmail} เรียบร้อยแล้ว`);
  }

  return (
    <>
      <div className="flex justify-between items-start mb-4 border-b pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center text-xl font-bold shrink-0">
            <SvgIcon className="w-5 h-5" paths={[ICON.undo]} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">ส่งคืนเอกสารให้ Buyer แก้ไข</h3>
            <p className="text-xs text-gray-500 mt-0.5">ส่งเอกสารกลับไปให้ Buyer ตรวจสอบความถูกต้องและแก้ไขข้อมูล</p>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">
          &times;
        </button>
      </div>

      <form id="formReturn" onSubmit={confirmReturn} className="space-y-4 text-xs sm:text-sm">
        {/* Target Document Selection / Info */}
        <div>
          <label htmlFor="returnDocSelect" className="block font-semibold text-gray-700 mb-1">
            เลือกรายการเอกสารที่ต้องการส่งคืน <span className="text-rose-500">*</span>
          </label>
          <select
            id="returnDocSelect"
            required
            value={docId}
            onChange={(e) => onDocChange(e.target.value)}
            className="inp text-xs"
          >
            {allSubs.map((s) => (
              <option key={s.id} value={s.id}>
                {`${s.title} (${String(s.values?.category || "ไม่ระบุ")}) - ส่งโดย ${s.email}`}
              </option>
            ))}
          </select>
        </div>

        {/* Document Preview Info Box */}
        <div id="returnDocInfoBox" className="bg-gray-50 p-3 rounded-2xl border border-gray-100 text-xs space-y-1">
          <div>
            <span className="text-gray-500">หมวดหมู่:</span>{" "}
            <strong id="ret-info-cat" className="text-gray-800">
              {String(doc?.values?.category || "ไม่ระบุหมวดหมู่")}
            </strong>
          </div>
          <div>
            <span className="text-gray-500">ผู้ส่งต้นทาง:</span>{" "}
            <span id="ret-info-sup" className="text-gray-800">
              {String(doc?.values?.sup || doc?.email || "-")}
            </span>
          </div>
        </div>

        {/* Select Target Buyer */}
        <div>
          <label htmlFor="returnBuyerSelect" className="block font-semibold text-gray-700 mb-1">
            ระบุ Buyer ผู้รับผิดชอบแก้ไข <span className="text-rose-500">*</span>
          </label>
          <select
            id="returnBuyerSelect"
            required
            value={buyerEmail}
            onChange={(e) => setBuyerEmail(e.target.value)}
            className="inp text-xs"
          >
            {buyers.map((b) => (
              <option key={b.email} value={b.email}>
                {`${b.name} (${b.email})`}
              </option>
            ))}
          </select>
        </div>

        {/* Return Remarks Textarea */}
        <div>
          <label htmlFor="returnReasonText" className="block font-semibold text-gray-700 mb-1">
            ระบุเหตุผล / สิ่งที่ต้องการให้แก้ไข (Remarks) <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="returnReasonText"
            ref={taRef}
            rows={3}
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="เช่น ขอให้ตรวจสอบใบรับประกันสินค้า (Warranty Document) เพิ่มเติม และแนบสเปกเครื่องจักรให้ครบถ้วน"
            className="inp text-xs"
          ></textarea>
        </div>

        {/* Quick Remark Chips */}
        <div>
          <div className="text-[11px] text-gray-500 mb-1.5 font-medium">ข้อความสำเร็จรูปแนะนำ (คลิกเพื่อใส่ข้อความ):</div>
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            {QUICK_REMARKS.map(([label, text]) => (
              <button
                type="button"
                key={label}
                onClick={() => addRemark(text)}
                className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-rose-50 hover:text-rose-700 border text-gray-700 transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <button type="button" onClick={onClose} className="border rounded-xl px-4 py-2 text-xs text-gray-600 hover:bg-gray-50">
            ยกเลิก
          </button>
          <button
            type="submit"
            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-5 py-2 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <span>ยืนยันส่งคืนเอกสาร</span>
          </button>
        </div>
      </form>
    </>
  );
}

export function ReturnModal({ open, onClose, subId, onDone }: Props) {
  return (
    <AdminModal
      open={open}
      onClose={onClose}
      backdropClassName="bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto"
      panelClassName="bg-white rounded-3xl w-full max-w-lg my-6 p-6 sm:p-7 shadow-2xl border border-rose-100 animate-fadein"
    >
      <ReturnForm subId={subId} onClose={onClose} onDone={onDone} />
    </AdminModal>
  );
}
