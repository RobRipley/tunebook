import { RouterProvider } from "@tanstack/react-router";
import { useAuth } from "@/auth";
import { LoginScreen } from "@/components/login-screen";
import { router } from "@/router";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-parchment-50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-moss-500 border-t-transparent" />
        <p className="text-sm text-stone-500 font-body">Loading Tunebook...</p>
      </div>
    </div>
  );
}

export default function App() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <RouterProvider router={router} />;
}
