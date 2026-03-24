import { useParams } from "@tanstack/react-router";

export function SessionDetailPage() {
  const { sessionId } = useParams({ from: "/session/$sessionId" });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-stone-900 mb-4">Session Detail</h1>
      <p className="text-stone-500">Viewing session: {sessionId}</p>
    </div>
  );
}
