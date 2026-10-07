import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import {
  CERTIFICATE_CODE_BYTES,
  certificateCode,
  certificateFileName,
  certificateHashInput,
  completionLine,
  formatIssueDate,
  isCertificateId,
  linkedInCredentialName,
  normalizeHolderName,
  qrPathData,
  signatureLines,
  verifyDisplay,
  verifyPathFor,
  verifyUrlFor,
  type PublicCertificate,
} from "@shared/certificates";

import { certificateFiles, linkedInUrlFor } from "./api";
import { VerifyView } from "./VerifyPage";

describe("certificate codes", () => {
  test("new codes are 80 bits in four groups; the older two-group and browser codes still verify", () => {
    expect(CERTIFICATE_CODE_BYTES).toBe(10);
    expect(certificateCode(new Uint8Array(10))).toBe("OYL-0000-0000-0000-0000");
    expect(certificateCode(new Uint8Array(10).fill(255))).toBe("OYL-ZZZZ-ZZZZ-ZZZZ-ZZZZ");
    expect(certificateCode(new Uint8Array([0, 0, 0, 0, 0]))).toBe("OYL-0000-0000");
    expect(certificateCode(new Uint8Array([255, 255, 255, 255, 255]))).toBe("OYL-ZZZZ-ZZZZ");
    for (const id of ["OYL-AB12-CD34-EF56-GH78", "OYL-AB12-CD34", "OYL-FE-7K2Q-M9XD"]) expect(isCertificateId(id)).toBe(true);
    for (const id of ["OYL-AB12", "OYL-AB12-CD34-EF56-GH78-JK90", "../etc/passwd", "oyl-ab12-cd34"]) expect(isCertificateId(id)).toBe(false);
  });
});

describe("certificate text", () => {
  test("names, dates, links, files", () => {
    expect(normalizeHolderName("  Rahul   Verma ")).toBe("Rahul Verma");
    expect(formatIssueDate(Date.UTC(2026, 9, 6, 23, 30))).toBe("6 October 2026");
    expect(verifyPathFor("OYL-AB12-CD34")).toBe("/verify/OYL-AB12-CD34");
    expect(verifyUrlFor("https://learn.oyegen.com/", "OYL-AB12-CD34")).toBe("https://learn.oyegen.com/verify/OYL-AB12-CD34");
    expect(verifyDisplay("https://learn.oyegen.com/verify/OYL-1")).toBe("learn.oyegen.com/verify/OYL-1");
    expect(certificateFileName("OYL-AB12-CD34", "pdf")).toBe("oyelearn-certificate-OYL-AB12-CD34.pdf");
    expect(certificateHashInput({ id: "OYL-1", kind: "goal", refId: "g", title: "T", holderName: " A  B ", issuedAt: 5 })).toBe("OYL-1|goal|g|T|A B|5");
    expect(completionLine("course")).toBe("has completed");
    expect(completionLine("track")).toBe("has completed the path");
    expect(completionLine("goal")).toBe("has reached the goal");
  });

  test("the signature block: a neutral placeholder until an admin sets a name; never an invented person", () => {
    expect(signatureLines(null)).toEqual({ above: "Oyelabs", below: "Issued by" });
    expect(signatureLines({ name: "  ", title: "Lead Software Engineer" })).toEqual({ above: "Oyelabs", below: "Issued by" });
    expect(signatureLines({ name: "Abhishek Singh Chauhan", title: "Lead Software Engineer" })).toEqual({ above: "Abhishek Singh Chauhan", below: "Lead Software Engineer, Oyelabs" });
    expect(signatureLines({ name: "A Person", title: "" })).toEqual({ above: "A Person", below: "Oyelabs" });
  });

  test("QR path: a dark row run is one rectangle; an empty matrix is an empty path", () => {
    expect(qrPathData([[true, true, false, true]])).toBe("M0 0h2v1h-2zM3 0h1v1h-1z");
    expect(qrPathData([[false], [true]])).toBe("M0 1h1v1h-1z");
    expect(qrPathData([])).toBe("");
  });
});

