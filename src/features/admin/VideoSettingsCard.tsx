import { useEffect, useId, useState } from "react";

import type { VideoLockMode } from "@shared/video";

import { ApiRequestError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { videosApi, type VideoSettings } from "@/features/videos/api";
import { notify } from "@/lib/toast";

const OPTIONS = [
  { value: "lock" as const, label: "Lock the test", description: "The topic test opens once every video is watched." },
  { value: "warn" as const, label: "Warn only", description: "The test is open; learners see which videos they skipped." },
];

/**
 * v4.3: whether a topic's test waits for its videos. Topics a learner already completed are never
 * locked or reset, whichever is chosen. Also lists videos a player reported as unplayable, which no
 * longer count towards the lock, so an admin can check them and put them back.
 */
export function VideoSettingsCard({ className }: { className?: string }) {
  const id = useId();
  const [settings, setSettings] = useState<VideoSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    videosApi
      .settings(controller.signal)
      .then(setSettings)
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setLoadError(err instanceof ApiRequestError ? err.message : "Could not load the video settings.");
      });
    return () => controller.abort();
  }, []);

  const save = async (lockMode: VideoLockMode) => {
    if (!settings || lockMode === settings.lockMode) return;
    setSaving(true);
    try {
      const next = await videosApi.saveSettings(lockMode);
      setSettings(next);
      notify.success(next.lockMode === "lock" ? "Topic tests now wait for the videos." : "Topic tests are open; skipped videos show a warning.");
    } catch (err) {
      notify.error(err instanceof ApiRequestError ? err.message : "Could not save that setting.");
    } finally {
      setSaving(false);
    }
  };

  const restore = async (videoId: string) => {
    try {
      setSettings(await videosApi.clearUnplayable(videoId));
    } catch (err) {
      notify.error(err instanceof ApiRequestError ? err.message : "Could not update that video.");
    }
  };

  return (
    <section aria-labelledby={`${id}-title`} className={className}>
      {/* A site-wide setting changed rarely: collapsed, with the current choice in the summary. */}
      <details className="rounded-md border bg-surface" open={(settings?.unplayable.length ?? 0) > 0 || undefined}>
        <summary className="cursor-pointer rounded-md px-4 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong">
          <h2 id={`${id}-title`} className="inline font-semibold">
            Topic videos
          </h2>
          <span className="ml-2 text-muted-foreground">
            {settings ? OPTIONS.find((o) => o.value === settings.lockMode)?.label : "…"}
            {settings && settings.unplayable.length > 0 ? `, ${settings.unplayable.length} unplayable` : ""}
          </span>
        </summary>
        <div className="border-t px-4 py-3">
        {loadError ? (
          <p className="mt-2 text-sm text-destructive">{loadError}</p>
        ) : (
          <>
            <p id={`${id}-hint`} className="max-w-prose text-xs text-muted-foreground">
              Watched means 90% played; completed topics stay completed.
            </p>
            <div className="mt-2">
              <Segmented
                label="When a topic's videos are not all watched"
                describedBy={`${id}-hint`}
                options={OPTIONS}
                value={settings?.lockMode ?? null}
                onChange={(value) => void save(value)}
                disabled={!settings || saving}
                size="sm"
              />
            </div>
            {settings && settings.unplayable.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium">Reported as unplayable (not counted)</p>
                <ul className="mt-1 space-y-1">
                  {settings.unplayable.map((v) => (
                    <li key={v.videoId} className="flex flex-wrap items-center gap-2 text-xs">
                      <a
                        href={`https://www.youtube.com/watch?v=${v.videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono underline underline-offset-2"
                      >
                        {v.videoId}
                      </a>
                      <span className="text-muted-foreground">error {v.code}</span>
                      <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => void restore(v.videoId)}>
                        It plays again
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
        </div>
      </details>
    </section>
  );
}
