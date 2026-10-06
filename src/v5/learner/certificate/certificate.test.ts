import { describe, expect, test } from "vitest";

import { certificateCode, certificateHashInput, fitFontSize, formatIssueDate, normalizeHolderName, qrPathData, shareImageLayout, SHARE_IMAGE, verifyPathFor } from "@shared/certificates";

import { artLayout, fileBase } from "./art";
import { qrShape } from "./qr";

describe("share image layout", () => {
  test("1200 × 630, everything inside the margins, QR bottom right, text clear of the QR", () => {
    const L = shareImageLayout("Rahul Verma", "Backend");
    expect([L.width, L.height]).toEqual([SHARE_IMAGE.width, SHARE_IMAGE.height]);
    expect([L.width, L.height]).toEqual([1200, 630]);
    expect(L.qr.x + L.qr.size).toBe(L.width - L.pad);
    expect(L.qr.y + L.qr.size).toBe(L.height - L.pad);
    for (const box of [L.name, L.title]) {
      expect(box.x).toBeGreaterThanOrEqual(L.pad);
      expect(box.x + box.maxWidth).toBeLessThan(L.qr.x);
      expect(box.y).toBeLessThan(L.qr.y);
    }
    expect(L.footer.y).toBeLessThanOrEqual(L.height - L.pad);
  });

  test("long names and titles shrink, within limits; short ones stay at the maximum", () => {
    expect(shareImageLayout("Al", "Go").name.size).toBe(72);
    const long = shareImageLayout("Maximiliana Alexandra Fitzgerald-Montgomery", "Designing reliable distributed systems at scale");
    expect(long.name.size).toBeLessThan(72);
    expect(long.name.size).toBeGreaterThanOrEqual(34);
    expect(long.title.size).toBeLessThan(44);
    expect(shareImageLayout("x".repeat(300), "y").name.size).toBe(34);
    expect(fitFontSize("", 100, 40, 10)).toBe(40);
    expect(fitFontSize("abcdefghij", 300, 80, 10)).toBe(50);
  });
});

describe("QR", () => {
  test("a dark row run becomes one rectangle; empty matrix is an empty path", () => {
    expect(qrPathData([[true, true, false, true]])).toBe("M0 0h2v1h-2zM3 0h1v1h-1z");
    expect(qrPathData([[false], [true]])).toBe("M0 1h1v1h-1z");
    expect(qrPathData([])).toBe("");
  });

  test("the lazily loaded encoder gives a square code with a path for a verify URL", async () => {
    const shape = await qrShape("https://learn.oyelabs.com/verify/OYL-AB12-CD34");
    expect(shape.size).toBeGreaterThanOrEqual(25);
    expect(shape.path.startsWith("M")).toBe(true);
  });
});

describe("certificate text", () => {
  test("codes, names, dates, paths", () => {
    expect(certificateCode(new Uint8Array([0, 0, 0, 0, 0]))).toBe("OYL-0000-0000");
    expect(certificateCode(new Uint8Array([255, 255, 255, 255, 255]))).toBe("OYL-ZZZZ-ZZZZ");
    expect(normalizeHolderName("  Rahul   Verma ")).toBe("Rahul Verma");
    expect(formatIssueDate(Date.UTC(2026, 9, 6, 23, 30))).toBe("6 October 2026");
    expect(verifyPathFor("OYL-AB12-CD34")).toBe("/verify/OYL-AB12-CD34");
    expect(fileBase("OYL-AB12-CD34")).toBe("oyelearn-certificate-OYL-AB12-CD34");
    expect(certificateHashInput({ id: "OYL-1", kind: "goal", refId: "g", title: "T", holderName: " A  B ", issuedAt: 5 })).toBe("OYL-1|goal|g|T|A B|5");
  });

  test("the art says what kind of certificate it is", () => {
    const base = { holderName: "Rahul", title: "Backend", issuedAt: 0, id: "OYL-1", verifyUrl: "https://x.test/verify/OYL-1" };
    expect(artLayout({ ...base, kind: "track" })).toMatchObject({ kindLabel: "Track certificate", completedLine: "reached the summit of the track", verifyText: "x.test/verify/OYL-1" });
    expect(artLayout({ ...base, kind: "course" }).completedLine).toBe("completed the course");
    expect(artLayout({ ...base, kind: "goal" }).completedLine).toBe("reached the goal");
  });
});
