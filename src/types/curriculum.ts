export type ChallengeType = "code" | "quiz";
export type TopicLevel = "beginner" | "intermediate" | "advanced";
export type TrackId = "frontend" | "backend" | "fullstack" | "ai-driven";

/**
 * `glacier` extends the brief's four tokens: the brief reserves `ridge` for the
 * AI-Driven track only, so Full-Stack needed its own accent to stay distinguishable.
 */
export type AccentToken = "trailmark" | "summit" | "ridge" | "glacier" | "basalt";

export interface TopicResource {
  label: string;
  url: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface CodeChallenge {
  instructions: string;
  starterCode: string;
  functionName: string;
  testCases: { args: unknown[]; expected: unknown; description: string }[];
}

export interface Topic {
  id: string;
  trackId: TrackId;
  title: string;
  summary: string;
  level: TopicLevel;
  estMinutes: number;
  isMilestone?: boolean;
  webRef: TopicResource;
  videoRef: TopicResource;
  challengeType: ChallengeType;
  quiz?: QuizQuestion[];
  codeChallenge?: CodeChallenge;
}

export interface Track {
  id: TrackId;
  name: string;
  tagline: string;
  accentToken: AccentToken;
  topics: Topic[];
}
