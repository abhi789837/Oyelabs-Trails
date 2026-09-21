import { useParams } from "react-router-dom";

import { getTrackById } from "@/data/tracks";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import NotFoundPage from "./NotFoundPage";

export default function TrackPage() {
  const { trackId } = useParams();
  const track = getTrackById(trackId);
  useDocumentTitle(track?.name);
  if (!track) return <NotFoundPage />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-8">
      <h1 className="text-2xl font-bold">{track.name}</h1>
      <p className="mt-3 text-muted-foreground">Trail map coming in phase 6.</p>
    </div>
  );
}
