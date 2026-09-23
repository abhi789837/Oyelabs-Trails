import { Bot, Cloud, Layers, LayoutTemplate, Server, Smartphone, SquareCode, type LucideIcon } from "lucide-react";

import type { TopicLevel, TrackId } from "@/types/curriculum";

export const trackIcons: Record<TrackId, LucideIcon> = {
  frontend: LayoutTemplate,
  backend: Server,
  fullstack: Layers,
  "ai-driven": Bot,
  php: SquareCode,
  mobile: Smartphone,
  devops: Cloud,
};

/** Short code used in certificate IDs and compact labels. */
export const trackCodes: Record<TrackId, string> = {
  frontend: "FE",
  backend: "BE",
  fullstack: "FS",
  "ai-driven": "AI",
  php: "PH",
  mobile: "MO",
  devops: "DV",
};

export const levelLabels: Record<TopicLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
};

export const levelOrder: TopicLevel[] = ["beginner", "intermediate", "advanced", "expert"];

/** Used for elevation profiles: harder topics sit higher on the trail. */
export const levelElevation: Record<TopicLevel, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
};

/** "Beginner–Advanced" style range for a set of levels. */
export function levelRange(levels: TopicLevel[]): string {
  if (levels.length === 0) return "";
  const sorted = [...levels].sort((a, b) => levelElevation[a] - levelElevation[b]);
  const lo = sorted[0];
  const hi = sorted[sorted.length - 1];
  return lo === hi ? levelLabels[lo] : `${levelLabels[lo]}–${levelLabels[hi]}`;
}
