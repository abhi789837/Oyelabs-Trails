import type { Topic } from "@/types/curriculum";

// Placeholder until the challenge engine lands (phase 8).
export function ChallengeRunner({ topic }: { topic: Topic }) {
  return (
    <p className="rounded-md border border-dashed px-4 py-6 text-sm text-muted-foreground">
      The {topic.challengeType === "quiz" ? "quiz" : "coding challenge"} for this topic is coming next.
    </p>
  );
}
