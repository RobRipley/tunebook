import { useParams } from "@tanstack/react-router";

export function UserProfilePage() {
  const { principalId } = useParams({ from: "/profile/$principalId" });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-stone-900 mb-4">User Profile</h1>
      <p className="text-stone-500">Viewing profile: {principalId}</p>
    </div>
  );
}
