import { useParams } from "@tanstack/react-router";

export function TuneDetailPage() {
  const { tuneId } = useParams({ from: "/tune/$tuneId" });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-stone-900 mb-4">Tune Detail</h1>
      <p className="text-stone-500">Viewing tune: {tuneId}</p>
    </div>
  );
}
