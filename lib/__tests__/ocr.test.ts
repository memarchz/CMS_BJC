import {
  mapReadingToFields,
  parseOcrResponse,
  parseImageDataUrl,
  buildOcrSchema,
  extractOutputText,
} from "../ocr";
import { CATN } from "../catalog";

describe("mapReadingToFields", () => {
  it("copies brand/model/serial into both the registration and spec fields", () => {
    const fields = mapReadingToFields({ brand: "Daikin", model: "FTV50QV1V", serial: "DK26X-001234" });
    expect(fields.brand).toBe("Daikin");
    expect(fields.mfr).toBe("Daikin");
    expect(fields.model).toBe("FTV50QV1V");
    expect(fields.model2).toBe("FTV50QV1V");
    expect(fields.serial).toBe("DK26X-001234");
    expect(fields.serial2).toBe("DK26X-001234");
  });

  it("maps the plate readings onto their form keys", () => {
    const fields = mapReadingToFields({
      capacity: "18,000 BTU",
      power: "380V 3P 50Hz",
      standards: "CE / มอก. 1155",
      dimWeight: "900x320x290 มม. / 38 กก.",
      origin: "Japan",
      mfgDate: "2026-03",
      series: "Inverter FTV",
      assetName: "ตู้แช่เย็น Daikin FTV50",
    });
    expect(fields.cap).toBe("18,000 BTU");
    expect(fields.power).toBe("380V 3P 50Hz");
    expect(fields.std).toBe("CE / มอก. 1155");
    expect(fields.dim).toBe("900x320x290 มม. / 38 กก.");
    expect(fields.origin).toBe("Japan");
    expect(fields.mfgDate).toBe("2026-03");
    expect(fields.series).toBe("Inverter FTV");
    expect(fields.assetName).toBe("ตู้แช่เย็น Daikin FTV50");
  });

  it("never fills commercial fields even if the model returns them", () => {
    const fields = mapReadingToFields({
      brand: "Trane",
      // Fields the model was told not to produce; they must not leak through.
      ...({ po: "PO-123", wStart: "2026-01-01", price: "500000", maint: "20000" } as object),
    });
    expect(fields.po).toBeUndefined();
    expect(fields.wStart).toBeUndefined();
    expect(fields.price).toBeUndefined();
    expect(fields.maint).toBeUndefined();
    expect(fields.brand).toBe("Trane");
  });

  it("accepts a category that exists in the taxonomy", () => {
    const fields = mapReadingToFields({ category: "Chiller" });
    expect(fields.category).toBe("Chiller");
  });

  it("drops a category outside the taxonomy", () => {
    const fields = mapReadingToFields({ category: "Spaceship" });
    expect(fields.category).toBeUndefined();
    expect(fields.subCat).toBeUndefined();
  });

  it("keeps a sub-category only when it belongs to the chosen category", () => {
    expect(mapReadingToFields({ category: "Safety Equipment", subCat: "CCTV" }).subCat).toBe("CCTV");
    expect(mapReadingToFields({ category: "Safety Equipment", subCat: "Nonsense" }).subCat).toBeUndefined();
  });

  it("drops a sub-category for a category that has none", () => {
    const fields = mapReadingToFields({ category: "Chiller", subCat: "CCTV" });
    expect(fields.category).toBe("Chiller");
    expect(fields.subCat).toBeUndefined();
  });

  it("treats null, empty and placeholder readings as absent", () => {
    const fields = mapReadingToFields({
      brand: null,
      model: "   ",
      serial: "N/A",
      origin: "ไม่ระบุ",
      capacity: "-",
    });
    expect(fields).toEqual({});
  });
});

