import { defaultPortfolioContent } from "@/data/portfolioData";
import { API_BASE_URL } from "@/lib/apiBase";

const resolveAssetUrl = (value) => {
  const input = String(value ?? "").trim();
  if (!input) return "";
  if (input.startsWith("/uploads/") && API_BASE_URL) {
    return `${API_BASE_URL}${input}`;
  }
  if (/^https?:\/\//i.test(input)) {
    try {
      const parsed = new URL(input);
      const path = `${parsed.pathname}`.split("?")[0].split("#")[0];
      if (path.startsWith("/uploads/")) {
        const isLocalHost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
        if (isLocalHost && API_BASE_URL) {
          return `${API_BASE_URL}${path}`;
        }
        return `${parsed.origin}${path}`;
      }
    } catch (_error) {
      return input;
    }
    return input;
  }
  return input;
};

export default function About({
  data = defaultPortfolioContent.about,
  profile = defaultPortfolioContent.profile,
}) {
  const firstStat = data.stats?.[0];
  const secondStat = data.stats?.[1];
  const imageSrc = resolveAssetUrl(data.image || profile?.aboutImageUrl || "/assets/about-portrait.png");
  const imageAlt = data.imageAlt || "Portrait of a developer looking focused in a dimly lit workspace";

  return (
    <section id="about" className="relative bg-[#0a0a12] py-24">
      <div className="absolute inset-0 bg-[#05050a]/50" />

      <div className="layout-container relative z-10 mx-auto max-w-[960px] px-4">
        <div className="mb-10 flex flex-col gap-4 text-center">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[#00f0ff] drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]">
            About Me
          </h2>
          <h3 className="text-3xl font-bold text-white md:text-5xl">{data.title || "Behind the Code"}</h3>
        </div>

        <div className="grid items-center gap-16 md:grid-cols-2">
          <div className="group relative mx-auto w-[300px] md:w-[360px]">
            <div className="relative z-10 aspect-[4/5] overflow-hidden rounded-2xl border-2 border-white/10 bg-slate-800 shadow-2xl transition-transform duration-500 group-hover:[transform:rotateX(6deg)_rotateY(6deg)]">
              <img src={imageSrc} alt={imageAlt} className="h-full w-full object-cover object-center" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#05050a]/90 to-transparent opacity-60" />
            </div>
            <div className="absolute -left-4 -top-4 -z-0 h-full w-full rounded-2xl border-2 border-[#00f0ff]/30 transition-transform duration-500 group-hover:-translate-x-[10px] group-hover:-translate-y-[10px]" />
            <div className="absolute -bottom-6 -right-6 -z-10 h-48 w-48 animate-pulse rounded-full bg-[#7000ff]/20 blur-[80px]" />
          </div>

          <div className="flex flex-col gap-8">
            <p className="text-lg leading-relaxed text-slate-300">{data.paragraphOne}</p>
            <p className="text-base leading-relaxed text-slate-400">{data.paragraphTwo}</p>

            <div className="mt-4 grid grid-cols-2 gap-6">
              <div className="rounded-lg border border-white/5 bg-[#05050a] p-4 transition-colors hover:border-[#00f0ff]/50">
                <h4 className="bg-gradient-to-r from-[#00f0ff] to-white bg-clip-text text-4xl font-bold text-transparent">
                  {firstStat?.value ?? "05+"}
                </h4>
                <p className="mt-1 text-sm text-slate-400">{firstStat?.helper ?? "Years Experience"}</p>
              </div>

              <div className="rounded-lg border border-white/5 bg-[#05050a] p-4 transition-colors hover:border-[#7000ff]/50">
                <h4 className="bg-gradient-to-r from-[#7000ff] to-white bg-clip-text text-4xl font-bold text-transparent">
                  {secondStat?.value ?? "50+"}
                </h4>
                <p className="mt-1 text-sm text-slate-400">{secondStat?.helper ?? "Projects Completed"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
