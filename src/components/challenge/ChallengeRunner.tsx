import type { Topic } from "@/types/curriculum";
import { CodeRunner } from "./CodeRunner";
import { QuizRunner } from "./QuizRunner";

/** Picks the right challenge for a topic. Both paths grade and write through recordAttempt. */
export function ChallengeRunner({ topic }: { topic: Topic }) {
  if (topic.challengeType === "quiz" && topic.quiz?.length) {
    return <QuizRunner topic={topic} questions={topic.quiz} />;
  }
  if (topic.challengeType === "code" && topic.codeChallenge) {
    return <CodeRunner topic={topic} challenge={topic.codeChallenge} />;
  }
  return (
    <p className="rounded-md border border-dashed px-4 py-6 text-sm text-muted-foreground">
      This topic doesn't have a challenge yet.
    </p>
  );
}
