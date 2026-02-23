import { useRef } from "react";
import SymbolIcon from "@/components/ui/SymbolIcon";
import { API_BASE_URL } from "@/lib/apiBase";

const resolveAssetUrl = (value) => {
  const input = String(value ?? "").trim();
  if (!input) return "";
  if (/^https?:\/\//i.test(input)) return input;
  if (input.startsWith("/uploads/") && API_BASE_URL) {
    return `${API_BASE_URL}${input}`;
  }
  return input;
};

const normalizeMailHref = (value) => {
  const input = String(value ?? "").trim();
  if (!input) return "";
  if (input.startsWith("mailto:")) return input;
  if (input.includes("@")) return `mailto:${input}`;
  return input;
};

const resolveResumeUrl = (value) => resolveAssetUrl(value);

const messageToneClass = {
  error: "border-red-500/30 bg-red-500/10 text-red-200",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  warn: "border-yellow-500/30 bg-yellow-500/10 text-yellow-200",
  neutral: "border-white/10 bg-white/5 text-slate-300",
};

export default function ProfileView({
  profile,
  message,
  dirty,
  savePending,
  isReadOnly,
  uploadPendingField,
  onChange,
  onSocialChange,
  onUpload,
  onSave,
}) {
  const aboutInputRef = useRef(null);
  const profileInputRef = useRef(null);
  const resumeInputRef = useRef(null);

  const aboutImage = resolveAssetUrl(profile?.aboutImageUrl);
  const profileImage = resolveAssetUrl(profile?.profileImageUrl);
  const resumeUrl = resolveResumeUrl(profile?.resumeUrl);
  const gmailHref = normalizeMailHref(profile?.social?.gmail);
  const toneClass = messageToneClass[message?.tone] ?? messageToneClass.neutral;

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6">
      <section className="rounded-xl border border-white/5 glass-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Portfolio Profile</h3>
            <p className="text-xs text-slate-500">
              Update About image, profile image, social URLs, and resume file for public portfolio.
            </p>
          </div>
          <button
            type="button"
            onClick={onSave}
            disabled={isReadOnly || savePending || !dirty}
            className="inline-flex items-center gap-2 rounded border border-[#22c55e]/40 bg-[#22c55e]/15 px-3 py-1.5 text-xs font-bold text-[#4ade80] transition-all hover:bg-[#22c55e]/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <SymbolIcon name="save" className="h-4 w-4" />
            {savePending ? "Saving..." : "Save Profile"}
          </button>
        </div>

        {message?.text ? <div className={`mt-4 rounded-lg border px-4 py-3 text-xs ${toneClass}`}>{message.text}</div> : null}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <section className="space-y-6 rounded-xl border border-white/5 glass-panel p-5">
          <div>
            <h4 className="text-sm font-semibold text-white">Image Assets</h4>
            <p className="mt-1 text-xs text-slate-500">Upload files using the admin asset API.</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-[#0a0a12] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">About Image</p>
              <div className="mt-3 overflow-hidden rounded-lg border border-white/10 bg-[#05050a]">
                {aboutImage ? (
                  <img src={aboutImage} alt="About preview" className="h-52 w-full object-cover" />
                ) : (
                  <div className="flex h-52 items-center justify-center text-xs text-slate-500">No image selected</div>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => aboutInputRef.current?.click()}
                  disabled={isReadOnly || uploadPendingField === "aboutImageUrl"}
                  className="inline-flex items-center gap-2 rounded border border-[#00f0ff]/30 bg-[#00f0ff]/10 px-3 py-1.5 text-xs font-semibold text-[#00f0ff] transition-all hover:bg-[#00f0ff]/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <SymbolIcon name="cloud_upload" className="h-4 w-4" />
                  {uploadPendingField === "aboutImageUrl" ? "Uploading..." : "Upload"}
                </button>
              </div>
              <input
                ref={aboutInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onUpload("aboutImageUrl", file);
                  event.target.value = "";
                }}
              />
            </div>

            <div className="rounded-lg border border-white/10 bg-[#0a0a12] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Profile Image</p>
              <div className="mt-3 overflow-hidden rounded-lg border border-white/10 bg-[#05050a]">
                {profileImage ? (
                  <img src={profileImage} alt="Profile preview" className="h-52 w-full object-cover" />
                ) : (
                  <div className="flex h-52 items-center justify-center text-xs text-slate-500">No image selected</div>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => profileInputRef.current?.click()}
                  disabled={isReadOnly || uploadPendingField === "profileImageUrl"}
                  className="inline-flex items-center gap-2 rounded border border-[#00f0ff]/30 bg-[#00f0ff]/10 px-3 py-1.5 text-xs font-semibold text-[#00f0ff] transition-all hover:bg-[#00f0ff]/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <SymbolIcon name="cloud_upload" className="h-4 w-4" />
                  {uploadPendingField === "profileImageUrl" ? "Uploading..." : "Upload"}
                </button>
              </div>
              <input
                ref={profileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onUpload("profileImageUrl", file);
                  event.target.value = "";
                }}
              />
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#0a0a12] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Resume File</p>
                <p className="mt-1 text-[11px] text-slate-500">Upload PDF/DOCX resume and use it for public Resume button.</p>
              </div>
              <button
                type="button"
                onClick={() => resumeInputRef.current?.click()}
                disabled={isReadOnly || uploadPendingField === "resumeUrl"}
                className="inline-flex items-center gap-2 rounded border border-[#00f0ff]/30 bg-[#00f0ff]/10 px-3 py-1.5 text-xs font-semibold text-[#00f0ff] transition-all hover:bg-[#00f0ff]/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <SymbolIcon name="upload_file" className="h-4 w-4" />
                {uploadPendingField === "resumeUrl" ? "Uploading..." : "Upload Resume"}
              </button>
            </div>
            <input
              ref={resumeInputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onUpload("resumeUrl", file);
                event.target.value = "";
              }}
            />

            <label className="mt-3 block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Resume URL</span>
              <input
                value={profile?.resumeUrl ?? ""}
                onChange={(event) => onChange({ resumeUrl: event.target.value })}
                disabled={isReadOnly}
                className="w-full rounded-lg border border-white/10 bg-[#05050a] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#00f0ff]/40 disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="/uploads/my-resume.pdf"
              />
            </label>

            {resumeUrl ? (
              <a
                href={resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-[#00f0ff] hover:text-white"
              >
                <SymbolIcon name="open_in_new" className="h-4 w-4" />
                Open current resume
              </a>
            ) : null}
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-white/5 glass-panel p-5">
          <div>
            <h4 className="text-sm font-semibold text-white">Social Links</h4>
            <p className="mt-1 text-xs text-slate-500">These links are used by the public footer icons.</p>
          </div>

          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">LinkedIn URL</span>
            <input
              value={profile?.social?.linkedin ?? ""}
              onChange={(event) => onSocialChange("linkedin", event.target.value)}
              disabled={isReadOnly}
              className="w-full rounded-lg border border-white/10 bg-[#0a0a12] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#00f0ff]/40 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="https://www.linkedin.com/in/username"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">GitHub URL</span>
            <input
              value={profile?.social?.github ?? ""}
              onChange={(event) => onSocialChange("github", event.target.value)}
              disabled={isReadOnly}
              className="w-full rounded-lg border border-white/10 bg-[#0a0a12] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#00f0ff]/40 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="https://github.com/username"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Telegram URL</span>
            <input
              value={profile?.social?.telegram ?? ""}
              onChange={(event) => onSocialChange("telegram", event.target.value)}
              disabled={isReadOnly}
              className="w-full rounded-lg border border-white/10 bg-[#0a0a12] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#00f0ff]/40 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="https://t.me/username"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Gmail</span>
            <input
              value={profile?.social?.gmail ?? ""}
              onChange={(event) => onSocialChange("gmail", event.target.value)}
              disabled={isReadOnly}
              className="w-full rounded-lg border border-white/10 bg-[#0a0a12] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#00f0ff]/40 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="name@gmail.com"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Location URL</span>
            <input
              value={profile?.social?.location ?? ""}
              onChange={(event) => onSocialChange("location", event.target.value)}
              disabled={isReadOnly}
              className="w-full rounded-lg border border-white/10 bg-[#0a0a12] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#00f0ff]/40 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="https://maps.google.com/?q=Yangon"
            />
          </label>

          <div className="rounded-lg border border-white/10 bg-[#0a0a12] p-3 text-xs text-slate-400">
            <p className="mb-2 text-slate-200">Quick Preview</p>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={profile?.social?.linkedin || "#"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 w-8 items-center justify-center rounded border border-white/10 bg-[#05050a] text-slate-200"
              >
                <SymbolIcon name="linkedin" className="h-4 w-4" />
              </a>
              <a
                href={profile?.social?.github || "#"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 w-8 items-center justify-center rounded border border-white/10 bg-[#05050a] text-slate-200"
              >
                <SymbolIcon name="github" className="h-4 w-4" />
              </a>
              <a
                href={profile?.social?.telegram || "#"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 w-8 items-center justify-center rounded border border-white/10 bg-[#05050a] text-slate-200"
              >
                <SymbolIcon name="send" className="h-4 w-4" />
              </a>
              <a
                href={gmailHref || "#"}
                className="inline-flex h-8 w-8 items-center justify-center rounded border border-white/10 bg-[#05050a] text-slate-200"
              >
                <SymbolIcon name="mail" className="h-4 w-4" />
              </a>
              <a
                href={profile?.social?.location || "#"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 w-8 items-center justify-center rounded border border-white/10 bg-[#05050a] text-slate-200"
              >
                <SymbolIcon name="location" className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
