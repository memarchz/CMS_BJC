import { CATS, CATN } from "./catalog";

/**
 * Nameplate OCR: the shape Gemini is asked to return, and the mapping from that
 * shape onto the form's field keys.
 *
 * Scope rule (agreed with the user): the model reports only what is physically
 * printed on the nameplate, plus a Category/Sub-Category classification. It never
 * invents warranty terms, maintenance budgets, PO numbers or TCO figures — those
 * stay empty for a human to fill in.
 */

/** Raw result from the model, before validation. Every reading may be absent. */
export type OcrReading = {
  isNameplate?: boolean | null;
  docType?: string | null;
  brand?: string | null;
  series?: string | null;
  model?: string | null;
  serial?: string | null;
  origin?: string | null;
  mfgDate?: string | null;
  capacity?: string | null;
  power?: string | null;
  utility?: string | null;
  dimWeight?: string | null;
  operatingCondition?: string | null;
  standards?: string | null;
  functional?: string | null;
  usefulLife?: string | null;
  designLife?: string | null;
  assetName?: string | null;
  category?: string | null;
  subCat?: string | null;
  confidence?: string | null;
  note?: string | null;
};

export type OcrResult = {
  /** Form field keys → values, ready to hand to the form. */
  fields: Record<string, string>;
  /** "high" | "medium" | "low" — how legible the plate or spec sheet was. */
  confidence: string;
  /** Short Thai note from the model, e.g. why a reading is missing. */
  note: string;
  /** False when the image does not show an equipment nameplate or spec sheet at all. */
  isNameplate: boolean;
  /** "nameplate" | "spec_sheet" when detectable. */
  docType?: string;
};

/**
 * One reading can land in more than one form field: the wizard asks for
 * brand/model/serial twice, once on the registration step and once on the
 * specification step.
 */
const READING_TO_FIELDS: Record<string, string[]> = {
  assetName: ["assetName"],
  brand: ["brand", "mfr"],
  series: ["series"],
  model: ["model", "model2"],
  serial: ["serial", "serial2"],
  origin: ["origin"],
  mfgDate: ["mfgDate"],
  capacity: ["cap"],
  power: ["power"],
  utility: ["util"],
  dimWeight: ["dim"],
  operatingCondition: ["opc"],
  standards: ["std"],
  functional: ["func"],
  usefulLife: ["life"],
  designLife: ["design"],
};

export const OCR_PROMPT = `คุณคือผู้ช่วยอ่านป้าย Nameplate และเอกสาร Product Specifications Sheet (Datasheet / Spec Sheet / แคตตาล็อกสเปก) ของเครื่องจักรและอุปกรณ์ สำหรับระบบทะเบียนทรัพย์สิน

อ่านรูปที่ให้มา และตอบเป็น JSON ตาม schema ที่กำหนด โดยยึดกฎต่อไปนี้อย่างเคร่งครัด

1. กรอกเฉพาะข้อมูลที่ "มองเห็นจริง" บนป้าย Nameplate หรือในเอกสาร Product Specifications Sheet ในรูป
2. ช่องใดที่อ่านไม่ได้ หรือไม่ปรากฏในรูป ให้ใส่ null ห้ามเดา ห้ามเติมจากความรู้ทั่วไปเรื่องรุ่นนั้น
3. คัดลอกตัวเลขและรหัสรุ่นตามที่เห็นทุกตัวอักษร ห้ามแก้ไขรูปแบบ
4. category ต้องเลือกจากรายการที่กำหนดเท่านั้น โดยดูจากชนิดของอุปกรณ์ในรูป ข้อนี้อนุญาตให้ใช้วิจารณญาณได้
5. subCat ใส่ได้เฉพาะเมื่อ category ที่เลือกมีรายการย่อย และต้องตรงกับรายการย่อยนั้น ถ้าไม่มีให้ใส่ null
6. assetName ตั้งชื่อทรัพย์สินสั้นๆ เป็นภาษาไทย จากชนิดอุปกรณ์ + แบรนด์ + รุ่น ที่อ่านได้
7. ถ้ารูปไม่ใช่ป้าย Nameplate และไม่ใช่เอกสาร Product Specifications Sheet หรือไม่ใช่อุปกรณ์ ให้ตั้ง isNameplate เป็น false และอธิบายใน note
8. docType ระบุว่าเป็น "nameplate" หรือ "spec_sheet"
9. note เขียนสั้นๆ เป็นภาษาไทย บอกว่าอ่านอะไรไม่ได้ หรือรูปมีปัญหาอะไร

ห้ามกรอกข้อมูลเชิงพาณิชย์ทุกชนิด เช่น เงื่อนไขการรับประกัน ราคา งบซ่อมบำรุง เลข PO หรือสัญญา เพราะข้อมูลเหล่านี้ไม่มีอยู่บนป้าย Nameplate หรือ Spec Sheet`;

