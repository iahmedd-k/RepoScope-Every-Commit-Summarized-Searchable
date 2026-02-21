"use client";

import { useState, useRef, useEffect } from "react";
import { useUser, SignInButton } from "@clerk/nextjs";
import { useRepo } from "../context/Repocontext";

export default function ChatBot() {
  const { isSignedIn } = useUser();
  const { commits, chatMessages, addChatMessage, isChatLoading, setIsChatLoading } = useRepo();

  const [isOpen, setIsOpen]   = useState(false);
  const [input, setInput]     = useState("");
  const bottomRef             = useRef(null);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isChatLoading) return;

    const question = input.trim();
    setInput("");

    // Add user message
    addChatMessage({ role: "user", content: question });
    setIsChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ commits, question }),
      });

      const data = await res.json();

      addChatMessage({
        role:    "assistant",
        content: data.answer || data.error || "Could not get a response.",
      });
    } catch {
      addChatMessage({
        role:    "assistant",
        content: "Network error. Please try again.",
      });
    } finally {
      setIsChatLoading(false);
    }
  };

  // Format assistant message — convert [text](url) markdown links to anchor tags
  function formatMessage(text) {
    const parts = text.split(/(\[.+?\]\(.+?\))/g);
    return parts.map((part, i) => {
      const match = part.match(/\[(.+?)\]\((.+?)\)/);
      if (match) {
        return (
          <a
            key={i}
            href={match[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-400 underline underline-offset-2 hover:text-violet-300 transition-colors font-mono text-xs"
          >
            {match[1]}
          </a>
        );
      }
      return <span key={i}>{part}</span>;
    });
  }

  return (
    <>
      {/* ── Floating Toggle Button ────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-violet-600 hover:bg-violet-500 rounded-full flex items-center justify-center shadow-lg shadow-violet-900/40 transition-all duration-200 hover:scale-105"
      >
        {isOpen ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-5 h-5">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" className="w-5 h-5">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* ── Chat Panel ────────────────────────────────────────────────────── */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-h-[560px] bg-[#0e1117] border border-[#1e2435] rounded-2xl shadow-2xl flex flex-col overflow-hidden">

          {/* Header */}
          <div className="px-4 py-3 border-b border-[#1e2435] flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-violet-600/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 text-violet-400">
                <circle cx="12" cy="12" r="9" />
                <path d="M9.5 9.5a3 3 0 015 2.236c0 1.764-2.5 2.764-2.5 4" strokeLinecap="round" />
                <circle cx="12" cy="17.5" r=".5" fill="currentColor" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-100">Ask RepoScope</p>
              <p className="text-xs text-slate-500">
                {commits.length > 0 ? `${commits.length} commits loaded` : "No repo loaded"}
              </p>
            </div>
            {/* Online dot */}
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>

          {/* ── AUTH GATE — not signed in ──────────────────────────────── */}
          {!isSignedIn ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/20 flex items-center justify-center mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6 text-violet-400">
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 018 0v4" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-200 mb-1">Sign in to use AI Chat</p>
              <p className="text-xs text-slate-500 mb-5">
                Ask things like:<br />
                <span className="text-slate-400 italic">Where did I fix the auth bug?</span><br />
                <span className="text-slate-400 italic">What changed in the API last week?</span><br />
                <span className="text-slate-400 italic">Which files were touched most?</span>
              </p>
              <SignInButton mode="modal">
                <button className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-5 py-2 rounded-xl transition-colors">
                  Sign in free →
                </button>
              </SignInButton>
            </div>

          ) : commits.length === 0 ? (
            /* ── NO REPO LOADED ───────────────────────────────────────── */
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <p className="text-sm text-slate-500">Analyze a repository first to start chatting.</p>
            </div>

          ) : (
            /* ── CHAT INTERFACE ───────────────────────────────────────── */
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* Welcome message */}
                {chatMessages.length === 0 && (
                  <div className="bg-[#13151e] rounded-xl p-3">
                    <p className="text-xs text-slate-400">
                      Hi! I have access to all <span className="text-violet-400 font-semibold">{commits.length} commits</span> in this repo. Ask me anything — where a bug was fixed, what changed in a specific file, who made recent changes, etc.
                    </p>
                  </div>
                )}

                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-xl px-3 py-2.5 text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-violet-600 text-white"
                        : "bg-[#13151e] text-slate-300 border border-[#1e2435]"
                    }`}>
                      {msg.role === "assistant"
                        ? formatMessage(msg.content)
                        : msg.content
                      }
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-[#13151e] border border-[#1e2435] rounded-xl px-4 py-3">
                      <div className="flex gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-[#1e2435]">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Where did I fix the auth bug?"
                    className="flex-1 bg-[#13151e] border border-[#1e2435] rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500/60 transition-colors"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isChatLoading}
                    className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-2 rounded-xl transition-colors flex-shrink-0"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
                      <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}