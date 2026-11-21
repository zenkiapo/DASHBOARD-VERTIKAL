import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { TeamPage } from "./components/TeamPage";
import { WelcomePage } from "./components/WelcomePage";
import { RtlPage } from "./components/RtlPage";
import { AnnouncementPage } from "./components/AnnouncementPage";

type Page = "welcome" | "dashboard" | "team" | "rtl" | "announcement";

function getPage(): Page {
  switch (window.location.pathname.replace(/\/+$/, "")) {
    case "/dashboard": return "dashboard";
    case "/team": return "team";
    case "/rtl": return "rtl";
    case "/announcement": return "announcement";
    default: return "welcome";
  }
}

const Dashboard = lazy(() =>
  import("./components/Dashboard").then((module) => ({
    default: module.Dashboard,
  })),
);

export default function App() {
  const [page, setPage] = useState<Page>(getPage);
  const navigate = useCallback((nextPage: Page) => {
    const path = nextPage === "welcome" ? "/" : `/${nextPage}`;
    if (window.location.pathname !== path) {
      window.history.pushState({}, "", path);
    }
    setPage(nextPage);
    window.scrollTo(0, 0);
  }, []);

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
        onOpenRtl={() => navigate("rtl")}
        onOpenTeam={() => navigate("team")}
      />
    );
  }
  return (
    <WelcomePage
      onOpenDashboard={() => navigate("dashboard")}
      onOpenTeam={() => navigate("team")}
      onOpenRtl={() => navigate("rtl")}
      onOpenAnnouncement={() => navigate("announcement")}
    />
  );
}
