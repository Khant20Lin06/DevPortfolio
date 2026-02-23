import SymbolIcon from "@/components/ui/SymbolIcon";

export default function TechInsightsPanel({ projects }) {
  return (
    <aside className="hidden h-full w-80 flex-shrink-0 flex-col border-l border-white/5 glass-panel xl:flex">
      <div className="flex items-center justify-between border-b border-white/5 p-6">
        <h2 className="text-lg font-bold text-white">Quick Insights</h2>
        <button type="button" className="text-slate-400 transition-colors hover:text-[#00f0ff]">
          <SymbolIcon name="refresh" className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 space-y-8 overflow-y-auto p-6">
        <section>
          <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">Skill Usage in Projects</h3>
          <div className="space-y-4">
            {[
              { label: "React.js", count: "8 Projects", color: "text-[#00f0ff] bg-[#00f0ff]/10 border-[#00f0ff]/20" },
              { label: "Node.js", count: "5 Projects", color: "text-[#b794ff] bg-[#7000ff]/10 border-[#7000ff]/20" },
              { label: "PostgreSQL", count: "3 Projects", color: "text-[#ff5b80] bg-[#ff003c]/10 border-[#ff003c]/20" },
            ].map((item, index) => (
              <div key={item.label} className="rounded-xl border border-white/10 bg-[#0a0a12] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{item.label}</span>
                  <span className={`rounded border px-1.5 py-0.5 text-xs ${item.color}`}>{item.count}</span>
                </div>
                <div className="mb-2 flex -space-x-2">
                  {projects.slice(0, Math.min(3, projects.length - index)).map((project) => (
                    <img
                      key={`${item.label}-${project.title}`}
                      src={project.image}
                      alt={project.title}
                      className="h-6 w-6 rounded-full ring-2 ring-[#0a0a12]"
                    />
                  ))}
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[8px] text-white ring-2 ring-[#0a0a12]">
                    +{index + 2}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">Skill Gap Analysis</h3>
          <div className="rounded-xl border border-white/5 bg-gradient-to-br from-[#0a0a12] to-slate-900 p-4">
            <p className="mb-2 text-sm text-slate-300">Missing from Portfolio:</p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded border border-red-500/20 bg-red-500/10 px-2 py-1 text-[10px] font-mono text-red-400">
                Mobile (Flutter)
              </span>
              <span className="rounded border border-red-500/20 bg-red-500/10 px-2 py-1 text-[10px] font-mono text-red-400">
                GoLang
              </span>
            </div>
            <p className="mt-4 border-t border-white/5 pt-4 text-[10px] text-slate-500">
              Suggestion: Add a mobile-focused project to balance backend expertise.
            </p>
          </div>
        </section>
      </div>
    </aside>
  );
}
