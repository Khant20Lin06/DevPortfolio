import SymbolIcon from "@/components/ui/SymbolIcon";
import { clampPercent, ensureArray, tagLetters } from "../utils";

export default function TechStackView({
  skills,
  onGroupCreate,
  onGroupChange,
  onGroupDelete,
  onSkillCreate,
  onSkillChange,
  onSkillDelete,
  onSaveSkills,
  savePending,
  dirty,
  isReadOnly,
  message,
}) {
  const themes = [
    { bar: "bg-[#00f0ff]", label: "text-[#00f0ff]", border: "hover:border-[#00f0ff]/30" },
    { bar: "bg-[#7000ff]", label: "text-[#b794ff]", border: "hover:border-[#7000ff]/30" },
    { bar: "bg-[#ff003c]", label: "text-[#ff5b80]", border: "hover:border-[#ff003c]/30" },
  ];
  const groups = ensureArray(skills);
  const rows = groups.flatMap((group) => ensureArray(group.rows));
  const totalSkills = rows.length;
  const expertCount = rows.filter((row) => clampPercent(row.level) >= 80).length;
  const visibleCount = rows.filter((row) => clampPercent(row.level) >= 70).length;
  const needsUpdateCount = rows.filter((row) => clampPercent(row.level) < 50).length;
  const messageTone =
    message?.tone === "error"
      ? "border-red-500/30 bg-red-500/10 text-red-200"
      : message?.tone === "success"
        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
        : message?.tone === "warn"
          ? "border-yellow-400/30 bg-yellow-400/10 text-yellow-200"
          : "border-white/10 bg-white/5 text-slate-300";

  return (
    <div className="flex-1 space-y-8 overflow-y-auto p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">Tech Stack Editor</h3>
          <p className="text-xs text-slate-500">Create, update, and remove skill groups and rows.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onGroupCreate}
            disabled={isReadOnly}
            className="inline-flex items-center gap-2 rounded border border-[#00f0ff]/30 bg-[#00f0ff]/10 px-3 py-1.5 text-xs font-bold text-[#00f0ff] transition-all hover:bg-[#00f0ff]/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <SymbolIcon name="add" className="h-4 w-4" />
            Add Group
          </button>
          <button
            type="button"
            onClick={onSaveSkills}
            disabled={isReadOnly || savePending || !dirty}
            className="inline-flex items-center gap-2 rounded border border-[#22c55e]/30 bg-[#22c55e]/10 px-3 py-1.5 text-xs font-bold text-[#4ade80] transition-all hover:bg-[#22c55e]/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <SymbolIcon name="save" className="h-4 w-4" />
            {savePending ? "Saving..." : "Save Skills"}
          </button>
        </div>
      </div>

      {message?.text ? (
        <div className={`rounded-lg border px-4 py-3 text-xs ${messageTone}`}>{message.text}</div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Skills", value: String(totalSkills), icon: "code", color: "text-[#00f0ff] bg-[#00f0ff]/10" },
          { label: "Expert Level", value: String(expertCount), icon: "star", color: "text-[#b794ff] bg-[#7000ff]/10" },
          { label: "Public Visible", value: String(visibleCount), icon: "visibility", color: "text-green-400 bg-green-500/10" },
          { label: "Needs Update", value: String(needsUpdateCount), icon: "warning", color: "text-[#ff5b80] bg-[#ff003c]/10" },
        ].map((card) => (
          <div key={card.label} className="flex items-center gap-4 rounded-xl border border-white/5 glass-panel p-4">
            <div className={`rounded-lg p-3 ${card.color}`}>
              <SymbolIcon name={card.icon} className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">{card.label}</p>
              <p className="text-xl font-bold text-white">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {groups.map((group, groupIndex) => {
        const theme = themes[groupIndex % themes.length];
        const rows = ensureArray(group.rows);
        return (
          <section key={`${group.title}-${groupIndex}`}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`h-6 w-2 rounded-sm ${theme.bar}`} />
                <input
                  value={group.title ?? ""}
                  disabled={isReadOnly}
                  onChange={(event) => onGroupChange(groupIndex, { title: event.target.value })}
                  className="rounded border border-white/10 bg-[#0a0a12] px-2.5 py-1.5 text-sm font-bold text-white outline-none transition-colors focus:border-[#00f0ff]/40 disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="Group title"
                />
                <input
                  type="color"
                  value={group.accent || "#00dcff"}
                  disabled={isReadOnly}
                  onChange={(event) => onGroupChange(groupIndex, { accent: event.target.value })}
                  className="h-8 w-8 cursor-pointer rounded border border-white/20 bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded border border-white/5 bg-white/5 px-2 py-1 text-xs text-slate-500">
                  {rows.length} Skills
                </span>
                <button
                  type="button"
                  onClick={() => onGroupDelete(groupIndex)}
                  disabled={isReadOnly}
                  className="inline-flex items-center gap-1 rounded border border-[#ff5b80]/30 bg-[#ff003c]/10 px-2 py-1 text-[11px] text-[#ff5b80] transition-colors hover:bg-[#ff003c]/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <SymbolIcon name="delete" className="h-3.5 w-3.5" />
                  Delete Group
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {rows.map((skill, rowIndex) => (
                <article
                  key={`${group.title}-${skill.label}-${rowIndex}`}
                  className={`group relative rounded-xl border border-white/5 glass-panel p-5 transition-all ${theme.border}`}
                >
                  <div className="absolute right-4 top-4 text-slate-600 group-hover:text-white">
                    <SymbolIcon name="drag_indicator" className="h-4 w-4 cursor-grab" />
                  </div>
                  <div className="mb-4 flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                      <span className="text-xs font-bold text-white">{tagLetters(skill.label || "SK")}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <input
                        value={skill.label ?? ""}
                        disabled={isReadOnly}
                        onChange={(event) =>
                          onSkillChange(groupIndex, rowIndex, { label: event.target.value })
                        }
                        className="w-full rounded border border-white/10 bg-[#0a0a12] px-2.5 py-1.5 text-sm font-bold text-white outline-none transition-colors focus:border-[#00f0ff]/40 disabled:cursor-not-allowed disabled:opacity-60"
                        placeholder="Skill name"
                      />
                      <p className="text-xs text-slate-400">Technology</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-end justify-between">
                      <span className="text-xs text-slate-400">Proficiency</span>
                      <span className={`text-sm font-mono ${theme.label}`}>{clampPercent(skill.level)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={clampPercent(skill.level)}
                      disabled={isReadOnly}
                      onChange={(event) =>
                        onSkillChange(groupIndex, rowIndex, {
                          level: Number(event.target.value),
                        })
                      }
                      className="w-full accent-[#00f0ff] disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#0a0a12]">
                      <div
                        className={`${theme.bar} h-full rounded-full`}
                        style={{ width: `${clampPercent(skill.level)}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
                    <label className="inline-flex items-center gap-2 text-xs text-slate-400">
                      <input type="checkbox" defaultChecked={clampPercent(skill.level) >= 70} className="h-4 w-4 accent-[#00f0ff]" />
                      Visible
                    </label>
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onSkillDelete(groupIndex, rowIndex)}
                        disabled={isReadOnly}
                        className="rounded p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-[#ff5b80] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <SymbolIcon name="delete" className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => onSkillCreate(groupIndex)}
                disabled={isReadOnly}
                className="inline-flex items-center gap-2 rounded border border-[#00f0ff]/30 bg-[#00f0ff]/10 px-3 py-1.5 text-xs font-semibold text-[#00f0ff] transition-all hover:bg-[#00f0ff]/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <SymbolIcon name="add" className="h-4 w-4" />
                Add Skill
              </button>
            </div>
          </section>
        );
      })}
    </div>
  );
}
