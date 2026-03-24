import {
  createRouter,
  createRoute,
  createRootRoute,
} from "@tanstack/react-router";
import { AppShell } from "@/components/layout/shell";
import { TunesPage } from "@/pages/tunes";
import { TuneDetailPage } from "@/pages/tune-detail";
import { SessionsPage } from "@/pages/sessions";
import { SessionDetailPage } from "@/pages/session-detail";
import { FriendsPage } from "@/pages/friends";
import { ProfilePage } from "@/pages/profile";
import { UserProfilePage } from "@/pages/user-profile";

// Root layout route — renders the app shell
const rootRoute = createRootRoute({
  component: AppShell,
});

// Index route — tunes browse / search
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: TunesPage,
});

// Tune detail
const tuneDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tune/$tuneId",
  component: TuneDetailPage,
});

// Sessions list
const sessionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sessions",
  component: SessionsPage,
});

// Session detail
const sessionDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/session/$sessionId",
  component: SessionDetailPage,
});

// Friends
const friendsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/friends",
  component: FriendsPage,
});

// My profile
const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfilePage,
});

// Other user's profile
const userProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile/$principalId",
  component: UserProfilePage,
});

// Build the route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  tuneDetailRoute,
  sessionsRoute,
  sessionDetailRoute,
  friendsRoute,
  profileRoute,
  userProfileRoute,
]);

// Create the router
export const router = createRouter({ routeTree });

// Register the router for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
