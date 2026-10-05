"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "../../lib/useRequireAuth";
import { useToast } from "../../lib/useToast";
import { Auth } from "../../lib/auth";
import { Store, type Submission } from "../../lib/store";
import type { Supplier } from "../../lib/suppliers";
import { Toast } from "../../components/Toast";
import { DashboardView } from "./DashboardView";
import { BuyerPermsView } from "./BuyerPermsView";
import { SupplierDirectoryView } from "./SupplierDirectoryView";
import { ReturnModal } from "./ReturnModal";
import { ItemDetailModal } from "./ItemDetailModal";
import { SupplierDetailModal } from "./SupplierDetailModal";
import { AddSupplierModal } from "./AddSupplierModal";
import { ICON, SvgIcon } from "./SvgIcon";
import styles from "./admin.module.css";

type View = "dashboard" | "perms" | "suppliers";

export default function Page() {
  const router = useRouter();
  const session = useRequireAuth(["admin"]);
  const toast = useToast();
  const mainRef = useRef<HTMLElement>(null);
  const [view, setView] = useState<View>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  // Consumed by BuyerPermsView (Task 21) to preselect a buyer when arriving via a row action.
  const [selectedBuyerEmail, setSelectedBuyerEmail] = useState<string | undefined>(undefined);
  const [addSupplierModalOpen, setAddSupplierModalOpen] = useState(false);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);
  const [returnModal, setReturnModal] = useState<{ open: boolean; subId?: string }>({ open: false });
  const [viewingSub, setViewingSub] = useState<Submission | null>(null);
  const [dashFilter, setDashFilter] = useState<{ q: string; nonce: number } | null>(null);
  const [, setVersion] = useState(0);

  if (!session) return null;

  // js/admin.js showAdminView(): switch view, scroll to top, auto-close the sidebar on mobile.
  function showAdminView(next: View, buyerEmail?: string) {
    setView(next);
    setSelectedBuyerEmail(buyerEmail);
    if (mainRef.current) mainRef.current.scrollTop = 0;
    if (sidebarOpen && window.innerWidth < 1024) setSidebarOpen(false);
  }

  function openReturnModal(subId?: string) {
    if (Store.all().length === 0) {
      alert("ยังไม่มีเอกสารในระบบ");
      return;
    }
    setReturnModal({ open: true, subId });
  }

  // js/admin.js filterMainListBySupplier()
  function filterMainListBySupplier() {
    if (!viewingSupplier) return;
    const sup = viewingSupplier;
    setViewingSupplier(null);
    showAdminView("dashboard");
    setDashFilter((prev) => ({ q: sup.email, nonce: (prev?.nonce ?? 0) + 1 }));
    toast.show(`กรองแสดงเฉพาะรายการของ "${sup.company}"`);
  }

  function resetMockData() {
    Store.resetMock();
    setVersion((v) => v + 1);
    toast.show("รีเซ็ตข้อมูลตัวอย่าง Mock Data สำเร็จ (" + Store.all().length + " รายการ)");
  }

  function editSub(id: string) {
    sessionStorage.setItem("edit_id", id);
    router.push(`/form?edit=${encodeURIComponent(id)}`);
  }

  const navClass = (active: boolean, grayText: boolean) =>
    `${styles.sidebarLink} ${active ? styles.active : ""} flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium${
      grayText ? " text-gray-600" : ""
    }`;
  const navIcon = (active: boolean) => `w-5 h-5 ${active ? "text-emerald-600" : "text-gray-500"} shrink-0`;

  return (
    <div className="bg-gray-50 text-gray-900 min-h-screen flex flex-col">
      {/* TOP NAVIGATION BAR */}
      <header
        className="bg-white border-b border-gray-200 sticky top-0 z-30"
        style={{ top: "env(safe-area-inset-top,0px)" }}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-3 flex-wrap">
          {/* Left: Hamburger, Logo & Role Pill */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="เมนู"
            >
              <SvgIcon className="w-5 h-5" paths={[ICON.menu]} />
            </button>
            <Link href="/" className="flex items-center gap-2.5 group mr-2">
              <Image
                src="/img/logo.png"
                alt="Supplier Portal"
                width={32}
                height={32}
                className="w-8 h-8 object-contain drop-shadow-sm"
              />
              <span className="font-bold text-xl text-gray-900 tracking-tight group-hover:text-[#0b6330] transition-colors">
                Supplier Portal
              </span>
            </Link>
            <span
              id="lb"
              className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200"
            >
              Admin
            </span>
            <span id="who" className="text-sm text-gray-600 font-medium hidden sm:inline">
              {session.name || "ผู้ดูแลระบบ (Admin ตัวอย่าง)"}
            </span>
          </div>

          {/* Right: Actions, Notification, Profile */}
          <div className="flex items-center gap-2">
            <Link
              href="/form"
              className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm font-semibold rounded-lg px-3.5 sm:px-4 py-2 transition-colors shadow-xs"
            >
              กรอกฟอร์มใหม่
            </Link>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                id="btnNotif"
                className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="การแจ้งเตือน"
              >
                <SvgIcon className="w-5 h-5" paths={[ICON.bell]} />
                <span
                  id="notif-badge"
                  className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"
                ></span>
              </button>

              {/* Notification Dropdown Menu */}
              <div
                id="notifDropdown"
                className={`${
                  notifOpen ? "" : "hidden "
                }absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 z-50 text-xs`}
              >
                <div className="font-bold text-gray-800 pb-2 border-b border-gray-100 flex items-center justify-between">
                  <span>การแจ้งเตือนระบบ</span>
                  <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-semibold">2 ใหม่</span>
                </div>
                <div className="py-2 space-y-2 max-h-60 overflow-y-auto">
                  <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100 text-rose-900">
                    <div className="font-semibold">มีรายการส่งคืนให้ Buyer แก้ไข</div>
                    <div className="text-[11px] text-gray-600 mt-0.5">กล้องวงจรปิด Hikvision NVR รอ Buyer ดำเนินการ</div>
                  </div>
                  <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900">
                    <div className="font-semibold">คู่ค้าส่งเอกสารใหม่</div>
                    <div className="text-[11px] text-gray-600 mt-0.5">ตู้แช่เย็น Daikin FTV50 จาก บริษัท ตัวอย่างซัพพลาย จำกัด</div>
                  </div>
                </div>
              </div>
            </div>

            {/* User Dropdown / Logout button */}
            <button
              type="button"
              onClick={() => setUserOpen((v) => !v)}
              className="text-xs sm:text-sm border rounded-lg px-2.5 sm:px-3 py-2 hover:bg-gray-50 transition-colors flex items-center gap-1.5 text-gray-700"
            >
              <span className="hidden sm:inline">ตั้งค่า</span>
              <SvgIcon className="w-3.5 h-3.5 text-gray-400" paths={[ICON.chevronDown]} />
            </button>

            {/* User Dropdown Menu */}
            <div
              id="userDropdown"
              className={`${
                userOpen ? "" : "hidden "
              }absolute right-4 sm:right-6 lg:right-8 top-14 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 text-xs`}
            >
              <div className="p-2 border-b border-gray-100 mb-1">
                <div className="font-bold text-gray-900" id="dd-name">
                  {session.name || "Admin"}
                </div>
                <div className="text-gray-400 text-[11px]" id="dd-email">
                  {session.email}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUserOpen(false);
                  resetMockData();
                }}
                className="w-full text-left flex items-center gap-2 p-2 rounded-xl text-gray-700 hover:bg-gray-50 font-medium"
              >
                <span>รีเซ็ตข้อมูล Mock Data</span>
              </button>
              <div className="border-t border-gray-100 my-1"></div>
              <button
                type="button"
                onClick={() => {
                  Auth.logout();
                  router.push("/");
                }}
                className="w-full text-left flex items-center gap-2 p-2 rounded-xl text-rose-600 hover:bg-rose-50 font-medium"
              >
                <span>ออกจากระบบ</span>
              </button>
            </div>

            <button
              onClick={() => {
                Auth.logout();
                router.push("/");
              }}
              className="text-xs sm:text-sm border rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors text-gray-700"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>

        {/* Subheader bar like Buyer page */}
        <div className="w-full px-4 sm:px-6 lg:px-8 pb-3 font-bold text-lg text-gray-800 flex items-center justify-between">
          <span>
            {view === "dashboard"
              ? "ระบบจัดการสำหรับผู้ดูแลระบบ (Admin Dashboard)"
              : view === "perms"
              ? "กำหนดสิทธิ์ Category (Admin / User / Buyer)"
              : "รายชื่อคู่ค้าและข้อมูล Supplier"}
          </span>
        </div>
      </header>

      {/* MAIN BODY LAYOUT: SIDEBAR + CONTENT */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR */}
        <aside
          id="sidebar"
          className={`w-64 bg-white border-r border-gray-200 flex flex-col justify-between shrink-0 fixed inset-y-0 left-0 z-40 transform ${
            sidebarOpen ? "" : "-translate-x-full "
          }lg:translate-x-0 lg:static transition-transform duration-200 ease-in-out top-[98px]`}
        >
          {/* Navigation Links */}
          <div className="p-4 space-y-1.5">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                showAdminView("dashboard");
              }}
              id="nav-home"
              className={navClass(view === "dashboard", false)}
            >
              <SvgIcon className={navIcon(view === "dashboard")} paths={[ICON.home]} />
              <span>หน้าหลัก</span>
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                showAdminView("perms");
              }}
              id="nav-perms"
              className={navClass(view === "perms", true)}
            >
              <SvgIcon className={navIcon(view === "perms")} paths={[ICON.userAdd]} />
              <span>กำหนดสิทธิ์ Admin / User / Buyer</span>
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                showAdminView("suppliers");
              }}
              id="nav-suppliers"
              className={navClass(view === "suppliers", true)}
            >
              <SvgIcon className={navIcon(view === "suppliers")} paths={[ICON.building]} />
              <span>รายชื่อ Supplier</span>
            </a>
          </div>

          {/* Bottom Mini Widget */}
          <div className="p-4 border-t border-gray-100">
            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center gap-3 text-xs">
              <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shrink-0">
                <SvgIcon className="w-4 h-4" paths={[ICON.shield]} />
              </div>
              <div>
                <div className="font-bold text-gray-900">Admin Full View</div>
                <div className="text-[11px] text-gray-500">มองเห็นทุก Category</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Sidebar Overlay for Mobile (never shown by the original page either) */}
        <div id="sidebarOverlay" onClick={() => setSidebarOpen((v) => !v)} className="hidden fixed inset-0 bg-black/40 z-30 lg:hidden"></div>

        {/* MAIN DASHBOARD CONTENT AREA */}
        <main ref={mainRef} className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-6">
          <DashboardView
            hidden={view !== "dashboard"}
            onOpenPermModal={(email) => showAdminView("perms", email)}
            onOpenReturnModal={openReturnModal}
            onViewSub={(sub) => setViewingSub(sub)}
            onSwitchToView={(next) => showAdminView(next)}
            onViewSupplier={(sup) => setViewingSupplier(sup)}
            externalFilter={dashFilter}
            onEditSub={editSub}
            onResetMock={resetMockData}
            onToast={toast.show}
          />
          {view === "perms" ? (
            <BuyerPermsView key={selectedBuyerEmail ?? ""} onBack={() => showAdminView("dashboard")} initialEmail={selectedBuyerEmail} onToast={toast.show} />
          ) : null}
          {view === "suppliers" ? (
            <SupplierDirectoryView
              onBack={() => showAdminView("dashboard")}
              onOpenAddSupplier={() => setAddSupplierModalOpen(true)}
              onViewSupplierDetail={(sup) => setViewingSupplier(sup)}
              onViewSub={(sub) => setViewingSub(sub)}
            />
          ) : null}
        </main>
      </div>

      <ReturnModal
        open={returnModal.open}
        onClose={() => setReturnModal({ open: false })}
        subId={returnModal.subId}
        onDone={(msg) => {
          setVersion((v) => v + 1);
          toast.show(msg);
        }}
      />
      <ItemDetailModal
        open={viewingSub !== null}
        onClose={() => setViewingSub(null)}
        sub={viewingSub}
        onReturn={(id) => openReturnModal(id)}
        onEdit={editSub}
        onViewSupplier={(sup) => setViewingSupplier(sup)}
      />
      <SupplierDetailModal
        open={viewingSupplier !== null}
        onClose={() => setViewingSupplier(null)}
        supplier={viewingSupplier}
        onFilterInMainList={filterMainListBySupplier}
      />
      <AddSupplierModal
        open={addSupplierModalOpen}
        onClose={() => setAddSupplierModalOpen(false)}
        onSaved={(company) => {
          setVersion((v) => v + 1);
          toast.show(`เพิ่มคู่ค้า "${company}" เข้าสู่ระบบเรียบร้อย`);
        }}
      />

      <Toast
        message={toast.message}
        visible={toast.visible}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-5 py-2.5 rounded-full shadow-2xl z-50 transition-all font-medium border border-gray-700"
      />
    </div>
  );
}
