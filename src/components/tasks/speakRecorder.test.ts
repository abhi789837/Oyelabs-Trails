import { describe, expect, test } from "vitest";

import { clock, levelOf, micErrorMessage, pickRecordingMime, recordingAnnouncement } from "./speakRecorder";

describe("the Speak recorder helpers", () => {
  test("pick WebM/Opus, then Ogg/Opus, then MP4, else let the browser choose", () => {
    expect(pickRecordingMime(() => true)).toBe("audio/webm;codecs=opus");
    expect(pickRecordingMime((m) => m.startsWith("audio/ogg"))).toBe("audio/ogg;codecs=opus");
    expect(pickRecordingMime((m) => m === "audio/mp4")).toBe("audio/mp4");
    expect(pickRecordingMime(() => false)).toBeUndefined();
    expect(pickRecordingMime(undefined)).toBeUndefined();
    expect(pickRecordingMime(() => {
      throw new Error("nope");
    })).toBeUndefined();
  });

  test("microphone errors are plain and say what to do", () => {
    expect(micErrorMessage({ name: "NotAllowedError" })).toMatch(/blocked the microphone.*allow Microphone/);
    expect(micErrorMessage({ name: "NotFoundError" })).toMatch(/can't find a microphone/);
    expect(micErrorMessage({ name: "NotReadableError" })).toMatch(/Another app is using/);
    expect(micErrorMessage(new Error("weird"))).toMatch(/type your answer instead/);
  });

  test("clock, announcements and the level meter", () => {
    expect(clock(65)).toBe("1:05");
    expect(clock(-3)).toBe("0:00");
    expect(recordingAnnouncement(80, 90)).toBe("Ten seconds left.");
    expect(recordingAnnouncement(90, 90)).toMatch(/Time is up/);
    expect(recordingAnnouncement(30, 90)).toBeNull();
    expect(levelOf(new Uint8Array(64).fill(128))).toBe(0);
    expect(levelOf([])).toBe(0);
    expect(levelOf(new Uint8Array(64).fill(255))).toBe(1);
  });
});
