import SymbolIcon from "@/components/ui/SymbolIcon";
import { ASSET_LIBRARY } from "../constants";

export default function AssetsView() {
  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6">
      <div className="group relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] p-8 text-center transition-all hover:border-[#00f0ff]/40 hover:bg-white/[0.04]">
        <div className="absolute inset-0 bg-gradient-to-r from-[#00f0ff]/5 via-transparent to-[#7000ff]/5 opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="relative z-10 mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
          <SymbolIcon name="upload_file" className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="relative z-10 text-lg font-bold text-white">Drag & Drop 3D Models</h3>
        <p className="relative z-10 mt-1 text-sm text-slate-400">
          Support for .GLB, .GLTF, .OBJ (Max 50MB)
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-white"
          >
            All Assets
          </button>
          <button
            type="button"
            className="rounded-lg border border-transparent px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:border-white/10 hover:bg-white/5 hover:text-white"
          >
            Characters
          </button>
          <button
            type="button"
            className="rounded-lg border border-transparent px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:border-white/10 hover:bg-white/5 hover:text-white"
          >
            Environment
          </button>
          <button
            type="button"
            className="rounded-lg border border-transparent px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:border-white/10 hover:bg-white/5 hover:text-white"
          >
            Props
          </button>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Sort by:</span>
          <select className="cursor-pointer border-none bg-transparent text-slate-300 outline-none">
            <option>Newest First</option>
            <option>Size: High to Low</option>
            <option>Polycount: High to Low</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {ASSET_LIBRARY.map((asset) => (
          <article
            key={asset.name}
            className="group relative overflow-hidden rounded-xl border border-white/5 glass-panel p-5"
          >
            <div className="flex items-center gap-4">
              <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-white/10 bg-black/40">
                <img src={asset.image} alt={asset.name} className="h-full w-full object-cover opacity-80" />
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${asset.glow} opacity-70 transition-opacity group-hover:opacity-100`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-semibold text-white">{asset.name}</h4>
                <p className="text-xs text-slate-500">
                  {asset.type} · {asset.size}
                </p>
              </div>
              <button type="button" className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-300 hover:border-[#00f0ff]/40 hover:text-white">
                Open
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-slate-400">
              <div>
                <p className="text-[10px] uppercase text-slate-500">Updated</p>
                <p>{asset.updatedAt}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-500">Polys</p>
                <p>{asset.polys}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-500">Materials</p>
                <p>{asset.materials}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="rounded border border-white/10 bg-white/5 px-2 py-1 text-slate-300">{asset.usedIn}</span>
              <div className="flex items-center gap-2">
                <button type="button" className="rounded p-2 text-slate-400 transition-colors hover:text-white">
                  <SymbolIcon name="edit" className="h-4 w-4" />
                </button>
                <button type="button" className="rounded p-2 text-slate-400 transition-colors hover:text-[#ff5b80]">
                  <SymbolIcon name="delete" className="h-4 w-4" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
