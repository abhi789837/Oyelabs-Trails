import { useEffect, useState } from "react";

import { qrPathData } from "@shared/certificates";

export interface QrShape {
  /** Modules per side, including the quiet border. */
  size: number;
  /** One path for every dark module, in module units. */
  path: string;
}

/**
 * The QR for a verify URL. `uqr` (MIT, ~10 KB) is imported lazily so it only loads on certificate
 * screens. Error correction M: survives a crease or a smudge on a printout.
 */
export async function qrShape(text: string): Promise<QrShape> {
  const { encode } = await import("uqr");
  const qr = encode(text, { ecc: "M", border: 2 });
  return { size: qr.size, path: qrPathData(qr.data) };
}

export function useQr(text: string | null): QrShape | null {
  const [shape, setShape] = useState<QrShape | null>(null);
  useEffect(() => {
    if (!text) return;
    let cancelled = false;
    void qrShape(text).then((s) => {
      if (!cancelled) setShape(s);
    });
    return () => {
      cancelled = true;
    };
  }, [text]);
  return shape;
}
