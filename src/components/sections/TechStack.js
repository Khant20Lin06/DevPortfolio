import { defaultPortfolioContent } from "@/data/portfolioData";
import SymbolIcon from "@/components/ui/SymbolIcon";

const iconNameByIndex = ["html", "dns", "terminal"];

export default function TechStack({ data = defaultPortfolioContent.skills }) {
  return (
    <section id="skills" className="relative overflow-hidden py-24">
      <div className="pointer-events-none absolute right-0 top-0 h-full w-2/3 bg-gradient-to-l from-[#7000ff]/5 to-transparent" />

      <div className="layout-container relative z-10 mx-auto max-w-[1200px] px-4">
        <div className="mb-16 flex flex-col gap-4 text-center">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[#00f0ff] drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]">
            My Arsenal
          </h2>
          <h3 className="text-3xl font-bold text-white md:text-5xl">Technical Skills</h3>
        </div>

        <div className="card-3d-wrapper grid gap-8 md:grid-cols-3">
          {data.map((group, index) => {
            const isTools = index === 2 || /tools/i.test(group.title);
            const isBackend = index === 1;

            const topBar = isTools
              ? "from-emerald-400 to-transparent"
              : isBackend
                ? "from-[#7000ff] to-transparent"
                : "from-[#00f0ff] to-transparent";

            const iconTint = isTools ? "text-emerald-400 border-emerald-400/30" : isBackend ? "text-[#7000ff] border-[#7000ff]/30" : "text-[#00f0ff] border-[#00f0ff]/30";
            const iconGlow = isTools
              ? "bg-emerald-400/10"
              : isBackend
                ? "bg-[#7000ff]/10"
                : "bg-[#00f0ff]/10";

            return (
              <article
                key={group.title}
                className="card-3d group relative overflow-hidden rounded-2xl border border-white/5 bg-[#0a0a12] p-8"
              >
                <div className={`absolute left-0 top-0 h-1 w-full bg-gradient-to-r ${topBar}`} />

                <div
                  className={`relative mb-8 flex h-16 w-16 items-center justify-center rounded-xl border bg-[#05050a] transition-all duration-500 group-hover:-translate-y-[10px] ${iconTint}`}
                >
                  <div className={`absolute inset-0 rounded-xl blur-md ${iconGlow}`} />
                  <SymbolIcon name={iconNameByIndex[index] ?? "code"} className="relative z-10 h-10 w-10" />
                </div>

                <h4 className="mb-6 text-xl font-bold text-white">{group.title}</h4>

                {isTools ? (
                  <div className="flex flex-wrap content-start gap-2">
                    {group.rows.map((item) => (
                      <span
                        key={item.label}
                        className="cursor-default rounded-md border border-emerald-500/20 bg-slate-800 px-3 py-1 text-sm font-medium text-emerald-300 shadow-[0_0_10px_rgba(74,222,128,0.1)] transition-all hover:shadow-[0_0_15px_rgba(74,222,128,0.3)]"
                      >
                        {item.label}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {group.rows.map((item) => (
                      <div key={item.label}>
                        <div className="mb-2 flex justify-between text-sm text-slate-300">
                          <span>{item.label}</span>
                          <span className={isBackend ? "text-[#7000ff]" : "text-[#00f0ff]"}>{item.level}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                          <div
                            className={`h-full rounded-full ${
                              isBackend
                                ? "bg-gradient-to-r from-[#7000ff] to-purple-500 shadow-[0_0_10px_rgba(112,0,255,0.5)]"
                                : "bg-gradient-to-r from-[#00f0ff] to-blue-500 shadow-[0_0_10px_rgba(0,240,255,0.5)]"
                            }`}
                            style={{ width: `${item.level}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
