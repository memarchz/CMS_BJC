import { esc, fdt, fmt } from "../format";

describe("esc", () => {
  it("escapes HTML-significant characters", () => {
    expect(esc('<b>"x"&</b>')).toBe("&lt;b&gt;&quot;x&quot;&amp;&lt;/b&gt;");
  });

  it("returns an empty string for null/undefined", () => {
    expect(esc(null)).toBe("");
    expect(esc(undefined)).toBe("");
  });
});

describe("fdt", () => {
  it("formats a timestamp as a Thai medium date/short time string", () => {
    const t = new Date("2026-01-15T09:30:00+07:00").getTime();
    const result = fdt(t);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("fmt", () => {
  it("formats a number with Thai locale grouping and default 0 decimals", () => {
    expect(fmt(1234567)).toBe("1,234,567");
  });

  it("respects a given decimal count", () => {
    expect(fmt(12.345, 2)).toBe("12.35");
  });
});
