import { useEffect, useState } from "react";
import { Dashboard } from "./components/Dashboard";
import { LoginPage } from "./components/LoginPage";
import { TeamPage } from "./components/TeamPage";
import { WelcomePage } from "./components/WelcomePage";

export default function App() {
  const readPath = () => window.location.pathname;
  const [path, setPath] = useState(readPath);

  useEffect(() => {
    const handlePopState = () => setPath(readPath());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (nextPath: string) => {
    window.history.pushState({}, "", nextPath);
    setPath(nextPath);
  };

  const openLogin = (returnTo = "/dashboard") => {
    const safeReturnTo =
      returnTo.startsWith("/") && !returnTo.startsWith("//")
        ? returnTo
        : "/dashboard";
    navigate(`/login?returnTo=${encodeURIComponent(safeReturnTo)}`);
  };

  if (path === "/login") {
    const returnToParam = new URLSearchParams(window.location.search).get("returnTo");
    const returnTo =
      returnToParam?.startsWith("/") && !returnToParam.startsWith("//")
        ? returnToParam
        : "/dashboard";
    return (
      <LoginPage
        onBack={() => navigate("/")}
        onLogin={() => navigate(returnTo)}
        returnTo={returnTo}
      />
    );
  }

  if (path === "/dashboard") {
    return (
      <Dashboard
        onBack={() => navigate("/")}
        onOpenLogin={() => openLogin("/dashboard")}
      />
    );
  }
  if (path === "/team") {
    return (
      <TeamPage
        onBack={() => navigate("/")}
        onOpenDashboard={() => navigate("/dashboard")}
      />
    );
  }
  return (
    <WelcomePage
      onOpenDashboard={() => navigate("/dashboard")}
      onOpenTeam={() => navigate("/team")}
      onOpenLogin={() => openLogin("/dashboard")}
    />
  );
}
