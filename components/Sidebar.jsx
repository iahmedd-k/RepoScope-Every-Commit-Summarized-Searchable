"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useRepo } from "../context/Repocontext";
import { getRecentRepos, deleteRecentRepo } from "../lib/supbase.js";

export default function Sidebar() {
  const { user, isSignedIn } = useUser();
  const router = useRouter();

  const {
    recentRepos,
    setRecentRepos,
    repoMeta,
    setRepoMeta,
    setCommits,
    setError,
    clearRepo,
  } = useRepo();

  // Load recent repos from Supabase when user signs in
  useEffect(() => {
    if (!isSignedIn || !user) return;
    getRecentRepos(user.id).then(setRecentRepos);
  }, [isSignedIn, user]);

  const handleDelete = async (e, repoFullName) => {
    e.stopPropagation();
    if (!user) return;
    await deleteRecentRepo(user.id, repoFullName);
    setRecentRepos((prev) => prev.filter((r) => r.repo_full_name !== repoFullName));
  };

  const NAV_ITEMS = [
    {
      label: "Dashboard",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      ),
      active: true,
    },
    {
      label: "Billing",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20" strokeLinecap="round" />
        </svg>
      ),
      active: false,
    },
  ];

  return (
    <aside className="w-60 bg-[#0b0d14] border-r border-[#1a1f30] flex flex-col flex-shrink-0 h-screen">

      {/* Logo */}
      <div className="px-5 py-4 border-b border-[#1a1f30] flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </div>
        <span className="text-[15px] font-semibold text-slate-100 tracking-tight">RepoScope</span>
      </div>

      {/* Nav */}
      <div className="px-3 pt-4 pb-2">
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-2 mb-1.5">
          Application
        </p>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.label}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors mb-0.5 ${
              item.active
                ? "bg-violet-600/20 text-violet-300"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            <span className={item.active ? "text-violet-400" : "text-slate-500"}>
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </div>

      <div className="mx-4 border-t border-[#1a1f30] my-2" />

      {/* Recent Repos */}
      <div className="px-3 flex-1 overflow-y-auto">
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-2 mb-1.5">
          Recent Repos
        </p>

        {!isSignedIn ? (
          <p className="text-xs text-slate-600 px-2 py-1">Sign in to see recent repos</p>
        ) : recentRepos.length === 0 ? (
          <p className="text-xs text-slate-600 px-2 py-1">No recent repos yet</p>
        ) : (
          recentRepos.map((repo) => (
            <div
              key={repo.id}
              className={`group flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] transition-colors mb-0.5 cursor-pointer ${
                repoMeta?.full_name === repo.repo_full_name
                  ? "bg-white/8 text-slate-100"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
              onClick={() => {
                router.push(`/dashboard?repo=${encodeURIComponent(repo.repo_url)}`);
              }}
            >
              {/* Language color dot */}
              <span className="w-2 h-2 rounded-full bg-violet-400 flex-shrink-0" />

              {/* Repo name */}
              <span className="truncate flex-1 text-xs font-mono">
                {repo.repo_full_name.split("/")[1]}
              </span>

              {/* Delete button */}
              <button
                onClick={(e) => handleDelete(e, repo.repo_full_name)}
                className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all flex-shrink-0"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Current repo info at bottom */}
      {repoMeta && (
        <div className="mx-3 mb-3 p-3 bg-[#13151e] border border-[#1e2435] rounded-xl">
          <p className="text-xs font-mono text-slate-300 truncate">{repoMeta.full_name}</p>
          <div className="flex items-center gap-2 mt-1">
            {repoMeta.language && (
              <span className="text-[10px] text-slate-500">{repoMeta.language}</span>
            )}
            <span className="text-[10px] text-slate-600">⭐ {repoMeta.stars?.toLocaleString()}</span>
          </div>
        </div>
      )}
    </aside>
  );
}