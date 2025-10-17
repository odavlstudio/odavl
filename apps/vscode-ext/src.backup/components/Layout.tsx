import { Outlet, NavLink, useLocation } from "react-router-dom";
import { PageTransition } from "./PageTransition";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/recipes", label: "Recipes" },
  { to: "/activity", label: "Activity" },
  { to: "/config", label: "Config" },
  { to: "/intelligence", label: "Intelligence" },
  { to: "/insights", label: "Insights" },
];

export default function Layout() {
  const location = useLocation();
  return (
    <div className="flex h-screen">
      <aside className="w-56 bg-background border-r flex flex-col">
        <nav className="flex-1 py-6 px-2">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `block rounded px-3 py-2 font-medium transition-colors ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <PageTransition keyProp={location.pathname}>
          <Outlet />
        </PageTransition>
      </main>
    </div>
  );
}
