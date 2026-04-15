"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUser, UserButton, SignInButton } from "@clerk/nextjs";
import { useRepo } from "../../context/Repocontext";
import { saveRecentRepo, getRecentRepos } from "../../lib/supabase.js";
import Sidebar from "../../components/Sidebar";
import CommitCard from "../../components/CommitCard";

// ── ICONS ──────────────────────────────────────────────────────────────────────
const GithubIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5">
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 018 0v4" strokeLinecap="round" />
  </svg>
);

const SpinIcon = () => (
  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const BotIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
    <rect x="3" y="8" width="18" height="13" rx="2" />
    <path d="M12 8V5M9 5h6M7 13h.01M17 13h.01M9 17h6" strokeLinecap="round" />
  </svg>
);

// ── FORMAT CHAT LINKS ─────────────────────────────────────────────────────────
function FormatMessage({ text }) {
  const parts = text.split(/(\[.+?\]\(.+?\))/g);
  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/\[(.+?)\]\((.+?)\)/);
        if (match) {
          return (
            <a key={i} href={match[2]} target="_blank" rel="noopener noreferrer"
              className="text-violet-400 underline underline-offset-2 hover:text-violet-300 font-mono break-all">
              {match[1]}
            </a>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, isSignedIn } = useUser();
  // we no longer read query params; repo URLs are passed via
  // sessionStorage to keep them out of the browser history
  // const searchParams = useSearchParams();

  // router only needed for navigation when landing from home/sidebar
  const router = useRouter();

  const {
    repoMeta, setRepoMeta,
    commits,  setCommits,
    isAnalyzing, setIsAnalyzing,
    analyzeProgress, setAnalyzeProgress,
    error, setError,
    clearRepo,
    setRecentRepos,
    chatMessages, addChatMessage,
    isChatLoading, setIsChatLoading,
  } = useRepo();

  // Repo input state
  const [url, setUrl]             = useState("");
  const [token, setToken]         = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [showToken, setShowToken] = useState(false);

  // Chat state
  const [chatInput, setChatInput] = useState("");
  const chatBottomRef             = useRef(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // ── Analyze handler ────────────────────────────────────────────────────────
  const handleAnalyze = useCallback(async (overrideUrl) => {
    const targetUrl = (overrideUrl ?? url) || "";
    if (!targetUrl.trim()) return;
    // keep the input in sync when override provided
    if (overrideUrl) {
      setUrl(overrideUrl);
    }
    // no URL navigation; we deliberately avoid putting repo in the query

    clearRepo();
    setIsAnalyzing(true);
    setAnalyzeProgress("Connecting to GitHub...");
    try {
      setAnalyzeProgress("Fetching commits...");
      const res  = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: targetUrl, token: token || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong."); return; }
      setAnalyzeProgress("AI is summarizing commits...");
      setRepoMeta(data.repoMeta);
      setCommits(data.commits);
      setAnalyzeProgress("");
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [url, clearRepo, setAnalyzeProgress, setCommits, setError, setRepoMeta, setIsAnalyzing, token]);

  // read pending repo from sessionStorage when the dashboard mounts
  useEffect(() => {
    const pending = sessionStorage.getItem("pendingRepo");
    if (pending && pending !== url) {
      setUrl(pending);
      handleAnalyze(pending);
      sessionStorage.removeItem("pendingRepo");
    }
    // we intentionally omit dependencies so this only runs once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save repo to Supabase when loaded
  useEffect(() => {
    if (!repoMeta || !isSignedIn || !user) return;
    saveRecentRepo(user.id, repoMeta).then(() => {
      getRecentRepos(user.id).then(setRecentRepos);
    });
  }, [repoMeta, isSignedIn, user, setRecentRepos]);


  // ── Chat handler ───────────────────────────────────────────────────────────
  const handleChat = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    const question = chatInput.trim();
    setChatInput("");
    addChatMessage({ role: "user", content: question });
    setIsChatLoading(true);
    try {
      const res  = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commits, question }),
      });
      const data = await res.json();
      addChatMessage({ role: "assistant", content: data.answer || data.error || "No response." });
    } catch {
      addChatMessage({ role: "assistant", content: "Network error. Please try again." });
    } finally {
      setIsChatLoading(false);
    }
  };

  const summarizedCount = commits.filter((c) => c.ai_summary).length;

  return (
    <div className="flex h-screen bg-[#07080c] overflow-hidden">

      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <header className="h-14 border-b border-[#1a1f30] flex items-center px-6 gap-4 shrink-0 bg-[#07080c]">
          <h1 className="text-sm font-semibold text-slate-300 flex-1">Dashboard</h1>
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
          {isSignedIn ? (
            <UserButton afterSignOutUrl="/" />
          ) : (
            <SignInButton mode="modal">
              <button className="text-xs bg-violet-600 hover:bg-violet-500 text-white px-4 py-1.5 rounded-lg transition-colors">
                Sign in
              </button>
            </SignInButton>
          )}
        </header>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-6">

          {/* ── TWO BOXES SIDE BY SIDE ──────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">

            {/* ┌─────────────────────────────────┐ */}
            {/* │   BOX 1 — Repo Analyzer         │ */}
            {/* └─────────────────────────────────┘ */}
            <div className="bg-[#0e1117] border border-[#1e2435] rounded-2xl p-6 flex flex-col gap-4">

              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
                  <GithubIcon />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">Analyze Repository</h2>
                  <p className="text-xs text-slate-500">Get AI summaries for every commit</p>
                </div>
              </div>

              {/* URL */}
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Repository URL</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                  placeholder="https://github.com/owner/repository"
                  className="w-full bg-[#13151e] border border-[#1e2435] rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500/60 transition-colors font-mono"
                />
              </div>

              {/* Private toggle */}
              <button
                onClick={() => setIsPrivate((p) => !p)}
                className={`w-fit flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                  isPrivate
                    ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                    : "bg-white/5 border-[#1e2435] text-slate-500 hover:text-slate-300"
                }`}
              >
                <LockIcon />
                {isPrivate ? "Private — token required" : "Private repo?"}
              </button>

              {/* Token */}
              {isPrivate && (
                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                  <p className="text-xs text-amber-400/80 mb-2">
                    GitHub PAT with <code className="font-mono bg-amber-500/10 px-1 rounded">repo</code> scope
                  </p>
                  <div className="relative">
                    <input
                      type={showToken ? "text" : "password"}
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      className="w-full bg-[#13151e] border border-[#1e2435] rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-colors font-mono"
                    />
                    <button onClick={() => setShowToken((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      {showToken ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" strokeLinecap="round"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5">Never stored — session only.</p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              {/* Progress */}
              {isAnalyzing && (
                <div className="flex items-center gap-2 text-xs text-violet-400">
                  <SpinIcon /><span>{analyzeProgress || "Analyzing..."}</span>
                </div>
              )}

              {/* Repo meta pill after load */}
              {repoMeta && !isAnalyzing && (
                <div className="p-3 bg-[#13151e] border border-[#1e2435] rounded-xl">
                  <div className="flex items-center gap-2 mb-1.5">
                    {repoMeta.avatar && (
                      <Image
                        src={repoMeta.avatar}
                        alt=""
                        width={20}
                        height={20}
                        className="rounded-full"
                      />
                    )}
                    <span className="text-xs font-mono text-slate-200 font-semibold truncate">{repoMeta.full_name}</span>
                    {repoMeta.isPrivate && (
                      <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded ring-1 ring-amber-500/20 shrink-0">Private</span>
                    )}
                  </div>
                  {repoMeta.description && (
                    <p className="text-xs text-slate-500 mb-2 truncate">{repoMeta.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    {repoMeta.language && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-400" />{repoMeta.language}</span>}
                    <span>⭐ {repoMeta.stars?.toLocaleString()}</span>
                    <a href={repoMeta.url} target="_blank" rel="noopener noreferrer"
                      className="ml-auto text-violet-400 hover:text-violet-300 transition-colors">
                      View on GitHub →
                    </a>
                  </div>
                </div>
              )}

              {/* Analyze button */}
              <button
                onClick={() => handleAnalyze()}
                disabled={isAnalyzing || !url.trim()}
                className="mt-auto w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
              >
                {isAnalyzing ? <><SpinIcon />Analyzing...</> : <><GithubIcon />Analyze Repository</>}
              </button>
            </div>

            {/* ┌─────────────────────────────────┐ */}
            {/* │   BOX 2 — AI Chatbot            │ */}
            {/* └─────────────────────────────────┘ */}
            <div className="bg-[#0e1117] border border-[#1e2435] rounded-2xl flex flex-col overflow-hidden" style={{ minHeight: "400px" }}>

              {/* Chat header */}
              <div className="px-5 py-4 border-b border-[#1e2435] flex items-center gap-3 shrink-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <BotIcon />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-semibold text-slate-100">Ask RepoScope</h2>
                  <p className="text-xs text-slate-500 truncate">
                    {commits.length > 0
                      ? `${commits.length} commits in context — ask anything`
                      : "Analyze a repo first to enable chat"}
                  </p>
                </div>
                <div className={`w-2 h-2 rounded-full shrink-0 ${commits.length > 0 && isSignedIn ? "bg-emerald-400" : "bg-slate-700"}`} />
              </div>

              {/* Not signed in */}
              {!isSignedIn ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-violet-600/15 border border-violet-500/20 flex items-center justify-center mb-4 text-violet-400">
                    <LockIcon />
                  </div>
                  <p className="text-sm font-semibold text-slate-200 mb-1">Sign in to use AI Chat</p>
                  <div className="space-y-1 mb-5">
                    {[
                      "Where did I fix the auth bug?",
                      "What changed in the API last week?",
                      "Which files were modified most?",
                    ].map((ex) => (
                      <p key={ex} className="text-xs text-slate-500 italic">&quot;{ex}&quot;</p>
                    ))}
                  </div>
                  <SignInButton mode="modal">
                    <button className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-colors">
                      Sign in free →
                    </button>
                  </SignInButton>
                </div>

              ) : commits.length === 0 ? (
                /* No repo loaded */
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#13151e] border border-[#1e2435] flex items-center justify-center text-slate-600">
                    <BotIcon />
                  </div>
                  <p className="text-sm text-slate-500">Analyze a repository first</p>
                  <p className="text-xs text-slate-700">then ask anything about the commit history</p>
                </div>

              ) : (
                /* Chat active */
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {chatMessages.length === 0 && (
                      <div className="bg-[#13151e] border border-[#1e2435] rounded-xl p-3.5">
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Hi! I have all{" "}
                          <span className="text-violet-400 font-semibold">{commits.length} commits</span>{" "}
                          loaded as context. Ask me where a bug was fixed, what changed in a specific file, who made recent changes — I&apos;ll give you the exact commit and a direct file link.
                        </p>
                      </div>
                    )}

                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[88%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                          msg.role === "user"
                            ? "bg-violet-600 text-white"
                            : "bg-[#13151e] text-slate-300 border border-[#1e2435]"
                        }`}>
                          {msg.role === "assistant"
                            ? <FormatMessage text={msg.content} />
                            : msg.content}
                        </div>
                      </div>
                    ))}

                    {isChatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-[#13151e] border border-[#1e2435] rounded-xl px-4 py-3 flex gap-1.5">
                          {[0, 150, 300].map((d) => (
                            <span key={d} className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce"
                              style={{ animationDelay: `${d}ms` }} />
                          ))}
                        </div>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Chat input */}
                  <div className="p-4 border-t border-[#1e2435] shrink-0">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleChat()}
                        placeholder="Where did I fix the auth bug?"
                        className="flex-1 bg-[#13151e] border border-[#1e2435] rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500/60 transition-colors"
                      />
                      <button
                        onClick={handleChat}
                        disabled={!chatInput.trim() || isChatLoading}
                        className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3.5 py-2.5 rounded-xl transition-colors shrink-0"
                      >
                        <SendIcon />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── COMMITS LIST ────────────────────────────────────────────── */}
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

          {commits.length > 0 && !isAnalyzing && (
            <>
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  All Commits <span className="text-slate-700 font-normal normal-case tracking-normal">({commits.length})</span>
                </h3>
                <span className="text-xs text-slate-600">Click any commit to expand AI summary + files</span>
              </div>
              <div className="space-y-2 pb-6">
                {commits.map((commit) => (
                  <CommitCard key={commit.sha} commit={commit} />
                ))}
              </div>
            </>
          )}

          {commits.length === 0 && !isAnalyzing && (
            <p className="text-center text-xs text-slate-700 py-8">
              Commits will appear here after you analyze a repository
            </p>
          )}
        </main>
      </div>
    </div>
  );
}
