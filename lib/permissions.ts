import { J } from "./safeStorage";
import { Auth } from "./auth";

export const DEFAULT_BUYER_PERMS: Record<string, string[]> = {
  "buyer@demo.co.th": ["Chiller", "Refrigeration system", "Air condition / AHU", "Cooling tower"],
  "buyer1@demo.co.th": ["Refrigeration system", "Chiller", "Electrical system"],
  "buyer2@demo.co.th": ["Safety Equipment", "Logistic Equipment"],
  "buyer3@demo.co.th": ["Chiller", "Super Equipment"],
  "buyer4@demo.co.th": ["Refrigeration system", "Electrical system", "Logistic Equipment"],
  "admin@demo.co.th": [
    "Chiller", "Cooling tower", "Air condition / AHU", "Refrigeration system",
    "Electrical system", "Safety Equipment", "Logistic Equipment", "Super Equipment",
    "Waste water System", "General Homeuse Equipment", "LED signage", "Shopping Trolley",
    "Small Equipment", "Fork lift"
  ],
  "supplier@demo.co.th": ["Chiller", "Refrigeration system", "Air condition / AHU", "Cooling tower"],
};

const KEY = "buyer_category_permissions";

export type PermRole = "admin" | "user" | "buyer" | "supplier";

export type PermUser = {
  email: string;
  name: string;
  role: PermRole;
  status: string;
  updatedAtStr: string;
  categories: string[];
};

export const Permissions = {
  key: KEY,
  getAll(): Record<string, string[]> {
    let custom = J.get<Record<string, string[]> | null>(KEY, null);
    if (!custom || typeof custom !== "object" || Array.isArray(custom)) {
      custom = { ...DEFAULT_BUYER_PERMS };
      J.set(KEY, custom);
    }
    return custom;
  },
  get(email: string): string[] {
    if (!email) return [];
    const all = Permissions.getAll();
    const mail = String(email).trim().toLowerCase();
    const foundKey = Object.keys(all).find((k) => k.toLowerCase() === mail);
    if (foundKey && Array.isArray(all[foundKey])) return all[foundKey];
    const defKey = Object.keys(DEFAULT_BUYER_PERMS).find((k) => k.toLowerCase() === mail);
    if (defKey) return DEFAULT_BUYER_PERMS[defKey];
    return [];
  },
  set(email: string, categories: string[]): string[] {
    if (!email) return [];
    const all = Permissions.getAll();
    const mail = String(email).trim().toLowerCase();
    all[mail] = Array.isArray(categories) ? categories : [];
    J.set(KEY, all);
    return all[mail];
  },
  delete(email: string): void {
    if (!email) return;
    const all = Permissions.getAll();
    delete all[String(email).trim().toLowerCase()];
    J.set(KEY, all);
  },
  canView(email: string, category: string | undefined, role: string): boolean {
    if (role === "admin" || role === "supplier") return true;
    if (!category) return false;
    const allowed = Permissions.get(email);
    if (!Array.isArray(allowed) || allowed.length === 0) return false;
    const catClean = String(category).trim().toLowerCase();
    return allowed.some((a) => String(a).trim().toLowerCase() === catClean);
  },
  getUsers(roleFilter?: string): PermUser[] {
    const users = Auth.users();
    const allPerms = Permissions.getAll();
    const map = new Map<string, PermUser>();

    users.forEach((u) => {
      const lower = u.email.toLowerCase();
      const userRole = (u.role === "supplier" ? "user" : u.role) as PermRole;
      map.set(lower, {
        email: u.email,
        name: u.company || u.email,
        role: userRole,
        status: u.status || "ใช้งานอยู่",
        updatedAtStr: u.updatedAtStr || "12 มิ.ย. 2568 14:32",
        categories: Permissions.get(u.email),
      });
    });

    Object.keys(allPerms).forEach((k) => {
      const lower = k.toLowerCase();
      if (!map.has(lower)) {
        let inferredRole: PermRole = "buyer";
        if (lower.includes("admin")) inferredRole = "admin";
        else if (lower.includes("user") || lower.includes("supplier")) inferredRole = "user";
        map.set(lower, {
          email: k,
          name: (inferredRole === "admin" ? "Admin" : inferredRole === "user" ? "User" : "Buyer") + " (" + k.split("@")[0] + ")",
          role: inferredRole,
          status: "ใช้งานอยู่",
          updatedAtStr: "12 มิ.ย. 2568 14:32",
          categories: Permissions.get(k),
        });
      }
    });

    const allList = Array.from(map.values());
    if (roleFilter && roleFilter !== "all") {
      const rf = roleFilter.toLowerCase();
      return allList.filter((u) => {
        if (rf === "user") return u.role === "user" || u.role === "supplier";
        return u.role.toLowerCase() === rf;
      });
    }
    return allList;
  },
  getBuyers(): PermUser[] {
    return Permissions.getUsers("buyer");
  },
};
