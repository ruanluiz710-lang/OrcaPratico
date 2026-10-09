import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import HistoryPage from "./pages/HistoryPage";
import ProfilePage from "./pages/ProfilePage";
import DocFormPage from "./pages/DocFormPage";
import DocViewPage from "./pages/DocViewPage";

const tabs = [
  { to: "/", label: "Novo", icon: "＋" },
  { to: "/historico", label: "Histórico", icon: "☰" },
  { to: "/perfil", label: "Meus dados", icon: "☺" },
];

export default function App() {
  return (
    <div className="mx-auto min-h-dvh max-w-xl px-4 pb-28 pt-5">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/historico" element={<HistoryPage />} />
        <Route path="/perfil" element={<ProfilePage />} />
        <Route path="/novo/:kind" element={<DocFormPage />} />
        <Route path="/editar/:id" element={<DocFormPage />} />
        <Route path="/doc/:id" element={<DocViewPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]">
        <ul className="mx-auto flex max-w-xl">
          {tabs.map((t) => (
            <li key={t.to} className="flex-1">
              <NavLink
                to={t.to}
                end={t.to === "/"}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 py-2.5 text-xs font-semibold ${isActive ? "text-emerald-700" : "text-slate-500"}`
                }
              >
                <span className="text-xl leading-none" aria-hidden>
                  {t.icon}
                </span>
                {t.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
