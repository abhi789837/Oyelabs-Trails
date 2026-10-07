import fs from "node:fs";
import path from "node:path";

import type { OcrFn } from "./formats";
import { runtimeImport } from "./runtime";

/**
 * OCR for scanned PDFs with tesseract.js (English). The `eng` data is downloaded once into
 * `DATA_DIR/ocr` (the container has internet) and the worker is kept for the rest of the job, then
 * ended by `close()`. Tests inject their own `OcrFn` and never load this.
 */
export interface OcrSession {
  ocr: OcrFn;
  close: () => Promise<void>;
}

export function createTesseractOcr(dataDir: string): OcrSession {
  const cachePath = path.join(dataDir, "ocr");
  type Tesseract = typeof import("tesseract.js");
  let worker: Awaited<ReturnType<Tesseract["createWorker"]>> | null = null;
  return {
    ocr: async (png) => {
      if (!worker) {
        fs.mkdirSync(cachePath, { recursive: true });
        const tesseract = await runtimeImport<Tesseract & { default?: Tesseract }>("tesseract.js");
        const createWorker = tesseract.createWorker ?? tesseract.default?.createWorker;
        worker = await createWorker("eng", 1, { cachePath });
      }
      const result = await worker.recognize(Buffer.from(png));
      return result.data.text ?? "";
    },
    close: async () => {
      const w = worker;
      worker = null;
      await w?.terminate().catch(() => undefined);
    },
  };
}
