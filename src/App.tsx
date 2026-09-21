const swatches = [
  { name: "trailmark", className: "bg-trailmark" },
  { name: "summit", className: "bg-summit" },
  { name: "ridge", className: "bg-ridge" },
  { name: "glacier", className: "bg-glacier" },
  { name: "basalt", className: "bg-basalt" },
];

export default function App() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold">Oyelabs Trails</h1>
      <p className="mt-3 max-w-prose text-lg text-muted-foreground">
        Scaffold check: tokens, fonts and dark mode are wired up.
      </p>
      <ul className="mt-8 flex flex-wrap gap-4">
        {swatches.map((s) => (
          <li key={s.name} className="flex items-center gap-2">
            <span className={`h-6 w-6 rounded-sm ${s.className}`} />
            <code className="font-mono text-sm">{s.name}</code>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="mt-8 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground"
        onClick={() => document.documentElement.classList.toggle("dark")}
      >
        Toggle dark mode
      </button>
    </main>
  );
}
