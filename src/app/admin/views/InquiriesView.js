import SymbolIcon from "@/components/ui/SymbolIcon";
import { useEffect, useState } from "react";
import { INQUIRIES, QUICK_REPLIES } from "../constants";
import { initials } from "../utils";

const safeArray = (value) => (Array.isArray(value) ? value : []);

const formatInquiryTime = (createdAt, fallback = "") => {
  if (!createdAt) return fallback;
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString();
};

const toBodyLines = (item) => {
  if (Array.isArray(item?.body) && item.body.length > 0) return item.body;
  const raw = String(item?.message ?? item?.preview ?? "").trim();
  if (!raw) return [];
  return raw.split(/\r?\n+/).filter(Boolean);
};

export default function InquiriesView({
  selectedInquiryId,
  setSelectedInquiryId,
  inquiries = [],
  loading = false,
  saving = false,
  crudMessage = null,
  onSelectInquiry,
  onCreateInquiry,
  onUpdateInquiry,
  onDeleteInquiry,
}) {
  const items = safeArray(inquiries).length ? safeArray(inquiries) : INQUIRIES;
  const selected = items.find((item) => item.id === selectedInquiryId) ?? items[0] ?? null;

  if (!selected) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-slate-500">
        No inquiries found.
      </div>
    );
  }

  const selectedBodyLines = toBodyLines(selected);
  const selectedTime = formatInquiryTime(selected.createdAt, selected.time);
  const selectedTags = safeArray(selected.tags);
  const [draftName, setDraftName] = useState(String(selected.sender ?? ""));
  const [draftEmail, setDraftEmail] = useState(String(selected.email ?? ""));
  const [draftMessage, setDraftMessage] = useState(String(selected.message ?? ""));

  useEffect(() => {
    setDraftName(String(selected.sender ?? ""));
    setDraftEmail(String(selected.email ?? ""));
    setDraftMessage(String(selected.message ?? ""));
  }, [selected.id, selected.sender, selected.email, selected.message]);

  const messageTone =
    crudMessage?.tone === "error"
      ? "border-red-500/30 bg-red-500/10 text-red-200"
      : crudMessage?.tone === "success"
        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
        : crudMessage?.tone === "warn"
          ? "border-yellow-400/30 bg-yellow-400/10 text-yellow-200"
          : "border-white/10 bg-white/5 text-slate-300";

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
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() =>
                onCreateInquiry?.({
                  name: "New Visitor",
                  email: `visitor-${Date.now()}@example.com`,
                  message: "New contact inquiry message.",
                })
              }
              disabled={saving}
              className="inline-flex items-center gap-1 rounded border border-[#00f0ff]/30 bg-[#00f0ff]/10 px-2 py-1 text-[11px] text-[#00f0ff] transition-colors hover:bg-[#00f0ff]/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <SymbolIcon name="add" className="h-3.5 w-3.5" />
              Add
            </button>
            <button type="button" className="text-slate-400 transition-colors hover:text-[#00f0ff]">
              <SymbolIcon name="filter_list" className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          {loading ? <div className="px-3 py-4 text-xs text-slate-500">Loading inquiries...</div> : null}
          {items.map((item) => {
            const selectedRow = selectedInquiryId === item.id;
            const tags = safeArray(item.tags);
            const preview = item.preview ?? item.message ?? "";
            const subject = item.subject ?? "Portfolio Contact Inquiry";
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (onSelectInquiry) {
                    onSelectInquiry(item.id);
                  } else {
                    setSelectedInquiryId(item.id);
                  }
                }}
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
                  <span className="text-[10px] text-slate-500">{formatInquiryTime(item.createdAt, item.time)}</span>
                </div>
                <p className="mb-0.5 truncate text-xs font-medium text-slate-300">{subject}</p>
                <p className="text-xs text-slate-500">{preview}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {tags.map((tag) => (
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
              <p className="text-xs text-slate-400">{selected.email} · {selected.location || "Portfolio Contact"}</p>
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
            <h2 className="text-2xl font-bold text-white">{selected.subject || "Portfolio Contact Inquiry"}</h2>
            <span className="rounded bg-white/5 px-2 py-1 text-xs text-slate-500">{selectedTime || "-"}</span>
          </div>
          <div className="space-y-4 text-sm leading-relaxed text-slate-300">
            {selectedBodyLines.map((line) => (
              <p key={`${selected.id}-${line}`}>{line}</p>
            ))}
          </div>
          <div className="border-t border-white/5 pt-6">
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-500">Metadata</h4>
            <div className="inline-flex items-center gap-3 rounded-lg border border-white/5 bg-white/5 p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-[#00f0ff]/20 text-[#00f0ff]">
                <SymbolIcon name="mail" className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-white">Inquiry ID: {selected.id}</p>
                <p className="text-[10px] text-slate-500">{selectedTime || "-"}</p>
              </div>
            </div>
            {selectedTags.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <span
                    key={`${selected.id}-meta-${tag}`}
                    className="rounded border border-[#00f0ff]/20 bg-[#00f0ff]/10 px-2 py-0.5 text-[10px] text-[#9ff7ff]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="relative z-10 border-t border-white/5 bg-[#0a0a12]/85 p-6 backdrop-blur-md">
          {crudMessage?.text ? (
            <div className={`mb-3 rounded border px-3 py-2 text-xs ${messageTone}`}>{crudMessage.text}</div>
          ) : null}

          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-[10px] uppercase text-slate-500">Name</span>
              <input
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                disabled={saving}
                className="w-full rounded border border-white/10 bg-black/30 px-2.5 py-2 text-xs text-white outline-none transition-colors focus:border-[#00f0ff]/40 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] uppercase text-slate-500">Email</span>
              <input
                value={draftEmail}
                onChange={(event) => setDraftEmail(event.target.value)}
                disabled={saving}
                className="w-full rounded border border-white/10 bg-black/30 px-2.5 py-2 text-xs text-white outline-none transition-colors focus:border-[#00f0ff]/40 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>
          </div>

          <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
            {QUICK_REPLIES.map((reply) => (
              <button
                key={reply}
                type="button"
                onClick={() => setDraftMessage((prev) => `${prev}\n${reply}`.trim())}
                className="whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition-all hover:border-[#00f0ff]/30 hover:bg-[#00f0ff]/10 hover:text-[#00f0ff]"
              >
                {reply}
              </button>
            ))}
          </div>
          <div className="relative">
            <textarea
              className="h-32 w-full resize-none rounded-lg border border-white/10 bg-black/30 p-4 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-[#00f0ff]/50"
              placeholder="Inquiry message..."
              value={draftMessage}
              onChange={(event) => setDraftMessage(event.target.value)}
              disabled={saving}
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  onUpdateInquiry?.(selected.id, {
                    name: draftName,
                    email: draftEmail,
                    message: draftMessage,
                  })
                }
                className="inline-flex items-center gap-2 rounded bg-[#00f0ff] px-4 py-1.5 text-sm font-bold text-[#05050a] shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all hover:bg-[#00e2ef] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Update"}
                <SymbolIcon name="save" className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => onDeleteInquiry?.(selected.id)}
                className="inline-flex items-center gap-2 rounded border border-[#ff5b80]/30 bg-[#ff003c]/10 px-3 py-1.5 text-xs font-semibold text-[#ff5b80] transition-all hover:bg-[#ff003c]/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Delete
                <SymbolIcon name="delete" className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
