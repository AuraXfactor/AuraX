export default function Loading() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="glass h-32 animate-pulse rounded-2xl" />
      ))}
    </div>
  );
}

