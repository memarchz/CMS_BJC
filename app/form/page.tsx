"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Auth } from "../../lib/auth";
import { CATS, HIDE, S, STEPS, type Field } from "../../lib/catalog";
import { fdt, fmt } from "../../lib/format";
import { Permissions } from "../../lib/permissions";
import { RL } from "../../lib/roleLabels";
import { Store, type Submission } from "../../lib/store";
import { useRequireAuth } from "../../lib/useRequireAuth";
import { useToast } from "../../lib/useToast";
import { Toast } from "../../components/Toast";
import { PhotoScanModal } from "./PhotoScanModal";

type FormValues = Record<string, string>;

// Default values for plain inputs (e.g. assetCode "AUTO", ef 0.4999) — mirrors `value="${x.o ?? ''}"` in form.js
const DEFAULTS: FormValues = {};
STEPS.forEach((s) =>
  s.groups.forEach((g) =>
    g.f.forEach((x) => {
      if (["select", "textarea", "file", "calc"].includes(x.t)) return;
      if (Array.isArray(x.o) || x.o === undefined || x.o === null || x.o === "") return;
      DEFAULTS[x.k] = String(x.o);
    })
  )
);

function sanitizeFor(v: FormValues, r: string, mail: string): FormValues {
  const allowed = r === "buyer" ? Permissions.get(mail) : undefined;
  const next = { ...v };
  STEPS.filter((s) => s.roles.includes(r))
    .flatMap((s) => s.groups.flatMap((g) => g.f.filter((x) => !x.only || x.only.includes(r))))
    .forEach((x) => {
      if (x.t !== "select") return;
      let opts = (x.o as string[]) || [];
      if (x.k === "category" && allowed) {
        opts = opts.filter((c) => allowed.some((a) => String(a).trim().toLowerCase() === String(c).trim().toLowerCase()));
      }
      if (x.k === "subCat") opts = CATS[next.category || ""] || [];
      if (next[x.k] && !opts.includes(next[x.k])) next[x.k] = "";
    });
  return next;
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <FormPage />
    </Suspense>
  );
}

