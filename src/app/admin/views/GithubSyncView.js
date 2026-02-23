import SymbolIcon from "@/components/ui/SymbolIcon";

export default function GithubSyncView({ projects }) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <section className="mx-auto max-w-3xl space-y-6 rounded-xl border border-white/5 glass-panel p-6">
        <h3 className="text-lg font-bold text-white">Repository Sync Configuration</h3>
        <div className="rounded-lg border border-white/10 bg-[#0a0a12] p-4">
          <label className="mb-2 block text-xs font-semibold uppercase text-slate-500">Repository URL</label>
          <div className="flex overflow-hidden rounded-md border border-white/10 bg-[#0a0a12]">
            <span className="border-r border-white/10 bg-[#13131f] px-3 py-2 text-sm text-slate-400">github.com/</span>
            <input
              defaultValue="alex-dev/fintech-dashboard"
              className="min-w-0 flex-1 bg-[#05050a] px-3 py-2 text-sm text-white outline-none"
            />
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-white/10 bg-[#0a0a12] p-4">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>Auto-sync contributions</span>
            <input type="checkbox" defaultChecked className="h-4 w-4 accent-[#00f0ff]" />
          </div>
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>Sync stars, forks, watchers</span>
            <input type="checkbox" defaultChecked className="h-4 w-4 accent-[#7000ff]" />
          </div>
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>Sync release metadata</span>
            <input type="checkbox" className="h-4 w-4 accent-[#ff003c]" />
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-white/10 bg-[#0a0a12] p-4">
          <h4 className="text-sm font-semibold text-white">Preview</h4>
          <div className="space-y-2">
            {projects.map((project) => (
              <div key={project.title} className="flex items-center justify-between text-xs text-slate-400">
                <span>{project.title}</span>
                <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px]">
                  {project.views} views
                </span>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="inline-flex w-full items-center justify-center gap-2 rounded bg-[#00f0ff] px-4 py-2 text-sm font-bold text-[#05050a] shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all hover:bg-[#00e2ef]"
        >
          <SymbolIcon name="sync" className="h-4 w-4" />
          Run Sync Now
        </button>
      </section>
    </div>
  );
}
