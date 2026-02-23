import SymbolIcon from "@/components/ui/SymbolIcon";

const formatTime = (value) => {
  try {
    return new Date(value).toLocaleString();
  } catch (_error) {
    return value;
  }
};

export default function NotificationPanel({ notifications, onClose, onClear }) {
  return (
    <div className="fixed right-6 top-[78px] z-50 w-[360px] max-w-[90vw] rounded-2xl border border-white/10 bg-[#0a0a12] p-4 text-slate-100 shadow-[0_0_35px_rgba(0,0,0,0.45)]">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Notifications</h3>
          <p className="text-[11px] text-slate-500">Latest activity</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClear}
            className="text-[11px] text-slate-400 transition-colors hover:text-[#00f0ff]"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 transition-colors hover:text-white"
            aria-label="Close notifications"
          >
            <SymbolIcon name="close" className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1 text-xs">
        {notifications.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-4 text-center text-slate-500">
            No notifications yet.
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-white/10 bg-[#0d1222] p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-[#00f0ff]">
                  {item.type || "system"}
                </span>
                <span className="text-[10px] text-slate-500">{formatTime(item.createdAt)}</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-white">{item.title}</p>
              {item.body ? <p className="mt-1 text-xs text-slate-400">{item.body}</p> : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
