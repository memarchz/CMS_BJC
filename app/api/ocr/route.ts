import {
  GEMINI_ENDPOINT,
  OCR_PROMPT,
  buildOcrSchema,
  extractOutputText,
  parseImageDataUrl,
  parseOcrResponse,
} from "../../../lib/ocr";

/**
 * Nameplate OCR endpoint.
 *
 * This runs server-side for one reason: the Gemini API key must never reach the
 * browser. Do not move this call into a client component and do not expose the key
 * as `NEXT_PUBLIC_*`.
 *
 * We call the REST API with `fetch` and a string body rather than using
 * `@google/genai`. The SDK sends a `Request` whose body is a stream and retries it
 * on a 429; the retry fails with `TypeError: unusable` and buries the real status,
 * so a quota error looked like a generic connection failure. A string body is
 * re-readable, and the caller now sees Google's own message, including how long to
 * wait.
 */

/** Rejected before we spend a request; the API's own inline-data ceiling is 20MB. */
const MAX_IMAGE_CHARS = 8_000_000;

/**
 * Flash-Lite read the test nameplate as accurately as the larger Flash models and
 * has a far more generous free-tier quota: gemini-3.8-flash allows only 20 requests
 * per day, which a single demo session exhausts. Override with GEMINI_MODEL.
 */
const DEFAULT_MODEL = "gemini-3.5-flash-lite";

const TIMEOUT_MS = 90_000;

function fail(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

/** Google replies `{ error: { message } }`; that text names the real problem. */
function googleErrorMessage(payload: unknown): string {
  const message = (payload as { error?: { message?: unknown } })?.error?.message;
  return typeof message === "string" ? message : "";
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return fail("ยังไม่ได้ตั้งค่า GEMINI_API_KEY ใน .env.local (ดู .env.example)", 500);
  }

  let imageDataUrl: unknown;
  try {
    const body = (await request.json()) as { imageDataUrl?: unknown };
    imageDataUrl = body.imageDataUrl;
  } catch {
    return fail("คำขอไม่ถูกต้อง", 400);
  }

  if (typeof imageDataUrl !== "string" || !imageDataUrl) {
    return fail("ไม่พบรูปภาพในคำขอ", 400);
  }
  if (imageDataUrl.length > MAX_IMAGE_CHARS) {
    return fail("รูปภาพใหญ่เกินไป กรุณาใช้รูปที่เล็กกว่านี้", 413);
  }

  let image: { data: string; mimeType: string };
  try {
    image = parseImageDataUrl(imageDataUrl);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "รูปภาพไม่ถูกต้อง", 400);
  }

  let res: Response;
  try {
    res = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
        input: [
          { type: "text", text: OCR_PROMPT },
          { type: "image", data: image.data, mime_type: image.mimeType },
        ],
        response_format: {
          type: "text",
          mime_type: "application/json",
          schema: buildOcrSchema(),
        },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (err) {
    console.error("OCR request could not reach Gemini:", err);
    if (err instanceof Error && err.name === "TimeoutError") {
      return fail("AI ใช้เวลานานเกินไป กรุณาลองใหม่", 504);
    }
    return fail("เชื่อมต่อบริการ AI ไม่ได้ กรุณาลองใหม่", 502);
  }

  const payload: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const detail = googleErrorMessage(payload);
    console.error(`OCR rejected by Gemini (${res.status}):`, detail);
    if (res.status === 429) {
      // Google's text says which model ran out and when it resets — worth showing.
      return fail(`ใช้โควตา Gemini ครบแล้ว: ${detail || "กรุณารอสักครู่แล้วลองใหม่"}`, 429);
    }
    if (res.status === 401 || res.status === 403) {
      return fail("GEMINI_API_KEY ไม่ถูกต้องหรือไม่มีสิทธิ์เรียกใช้โมเดลนี้", 502);
    }
    if (res.status === 400) {
      return fail(`คำขอไม่ถูกต้อง: ${detail || "ตรวจสอบชื่อโมเดลใน GEMINI_MODEL"}`, 502);
    }
    return fail("เรียกใช้ AI ไม่สำเร็จ กรุณาลองใหม่", 502);
  }

  const text = extractOutputText(payload);
  if (!text) {
    console.error("OCR call succeeded but returned no text");
    return fail("AI ไม่ได้ส่งผลลัพธ์กลับมา กรุณาลองใหม่", 502);
  }

  try {
    return Response.json(parseOcrResponse(text));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "อ่านผลลัพธ์ไม่สำเร็จ", 502);
  }
}
