import { Upload } from "lucide-react";
import { useRef, useState } from "react";

import type { UploadKind, UploadView } from "@shared/oyelabsCourses";

import { Button, ProgressBar } from "@/v5/design";

import { errorText, mediaApi } from "./api";

/** v4.5 Phase 2: "Upload a video" / "Upload a document", with progress and a plain error. */
export function UploadButton({ kind, label, accept, disabled, onUploaded }: { kind: UploadKind; label: string; accept: string; disabled?: boolean; onUploaded: (upload: UploadView) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ name: string; share: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = async (files: FileList | null) => {
    const list = files ? [...files] : [];
    if (input.current) input.current.value = "";
    setError(null);
    for (const file of list) {
      setProgress({ name: file.name, share: 0 });
      try {
        const view = await mediaApi.upload(kind, file, (share) => setProgress({ name: file.name, share }));
        onUploaded(view);
      } catch (e) {
        setError(`${file.name}: ${errorText(e, "The upload didn't finish. Try again.")}`);
      }
    }
    setProgress(null);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <input ref={input} type="file" accept={accept} multiple className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => void start(e.target.files)} data-testid={`oyelabs-upload-${kind}`} />
      <Button variant="secondary" size="sm" className="self-start" disabled={disabled || progress !== null} onClick={() => input.current?.click()}>
        <Upload aria-hidden="true" /> {label}
      </Button>
      {progress ? (
        <div className="flex flex-col gap-1" role="status">
          <span className="text-caption text-fg-2">
            Uploading {progress.name}… {Math.round(progress.share * 100)}%
          </span>
          <ProgressBar value={Math.round(progress.share * 100)} tone="brand" label={`Uploading ${progress.name}`} size="sm" />
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="text-small text-danger-fg">
          {error}
        </p>
      ) : null}
    </div>
  );
}
