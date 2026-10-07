import fs from "node:fs";
import path from "node:path";

import { describe, expect, test } from "vitest";

import { buildWeeklyRecap, reminderEmail } from "../../../../shared/motivation";
import { weeklyReportEmail, type ReportsResponse } from "../../../../shared/reports";
import { continueOnLaptopEmail } from "../../../../shared/sendToEmail";
import { certificateEarnedEmail, certificateIdFromLink } from "./certificateEmail";
import { brandEmail, EMAIL_ASSETS, EMAIL_FOOTER_TEXT, emailAssetUrl, publicOriginFromEnv } from "./layout";

const ORIGIN = "https://learn.oyegen.com/";
const repo = path.resolve(__dirname, "../../../..");

const body = { subject: "Hello <there>", preheader: "Preview line", bodyHtml: "<p>Body</p>", text: "Body text\n\n" };

describe("brandEmail (the shared layout)", () => {
  const mail = brandEmail(ORIGIN, body);

  test("a full document: lang, charset, colour schemes, the subject as title", () => {
    expect(mail.html.startsWith("<!doctype html>")).toBe(true);
    expect(mail.html).toContain('<html lang="en"');
    expect(mail.html).toContain('<meta charset="utf-8">');
    expect(mail.html).toContain('<meta name="color-scheme" content="light dark">');
    expect(mail.html).toContain("<title>Hello &lt;there&gt;</title>");
    expect(mail.html).toContain("<p>Body</p>");
    expect(mail.subject).toBe(body.subject);
  });

  test("the header image is absolute on the public origin, light by default, dark in the media block", () => {
    const light = `https://learn.oyegen.com${EMAIL_ASSETS.headerLight}?v=1`;
    expect(emailAssetUrl(ORIGIN, EMAIL_ASSETS.headerLight)).toBe(light);
    expect(mail.html).toContain(`src="${light}"`);
    expect(mail.html).toContain(`https://learn.oyegen.com${EMAIL_ASSETS.headerLight2x}?v=1 2x`);
    expect(mail.html).toContain(`src="https://learn.oyegen.com${EMAIL_ASSETS.headerDark}?v=1"`);
    expect(mail.html).toMatch(/@media \(prefers-color-scheme:dark\)\{[^}]*\.ol-bg\{/);
    expect(mail.html).toContain(".ol-dark{display:block!important");
    // Every src is absolute: mail clients have no base URL.
    for (const [, src] of mail.html.matchAll(/src="([^"]+)"/g)) expect(src).toMatch(/^https:\/\/learn\.oyegen\.com\/brand\/email\//);
  });

  test("every image has alt text; layout tables are presentation", () => {
    const imgs = [...mail.html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
    expect(imgs.length).toBe(4);
    for (const img of imgs) expect(img).toMatch(/\salt="[^"]*"/);
    expect(imgs.filter((i) => i.includes('alt="Oyelearn"'))).toHaveLength(2);
    for (const table of mail.html.matchAll(/<table\b[^>]*>/g)) expect(table[0]).toContain('role="presentation"');
  });

  test("the footer has the mark and 'Oyelearn · by Oyelabs'", () => {
    expect(mail.html).toContain(`https://learn.oyegen.com${EMAIL_ASSETS.markLight}?v=1`);
    expect(mail.html).toContain(`https://learn.oyegen.com${EMAIL_ASSETS.markDark}?v=1`);
    expect(mail.html).toContain(EMAIL_FOOTER_TEXT);
    expect(EMAIL_FOOTER_TEXT).toBe("Oyelearn · by Oyelabs");
  });

  test("brand colours and Outfit with Arial behind it; no old palette", () => {
    expect(mail.html).toContain("font-family:Outfit, Arial, Helvetica, sans-serif");
    expect(mail.html).toContain("#F4F7FB");
    expect(mail.html).toContain("#0B2347");
    for (const old of ["#1F5FBF", "#F5F6F2", "#1B1F27", "Inter,"]) expect(mail.html).not.toContain(old);
  });

  test("the text part is kept, with the same footer after a signature line", () => {
    expect(mail.text).toBe(`Body text\n\n-- \n${EMAIL_FOOTER_TEXT}\nLearning never closes. https://learn.oyegen.com\n`);
  });

  test("the preheader is hidden; the amber rule only for wins", () => {
    expect(mail.html).toMatch(/<div style="display:none;[^"]*">Preview line<\/div>/);
    expect(mail.html).not.toContain("background:#F59E0B");
    expect(brandEmail(ORIGIN, { ...body, accent: "progress" }).html).toContain("background:#F59E0B");
  });

  test("the origin comes from PUBLIC_ORIGIN, with env.ts's default", () => {
    expect(publicOriginFromEnv({ PUBLIC_ORIGIN: "https://x.test/" } as NodeJS.ProcessEnv)).toBe("https://x.test");
    expect(publicOriginFromEnv({} as NodeJS.ProcessEnv)).toBe("http://localhost:5173");
  });

  test("the assets it links are in public/brand/email and match the kit byte for byte", () => {
    const kit: Record<string, string> = {
      headerLight: "05-web/email-header-light@600w.png",
      headerLight2x: "05-web/email-header-light@1200w.png",
      headerDark: "05-web/email-header-dark@600w.png",
      headerDark2x: "05-web/email-header-dark@1200w.png",
      markLight: "02-mark/oyelearn-mark-light@64w.png",
      markDark: "02-mark/oyelearn-mark-dark@64w.png",
    };
    for (const [key, file] of Object.entries(EMAIL_ASSETS)) {
      const served = fs.readFileSync(path.join(repo, "public", file));
      const source = path.join(repo, "Oyelearn-Brand-Kit", kit[key]);
      if (fs.existsSync(source)) expect(served.equals(fs.readFileSync(source)), file).toBe(true);
      expect(served.subarray(1, 4).toString()).toBe("PNG");
    }
  });
});

describe("every email uses the layout's body parts", () => {
  const report = {
    time: { activeLearners: 3, hours: 4 },
    completion: { lessonsDone: 9, averagePlanDone: 40 },
    skills: { levelUps: 2, casesPassed: 1 },
    tests: { topic: { passed: 1, attempts: 2 } },
    ai: { dollars: 1.5 },
  } as unknown as ReportsResponse;
  const bodies = {
    reminder: reminderEmail({ title: "Ready?", body: "Hi Tara" }, "https://l.test/learn/lesson/a", "https://l.test"),
    recap: buildWeeklyRecap({
      firstName: "Tara",
      weekLabel: "week 41",
      xpLastWeek: 10,
      lessonsLastWeek: 1,
      minutesLastWeek: 30,
      goalMinutes: 60,
      lastWeek: null,
      streak: { current: 0, freezesLeft: 1 },
      next: [{ title: "Closures", href: "/learn/lesson/js-closures" }],
      appUrl: "https://l.test",
    }),
    report: weeklyReportEmail(report, "Ana", "https://l.test/admin/reports"),
    laptop: continueOnLaptopEmail({ firstName: "Tara", lessonTitle: "Closures", link: "https://l.test/learn/lesson/a", code: "let a = 1 < 2;" }),
    certificate: certificateEarnedEmail({ firstName: "Tara", title: "Docker <basics>", certificateUrl: "https://l.test/learn/certificate/OYL-1", verifyUrl: "https://l.test/verify/OYL-1" }),
  };

  test.each(Object.entries(bodies))("%s: a body fragment (no frame), a subject, a text part and a blue button", (_name, mail) => {
    expect(mail.subject.length).toBeGreaterThan(0);
    expect(mail.text.length).toBeGreaterThan(0);
    expect(mail.bodyHtml).not.toMatch(/<html|<body|<!doctype/i);
    expect(mail.bodyHtml).toContain('bgcolor="#2067D3"');
    const framed = brandEmail("https://l.test", mail).html;
    expect(framed).toContain(EMAIL_FOOTER_TEXT);
    expect(framed).toContain(EMAIL_ASSETS.headerLight);
  });

  test("the certificate email escapes, links the certificate and the public check, and wears amber", () => {
    const mail = bodies.certificate;
    expect(mail.subject).toBe("You earned a certificate: Docker <basics>");
    expect(mail.bodyHtml).toContain("Docker &lt;basics&gt;");
    expect(mail.bodyHtml).toContain('href="https://l.test/learn/certificate/OYL-1"');
    expect(mail.text).toContain("https://l.test/verify/OYL-1");
    expect(mail.accent).toBe("progress");
  });

  test("the certificate id comes from the notification link", () => {
    expect(certificateIdFromLink("/learn/certificate/OYL-AB12-CD34")).toBe("OYL-AB12-CD34");
    expect(certificateIdFromLink("/learn/certificate/OYL%2DX")).toBe("OYL-X");
    expect(certificateIdFromLink("/learn/plan")).toBeNull();
    expect(certificateIdFromLink(null)).toBeNull();
  });
});
