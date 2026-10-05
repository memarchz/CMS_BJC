import { J } from "./safeStorage";

export type Supplier = {
  code: string;
  company: string;
  taxId: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  categories: string[];
  status: string;
  registeredAt: number;
};

type RegisteredUser = {
  role: string;
  email: string;
  code?: string;
  company?: string;
  name?: string;
  taxId?: string;
  contact?: string;
  phone?: string;
  address?: string;
  categories?: string[];
  status?: string;
  registeredAt?: number;
};

export const DEFAULT_SUPPLIERS: Supplier[] = [
  {
    code: 'SUP-00001',
    company: 'บริษัท ตัวอย่างซัพพลาย จำกัด',
    taxId: '0105558012345',
    contact: 'คุณสมศักดิ์ มั่นคง (ผู้จัดการฝ่ายขาย)',
    phone: '02-123-4567',
    email: 'supplier@demo.co.th',
    address: '88/12 อาคารเอ็กซิม ถนนพหลโยธิน แขวงพญาไท เขตพญาไท กรุงเทพฯ 10400',
    categories: ['Refrigeration system', 'Chiller', 'Safety Equipment', 'Electrical system'],
    status: 'อนุมัติแล้ว',
    registeredAt: Date.now() - 180 * 86400 * 1000
  },
  {
    code: 'SUP-00088',
    company: 'บริษัท เทรน (ประเทศไทย) จำกัด',
    taxId: '0105524098765',
    contact: 'คุณวิภาดา อริยะพร (วิศวกรบริการลูกค้า)',
    phone: '02-704-9999',
    email: 'trane.th@supplier.co.th',
    address: '112/5 ถนนร่มเกล้า แขวงคลองสามประเวศ เขตลาดกระบัง กรุงเทพฯ 10520',
    categories: ['Chiller', 'Cooling tower', 'Air condition / AHU'],
    status: 'อนุมัติแล้ว',
    registeredAt: Date.now() - 240 * 86400 * 1000
  },
  {
    code: 'SUP-00123',
    company: 'บริษัท สยามไดกิ้นเซลส์ จำกัด',
    taxId: '0105515033441',
    contact: 'คุณธีรเดช พัฒนศิลป์ (ฝ่ายบริการหลังการขาย)',
    phone: '02-715-3000',
    email: 'daikin.th@supplier.co.th',
    address: '22 ซอยอ่อนนุช 55/1 แขวงประเวศ เขตประเวศ กรุงเทพฯ 10250',
    categories: ['Refrigeration system', 'Air condition / AHU'],
    status: 'อนุมัติแล้ว',
    registeredAt: Date.now() - 300 * 86400 * 1000
  },
  {
    code: 'SUP-00155',
    company: 'บริษัท ครอว์ฟอร์ด ลอจิสติกส์ จำกัด',
    taxId: '0105549077123',
    contact: 'คุณประสิทธิ์ อุดมชัย (ฝ่ายขายอุปกรณ์คลังสินค้า)',
    phone: '02-333-2222',
    email: 'crawford.logistics@supplier.co.th',
    address: '99 หมู่ 3 ตำบลบางเสาธง อำเภอบางเสาธง สมุทรปราการ 10570',
    categories: ['Logistic Equipment', 'Fork lift'],
    status: 'รอตรวจสอบ',
    registeredAt: Date.now() - 150 * 86400 * 1000
  },
  {
    code: 'SUP-00210',
    company: 'บริษัท ชไนเดอร์ อิเล็คทริค (ไทยแลนด์) จำกัด',
    taxId: '0105521045678',
    contact: 'คุณกิตติศักดิ์ เลิศวณิชย์ (วิศวกรฝ่ายระบบไฟฟ้ากำลัง)',
    phone: '02-617-5555',
    email: 'schneider.th@supplier.co.th',
    address: '44 อาคารอับดุลราฮิม เพลส ชั้น 13 ถนนพระราม 4 แขวงสีลม เขตบางรัก กรุงเทพฯ 10500',
    categories: ['Electrical system'],
    status: 'อนุมัติแล้ว',
    registeredAt: Date.now() - 210 * 86400 * 1000
  },
  {
    code: 'SUP-00305',
    company: 'บริษัท ฮิควิชั่น ดิจิตอล เทคโนโลยี (ประเทศไทย) จำกัด',
    taxId: '0105562019874',
    contact: 'คุณจิราภรณ์ วงศ์สวัสดิ์ (ฝ่ายโครงการและพันธมิตรคู่ค้า)',
    phone: '02-999-8888',
    email: 'hikvision.th@supplier.co.th',
    address: '555 อาคารรสา ทาวเวอร์ 2 ชั้น 18 ถนนพหลโยธิน แขวงจตุจักร เขตจตุจักร กรุงเทพฯ 10900',
    categories: ['Safety Equipment'],
    status: 'อนุมัติแล้ว',
    registeredAt: Date.now() - 120 * 86400 * 1000
  }
];

const KEY = "portal_suppliers";

export const Suppliers = {
  key: KEY,
  all(): Supplier[] {
    let list = J.get<Supplier[] | null>(KEY, null);
    if (!list || !Array.isArray(list)) {
      list = [...DEFAULT_SUPPLIERS];
      J.set(KEY, list);
    }
    const regUsers = J.get<RegisteredUser[]>("portal_users", []).filter(
      (u) => u.role === "supplier"
    );
    regUsers.forEach((u) => {
      if (!list!.some((s) => s.email.toLowerCase() === u.email.toLowerCase())) {
        list!.push({
          code: u.code || "SUP-" + String(list!.length + 1).padStart(5, "0"),
          company: u.company || u.name || u.email,
          taxId: u.taxId || "-",
          contact: u.contact || "-",
          phone: u.phone || "-",
          email: u.email,
          address: u.address || "-",
          categories: u.categories || [],
          status: u.status || "อนุมัติแล้ว",
          registeredAt: u.registeredAt || Date.now(),
        });
      }
    });
    return list;
  },
  get(term: string): Supplier | null {
    const q = String(term || "").toLowerCase().trim();
    if (!q) return null;
    return (
      Suppliers.all().find(
        (s) =>
          s.email.toLowerCase() === q ||
          s.code.toLowerCase() === q ||
          s.company.toLowerCase().includes(q)
      ) || null
    );
  },
  save(sup: Partial<Supplier> & { email: string }): void {
    const list = Suppliers.all();
    const idx = list.findIndex((s) => s.email.toLowerCase() === sup.email.toLowerCase());
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...sup };
    } else {
      const code = sup.code || "SUP-" + String(list.length + 1).padStart(5, "0");
      list.push({ ...(sup as Supplier), code });
    }
    J.set(KEY, list);
  },
  delete(email: string): void {
    const list = Suppliers.all().filter((s) => s.email.toLowerCase() !== email.toLowerCase());
    J.set(KEY, list);
  },
};
