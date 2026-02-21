"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import { useRepo } from "../../context/Repocontext";
import { saveRecentRepo } from "../../lib/supbase.js";
import Sidebar from "../../components/Sidebar";
import RepoInput from "../../components/RepoInput";
import CommitCard from "../../components/CommitCard";
import ChatBot from "../../components/ChatBot";

export default function DashboardPage() {
  const { user, isSignedIn }  = useUser();
  const searchParams          = useSearchParams();
  const {
    repoMeta,
    commits,
    isAnalyzing,
    setRecentRepos,
  } = useRepo();

  // Auto-analyze if repo URL passed from landing page
  useEffect(() => {
    const repoUrl = searchParams.get("repo");
    if (repoUrl) {
      // The RepoInput component handles the actual fetch
      // We just pre-fill — handled via URL param
    }
  }, [searchParams]);

  // Save to Supabase when repo is loaded + user is signed in
  useEffect(() => {
    if (!repoMeta || !isSignedIn || !user) return;
      saveRecentRepo(user.id, repoMeta).then(() => {
      // Refresh recent repos in sidebar
      import("../../lib/supbase.js").then(({ getRecentRepos }) => {
        getRecentRepos(user.id).then(setRecentRepos);
      });
    });
  }, [repoMeta, isSignedIn, user]);

  const summarizedCount = commits.filter((c) => c.ai_summary).length;

  return (
    <div className="flex h-screen bg-[#07080c] overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="h-14 border-b border-[#1a1f30] flex items-center px-6 gap-4 flex-shrink-0 bg-[#07080c]">
          <div className="flex-1">
            <h1 className="text-sm font-semibold text-slate-300">Dashboard</h1>
          </div>

          {/* Stats — show when commits loaded */}
          {commits.length > 0 && (
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {commits.length} commits
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                {summarizedCount} summarized
              </span>
            </div>
          )}

          {/* Auth button */}
          {isSignedIn ? (
            <UserButton afterSignOutUrl="/" />
          ) : (
            <a
              href="/sign-in"
              className="text-xs bg-violet-600 hover:bg-violet-500 text-white px-4 py-1.5 rounded-lg transition-colors"
            >
              Sign in
            </a>
          )}
        </header>

        {/* Body */}
        <main className="flex-1 overflow-y-auto p-6">

          {/* Repo Input */}
          <RepoInput />

          {/* Repo Meta Banner */}
          {repoMeta && (
            <div className="flex items-center gap-4 mb-5 px-1 flex-wrap">
              <div className="flex items-center gap-3">
                {repoMeta.avatar && (
                  <img src={repoMeta.avatar} alt="owner" className="w-7 h-7 rounded-full" />
                )}
                <div>
                  <h2 className="text-base font-semibold text-slate-100 font-mono">
                    {repoMeta.full_name}
                  </h2>
                  {repoMeta.description && (
                    <p className="text-xs text-slate-500">{repoMeta.description}</p>
                  )}
                </div>
              </div>

              <div className="ml-auto flex items-center gap-3 flex-wrap">
                {repoMeta.language && (
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    {repoMeta.language}
                  </span>
                )}
                <span className="text-xs text-slate-500">⭐ {repoMeta.stars?.toLocaleString()}</span>
                <span className="text-xs text-slate-500">🍴 {repoMeta.forks?.toLocaleString()}</span>
                {repoMeta.isPrivate && (
                  <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md ring-1 ring-amber-500/20">
                    Private
                  </span>
                )}
                <a
                  href={repoMeta.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-500 hover:text-violet-400 transition-colors"
                >
                  View on GitHub →
                </a>
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {isAnalyzing && (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-[#0e1117] border border-[#1e2435] rounded-xl p-4 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-slate-800 rounded w-1/4" />
                      <div className="h-4 bg-slate-800 rounded w-3/4" />
                      <div className="h-3 bg-slate-800 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Commits List */}
          {commits.length > 0 && !isAnalyzing && (
            <>
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  All Commits{" "}
                  <span className="text-slate-700 font-normal normal-case tracking-normal">
                    ({commits.length})
                  </span>
                </h3>
                <span className="text-xs text-slate-600">
                  Click any commit to expand AI summary + files
                </span>
              </div>
              <div className="space-y-2">
                {commits.map((commit) => (
                  <CommitCard key={commit.sha} commit={commit} />
                ))}
              </div>
            </>
          )}

          {/* Empty state */}
          {commits.length === 0 && !isAnalyzing && (
            <div className="text-center py-24">
              <div className="w-14 h-14 rounded-2xl bg-[#0e1117] border border-[#1e2435] flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-slate-600">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </div>
              <p className="text-sm text-slate-600">
                Paste a GitHub repository URL above to get started
              </p>
              <p className="text-xs text-slate-700 mt-1">
                Works with any public repo — no sign in required
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Floating Chatbot */}
      <ChatBot />
    </div>
  );
}