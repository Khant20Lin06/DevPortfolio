"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { defaultPortfolioContent } from "@/data/portfolioData";
import SymbolIcon from "@/components/ui/SymbolIcon";
import { API_BASE_URL } from "@/lib/apiBase";

const PROJECTS_PER_SLIDE = 3;
const SWIPE_THRESHOLD_PX = 50;
const AUTO_CYCLE_MS = 4200;

const chunkProjects = (projects) => {
  const list = Array.isArray(projects) ? projects : [];
  if (list.length === 0) return [];

  if (list.length === 1) {
    return [[{ project: list[0], globalIndex: 0 }]];
  }

  const totalSlides = Math.ceil(list.length / PROJECTS_PER_SLIDE);
  const chunks = [];

  for (let slideIndex = 0; slideIndex < totalSlides; slideIndex += 1) {
    const baseIndex = slideIndex * PROJECTS_PER_SLIDE;
    const part = [];
    for (let offset = 0; offset < PROJECTS_PER_SLIDE; offset += 1) {
      const project = list[(baseIndex + offset) % list.length];
      part.push({
        project,
        globalIndex: baseIndex + offset,
      });
    }
    chunks.push(part);
  }

  return chunks;
};

const buildRenderSlides = (slides) => {
  if (slides.length <= 1) return slides;
  return [slides[slides.length - 1], ...slides, slides[0]];
};

const getRealSlideIndex = (renderIndex, totalSlides) => {
  if (totalSlides <= 1) return 0;
  if (renderIndex === 0) return totalSlides - 1;
  if (renderIndex === totalSlides + 1) return 0;
  return Math.max(0, Math.min(totalSlides - 1, renderIndex - 1));
};

const resolveProjectImageUrl = (imageUrl) => {
  const value = String(imageUrl ?? "").trim();
  if (!value) return "/assets/project-shot-1.png";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/uploads/") && API_BASE_URL) {
    return `${API_BASE_URL}${value}`;
  }
  return value;
};

const toExternalUrl = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
};