describe("sharing", () => {
  test("LinkedIn: 'Oyelearn – <Course>', Oyelabs, the issue month and the public link on the configured origin", () => {
    const url = new URL(linkedInUrlFor({ id: "OYL-AB12-CD34-EF56-GH78", title: "Docker in practice", issuedAt: Date.UTC(2026, 9, 7), verifyUrl: "https://learn.oyegen.com/verify/OYL-AB12-CD34-EF56-GH78" }));
    expect(url.origin + url.pathname).toBe("https://www.linkedin.com/profile/add");
    expect(url.searchParams.get("name")).toBe("Oyelearn – Docker in practice");
    expect(url.searchParams.get("organizationName")).toBe("Oyelabs");
    expect(url.searchParams.get("issueYear")).toBe("2026");
    expect(url.searchParams.get("issueMonth")).toBe("10");
    expect(url.searchParams.get("certUrl")).toBe("https://learn.oyegen.com/verify/OYL-AB12-CD34-EF56-GH78");
    expect(url.searchParams.get("certId")).toBe("OYL-AB12-CD34-EF56-GH78");
  });

  test("file addresses: PDF and 2× PNG for the owner (download or inline), a public 1× preview", () => {
    expect(certificateFiles.pdf("OYL-1")).toBe("/api/v5/certificates/OYL-1/file.pdf?download=1");
    expect(certificateFiles.png("OYL-1", { download: true })).toBe("/api/v5/certificates/OYL-1/file.png?download=1");
    expect(certificateFiles.png("OYL-1", { v: "Asha L" })).toBe("/api/v5/certificates/OYL-1/file.png?v=Asha+L");
    expect(certificateFiles.preview("OYL-1")).toBe("/api/v5/certificates/OYL-1/preview.png");
  });
});

describe("the public verify page", () => {
  const base: PublicCertificate = { id: "OYL-AB12-CD34-EF56-GH78", holderName: "Asha Learner", title: "Docker in practice", kind: "course", issuedAt: Date.UTC(2026, 9, 7), status: "valid", revokedAt: null };
  const html = (state: Parameters<typeof VerifyView>[0]["state"]) => renderToStaticMarkup(createElement(VerifyView, { certId: base.id, state }));

  test("valid: the logo, 'This certificate is valid ✓', the name, the course, the date and the picture", () => {
    const out = html({ kind: "found", certificate: base });
    expect(out).toContain('data-brand="logo"');
    expect(out).toContain("This certificate is valid");
    expect(out).toContain("✓");
    expect(out).toContain("Asha Learner");
    expect(out).toContain("Docker in practice");
    expect(out).toContain("7 October 2026");
    expect(out).toContain(`src="/api/v5/certificates/${base.id}/preview.png"`);
  });

  test("revoked: says so, and shows no name, course or picture", () => {
    const out = html({ kind: "found", certificate: { ...base, status: "revoked", revokedAt: Date.UTC(2026, 9, 8) } });
    expect(out).toContain("This certificate was revoked");
    expect(out).toContain("8 October 2026");
    expect(out).not.toContain("Asha Learner");
    expect(out).not.toContain("Docker in practice");
    expect(out).not.toContain("preview.png");
    expect(out).not.toContain("✓");
  });

  test("not found: 'Certificate not found' with the code that was tried", () => {
    const out = html({ kind: "missing" });
    expect(out).toContain("Certificate not found");
    expect(out).toContain(base.id);
    expect(out).not.toContain("is valid");
  });

  test("loading and a failed check are plain lines, never a verdict", () => {
    expect(html({ kind: "loading" })).toContain("Checking the certificate");
    const failed = html({ kind: "failed" });
    expect(failed).toContain('role="alert"');
    expect(failed).not.toContain("valid");
  });
});
