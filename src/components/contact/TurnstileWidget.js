"use client";

import { useEffect, useRef } from "react";

const SCRIPT_ID = "turnstile-script";

export default function TurnstileWidget({ siteKey, onToken, onError }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;

    const renderWidget = () => {
      if (!window.turnstile || !containerRef.current) return;

      if (widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: "dark",
        callback: (token) => onToken(token),
        "expired-callback": () => onToken(""),
        "error-callback": () => {
          onToken("");
          onError?.("Captcha verification failed.");
        },
      });
    };

    const existingScript = document.getElementById(SCRIPT_ID);
    if (window.turnstile) {
      renderWidget();
    } else if (existingScript) {
      existingScript.addEventListener("load", renderWidget);
    } else {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = renderWidget;
      script.onerror = () => onError?.("Captcha failed to load.");
      document.head.appendChild(script);
    }

    return () => {
      const scriptNode = document.getElementById(SCRIPT_ID);
      if (scriptNode) {
        scriptNode.removeEventListener("load", renderWidget);
      }

      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, onError, onToken]);

  if (!siteKey) {
    return <p className="text-xs text-cyan-300/90">Captcha is disabled in local mode.</p>;
  }

  return <div ref={containerRef} />;
}
