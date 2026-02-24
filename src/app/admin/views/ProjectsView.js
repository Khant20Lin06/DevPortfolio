import { useRef } from "react";
import SymbolIcon from "@/components/ui/SymbolIcon";
import { ensureArray } from "../utils";
import { API_BASE_URL } from "@/lib/apiBase";

const resolveImagePreviewUrl = (imageUrl) => {
  const value = String(imageUrl ?? "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/uploads/") && API_BASE_URL) {
    return `${API_BASE_URL}${value}`;
  }
  return value;
};

export default function ProjectsView({
  projects,
  selectedIndex,
  onSelectIndex,
  onProjectChange,
  onProjectImageUpload,
  onProjectDelete,
  onProjectCreate,
  onSaveProjects,
  savePending,
  uploadPendingIndex,
  isReadOnly,
  message,
  dirty,
}) {
  const fileInputRef = useRef(null);
  const safeProjects = ensureArray(projects);
  const activeIndex = Math.max(0, Math.min(selectedIndex, Math.max(0, safeProjects.length - 1)));
  const activeProject = safeProjects[activeIndex] ?? null;
  const tagValue = activeProject ? ensureArray(activeProject.tags).join(", ") : "";
  const isUploadPending = activeIndex === uploadPendingIndex;
  const activePreviewImage = activeProject ? resolveImagePreviewUrl(activeProject.image) : "";
  const messageTone =
    message?.tone === "error"
      ? "border-red-500/30 bg-red-500/10 text-red-200"
      : message?.tone === "success"
        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
        : message?.tone === "warn"
          ? "border-yellow-400/30 bg-yellow-400/10 text-yellow-200"
          : "border-white/10 bg-white/5 text-slate-300";

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Projects Editor</h3>
          <p className="text-xs text-slate-500">Manage project cards shown on the public portfolio.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onProjectCreate}
            disabled={isReadOnly}
            className="inline-flex items-center gap-2 rounded border border-[#00f0ff]/30 bg-[#00f0ff]/10 px-3 py-1.5 text-xs font-bold text-[#00f0ff] transition-all hover:bg-[#00f0ff]/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <SymbolIcon name="add" className="h-4 w-4" />
            Add Project
          </button>
          <button
            type="button"
            onClick={onSaveProjects}
            disabled={isReadOnly || savePending || !dirty}
            className="inline-flex items-center gap-2 rounded border border-[#22c55e]/30 bg-[#22c55e]/10 px-3 py-1.5 text-xs font-bold text-[#4ade80] transition-all hover:bg-[#22c55e]/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <SymbolIcon name="save" className="h-4 w-4" />
            {savePending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {message?.text ? (
        <div className={`rounded-lg border px-4 py-3 text-xs ${messageTone}`}>{message.text}</div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <section className="rounded-xl border border-white/5 glass-panel p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Project Library</p>
              <p className="text-xs text-slate-500">{safeProjects.length} items</p>
            </div>
            <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-slate-400">
              Drag to reorder (coming soon)
            </span>
          </div>

          {safeProjects.length === 0 ? (
            <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-slate-500">
              No projects yet. Click Add Project to create your first one.
            </div>
          ) : (
            <div className="space-y-3">
              {safeProjects.map((project, index) => {
                const selected = index === activeIndex;
                const tags = ensureArray(project.tags);
                return (
                  <div
                    key={`${project.title || "project"}-${index}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectIndex(index)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onSelectIndex(index);
                      }
                    }}
                    className={`group flex items-center gap-4 rounded-xl border p-3 transition-all ${
                      selected
                        ? "border-[#00f0ff]/40 bg-[#00f0ff]/10"
                        : "border-white/10 bg-[#0a0a12] hover:border-[#00f0ff]/20"
                    }`}
                  >
                    <div className="h-16 w-16 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                      {project.image ? (
                        <img
                          src={resolveImagePreviewUrl(project.image)}
                          alt={project.title || "Project"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-500">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">
                        {project.title || "Untitled Project"}
                      </p>
                      <p className="line-clamp-2 text-xs text-slate-500">
                        {project.description || "No description yet."}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {tags.length ? (
                          tags.map((tag) => (
                            <span
                              key={`${tag}-${index}`}
                              className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-300"
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-600">No tags</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelectIndex(index);
                        }}
                        className="rounded p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-[#00f0ff]"
                      >
                        <SymbolIcon name="edit" className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onProjectDelete(index);
                        }}
                        disabled={isReadOnly}
                        className="rounded p-1.5 text-slate-400 transition-colors hover:bg-[#ff003c]/10 hover:text-[#ff5b80] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <SymbolIcon name="delete" className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-white/5 glass-panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white">Project Details</h4>
            <span className="text-xs text-slate-500">#{safeProjects.length ? activeIndex + 1 : 0}</span>
          </div>

          {!activeProject ? (
            <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-slate-500">
              Select a project to edit its details.
            </div>
          ) : (
            <div className="space-y-4">
              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase text-slate-500">Title</span>
                <input
                  value={activeProject.title ?? ""}
                  disabled={isReadOnly}
                  onChange={(event) => onProjectChange(activeIndex, { title: event.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-[#0a0a12] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#00f0ff]/50 disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="Project title"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase text-slate-500">Description</span>
                <textarea
                  rows={4}
                  value={activeProject.description ?? ""}
                  disabled={isReadOnly}
                  onChange={(event) => onProjectChange(activeIndex, { description: event.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-[#0a0a12] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#00f0ff]/50 disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="Short summary of the project"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase text-slate-500">Image URL</span>
                <input
                  value={activeProject.image ?? ""}
                  disabled={isReadOnly}
                  onChange={(event) => onProjectChange(activeIndex, { image: event.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-[#0a0a12] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#00f0ff]/50 disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="/assets/project-shot-1.png"
                />
              </label>

              <div className="rounded-lg border border-white/10 bg-[#0a0a12] p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-400">Upload project cover image</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isReadOnly || isUploadPending}
                    className="inline-flex items-center gap-2 rounded border border-[#00f0ff]/30 bg-[#00f0ff]/10 px-3 py-1.5 text-xs font-semibold text-[#00f0ff] transition-all hover:bg-[#00f0ff]/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <SymbolIcon name="cloud_upload" className="h-4 w-4" />
                    {isUploadPending ? "Uploading..." : "Upload Image"}
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-slate-500">
                  JPG/PNG/WebP up to 25MB. Uploaded images auto-save to project content.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      onProjectImageUpload?.(activeIndex, file);
                    }
                    event.target.value = "";
                  }}
                />
              </div>

              <div className="overflow-hidden rounded-lg border border-white/10 bg-[#0a0a12]">
                {activePreviewImage ? (
                  <img
                    src={activePreviewImage}
                    alt={activeProject.title || "Preview"}
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center text-xs text-slate-500">Image preview</div>
                )}
              </div>

              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase text-slate-500">Tags</span>
                <input
                  value={tagValue}
                  disabled={isReadOnly}
                  onChange={(event) =>
                    onProjectChange(activeIndex, {
                      tags: event.target.value
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full rounded-lg border border-white/10 bg-[#0a0a12] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#00f0ff]/50 disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="React, Node.js, PostgreSQL"
                />
                <p className="text-[11px] text-slate-500">Separate tags with commas.</p>
              </label>

              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase text-slate-500">GitHub URL</span>
                <input
                  value={activeProject.githubUrl ?? ""}
                  disabled={isReadOnly}
                  onChange={(event) => onProjectChange(activeIndex, { githubUrl: event.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-[#0a0a12] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#00f0ff]/50 disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="https://github.com/username/repo"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase text-slate-500">Live Demo URL</span>
                <input
                  value={activeProject.liveDemoUrl ?? ""}
                  disabled={isReadOnly}
                  onChange={(event) => onProjectChange(activeIndex, { liveDemoUrl: event.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-[#0a0a12] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#00f0ff]/50 disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="https://your-demo-site.com"
                />
              </label>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onProjectDelete(activeIndex)}
                  disabled={isReadOnly}
                  className="inline-flex items-center gap-2 rounded border border-[#ff5b80]/30 bg-[#ff003c]/10 px-3 py-1.5 text-xs font-semibold text-[#ff5b80] transition-all hover:bg-[#ff003c]/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <SymbolIcon name="delete" className="h-4 w-4" />
                  Delete Project
                </button>
                <div className="text-xs text-slate-500">
                  {dirty ? "Unsaved changes" : "All changes saved"}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
