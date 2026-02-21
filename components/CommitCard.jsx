"use client";

import { useState } from "react";

const TYPE_BADGE = {
  feature:  "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30",
  fix:      "bg-red-500/15 text-red-400 ring-1 ring-red-500/30",
  refactor: "bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30",
  chore:    "bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/30",
  docs:     "bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30",
  test:     "bg-yellow-500/15 text-yellow-400 ring-1 ring-yellow-500/30",
  style:    "bg-pink-500/15 text-pink-400 ring-1 ring-pink-500/30",
  perf:     "bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30",
  other:    "bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/30",
};

const AVATAR_COLORS = [
  "bg-violet-600", "bg-emerald-600", "bg-amber-600",
  "bg-pink-600",   "bg-sky-600",     "bg-rose-600",
];

function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function getInitials(name) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function CommitCard({ commit }) {
  const [expanded, setExpanded] = useState(false);
  const badge = TYPE_BADGE[commit.type] || TYPE_BADGE.other;
  const avatarColor = getAvatarColor(commit.author);

  return (
    <div
      onClick={() => setExpanded((e) => !e)}
      className="group bg-[#0e1117] border border-[#1e2435] rounded-xl p-4 hover:border-[#2d3450] transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className={`${avatarColor} w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 mt-0.5`}>
          {getInitials(commit.author)}
        </div>

        <div className="flex-1 min-w-0">
          {/* Badges row */}
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-md capitalize ${badge}`}>
              {commit.type}
            </span>
            <span className="font-mono text-xs text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-md">
              {commit.shortSha}
            </span>
          </div>

          {/* Message */}
          <p className="text-sm text-slate-200 font-medium leading-snug mb-2 font-mono">
            {commit.message}
          </p>

          {/* Meta */}
          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
            <span>{commit.author}</span>
            <span className="text-slate-700">·</span>
            <span>{commit.date}</span>
            {commit.files?.length > 0 && (
              <>
                <span className="text-slate-700">·</span>
                <span>{commit.files.length} file{commit.files.length !== 1 ? "s" : ""}</span>
                <span className="text-emerald-500">
                  +{commit.files.reduce((a, f) => a + f.additions, 0)}
                </span>
                <span className="text-red-400">
                  -{commit.files.reduce((a, f) => a + f.deletions, 0)}
                </span>
              </>
            )}
            <a
              href={commit.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-slate-600 hover:text-violet-400 transition-colors ml-auto"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" strokeLinecap="round" />
                <path d="M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>

          {/* Expanded — AI Summary + Files */}
          {expanded && (
            <div className="mt-4 space-y-3">
              {/* AI Summary */}
              <div className="pt-3 border-t border-[#1e2435]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                  <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">
                    AI Summary
                  </span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {commit.ai_summary || "Summary not available for this commit."}
                </p>
              </div>

              {/* Files Changed */}
              {commit.files?.length > 0 && (
                <div className="pt-3 border-t border-[#1e2435]">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Files Changed
                  </p>
                  <div className="space-y-1.5">
                    {commit.files.map((file, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        {/* Status badge */}
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase flex-shrink-0 ${
                          file.status === "added"    ? "bg-emerald-500/20 text-emerald-400" :
                          file.status === "removed"  ? "bg-red-500/20 text-red-400" :
                          file.status === "modified" ? "bg-blue-500/20 text-blue-400" :
                                                       "bg-slate-500/20 text-slate-400"
                        }`}>
                          {file.status === "added" ? "A" : file.status === "removed" ? "R" : file.status === "modified" ? "M" : "~"}
                        </span>

                        {/* File path — clickable */}
                        <a
                          href={file.blob_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="font-mono text-slate-400 hover:text-violet-400 transition-colors truncate flex-1"
                        >
                          {file.filename}
                        </a>

                        {/* Additions/Deletions */}
                        <span className="text-emerald-500 flex-shrink-0">+{file.additions}</span>
                        <span className="text-red-400 flex-shrink-0">-{file.deletions}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Expand chevron */}
        <div className={`flex-shrink-0 text-slate-600 group-hover:text-slate-400 transition-transform duration-200 mt-1 ${expanded ? "rotate-90" : ""}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}