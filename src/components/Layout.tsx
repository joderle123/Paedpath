import { NavLink, Outlet } from "react-router-dom";
import {
  Map,
  UserX,
  GraduationCap,
  Users,
  BarChart3,
  Settings as SettingsIcon,
} from "lucide-react";

const NAV = [
  { to: "/", label: "Karte", icon: Map, end: true },
  { to: "/absences", label: "Ausfall & Ersatz", icon: UserX },
  { to: "/classes", label: "Klassen", icon: GraduationCap },
  { to: "/people", label: "Personen", icon: Users },
  { to: "/statistics", label: "Statistik", icon: BarChart3 },
  { to: "/settings", label: "Einstellungen", icon: SettingsIcon },
];

export default function Layout() {
  return (
    <div className="flex h-full">
      <aside className="w-60 shrink-0 border-r border-edge bg-abyss/70 flex flex-col">
        <div className="px-5 py-5 border-b border-edge">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan shadow-[0_0_10px_2px_rgba(53,214,240,0.7)]" />
            <span
              className="text-ink font-bold tracking-wide"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              CDSE·PLAN
            </span>
          </div>
          <div className="label-tech mt-1">Classes de participation</div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-panel-2 text-ink border border-edge-2 shadow-[0_0_12px_rgba(53,214,240,0.12)]"
                    : "text-muted hover:text-ink hover:bg-panel-2/60 border border-transparent",
                ].join(" ")
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-edge label-tech">
          Lokal gespeichert · v1
        </div>
      </aside>

      <main className="flex-1 overflow-auto grid-bg">
        <Outlet />
      </main>
    </div>
  );
}
