import SymbolIcon from "@/components/ui/SymbolIcon";
import { HERO_PROJECTS } from "../constants";

export default function ProjectEditorView({ projects }) {
  const project = projects[0] ?? HERO_PROJECTS[0];

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-12 gap-8 pb-24">
        <div className="col-span-12 space-y-8 lg:col-span-8">
          <section className="rounded-xl border border-white/5 bg-[#0a0a12] p-6 shadow-xl">
            <h3 className="mb-6 inline-flex items-center gap-2 text-lg font-bold text-white">
              <SymbolIcon name="edit_note" className="h-5 w-5 text-[#00f0ff]" />
              Project Details
            </h3>
            <div className="space-y-6">
              <label className="block">
                <span className="mb-2 block text-sm text-slate-400">Project Title</span>
                <input
                  defaultValue={`${project.title} v2.0`}
                  className="w-full rounded-lg border border-white/10 bg-[#13131f] px-4 py-3 text-white outline-none transition-colors focus:border-[#00f0ff]/60"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-400">Short Description</span>
                <textarea
                  defaultValue={project.description ?? "Project summary..."}
                  className="w-full resize-none rounded-lg border border-white/10 bg-[#13131f] px-4 py-3 text-white outline-none transition-colors focus:border-[#00f0ff]/60"
                  rows={3}
                />
              </label>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm text-slate-400">Client / Company</span>
                  <input
                    defaultValue="Personal Project"
                    className="w-full rounded-lg border border-white/10 bg-[#13131f] px-4 py-3 text-white outline-none transition-colors focus:border-[#00f0ff]/60"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm text-slate-400">Completion Date</span>
                  <input
                    defaultValue="2023-11-15"
                    type="date"
                    className="w-full rounded-lg border border-white/10 bg-[#13131f] px-4 py-3 text-white outline-none transition-colors focus:border-[#00f0ff]/60"
                  />
                </label>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-white/5 bg-[#0a0a12] p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="inline-flex items-center gap-2 text-lg font-bold text-white">
                <SymbolIcon name="code_blocks" className="h-5 w-5 text-[#7000ff]" />
                Technical Challenges
              </h3>
              <button type="button" className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-[#00f0ff]">
                <SymbolIcon name="add" className="h-4 w-4" />
                Add Challenge
              </button>
            </div>
            <div className="space-y-4">
              <div className="overflow-hidden rounded-lg border border-white/10">
                <div className="flex cursor-pointer items-center justify-between bg-[#13131f] p-4 hover:bg-white/5">
                  <span className="font-medium text-slate-200">Real-time WebSocket Latency</span>
                  <SymbolIcon name="expand_more" className="h-4 w-4 text-slate-500" />
                </div>
                <div className="space-y-4 border-t border-white/5 bg-[#05050a] p-4">
                  <textarea
                    defaultValue="Handling thousands of concurrent connections resulted in message queuing delays."
                    rows={2}
                    className="w-full rounded-lg border border-white/10 bg-[#13131f] p-3 text-sm text-slate-200 outline-none focus:border-[#7000ff]/60"
                  />
                  <pre className="overflow-x-auto rounded-lg border border-white/5 bg-[#0d0d15] p-4 text-sm text-slate-300">
{`const optimizeSocket = (socket) => {
  socket.binaryType = 'arraybuffer';
  return new Worker('./socket-worker.js');
};`}
                  </pre>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="col-span-12 space-y-8 lg:col-span-4">
          <section className="rounded-xl border border-white/5 bg-[#0a0a12] p-6 shadow-xl">
            <h3 className="mb-4 inline-flex items-center gap-2 text-lg font-bold text-white">
              <SymbolIcon name="image" className="h-5 w-5 text-[#00f0ff]" />
              Hero Media
            </h3>
            <div className="group relative aspect-video cursor-pointer overflow-hidden rounded-lg border-2 border-dashed border-white/10 bg-[#13131f] transition-colors hover:border-[#00f0ff]/40">
              <img
                src={project.image}
                alt={project.title}
                className="h-full w-full object-cover opacity-45 transition-opacity group-hover:opacity-20"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="mb-3 rounded-full bg-[#05050a] p-3">
                  <SymbolIcon name="cloud_upload" className="h-6 w-6 text-[#00f0ff]" />
                </div>
                <p className="text-sm font-medium text-slate-200">Drop image or video</p>
                <p className="mt-1 text-xs text-slate-500">Max file size: 50MB</p>
              </div>
            </div>
          </section>
          <section className="rounded-xl border border-white/5 bg-[#0a0a12] p-6 shadow-xl">
            <h3 className="mb-4 inline-flex items-center gap-2 text-lg font-bold text-white">
              <SymbolIcon name="memory" className="h-5 w-5 text-[#7000ff]" />
              Tech Stack
            </h3>
            <input
              placeholder="Add technology..."
              className="mb-4 w-full rounded-lg border border-white/10 bg-[#13131f] px-3 py-2 text-sm text-white outline-none focus:border-[#7000ff]/50"
            />
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag, index) => (
                <span
                  key={`${project.title}-${tag}`}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs ${
                    index % 2 === 0
                      ? "border border-[#00f0ff]/20 bg-[#00f0ff]/10 text-[#00f0ff]"
                      : "border border-[#7000ff]/20 bg-[#7000ff]/10 text-[#b794ff]"
                  }`}
                >
                  {tag}
                  <SymbolIcon name="close" className="h-3.5 w-3.5 opacity-70" />
                </span>
              ))}
            </div>
          </section>

          <section className="relative overflow-hidden rounded-xl border border-white/5 bg-[#0a0a12] p-6 shadow-xl">
            <h3 className="mb-4 inline-flex items-center gap-2 text-lg font-bold text-white">
              GitHub Sync
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
            </h3>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-400">Sync stars & contributions</span>
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-[#00f0ff]" />
            </div>
            <label className="block text-xs font-semibold uppercase text-slate-500">Repository URL</label>
            <div className="mt-2 flex overflow-hidden rounded-md border border-white/10">
              <span className="border-r border-white/10 bg-[#13131f] px-3 py-2 text-sm text-slate-400">github.com/</span>
              <input
                defaultValue="alex-dev/fintech-dashboard"
                className="min-w-0 flex-1 bg-[#05050a] px-3 py-2 text-sm text-white outline-none"
              />
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3 text-xs text-slate-400">
              <span>Last synced: 10 mins ago</span>
              <button type="button" className="inline-flex items-center gap-1 text-[#00f0ff]">
                <SymbolIcon name="sync" className="h-3.5 w-3.5" />
                Sync Now
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
