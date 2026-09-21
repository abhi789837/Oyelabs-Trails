import { useParams } from "react-router-dom";

import { getTrackById } from "@/data/tracks";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import NotFoundPage from "./NotFoundPage";

export default function CertificatePage() {
  const { trackId } = useParams();
  const track = getTrackById(trackId);
  useDocumentTitle(track ? `${track.name} certificate` : undefined);
  if (!track) return <NotFoundPage />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-8">
      <h1 className="text-2xl font-bold">{track.name} certificate</h1>
      <p className="mt-3 text-muted-foreground">Certificate coming in phase 9.</p>
    </div>
  );
}
