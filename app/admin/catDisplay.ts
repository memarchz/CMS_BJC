import { ICON } from "./SvgIcon";

export type CatDisplay = {
  /** Tailwind classes of the <svg> icon. */
  iconClass: string;
  iconPaths: readonly string[];
  desc: string;
  mockupCount: number;
  max: number;
};

const FLASK =
  "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z";

/* Copied verbatim from CAT_DISPLAY_CONFIG in js/admin.js:7-78 */
export const CAT_DISPLAY_CONFIG: Record<string, CatDisplay> = {
  "Refrigeration system": {
    iconClass: "w-4 h-4 text-sky-500",
    iconPaths: ["M12 3v18m0-9l4-4m-4 4l-4-4m4 4l4 4m-4-4l-4 4M4.5 7.5l15 9m-15 0l15-9"],
    desc: "Condensing unit, CDU, Evaporator coil, Rack compressor",
    mockupCount: 6,
    max: 6,
  },
  Chiller: {
    iconClass: "w-4 h-4 text-sky-600",
    iconPaths: [FLASK],
    desc: "Water-cooled, Air-cooled Chiller, Chilled water pump",
    mockupCount: 5,
    max: 6,
  },
  "Cooling tower": {
    iconClass: "w-4 h-4 text-cyan-600",
    iconPaths: ["M19 14l-7 7m0 0l-7-7m7 7V3"],
    desc: "หอหล่อเย็น Cooling tower, Water distribution, Infill pack",
    mockupCount: 3,
    max: 6,
  },
  "Air condition / AHU": {
    iconClass: "w-4 h-4 text-teal-600",
    iconPaths: [
      "M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21a9 9 0 110-18 9 9 0 010 18z",
    ],
    desc: "ระบบปรับอากาศ AHU, Package Unit, VRV/VRF, Duct",
    mockupCount: 3,
    max: 6,
  },
  "Safety Equipment": {
    iconClass: "w-4 h-4 text-teal-600",
    iconPaths: [ICON.shield],
    desc: "CCTV, EAS, Fire protection, Fire pump, Gas & Smoke detector",
    mockupCount: 4,
    max: 6,
  },
  "Logistic Equipment": {
    iconClass: "w-4 h-4 text-emerald-600",
    iconPaths: [
      "M8 17a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4zm-8-3h8m-9 0V4H3m6 10l-2 3h12l-2-3m-8-7h6l2 4H7l2-4z",
    ],
    desc: "Overhead door, Dock leveler, Dock shelter, Conveyor",
    mockupCount: 4,
    max: 6,
  },
  "Electrical system": {
    iconClass: "w-4 h-4 text-amber-500",
    iconPaths: ["M13 10V3L4 14h7v7l9-11h-7z"],
    desc: "หม้อแปลง Transformer, Generator, Lighting, Cap bank, SVG",
    mockupCount: 3,
    max: 6,
  },
  "Waste water System": {
    iconClass: "w-4 h-4 text-blue-600",
    iconPaths: [FLASK],
    desc: "ระบบบำบัดน้ำเสีย Submerge pump, บ่อดักไขมัน, ปั๊มน้ำทิ้ง",
    mockupCount: 2,
    max: 6,
  },
  "Super Equipment": {
    iconClass: "w-4 h-4 text-indigo-600",
    iconPaths: [ICON.cogOuter, ICON.cogInner],
    desc: "Bakery, Delica, Butchery, Sea food & Produce Equipment",
    mockupCount: 4,
    max: 6,
  },
  "General Homeuse Equipment": {
    iconClass: "w-4 h-4 text-violet-600",
    iconPaths: [ICON.home],
    desc: "เครื่องใช้ไฟฟ้าทั่วไป ตู้เย็น ไมโครเวฟ เครื่องทำน้ำอุ่น",
    mockupCount: 2,
    max: 6,
  },
  "LED signage": {
    iconClass: "w-4 h-4 text-yellow-600",
    iconPaths: [
      "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
    ],
    desc: "ป้ายไฟ LED, Digital Signage, ป้ายราคาสินค้าดิจิทัล",
    mockupCount: 2,
    max: 6,
  },
  "Shopping Trolley": {
    iconClass: "w-4 h-4 text-rose-500",
    iconPaths: [
      "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
    ],
    desc: "รถเข็นช้อปปิ้ง ตะกร้าช้อปปิ้ง ล้ออะไหล่และอุปกรณ์เสริม",
    mockupCount: 3,
    max: 6,
  },
  "Small Equipment": {
    iconClass: "w-4 h-4 text-orange-500",
    iconPaths: [ICON.sliders],
    desc: "ภาชนะเครื่องครัว จาน ชาม ช้อนส้อม อุปกรณ์เบ็ดเตล็ด",
    mockupCount: 2,
    max: 6,
  },
  "Fork lift": {
    iconClass: "w-4 h-4 text-stone-600",
    iconPaths: [
      "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
    ],
    desc: "รถโฟล์คลิฟท์ไฟฟ้า Reach truck, Pallet jack, แบตเตอรี่",
    mockupCount: 2,
    max: 6,
  },
};
