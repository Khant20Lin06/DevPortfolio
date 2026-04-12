import { emptyPortfolioContent } from "@/data/portfolioData";

export default function GithubActivity({ data = emptyPortfolioContent.contributions }) {
  const safeData = Array.isArray(data) ? data : [];
  const maxValue = safeData.length > 0 ? Math.max(...safeData) : 0;

  return (
    <section className="relative overflow-hidden border-y border-white/5 bg-[#0a0a12] py-16">
      <div className="absolute inset-0 bg-[#00f0ff]/5 opacity-50" />

      <div className="layout-container relative z-10 mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-12 px-4 md:flex-row">
        <div className="flex flex-col gap-3">
          <h3 className="text-3xl font-bold text-white">
            GitHub <span className="text-[#00f0ff]">Contributions</span>
          </h3>
          <p className="text-base text-slate-400">1,240 contributions in the last year</p>
          <div className="mt-2 flex gap-2">
            <span className="h-3 w-3 rounded-sm border border-white/10 bg-[#0e1117]" />
            <span className="h-3 w-3 rounded-sm bg-[#00f0ff]/30" />
            <span className="h-3 w-3 rounded-sm bg-[#00f0ff]/60" />
            <span className="h-3 w-3 rounded-sm bg-[#00f0ff] shadow-[0_0_5px_#00f0ff]" />
          </div>
        </div>

        {safeData.length > 0 ? (
          <div className="mask-gradient hide-scrollbar flex h-[180px] items-end overflow-x-auto px-4 pb-4 pt-8">
            <div className="bar-3d-container">
              {safeData.map((value, index) => {
                const height = maxValue > 0 ? Math.max(16, Math.round((value / maxValue) * 100)) : 16;
                return <div key={`${value}-${index}`} className="bar-3d" style={{ height: `${height}%` }} />;
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-[#0d1222]/50 px-6 py-12 text-sm text-slate-500">
            No GitHub activity published yet.
          </div>
        )}
      </div>
    </section>
  );
}
