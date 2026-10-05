"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Auth, type Session } from "../lib/auth";
import { RL } from "../lib/roleLabels";
import styles from "./page.module.css";

function selectRole(role: string) {
  sessionStorage.setItem("selected_role", role);
  localStorage.setItem("selected_role", role);
}

export default function Page() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Session lives in browser storage, so it can only be read after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(Auth.session());
  }, []);

  const roleCards: { role: string; img: string; label: string }[] = [
    { role: "supplier", img: "/img/supplier.png", label: "Supplier" },
    { role: "buyer", img: "/img/buyer.png", label: "Buyer" },
    { role: "admin", img: "/img/admin.png", label: "Admin" },
  ];

  return (
    <div className={`flex flex-col min-h-screen text-slate-800 antialiased relative ${styles.bg}`}>
      <nav className="w-full bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] sticky top-0 z-30">
        <div className="w-full px-6 md:px-12 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image src="/img/logo.png" alt="Supplier Portal" width={32} height={32} className="w-8 h-8 object-contain group-hover:scale-105 transition-transform drop-shadow-sm" />
            <span className="font-bold text-xl text-gray-900 tracking-tight group-hover:text-[#0b6330] transition-colors">
              Supplier Portal
            </span>
          </Link>
          <div>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold text-[#0b6330] hover:text-white bg-green-50 hover:bg-[#0b6330] border border-green-200 px-4 py-2 rounded-full transition-all shadow-sm"
            >
              <span>ลงทะเบียน Supplier</span>
              <span className="text-xs">&rarr;</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-5xl mx-auto text-center">
          <div
            data-testid="session-banner"
            className={`${
              session ? "" : "hidden "
            }max-w-xl mx-auto mb-6 bg-white/95 backdrop-blur border border-green-300 shadow-md rounded-full px-5 py-2.5 flex items-center justify-between gap-3 text-xs md:text-sm`}
          >
            <div className="flex items-center gap-2 truncate">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shrink-0" />
              <span className="text-gray-600 truncate">
                เข้าสู่ระบบอยู่ในชื่อ:{" "}
                <strong data-testid="session-user" className="text-green-800 font-semibold">
                  {session ? `${session.name} (${RL[session.role]?.[1] || session.role})` : ""}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={session ? Auth.home(session.role) : "#"}
                className="bg-green-700 hover:bg-green-800 text-white font-medium px-3.5 py-1 rounded-full text-xs shadow-sm transition-colors"
              >
                หน้าระบบ &rarr;
              </Link>
              <button
                onClick={() => {
                  Auth.logout();
                  setSession(null);
                }}
                className="text-gray-500 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-full text-xs transition-colors"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>

          <div className="mb-8">
            <div className="relative inline-block">
              <h1 className="font-extrabold text-4xl sm:text-5xl md:text-6xl text-[#0b6330] tracking-wider">
                SUPPLIER PORTAL
              </h1>
              <svg
                className={`${styles.sparks} absolute -top-3 -right-6 sm:-right-8 w-7 h-7 sm:w-8 sm:h-8 text-[#0b6330]`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.8}
                strokeLinecap="round"
              >
                <line x1="8" y1="18" x2="3" y2="23" />
                <line x1="16" y1="14" x2="19" y2="9" />
                <line x1="22" y1="20" x2="16" y2="18" />
              </svg>
            </div>
            <p className="text-gray-600 text-base md:text-lg mt-2 font-medium">
              ระบบรับข้อมูลทรัพย์สินและเครื่องจักรจาก Supplier
            </p>
            <div className="w-14 h-1.5 bg-[#0b6330] rounded-full mx-auto mt-3" />
          </div>

          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto my-4">
            {roleCards.map(({ role, img, label }) => (
              <Link
                key={role}
                href={`/login?role=${role}`}
                onClick={() => selectRole(role)}
                className="group bg-white rounded-3xl p-7 border border-gray-100 shadow-[0_10px_25px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_35px_rgba(11,99,48,0.12)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center justify-between text-center cursor-pointer no-underline"
              >
                <div className="flex flex-col items-center">
                  <div className="w-28 h-28 mb-3 flex items-center justify-center">
                    <Image src={img} alt={label} width={112} height={112} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <h2 className="font-bold text-xl text-gray-900 group-hover:text-[#0b6330] transition-colors">
                    {label}
                  </h2>
                </div>
                <div className="mt-6 w-full sm:w-auto px-7 py-2.5 rounded-full bg-[#eaf6ec] group-hover:bg-[#0b6330] text-[#0b6330] group-hover:text-white font-semibold text-sm transition-all duration-200 border border-[#c5e6cb] shadow-sm inline-flex items-center justify-center gap-1.5">
                  <span>เข้าสู่ระบบ {label}</span>
                  <span className="text-base leading-none">&rarr;</span>
                </div>
              </Link>
            ))}
          </div>

          <p className="text-center text-xs md:text-sm text-gray-600 mt-6 relative z-10">
            Supplier รายใหม่?{" "}
            <Link href="/register" className="text-[#0b6330] font-bold hover:underline ml-1">
              ลงทะเบียนที่นี่
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
