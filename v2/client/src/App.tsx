import { lazy, Suspense, useState } from "react";
import { TeamPage } from "./components/TeamPage";
import { WelcomePage } from "./components/WelcomePage";

const Dashboard = lazy(() =>
  import("./components/Dashboard").then((module) => ({
    default: module.Dashboard,
  })),
);

export default function App() {
  const [page, setPage] = useState<"welcome" | "dashboard" | "team">("welcome");

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
        <Dashboard onBack={() => setPage("welcome")} />
      </Suspense>
    );
  }
  if (page === "team") {
    return (
      <TeamPage
        onBack={() => setPage("welcome")}
        onOpenDashboard={() => setPage("dashboard")}
      />
    );
  }
  return (
    <WelcomePage
      onOpenDashboard={() => setPage("dashboard")}
      onOpenTeam={() => setPage("team")}
    />
  );
}
