import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function DashboardPage() {
  useDocumentTitle();
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-8">
      <h1 className="text-2xl font-bold sm:text-3xl">Oyelabs Trails</h1>
      <p className="mt-3 text-muted-foreground">Dashboard coming in phase 5.</p>
    </div>
  );
}
