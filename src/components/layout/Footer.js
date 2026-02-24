import { navLinks } from "@/data/portfolioData";
import SymbolIcon from "@/components/ui/SymbolIcon";

const footerLinks = navLinks.filter((item) => ["home", "about", "projects", "contact"].includes(item.id));

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-white/5 bg-[#05050a] py-10">
      <div className="absolute left-1/2 top-0 h-px w-full -translate-x-1/2 bg-gradient-to-r from-transparent via-[#00f0ff]/50 to-transparent" />
      <div className="layout-container mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-6 px-4 md:flex-row">
        <div className="flex items-center gap-2 text-white">
          <SymbolIcon
            name="terminal"
            className="h-5 w-5 text-[#00f0ff] drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]"
            strokeWidth={2.2}
          />
          <span className="font-bold tracking-tight">DevPortfolio</span>
        </div>

        <div className="flex gap-8 text-sm text-slate-400">
          {footerLinks.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="transition-colors hover:text-[#00f0ff] hover:shadow-[0_2px_0_#00f0ff]"
            >
              {item.label}
            </a>
          ))}
        </div>

        <p className="text-xs text-center text-slate-600 md:text-right">
          (c) {currentYear} Khant Lin Developer. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
