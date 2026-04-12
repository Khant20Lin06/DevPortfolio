"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import TechStack from "@/components/sections/TechStack";
import Projects from "@/components/sections/Projects";
import Experience from "@/components/sections/Experience";
import GithubActivity from "@/components/sections/GithubActivity";
import Contact from "@/components/sections/Contact";
import {
  emptyPortfolioContent,
  normalizePortfolioContent,
} from "@/data/portfolioData";
import {
  fetchPortfolioContent,
  isPortfolioApiEnabled,
  trackPortfolioView,
} from "@/lib/portfolioApi";
import { getGuestId } from "@/lib/guestId";
import { connectRealtime } from "@/lib/realtime";

const isEmptyPayload = (value) =>
  !value ||
  typeof value !== "object" ||
  Object.values(value).every((item) => {
    if (Array.isArray(item)) return item.length === 0;
    if (item && typeof item === "object") return Object.keys(item).length === 0;
    return !item;
  });

function PortfolioStatusShell({ title, message, tone = "loading" }) {
  const titleClass =
    tone === "error"
      ? "text-rose-300"
      : tone === "empty"
        ? "text-amber-200"
        : "text-white";

  return (
    <section className="relative flex min-h-[calc(100vh-80px)] items-center justify-center overflow-hidden px-4 py-16">
      <div className="pointer-events-none absolute inset-0 hero-grid-bg opacity-30" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,240,255,0.12),transparent_35%),radial-gradient(circle_at_bottom,rgba(112,0,255,0.12),transparent_35%)]" />
      <div className="relative z-10 w-full max-w-4xl rounded-[28px] border border-white/10 bg-[#0a0a12]/80 p-8 shadow-[0_0_50px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-3 rounded-full border border-[#00f0ff]/30 bg-[#08131f]/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-[#00f0ff]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00f0ff] opacity-70" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#00f0ff]" />
              </span>
              {tone === "loading" ? "Loading Portfolio" : "Portfolio Status"}
            </div>
            <h1 className={`text-3xl font-bold tracking-[-0.03em] md:text-5xl ${titleClass}`}>{title}</h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-400 md:text-lg">{message}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {[0, 1, 2].map((card) => (
              <div
                key={`loading-card-${card}`}
                className="rounded-2xl border border-white/8 bg-[#0d1222]/70 p-4"
              >
                <div className="h-32 animate-pulse rounded-xl bg-white/5" />
                <div className="mt-4 h-4 w-3/4 animate-pulse rounded bg-white/5" />
                <div className="mt-2 h-3 w-full animate-pulse rounded bg-white/5" />
                <div className="mt-2 h-3 w-5/6 animate-pulse rounded bg-white/5" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ContentSyncToast({ visible, tone = "syncing" }) {
  const isSuccess = tone === "success";
  return (
    <div
      className={`pointer-events-none fixed right-4 top-24 z-[80] transition-all duration-300 md:right-6 ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
      }`}
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className={`flex items-center gap-3 rounded-full px-4 py-2.5 shadow-[0_0_24px_rgba(0,240,255,0.18)] backdrop-blur-xl ${
          isSuccess
            ? "border border-emerald-400/25 bg-[#08150f]/90"
            : "border border-[#00f0ff]/25 bg-[#07111d]/90"
        }`}
      >
        <span className="relative flex h-2.5 w-2.5">
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isSuccess ? "bg-emerald-400" : "animate-ping bg-[#00f0ff]"
            }`}
          />
          <span
            className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
              isSuccess ? "bg-emerald-300" : "bg-[#00f0ff]"
            }`}
          />
        </span>
        <span
          className={`text-xs font-semibold uppercase tracking-[0.18em] ${
            isSuccess ? "text-emerald-200" : "text-[#9ff7ff]"
          }`}
        >
          {isSuccess ? "Updated just now" : "Updating..."}
        </span>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [content, setContent] = useState(() => normalizePortfolioContent(emptyPortfolioContent));
  const [status, setStatus] = useState(() => (isPortfolioApiEnabled() ? "loading" : "error"));
  const [errorMessage, setErrorMessage] = useState("");
  const [syncToastState, setSyncToastState] = useState("idle");
  const syncToastTimeoutRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!isPortfolioApiEnabled()) {
        if (!mounted) return;
        setStatus("error");
        setErrorMessage("Portfolio API is not configured.");
        return;
      }

      setStatus("loading");
      setErrorMessage("");

      try {
        const result = await fetchPortfolioContent();
        if (!mounted) return;
        if (isEmptyPayload(result)) {
          setContent(normalizePortfolioContent(emptyPortfolioContent));
          setStatus("empty");
          return;
        }

        setContent(normalizePortfolioContent(result));
        setStatus("ready");
      } catch (_error) {
        if (!mounted) return;
        setStatus("error");
        setErrorMessage("Failed to load portfolio data from the database.");
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isPortfolioApiEnabled()) return undefined;

    const socket = connectRealtime();
    if (!socket) return undefined;

    let refreshTimer = null;
    const handleContentUpdated = () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
      if (syncToastTimeoutRef.current) {
        clearTimeout(syncToastTimeoutRef.current);
        syncToastTimeoutRef.current = null;
      }
      setSyncToastState("syncing");

      refreshTimer = setTimeout(async () => {
        setStatus((current) => (current === "ready" ? "ready" : "loading"));
        try {
          const nextContent = await fetchPortfolioContent();
          if (isEmptyPayload(nextContent)) {
            setContent(normalizePortfolioContent(emptyPortfolioContent));
            setStatus("empty");
            setErrorMessage("");
            setSyncToastState("success");
            syncToastTimeoutRef.current = setTimeout(() => {
              setSyncToastState("idle");
              syncToastTimeoutRef.current = null;
            }, 1000);
            return;
          }

          setContent(normalizePortfolioContent(nextContent));
          setStatus("ready");
          setErrorMessage("");
          setSyncToastState("success");
          syncToastTimeoutRef.current = setTimeout(() => {
            setSyncToastState("idle");
            syncToastTimeoutRef.current = null;
          }, 1000);
        } catch (_error) {
          setStatus("error");
          setErrorMessage("Failed to refresh portfolio data.");
          setSyncToastState("idle");
        }
      }, 150);
    };

    socket.on("content:updated", handleContentUpdated);

    return () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
      if (syncToastTimeoutRef.current) {
        clearTimeout(syncToastTimeoutRef.current);
        syncToastTimeoutRef.current = null;
      }
      socket.off("content:updated", handleContentUpdated);
    };
  }, []);

  useEffect(() => {
    if (status !== "ready") return;

    const track = async () => {
      if (!isPortfolioApiEnabled()) return;
      const visitorKey = `guest:${getGuestId()}`;
      await trackPortfolioView({ visitorKey });
    };

    void track();
  }, [status]);

  const statusShell = useMemo(() => {
    if (status === "loading") {
      return {
        title: "Loading portfolio data",
        message: "We are fetching the latest portfolio content from the database.",
        tone: "loading",
      };
    }

    if (status === "empty") {
      return {
        title: "No portfolio content published yet",
        message: "Publish content from the admin panel and it will appear here immediately.",
        tone: "empty",
      };
    }

    return {
      title: "Portfolio unavailable",
      message: errorMessage || "We could not load portfolio data right now.",
      tone: "error",
    };
  }, [errorMessage, status]);

  return (
    <main className="site-shell pt-20">
      <Header profile={content.profile} />
      <ContentSyncToast
        visible={syncToastState !== "idle" && status === "ready"}
        tone={syncToastState === "success" ? "success" : "syncing"}
      />
      {status === "ready" ? (
        <>
          <Hero data={content.hero} profile={content.profile} />
          <About data={content.about} profile={content.profile} />
          <TechStack data={content.skills} />
          <Projects data={content.projects} />
          <Experience data={content.experience} />
          <GithubActivity data={content.contributions} />
          <Contact />
        </>
      ) : (
        <PortfolioStatusShell
          title={statusShell.title}
          message={statusShell.message}
          tone={statusShell.tone}
        />
      )}
      <Footer />
    </main>
  );
}
