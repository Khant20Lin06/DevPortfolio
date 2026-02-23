import SymbolIcon from "@/components/ui/SymbolIcon";
import { INQUIRIES, QUICK_REPLIES } from "../constants";
import { initials } from "../utils";

export default function InquiriesView({ selectedInquiryId, setSelectedInquiryId }) {
  const selected = INQUIRIES.find((item) => item.id === selectedInquiryId) ?? INQUIRIES[0];

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <aside className="hidden w-[390px] flex-shrink-0 flex-col border-r border-white/5 glass-panel md:flex">
        <div className="flex items-center justify-between border-b border-white/5 p-4">
          <div className="flex gap-1">
            <button
              type="button"
              className="rounded border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white"
            >
              All
            </button>
            <button
              type="button"
              className="rounded px-3 py-1 text-xs font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              Unread
            </button>
            <button
              type="button"
              className="rounded px-3 py-1 text-xs font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              Starred
            </button>
          </div>
          <button type="button" className="text-slate-400 transition-colors hover:text-[#00f0ff]">
            <SymbolIcon name="filter_list" className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          {INQUIRIES.map((item) => {
            const selectedRow = selectedInquiryId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedInquiryId(item.id)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  selectedRow
                    ? "border-[#00f0ff]/20 bg-[#00f0ff]/5"
                    : "border-transparent hover:bg-white/5"
                }`}
              >
                <div className="mb-1 flex items-start justify-between">
                  <div className="inline-flex items-center gap-2">
                    {item.unread ? <span className="h-2 w-2 animate-pulse rounded-full bg-[#ff003c]" /> : null}
                    <span className={`text-sm ${selectedRow ? "font-bold text-white" : "font-medium text-slate-200"}`}>
                      {item.sender}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">{item.time}</span>
                </div>
                <p className="mb-0.5 truncate text-xs font-medium text-slate-300">{item.subject}</p>
                <p className="text-xs text-slate-500">{item.preview}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span
                      key={`${item.id}-${tag}`}
                      className={`rounded border px-1.5 py-0.5 text-[9px] ${
                        tag.includes("New")
                          ? "border-[#ff003c]/20 bg-[#ff003c]/10 text-[#ff5b80]"
                          : tag === "Replied"
                            ? "border-green-500/20 bg-green-500/10 text-green-400"
                            : "border-blue-500/20 bg-blue-500/10 text-blue-400"
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </aside>
      <section className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-black/20">
        <div className="relative z-10 flex items-center justify-between border-b border-white/5 bg-[#0a0a12]/80 p-6 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#00f0ff] to-blue-600 p-[1px]">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-[#0a0a12] text-sm font-bold text-white">
                {initials(selected.sender)}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{selected.sender}</h3>
              <p className="text-xs text-slate-400">
                {selected.email} Â· {selected.location}
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2">
            <button
              type="button"
              className="rounded p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <SymbolIcon name="archive" className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="rounded p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <SymbolIcon name="delete" className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="rounded p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <SymbolIcon name="more_vert" className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-2xl font-bold text-white">{selected.subject}</h2>
            <span className="rounded bg-white/5 px-2 py-1 text-xs text-slate-500">
              Oct 26, 2023 at 10:42 AM
            </span>
          </div>
          <div className="space-y-4 text-sm leading-relaxed text-slate-300">
            {selected.body.map((line) => (
              <p key={`${selected.id}-${line}`}>{line}</p>
            ))}
          </div>
          <div className="border-t border-white/5 pt-6">
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-500">Attachments</h4>
            <div className="inline-flex cursor-pointer items-center gap-3 rounded-lg border border-white/5 bg-white/5 p-3 transition-colors hover:border-[#00f0ff]/30">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-500/20 text-blue-400">
                <SymbolIcon name="description" className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-white">Project_Brief.pdf</p>
                <p className="text-[10px] text-slate-500">2.4 MB</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 border-t border-white/5 bg-[#0a0a12]/85 p-6 backdrop-blur-md">
          <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
            {QUICK_REPLIES.map((reply) => (
              <button
                key={reply}
                type="button"
                className="whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition-all hover:border-[#00f0ff]/30 hover:bg-[#00f0ff]/10 hover:text-[#00f0ff]"
              >
                {reply}
              </button>
            ))}
          </div>
          <div className="relative">
            <textarea
              className="h-32 w-full resize-none rounded-lg border border-white/10 bg-black/30 p-4 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-[#00f0ff]/50"
              placeholder="Type your reply here..."
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <button
                type="button"
                className="rounded p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <SymbolIcon name="attach_file" className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="rounded p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <SymbolIcon name="image" className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded bg-[#00f0ff] px-4 py-1.5 text-sm font-bold text-[#05050a] shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all hover:bg-[#00e2ef]"
              >
                Send
                <SymbolIcon name="send" className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
