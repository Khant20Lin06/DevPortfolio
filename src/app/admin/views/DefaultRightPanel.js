import SymbolIcon from "@/components/ui/SymbolIcon";

export default function DefaultRightPanel() {
  return (
    <aside className="hidden h-full w-72 flex-shrink-0 flex-col border-l border-white/5 glass-panel xl:flex">
      <div className="border-b border-white/5 p-6">
        <h2 className="text-lg font-bold text-white">Quick Settings</h2>
      </div>
      <div className="flex-1 space-y-8 overflow-y-auto p-6">
        <section>
          <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">Appearance</h3>
          <div className="flex rounded-lg border border-white/10 bg-[#0a0a12] p-1">
            <button type="button" className="flex-1 rounded-md bg-white/10 py-2 text-sm font-medium text-white">
              Dark
            </button>
            <button type="button" className="flex-1 py-2 text-sm font-medium text-slate-500">
              Light
            </button>
          </div>
        </section>

        <section>
          <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">3D Environment</h3>
          <div className="space-y-6">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-slate-300">Animation Intensity</span>
                <span className="font-mono text-xs text-[#00f0ff]">High</span>
              </div>
              <input type="range" min="0" max="100" defaultValue="80" className="w-full accent-[#00f0ff]" />
            </div>
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-slate-300">Particle Count</span>
                <span className="font-mono text-xs text-[#b794ff]">1200</span>
              </div>
              <input type="range" min="0" max="2000" defaultValue="1200" className="w-full accent-[#7000ff]" />
            </div>
            <label className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Post-Processing Bloom</span>
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-[#00f0ff]" />
            </label>
          </div>
        </section>

        <section className="border-t border-white/10 pt-6">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">System Status</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Database</span>
              <span className="inline-flex items-center gap-1 text-xs text-green-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">CDN Cache</span>
              <span className="text-xs text-green-400">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">API Latency</span>
              <span className="text-xs font-mono text-slate-200">24ms</span>
            </div>
          </div>
        </section>
      </div>
    </aside>
  );
}
