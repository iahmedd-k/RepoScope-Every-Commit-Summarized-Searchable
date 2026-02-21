"use client";

import { createContext, useContext, useState } from "react";

// ── Create the context ────────────────────────────────────────────────────────
const RepoContext = createContext(null);

// ── Provider — wrap your app with this ───────────────────────────────────────
export function RepoProvider({ children }) {
  // Repo metadata
  const [repoMeta, setRepoMeta] = useState(null);

  // All commits with summaries
  const [commits, setCommits] = useState([]);

  // Loading states
  const [isAnalyzing, setIsAnalyzing]   = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState("");

  // Error state
  const [error, setError] = useState(null);

  // Recent repos from Supabase (for sidebar)
  const [recentRepos, setRecentRepos] = useState([]);

  // Chat messages
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // ── Actions ────────────────────────────────────────────────────────────────

  // Add a single chat message
  const addChatMessage = (message) => {
    setChatMessages((prev) => [...prev, message]);
  };

  // Clear everything when user loads a new repo
  const clearRepo = () => {
    setRepoMeta(null);
    setCommits([]);
    setError(null);
    setChatMessages([]);
    setAnalyzeProgress("");
  };

  // Update a single commit's summary after AI processes it
  const updateCommitSummary = (sha, summary) => {
    setCommits((prev) =>
      prev.map((c) => (c.sha === sha ? { ...c, ai_summary: summary } : c))
    );
  };

  return (
    <RepoContext.Provider
      value={{
        // State
        repoMeta,
        commits,
        isAnalyzing,
        analyzeProgress,
        error,
        recentRepos,
        chatMessages,
        isChatLoading,

        // Setters
        setRepoMeta,
        setCommits,
        setIsAnalyzing,
        setAnalyzeProgress,
        setError,
        setRecentRepos,
        setChatMessages,
        setIsChatLoading,

        // Actions
        addChatMessage,
        clearRepo,
        updateCommitSummary,
      }}
    >
      {children}
    </RepoContext.Provider>
  );
}

// ── Custom hook — use this in any component ───────────────────────────────────
export function useRepo() {
  const context = useContext(RepoContext);
  if (!context) {
    throw new Error("useRepo must be used inside RepoProvider");
  }
  return context;
}