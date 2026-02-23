"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import TechStack from "@/components/sections/TechStack";
import Projects from "@/components/sections/Projects";
import Experience from "@/components/sections/Experience";
import GithubActivity from "@/components/sections/GithubActivity";
import Contact from "@/components/sections/Contact";
import { defaultPortfolioContent } from "@/data/portfolioData";
import {
  fetchPortfolioContent,
  isPortfolioApiEnabled,
  trackPortfolioView,
} from "@/lib/portfolioApi";
import { getGuestId } from "@/lib/guestId";

const mergeContent = (incoming) => ({
  ...defaultPortfolioContent,
  ...incoming,
});

export default function HomePage() {
  const [content, setContent] = useState(defaultPortfolioContent);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!isPortfolioApiEnabled()) return;

      try {
        const result = await fetchPortfolioContent();
        if (mounted && result) {
          setContent(mergeContent(result));
        }
      } catch (_error) {
        // Fallback content keeps the landing page visually stable if API is down.
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const track = async () => {
      if (!isPortfolioApiEnabled()) return;
      const visitorKey = `guest:${getGuestId()}`;
      await trackPortfolioView({ visitorKey });
    };

    void track();
  }, []);

  return (
    <main className="site-shell pt-20">
      <Header profile={content.profile} />
      <Hero data={content.hero} profile={content.profile} />
      <About data={content.about} profile={content.profile} />
      <TechStack data={content.skills} />
      <Projects data={content.projects} />
      <Experience data={content.experience} />
      <GithubActivity data={content.contributions} />
      <Contact />
      <Footer />
    </main>
  );
}
