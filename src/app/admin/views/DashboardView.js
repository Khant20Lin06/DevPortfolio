import SymbolIcon from "@/components/ui/SymbolIcon";
import { ASSET_LIBRARY } from "../constants";
import { tagLetters } from "../utils";
import { API_BASE_URL } from "@/lib/apiBase";

const resolveImageUrl = (imageUrl) => {
  const value = String(imageUrl ?? "").trim();
  if (!value) return "/assets/project-shot-1.png";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/uploads/") && API_BASE_URL) {
    return `${API_BASE_URL}${value}`;
  }
  return value;
};

export default function DashboardView({
  projects,
  totalPortfolioViews,
  chatUnreadCount,
  totalSkillCount,
  keys,
  selectedKey,
  setSelectedKey,
  editorText,
  setEditorText,
  onSave,
  savePending,
  editorMessage,
  contentLoading,
  onOpenProjects,
  onOpenMessages,
  onOpenTechStack,
}) {
  const totalViews = Number.isFinite(totalPortfolioViews) ? totalPortfolioViews : 0;
  const unreadChats = Number.isFinite(chatUnreadCount) ? chatUnreadCount : 0;
  const skills = Number.isFinite(totalSkillCount) ? totalSkillCount : 0;

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="relative overflow-hidden rounded-xl border border-white/5 glass-panel p-5">
          <div className="absolute right-4 top-4 opacity-15">
            <SymbolIcon name="visibility" className="h-12 w-12 text-[#00f0ff]" />
          </div>
          <p className="text-sm text-slate-400">Total Portfolio Views</p>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-3xl font-bold text-white">{totalViews.toLocaleString()}</span>
            <span className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-green-400">
              <SymbolIcon name="trending_up" className="h-4 w-4" />
              +12%
            </span>
          </div>
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full w-[72%] bg-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.8)]" />
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-white/5 glass-panel p-5">
          <div className="absolute right-4 top-4 opacity-15">
            <SymbolIcon name="message" className="h-12 w-12 text-[#7000ff]" />
          </div>
          <p className="text-sm text-slate-400">Live Chat Unread</p>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-3xl font-bold text-white">{unreadChats}</span>
            <span className="mb-1 text-xs text-slate-500">active threads</span>
          </div>
          <button
            type="button"
            onClick={onOpenMessages}
            className="mt-4 inline-flex items-center gap-2 rounded border border-[#7000ff]/30 bg-[#7000ff]/10 px-2.5 py-1 text-xs text-[#b794ff] transition-colors hover:bg-[#7000ff]/20"
          >
            Open Live Chat
            <SymbolIcon name="arrow_forward" className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-white/5 glass-panel p-5">
          <div className="absolute right-4 top-4 opacity-15">
            <SymbolIcon name="memory" className="h-12 w-12 text-[#ff003c]" />
          </div>
          <p className="text-sm text-slate-400">Total Skills</p>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-3xl font-bold text-white">{skills}</span>
            <span className="mb-1 text-xs font-semibold text-green-400">configured</span>
          </div>
          <button
            type="button"
            onClick={onOpenTechStack}
            className="mt-4 inline-flex items-center gap-2 rounded border border-[#ff003c]/30 bg-[#ff003c]/10 px-2.5 py-1 text-xs text-[#ff5b80] transition-colors hover:bg-[#ff003c]/20"
          >
            Manage Tech Stack
            <SymbolIcon name="arrow_forward" className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-white/5 glass-panel">
        <div className="flex items-center justify-between border-b border-white/5 p-5">
          <h3 className="text-lg font-bold text-white">Featured Projects</h3>
          <button
            type="button"
            onClick={onOpenProjects}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#0a0a12] px-3 py-1.5 text-xs transition-colors hover:border-[#00f0ff]/40 hover:text-[#00f0ff]"
          >
            <SymbolIcon name="add" className="h-4 w-4" />
            Open Projects Editor
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="border-b border-white/5 bg-[#0a0a12] text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Project Name</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Tech Stack</th>
                <th className="px-5 py-3">Views</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {projects.map((project, index) => (
                <tr key={`${project.title}-${index}`} className="group transition-colors hover:bg-white/5">
                  <td className="px-5 py-4 font-mono text-slate-500">
                    <span className="inline-flex items-center gap-2">
                      <SymbolIcon name="drag_indicator" className="h-4 w-4 cursor-move" />
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={resolveImageUrl(project.image)}
                        alt={project.title}
                        className="h-10 w-10 rounded border border-white/10 object-cover"
                      />
                      <span className="font-medium text-white">{project.title}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full border px-2 py-1 text-[10px] ${
                        project.status === "Published"
                          ? "border-green-500/30 bg-green-500/10 text-green-400"
                          : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
                      }`}
                    >
                      {project.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex -space-x-1">
                      {(Array.isArray(project.tags) ? project.tags : []).map((tag) => (
                        <span
                          key={`${project.title}-${tag}`}
                          className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#0a0a12] text-[10px] text-white"
                          title={tag}
                        >
                          {tagLetters(tag)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4">{project.views}</td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={onOpenProjects}
                      className="rounded p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-[#00f0ff]"
                    >
                      <SymbolIcon name="edit" className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <SymbolIcon name="visibility_off" className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-white/5 glass-panel p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="inline-flex items-center gap-2 text-lg font-bold text-white">
              <SymbolIcon name="view_in_ar" className="h-5 w-5 text-[#00f0ff]" />
              3D Asset Manager
            </h3>
            <span className="text-xs text-slate-500">GLB / GLTF Support</span>
          </div>
          <div className="mb-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] p-8 transition-all hover:border-[#00f0ff]/40 hover:bg-white/[0.04]">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
              <SymbolIcon name="cloud_upload" className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-white">Click to upload or drag & drop</p>
            <p className="mt-1 text-xs text-slate-500">Max file size: 25MB</p>
          </div>
          <div className="space-y-3">
            {ASSET_LIBRARY.slice(0, 2).map((asset) => (
              <div key={asset.name} className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/5 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded border border-white/10 bg-black/50">
                  <SymbolIcon name="deployed_code" className="h-5 w-5 text-[#00f0ff]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{asset.name}.glb</p>
                  <p className="text-xs text-slate-500">
                    {asset.size} - {asset.updatedAt}
                  </p>
                </div>
                <button type="button" className="text-slate-400 transition-colors hover:text-[#ff003c]">
                  <SymbolIcon name="delete" className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/5 glass-panel p-6">
          <h3 className="mb-4 text-lg font-bold text-white">Asset Preview</h3>
          <div className="relative flex min-h-[250px] items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-slate-900 to-black">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl border border-[#00f0ff]/40 bg-[#00f0ff]/10 shadow-[0_0_40px_rgba(0,240,255,0.2)]">
              <SymbolIcon name="view_in_ar" className="h-10 w-10 animate-spin text-[#00f0ff]" />
            </div>
            <span className="absolute left-4 top-4 rounded border border-[#00f0ff]/30 bg-[#00f0ff]/20 px-2 py-1 text-[10px] font-mono text-[#00f0ff]">
              PREVIEW MODE
            </span>
          </div>
        </div>
      </div>

      <section className="rounded-xl border border-white/5 glass-panel p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="inline-flex items-center gap-2 text-lg font-bold text-white">
            <SymbolIcon name="code_blocks" className="h-5 w-5 text-[#7000ff]" />
            Content JSON Editor
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-lg border border-white/10 bg-[#0a0a12] px-3 py-2 text-sm text-white outline-none focus:border-[#00f0ff]/50"
              value={selectedKey}
              onChange={(event) => setSelectedKey(event.target.value)}
              disabled={contentLoading}
            >
              {keys.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onSave}
              disabled={savePending || contentLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-[#00f0ff] px-4 py-2 text-sm font-bold text-[#05050a] transition-all hover:bg-[#00e2ef] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <SymbolIcon name="save" className="h-4 w-4" />
              {savePending ? "Saving..." : "Save Content"}
            </button>
          </div>
        </div>
        <textarea
          className="min-h-[260px] w-full rounded-xl border border-white/10 bg-[#0d0d15] p-4 font-mono text-sm text-slate-200 outline-none transition-colors focus:border-[#7000ff]/50"
          value={editorText}
          onChange={(event) => setEditorText(event.target.value)}
          placeholder='{"title":"..."}'
        />
        {editorMessage?.text ? (
          <p
            className={`mt-3 text-xs ${
              editorMessage.tone === "error"
                ? "text-red-300"
                : editorMessage.tone === "success"
                  ? "text-green-300"
                  : editorMessage.tone === "warn"
                    ? "text-yellow-300"
                    : "text-slate-400"
            }`}
          >
            {editorMessage.text}
          </p>
        ) : null}
      </section>
    </div>
  );
}
