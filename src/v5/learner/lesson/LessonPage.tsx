import { lazy, Suspense, useEffect, useState } from "react";
import { Compass } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import type { LessonStateView } from "@shared/lessonCore";

import { findTopic } from "@/content";
import { useTopicVideos } from "@/features/videos/useTopicVideos";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useModuleContent } from "@/hooks/useModuleContent";
import { useProgressStore } from "@/store/progressStore";
// Direct imports, not the `@/v5/design` barrel: the barrel pulls every design chunk (the split
// view's resizable panels, the trail, the shell…) into the lesson's first download.
import "@/v5/design/styles";
import { V5MotionProvider } from "@/v5/design/V5MotionProvider";
import { Button } from "@/v5/design/components/Button";
import { EmptyState, ErrorState, SkeletonLayout } from "@/v5/design/components/States";
import { useV5Root } from "@/v5/design/useV5Root";

import { lessonApi } from "./api";
import { LessonPlayer } from "./LessonPlayer";

const CourseLesson = lazy(() => import("./CourseLesson"));

/**
 * `/learn/lesson/:topicId?step=watch|read|do|check&t=<sec>&video=<id>`, the v5 lesson player
 * (Phase 3). With `?course=<courseId>` the id is a library course lesson instead (CourseLesson).
 */
export default function LessonPage() {
  useV5Root();
  const { topicId = "" } = useParams();
  const [params] = useSearchParams();
  const courseId = params.get("course");
  if (courseId) {
    return (
      <V5MotionProvider>
        <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-8"><SkeletonLayout variant="article" rows={6} label="Loading the lesson" /></div>}>
          <CourseLesson key={courseId} courseId={courseId} topicId={topicId} />
        </Suspense>
      </V5MotionProvider>
    );
  }
  return <CurriculumLesson topicId={topicId} />;
}

function CurriculumLesson({ topicId }: { topicId: string }) {
  const found = findTopic(topicId);
  useDocumentTitle(found?.topic.title ?? "Lesson");

  if (!found) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <EmptyState
          icon={<Compass />}
          title="This lesson isn't in your plan"
          body="It may have moved, or it isn't part of what you're learning right now."
          action={
            <Button variant="primary" asChild>
              <Link to="/learn/plan">Go to my plan</Link>
            </Button>
          }
        />
      </div>
    );
  }

  // Keyed: switching lessons starts every step's state afresh.
  return (
    <V5MotionProvider>
      <LessonLoader key={found.topic.id} trackId={found.track.id} moduleId={found.module.id} topicId={found.topic.id} />
    </V5MotionProvider>
  );
}

function LessonLoader({ trackId, moduleId, topicId }: { trackId: string; moduleId: string; topicId: string }) {
  const content = useModuleContent(trackId, moduleId);
  const videos = useTopicVideos(topicId);
  const markInProgress = useProgressStore((s) => s.markInProgress);
  const [state, setState] = useState<{ status: "loading" } | { status: "ready"; view: LessonStateView } | { status: "error" }>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    markInProgress(topicId);
  }, [markInProgress, topicId]);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    lessonApi
      .state(topicId, controller.signal)
      .then((view) => setState({ status: "ready", view }))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setState({ status: "error" });
      });
    return () => controller.abort();
  }, [topicId, attempt]);

  if (content.status === "error" || state.status === "error") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <ErrorState title="This lesson couldn't be loaded" body="Check your connection and try again. Your progress is saved." onRetry={() => (content.status === "error" ? window.location.reload() : setAttempt((n) => n + 1))} />
      </div>
    );
  }
  const topic = content.status === "ready" ? content.module.topics.find((t) => t.id === topicId) : undefined;
  if (content.status === "loading" || state.status === "loading" || !topic) {
    if (content.status === "ready" && !topic) {
      return (
        <div className="mx-auto max-w-xl px-4 py-16">
          <ErrorState title="This lesson couldn't be found" body="It may have been removed from your plan." />
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <SkeletonLayout variant="lesson" label="Loading the lesson" />
      </div>
    );
  }
  return <LessonPlayer topic={topic} initial={state.view} videos={videos} />;
}