/** JSON schema handed to Gemini via `response_format`. */
export function buildOcrSchema(): Record<string, unknown> {
  const str = { type: "string", nullable: true };
  return {
    type: "object",
    properties: {
      isNameplate: { type: "boolean" },
      docType: { type: "string", nullable: true },
      assetName: str,
      category: { type: "string", nullable: true, enum: CATN },
      subCat: str,
      brand: str,
      series: str,
      model: str,
      serial: str,
      origin: str,
      mfgDate: str,
      capacity: str,
      power: str,
      utility: str,
      dimWeight: str,
      operatingCondition: str,
      standards: str,
      functional: str,
      usefulLife: str,
      designLife: str,
      confidence: { type: "string", enum: ["high", "medium", "low"] },
      note: str,
    },
    required: ["isNameplate", "confidence"],
  };
}

function clean(value: unknown): string {
  if (typeof value === "number") return String(value);
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  // The model sometimes writes a literal "null"/"N/A" instead of a JSON null.
  if (/^(null|n\/a|na|-|unknown|ไม่ระบุ|ไม่ทราบ)$/i.test(trimmed)) return "";
  return trimmed;
}

/**
 * Turns a raw model reading into form field values.
 *
 * Category and Sub-Category are validated against the real taxonomy: an
 * unrecognised category is dropped rather than written through, because the form's
 * select would reject it and the buyer permission check keys off it.
 */
export function mapReadingToFields(reading: OcrReading): Record<string, string> {
  const fields: Record<string, string> = {};

  for (const [key, targets] of Object.entries(READING_TO_FIELDS)) {
    const value = clean(reading[key as keyof OcrReading]);
    if (!value) continue;
    for (const target of targets) fields[target] = value;
  }

  const category = clean(reading.category);
  if (category && Object.prototype.hasOwnProperty.call(CATS, category)) {
    fields.category = category;
    const subs = CATS[category];
    const subCat = clean(reading.subCat);
    if (subs.length > 0 && subs.includes(subCat)) fields.subCat = subCat;
  }

  return fields;
}

const CONFIDENCE_VALUES = ["high", "medium", "low"];

/** Parses the model's JSON text. Throws when the payload is not usable. */
export function parseOcrResponse(text: string): OcrResult {
  let reading: OcrReading;
  try {
    reading = JSON.parse(text) as OcrReading;
  } catch {
    throw new Error("ไม่สามารถอ่านผลลัพธ์จาก AI ได้ กรุณาลองใหม่");
  }
  if (reading === null || typeof reading !== "object" || Array.isArray(reading)) {
    throw new Error("ไม่สามารถอ่านผลลัพธ์จาก AI ได้ กรุณาลองใหม่");
  }

  const confidence = clean(reading.confidence).toLowerCase();
  return {
    fields: mapReadingToFields(reading),
    confidence: CONFIDENCE_VALUES.includes(confidence) ? confidence : "low",
    note: clean(reading.note),
    // Only an explicit false means "not a nameplate"; a missing flag is treated as
    // a plate so a stingy response still yields whatever fields were read.
    isNameplate: reading.isNameplate !== false,
    docType: clean(reading.docType) || (reading.isNameplate !== false ? "nameplate" : ""),
  };
}

/** Gemini's interactions endpoint. The key goes in the `x-goog-api-key` header. */
export const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions";

type InteractionStep = {
  type?: string;
  content?: Array<{ type?: string; text?: string }>;
};

/**
 * Pulls the model's text out of an interactions response.
 *
 * The REST payload has no `output_text` — that is an SDK convenience. The text
 * lives in the `model_output` step, alongside `thought` steps that must be skipped.
 */
export function extractOutputText(payload: unknown): string {
  const steps = (payload as { steps?: InteractionStep[] })?.steps;
  if (!Array.isArray(steps)) return "";
  return steps
    .filter((step) => step?.type === "model_output")
    .flatMap((step) => (Array.isArray(step.content) ? step.content : []))
    .filter((part) => part?.type === "text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("")
    .trim();
}

/** Splits a data URL into the base64 payload and MIME type the API expects. */
export function parseImageDataUrl(dataUrl: string): { data: string; mimeType: string } {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/.exec(dataUrl);
  if (!match) throw new Error("รูปภาพไม่ถูกต้อง รองรับเฉพาะไฟล์รูปภาพ");
  return { mimeType: match[1], data: match[2] };
}
