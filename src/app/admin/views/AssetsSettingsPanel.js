import SymbolIcon from "@/components/ui/SymbolIcon";

export default function AssetsSettingsPanel() {
  return (
    <aside className="hidden h-full w-72 flex-shrink-0 flex-col border-l border-white/5 glass-panel xl:flex">
      <div className="border-b border-white/5 p-6">
        <h2 className="inline-flex items-center gap-2 text-lg font-bold text-white">
          <SymbolIcon name="settings" className="h-5 w-5 text-[#00f0ff]" />
          3D Scene Settings
        </h2>
        <p className="mt-1 text-xs text-slate-500">Global adjustments for asset viewer</p>
      </div>
      <div className="flex-1 space-y-8 overflow-y-auto p-6">
        <section>
          <h3 className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <SymbolIcon name="light_mode" className="h-4 w-4" />
            Lighting
          </h3>
          <div className="space-y-5">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-slate-300">Ambient Intensity</span>
                <span className="text-xs font-mono text-[#00f0ff]">1.2</span>
              </div>
              <input type="range" min="0" max="20" defaultValue="12" className="w-full accent-[#00f0ff]" />
            </div>
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-slate-300">Directional Light</span>
                <span className="text-xs font-mono text-white">45 deg</span>
              </div>
              <input type="range" min="0" max="360" defaultValue="45" className="w-full accent-white" />
            </div>
            <label className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Cast Shadows</span>
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-[#00f0ff]" />
            </label>
          </div>
        </section>

        <section className="border-t border-white/10 pt-6">
          <h3 className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <SymbolIcon name="wallpaper" className="h-4 w-4" />
            Environment
          </h3>
          <div className="mb-4 grid grid-cols-3 gap-2">
            <button
              type="button"
              className="h-12 rounded border-2 border-[#00f0ff] bg-gradient-to-br from-slate-700 to-slate-900 shadow-[0_0_10px_rgba(0,240,255,0.3)]"
            />
            <button type="button" className="h-12 rounded border border-white/10 bg-gradient-to-br from-blue-900 to-black" />
            <button
              type="button"
              className="h-12 rounded border border-white/10 bg-gradient-to-br from-purple-900 to-black"
            />
          </div>
          <div className="space-y-5">
            <label className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Show Grid</span>
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-[#7000ff]" />
            </label>
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-slate-300">Blur Background</span>
                <span className="text-xs font-mono text-[#b794ff]">40%</span>
              </div>
              <input type="range" min="0" max="100" defaultValue="40" className="w-full accent-[#7000ff]" />
            </div>
          </div>
        </section>

        <button
          type="button"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          <SymbolIcon name="restart_alt" className="h-4 w-4" />
          Reset to Default
        </button>
      </div>
    </aside>
  );
}
