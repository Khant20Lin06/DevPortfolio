import SymbolIcon from "@/components/ui/SymbolIcon";
import { NAV_ITEMS, accentClass } from "../constants";
import { initials } from "../utils";

export default function AdminSidebar({ activeView, onSelect, user, onLogout }) {
  return (
    <aside className="hidden h-full w-64 flex-shrink-0 flex-col border-r border-white/5 glass-panel lg:flex">
      <div className="flex items-center gap-3 border-b border-white/5 p-6">
        <div className="relative flex size-8 items-center justify-center">
          <div className="absolute inset-0 rounded-lg bg-[#00f0ff]/20 [transform:rotate(3deg)]" />
          <div className="absolute inset-0 rounded-lg border border-[#00f0ff]/50 [transform:rotate(-3deg)]" />
          <SymbolIcon name="terminal" className="relative z-10 h-5 w-5 text-[#00f0ff]" />
        </div>
        <h1 className="text-lg font-bold tracking-tight text-white">
          Admin<span className="text-[#00f0ff]">Panel</span>
        </h1>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
        <a
          href="/"
          className="group flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:border-[#00f0ff]/40 hover:bg-white/10 hover:text-white"
        >
          <SymbolIcon name="arrow_back" className="h-[18px] w-[18px] text-[#00f0ff]" />
          <span>Back to Portfolio</span>
        </a>

        {NAV_ITEMS.map((item) => {
          const palette = accentClass[item.accent] ?? accentClass.primary;
          const selected = activeView === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                selected ? palette.active : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <SymbolIcon
                name={item.icon}
                className={`h-[18px] w-[18px] ${selected ? palette.icon : palette.hoverIcon}`}
              />
              <span>{item.label}</span>

              {item.helper?.kind === "pill" ? (
                <span className="ml-auto rounded border border-[#22c55e]/30 bg-[#22c55e]/20 px-1.5 py-0.5 text-[10px] text-[#4ade80]">
                  {item.helper.label}
                </span>
              ) : null}

              {item.helper?.kind === "badge" ? (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-[#ff003c] text-[10px] font-bold text-white">
                  {item.helper.label}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/5 p-4">
        <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-[#0a0a12] p-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#00f0ff] to-[#7000ff] p-[1px]">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-[#0a0a12] text-xs font-bold text-white">
              {initials(user?.name || user?.email || "AD")}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user?.name || "Alex Developer"}</p>
            <p className="truncate text-xs text-slate-500">{user?.role || "Super Admin"}</p>
          </div>
          <button
            type="button"
            className="text-slate-400 transition-colors hover:text-white"
            onClick={onLogout}
            aria-label="Sign out"
          >
            <SymbolIcon name="logout" className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </aside>
  );
}
