"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignInButton, useUser } from "@clerk/nextjs";

export default function LandingPage() {
  const [repoUrl, setRepoUrl] = useState("");
  const router  = useRouter();
  const { isSignedIn } = useUser();

  const handleAnalyze = () => {
    if (!repoUrl.trim()) return;
    router.push(`/dashboard?repo=${encodeURIComponent(repoUrl)}`);
  };

  const FEATURES = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4l3 3" strokeLinecap="round" />
        </svg>
      ),
      title: "Full Commit History",
      desc:  "Every commit fetched, parsed, and displayed — up to 500 commits per repo.",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: "AI Summaries",
      desc:  "Gemini AI writes a formal, clear explanation of what changed in every commit.",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: "Ask Anything",
      desc:  'Ask "where did I fix the auth bug?" and get the exact file, commit, and a direct GitHub link.',
    },
  ];

  const STEPS = [
    { step: "01", label: "Paste any GitHub repo URL" },
    { step: "02", label: "AI reads and summarizes every commit" },
    { step: "03", label: "Ask questions, find any change instantly" },
  ];

  return (
    <div className="min-h-screen bg-[#07080c] text-slate-200">

      {/* Navbar */}
      <nav className="border-b border-[#1a1f30] px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </div>
          <span className="text-[15px] font-semibold text-slate-100">RepoScope</span>
        </div>

        <div className="flex items-center gap-3">
          {isSignedIn ? (
            <a
              href="/dashboard"
              className="text-sm bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl transition-colors"
            >
              Go to Dashboard →
            </a>
          ) : (
            <>
              <SignInButton mode="modal">
                <button className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
                  Sign in
                </button>
              </SignInButton>
              <SignInButton mode="modal">
                <button className="text-sm bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl transition-colors">
                  Get started free
                </button>
              </SignInButton>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-violet-600/10 border border-violet-500/20 text-violet-400 text-xs px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          Powered by Gemini AI — completely free
        </div>

        {/* Headline */}
        <h1 className="text-5xl font-bold text-slate-100 leading-tight mb-5 tracking-tight">
          Understand any GitHub repo
          <span className="text-violet-400"> instantly</span>
        </h1>

        <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Paste a GitHub URL and get AI-written summaries for every commit.
          Then ask questions like <span className="text-slate-300 italic">"where did I fix the auth bug?"</span> and
          get the exact file with a direct link.
        </p>

        {/* Hero Input */}
        <div className="flex gap-2 max-w-2xl mx-auto mb-4">
          <input
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            placeholder="https://github.com/owner/repository"
            className="flex-1 bg-[#0e1117] border border-[#1e2435] rounded-xl px-5 py-3.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500/60 transition-colors font-mono"
          />
          <button
            onClick={() => handleAnalyze()}
            disabled={!repoUrl.trim()}
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium px-6 py-3.5 rounded-xl transition-colors whitespace-nowrap"
          >
            Analyze →
          </button>
        </div>

        <p className="text-xs text-slate-600">
          No sign in required for public repos · Sign in to unlock AI chat
        </p>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-[#0e1117] border border-[#1e2435] rounded-2xl p-6 hover:border-[#2d3450] transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-600/15 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-4">
                {f.icon}
              </div>
              <h3 className="text-sm font-semibold text-slate-100 mb-2">{f.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-3xl mx-auto px-6 pb-24 text-center">
        <h2 className="text-2xl font-bold text-slate-100 mb-10">How it works</h2>
        <div className="flex flex-col md:flex-row gap-4">
          {STEPS.map((s, i) => (
            <div key={s.step} className="flex-1 bg-[#0e1117] border border-[#1e2435] rounded-2xl p-6">
              <p className="text-3xl font-bold text-violet-600/40 font-mono mb-3">{s.step}</p>
              <p className="text-sm text-slate-300">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1a1f30] py-6 text-center">
        <p className="text-xs text-slate-600">
          Built by{" "}
          <a href="#" className="text-slate-500 hover:text-slate-300 transition-colors">
            your name
          </a>{" "}
          · RepoScope 2024
        </p>
      </footer>
    </div>
  );
}