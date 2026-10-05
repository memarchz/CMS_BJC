"use client";

import { useState } from "react";
import { AdminModal } from "./AdminModal";
import { Suppliers } from "../../lib/suppliers";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Called after saving with the company name (used for the toast). */
  onSaved: (company: string) => void;
};

function AddSupplierForm({ onClose, onSaved }: Omit<Props, "open">) {
  const [company, setCompany] = useState("");
  const [taxId, setTaxId] = useState("");
  const [code, setCode] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const tax = taxId.trim();
    if (!/^\d{13}$/.test(tax)) {
      alert("เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก");
      return;
    }
    const name = company.trim();
    Suppliers.save({
      code: code.trim() || undefined,
      company: name,
      taxId: tax,
      contact: contact.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      address: address.trim(),
      status: "อนุมัติแล้ว",
      registeredAt: Date.now(),
    });
    onClose();
    onSaved(name);
  }

  return (
    <>
      <div className="flex justify-between items-start mb-4 border-b pb-3">
        <div>
          <h3 className="text-lg font-bold text-gray-900">เพิ่มข้อมูลคู่ค้า Supplier ใหม่</h3>
          <p className="text-xs text-gray-500 mt-0.5">ลงทะเบียนนิติบุคคลคู่ค้าเข้าสู่ระบบ</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">
          &times;
        </button>
      </div>
      <form id="formAddSup" onSubmit={onSubmit} className="space-y-3 text-xs sm:text-sm">
        <div>
          <label htmlFor="add-company" className="block font-medium mb-1">
            ชื่อบริษัท / นิติบุคคล <span className="text-red-500">*</span>
          </label>
          <input
            id="add-company"
            type="text"
            required
            className="inp text-xs"
            placeholder="เช่น บริษัท ตัวอย่างซัพพลาย จำกัด"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="add-tax" className="block font-medium mb-1">
              เลขประจำตัวผู้เสียภาษี (13 หลัก) <span className="text-red-500">*</span>
            </label>
            <input
              id="add-tax"
              type="text"
              maxLength={13}
              required
              className="inp text-xs"
              placeholder="01055xxxxxxxx"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="add-code" className="block font-medium mb-1">
              รหัสคู่ค้า (เว้นว่างเพื่อ Auto)
            </label>
            <input
              id="add-code"
              type="text"
              className="inp text-xs"
              placeholder="เช่น SUP-00099"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="add-contact" className="block font-medium mb-1">
              ชื่อผู้ติดต่อ <span className="text-red-500">*</span>
            </label>
            <input
              id="add-contact"
              type="text"
              required
              className="inp text-xs"
              placeholder="ชื่อ-นามสกุล"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="add-phone" className="block font-medium mb-1">
              เบอร์โทรศัพท์ <span className="text-red-500">*</span>
            </label>
            <input
              id="add-phone"
              type="tel"
              required
              className="inp text-xs"
              placeholder="0xx-xxx-xxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label htmlFor="add-email" className="block font-medium mb-1">
            อีเมลติดต่อ / ล็อกอิน <span className="text-red-500">*</span>
          </label>
          <input
            id="add-email"
            type="email"
            required
            className="inp text-xs"
            placeholder="contact@company.co.th"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="add-address" className="block font-medium mb-1">
            ที่อยู่สำนักงาน
          </label>
          <textarea
            id="add-address"
            rows={2}
            className="inp text-xs"
            placeholder="ที่อยู่สำนักงานใหญ่/สาขา"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          ></textarea>
        </div>
        <div className="flex items-center justify-end gap-2 pt-3 border-t">
          <button type="button" onClick={onClose} className="border rounded-xl px-4 py-2 text-xs text-gray-600 hover:bg-gray-50">
            ยกเลิก
          </button>
          <button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl px-5 py-2 text-xs font-semibold shadow-xs">
            บันทึกคู่ค้า
          </button>
        </div>
      </form>
    </>
  );
}

export function AddSupplierModal({ open, onClose, onSaved }: Props) {
  return (
    <AdminModal
      open={open}
      onClose={onClose}
      backdropClassName="bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      panelClassName="bg-white rounded-3xl w-full max-w-lg my-6 p-6 sm:p-8 shadow-2xl border border-gray-100"
    >
      <AddSupplierForm onClose={onClose} onSaved={onSaved} />
    </AdminModal>
  );
}