describe("parseOcrResponse", () => {
  it("returns mapped fields with confidence and note", () => {
    const result = parseOcrResponse(
      JSON.stringify({
        isNameplate: true,
        brand: "Daikin",
        category: "Refrigeration system",
        confidence: "high",
        note: "อ่านได้ครบ",
      }),
    );
    expect(result.isNameplate).toBe(true);
    expect(result.confidence).toBe("high");
    expect(result.note).toBe("อ่านได้ครบ");
    expect(result.fields.brand).toBe("Daikin");
    expect(result.fields.category).toBe("Refrigeration system");
  });

  it("reports isNameplate false when the photo is not a nameplate", () => {
    const result = parseOcrResponse(JSON.stringify({ isNameplate: false, confidence: "low", note: "เป็นรูปแมว" }));
    expect(result.isNameplate).toBe(false);
    expect(result.fields).toEqual({});
    expect(result.note).toBe("เป็นรูปแมว");
  });

  it("defaults a missing or unexpected confidence to low", () => {
    expect(parseOcrResponse(JSON.stringify({ isNameplate: true })).confidence).toBe("low");
    expect(parseOcrResponse(JSON.stringify({ confidence: "very sure" })).confidence).toBe("low");
  });

  it("assumes a nameplate when the flag is missing, so partial reads still apply", () => {
    const result = parseOcrResponse(JSON.stringify({ brand: "Trane" }));
    expect(result.isNameplate).toBe(true);
    expect(result.fields.brand).toBe("Trane");
  });

  it("throws a Thai error on malformed JSON", () => {
    expect(() => parseOcrResponse("not json")).toThrow(/ไม่สามารถอ่านผลลัพธ์/);
    expect(() => parseOcrResponse("[1,2]")).toThrow(/ไม่สามารถอ่านผลลัพธ์/);
    expect(() => parseOcrResponse("null")).toThrow(/ไม่สามารถอ่านผลลัพธ์/);
  });
});

describe("parseImageDataUrl", () => {
  it("splits a jpeg data URL", () => {
    expect(parseImageDataUrl("data:image/jpeg;base64,AAAA")).toEqual({ mimeType: "image/jpeg", data: "AAAA" });
  });

  it("splits a png data URL", () => {
    expect(parseImageDataUrl("data:image/png;base64,BBBB").mimeType).toBe("image/png");
  });

  it("rejects a non-image or malformed data URL", () => {
    expect(() => parseImageDataUrl("data:text/plain;base64,AAAA")).toThrow(/รูปภาพไม่ถูกต้อง/);
    expect(() => parseImageDataUrl("https://example.com/a.jpg")).toThrow(/รูปภาพไม่ถูกต้อง/);
  });
});

describe("extractOutputText", () => {
  it("returns the text of the model_output step and skips thought steps", () => {
    const payload = {
      steps: [
        { type: "thought", signature: "opaque" },
        { type: "model_output", content: [{ type: "text", text: '{"brand":"Daikin"}' }] },
      ],
    };
    expect(extractOutputText(payload)).toBe('{"brand":"Daikin"}');
  });

  it("joins multiple text parts in order", () => {
    const payload = {
      steps: [{ type: "model_output", content: [{ type: "text", text: '{"a":' }, { type: "text", text: "1}" }] }],
    };
    expect(extractOutputText(payload)).toBe('{"a":1}');
  });

  it("ignores non-text content parts", () => {
    const payload = {
      steps: [{ type: "model_output", content: [{ type: "image", data: "x" }, { type: "text", text: "ok" }] }],
    };
    expect(extractOutputText(payload)).toBe("ok");
  });

  it("returns an empty string for a payload with no usable steps", () => {
    expect(extractOutputText({ steps: [{ type: "thought" }] })).toBe("");
    expect(extractOutputText({ steps: [] })).toBe("");
    expect(extractOutputText({})).toBe("");
    expect(extractOutputText(null)).toBe("");
  });
});

describe("buildOcrSchema", () => {
  it("constrains category to the real taxonomy", () => {
    const schema = buildOcrSchema() as {
      properties: { category: { enum: string[] } };
      required: string[];
    };
    expect(schema.properties.category.enum).toEqual(CATN);
    expect(schema.required).toContain("isNameplate");
  });
});
