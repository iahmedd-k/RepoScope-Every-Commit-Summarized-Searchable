"use client";

import { useState, useEffect } from "react";
import { useRepo } from "../context/Repocontext";
import { useSearchParams } from "next/navigation";

export default function RepoInput() {
  const [url, setUrl]           = useState("");
  const [token, setToken]       = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const {
    setRepoMeta,
    setCommits,
    setIsAnalyzing,
    setAnalyzeProgress,
    setError,
    clearRepo,
    error,
    isAnalyzing,
    analyzeProgress,
  } = useRepo();

  const handleAnalyze = async () => {
    if (!url.trim()) return;

    clearRepo();
    setIsAnalyzing(true);
    setAnalyzeProgress("Connecting to GitHub...");

    try {
      setAnalyzeProgress("Fetching commits...");

      const res = await fetch("/api/analyze", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ repoUrl: url, token: token || null }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      setAnalyzeProgress("AI is summarizing commits...");
      setRepoMeta(data.repoMeta);
      setCommits(data.commits);
      setAnalyzeProgress("");
    } catch (err) {
      setError("Network error. Please check your connection.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-[#0e1117] border border-[#1e2435] rounded-2xl p-6 mb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-violet-400">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Analyze a Repository</h2>
          <p className="text-xs text-slate-500">Paste a GitHub URL to get AI summaries of every commit</p>
        </div>
      </div>

      {/* URL Input */}
      <div className="flex gap-2 mb-3">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
          placeholder="https://github.com/owner/repository"
          className="flex-1 bg-[#13151e] border border-[#1e2435] rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500/60 transition-colors font-mono"
        />
      </div>

      {/* Private Repo Toggle */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setIsPrivate((p) => !p)}
          className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border transition-all ${
            isPrivate
              ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
              : "bg-white/5 border-[#1e2435] text-slate-500 hover:text-slate-300"
          }`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 018 0v4" strokeLinecap="round" />
          </svg>
          {isPrivate ? "Private repo — token required" : "Private repo?"}
        </button>
      </div>

      {/* Token Input */}
      {isPrivate && (
        <div className="mb-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
          <p className="text-xs text-amber-400/80 mb-2">
            Enter your GitHub Personal Access Token with <code className="font-mono bg-amber-500/10 px-1 rounded">repo</code> scope
          </p>
          <div className="relative">
            <input
              type={showToken ? "text" : "password"}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full bg-[#13151e] border border-[#1e2435] rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-colors font-mono"
            />
            <button
              onClick={() => setShowToken((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showToken ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" strokeLinecap="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-xs text-slate-600 mt-2">
            Your token is never stored — only used for this session.
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Progress */}
      {isAnalyzing && (
        <div className="mb-4 flex items-center gap-2 text-sm text-violet-400">
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>{analyzeProgress || "Analyzing..."}</span>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => handleAnalyze()}
          disabled={isAnalyzing || !url.trim()}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
        >
          {isAnalyzing ? "Analyzing..." : "Analyze Repo"}
        </button>
      </div>
    </div>
  );
}