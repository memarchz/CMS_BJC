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

  function credsFor(r: string): { mail: string; pw: string } {
    const seedUser = SEED.find((x) => x.role === r);
    return {
      mail: seedUser ? seedUser.email : "",
      pw: seedUser ? seedUser.pw : "",
    };
  }

  const [role, setRole] = useState(initialRole);
  const [mail, setMail] = useState(() => credsFor(initialRole).mail);
  const [pw, setPw] = useState(() => credsFor(initialRole).pw);
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState(false);

  function applyRole(r: string) {
    const c = credsFor(r);
    setRole(r);
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
    applyRole(r);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function switchRole(r: string) {
    applyRole(r);
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
