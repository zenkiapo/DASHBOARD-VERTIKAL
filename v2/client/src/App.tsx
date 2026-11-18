import { useState } from "react";
import { Dashboard } from "./components/Dashboard";
import { TeamPage } from "./components/TeamPage";
import { WelcomePage } from "./components/WelcomePage";

export default function App() {
  const [page, setPage] = useState<"welcome" | "dashboard" | "team">("welcome");

  if (page === "dashboard") {
    return <Dashboard onBack={() => setPage("welcome")} />;
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
