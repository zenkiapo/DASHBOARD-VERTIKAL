import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { AnnouncementPage } from "./components/AnnouncementPage";
import { LoginPage } from "./components/LoginPage";
import { RtlPage } from "./components/RtlPage";
import { TeamPage } from "./components/TeamPage";
import { WelcomePage } from "./components/WelcomePage";

type Page = "welcome" | "dashboard" | "team" | "rtl" | "announcement" | "login";

const pagePaths: Record<Exclude<Page, "login">, string> = {
  welcome: "/",
  dashboard: "/dashboard",
  team: "/team",
  rtl: "/rtl",
  announcement: "/announcement",
};

function getPage(): Page {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (path === "/dashboard") return "dashboard";
  if (path === "/team") return "team";
  if (path === "/rtl") return "rtl";
  if (path === "/announcement") return "announcement";
  if (path === "/login") return "login";
  return "welcome";
}

function safeReturnPage(path: string | null): Exclude<Page, "login"> {
  const destinations: Record<string, Exclude<Page, "login">> = {
    "/": "welcome",
    "/dashboard": "dashboard",
    "/team": "team",
    "/rtl": "rtl",
    "/announcement": "announcement",
  };
  return path ? destinations[path] ?? "dashboard" : "dashboard";
}

const Dashboard = lazy(() =>
  import("./components/Dashboard").then((module) => ({
    default: module.Dashboard,
  })),
);

export default function App() {
  const [page, setPage] = useState<Page>(getPage);
  const navigate = useCallback(
    (nextPage: Page, replace = false) => {
      const path =
        nextPage === "login"
          ? `/login?next=${encodeURIComponent(
              page === "login" || page === "welcome"
                ? "/dashboard"
                : pagePaths[page],
            )}`
          : pagePaths[nextPage];
      if (replace) window.history.replaceState({}, "", path);
      else if (window.location.pathname + window.location.search !== path) {
        window.history.pushState({}, "", path);
      }
      setPage(nextPage);
      window.scrollTo(0, 0);
    },
    [page],
  );

  useEffect(() => {
    const onPopState = () => setPage(getPage());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  if (page === "dashboard") {
    return (
      <Suspense
        fallback={
          <main className="dashboard-shell">
            <section className="loading-panel panel" aria-live="polite">
              Memuat dashboard…
            </section>
          </main>
        }
      >
        <Dashboard
          onBack={() => navigate("welcome")}
          onOpenLogin={() => navigate("login")}
          onOpenRtl={() => navigate("rtl")}
          onOpenAnnouncement={() => navigate("announcement")}
        />
      </Suspense>
    );
  }
  if (page === "team") {
    return (
      <TeamPage
        onBack={() => navigate("welcome")}
        onOpenDashboard={() => navigate("dashboard")}
        onOpenRtl={() => navigate("rtl")}
        onOpenAnnouncement={() => navigate("announcement")}
      />
    );
  }
  if (page === "rtl") {
    return (
      <RtlPage
        onBack={() => navigate("welcome")}
        onOpenDashboard={() => navigate("dashboard")}
        onOpenTeam={() => navigate("team")}
        onOpenAnnouncement={() => navigate("announcement")}
      />
    );
  }
  if (page === "announcement") {
    return (
      <AnnouncementPage
        onBack={() => navigate("welcome")}
        onOpenDashboard={() => navigate("dashboard")}
        onOpenLogin={() => navigate("login")}
        onOpenRtl={() => navigate("rtl")}
        onOpenTeam={() => navigate("team")}
      />
    );
  }
  if (page === "login") {
    return (
      <LoginPage
        onBack={() => navigate("welcome")}
        onLoginComplete={() => {
          const next = new URLSearchParams(window.location.search).get("next");
          navigate(safeReturnPage(next), true);
        }}
      />
    );
  }
  return (
    <WelcomePage
      onOpenDashboard={() => navigate("dashboard")}
      onOpenLogin={() => navigate("login")}
      onOpenRtl={() => navigate("rtl")}
      onOpenAnnouncement={() => navigate("announcement")}
      onOpenTeam={() => navigate("team")}
    />
  );
}
