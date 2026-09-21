import { Navigate, useParams } from "react-router-dom";

import { getTopicById } from "@/data/tracks";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import NotFoundPage from "./NotFoundPage";

export default function TopicPage() {
  const { trackId, topicId } = useParams();
  const topic = topicId ? getTopicById(topicId) : undefined;
  useDocumentTitle(topic?.title);

  if (!topic) return <NotFoundPage />;
  if (topic.trackId !== trackId) return <Navigate to={`/track/${topic.trackId}/topic/${topic.id}`} replace />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-8">
      <h1 className="text-2xl font-bold">{topic.title}</h1>
      <p className="mt-3 text-muted-foreground">Topic detail coming in phase 7.</p>
    </div>
  );
}
