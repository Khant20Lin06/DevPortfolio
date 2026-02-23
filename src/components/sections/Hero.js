import { defaultPortfolioContent } from "@/data/portfolioData";
import HeroCubeScene from "@/components/three/HeroCubeScene";
import SymbolIcon from "@/components/ui/SymbolIcon";

export default function Hero({ data = defaultPortfolioContent.hero }) {
  return (
    <section id="home" className="relative flex min-h-[90vh] items-center justify-center overflow-hidden px-4 py-20">
      <div className="pointer-events-none absolute inset-0 opacity-30 hero-grid-bg" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-[#05050a]/80 to-[#05050a]" />
      <div className="absolute -right-[10%] -top-[20%] h-[600px] w-[600px] animate-pulse rounded-full bg-[#7000ff]/20 blur-[120px]" />
      <div className="absolute -left-[10%] top-[40%] h-[500px] w-[500px] animate-pulse rounded-full bg-[#00f0ff]/10 blur-[120px] [animation-delay:700ms]" />

      <div className="layout-container z-10 flex w-full max-w-[1200px] flex-col items-center justify-between gap-12 lg:flex-row">
        <div className="flex flex-1 flex-col gap-8 text-center lg:text-left">
          <div className="mx-auto inline-flex w-fit items-center gap-3 rounded-full border border-[#00f0ff]/30 bg-[#0a0a12]/80 px-4 py-2 shadow-[0_0_15px_rgba(0,240,255,0.15)] backdrop-blur-md lg:mx-0">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00f0ff] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00f0ff]" />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-[#00f0ff]">{data.badge}</span>
          </div>

          <h1 className="text-5xl font-bold leading-[1.1] tracking-[-0.033em] text-white drop-shadow-lg md:text-7xl">
            {data.titlePrefix}
            <br />
            <span
              className="animate-gradient-x bg-gradient-to-r from-[#00f0ff] via-white to-[#7000ff] bg-clip-text text-transparent"
              style={{ backgroundSize: "200% auto" }}
            >
              {data.titleHighlight}
            </span>
          </h1>

          <p className="mx-auto max-w-2xl border-l-2 border-[#00f0ff]/50 pl-6 text-lg font-light leading-relaxed text-slate-400 md:text-xl lg:mx-0">
            {data.description}
          </p>

          <div className="flex flex-wrap justify-center gap-6 pt-4 lg:justify-start">
            <a
              href={data.primaryCtaTarget}
              className="group relative flex h-14 items-center justify-center overflow-hidden rounded-lg border border-[#00f0ff] bg-[#00f0ff]/10 px-8 text-base font-bold text-[#00f0ff] shadow-[0_0_20px_rgba(0,240,255,0.2)] transition-all hover:bg-[#00f0ff] hover:text-black hover:shadow-[0_0_30px_rgba(0,240,255,0.6)]"
            >
              <span className="relative z-10">{data.primaryCtaLabel}</span>
              <span className="absolute inset-0 origin-left scale-x-0 bg-[#00f0ff] transition-transform duration-300 group-hover:scale-x-100" />
            </a>

            <a
              href={data.secondaryCtaTarget}
              className="flex h-14 items-center justify-center rounded-lg border border-white/10 bg-[#0a0a12] px-8 text-base font-bold text-white transition-all hover:border-white/30 hover:bg-white/5"
            >
              {data.secondaryCtaLabel}
            </a>
          </div>

          <div className="flex items-center justify-center gap-8 pt-4 lg:justify-start">
            <a className="text-slate-400 transition-all duration-300 hover:-translate-y-1 hover:text-[#00f0ff]" href="#">
              <SymbolIcon name="code" className="h-8 w-8" />
            </a>
            <a className="text-slate-400 transition-all duration-300 hover:-translate-y-1 hover:text-[#00f0ff]" href="#">
              <SymbolIcon name="work" className="h-8 w-8" />
            </a>
            <a className="text-slate-400 transition-all duration-300 hover:-translate-y-1 hover:text-[#00f0ff]" href="#">
              <SymbolIcon name="alternate_email" className="h-8 w-8" />
            </a>
          </div>
        </div>

        <div className="relative flex h-[500px] w-full flex-1 justify-center lg:justify-end">
          <HeroCubeScene />
        </div>
      </div>
    </section>
  );
}
