import { J } from "./safeStorage";

export type SeedUser = {
  role: string;
  email: string;
  pw: string;
  company: string;
  code?: string;
  status?: string;
  updatedAtStr?: string;
};

export type Session = { role: string; email: string; name: string; code: string };

export const SEED: SeedUser[] = [
  { role: "supplier", email: "supplier@demo.co.th", pw: "demo1234", company: "บริษัท ตัวอย่างซัพพลาย จำกัด", code: "SUP-00001" },
  { role: "buyer", email: "buyer@demo.co.th", pw: "demo1234", company: "ฝ่ายจัดซื้อ 1 (ระบบทำความเย็น & HVAC)", status: "ใช้งานอยู่", updatedAtStr: "12 มิ.ย. 2568 14:32" },
  { role: "buyer", email: "buyer1@demo.co.th", pw: "demo1234", company: "บริษัท ตัวอย่าง จำกัด", status: "ใช้งานอยู่", updatedAtStr: "12 มิ.ย. 2568 14:32" },
  { role: "buyer", email: "buyer2@demo.co.th", pw: "demo1234", company: "บริษัท เอ็มเอส จำกัด", status: "รออนุมัติ", updatedAtStr: "10 มิ.ย. 2568 09:15" },
  { role: "buyer", email: "buyer3@demo.co.th", pw: "demo1234", company: "ห้างหุ้นส่วนจำกัด เคพี", status: "ใช้งานอยู่", updatedAtStr: "8 มิ.ย. 2568 16:20" },
  { role: "buyer", email: "buyer4@demo.co.th", pw: "demo1234", company: "บริษัท ซัพพลาย จำกัด", status: "ใช้งานอยู่", updatedAtStr: "6 มิ.ย. 2568 11:47" },
  { role: "admin", email: "admin@demo.co.th", pw: "demo1234", company: "ผู้ดูแลระบบ (Admin ตัวอย่าง)" },
];

const SESSION_KEY = "portal_session";
const USERS_KEY = "portal_users";

export const Auth = {
  users(): SeedUser[] {
    return SEED.concat(J.get<SeedUser[]>(USERS_KEY, []));
  },
  session(): Session | null {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY) as string);
    } catch {
      return null;
    }
  },
  login(role: string, email: string, pw: string): Session | null {
    const cleanMail = (email || "").trim().toLowerCase();
    let u = Auth.users().find(
      (x) => x.role === role && x.email.toLowerCase() === cleanMail && x.pw === pw
    );
    let effectiveRole = role;
    if (!u) {
      u = Auth.users().find((x) => x.email.toLowerCase() === cleanMail && x.pw === pw);
      if (u) effectiveRole = u.role;
    }
    if (!u) return null;
    const s: Session = { role: effectiveRole, email: u.email, name: u.company || u.email, code: u.code || "" };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
    return s;
  },
  register(d: { company: string; taxId: string; contact: string; phone: string; email: string; pw: string }) {
    if (Auth.users().some((x) => x.email.toLowerCase() === d.email.toLowerCase())) {
      return { error: "อีเมลนี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบ" };
    }
    const us = J.get<SeedUser[]>(USERS_KEY, []);
    us.push({ role: "supplier", code: "SUP-" + String(us.length + 2).padStart(5, "0"), ...d });
    J.set(USERS_KEY, us);
    return { ok: Auth.login("supplier", d.email, d.pw) };
  },
  home(r: string): string {
    return r === "supplier" ? "/form" : r === "admin" ? "/admin" : "/submissions";
  },
  logout(): void {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem("selected_role");
    localStorage.removeItem("selected_role");
  },
};
