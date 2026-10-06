// app/submissions/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useRequireAuth } from "../../lib/useRequireAuth";
import { Store, type Submission } from "../../lib/store";
import { Permissions } from "../../lib/permissions";
import { CATN } from "../../lib/catalog";
import { LABELS_MAP } from "../../lib/mockData";
import { Auth } from "../../lib/auth";
import { fdt } from "../../lib/format";
import { useToast } from "../../lib/useToast";
import { Toast } from "../../components/Toast";
import { Modal } from "../../components/Modal";
import { StatCard } from "../../components/StatCard";
import { StatusBadge } from "../../components/StatusBadge";

export default function Page() {
  const session = useRequireAuth(["buyer", "admin", "supplier"]);
  const router = useRouter();
  const { message, visible, show } = useToast();
  const [, forceRefresh] = useState(0);
  const [fSrc, setFSrc] = useState("");
  const [fCat, setFCat] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fQ, setFQ] = useState("");
  const [viewing, setViewing] = useState<Submission | null>(null);

  const role = session?.role;

  const accessible = !session
    ? []
    : role === "admin"
      ? Store.all()
      : role === "supplier"
        ? Store.all().filter((r) => {
            const sMail = (session.email || "").toLowerCase();
            const sCode = (session.code || "").toLowerCase();
            const sName = (session.name || "").toLowerCase();
            const rMail = (r.email || "").toLowerCase();
            const rSup = String(r.values?.sup || "").toLowerCase();
            return (
              rMail === sMail ||
              (Boolean(sCode) && rSup.includes(sCode)) ||
              (Boolean(sName) && rSup.includes(sName))
            );
          })
        : Store.all().filter((r) =>
            Permissions.canView(
              session.email,
              r.values?.category as string | undefined,
              role!,
            ),
          );

  const sorted = [...accessible].sort((a, b) => b.at - a.at);

  const filtered = sorted.filter((r) => {
    const matchSrc = !fSrc || r.role === fSrc;
    const cat = (r.values?.category as string) || "";
    const matchCat =
      !fCat || cat.trim().toLowerCase() === fCat.trim().toLowerCase();
    const matchStatus = !fStatus || r.status === fStatus;
    const q = fQ.toLowerCase().trim();
    const matchQ =
      !q ||
      JSON.stringify(r.values || {})
        .toLowerCase()
        .includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.title.toLowerCase().includes(q) ||
      (r.returnReason || "").toLowerCase().includes(q);
    return matchSrc && matchCat && matchStatus && matchQ;
  });

  if (!session) return null;

  const waitCount = sorted.filter((r) => r.status === "รอ Buyer ตรวจ").length;
  const revCount = sorted.filter((r) => r.status === "ตรวจ/แก้ไขแล้ว").length;
  const supCount = sorted.filter((r) => r.role === "supplier").length;
  const returnedCount = sorted.filter(
    (r) => r.status === "ส่งคืนให้ Buyer แก้ไข",
  ).length;

  const catCounts: Record<string, number> = {};
  sorted.forEach((r) => {
    const c = (r.values?.category as string) || "ไม่ระบุ";
    catCounts[c] = (catCounts[c] || 0) + 1;
  });
  const maxCount = Math.max(1, ...Object.values(catCounts));

  const allowedCats = role === "buyer" ? Permissions.get(session.email) : CATN;

  const email = session.email;

  function editSub(r: Submission) {
    if (
      role === "buyer" &&
      !Permissions.canView(
        email,
        r.values?.category as string | undefined,
        role,
      )
    ) {
      show(
        "คุณไม่มีสิทธิ์เข้าถึงหรือแก้ไขรายการในหมวด " +
          ((r.values?.category as string) || ""),
      );
      return;
    }
    sessionStorage.setItem("edit_id", r.id);
    router.push(`/form?edit=${encodeURIComponent(r.id)}`);
  }

  function resetMockData() {
    Store.resetMock();
    forceRefresh((n) => n + 1);
    show("รีเซ็ตข้อมูลตัวอย่างเรียบร้อย");
  }

  return (
    <div className="bg-gray-50 text-gray-900 min-h-screen">
      <header
        className="bg-white border-b sticky top-0 z-20"
        style={{ top: "env(safe-area-inset-top,0px)" }}
      >
        <div className="w-full px-6 md:px-12 py-3.5 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
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
              className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                role === "supplier"
                  ? "bg-blue-100 text-blue-800 border-blue-200"
                  : "bg-emerald-100 text-emerald-800 border-emerald-200"
              }`}
            >
              {role === "admin" ? "Admin" : role === "supplier" ? "Supplier" : "Buyer"}
            </span>
            <span className="text-sm text-gray-600 font-medium">
              {session.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {role === "admin" ? (
              <div className="mr-2">
                <Link
                  href="/admin"
                  className="text-xs text-emerald-800 hover:text-emerald-950 font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200"
                >
                  ไปที่หน้า Admin Dashboard &gt;
                </Link>
              </div>
            ) : null}
            <Link
              href="/form"
              className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg px-4 py-2 transition-colors flex items-center gap-1.5"
            >
              <span>+ กรอกฟอร์มใหม่</span>
            </Link>
            <button
              onClick={Auth.logout}
              className="text-sm border rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
        <div className="w-full px-6 md:px-12 pb-3 font-bold text-lg text-gray-800">
          {role === "supplier"
            ? "ประวัติการส่งข้อมูลเครื่องจักรและอุปกรณ์ของคุณ"
            : "รายการเครื่องจักรและอุปกรณ์ที่ส่งเข้ามา"}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {role === "supplier" ? (
          <div className="mb-4 p-4 bg-white rounded-2xl border border-blue-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0 font-bold text-lg">
                📋
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900">
                  ประวัติการส่งข้อมูลเครื่องจักร &amp; อุปกรณ์ของคุณ
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  คุณสามารถติดตามสถานะการตรวจสอบของ Buyer ได้ที่นี่ รายการที่ผ่านการตรวจสอบจะแสดงสถานะ{" "}
                  <span className="font-semibold text-emerald-700">ตรวจแล้ว (Complete)</span>
                </div>
              </div>
            </div>
            <Link
              href="/form"
              className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors shrink-0 shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
            >
              <span>+ กรอกเครื่องจักรใหม่</span>
            </Link>
          </div>
        ) : role === "buyer" ? (
          <div className="mb-4 p-4 bg-white rounded-2xl border border-emerald-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                  ขอบเขต Category ที่ได้รับมอบหมายสำหรับคุณ
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  คุณสามารถดูและตรวจสอบเฉพาะรายการในหมวดหมู่ที่ Admin
                  กำหนดสิทธิ์ให้เท่านั้น
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1 sm:mt-0">
                {allowedCats.length === 0 ? (
                  <span className="text-xs text-rose-700 bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg font-medium">
                    ยังไม่ได้รับมอบหมายสิทธิ์ Category ใด (กรุณาติดต่อ Admin)
                  </span>
                ) : (
                  allowedCats.map((cat) => (
                    <span
                      key={cat}
                      className="inline-flex items-center text-xs px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-medium border border-emerald-200"
                    >
                      {cat}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : null}

        {role === "buyer" && returnedCount > 0 ? (
          <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-2xl shadow-xs text-rose-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 animate-ping" />
              <div>
                <div className="font-bold text-sm">
                  มีเอกสารที่ Admin ส่งคืนให้คุณแก้ไข
                </div>
                <div className="text-xs text-rose-700 mt-0.5">
                  พบ {returnedCount} รายการที่ส่งคืนและรอการตรวจสอบ/แก้ไข
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFStatus("ส่งคืนให้ Buyer แก้ไข")}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors shrink-0"
            >
              ดูรายการส่งคืน
            </button>
          </div>
        ) : null}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <StatCard label="ทั้งหมด" value={sorted.length} />
          <StatCard
            label="รอ Buyer ตรวจ"
            value={waitCount}
            colorClassName="text-amber-600"
          />
          <StatCard
            label={role === "supplier" ? "ตรวจแล้ว (Complete)" : "ตรวจ/แก้ไขแล้ว"}
            value={revCount}
            colorClassName="text-emerald-700"
          />
          {role === "supplier" ? (
            <StatCard
              label="ส่งคืนให้แก้ไข"
              value={returnedCount}
              colorClassName="text-rose-600"
            />
          ) : (
            <StatCard
              label="จาก Supplier"
              value={supCount}
              colorClassName="text-blue-700"
            />
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
          <div className="font-semibold mb-3 text-gray-800">
            จำนวนรายการแยกตาม Category
          </div>
          <div className="space-y-2">
            {Object.keys(catCounts).length === 0 ? (
              <p className="text-sm text-gray-500">ยังไม่มีข้อมูล</p>
            ) : (
              Object.entries(catCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([c, n]) => (
                  <div key={c} className="flex items-center gap-3 text-sm">
                    <div className="w-48 shrink-0 truncate text-gray-700 font-medium">
                      {c}
                    </div>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-600 rounded-full transition-all"
                        style={{ width: `${(n / maxCount) * 100}%` }}
                      />
                    </div>
                    <div className="w-8 text-right font-semibold text-gray-900">
                      {n}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {role !== "supplier" ? (
            <select
              value={fSrc}
              onChange={(e) => setFSrc(e.target.value)}
              className="inp !w-auto"
            >
              <option value="">ต้นทาง: ทั้งหมด</option>
              <option value="supplier">จาก Supplier</option>
              <option value="buyer">จาก Buyer</option>
            </select>
          ) : null}
          <select
            value={fCat}
            onChange={(e) => setFCat(e.target.value)}
            className="inp !w-auto"
          >
            <option value="">
              {role === "buyer"
                ? "Category: ทั้งหมดตามสิทธิ์"
                : "Category: ทั้งหมด"}
            </option>
            {allowedCats.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={fStatus}
            onChange={(e) => setFStatus(e.target.value)}
            className="inp !w-auto"
          >
            <option value="">สถานะ: ทั้งหมด</option>
            <option value="รอ Buyer ตรวจ">รอ Buyer ตรวจ (Pending)</option>
            <option value="ตรวจ/แก้ไขแล้ว">ตรวจแล้ว (Complete)</option>
            <option value="ส่งคืนให้ Buyer แก้ไข">ส่งคืนให้แก้ไข</option>
          </select>
          <input
            value={fQ}
            onChange={(e) => setFQ(e.target.value)}
            className="inp !w-auto flex-1 min-w-[160px]"
            placeholder={
              role === "supplier"
                ? "ค้นหา ชื่อเครื่องจักร, รุ่น, หมายเหตุ..."
                : "ค้นหา ชื่อ รุ่น Supplier ผู้ส่ง"
            }
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-x-auto border border-gray-100">
          <table className="w-full text-sm min-w-[860px]">
            <thead className="bg-gray-100 text-gray-700 text-left">
              <tr>
                <th className="p-3">วันที่ส่ง</th>
                <th className="p-3">รายการ</th>
                <th className="p-3">Category</th>
                <th className="p-3">Sub Category</th>
                {role === "supplier" ? (
                  <th className="p-3">รุ่น / ผู้ตรวจ</th>
                ) : (
                  <th className="p-3">ผู้ส่ง</th>
                )}
                <th className="p-3">สถานะ</th>
                <th className="p-3 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className={`border-t hover:bg-gray-50 transition-colors ${
                    r.status === "ส่งคืนให้ Buyer แก้ไข" ? "bg-rose-50/30" : ""
                  }`}
                >
                  <td className="p-3 whitespace-nowrap text-gray-500 text-xs">
                    {fdt(r.at)}
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-gray-900">{r.title}</div>
                    {r.returnReason ? (
                      <div className="text-[11px] text-rose-600 mt-0.5 truncate max-w-xs font-medium">
                        หมายเหตุส่งคืน: &quot;{r.returnReason}&quot;
                      </div>
                    ) : null}
                  </td>
                  <td className="p-3 text-gray-700">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-gray-100 text-xs font-medium">
                      {(r.values?.category as string) || "-"}
                    </span>
                  </td>
                  <td className="p-3 text-gray-600 text-xs">
                    {(r.values?.subCat as string) || "-"}
                  </td>
                  {role === "supplier" ? (
                    <td className="p-3 text-gray-600 text-xs">
                      <div className="font-medium text-gray-800">
                        {String(r.values?.model || r.values?.model2 || r.values?.brand || "-")}
                      </div>
                      <div className="text-gray-400 font-mono text-[11px]">
                        {r.updatedBy ? `ตรวจโดย: ${r.updatedBy}` : "รอ Buyer ตรวจสอบ"}
                      </div>
                    </td>
                  ) : (
                    <td className="p-3 text-gray-600 text-xs">
                      <div className="font-medium text-gray-800">
                        {((r.values?.sup as string) || "")
                          .split("/")[1]
                          ?.trim() || r.email}
                      </div>
                      <div className="text-gray-400 font-mono text-[11px]">
                        {r.email}
                      </div>
                    </td>
                  )}
                  <td className="p-3 whitespace-nowrap">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => setViewing(r)}
                      className="text-gray-700 hover:text-green-700 hover:underline mr-3 font-medium text-xs"
                    >
                      ดู
                    </button>{" "}
                    {role === "supplier" && r.status === "ตรวจ/แก้ไขแล้ว" ? (
                      <span className="text-xs text-gray-400 font-medium">
                        อนุมัติแล้ว
                      </span>
                    ) : (
                      <button
                        onClick={() => editSub(r)}
                        className="text-green-700 hover:text-green-900 font-semibold hover:underline text-xs"
                      >
                        แก้ไข
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p className="mb-3 text-base">
                {role === "buyer" && allowedCats.length === 0
                  ? "บัญชีของคุณยังไม่ได้รับมอบหมายสิทธิ์ใน Category ใด จึงไม่สามารถแสดงรายการได้ (กรุณาติดต่อ Admin)"
                  : role === "supplier"
                    ? "คุณยังไม่มีประวัติการส่งข้อมูล หรือไม่มีรายการตรงตามเงื่อนไขที่ค้นหา"
                    : "ยังไม่มีรายการที่ส่งเข้ามาตามเงื่อนไขที่เลือก"}
              </p>
              {role === "supplier" ? (
                <Link
                  href="/form"
                  className="inline-flex items-center bg-green-700 hover:bg-green-800 text-white text-xs px-4 py-2 rounded-xl font-medium shadow-sm transition-colors"
                >
                  + กรอกข้อมูลเครื่องจักรเครื่องแรก
                </Link>
              ) : (
                <button
                  onClick={resetMockData}
                  className="bg-green-700 hover:bg-green-800 text-white text-xs px-4 py-2 rounded-xl font-medium shadow-sm transition-colors"
                >
                  โหลดข้อมูลตัวอย่าง (Mock Data 6 รายการ)
                </button>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mt-3">
          <span>ข้อมูลจำลองจัดเก็บในเบราว์เซอร์เครื่องนี้ (localStorage)</span>
          <button
            onClick={resetMockData}
            className="text-green-700 hover:underline"
          >
            รีโหลดข้อมูลตัวอย่างอีกครั้ง
          </button>
        </div>
      </main>

      <Modal open={viewing !== null} onClose={() => setViewing(null)}>
        {viewing ? (
          <>
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <StatusBadge status={viewing.status} />
                  {viewing.status === "ตรวจ/แก้ไขแล้ว" ? (
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                      Complete
                    </span>
                  ) : viewing.status === "รอ Buyer ตรวจ" ? (
                    <span className="text-xs font-semibold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                      Pending (รอตรวจ)
                    </span>
                  ) : null}
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  {viewing.title}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  วันที่ส่ง: {fdt(viewing.at)} / ผู้ส่ง: {viewing.email}
                  {viewing.updatedBy ? (
                    <>
                      <br />
                      <span className="text-green-700 font-medium">
                        แก้ไขล่าสุด {fdt(viewing.updatedAt || viewing.at)} โดย{" "}
                        {viewing.updatedBy}
                      </span>
                    </>
                  ) : null}
                </p>
              </div>
              <button
                onClick={() => setViewing(null)}
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            {viewing.status === "ตรวจ/แก้ไขแล้ว" ? (
              <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <div>
                    <div className="font-bold">ข้อมูลเครื่องจักรนี้ได้รับการตรวจสอบเรียบร้อยแล้ว (Complete)</div>
                    <div className="text-emerald-700 text-[11px] mt-0.5">
                      {viewing.updatedBy ? `ตรวจสอบและบันทึกโดย ${viewing.updatedBy}` : "บันทึกในระบบเรียบร้อยแล้ว"}
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-xs border border-emerald-200 shrink-0">
                  ✓ ตรวจสอบแล้ว
                </span>
              </div>
            ) : viewing.status === "รอ Buyer ตรวจ" ? (
              <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <div>
                    <div className="font-bold">สถานะ: รอ Buyer ตรวจสอบข้อมูล (Pending)</div>
                    <div className="text-amber-700 text-[11px] mt-0.5">
                      ข้อมูลส่งเข้าระบบแล้ว กำลังรอเจ้าหน้าที่ฝ่ายจัดซื้อ (Buyer) ตรวจสอบและลงทะเบียน
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-semibold text-xs border border-amber-200 shrink-0">
                  กำลังรอตรวจ
                </span>
              </div>
            ) : viewing.status === "ส่งคืนให้ Buyer แก้ไข" ||
            viewing.returnReason ? (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs">
                <div className="font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>เอกสารนี้ถูก Admin ส่งคืนให้แก้ไข</span>
                </div>
                <div className="mt-1 font-semibold text-rose-800 whitespace-pre-line">
                  {viewing.returnReason || "-"}
                </div>
                <div className="mt-1 text-[11px] text-gray-500">
                  ส่งคืนเมื่อ: {fdt(viewing.returnedAt || viewing.at)} โดย{" "}
                  {viewing.returnedBy || "Admin"}
                  {viewing.assignedBuyer
                    ? ` (มอบหมายให้: ${viewing.assignedBuyer})`
                    : ""}
                </div>
              </div>
            ) : null}
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm max-h-[60vh] overflow-y-auto p-1">
              {Object.entries(viewing.values || {})
                .filter(([, v]) => v != null && v !== "")
                .map(([k, v]) => (
                  <div key={k} className="border-b border-gray-100 pb-2">
                    <dt className="text-gray-500 text-xs font-medium">
                      {viewing.labels?.[k] || LABELS_MAP[k] || k}
                    </dt>
                    <dd className="font-semibold text-gray-900 break-words mt-0.5">
                      {String(v)}
                    </dd>
                  </div>
                ))}
            </dl>
            <div className="flex justify-end gap-2 mt-5 pt-3 border-t">
              <button
                onClick={() => setViewing(null)}
                className="border rounded-xl px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                ปิด
              </button>
              {role === "supplier" && viewing.status === "ตรวจ/แก้ไขแล้ว" ? (
                <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl">
                  ✓ เอกสารนี้สมบูรณ์แล้ว
                </span>
              ) : (
                <button
                  onClick={() => {
                    const v = viewing;
                    setViewing(null);
                    if (v) editSub(v);
                  }}
                  className="bg-green-700 hover:bg-green-800 text-white rounded-xl px-5 py-2 text-sm font-semibold shadow-sm transition-colors"
                >
                  แก้ไขรายการนี้
                </button>
              )}
            </div>
          </>
        ) : null}
      </Modal>

      <Toast message={message} visible={visible} />
    </div>
  );
}
