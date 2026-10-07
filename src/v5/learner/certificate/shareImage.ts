import { formatIssueDate, shareImageLayout, CERTIFICATE_KIND_LABELS } from "@shared/certificates";

import { BRAND_BLUE, downloadBlob, fileBase, INK, MUTED, PAPER, type CertificateText } from "./art";
import type { QrShape } from "./qr";

/**
 * The share image: 1200 × 630 PNG (the Open Graph size LinkedIn and Slack preview at), drawn on a
 * canvas. Layout from `shareImageLayout` (tested). The logo is the kit's horizontal light SVG from
 * /brand (same origin, so the canvas isn't tainted and `toBlob` works).
 */

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function ellipsize(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) cut = cut.slice(0, -1);
  return `${cut.trimEnd()}…`;
}

export async function renderShareImage(cert: CertificateText, qr: QrShape): Promise<HTMLCanvasElement> {
  const L = shareImageLayout(cert.holderName, cert.title);
  const canvas = document.createElement("canvas");
  canvas.width = L.width;
  canvas.height = L.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas isn't available in this browser.");

  await Promise.all([document.fonts?.load(`600 ${L.name.size}px Sora`), document.fonts?.load(`400 ${L.kicker.size}px Sora`)].map((p) => p?.catch(() => undefined)));

  // Paper, a brand band on the left, a thin frame.
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, L.width, L.height);
  ctx.fillStyle = BRAND_BLUE;
  ctx.fillRect(0, 0, 14, L.height);
  ctx.strokeStyle = "rgba(15, 23, 42, 0.12)";
  ctx.lineWidth = 2;
  ctx.strokeRect(24, 24, L.width - 48, L.height - 48);

  const logo = await loadImage("/brand/logo/oyelearn-light.svg");
  if (logo) {
    const h = L.logo.height;
    ctx.drawImage(logo, L.logo.x, L.logo.y, (logo.naturalWidth / logo.naturalHeight || 3.93) * h, h);
  }

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = MUTED;
  ctx.font = `400 ${L.kicker.size}px Sora, sans-serif`;
  ctx.fillText(`${CERTIFICATE_KIND_LABELS[cert.kind]} certificate`, L.kicker.x, L.kicker.y);

  ctx.fillStyle = INK;
  ctx.font = `600 ${L.name.size}px Sora, sans-serif`;
  ctx.fillText(ellipsize(ctx, cert.holderName, L.name.maxWidth), L.name.x, L.name.y);

  ctx.fillStyle = BRAND_BLUE;
  ctx.font = `600 ${L.title.size}px Sora, sans-serif`;
  ctx.fillText(ellipsize(ctx, cert.title, L.title.maxWidth), L.title.x, L.title.y);

  ctx.fillStyle = MUTED;
  ctx.font = `400 ${L.footer.size}px Sora, sans-serif`;
  ctx.fillText(ellipsize(ctx, `Issued ${formatIssueDate(cert.issuedAt)} · ${cert.verifyUrl.replace(/^https?:\/\//, "")}`, L.qr.x - L.footer.x - 32), L.footer.x, L.footer.y);

  // QR on a white tile.
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(L.qr.x - 8, L.qr.y - 8, L.qr.size + 16, L.qr.size + 16);
  ctx.save();
  ctx.translate(L.qr.x, L.qr.y);
  ctx.scale(L.qr.size / qr.size, L.qr.size / qr.size);
  ctx.fillStyle = INK;
  ctx.fill(new Path2D(qr.path));
  ctx.restore();
  return canvas;
}

export async function downloadShareImage(cert: CertificateText, qr: QrShape): Promise<{ width: number; height: number }> {
  const canvas = await renderShareImage(cert, qr);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("The image couldn't be made.");
  downloadBlob(blob, `${fileBase(cert.id)}.png`);
  return { width: canvas.width, height: canvas.height };
}
