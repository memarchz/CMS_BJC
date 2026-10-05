"use client";

import { useEffect, useState } from "react";
import { Permissions } from "../../lib/permissions";
import { CATN, CATS } from "../../lib/catalog";
import { J } from "../../lib/safeStorage";
import { CAT_DISPLAY_CONFIG } from "./catDisplay";
import { ICON, SvgIcon } from "./SvgIcon";

// Copied verbatim from js/admin.js:884-890 (fullPermApplyPreset)
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

type Props = {
  onBack: () => void;
  initialEmail?: string;
  onToast?: (message: string) => void;
};

function initialActive(initialEmail?: string): string | null {
  const buyers = Permissions.getBuyers();
  if (buyers.length === 0) return null;
  if (initialEmail) {
    const found = buyers.find((b) => b.email.toLowerCase() === initialEmail.toLowerCase());
    return found ? found.email : buyers[0].email;
  }
  return buyers[0].email;
}

export function BuyerPermsView({ onBack, initialEmail, onToast }: Props) {
  const [activeEmail, setActiveEmail] = useState<string | null>(() => initialActive(initialEmail));
  const [draft, setDraft] = useState<string[]>(() => {
    const a = initialActive(initialEmail);
    return a ? [...Permissions.get(a)] : [];
  });
  const [search, setSearch] = useState("");
  const [catSearch, setCatSearch] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [, setVersion] = useState(0);
  const bump = () => setVersion((v) => v + 1);

  useEffect(() => {
    if (activeEmail === null) onToast?.("ไม่พบบัญชี Buyer ในระบบ");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buyers = Permissions.getBuyers();
  const activeBuyer = activeEmail ? buyers.find((b) => b.email.toLowerCase() === activeEmail.toLowerCase()) : undefined;

  const q = search.toLowerCase().trim();
  const filteredBuyers = buyers.filter(
    (b) => !q || (b.name && b.name.toLowerCase().includes(q)) || (b.email && b.email.toLowerCase().includes(q))
  );

  function loadBuyer(email: string) {
    const list = Permissions.getBuyers();
    const buyer = list.find((b) => b.email.toLowerCase() === email.toLowerCase()) || list[0];
    if (!buyer) return;
    setActiveEmail(buyer.email);
    setDraft([...Permissions.get(buyer.email)]);
  }

  function toggleCard(cat: string) {
    const norm = cat.trim().toLowerCase();
    setDraft((prev) =>
      prev.some((c) => String(c).trim().toLowerCase() === norm)
        ? prev.filter((c) => String(c).trim().toLowerCase() !== norm)
        : [...prev, cat]
    );
  }

  function save() {
    if (!activeEmail) {
      onToast?.("กรุณาเลือก Buyer ก่อนบันทึก");
      return;
    }
    Permissions.set(activeEmail, draft);
    bump();
    const buyer = Permissions.getBuyers().find((b) => b.email.toLowerCase() === activeEmail.toLowerCase());
    const bName = buyer ? buyer.name || buyer.email : activeEmail;
    onToast?.(`บันทึกสิทธิ์ Category ให้ "${bName}" เรียบร้อยแล้ว (${draft.length} หมวด)`);
  }

  function resetToSaved() {
    if (!activeEmail) return;
    loadBuyer(activeEmail);
    onToast?.("คืนค่าเดิมเรียบร้อยแล้ว");
  }

  function deleteActive() {
    if (!activeEmail) return;
    if (confirm(`คุณต้องการลบ Buyer "${activeEmail}" ออกจากระบบหรือไม่?`)) {
      const deleted = activeEmail;
      Permissions.delete(deleted);
      const rest = Permissions.getBuyers();
      if (rest.length === 0) {
        setActiveEmail(null);
        setDraft([]);
        onToast?.("ไม่พบบัญชี Buyer ในระบบ");
      } else {
        setActiveEmail(rest[0].email);
        setDraft([...Permissions.get(rest[0].email)]);
        onToast?.(`ลบ Buyer ${deleted} สำเร็จ`);
      }
    }
  }

  function addBuyer() {
    const email = newEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      alert("กรุณากรอกอีเมล Buyer ที่ถูกต้อง เช่น buyer5@demo.co.th");
      return;
    }
    const existing = Permissions.getBuyers().find((b) => b.email.toLowerCase() === email);
    if (existing) {
      alert("อีเมล Buyer นี้มีอยู่ในระบบแล้ว");
      loadBuyer(email);
      return;
    }
    Permissions.set(email, []);
    const users = J.get<{ role: string; email: string; pw: string; company: string }[]>("portal_users", []);
    if (!users.some((u) => u.email.toLowerCase() === email)) {
      users.push({ role: "buyer", email, pw: "demo1234", company: "Buyer (" + email.split("@")[0] + ")" });
      J.set("portal_users", users);
    }
    setNewEmail("");
    loadBuyer(email);
    onToast?.(`เพิ่มบัญชี Buyer "${email}" เรียบร้อยแล้ว สามารถเลือก Category ได้ทันที`);
  }

  const count = draft.length;
  const pct = Math.round((count / CATN.length) * 100);
  const currentClean = draft.map((c) => String(c).trim().toLowerCase());
  const cq = catSearch.toLowerCase().trim();
  const shownName = activeBuyer ? activeBuyer.name || activeBuyer.email : "Buyer สมศักดิ์";
  const shownEmail = activeBuyer ? activeBuyer.email : "buyer@demo.co.th";
  const shownAvatar = activeBuyer ? (activeBuyer.name ? activeBuyer.name.charAt(0) : "B").toUpperCase() : "B";

  return (
    <section id="view-buyer-perms" className="space-y-6 animate-fadein">
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
            <span className="text-emerald-800 font-semibold">จัดการสิทธิ์ Category ของ Buyer</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">กำหนดสิทธิ์ Category สำหรับ Buyer</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              Full Page Management
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 leading-relaxed">
            ระบุหมวดหมู่เครื่องจักรและทรัพย์สินที่อนุญาตให้ Buyer แต่ละท่านมองเห็นและมีสิทธิ์ตรวจสอบ (Buyer มองเห็นเฉพาะ Category ที่ได้รับสิทธิ์)
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
        </div>
      </div>

      {/* Master-Detail 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Buyer Accounts Selector */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-gray-100 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                <SvgIcon className="w-4 h-4" paths={[ICON.userAdd]} />
              </div>
              <h2 className="font-bold text-sm text-gray-900">รายชื่อ Buyer ในระบบ</h2>
            </div>
            <span
              id="full-buyer-count-tag"
              className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold"
            >
              {`${buyers.length} คน`}
            </span>
          </div>

          {/* Buyer Search Input */}
          <div className="relative">
            <input
              id="fullBuyerSearch"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อหรืออีเมล Buyer..."
              className="inp text-xs !py-2.5 !pl-9"
            />
            <SvgIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" paths={[ICON.search]} />
          </div>

          {/* Buyer Card List Container */}
          <div id="full-buyer-list" className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredBuyers.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400">ไม่พบบัญชี Buyer ที่ค้นหา</div>
            ) : (
              filteredBuyers.map((b) => {
                const isSel = !!activeEmail && b.email.toLowerCase() === activeEmail.toLowerCase();
                const cats = Permissions.get(b.email) || [];
                const initial = (b.name ? b.name.charAt(0) : "B").toUpperCase();
                return (
                  <div
                    key={b.email}
                    onClick={() => loadBuyer(b.email)}
                    className={`group p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSel
                        ? "border-emerald-500 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-500/40"
                        : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50/70"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSel
                            ? "bg-emerald-700 text-white"
                            : "bg-gray-100 text-gray-700 group-hover:bg-emerald-100 group-hover:text-emerald-800"
                        }`}
                      >
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <div className={`font-bold text-xs text-gray-900 truncate ${isSel ? "text-emerald-950 font-bold" : ""}`}>
                          {b.name || b.email}
                        </div>
                        <div className="text-[11px] text-gray-400 truncate font-mono">{b.email}</div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          cats.length > 0
                            ? isSel
                              ? "bg-emerald-700 text-white"
                              : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {`${cats.length} / ${CATN.length}`}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Add Buyer Quick Form */}
          <div className="pt-3 border-t border-gray-100 space-y-2">
            <div className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">เพิ่มบัญชี Buyer ใหม่</div>
            <div className="flex items-center gap-1.5">
              <input
                id="fullNewBuyerEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="เช่น buyer5@demo.co.th"
                className="inp text-xs !py-2 flex-1"
              />
              <button
                type="button"
                onClick={addBuyer}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors shrink-0 shadow-2xs"
              >
                + เพิ่ม
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Active Buyer Category Matrix */}
        <div className="lg:col-span-8 space-y-5">
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3.5">
                <div
                  id="full-active-avatar"
                  className="w-12 h-12 rounded-2xl bg-emerald-700 text-white font-bold flex items-center justify-center text-lg shadow-xs shrink-0"
                >
                  {shownAvatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 id="full-active-buyer-name" className="font-bold text-base text-gray-900">
                      {shownName}
                    </h3>
                    <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      Buyer Account
                    </span>
                  </div>
                  <div id="full-active-buyer-email" className="text-xs text-gray-500 font-mono mt-0.5">
                    {shownEmail}
                  </div>
                </div>
              </div>

              {/* Perms Stat & Quick Select/Deselect */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[11px] text-gray-400 font-medium">สิทธิ์ที่เปิดใช้งาน</div>
                  <div id="full-active-perm-stat" className="text-sm font-bold text-emerald-800">
                    {`${count} จาก ${CATN.length} หมวดหมู่ (${pct}%)`}
                  </div>
                </div>
                <div className="h-8 w-px bg-gray-200"></div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDraft([...CATN])}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                  >
                    เลือกทั้งหมด
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraft([])}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-gray-50 text-gray-600 hover:bg-rose-50 hover:text-rose-700 border border-gray-200 transition-colors"
                  >
                    ยกเลิกทั้งหมด
                  </button>
                </div>
              </div>
            </div>

            {/* Preset Category Shortcut Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-gray-500 font-medium">ชุดหมวดหมู่สำเร็จรูป:</span>
              {PRESET_BUTTONS.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDraft([...(PRESETS[key] || [])])}
                  className="px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 text-emerald-900 text-xs font-medium transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Cards Grid Container */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-gray-900">รายการหมวดหมู่เครื่องจักร (14 หมวด)</span>
                <span className="text-xs text-gray-400 font-normal">คลิกที่การ์ดเพื่อ เปิด/ปิด สิทธิ์</span>
              </div>
              <div className="relative w-full sm:w-64">
                <input
                  id="catCardSearch"
                  type="text"
                  value={catSearch}
                  onChange={(e) => setCatSearch(e.target.value)}
                  placeholder="ค้นหาชื่อหมวดหมู่..."
                  className="inp text-xs !py-2 !pl-8"
                />
                <SvgIcon className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" paths={[ICON.search]} />
              </div>
            </div>

            <div id="full-cat-card-grid" className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[520px] overflow-y-auto pr-1">
              {CATN.map((cat) => {
                const isChecked = currentClean.includes(cat.trim().toLowerCase());
                const conf = CAT_DISPLAY_CONFIG[cat];
                const desc = conf
                  ? conf.desc
                  : CATS[cat] && CATS[cat].length
                    ? CATS[cat].slice(0, 3).join(", ")
                    : "หมวดหมู่เครื่องจักรทั่วไป";
                const isMatch = !cq || cat.toLowerCase().includes(cq) || (desc && desc.toLowerCase().includes(cq));
                return (
                  <div
                    key={cat}
                    onClick={() => toggleCard(cat)}
                    data-cat={cat}
                    className={`cat-card-item group p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex items-start justify-between gap-3 ${
                      !isMatch ? "hidden" : ""
                    } ${
                      isChecked
                        ? "border-emerald-500 bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white shadow-xs ring-1 ring-emerald-400/40"
                        : "border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/20"
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isChecked ? "bg-emerald-600 text-white shadow-xs" : "bg-gray-100 text-gray-600 group-hover:bg-emerald-50"
                        }`}
                      >
                        <SvgIcon
                          className={conf ? conf.iconClass : "w-4 h-4 text-emerald-600"}
                          paths={conf ? conf.iconPaths : [ICON.check]}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className={`font-bold text-xs sm:text-sm text-gray-900 ${isChecked ? "text-emerald-950 font-bold" : ""}`}>
                          {cat}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{desc || "หมวดหมู่เครื่องจักร"}</div>
                      </div>
                    </div>

                    <div className="shrink-0 mt-0.5">
                      <div
                        className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                          isChecked
                            ? "bg-emerald-700 text-white shadow-xs"
                            : "border border-gray-300 bg-white group-hover:border-emerald-400"
                        }`}
                      >
                        {isChecked ? (
                          <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d={ICON.check}></path>
                          </svg>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Save Bar */}
            <div className="flex items-center justify-between pt-5 border-t border-gray-100 gap-3">
              <button
                type="button"
                onClick={deleteActive}
                className="text-xs text-rose-600 hover:text-rose-800 font-medium hover:underline flex items-center gap-1.5 transition-colors"
              >
                <SvgIcon className="w-3.5 h-3.5" paths={[ICON.trash]} />
                <span>ลบ Buyer นี้ออกจากระบบ</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={resetToSaved}
                  className="border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-600 hover:bg-gray-50 font-medium transition-colors"
                >
                  คืนค่าเดิม
                </button>
                <button
                  type="button"
                  onClick={save}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl px-6 py-2.5 text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <SvgIcon className="w-4 h-4" paths={[ICON.check]} />
                  <span>บันทึกสิทธิ์ Category</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
