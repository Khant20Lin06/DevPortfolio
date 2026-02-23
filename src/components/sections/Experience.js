import { defaultPortfolioContent } from "@/data/portfolioData";

export default function Experience({ data = defaultPortfolioContent.experience }) {
  return (
    <section id="experience" className="py-24">
      <div className="layout-container mx-auto max-w-[960px] px-4">
        <div className="mb-20 flex flex-col gap-4 text-center">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[#00f0ff] drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]">
            Career Path
          </h2>
          <h3 className="text-3xl font-bold text-white md:text-5xl">Professional Experience</h3>
        </div>

        <div className="relative ml-4 space-y-16 border-l border-white/10 md:ml-0 md:border-none md:pl-0">
          <div className="absolute bottom-0 left-1/2 top-0 hidden w-px -translate-x-1/2 bg-gradient-to-b from-[#00f0ff] via-[#7000ff] to-[#00f0ff] opacity-30 md:block" />

          {data.map((item, index) => {
            const isMiddle = index === 1;
            const isLast = index === data.length - 1;

            const bulletClass = isMiddle
              ? "border-[#7000ff] shadow-[0_0_15px_rgba(112,0,255,0.8)] group-hover:bg-[#7000ff]"
              : isLast
                ? "border-slate-500 group-hover:border-[#00f0ff] group-hover:shadow-[0_0_15px_rgba(0,240,255,0.8)]"
                : "border-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.8)] group-hover:bg-[#00f0ff]";

            const periodClass = isMiddle ? "text-[#7000ff]" : isLast ? "text-slate-500" : "text-[#00f0ff]";
            const cardHoverClass = isMiddle
              ? "group-hover:border-[#7000ff]/30"
              : isLast
                ? "group-hover:border-slate-500/50"
                : "group-hover:border-[#00f0ff]/30";

            return (
              <div
                key={`${item.role}-${item.company}`}
                className={`group relative flex flex-col justify-between md:items-center ${isMiddle ? "md:flex-row-reverse" : "md:flex-row"}`}
              >
                <div
                  className={`absolute -left-[23px] top-1 z-10 h-4 w-4 rounded-full border-2 bg-[#05050a] transition-colors md:left-1/2 md:-ml-[8px] md:top-auto ${bulletClass}`}
                />

                <div
                  className={`pl-8 transition-transform duration-300 md:w-[calc(50%-40px)] md:pl-0 ${
                    isMiddle ? "text-left group-hover:translate-x-2" : "md:text-right group-hover:-translate-x-2"
                  }`}
                >
                  <span className={`mb-2 block font-mono text-sm font-bold tracking-widest ${periodClass}`}>
                    {item.period}
                  </span>
                  <h4 className="mb-1 text-2xl font-bold text-white">{item.role}</h4>
                  <h5 className="font-medium text-slate-400">{item.company}</h5>
                </div>

                <div className="hidden w-[80px] md:block" />

                <div
                  className={`mt-4 rounded-xl border border-white/5 bg-[#0a0a12]/50 p-6 pl-8 text-left transition-all duration-300 md:mt-0 md:w-[calc(50%-40px)] md:pl-0 ${
                    isMiddle ? "md:text-right group-hover:-translate-x-2" : "group-hover:translate-x-2"
                  } ${cardHoverClass}`}
                >
                  <p className="text-sm leading-relaxed text-slate-300">{item.points?.[0] ?? ""}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
