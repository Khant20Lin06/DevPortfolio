import SymbolIcon from "@/components/ui/SymbolIcon";
import { viewMeta } from "../constants";

export default function AdminHeader({
  activeView,
  onSaveContent,
  savePending,
  selectedKey,
  onCreateProject,
  onSaveProjects,
  projectsSavePending,
  projectsDirty,
  onCreateSkillGroup,
  onSaveSkills,
  skillsSavePending,
  skillsDirty,
  isReadOnlyUser,
  notificationCount = 0,
  onToggleNotifications,
  pushStatus = "idle",
  onEnablePush,
}) {
  const meta = viewMeta[activeView] ?? viewMeta.dashboard;

  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-white/5 px-6 glass-panel">
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">{meta.title}</h2>
          <p className="text-xs text-slate-500">{meta.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {activeView === "dashboard" ? (
          <button
            type="button"
            onClick={onSaveContent}
            disabled={savePending}
            className="inline-flex items-center gap-2 rounded border border-[#00f0ff]/30 bg-[#00f0ff]/10 px-3 py-1.5 text-xs font-bold text-[#00f0ff] transition-all hover:bg-[#00f0ff]/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <SymbolIcon name="rocket_launch" className="h-4 w-4" />
            {savePending ? "Saving..." : `Deploy ${selectedKey}`}
          </button>
        ) : null}

        {activeView === "projects" ? (
          <>
            <button
              type="button"
              onClick={onCreateProject}
              disabled={isReadOnlyUser}
              className="inline-flex items-center gap-2 rounded border border-[#00f0ff]/30 bg-[#00f0ff]/10 px-3 py-1.5 text-xs font-bold text-[#00f0ff] transition-all hover:bg-[#00f0ff]/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <SymbolIcon name="add" className="h-4 w-4" />
              New Project
            </button>
            <button
              type="button"
              onClick={onSaveProjects}
              disabled={isReadOnlyUser || projectsSavePending || !projectsDirty}
              className="inline-flex items-center gap-2 rounded border border-[#22c55e]/30 bg-[#22c55e]/10 px-3 py-1.5 text-xs font-bold text-[#4ade80] transition-all hover:bg-[#22c55e]/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <SymbolIcon name="save" className="h-4 w-4" />
              {projectsSavePending ? "Saving..." : "Save Changes"}
            </button>
            <div className="relative hidden md:block">
              <SymbolIcon name="search" className="absolute left-2 top-1.5 h-4 w-4 text-slate-500" />
              <input
                className="w-64 rounded-lg border border-white/10 bg-[#0a0a12] py-1.5 pl-8 pr-3 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-[#00f0ff]/50"
                placeholder="Search projects..."
              />
            </div>
          </>
        ) : null}

        {activeView === "assets" ? (
          <>
            <div className="relative hidden md:block">
              <SymbolIcon name="search" className="absolute left-2.5 top-1.5 h-4 w-4 text-slate-500" />
              <input
                className="w-56 rounded-lg border border-white/10 bg-[#0a0a12] py-1.5 pl-8 pr-3 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-[#00f0ff]/50"
                placeholder="Search models..."
              />
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded bg-[#00f0ff] px-3 py-1.5 text-xs font-bold text-[#05050a] shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all hover:bg-[#00e2ef]"
            >
              <SymbolIcon name="cloud_upload" className="h-4 w-4" />
              Upload New
            </button>
          </>
        ) : null}

        {activeView === "inquiries" ? (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded border border-[#00f0ff]/30 bg-[#00f0ff]/10 px-3 py-1.5 text-xs font-bold text-[#00f0ff] transition-all hover:bg-[#00f0ff]/20"
          >
            <SymbolIcon name="mark_email_read" className="h-4 w-4" />
            Mark All Read
          </button>
        ) : null}

        {activeView === "tech-stack" ? (
          <>
            <button
              type="button"
              onClick={onCreateSkillGroup}
              disabled={isReadOnlyUser}
              className="inline-flex items-center gap-2 rounded border border-[#00f0ff]/30 bg-[#00f0ff]/10 px-3 py-1.5 text-xs font-bold text-[#00f0ff] transition-all hover:bg-[#00f0ff]/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <SymbolIcon name="add" className="h-4 w-4" />
              Add Group
            </button>
            <button
              type="button"
              onClick={onSaveSkills}
              disabled={isReadOnlyUser || skillsSavePending || !skillsDirty}
              className="inline-flex items-center gap-2 rounded border border-[#22c55e]/30 bg-[#22c55e]/10 px-3 py-1.5 text-xs font-bold text-[#4ade80] transition-all hover:bg-[#22c55e]/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <SymbolIcon name="save" className="h-4 w-4" />
              {skillsSavePending ? "Saving..." : "Save Skills"}
            </button>
          </>
        ) : null}

        {activeView === "github-sync" ? (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded border border-[#22c55e]/30 bg-[#22c55e]/10 px-3 py-1.5 text-xs font-bold text-[#4ade80] transition-all hover:bg-[#22c55e]/20"
          >
            <SymbolIcon name="sync" className="h-4 w-4" />
            Sync Now
          </button>
        ) : null}

        {pushStatus !== "enabled" ? (
          <button
            type="button"
            onClick={onEnablePush}
            disabled={pushStatus === "loading"}
            className="inline-flex items-center gap-2 rounded border border-[#00f0ff]/30 bg-[#00f0ff]/10 px-3 py-1.5 text-[11px] font-bold text-[#00f0ff] transition-all hover:bg-[#00f0ff]/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <SymbolIcon name="notifications" className="h-4 w-4" />
            {pushStatus === "loading" ? "Enabling..." : "Enable Alerts"}
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-300">
            Alerts On
          </span>
        )}

        <div className="h-6 w-px bg-white/10" />
        <button
          type="button"
          onClick={onToggleNotifications}
          className="relative text-slate-400 transition-colors hover:text-[#00f0ff]"
          aria-label="Notifications"
        >
          <SymbolIcon name="notifications" className="h-[18px] w-[18px]" />
          {notificationCount > 0 ? (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#ff003c] px-1 text-[9px] font-bold text-white">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          ) : null}
        </button>
        <button type="button" className="text-slate-400 transition-colors hover:text-[#00f0ff]">
          <SymbolIcon name="settings" className="h-[18px] w-[18px]" />
        </button>
      </div>
    </header>
  );
}
