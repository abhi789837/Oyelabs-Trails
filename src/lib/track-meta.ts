import { Bot, Layers, LayoutTemplate, Server, type LucideIcon } from "lucide-react";

import type { TopicLevel, TrackId } from "@/types/curriculum";

export const trackIcons: Record<TrackId, LucideIcon> = {
  frontend: LayoutTemplate,
  backend: Server,
  fullstack: Layers,
  "ai-driven": Bot,
};

/** Short code used in certificate IDs and compact labels. */
export const trackCodes: Record<TrackId, string> = {
  frontend: "FE",
  backend: "BE",
  fullstack: "FS",
  "ai-driven": "AI",
};

export const levelLabels: Record<TopicLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

/** Used for elevation profiles: harder topics sit higher on the trail. */
export const levelElevation: Record<TopicLevel, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};
