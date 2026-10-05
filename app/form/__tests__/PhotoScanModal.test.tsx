// app/form/__tests__/PhotoScanModal.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PhotoScanModal } from "../PhotoScanModal";

/** Drives the upload tab's file input, which is what kicks off a real AI scan. */
function uploadPhoto() {
  fireEvent.click(screen.getByText("อัปโหลดรูป"));
  const input = document.getElementById("nameplateFileInput") as HTMLInputElement;
  const file = new File(["x"], "plate.jpg", { type: "image/jpeg" });
  fireEvent.change(input, { target: { files: [file] } });
}

function mockOcrResponse(ok: boolean, body: unknown) {
  global.fetch = jest.fn().mockResolvedValue({ ok, json: async () => body }) as unknown as typeof fetch;
}

describe("PhotoScanModal", () => {
  beforeEach(() => {
    // getUserMedia is not available in jsdom — the component must degrade gracefully
    Object.defineProperty(window.navigator, "mediaDevices", { value: undefined, configurable: true });
  });

  it("shows the no-camera-support message instead of crashing when getUserMedia is unavailable", () => {
    render(<PhotoScanModal open={true} onClose={jest.fn()} onApply={jest.fn()} role="supplier" />);
    expect(screen.getByText(/ไม่รองรับ Live Camera/)).toBeInTheDocument();
  });

  it("selecting the Daikin preset shows its extracted brand/model in the summary list", () => {
    render(<PhotoScanModal open={true} onClose={jest.fn()} onApply={jest.fn()} role="supplier" />);
    fireEvent.click(screen.getByText("อัปโหลดรูป"));
    fireEvent.click(screen.getByText("Daikin Inverter FTV50"));
    expect(screen.getByText("Daikin")).toBeInTheDocument();
    expect(screen.getByText("FTV50QV1V")).toBeInTheDocument();
  });

  it("applying the scanned preset calls onApply with the preset data and a data-URL image", () => {
    const onApply = jest.fn();
    render(<PhotoScanModal open={true} onClose={jest.fn()} onApply={onApply} role="supplier" />);
    fireEvent.click(screen.getByText("อัปโหลดรูป"));
    fireEvent.click(screen.getByText("Daikin Inverter FTV50"));
    fireEvent.click(screen.getByText(/นำข้อมูลและรูปถ่ายเข้าฟอร์ม/));
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({ brand: "Daikin", model: "FTV50QV1V" }),
      expect.stringContaining("data:image/svg+xml")
    );
  });

  it("blocks applying a preset outside the buyer's permitted categories", () => {
    const onApply = jest.fn();
    window.alert = jest.fn();
    render(
      <PhotoScanModal
        open={true}
        onClose={jest.fn()}
        onApply={onApply}
        role="buyer"
        buyerAllowedCategories={["Chiller"]}
      />
    );
    fireEvent.click(screen.getByText("อัปโหลดรูป"));
    fireEvent.click(screen.getByText("Daikin Inverter FTV50")); // category: Refrigeration system
    fireEvent.click(screen.getByText(/นำข้อมูลและรูปถ่ายเข้าฟอร์ม/));
    expect(onApply).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalled();
  });

  describe("real AI scan (upload path)", () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("sends the photo to /api/ocr and shows only the fields the model actually read", async () => {
      mockOcrResponse(true, {
        fields: { brand: "Trane", model: "CVHF500", category: "Chiller" },
        confidence: "high",
        note: "",
        isNameplate: true,
      });
      render(<PhotoScanModal open={true} onClose={jest.fn()} onApply={jest.fn()} role="supplier" />);
      uploadPhoto();

      expect(await screen.findByText("Trane")).toBeInTheDocument();
      expect(screen.getByText("CVHF500")).toBeInTheDocument();
      expect(screen.getByText(/ชัดเจน/)).toBeInTheDocument();
      expect(global.fetch).toHaveBeenCalledWith("/api/ocr", expect.objectContaining({ method: "POST" }));
    });

    it("applies only the read fields, leaving commercial fields for a human", async () => {
      const onApply = jest.fn();
      mockOcrResponse(true, {
        fields: { brand: "Trane", category: "Chiller" },
        confidence: "medium",
        isNameplate: true,
      });
      render(<PhotoScanModal open={true} onClose={jest.fn()} onApply={onApply} role="supplier" />);
      uploadPhoto();
      // Wait on data the scan produced: the stages are hidden with a class, so the
      // apply button is in the DOM from the start and findByText would not wait.
      await screen.findByText("Trane");
      fireEvent.click(screen.getByText(/นำข้อมูลและรูปถ่ายเข้าฟอร์ม/));

      const applied = onApply.mock.calls[0][0] as Record<string, string>;
      expect(applied.brand).toBe("Trane");
      expect(applied.po).toBeUndefined();
      expect(applied.wStart).toBeUndefined();
      expect(applied.price).toBeUndefined();
    });

    it("shows the model's reason when the photo is not a nameplate", async () => {
      mockOcrResponse(true, { fields: {}, isNameplate: false, note: "รูปนี้เป็นภาพวิว ไม่ใช่ป้ายข้อมูล" });
      render(<PhotoScanModal open={true} onClose={jest.fn()} onApply={jest.fn()} role="supplier" />);
      uploadPhoto();

      // The heading is static markup; the note is what the scan actually produced.
      expect(await screen.findByText(/ไม่ใช่ป้ายข้อมูล/)).toBeInTheDocument();
    });

    it("surfaces a quota error from the server", async () => {
      mockOcrResponse(false, { error: "ใช้โควตา Gemini free tier ครบแล้ว กรุณารอสักครู่แล้วลองใหม่" });
      render(<PhotoScanModal open={true} onClose={jest.fn()} onApply={jest.fn()} role="supplier" />);
      uploadPhoto();

      expect(await screen.findByText(/ใช้โควตา Gemini free tier ครบแล้ว/)).toBeInTheDocument();
    });

    it("reports a readable error when the request itself fails", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("offline")) as unknown as typeof fetch;
      jest.spyOn(console, "warn").mockImplementation(() => {});
      render(<PhotoScanModal open={true} onClose={jest.fn()} onApply={jest.fn()} role="supplier" />);
      uploadPhoto();

      expect(await screen.findByText(/เชื่อมต่อเซิร์ฟเวอร์ไม่ได้/)).toBeInTheDocument();
    });

    it("treats an empty read as a failure rather than applying nothing", async () => {
      mockOcrResponse(true, { fields: {}, isNameplate: true, confidence: "low", note: "ภาพเบลอมาก" });
      render(<PhotoScanModal open={true} onClose={jest.fn()} onApply={jest.fn()} role="supplier" />);
      uploadPhoto();

      expect(await screen.findByText(/ภาพเบลอมาก/)).toBeInTheDocument();
    });

    it("never calls the API for the canned sample nameplates", async () => {
      global.fetch = jest.fn() as unknown as typeof fetch;
      render(<PhotoScanModal open={true} onClose={jest.fn()} onApply={jest.fn()} role="supplier" />);
      fireEvent.click(screen.getByText("อัปโหลดรูป"));
      fireEvent.click(screen.getByText("Daikin Inverter FTV50"));

      await waitFor(() => expect(screen.getByText("Daikin")).toBeInTheDocument());
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
