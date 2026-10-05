"use client";

import { useEffect, useState } from "react";
import { Permissions, type PermUser, type PermRole } from "../../lib/permissions";
import { CATN, CATS } from "../../lib/catalog";
import { J } from "../../lib/safeStorage";
import { ICON, SvgIcon } from "./SvgIcon";

const PRESETS: Record<string, string[]> = {
  hvac: ["Refrigeration system", "Chiller", "Air condition / AHU", "Cooling tower"],
  elec: ["Safety Equipment", "Electrical system"],
  logistics: ["Logistic Equipment", "Fork lift"],
  super: ["Super Equipment"],
};

const PRESET_BUTTONS: [string, string][] = [
  ["hvac", "เครื่องเย็น & HVAC"],
  ["elec", "ไฟฟ้า & ปลอดภัย"],
  ["logistics", "คลัง & ขนส่ง"],
  ["super", "อุปกรณ์ครัว/สด"],
];

const CAT_SUBTITLES: Record<string, string> = {
  Chiller: "Water-cooled · Air-cooled · Chilled water pump",
  "Cooling tower": "Water distribution · Infill pack",
  "Air condition / AHU": "AHU · Package Unit · VRV/VRF · Duct",
  "Refrigeration system": "Condensing unit · CDU · Evaporator coil · Rack compressor",
  "Electrical system": "Transformer · Generator · Lighting · Cap bank",
  "Safety Equipment": "CCTV · EAS · Fire protection · Fire pump · Gas & Smoke",
  "Logistic Equipment": "Conveyor · Pallet · Dock leveler · Handling",
  "Super Equipment": "Boiler · Compressor · Spares · Other",
  "Waste water System": "Submersible pump · Grease trap · Drain pump",
  "General Homeuse Equipment": "Refrigerator · Microwave · Water heater",
  "LED signage": "Digital Signage · LED Screen · Price display",
  "Shopping Trolley": "Shopping Cart · Basket · Spare wheel",
  "Small Equipment": "Kitchenware · Utensils · Miscellaneous",
  "Fork lift": "Reach truck · Pallet jack · Battery",
};

