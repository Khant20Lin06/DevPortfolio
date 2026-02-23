import SymbolIcon from "@/components/ui/SymbolIcon";
import { clampPercent, ensureArray, tagLetters } from "../utils";

export default function TechStackView({ skills }) {
  const themes = [
    { bar: "bg-[#00f0ff]", label: "text-[#00f0ff]", border: "hover:border-[#00f0ff]/30" },
    { bar: "bg-[#7000ff]", label: "text-[#b794ff]", border: "hover:border-[#7000ff]/30" },
    { bar: "bg-[#ff003c]", label: "text-[#ff5b80]", border: "hover:border-[#ff003c]/30" },
  ];

  return (
    <div className="flex-1 space-y-8 overflow-y-auto p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Skills", value: "42", icon: "code", color: "text-[#00f0ff] bg-[#00f0ff]/10" },
          { label: "Expert Level", value: "12", icon: "star", color: "text-[#b794ff] bg-[#7000ff]/10" },
          { label: "Public Visible", value: "38", icon: "visibility", color: "text-green-400 bg-green-500/10" },
          { label: "Needs Update", value: "3", icon: "warning", color: "text-[#ff5b80] bg-[#ff003c]/10" },
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

      {skills.map((group, groupIndex) => {
        const theme = themes[groupIndex % themes.length];
        const rows = ensureArray(group.rows);
        return (
          <section key={`${group.title}-${groupIndex}`}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="inline-flex items-center gap-2 text-lg font-bold text-white">
                <span className={`h-6 w-2 rounded-sm ${theme.bar}`} />
                {group.title}
              </h3>
              <span className="rounded border border-white/5 bg-white/5 px-2 py-1 text-xs text-slate-500">
                {rows.length} Skills
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {rows.map((skill) => (
                <article
                  key={`${group.title}-${skill.label}`}
                  className={`group relative rounded-xl border border-white/5 glass-panel p-5 transition-all ${theme.border}`}
                >
                  <div className="absolute right-4 top-4 text-slate-600 group-hover:text-white">
                    <SymbolIcon name="drag_indicator" className="h-4 w-4 cursor-grab" />
                  </div>
                  <div className="mb-4 flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                      <span className="text-xs font-bold text-white">{tagLetters(skill.label || "SK")}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{skill.label}</h4>
                      <p className="text-xs text-slate-400">Technology</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-end justify-between">
                      <span className="text-xs text-slate-400">Proficiency</span>
                      <span className={`text-sm font-mono ${theme.label}`}>{clampPercent(skill.level)}%</span>
                    </div>
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
                      <button type="button" className="rounded p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white">
                        <SymbolIcon name="edit" className="h-4 w-4" />
                      </button>
                      <button type="button" className="rounded p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-[#ff5b80]">
                        <SymbolIcon name="delete" className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
