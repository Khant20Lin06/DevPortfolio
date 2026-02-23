"use client";

import { useMemo, useState } from "react";
import TurnstileWidget from "@/components/contact/TurnstileWidget";
import { isContactPipelineEnabled, submitContact } from "@/lib/contactApi";
import SymbolIcon from "@/components/ui/SymbolIcon";

const initialForm = {
  name: "",
  email: "",
  subject: "",
  message: "",
  website: "",
};

export default function Contact() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("idle");
  const [fieldErrors, setFieldErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");

  const pipelineEnabled = useMemo(() => isContactPipelineEnabled(), []);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

  const onChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateClient = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Required.";
    if (!form.email.trim()) nextErrors.email = "Required.";
    if (!form.message.trim()) nextErrors.message = "Required.";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = "Invalid email.";
    if (form.message.trim() && form.message.trim().length < 20) {
      nextErrors.message = "Message must be at least 20 characters.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const resetForm = () => {
    setForm(initialForm);
    setCaptchaToken("");
    setFieldErrors({});
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setGlobalError("");

    if (!validateClient()) return;

    if (pipelineEnabled && turnstileSiteKey && !captchaToken) {
      setGlobalError("Please complete captcha.");
      return;
    }

    setStatus("sending");

    if (!pipelineEnabled) {
      setTimeout(() => {
        setStatus("sent");
        resetForm();
      }, 800);
      return;
    }

    try {
      const response = await submitContact({
        name: form.name.trim(),
        email: form.email.trim(),
        source: form.subject.trim() || undefined,
        message: form.message.trim(),
        website: form.website,
        captchaToken: captchaToken || "dev-bypass-token",
      });

      if (response.ok) {
        setStatus("sent");
        resetForm();
        return;
      }

      if (response.status === 400 && response.data?.fieldErrors) {
        setFieldErrors(response.data.fieldErrors);
        setStatus("error");
        return;
      }

      if (response.status === 429) {
        setGlobalError("Too many attempts. Please try later.");
        setStatus("error");
        return;
      }

      setGlobalError(response.data?.message || "Failed to send message.");
      setStatus("error");
    } catch (_error) {
      setGlobalError("Network error. Please try again.");
      setStatus("error");
    }
  };

  return (
    <section id="contact" className="relative bg-[#05050a] py-24">
      <div className="pointer-events-none absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-[#00f0ff]/5 blur-[100px]" />

      <div className="layout-container relative z-10 mx-auto max-w-[800px] px-4">
        <div className="mb-12 flex flex-col gap-4 text-center">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[#00f0ff] drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]">
            Get In Touch
          </h2>
          <h3 className="text-3xl font-bold text-white md:text-5xl">Let&apos;s Build the Future</h3>
          <p className="text-slate-400">Have a project in mind? I&apos;d love to hear from you.</p>
        </div>

        <form
          className="group relative flex flex-col gap-6 overflow-hidden rounded-2xl border border-white/5 bg-[#0a0a12] p-8 shadow-2xl backdrop-blur-md md:p-10"
          onSubmit={onSubmit}
          noValidate
        >
          <div className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-transparent transition-colors duration-500 group-hover:border-[#00f0ff]/20" />

          {!pipelineEnabled ? (
            <p className="rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
              Demo mode active. Add `NEXT_PUBLIC_API_BASE_URL` for live submission.
            </p>
          ) : null}

          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Your Name"
              name="name"
              value={form.name}
              onChange={onChange("name")}
              error={fieldErrors.name}
              placeholder="John Doe"
              required
            />
            <Field
              label="Your Email"
              name="email"
              type="email"
              value={form.email}
              onChange={onChange("email")}
              error={fieldErrors.email}
              placeholder="john@example.com"
              required
            />
          </div>

          <Field
            label="Subject"
            name="subject"
            value={form.subject}
            onChange={onChange("subject")}
            error={fieldErrors.subject}
            placeholder="Project Inquiry"
          />

          <Field
            label="Message"
            name="message"
            value={form.message}
            onChange={onChange("message")}
            error={fieldErrors.message}
            placeholder="Tell me about your project..."
            multiline
            required
          />

          <input
            type="text"
            name="website"
            value={form.website}
            onChange={onChange("website")}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />

          <TurnstileWidget
            siteKey={turnstileSiteKey}
            onToken={setCaptchaToken}
            onError={(message) => setGlobalError(message)}
          />

          {globalError ? <p className="text-sm text-red-300">{globalError}</p> : null}
          {status === "sent" ? <p className="text-sm text-emerald-300">Message sent successfully.</p> : null}

          <button
            className="mt-4 flex h-14 items-center justify-center rounded-lg bg-gradient-to-r from-[#00f0ff] to-blue-600 text-lg font-bold text-black shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all hover:-translate-y-1 hover:from-blue-600 hover:to-[#00f0ff] hover:shadow-[0_0_30px_rgba(0,240,255,0.6)]"
            disabled={status === "sending"}
          >
            {status === "sending" ? "Sending..." : "Initialize Connection"}
            <SymbolIcon name="send" className="ml-2 h-5 w-5 animate-pulse" strokeWidth={2.4} />
          </button>
        </form>
      </div>
    </section>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  error,
  placeholder,
  type = "text",
  multiline = false,
  required = false,
}) {
  return (
    <label className="flex flex-col gap-2" htmlFor={name}>
      <span className="text-sm font-medium text-slate-300">
        {label}
        {required ? " *" : ""}
      </span>

      {multiline ? (
        <textarea
          id={name}
          name={name}
          rows={5}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="resize-none rounded-lg border border-slate-700 bg-[#05050a]/50 px-4 py-3 text-white placeholder:text-slate-600 transition-all focus:border-[#00f0ff] focus:outline-none focus:ring-1 focus:ring-[#00f0ff] focus:shadow-[0_0_15px_rgba(0,240,255,0.2)]"
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="rounded-lg border border-slate-700 bg-[#05050a]/50 px-4 py-3 text-white placeholder:text-slate-600 transition-all focus:border-[#00f0ff] focus:outline-none focus:ring-1 focus:ring-[#00f0ff] focus:shadow-[0_0_15px_rgba(0,240,255,0.2)]"
        />
      )}

      {error ? <span className="text-xs text-red-300">{error}</span> : null}
    </label>
  );
}
