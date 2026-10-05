"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Auth, SEED } from "../../lib/auth";
import { RL } from "../../lib/roleLabels";
import styles from "./page.module.css";

const DESCS: Record<string, string> = {
  supplier: "กรอกข้อมูลเครื่องจักร สเปค ประกัน อะไหล่ และงบซ่อม",
  buyer: "ตรวจและแก้ไขข้อมูลที่ Supplier ส่งมา ดูทะเบียนทรัพย์สิน",
  admin: "ดูภาพรวมรายการทั้งหมดและจัดการข้อมูล",
};

function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryRole = searchParams.get("role");
  const initialRole = queryRole && RL[queryRole] ? queryRole : "supplier";

  function credsFor(
    r: string,
    buyerEmail: string,
  ): { mail: string; pw: string } {
    const seedUser =
      r === "buyer"
        ? SEED.find((x) => x.email === buyerEmail) ||
          SEED.find((x) => x.role === "buyer")
        : SEED.find((x) => x.role === r);
    return {
      mail: seedUser ? seedUser.email : "",
      pw: seedUser ? seedUser.pw : "",
    };
  }

  const [role, setRole] = useState(initialRole);
  const [buyerDemo, setBuyerDemo] = useState("buyer@demo.co.th");
  const [mail, setMail] = useState(
    () => credsFor(initialRole, "buyer@demo.co.th").mail,
  );
  const [pw, setPw] = useState(
    () => credsFor(initialRole, "buyer@demo.co.th").pw,
  );
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState(false);

  function applyRole(r: string, buyerEmail: string) {
    const c = credsFor(r, buyerEmail);
    setRole(r);
    setBuyerDemo(buyerEmail);
    setMail(c.mail);
    setPw(c.pw);
    setErr(false);
    sessionStorage.setItem("selected_role", r);
  }

  useEffect(() => {
    // Resolve the stored role after mount (kept out of render to avoid an SSR hydration mismatch).
    let r = initialRole;
    if (!(queryRole && RL[queryRole])) {
      const stored =
        sessionStorage.getItem("selected_role") ||
        localStorage.getItem("selected_role");
      if (stored && RL[stored]) r = stored;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    applyRole(r, "buyer@demo.co.th");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function switchRole(r: string) {
    applyRole(r, buyerDemo);
    localStorage.setItem("selected_role", r);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("role", r);
      window.history.replaceState(null, "", url.toString());
    } catch {
      /* ignore */
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(false);
    const s = Auth.login(role, mail.trim(), pw);
    if (!s) {
      setErr(true);
      return;
    }
    router.push(Auth.home(s.role));
  }

  const roleInfo = RL[role];

  return (
    <div
      className={`flex flex-col min-h-screen text-slate-800 antialiased relative ${styles.bg}`}
    >
      <header className="w-full px-6 md:px-12 py-4 flex items-center justify-between relative z-20">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image
            src="/img/logo.png"
            alt="Supplier Portal"
            width={32}
            height={32}
            className="w-8 h-8 object-contain group-hover:scale-105 transition-transform drop-shadow-sm"
          />
          <span className="font-bold text-xl text-gray-900 tracking-tight">
            Supplier Portal
          </span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-5 relative z-10">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-md bg-white rounded-3xl shadow-[0_15px_35px_rgba(0,0,0,0.06)] border border-gray-100 p-8"
          autoComplete="off"
        >
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-[#0b6330] inline-flex items-center gap-1.5 transition-colors font-medium"
            >
              &larr; กลับหน้าเลือกบทบาท
            </Link>
            <span
              className={`text-xs px-3 py-1 rounded-full font-semibold ${roleInfo[2]}`}
            >
              {roleInfo[1]}
            </span>
          </div>

          <div className="brand text-2xl font-bold tracking-wide mt-2 text-[#0b6330]">
            SUPPLIER PORTAL
          </div>
          <h1 className="text-2xl font-bold mt-1 text-gray-900">
            เข้าสู่ระบบ {roleInfo[1]}
          </h1>
          <p className="text-sm text-gray-500 mb-4 font-medium">
            {DESCS[role]}
          </p>

          <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-2xl mb-4">
            {(["supplier", "buyer", "admin"] as const).map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => switchRole(r)}
                className={`py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
                  r === role
                    ? "font-bold bg-[#0b6330] text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/60"
                }`}
              >
                {RL[r][1]}
              </button>
            ))}
          </div>

          {role === "buyer" ? (
            <div className="mb-4 p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-xs">
              <div className="text-gray-600 font-semibold mb-2 flex items-center justify-between">
                <span>เลือกบัญชี Buyer ทดสอบ (สิทธิ์ Category ต่างกัน):</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => applyRole("buyer", "buyer@demo.co.th")}
                  className={`p-2.5 rounded-xl border bg-white text-left transition-all ${
                    buyerDemo === "buyer@demo.co.th"
                      ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
                      : "border-gray-200 hover:border-emerald-300"
                  }`}
                >
                  <div className="font-bold text-emerald-900">Buyer 1</div>
                  <div className="text-[10px] text-emerald-700 font-medium">
                    สิทธิ์: เครื่องเย็น & HVAC
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => applyRole("buyer", "buyer2@demo.co.th")}
                  className={`p-2.5 rounded-xl border bg-white text-left transition-all ${
                    buyerDemo === "buyer2@demo.co.th"
                      ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
                      : "border-gray-200 hover:border-emerald-300"
                  }`}
                >
                  <div className="font-bold text-gray-800">Buyer 2</div>
                  <div className="text-[10px] text-gray-500 font-medium">
                    สิทธิ์: ไฟฟ้า & ความปลอดภัย
                  </div>
                </button>
              </div>
            </div>
          ) : null}

          <label className="text-sm font-medium text-gray-700 block mb-1">
            อีเมล
          </label>
          <input
            name={`${role}_user_email`}
            type="email"
            required
            className="inp mb-4"
            placeholder="email@company.com"
            autoComplete="off"
            value={mail}
            onChange={(e) => setMail(e.target.value)}
          />

          <label className="text-sm font-medium text-gray-700 block mb-1">
            รหัสผ่าน
          </label>
          <div className="relative mb-4">
            <input
              name={`${role}_user_password`}
              type={showPw ? "text" : "password"}
              required
              className="inp pr-16"
              placeholder="กรอกรหัสผ่าน"
              autoComplete="new-password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3.5 top-2.5 text-sm text-[#0b6330] font-medium hover:underline"
            >
              {showPw ? "ซ่อน" : "แสดง"}
            </button>
          </div>

          <p
            className={`${err ? "" : "hidden "}text-sm text-red-600 mb-4 bg-red-50 p-3 rounded-xl border border-red-200`}
          >
            อีเมลหรือรหัสผ่านไม่ถูกต้อง
          </p>

          <button
            type="submit"
            className="w-full bg-[#0b6330] hover:bg-[#084d25] text-white font-semibold rounded-xl py-3.5 transition-all shadow-md hover:shadow-lg"
          >
            <span>เข้าสู่ระบบ {roleInfo[1]}</span>{" "}
            <span className="ml-1">&rarr;</span>
          </button>

          <p
            className={`${role === "supplier" ? "" : "hidden "}text-sm text-center text-gray-600 mt-5`}
          >
            ยังไม่มีบัญชี?{" "}
            <Link
              href="/register"
              className="text-[#0b6330] font-semibold hover:underline"
            >
              ลงทะเบียน Supplier
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  );
}