function FormPage() {
  const session = useRequireAuth(["supplier", "buyer", "admin"]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { message, visible, show } = useToast();

  const role = session?.role ?? "";
  const email = session?.email ?? "";

  const [step, setStep] = useState(0);
  const [values, setValues] = useState<FormValues>(DEFAULTS);
  const [bad, setBad] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Submission | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [nameplate, setNameplate] = useState<{ image: string; info: string } | null>(null);
  const initRef = useRef(false);
  const focusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mySteps = useMemo(() => STEPS.filter((s) => s.roles.includes(role)), [role]);
  const gf = (g: { f: Field[] }) => g.f.filter((x) => !x.only || x.only.includes(role));
  const allF = (): Field[] => mySteps.flatMap((s) => s.groups.flatMap((g) => gf(g)));

  const category = values.category || "";
  const hiddenKeys = useMemo(() => new Set(HIDE[category.trim()] || []), [category]);
  const vis = (x: Field) => !hiddenKeys.has(x.k);
  const subList = CATS[category] || [];
  const hasSub = subList.length > 0;
  // Sub Category is required only when the selected category has sub-categories (updateSub in form.js)
  const isReq = (x: Field) => (x.k === "subCat" ? hasSub : x.r === "r");

  const allowedCats = role === "buyer" ? Permissions.get(email) : undefined;

  function optionsFor(x: Field, cat: string): string[] {
    let opts = (x.o as string[]) || [];
    if (x.k === "category" && allowedCats) {
      opts = opts.filter((c) => allowedCats.some((a) => String(a).trim().toLowerCase() === String(c).trim().toLowerCase()));
    }
    if (x.k === "subCat") opts = CATS[cat] || [];
    return opts;
  }

  // A <select> whose value is not among its options resolves to "" in the original DOM.
  function sanitize(v: FormValues): FormValues {
    const next = { ...v };
    allF().forEach((x) => {
      if (x.t !== "select") return;
      const cur = next[x.k];
      if (cur && !optionsFor(x, next.category || "").includes(cur)) next[x.k] = "";
    });
    return next;
  }

  const val = (x: Field) => (values[x.k] || "").trim();

  const calc = useMemo(() => {
    const n = (k: string) => parseFloat(values[k]) || 0;
    const kwhY = n("energy") * n("hrs");
    const life = n("life");
    const energyCost = kwhY * 4.5 * life;
    const tco = n("price")
      ? fmt(n("price") + n("maint") * life + n("cons") * life + energyCost - (n("price") * n("resid")) / 100) + " THB"
      : "";
    const y = (kwhY * n("ef")) / 1000;
    return {
      tco,
      co2y: y ? fmt(y, 2) : "",
      co2l: y && life ? fmt(y * life, 2) : "",
      cval: y && life && n("cprice") ? fmt(y * life * n("cprice")) + " THB" : "",
    } as Record<string, string>;
  }, [values]);

  // Initialisation once the session is known (init() in form.js)
  useEffect(() => {
    if (!session || initRef.current) return;
    initRef.current = true;
    const eid = searchParams.get("edit") || sessionStorage.getItem("edit_id");
    sessionStorage.removeItem("edit_id");
    const r = role !== "supplier" && eid ? Store.all().find((x) => x.id === eid) : undefined;
    if (r) {
      if (role === "buyer" && !Permissions.canView(session.email, r.values?.category as string | undefined, role)) {
        alert(
          'คุณไม่มีสิทธิ์เข้าถึงหรือแก้ไขรายการในหมวด "' +
            ((r.values?.category as string) || "ไม่ระบุ") +
            '"\nเนื่องจากอยู่นอกเหนือสิทธิ์ Category ที่ Admin กำหนดให้'
        );
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setBlocked(true);
        router.replace("/submissions");
        return;
      }
      const prefill: FormValues = { ...DEFAULTS };
      STEPS.filter((s) => s.roles.includes(role))
        .flatMap((s) => s.groups.flatMap((g) => g.f.filter((x) => !x.only || x.only.includes(role))))
        .forEach((x) => {
          const v = r.values[x.k];
          if (v === undefined || v === "") return;
          prefill[x.k] = String(v);
        });
      setEditing(r);
      setValues(sanitizeFor(prefill, role, session.email));
    } else if (role === "supplier") {
      setValues((prev) => ({ ...prev, sup: (session.code ? session.code + " / " : "") + session.name }));
    }
  }, [session, searchParams, role, router]);

  useEffect(
    () => () => {
      if (focusTimer.current) clearTimeout(focusTimer.current);
    },
    []
  );

  function showStep(i: number) {
    setStep(i);
    window.scrollTo(0, 0);
  }

  function setField(x: Field, v: string) {
    setValues((prev) => {
      const next = { ...prev, [x.k]: v };
      if (x.k === "category") {
        // updateSub(): keep Sub Category only if it still belongs to the selected category
        const list = CATS[v] || [];
        if (!list.includes(next.subCat || "")) next.subCat = "";
      }
      return next;
    });
    // form.js clears the red "bad" mark only for Sub Category changes, files and when there is no Sub Category
    if (x.k === "subCat" || x.t === "file" || (x.k === "category" && !(CATS[v] || []).length)) {
      setBad((prev) => {
        const keys = x.k === "category" ? ["subCat"] : [x.k];
        if (!keys.some((k) => prev.has(k))) return prev;
        const next = new Set(prev);
        keys.forEach((k) => next.delete(k));
        return next;
      });
    }
  }

  const reqFields = allF().filter((x) => isReq(x) && vis(x));
  const doneCount = reqFields.filter((x) => val(x)).length;
  const pct = reqFields.length ? Math.round((doneCount / reqFields.length) * 100) : 0;

  function go(d: number) {
    const n = mySteps.length;
    if (d > 0 && step === n - 1) return submit();
    showStep(Math.min(n - 1, Math.max(0, step + d)));
  }

  function submit() {
    const miss = allF().filter((x) => isReq(x) && vis(x) && !val(x));
    if (!miss.length) {
      const ed = !!editing;
      save();
      setBad(new Set());
      setDone(
        ed
          ? "บันทึกการแก้ไขเรียบร้อย รายการถูกอัปเดตในหน้ารายการที่ส่งมา"
          : role === "supplier"
          ? "ส่งข้อมูลให้ Buyer ตรวจสอบเรียบร้อย"
          : "บันทึกข้อมูลเรียบร้อย"
      );
      return;
    }
    setBad(new Set(miss.map((x) => x.k)));
    const first = miss[0];
    const si = mySteps.findIndex((s) => s.groups.some((g) => gf(g).includes(first)));
    showStep(si);
    if (focusTimer.current) clearTimeout(focusTimer.current);
    focusTimer.current = setTimeout(() => {
      const el = document.getElementById(first.k + (first.t === "file" ? "_box" : ""));
      if (!el) return;
      el.scrollIntoView?.({ behavior: "smooth", block: "center" });
      el.focus?.();
    }, 50);
    show("ยังขาดช่องบังคับอีก " + miss.length + " ช่อง");
  }

  function autofill() {
    let c = 0;
    const next: FormValues = { ...values };
    const cleared: string[] = [];
    allF().forEach((x) => {
      const v = S[x.k];
      if (v === undefined) return;
      next[x.k] = String(v);
      if (x.t === "file") cleared.push(x.k);
      c++;
    });
    setValues(sanitize(next));
    if (cleared.length) {
      setBad((prev) => {
        const b = new Set(prev);
        cleared.forEach((k) => b.delete(k));
        return b;
      });
    }
    show("กรอกข้อมูลตัวอย่างให้แล้ว " + c + " ช่อง ตรวจสอบและแก้ไขได้");
  }

  function applyScannedValues(data: Record<string, string>, imageDataUrl: string) {
    let filled = 0;
    const next: FormValues = { ...values };
    const cleared = new Set<string>(["docs"]);
    allF().forEach((field) => {
      const v = data[field.k];
      if (v !== undefined && v !== "") {
        next[field.k] = v;
        if (field.t === "file") cleared.add(field.k);
        filled++;
      }
    });
    // แนบรูปถ่ายเนมเพลทลงในช่องเอกสารอัตโนมัติ
    const docName = "nameplate_capture.jpg";
    if (!next.docs || !next.docs.includes(docName)) {
      next.docs = docName + (next.docs ? ", " + next.docs : "");
    }
    setValues(sanitize(next));
    setBad((prev) => {
      const b = new Set(prev);
      cleared.forEach((k) => b.delete(k));
      return b;
    });
    // อัปเดตรูป Thumbnail และแถบแจ้งเตือนบนฟอร์ม
    if (imageDataUrl) {
      setNameplate({
        image: imageDataUrl,
        info: `${data.brand || ""} ${data.model || ""} | S/N: ${data.serial || ""}`,
      });
    }
    show(`สแกนเนมเพลทและกรอกข้อมูลอัตโนมัติสำเร็จ (${filled} ช่อง)`);
  }

  function save() {
    if (!session) return;
    const newValues: Record<string, string> = {};
    const labels: Record<string, string> = {};
    allF().forEach((x) => {
      if (x.t !== "calc" && vis(x)) {
        newValues[x.k] = val(x);
        labels[x.k] = x.l;
      }
    });
    const mail = session.email;
    let rec: Submission;
    if (editing) {
      rec = {
        ...editing,
        values: { ...editing.values, ...newValues },
        labels: { ...editing.labels, ...labels },
        status: "ตรวจ/แก้ไขแล้ว",
        updatedAt: Date.now(),
        updatedBy: mail,
        fixedAt: Date.now(),
        returnedFixed: editing.status === "ส่งคืนให้ Buyer แก้ไข",
      };
    } else {
      rec = {
        id: "s" + Date.now(),
        role,
        email: mail,
        at: Date.now(),
        status: role === "supplier" ? "รอ Buyer ตรวจ" : "ส่งแล้ว",
        values: newValues,
        labels,
        title: "",
      };
    }
    rec.title = String(rec.values.assetName || rec.values.model2 || rec.values.sup || "(ไม่มีชื่อ)");
    Store.put(rec);
  }

  function doneBack() {
    router.push(role === "supplier" ? "/form" : role === "admin" ? "/admin" : "/submissions");
  }

  if (!session || blocked) return null;

  const showReturn = !!editing && (editing.status === "ส่งคืนให้ Buyer แก้ไข" || !!editing.returnReason);

  return (
    <>
      <header className="bg-white border-b sticky top-0 z-20" style={{ top: "env(safe-area-inset-top,0px)" }}>
        <div className="w-full px-6 md:px-12 py-3.5 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/" className="flex items-center gap-2.5 group mr-2">
              <Image src="/img/logo.png" alt="Supplier Portal" width={32} height={32} className="w-8 h-8 object-contain drop-shadow-sm" />
              <span className="font-bold text-xl text-gray-900 tracking-tight group-hover:text-[#0b6330] transition-colors">
                Supplier Portal
              </span>
            </Link>
            <span id="f-badge" className={`text-xs px-2.5 py-1 rounded-full ${RL[role][2]}`}>
              {RL[role][1]}
            </span>
            <span id="who" className="text-sm text-gray-500">
              {session.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPhotoOpen(true)}
              id="btnPhotoScan"
              className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg px-4 py-2 transition-colors shadow-sm"
            >
              Auto Fill
            </button>
            <button
              onClick={autofill}
              className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg px-4 py-2 transition-colors"
            >
              กรอกอัตโนมัติ
            </button>
            <Link
              id="backList"
              href={role === "admin" ? "/admin" : "/submissions"}
              className={`${role === "supplier" ? "hidden " : ""}text-sm border rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors`}
            >
              รายการที่ส่งมา
            </Link>
            <button
              onClick={() => {
                Auth.logout();
                router.push("/");
              }}
              className="text-sm border rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
        {editing ? (
          <div id="editbar" className="w-full px-6 md:px-12 pb-2">
            <span className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg px-3 py-1.5 inline-block">
              {"กำลังแก้ไข: " + editing.title + " (ส่งโดย " + editing.email + ") ตรวจแล้วกดส่งข้อมูลเพื่อบันทึก"}
            </span>
          </div>
        ) : null}
        <div className="w-full px-6 md:px-12 pb-3">
          <div className="flex items-center gap-3 text-xs text-gray-600 mb-1">
            <span>ความคืบหน้าช่องบังคับ</span>
            <span id="pct" className="font-semibold">
              {pct + "%"}
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div id="bar" className="h-full bg-green-600 transition-all" style={{ width: pct + "%" }}></div>
          </div>
          <div id="tabs" className="flex gap-2 overflow-x-auto mt-3">
            {mySteps.map((s, i) => {
              const rq = s.groups.flatMap((g) => gf(g)).filter((x) => isReq(x) && vis(x));
              const ok = rq.every((x) => val(x));
              return (
                <button
                  key={s.id}
                  onClick={() => showStep(i)}
                  className={`shrink-0 text-sm rounded-full px-4 py-1.5 border ${
                    i === step ? "bg-green-700 text-white border-green-700 font-semibold" : "bg-white hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  {`${i + 1}. ${s.title}${ok && rq.length ? " (ครบ)" : ""}`}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Admin Return Notice Banner (เมื่อเอกสารถูกส่งคืนให้แก้ไข) */}
        {showReturn && editing ? (
          <div
            id="return-alert-banner"
            className="mb-5 bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 sm:p-5 shadow-sm text-xs sm:text-sm"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path>
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-bold text-rose-900 text-sm sm:text-base flex items-center gap-2">
                  <span>Admin ได้ส่งคืนเอกสารนี้เพื่อให้ Buyer ตรวจสอบ / แก้ไขเพิ่มเติม</span>
                  <span className="bg-rose-200 text-rose-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">ต้องดำเนินการ</span>
                </div>
                <div className="mt-2 p-3.5 bg-white rounded-xl border border-rose-200 text-rose-900 font-medium">
                  <span className="text-rose-500 font-semibold block text-xs mb-1">ข้อความระบุสิ่งที่ต้องแก้ไขจาก Admin:</span>
                  <span id="return-alert-reason" className="text-sm">
                    {editing.returnReason || "โปรดตรวจสอบความถูกต้องของข้อมูลและเอกสารแนบตามที่ได้รับแจ้ง"}
                  </span>
                </div>
                <div id="return-alert-meta" className="text-xs text-rose-700/80 mt-2">
                  {`ส่งคืนเมื่อ: ${fdt(editing.returnedAt || editing.at)} โดย ${editing.returnedBy || "Admin"}`}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Scanned Photo Attached Preview Badge */}
        {nameplate ? (
          <div
            id="nameplate-preview-badge"
            className="mb-5 bg-white border border-emerald-200 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                id="formNameplateThumb"
                className="w-14 h-14 rounded-xl object-cover border border-emerald-300 shadow-xs"
                src={nameplate.image}
                alt="Nameplate"
              />
              <div>
                <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <span> แนบรูปถ่ายเนมเพลทแล้ว</span>
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-semibold">AI Extracted</span>
                </div>
                <div id="formNameplateInfo" className="text-xs text-gray-600 mt-0.5">
                  {nameplate.info}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPhotoOpen(true)}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold hover:underline shrink-0"
            >
              ถ่าย / เปลี่ยนรูปใหม่
            </button>
          </div>
        ) : null}

        <div id="steps">
          {mySteps.map((s, i) => (
            <div key={s.id} className={`step ${i === step ? "" : "hidden "}fadein`} data-i={i}>
              <h2 className="text-2xl font-bold mb-4">{s.title}</h2>
              {s.groups.map((g, gi) => {
                const fields = gf(g);
                if (fields.length && fields.every((x) => !vis(x))) return null;
                return (
                  <div key={gi} className="grp bg-white rounded-2xl shadow-sm mb-5 overflow-hidden">
                    <div className={`${g.c} text-white font-semibold px-5 py-3`}>{g.t}</div>
                    <div className="p-5 grid sm:grid-cols-2 gap-4">
                      {fields.map((x) =>
                        vis(x) ? (
                          <FieldInput
                            key={x.k}
                            field={x}
                            value={x.t === "calc" ? calc[x.k] ?? "" : values[x.k] ?? ""}
                            bad={bad.has(x.k) && !(x.k === "subCat" && !hasSub)}
                            options={x.t === "select" ? optionsFor(x, category) : []}
                            hasSub={hasSub}
                            onChange={(v) => setField(x, v)}
                          />
                        ) : null
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-6">
          <button
            id="prev"
            onClick={() => go(-1)}
            style={{ visibility: step ? "visible" : "hidden" }}
            className="px-5 py-2.5 rounded-xl border bg-white hover:bg-gray-50 transition-colors"
          >
            ← ย้อนกลับ
          </button>
          <button
            id="next"
            onClick={() => go(1)}
            className="px-5 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white font-semibold transition-colors"
          >
            {step === mySteps.length - 1 ? "ส่งข้อมูล " : "ถัดไป →"}
          </button>
        </div>
      </main>

      {/* Photo Upload & Camera Capture Modal (AI Nameplate Scan) */}
      <PhotoScanModal
        open={photoOpen}
        onClose={() => setPhotoOpen(false)}
        onApply={applyScannedValues}
        role={role}
        buyerAllowedCategories={allowedCats}
      />

      <div id="done" className={`${done ? "" : "hidden "}fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-5`}>
        <div className="bg-white rounded-2xl p-8 max-w-md text-center">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-2xl font-bold">
            &#10003;
          </div>
          <h2 className="text-xl font-bold">บันทึกเรียบร้อย</h2>
          <p id="done-t" className="text-gray-600 mt-2 mb-6">
            {done}
          </p>
          <button onClick={doneBack} className="bg-green-700 text-white rounded-xl px-5 py-2.5 font-semibold">
            กลับ
          </button>
        </div>
      </div>
      <Toast
        message={message}
        visible={visible}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-2 rounded-full z-50"
      />
    </>
  );
}

function FieldInput({
  field: x,
  value,
  bad,
  options,
  hasSub,
  onChange,
}: {
  field: Field;
  value: string;
  bad: boolean;
  options: string[];
  hasSub: boolean;
  onChange: (v: string) => void;
}) {
  const isSub = x.k === "subCat";
  const badge =
    isSub && !hasSub ? (
      <span className="ml-1 text-[10px] bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">ไม่มี Sub Category</span>
    ) : x.r === "r" || isSub ? (
      <span className="text-red-500">*</span>
    ) : x.r === "o" ? (
      <span className="ml-1 text-[10px] bg-gray-200 text-gray-700 rounded px-1.5 py-0.5">แนะนำ</span>
    ) : x.r === "n" ? (
      <span className="ml-1 text-[10px] bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">ถ้ามี</span>
    ) : (
      <span className="ml-1 text-[10px] bg-green-100 text-green-600 rounded px-1.5 py-0.5">คำนวณอัตโนมัติ</span>
    );

  let inp: React.ReactNode;
  if (x.t === "select") {
    const ph = isSub ? (hasSub ? "-- เลือก Sub Category --" : "-- ไม่มี Sub Category --") : "-- เลือก --";
    inp = (
      <select
        id={x.k}
        className={`inp${bad ? " bad" : ""}${isSub && !hasSub ? " bg-gray-100 cursor-not-allowed" : ""}`}
        value={value}
        disabled={isSub && !hasSub}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{ph}</option>
        {options.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
    );
  } else if (x.t === "textarea") {
    inp = (
      <textarea id={x.k} rows={3} className={`inp${bad ? " bad" : ""}`} placeholder={x.p} value={value} onChange={(e) => onChange(e.target.value)}></textarea>
    );
  } else if (x.t === "file") {
    inp = (
      <label className={`flex items-center gap-3 inp cursor-pointer${bad ? " bad" : ""}`} id={x.k + "_box"}>
        <input
          type="file"
          multiple
          className="hidden"
          onChange={(e) => onChange(Array.from(e.target.files || []).map((f) => f.name).join(", "))}
        />
        <span className="bg-gray-100 rounded-lg px-3 py-1 text-sm">เลือกไฟล์</span>
        <span id={x.k + "_n"} className={value ? "text-sm text-green-600 truncate font-medium" : "text-sm text-gray-500 truncate"}>
          {value || x.p}
        </span>
      </label>
    );
  } else if (x.t === "calc") {
    inp = <input id={x.k} className="inp font-semibold" readOnly placeholder={x.p || "รอข้อมูล..."} value={value} />;
  } else {
    inp = (
      <input
        id={x.k}
        type={x.t}
        className={`inp${bad ? " bad" : ""}`}
        placeholder={x.p}
        readOnly={x.k === "assetCode"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  const wide = x.t === "textarea" || x.t === "file" ? "sm:col-span-2" : "";
  return (
    <div id={x.k + "_wrap"} className={wide}>
      <label id={x.k + "_label"} htmlFor={x.t === "file" ? undefined : x.k} className="block text-sm font-medium mb-1">
        {`${x.l} `}
        {badge}
      </label>
      {inp}
    </div>
  );
}