export default function Projects({ data = defaultPortfolioContent.projects }) {
  const slides = useMemo(() => chunkProjects(data), [data]);
  const totalSlides = slides.length;
  const renderSlides = useMemo(() => buildRenderSlides(slides), [slides]);

  const [renderIndex, setRenderIndex] = useState(totalSlides > 1 ? 1 : 0);
  const [animate, setAnimate] = useState(true);
  const [isAutoPaused, setIsAutoPaused] = useState(false);
  const [touchActiveCardKey, setTouchActiveCardKey] = useState("");
  const [canUseHover, setCanUseHover] = useState(true);
  const swipeStartXRef = useRef(null);
  const didSwipeRef = useRef(false);

  useEffect(() => {
    setAnimate(true);
    setRenderIndex(totalSlides > 1 ? 1 : 0);
  }, [totalSlides]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const apply = () => {
      setCanUseHover(mediaQuery.matches);
      if (mediaQuery.matches) {
        setTouchActiveCardKey("");
      }
    };

    apply();
    mediaQuery.addEventListener("change", apply);
    return () => mediaQuery.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (animate) return undefined;
    const raf = requestAnimationFrame(() => {
      setAnimate(true);
    });
    return () => cancelAnimationFrame(raf);
  }, [animate]);

  useEffect(() => {
    setTouchActiveCardKey("");
  }, [renderIndex]);

  useEffect(() => {
    if (totalSlides <= 1 || isAutoPaused) return undefined;
    const timer = setInterval(() => {
      setAnimate(true);
      setRenderIndex((prev) => {
        const maxIndex = totalSlides + 1;
        if (prev >= maxIndex) return maxIndex;
        return prev + 1;
      });
    }, AUTO_CYCLE_MS);
    return () => clearInterval(timer);
  }, [isAutoPaused, totalSlides]);

  const goToPrevious = useCallback(() => {
    if (totalSlides <= 1) return;
    setAnimate(true);
    setRenderIndex((prev) => {
      if (prev <= 0) return 0;
      return prev - 1;
    });
  }, [totalSlides]);

  const goToNext = useCallback(() => {
    if (totalSlides <= 1) return;
    setAnimate(true);
    setRenderIndex((prev) => {
      const maxIndex = totalSlides + 1;
      if (prev >= maxIndex) return maxIndex;
      return prev + 1;
    });
  }, [totalSlides]);

  const goToSlide = useCallback(
    (index) => {
      if (totalSlides <= 1) return;
      setAnimate(true);
      setRenderIndex(index + 1);
    },
    [totalSlides]
  );

  const handleTransitionEnd = () => {
    if (totalSlides <= 1) return;
    if (renderIndex === 0) {
      setAnimate(false);
      setRenderIndex(totalSlides);
      return;
    }
    if (renderIndex === totalSlides + 1) {
      setAnimate(false);
      setRenderIndex(1);
    }
  };

  useEffect(() => {
    if (totalSlides <= 1) return;
    const maxIndex = totalSlides + 1;
    if (renderIndex >= 0 && renderIndex <= maxIndex) return;

    const normalized = ((renderIndex - 1) % totalSlides + totalSlides) % totalSlides;
    setAnimate(false);
    setRenderIndex(normalized + 1);
  }, [renderIndex, totalSlides]);

  useEffect(() => {
    if (totalSlides <= 1 || !animate) return undefined;
    if (renderIndex !== 0 && renderIndex !== totalSlides + 1) return undefined;

    const timer = setTimeout(() => {
      setAnimate(false);
      setRenderIndex(renderIndex === 0 ? totalSlides : 1);
    }, 820);

    return () => clearTimeout(timer);
  }, [animate, renderIndex, totalSlides]);

  const handlePointerDown = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    swipeStartXRef.current = event.clientX;
  };

  const handlePointerUp = (event) => {
    const startX = swipeStartXRef.current;
    swipeStartXRef.current = null;
    if (startX == null) {
      return;
    }
    const deltaX = event.clientX - startX;
    if (Math.abs(deltaX) >= SWIPE_THRESHOLD_PX) {
      didSwipeRef.current = true;
      if (deltaX > 0) {
        goToPrevious();
      } else {
        goToNext();
      }
    }
  };

  const handlePointerCancel = () => {
    swipeStartXRef.current = null;
  };

  const handleCardTap = (cardKey) => {
    if (canUseHover) return;
    if (didSwipeRef.current) {
      didSwipeRef.current = false;
      return;
    }
    setTouchActiveCardKey((prev) => (prev === cardKey ? "" : cardKey));
  };

  const activeSlide = getRealSlideIndex(renderIndex, totalSlides);

  return (
    <section id="projects" className="relative bg-[#05050a]/80 py-24">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(112,0,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(112,0,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="layout-container card-3d-wrapper relative z-10 mx-auto max-w-[1200px] px-4">
        <div className="mb-10 flex flex-col items-center gap-2 text-center">
          <div className="flex flex-col gap-2 items-center">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#00f0ff] drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]">
              Portfolio
            </h2>
            <h3 className="text-3xl font-bold text-white md:text-5xl">Featured Projects</h3>
          </div>
        </div>

        <div
          className="relative overflow-hidden touch-pan-y select-none"
          onMouseEnter={() => setIsAutoPaused(true)}
          onMouseLeave={() => setIsAutoPaused(false)}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onPointerLeave={handlePointerCancel}
        >
          <div
            className={`flex ${animate ? "transition-transform duration-700 ease-out" : "transition-none"}`}
            style={{ transform: `translateX(-${renderIndex * 100}%)` }}
            onTransitionEnd={handleTransitionEnd}
          >
            {renderSlides.map((slide, slideIndex) => (
              <div key={`projects-slide-${slideIndex}`} className="w-full flex-shrink-0">
                <div className="grid gap-8 md:grid-cols-2 md:[grid-auto-rows:1fr] lg:grid-cols-3">
                  {slide.map(({ project, globalIndex }) => {
                    const isSecondary = globalIndex % 3 === 1;
                    const githubUrl = toExternalUrl(project?.githubUrl);
                    const liveDemoUrl = toExternalUrl(project?.liveDemoUrl);
                    const tagList = Array.isArray(project?.tags) ? project.tags : [];
                    const cardKey = `${project.title || "project"}-${globalIndex}`;
                    const isTouchActive = !canUseHover && touchActiveCardKey === cardKey;
                    const hoverColor = isSecondary
                      ? "hover:shadow-[0_0_30px_rgba(112,0,255,0.15)] hover:border-[#7000ff]/50"
                      : "hover:shadow-[0_0_30px_rgba(0,240,255,0.15)] hover:border-[#00f0ff]/50";

                    return (
                      <article
                        key={cardKey}
                        onClick={() => handleCardTap(cardKey)}
                        className={`card-3d group relative flex h-full min-h-[390px] flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#0a0a12]/40 backdrop-blur-sm transition-all duration-500 ${hoverColor}`}
                      >
                        <div className="relative aspect-video overflow-hidden rounded-t-2xl bg-slate-800">
                          <img
                            src={resolveProjectImageUrl(project.image)}
                            alt={project.title}
                            loading="lazy"
                            className={`h-full w-full object-cover object-center transition-transform duration-700 ${
                              isTouchActive ? "scale-110" : "scale-100"
                            } group-hover:scale-110`}
                          />

                          <div
                            className={`absolute inset-0 flex items-center justify-center gap-4 bg-[#05050a]/80 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100 ${
                              isTouchActive ? "opacity-100" : "opacity-0"
                            }`}
                          >
                            {githubUrl ? (
                              <a
                                href={githubUrl}
                                target="_blank"
                                rel="noreferrer noopener"
                                title="View Code"
                                onClick={(event) => event.stopPropagation()}
                                className={`transform rounded-full p-3 font-bold transition-all hover:scale-110 ${
                                  isSecondary
                                    ? "bg-[#7000ff] text-white shadow-[0_0_15px_rgba(112,0,255,0.6)] hover:bg-white hover:text-black"
                                    : "bg-[#00f0ff] text-black shadow-[0_0_15px_rgba(0,240,255,0.6)] hover:bg-white hover:text-black"
                                }`}
                              >
                                <SymbolIcon name="code" className="h-5 w-5" strokeWidth={2.4} />
                              </a>
                            ) : (
                              <button
                                type="button"
                                title="GitHub URL not set"
                                disabled
                                onClick={(event) => event.stopPropagation()}
                                className="rounded-full bg-white/10 p-3 text-slate-500"
                              >
                                <SymbolIcon name="code" className="h-5 w-5" strokeWidth={2.4} />
                              </button>
                            )}

                            {liveDemoUrl ? (
                              <a
                                href={liveDemoUrl}
                                target="_blank"
                                rel="noreferrer noopener"
                                title="Live Demo"
                                onClick={(event) => event.stopPropagation()}
                                className={`transform rounded-full bg-white p-3 text-[#05050a] transition-all shadow-[0_0_15px_rgba(255,255,255,0.4)] hover:scale-110 ${
                                  isSecondary
                                    ? "hover:bg-[#00f0ff] hover:text-black"
                                    : "hover:bg-[#7000ff] hover:text-white"
                                }`}
                              >
                                <SymbolIcon name="visibility" className="h-5 w-5" strokeWidth={2.2} />
                              </a>
                            ) : (
                              <button
                                type="button"
                                title="Live demo URL not set"
                                disabled
                                onClick={(event) => event.stopPropagation()}
                                className="rounded-full bg-white/10 p-3 text-slate-500"
                              >
                                <SymbolIcon name="visibility" className="h-5 w-5" strokeWidth={2.2} />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex h-full flex-1 flex-col p-6">
                          <h4
                            className={`mb-2 text-xl font-bold text-white transition-colors ${
                              isSecondary
                                ? `${isTouchActive ? "text-[#7000ff]" : ""} group-hover:text-[#7000ff]`
                                : `${isTouchActive ? "text-[#00f0ff]" : ""} group-hover:text-[#00f0ff]`
                            }`}
                          >
                            {project.title}
                          </h4>
                          <p className="mb-4 line-clamp-2 text-sm text-slate-400">{project.description}</p>
                          <div className="mt-auto flex flex-wrap gap-2">
                            {tagList.map((tag) => (
                              <span
                                key={`${project.title}-${tag}`}
                                className={`text-xs font-medium px-2 py-1 rounded border ${
                                  isSecondary
                                    ? "border-[#7000ff]/30 text-[#7000ff] bg-[#7000ff]/5"
                                    : "border-[#00f0ff]/30 text-[#00f0ff] bg-[#00f0ff]/5"
                                }`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {totalSlides > 1 ? (
          <div className="mt-6 flex items-center justify-center gap-2">
            {slides.map((_, index) => (
              <button
                key={`project-dot-${index}`}
                type="button"
                onClick={() => goToSlide(index)}
                aria-label={`Go to project slide ${index + 1}`}
                className={`h-2.5 rounded-full transition-all ${
                  activeSlide === index ? "w-7 bg-[#00f0ff]" : "w-2.5 bg-white/25 hover:bg-white/45"
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
