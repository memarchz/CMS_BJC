/**
 * @jest-environment node
 */
import { POST } from "../route";

const JPEG = "data:image/jpeg;base64,AAAA";

function post(body: unknown) {
  return new Request("http://localhost/api/ocr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Shapes a Gemini interactions reply: the text sits in a `model_output` step. */
function geminiReply(modelJson: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      status: "completed",
      steps: [
        { type: "thought", signature: "abc" },
        { type: "model_output", content: [{ type: "text", text: JSON.stringify(modelJson) }] },
      ],
    }),
  };
}

function geminiError(status: number, message: string) {
  return { ok: false, status, json: async () => ({ error: { message } }) };
}

function mockFetch(value: unknown) {
  global.fetch = jest.fn().mockResolvedValue(value) as unknown as typeof fetch;
}

describe("POST /api/ocr", () => {
  const originalKey = process.env.GEMINI_API_KEY;
  const originalModel = process.env.GEMINI_MODEL;
  const realFetch = global.fetch;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-key";
    delete process.env.GEMINI_MODEL;
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    global.fetch = realFetch;
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
    if (originalModel === undefined) delete process.env.GEMINI_MODEL;
    else process.env.GEMINI_MODEL = originalModel;
  });

  it("returns the mapped fields for a legible nameplate", async () => {
    mockFetch(
      geminiReply({
        isNameplate: true,
        brand: "Daikin",
        model: "FTV50QV1V",
        category: "Refrigeration system",
        confidence: "high",
      }),
    );

    const res = await POST(post({ imageDataUrl: JPEG }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.fields.brand).toBe("Daikin");
    expect(body.fields.mfr).toBe("Daikin");
    expect(body.fields.category).toBe("Refrigeration system");
    expect(body.confidence).toBe("high");
    expect(body.isNameplate).toBe(true);
  });

  it("posts the key in a header and the image plus schema as a string body", async () => {
    mockFetch(geminiReply({ isNameplate: true, brand: "X" }));
    await POST(post({ imageDataUrl: JPEG }));

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain("generativelanguage.googleapis.com");
    expect((init.headers as Record<string, string>)["x-goog-api-key"]).toBe("test-key");
    // A string body is re-readable, which is what makes a retry safe.
    expect(typeof init.body).toBe("string");

    const sent = JSON.parse(init.body as string);
    expect(sent.model).toBe("gemini-3.5-flash-lite");
    expect(sent.input).toEqual([
      { type: "text", text: expect.stringContaining("Nameplate") },
      { type: "image", data: "AAAA", mime_type: "image/jpeg" },
    ]);
    expect(sent.response_format.mime_type).toBe("application/json");
    expect(sent.response_format.schema.properties.category.enum).toContain("Chiller");
  });

  it("honours GEMINI_MODEL when set", async () => {
    process.env.GEMINI_MODEL = "gemini-3.8-flash";
    mockFetch(geminiReply({ isNameplate: true, brand: "X" }));
    await POST(post({ imageDataUrl: JPEG }));

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(JSON.parse(init.body as string).model).toBe("gemini-3.8-flash");
  });

  it("fails clearly when the API key is missing, without calling Gemini", async () => {
    delete process.env.GEMINI_API_KEY;
    mockFetch(geminiReply({ isNameplate: true }));
    const res = await POST(post({ imageDataUrl: JPEG }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/GEMINI_API_KEY/);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("rejects a missing or non-image payload before calling Gemini", async () => {
    mockFetch(geminiReply({ isNameplate: true }));
    expect((await POST(post({}))).status).toBe(400);
    expect((await POST(post({ imageDataUrl: "data:text/plain;base64,AAAA" }))).status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("rejects an oversized image", async () => {
    mockFetch(geminiReply({ isNameplate: true }));
    const huge = "data:image/jpeg;base64," + "A".repeat(8_000_001);
    expect((await POST(post({ imageDataUrl: huge }))).status).toBe(413);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("passes Google's quota message through on a 429 so the wait time is visible", async () => {
    mockFetch(
      geminiError(429, "Rate limit exceeded for model gemini-3.8-flash (limit: 20 requests per day on Free Tier). Please retry in 1h48m."),
    );
    const res = await POST(post({ imageDataUrl: JPEG }));
    expect(res.status).toBe(429);
    const { error } = await res.json();
    expect(error).toMatch(/20 requests per day/);
    expect(error).toMatch(/1h48m/);
  });

  it("reports a bad key on a 403", async () => {
    mockFetch(geminiError(403, "permission denied"));
    const res = await POST(post({ imageDataUrl: JPEG }));
    expect((await res.json()).error).toMatch(/GEMINI_API_KEY/);
  });

  it("surfaces a bad model name from a 400", async () => {
    mockFetch(geminiError(400, "models/nope is not found"));
    const res = await POST(post({ imageDataUrl: JPEG }));
    expect((await res.json()).error).toMatch(/is not found/);
  });

  it("handles a reply with no model_output step", async () => {
    mockFetch({ ok: true, status: 200, json: async () => ({ steps: [{ type: "thought" }] }) });
    expect((await POST(post({ imageDataUrl: JPEG }))).status).toBe(502);
  });

  it("handles a non-JSON model answer", async () => {
    mockFetch({
      ok: true,
      status: 200,
      json: async () => ({ steps: [{ type: "model_output", content: [{ type: "text", text: "sorry" }] }] }),
    });
    const res = await POST(post({ imageDataUrl: JPEG }));
    expect(res.status).toBe(502);
    expect((await res.json()).error).toMatch(/ไม่สามารถอ่านผลลัพธ์/);
  });

  it("reports a timeout distinctly from a connection failure", async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(Object.assign(new Error("timed out"), { name: "TimeoutError" })) as unknown as typeof fetch;
    const res = await POST(post({ imageDataUrl: JPEG }));
    expect(res.status).toBe(504);
  });

  it("does not leak the API key when the request throws", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("failed with key test-key")) as unknown as typeof fetch;
    const res = await POST(post({ imageDataUrl: JPEG }));
    expect(JSON.stringify(await res.json())).not.toContain("test-key");
  });
});
