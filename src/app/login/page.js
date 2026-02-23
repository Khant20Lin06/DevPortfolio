"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthApiEnabled, login, register, setAuthToken } from "@/lib/authApi";
import { getPushReasonHint, initPushNotifications } from "@/lib/pushNotifications";

const initialState = {
  name: "",
  email: "",
  password: "",
};

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(initialState);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [status, setStatus] = useState("idle");

  const apiEnabled = useMemo(() => isAuthApiEnabled(), []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const nextMode = params.get("mode");
    setMode(nextMode === "register" ? "register" : "login");
  }, []);

  const onChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors = {};
    const email = form.email.trim();
    const password = form.password;

    if (!email) nextErrors.email = "Email is required.";
    if (email && !/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = "Invalid email.";
    if (!password) nextErrors.password = "Password is required.";

    if (mode === "register") {
      const name = form.name.trim();
      if (name && name.length < 2) nextErrors.name = "Name is too short.";
      if (password && password.length < 8) nextErrors.password = "Min 8 characters.";
      if (password && !/[A-Za-z]/.test(password)) nextErrors.password = "Must include a letter.";
      if (password && !/[0-9]/.test(password)) nextErrors.password = "Must include a number.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!apiEnabled) {
      setError("Set NEXT_PUBLIC_API_BASE_URL to enable auth API.");
      return;
    }

    if (!validate()) {
      setStatus("error");
      return;
    }

    setStatus("loading");
    try {
      const action = mode === "register" ? register : login;
      const response = await action({
        name: form.name,
        email: form.email,
        password: form.password,
      });

      if (!response.ok) {
        setStatus("error");
        if (response.data?.fieldErrors) {
          setFieldErrors(response.data.fieldErrors);
        }
        setError(response.data?.message ?? "Authentication failed.");
        return;
      }

      setAuthToken(response.data.token);
      const pushResult = await initPushNotifications({
        audience: response.data?.user?.role === "admin" ? "admin" : "user",
      });
      if (!pushResult.ok && typeof window !== "undefined") {
        sessionStorage.setItem("portfolio_push_init_hint", getPushReasonHint(pushResult.reason));
      }
      setStatus("success");
      router.push("/admin");
    } catch (_error) {
      setStatus("error");
      setError("Network error. Please try again.");
    }
  };

  return (
    <main className="section-wrap py-16">
      <div className="mx-auto max-w-lg glass-panel p-6 md:p-8">
        <h1 className="section-title text-center">
          {mode === "login" ? "Admin Login" : "Create Account"}
        </h1>
        <p className="section-subtitle text-center">
          {mode === "login"
            ? "Sign in to manage portfolio content."
            : "Register as editor account. Admin role is required for content updates."}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-lg border border-slate-700/70 bg-[#0a1228]/60 p-1">
          <button
            className={mode === "login" ? "btn-primary text-sm" : "btn-secondary text-sm"}
            type="button"
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            className={mode === "register" ? "btn-primary text-sm" : "btn-secondary text-sm"}
            type="button"
            onClick={() => setMode("register")}
          >
            Register
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={submit}>
          {mode === "register" ? (
            <label className="block text-sm text-slate-200" htmlFor="name">
              <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-slate-400">
                Name
              </span>
              <input
                id="name"
                className="contact-input"
                value={form.name}
                onChange={onChange("name")}
                placeholder="Your Name"
              />
              {fieldErrors.name ? (
                <span className="mt-1 block text-xs text-red-300">{fieldErrors.name}</span>
              ) : null}
            </label>
          ) : null}

          <label className="block text-sm text-slate-200" htmlFor="email">
            <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-slate-400">
              Email
            </span>
            <input
              id="email"
              type="email"
              className="contact-input"
              value={form.email}
              onChange={onChange("email")}
              placeholder="admin@example.com"
              required
            />
            {fieldErrors.email ? (
              <span className="mt-1 block text-xs text-red-300">{fieldErrors.email}</span>
            ) : null}
          </label>

          <label className="block text-sm text-slate-200" htmlFor="password">
            <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-slate-400">
              Password
            </span>
            <input
              id="password"
              type="password"
              className="contact-input"
              value={form.password}
              onChange={onChange("password")}
              placeholder="At least 8 chars, letter + number"
              required
            />
            {fieldErrors.password ? (
              <span className="mt-1 block text-xs text-red-300">{fieldErrors.password}</span>
            ) : null}
          </label>

          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          {!apiEnabled ? (
            <p className="text-xs text-amber-300">
              API disabled: set `NEXT_PUBLIC_API_BASE_URL` in frontend env.
            </p>
          ) : null}

          <button className="btn-primary w-full" disabled={status === "loading"}>
            {status === "loading"
              ? "Please wait..."
              : mode === "login"
                ? "Login"
                : "Register"}
          </button>
        </form>
      </div>
    </main>
  );
}
