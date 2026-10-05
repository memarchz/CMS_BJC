"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Auth } from "../../lib/auth";

export default function Page() {
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [taxId, setTaxId] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!/^\d{13}$/.test(taxId.trim())) {
      setErr("เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก");
      return;
    }
    if (pw.length < 8) {
      setErr("รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร");
      return;
    }
    if (pw !== pw2) {
      setErr("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      return;
    }
    const r = Auth.register({
      company: company.trim(),
      taxId: taxId.trim(),
      contact: contact.trim(),
      phone: phone.trim(),
      email: email.trim(),
      pw,
    });
    if (r.error) {
      setErr(r.error);
      return;
    }
    router.push("/form");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-5">
      <form onSubmit={onSubmit} className="w-full max-w-xl bg-white rounded-2xl shadow-sm p-7">
        <Link href="/login?role=supplier" className="text-sm text-gray-500 hover:text-gray-800">
          ← กลับไปหน้าเข้าสู่ระบบ
        </Link>
        <div className="brand text-xl mt-4">SUPPLIER PORTAL</div>
        <h1 className="text-xl font-bold mt-1">ลงทะเบียน Supplier</h1>
        <p className="text-sm text-gray-500 mb-5">
          สำหรับ Supplier ใหม่เท่านั้น หลังลงทะเบียนจะเข้าสู่ระบบให้อัตโนมัติ
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor="company" className="text-sm font-medium">
              ชื่อบริษัท / นิติบุคคล <span className="text-red-500">*</span>
            </label>
            <input id="company" type="text" required className="inp mt-1" placeholder="ชื่อเต็มตามทะเบียน" value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
          <div>
            <label htmlFor="taxId" className="text-sm font-medium">
              เลขประจำตัวผู้เสียภาษี <span className="text-red-500">*</span>
            </label>
            <input id="taxId" type="text" required className="inp mt-1" placeholder="13 หลัก" inputMode="numeric" maxLength={13} value={taxId} onChange={(e) => setTaxId(e.target.value)} />
          </div>
          <div>
            <label htmlFor="contact" className="text-sm font-medium">
              ชื่อผู้ติดต่อ <span className="text-red-500">*</span>
            </label>
            <input id="contact" type="text" required className="inp mt-1" placeholder="ชื่อ-นามสกุล" value={contact} onChange={(e) => setContact(e.target.value)} />
          </div>
          <div>
            <label htmlFor="phone" className="text-sm font-medium">
              เบอร์โทรศัพท์ <span className="text-red-500">*</span>
            </label>
            <input id="phone" type="tel" required className="inp mt-1" placeholder="0xx-xxx-xxxx" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label htmlFor="email" className="text-sm font-medium">
              อีเมล (ใช้เข้าสู่ระบบ) <span className="text-red-500">*</span>
            </label>
            <input id="email" type="email" required className="inp mt-1" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label htmlFor="pw" className="text-sm font-medium">
              รหัสผ่าน <span className="text-red-500">*</span>
            </label>
            <input id="pw" type="password" required className="inp mt-1" placeholder="อย่างน้อย 8 ตัวอักษร" value={pw} onChange={(e) => setPw(e.target.value)} />
          </div>
          <div>
            <label htmlFor="pw2" className="text-sm font-medium">
              ยืนยันรหัสผ่าน <span className="text-red-500">*</span>
            </label>
            <input id="pw2" type="password" required className="inp mt-1" placeholder="พิมพ์รหัสผ่านอีกครั้ง" value={pw2} onChange={(e) => setPw2(e.target.value)} />
          </div>
        </div>
        <p className={`${err ? "" : "hidden "}text-sm text-red-600 mt-4`}>{err}</p>
        <button type="submit" className="w-full mt-5 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl py-3">
          ลงทะเบียน
        </button>
      </form>
    </main>
  );
}