function CatIcon({ name, c }: { name: string; c: string }) {
  switch (name) {
    case "Chiller":
      return (
        <svg className={`w-5 h-5 ${c}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
          />
        </svg>
      );
    case "Cooling tower":
      return (
        <svg className={`w-5 h-5 ${c}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
          />
        </svg>
      );
    case "Air condition / AHU":
      return (
        <svg className={`w-5 h-5 ${c}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 13.5V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m12-.75V3.75m0 12a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m-6-9V3.75m0 3.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 9.75V10.5"
          />
        </svg>
      );
    case "Refrigeration system":
      return (
        <svg className={`w-5 h-5 ${c}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
          />
        </svg>
      );
    case "Electrical system":
      return (
        <svg className={`w-5 h-5 ${c}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      );
    case "Safety Equipment":
      return (
        <svg className={`w-5 h-5 ${c}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
          />
        </svg>
      );
    case "Logistic Equipment":
    case "Fork lift":
      return (
        <svg className={`w-5 h-5 ${c}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V14.25m11.25-6.75h4.125"
          />
        </svg>
      );
    case "Super Equipment":
      return (
        <svg className={`w-5 h-5 ${c}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.614A2.993 2.993 0 009 9.35c.627 0 1.218-.192 1.71-.524a3 3 0 004.58 0c.492.332 1.083.524 1.71.524a2.993 2.993 0 002.49-1.364 3 3 0 003.76.614m-16.5 0a3 3 0 002.25 1.001m12 0a3 3 0 002.25-1m-16.5 0V4.5a2.25 2.25 0 012.25-2.25h12A2.25 2.25 0 0121 4.5v4.85"
          />
        </svg>
      );
    case "Waste water System":
      return (
        <svg className={`w-5 h-5 ${c}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"
          />
        </svg>
      );
    case "General Homeuse Equipment":
      return (
        <svg className={`w-5 h-5 ${c}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
          />
        </svg>
      );
    case "Shopping Trolley":
      return (
        <svg className={`w-5 h-5 ${c}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.7 2.1-4.7H5.106M7.5 21a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm12 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
          />
        </svg>
      );
    case "LED signage":
      return (
        <svg className={`w-5 h-5 ${c}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.516 0c.85.493 1.508 1.333 1.508 2.316V18"
          />
        </svg>
      );
    default:
      return (
        <svg className={`w-5 h-5 ${c}`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 14.5h-2v-2h2v2zm0-4h-2V7h2v5.5z" />
        </svg>
      );
  }
}

type Props = {
  onBack: () => void;
  initialEmail?: string;
  onToast?: (message: string) => void;
};

function initialActive(initialEmail?: string): string | null {
  const users = Permissions.getUsers();
  if (users.length === 0) return null;
  if (initialEmail) {
    const found = users.find((b) => b.email.toLowerCase() === initialEmail.toLowerCase());
    return found ? found.email : users[0].email;
  }
  const defBuyer = users.find((u) => u.email.toLowerCase() === "buyer@demo.co.th");
  return defBuyer ? defBuyer.email : users[0].email;
}

function getRoleMeta(role: string) {
  if (role === "admin") {
    return {
      label: "Admin",
      thaiLabel: "ผู้ดูแลระบบ",
      pillClass: "bg-[#fdf2f8] text-[#be185d] border border-[#fbcfe8]",
      avatarClass: "bg-purple-700 text-white",
      badgeText: "Admin Account",
      deleteText: "ลบ Admin นี้ออกจากระบบ",
      btnDeleteText: "ลบสิทธิ์ ADMIN",
    };
  }
  if (role === "user" || role === "supplier") {
    return {
      label: "User",
      thaiLabel: "คู่ค้า/ผู้ใช้",
      pillClass: "bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe]",
      avatarClass: "bg-blue-600 text-white",
      badgeText: "User Account",
      deleteText: "ลบ User นี้ออกจากระบบ",
      btnDeleteText: "ลบสิทธิ์ USER",
    };
  }
  return {
    label: "Buyer",
    thaiLabel: "ฝ่ายจัดซื้อ",
    pillClass: "bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]",
    avatarClass: "bg-emerald-700 text-white",
    badgeText: "Buyer Account",
    deleteText: "ลบ Buyer นี้ออกจากระบบ",
    btnDeleteText: "ลบสิทธิ์ BUYER",
  };
}

function getUserDepartment(user: PermUser): { dept: string; sub: string } {
  if (user.role === "admin") {
    return { dept: "Technology & IT Administration", sub: "Super Admin (เข้าถึงครบ 14 หมวดหมู่)" };
  }
  if (user.role === "user" || user.role === "supplier") {
    return { dept: "Supplier & Partner Portal", sub: "User / คู่ค้า (ส่งข้อมูลทรัพย์สิน & AI OCR)" };
  }
  const email = user.email.toLowerCase();
  if (email.includes("buyer1")) {
    return { dept: "BJC Big C Procurement", sub: "ฝ่ายจัดซื้อ - เครื่องเย็น & ไฟฟ้า" };
  }
  if (email.includes("buyer2")) {
    return { dept: "BCHOBC:Loss Prevention, Safety & EHS", sub: "ฝ่ายจัดซื้อ - ปลอดภัย & โลจิสติกส์" };
  }
  if (email.includes("buyer3")) {
    return { dept: "Supermarket Equipment Division", sub: "ฝ่ายจัดซื้อ - อุปกรณ์ซูเปอร์มาร์เก็ต" };
  }
  if (email.includes("buyer4")) {
    return { dept: "Logistics & Supply Chain", sub: "ฝ่ายจัดซื้อ - ระบบขนส่งและคลังสินค้า" };
  }
  return { dept: "BJC Big C Procurement", sub: "ฝ่ายจัดซื้อ - ระบบทำความเย็น & HVAC" };
}

function getAvatarInitials(name: string, email: string): string {
  const thaiMatches = name.match(/[\u0E01-\u0E2E]/g);
  if (thaiMatches && thaiMatches.length >= 2) {
    return thaiMatches[0] + thaiMatches[1];
  }
  if (thaiMatches && thaiMatches.length === 1) {
    return thaiMatches[0] + "1";
  }
  const clean = name.replace(/[^a-zA-Z]/g, " ").trim().split(/\s+/).filter(Boolean);
  if (clean.length >= 2) {
    return (clean[0][0] + clean[1][0]).toUpperCase();
  }
  if (clean.length === 1 && clean[0].length >= 2) {
    return clean[0].slice(0, 2).toUpperCase();
  }
  const mailPart = email.split("@")[0].replace(/[^a-zA-Z]/g, "");
  if (mailPart.length >= 2) {
    return mailPart.slice(0, 2).toUpperCase();
  }
  return "BJ";
}

export function BuyerPermsView({ onBack, initialEmail, onToast }: Props) {
  const [activeEmail, setActiveEmail] = useState<string | null>(() => initialActive(initialEmail));
  const [draft, setDraft] = useState<string[]>(() => {
    const a = initialActive(initialEmail);
    return a ? [...Permissions.get(a)] : [];
  });
  const [roleTab, setRoleTab] = useState<"all" | "admin" | "user" | "buyer">("all");
  const [search, setSearch] = useState("");
  const [catSearch, setCatSearch] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"buyer" | "user" | "admin">("buyer");
  const [statusFilter, setStatusFilter] = useState<"all" | "selected" | "unselected">("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [, setVersion] = useState(0);
  const bump = () => setVersion((v) => v + 1);

  const allUsers = Permissions.getUsers();

  useEffect(() => {
    if (activeEmail === null) onToast?.("ไม่พบบัญชีผู้ใช้งานในระบบ");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeUser = activeEmail ? allUsers.find((b) => b.email.toLowerCase() === activeEmail.toLowerCase()) : undefined;
  const isBuyer = activeUser ? activeUser.role === "buyer" : true;

  const adminUsers = allUsers.filter((u) => u.role === "admin");
  const userUsers = allUsers.filter((u) => u.role === "user" || u.role === "supplier");
  const buyerUsers = allUsers.filter((u) => u.role === "buyer");

  const q = search.toLowerCase().trim();
  const filteredUsers = allUsers.filter((b) => {
    const matchRole =
      roleTab === "all" ||
      (roleTab === "admin" && b.role === "admin") ||
      (roleTab === "user" && (b.role === "user" || b.role === "supplier")) ||
      (roleTab === "buyer" && b.role === "buyer");
    const matchQuery =
      !q ||
      (b.name && b.name.toLowerCase().includes(q)) ||
      (b.email && b.email.toLowerCase().includes(q)) ||
      b.role.toLowerCase().includes(q);
    return matchRole && matchQuery;
  });

  function loadUser(email: string) {
    const list = Permissions.getUsers();
    const user = list.find((b) => b.email.toLowerCase() === email.toLowerCase()) || list[0];
    if (!user) return;
    setActiveEmail(user.email);
    setDraft([...Permissions.get(user.email)]);
  }

  function toggleCat(name: string) {
    setDraft((prev) => (prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]));
  }

  function save() {
    if (!activeEmail) return;
    const user = activeUser;
    const uName = user ? user.name || user.email : activeEmail;

    if (user?.role === "admin") {
      Permissions.set(activeEmail, draft.length > 0 ? draft : [...CATN]);
      bump();
      onToast?.(`บันทึกสิทธิ์ Admin ให้ "${uName}" เรียบร้อยแล้ว (สิทธิ์เต็มระบบ)`);
      return;
    }

    if (user?.role === "user" || user?.role === "supplier") {
      Permissions.set(activeEmail, draft);
      bump();
      onToast?.(`บันทึกสิทธิ์ User ให้ "${uName}" เรียบร้อยแล้ว`);
      return;
    }

    // Buyer:
    Permissions.set(activeEmail, draft);
    bump();
    onToast?.(`บันทึกสิทธิ์ Category ให้ "${uName}" เรียบร้อยแล้ว (${draft.length} หมวด)`);
  }

  function resetToSaved() {
    if (!activeEmail) return;
    loadUser(activeEmail);
    onToast?.("คืนค่าเดิมเรียบร้อยแล้ว");
  }

  function deleteUserByEmail(emailToDelete: string) {
    const userToDelete = allUsers.find((u) => u.email.toLowerCase() === emailToDelete.toLowerCase());
    const meta = getRoleMeta(userToDelete?.role || "buyer");
    if (confirm(`คุณต้องการลบ ${meta.label} "${emailToDelete}" ออกจากระบบหรือไม่?`)) {
      Permissions.delete(emailToDelete);
      const rest = Permissions.getUsers();
      if (rest.length === 0) {
        setActiveEmail(null);
        setDraft([]);
        onToast?.("ไม่พบบัญชีผู้ใช้ในระบบ");
      } else {
        const nextActive = rest[0].email;
        setActiveEmail(nextActive);
        setDraft([...Permissions.get(nextActive)]);
        onToast?.(`ลบ ${meta.label} ${emailToDelete} สำเร็จ`);
      }
      bump();
    }
  }

  function deleteActive() {
    if (!activeEmail) return;
    deleteUserByEmail(activeEmail);
  }

  function addUser() {
    const email = newEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      alert("กรุณากรอกอีเมลที่ถูกต้อง เช่น buyer5@demo.co.th");
      return;
    }
    const existing = Permissions.getUsers().find((b) => b.email.toLowerCase() === email);
    if (existing) {
      alert(`อีเมลนี้มีอยู่ในระบบแล้ว (${existing.name})`);
      loadUser(email);
      return;
    }
    Permissions.set(email, []);
    const users = J.get<{ role: string; email: string; pw: string; company: string }[]>("portal_users", []);
    const roleTitle = newRole === "admin" ? "Admin" : newRole === "user" ? "User" : "Buyer";
    if (!users.some((u) => u.email.toLowerCase() === email)) {
      users.push({ role: newRole, email, pw: "demo1234", company: `${roleTitle} (${email.split("@")[0]})` });
      J.set("portal_users", users);
    }
    setNewEmail("");
    bump();
    loadUser(email);
    onToast?.(`เพิ่มบัญชี ${roleTitle} "${email}" เรียบร้อยแล้ว`);
  }

  const count = draft.length;
  const pct = Math.round((count / CATN.length) * 100);
  const currentClean = draft.map((c) => String(c).trim().toLowerCase());
  const cq = catSearch.toLowerCase().trim();
  const activeMeta = getRoleMeta(activeUser?.role || "buyer");
  const shownName = activeUser ? activeUser.name || activeUser.email : "ฝ่ายจัดซื้อ 1 (ระบบทำความเย็น & HVAC)";
  const shownEmail = activeUser ? activeUser.email : "buyer@demo.co.th";

  return (
    <section id="view-buyer-perms" className="space-y-6 animate-fadein">
      {/* Top Header with Title and Back button */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              กำหนดสิทธิ์ Category (Admin / User / Buyer)
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            เลือกกำหนดหมวดหมู่ Category เฉพาะสำหรับ Buyer ส่วน Admin และ User จะได้รับสิทธิ์ตามบทบาทอย่างเป็นระบบ
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onBack}
            className="text-xs text-gray-700 hover:text-emerald-700 bg-white hover:bg-gray-50 border border-gray-200 px-4 py-2 rounded-xl font-semibold flex items-center gap-2 shadow-2xs transition-colors"
          >
            <SvgIcon className="w-3.5 h-3.5 text-gray-500" paths={[ICON.arrowLeft]} />
            <span>กลับหน้าหลัก</span>
          </button>
        </div>
      </div>

      {/* SEARCH BAR & FILTER TABS (Designed exactly like the user's screenshot) */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar on the Left */}
          <div className="relative flex-1 max-w-xl">
            <input
              id="fullBuyerSearch"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อ, รหัสพนักงาน, อีเมล, แผนก..."
              className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-2.5 pl-10 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs transition-all"
            />
            <svg
              className="w-4 h-4 text-gray-400 absolute left-3.5 top-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filter Pills on the Right: ทั้งหมด | Admin | User | Buyer */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-2xl border border-gray-200/60 shrink-0 overflow-x-auto">
            <button
              type="button"
              onClick={() => setRoleTab("all")}
              className={`py-2 px-4 rounded-xl text-xs sm:text-sm transition-all whitespace-nowrap ${
                roleTab === "all"
                  ? "bg-[#004e38] text-white shadow-xs font-bold"
                  : "text-gray-600 hover:text-gray-900 bg-white/60 hover:bg-white font-medium"
              }`}
            >
              ทั้งหมด ({allUsers.length})
            </button>
            <button
              type="button"
              onClick={() => setRoleTab("admin")}
              className={`py-2 px-4 rounded-xl text-xs sm:text-sm transition-all whitespace-nowrap ${
                roleTab === "admin"
                  ? "bg-[#004e38] text-white shadow-xs font-bold"
                  : "text-gray-600 hover:text-gray-900 bg-white/60 hover:bg-white font-medium"
              }`}
            >
              Admin ({adminUsers.length})
            </button>
            <button
              type="button"
              onClick={() => setRoleTab("user")}
              className={`py-2 px-4 rounded-xl text-xs sm:text-sm transition-all whitespace-nowrap ${
                roleTab === "user"
                  ? "bg-[#004e38] text-white shadow-xs font-bold"
                  : "text-gray-600 hover:text-gray-900 bg-white/60 hover:bg-white font-medium"
              }`}
            >
              User ({userUsers.length})
            </button>
            <button
              type="button"
              onClick={() => setRoleTab("buyer")}
              className={`py-2 px-4 rounded-xl text-xs sm:text-sm transition-all whitespace-nowrap ${
                roleTab === "buyer"
                  ? "bg-[#004e38] text-white shadow-xs font-bold"
                  : "text-gray-600 hover:text-gray-900 bg-white/60 hover:bg-white font-medium"
              }`}
            >
              Buyer ({buyerUsers.length})
            </button>
          </div>
        </div>

        {/* Counter label */}
        <div className="flex items-center justify-between text-xs text-gray-500 font-medium px-1">
          <span id="full-buyer-count-tag">
            แสดง {filteredUsers.length} จาก {allUsers.length} รายการ
          </span>
          <a
            href="#addUserForm"
            className="text-emerald-700 hover:text-emerald-800 font-semibold hover:underline flex items-center gap-1"
          >
            <span>+ เพิ่มผู้ใช้งานใหม่</span>
          </a>
        </div>
      </div>

      {/* USER MANAGEMENT TABLE (Clean layout matching screenshot) */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-5">พนักงาน</th>
                <th className="py-3.5 px-5">แผนก / ตำแหน่ง</th>
                <th className="py-3.5 px-5 text-center">Role ปัจจุบัน</th>
                <th className="py-3.5 px-5 text-center">สถานะ</th>
                <th className="py-3.5 px-5 text-right">จัดการสิทธิ์</th>
              </tr>
            </thead>
            <tbody id="full-buyer-list" className="divide-y divide-gray-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-gray-400">
                    ไม่พบข้อมูลผู้ใช้งานที่ตรงกับเงื่อนไขการค้นหา
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isSelected = activeEmail?.toLowerCase() === u.email.toLowerCase();
                  const roleMeta = getRoleMeta(u.role);
                  const deptInfo = getUserDepartment(u);
                  const initials = getAvatarInitials(u.name, u.email);
                  const cats = Permissions.get(u.email);
                  const userPct = Math.round((cats.length / CATN.length) * 100);

                  return (
                    <tr
                      key={u.email}
                      onClick={() => loadUser(u.email)}
                      className={`cursor-pointer transition-colors group ${
                        isSelected ? "bg-emerald-50/30" : "hover:bg-gray-50/60"
                      }`}
                    >
                      {/* Column 1: พนักงาน */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200/80 shadow-2xs">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-emerald-800 transition-colors">
                              {u.name}
                            </div>
                            <div className="truncate text-xs text-gray-400 font-mono mt-0.5 max-w-[200px] sm:max-w-xs">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: แผนก / ตำแหน่ง */}
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-xs sm:text-sm text-gray-800">
                          {deptInfo.dept}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                          {u.role === "buyer" ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span>{`รับผิดชอบ ${cats.length} หมวด (${userPct}%)`}</span>
                            </span>
                          ) : (
                            <span className="text-gray-500">{deptInfo.sub}</span>
                          )}
                        </div>
                      </td>

                      {/* Column 3: Role ปัจจุบัน */}
                      <td className="py-3.5 px-5 text-center">
                        <span className={`px-3.5 py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider inline-block ${roleMeta.pillClass}`}>
                          {roleMeta.label}
                        </span>
                      </td>

                      {/* Column 4: สถานะ */}
                      <td className="py-3.5 px-5 text-center">
                        <span className="bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0] px-3 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#15803d]"></span>
                          <span>Active</span>
                        </span>
                      </td>

                      {/* Column 5: จัดการสิทธิ์ */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          {u.role === "buyer" ? (
                            <button
                              type="button"
                              onClick={() => {
                                loadUser(u.email);
                                const el = document.getElementById("active-user-config");
                                el?.scrollIntoView({ behavior: "smooth" });
                              }}
                              className="bg-[#004e38] hover:bg-[#047857] text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all shadow-2xs flex items-center gap-1.5"
                            >
                              <SvgIcon className="w-3.5 h-3.5" paths={[ICON.sliders]} />
                              <span>กำหนด Category</span>
                            </button>
                          ) : u.role === "admin" ? (
                            <button
                              type="button"
                              onClick={() => {
                                loadUser(u.email);
                                const el = document.getElementById("active-user-config");
                                el?.scrollIntoView({ behavior: "smooth" });
                              }}
                              className="bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5"
                            >
                              <SvgIcon className="w-3.5 h-3.5" paths={[ICON.shield]} />
                              <span>สิทธิ์ Admin</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                loadUser(u.email);
                                const el = document.getElementById("active-user-config");
                                el?.scrollIntoView({ behavior: "smooth" });
                              }}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5"
                            >
                              <SvgIcon className="w-3.5 h-3.5" paths={[ICON.doc]} />
                              <span>สิทธิ์ User</span>
                            </button>
                          )}

                          <button
                            type="button"
                            title={roleMeta.deleteText}
                            onClick={() => deleteUserByEmail(u.email)}
                            className="border border-rose-200 text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <SvgIcon className="w-3.5 h-3.5" paths={[ICON.trash]} />
                            <span className="hidden sm:inline">{roleMeta.btnDeleteText}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        <div className="bg-gray-50/60 border-t border-gray-100 px-5 py-3 flex items-center justify-between text-xs text-gray-500">
          <div>
            {`แสดง 1-${filteredUsers.length} จาก ${filteredUsers.length} รายการ`}
          </div>
          <div className="flex items-center gap-2 font-medium">
            <button
              type="button"
              disabled
              className="p-1 rounded-lg border border-gray-200 text-gray-300 cursor-not-allowed"
            >
              &lt;
            </button>
            <span className="px-2">หน้า 1 / 1</span>
            <button
              type="button"
              disabled
              className="p-1 rounded-lg border border-gray-200 text-gray-300 cursor-not-allowed"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* ACTIVE USER PERMISSION CONFIGURATION PANEL */}
      <div id="active-user-config" className="space-y-4 pt-2">
        {/* Active User Header Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              id="full-active-avatar"
              className={`w-12 h-12 rounded-full ${activeMeta.avatarClass} flex items-center justify-center shrink-0 shadow-xs font-bold text-sm`}
            >
              {getAvatarInitials(shownName, shownEmail)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 id="full-active-buyer-name" className="font-bold text-base text-gray-900 truncate">
                  {shownName}
                </h3>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 border ${activeMeta.pillClass}`}>
                  {activeMeta.badgeText}
                </span>
              </div>
              <div id="full-active-buyer-email" className="text-xs text-gray-400 font-mono mt-0.5">
                {shownEmail}
              </div>
            </div>
          </div>

          {/* Stat Box & Quick Select/Deselect Actions */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
            {/* Stat Box */}
            <div className="bg-[#f0fdf4] border border-emerald-200 rounded-2xl px-5 py-2 text-center min-w-[140px]">
              <div className="text-[10px] font-medium text-emerald-800">
                {isBuyer ? "สิทธิ์ Category" : activeUser?.role === "admin" ? "สิทธิ์การเข้าถึง" : "สิทธิ์การใช้งาน"}
              </div>
              <div id="full-active-perm-stat" className="text-base font-extrabold text-[#047857] tracking-tight">
                {isBuyer ? `${count} จาก ${CATN.length} หมวดหมู่ (${pct}%)` : activeUser?.role === "admin" ? "14 / 14 (เต็มระบบ)" : "ส่งเอกสาร / OCR"}
              </div>
              <div className="text-[10px] text-emerald-600">
                {isBuyer ? "หมวดหมู่ที่ได้รับมอบหมาย" : activeUser?.role === "admin" ? "เข้าถึงได้ทุกหมวดหมู่" : "สิทธิ์ซัพพลายเออร์"}
              </div>
            </div>

            {isBuyer ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDraft([...CATN])}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-emerald-600 text-emerald-700 bg-white hover:bg-emerald-50 transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>เลือกทั้งหมด</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDraft([])}
                  className="px-3.5 py-2 text-xs font-medium rounded-xl border border-gray-300 text-gray-600 bg-white hover:bg-gray-50 transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>ยกเลิกทั้งหมด</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* ROLE SPECIFIC VIEW: Category Matrix for Buyer, Privileges for Admin & User */}
        {isBuyer ? (
          /* Buyer Category Matrix (14 Categories) */
          <div className="space-y-4">
            {/* Search, Group Filter Dropdown & Status Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-100 shadow-2xs">
              <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                <div className="relative flex-1 max-w-xs">
                  <input
                    id="catCardSearch"
                    type="text"
                    value={catSearch}
                    onChange={(e) => setCatSearch(e.target.value)}
                    placeholder="ค้นหาชื่อหมวดหมู่..."
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 placeholder-gray-400 pl-8 focus:outline-none focus:border-emerald-500 transition-all shadow-2xs"
                  />
                  <SvgIcon className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" paths={[ICON.search]} />
                </div>

                <select
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value)}
                  className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 shadow-2xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">ทุกกลุ่ม</option>
                  <option value="hvac">กลุ่ม HVAC</option>
                  <option value="elec">กลุ่มไฟฟ้า</option>
                  <option value="logistics">กลุ่มขนส่ง</option>
                  <option value="super">กลุ่มครัว/สด</option>
                </select>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    statusFilter === "all"
                      ? "bg-[#047857] text-white shadow-2xs"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {`ทั้งหมด (${CATN.length})`}
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("selected")}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    statusFilter === "selected"
                      ? "bg-[#047857] text-white shadow-2xs"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {`เลือกแล้ว (${count})`}
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("unselected")}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    statusFilter === "unselected"
                      ? "bg-[#047857] text-white shadow-2xs"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {`ยังไม่เลือก (${CATN.length - count})`}
                </button>
              </div>
            </div>

            {/* Category Cards Grid */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5" id="full-cat-grid">
                {CATN.map((name) => {
                  const isChecked = currentClean.includes(name.toLowerCase());
                  const matchesSearch = !cq || name.toLowerCase().includes(cq);
                  const matchesGroup = groupFilter === "all" || (PRESETS[groupFilter] && PRESETS[groupFilter].includes(name));
                  const matchesStatus =
                    statusFilter === "all" ||
                    (statusFilter === "selected" && isChecked) ||
                    (statusFilter === "unselected" && !isChecked);

                  const isVisible = matchesSearch && matchesGroup && matchesStatus;

                  return (
                    <div
                      key={name}
                      data-cat={name}
                      onClick={() => toggleCat(name)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                        !isVisible ? "hidden" : ""
                      } ${
                        isChecked
                          ? "border-[#047857] bg-[#f0fdf4] shadow-2xs"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                            isChecked ? "bg-[#047857] text-white" : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                          }`}
                        >
                          <CatIcon name={name} c={isChecked ? "text-white" : "text-gray-600"} />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs sm:text-sm text-gray-900 truncate">{name}</span>
                          </div>
                          <div className="text-[10px] text-gray-400 truncate mt-0.5">
                            {CAT_SUBTITLES[name] || "อุปกรณ์และชิ้นส่วนมาตรฐาน"}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                            isChecked ? "bg-[#047857] text-white" : "border border-gray-300 bg-white group-hover:border-gray-400"
                          }`}
                        >
                          {isChecked ? (
                            <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"></path>
                            </svg>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Presets & Save Bar */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] text-gray-500 font-medium">ชุดหมวดหมู่สำเร็จรูป:</span>
                  {PRESET_BUTTONS.map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setDraft([...(PRESETS[key] || [])])}
                      className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 text-emerald-900 text-xs font-medium transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={deleteActive}
                  className="text-xs text-rose-600 hover:text-rose-800 font-medium hover:underline flex items-center gap-1.5 transition-colors"
                >
                  <SvgIcon className="w-3.5 h-3.5" paths={[ICON.trash]} />
                  <span>ลบ Buyer นี้ออกจากระบบ</span>
                </button>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={resetToSaved}
                  className="border border-gray-200 rounded-xl px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 font-medium transition-colors"
                >
                  คืนค่าเดิม
                </button>
                <button
                  type="button"
                  onClick={save}
                  className="bg-[#004e38] hover:bg-[#047857] text-white rounded-xl px-5 py-2 text-xs sm:text-sm font-semibold shadow-xs hover:shadow transition-all flex items-center gap-2"
                >
                  <SvgIcon className="w-4 h-4" paths={[ICON.check]} />
                  <span>บันทึกสิทธิ์ Category</span>
                </button>
              </div>
            </div>
          </div>
        ) : activeUser?.role === "admin" ? (
          /* Admin Privileges View */
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 flex-wrap gap-2">
                <div>
                  <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                    <span>ขอบเขตสิทธิ์ของผู้ดูแลระบบ (Admin Super Privileges)</span>
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    บัญชี Admin มีสิทธิ์เข้าถึงข้อมูลทรัพย์สินทุก Category ในระบบโดยอัตโนมัติ ไม่จำเป็นต้องระบุรายหมวดหมู่
                  </p>
                </div>
                <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 font-semibold px-3 py-1 rounded-full">
                  สิทธิ์เต็มระบบ (Full Access)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/20 flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0 font-bold text-sm">
                    14
                  </div>
                  <div>
                    <div className="font-bold text-xs text-gray-900">เข้าถึงทรัพย์สินครบ 14 หมวดหมู่</div>
                    <div className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                      มองเห็นและเข้าถึงข้อมูลฟอร์มทรัพย์สินทุก Category ครบถ้วนโดยไม่มีข้อจำกัด
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/20 flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                    <SvgIcon className="w-4 h-4" paths={[ICON.sliders]} />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-gray-900">กำหนดสิทธิ์ผู้ใช้งานทุกบทบาท</div>
                    <div className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                      มอบหมายหมวดหมู่ให้ Buyer และเพิ่ม ลบ จัดการสิทธิ์บัญชีผู้ใช้
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/20 flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                    <SvgIcon className="w-4 h-4" paths={[ICON.undo]} />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-gray-900">ส่งคืนเอกสารให้ Buyer แก้ไข</div>
                    <div className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                      ตรวจสอบความถูกต้อง และส่งคืนรายการให้ Buyer ดำเนินการแก้ไขเพิ่มเติม
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/20 flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                    <SvgIcon className="w-4 h-4" paths={[ICON.building]} />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-gray-900">จัดการข้อมูลคู่ค้าและ Supplier</div>
                    <div className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                      ค้นหา เพิ่ม แก้ไข และดูประวัติเอกสารของคู่ค้า Supplier ทุกราย
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2.5">
                <span className="text-base">✓</span>
                <span>
                  สถานะการทำงาน: <strong>บัญชี Admin นี้เปิดใช้งานสิทธิ์การดูแลระบบอย่างสมบูรณ์</strong>
                </span>
              </div>
            </div>

            {/* Admin Action Bar */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={deleteActive}
                className="text-xs text-rose-600 hover:text-rose-800 font-medium hover:underline flex items-center gap-1.5 transition-colors"
              >
                <SvgIcon className="w-3.5 h-3.5" paths={[ICON.trash]} />
                <span>ลบ Admin นี้ออกจากระบบ</span>
              </button>

              <button
                type="button"
                onClick={save}
                className="bg-purple-700 hover:bg-purple-800 text-white rounded-xl px-5 py-2 text-xs sm:text-sm font-semibold shadow-xs hover:shadow transition-all flex items-center gap-2"
              >
                <SvgIcon className="w-4 h-4" paths={[ICON.check]} />
                <span>บันทึกสิทธิ์ Admin</span>
              </button>
            </div>
          </div>
        ) : (
          /* User / Supplier Privileges View */
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 flex-wrap gap-2">
                <div>
                  <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <span>ขอบเขตสิทธิ์ของ User / ซัพพลายเออร์ (Supplier Privileges)</span>
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    สิทธิ์การใช้งานสำหรับคู่ค้าในการส่งข้อมูลทะเบียนทรัพย์สินและติดตามสถานะ
                  </p>
                </div>
                <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 font-semibold px-3 py-1 rounded-full">
                  Supplier Access
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/20 flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                    <SvgIcon className="w-4 h-4" paths={[ICON.doc]} />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-gray-900">กรอกแบบฟอร์มข้อมูลทรัพย์สิน</div>
                    <div className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                      ส่งเอกสารเครื่องจักร อุปกรณ์ และข้อมูลสเปกเข้าสู่ระบบ
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/20 flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                    <SvgIcon className="w-4 h-4" paths={[ICON.checkCircle]} />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-gray-900">แนบไฟล์และสแกน OCR อัตโนมัติ</div>
                    <div className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                      ใช้ระบบ AI OCR ช่วยอ่านป้าย Nameplate และกรอกข้อมูลอัตโนมัติ
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/20 flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                    <SvgIcon className="w-4 h-4" paths={[ICON.clock]} />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-gray-900">ติดตามสถานะเอกสารของตนเอง</div>
                    <div className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                      ดูประวัติรายการที่ส่ง (รอ Buyer ตรวจ / ตรวจแล้วเสร็จ)
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/20 flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                    <SvgIcon className="w-4 h-4" paths={[ICON.edit]} />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-gray-900">แก้ไขข้อมูลแบบฟอร์ม</div>
                    <div className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                      ปรับปรุงและแก้ไขข้อมูลฟอร์มของตนเองได้ตลอดเวลา
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 flex items-center gap-2.5">
                <span className="text-base">💡</span>
                <span>
                  <strong>คำแนะนำ:</strong> บัญชีประเภท User / ซัพพลายเออร์ ไม่จำเป็นต้องเลือก Category เนื่องจากจะส่งเอกสารตามหมวดหมู่ที่คู่ค้าระบุในแบบฟอร์ม และระบบจะส่งต่อไปยัง Buyer ที่รับผิดชอบหมวดนั้นๆ โดยอัตโนมัติ
                </span>
              </div>
            </div>

            {/* User Action Bar */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={deleteActive}
                className="text-xs text-rose-600 hover:text-rose-800 font-medium hover:underline flex items-center gap-1.5 transition-colors"
              >
                <SvgIcon className="w-3.5 h-3.5" paths={[ICON.trash]} />
                <span>ลบ User นี้ออกจากระบบ</span>
              </button>

              <button
                type="button"
                onClick={save}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2 text-xs sm:text-sm font-semibold shadow-xs hover:shadow transition-all flex items-center gap-2"
              >
                <SvgIcon className="w-4 h-4" paths={[ICON.check]} />
                <span>บันทึกสิทธิ์ User</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ADD NEW USER SECTION */}
      <div id="addUserForm" className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          <h4 className="font-bold text-sm text-gray-900">เพิ่มผู้ใช้งานใหม่ (Add New User)</h4>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="sm:w-48 shrink-0">
            <label htmlFor="newUserRole" className="block text-[11px] font-semibold text-gray-600 mb-1">
              บทบาทผู้ใช้
            </label>
            <select
              id="newUserRole"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as "buyer" | "user" | "admin")}
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-emerald-500 shadow-2xs"
            >
              <option value="buyer">Buyer (ฝ่ายจัดซื้อ)</option>
              <option value="user">User (คู่ค้า/ซัพพลายเออร์)</option>
              <option value="admin">Admin (ผู้ดูแลระบบ)</option>
            </select>
          </div>
          <div className="flex-1">
            <label htmlFor="newUserEmail" className="block text-[11px] font-semibold text-gray-600 mb-1">
              อีเมลผู้ใช้งาน
            </label>
            <div className="flex items-center gap-2">
              <input
                id="newUserEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addUser()}
                placeholder="เช่น buyer5@demo.co.th"
                className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 shadow-2xs"
              />
              <button
                type="button"
                onClick={addUser}
                className="bg-[#004e38] hover:bg-[#047857] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors shrink-0 shadow-2xs flex items-center gap-1.5"
              >
                <span>+ เพิ่ม</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
