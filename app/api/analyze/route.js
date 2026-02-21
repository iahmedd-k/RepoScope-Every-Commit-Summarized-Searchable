import { NextResponse } from "next/server";
import {
  parseRepoUrl,
  fetchRepoMeta,
  fetchAllCommits,
  fetchCommitDiff,
  formatCommit,
} from "../../../lib/github.js";
import { summarizeCommit } from "../../../lib/gemini.js";

export async function POST(request) {
  try {
    const { repoUrl, token } = await request.json();

    // ── 1. Parse URL ──────────────────────────────────────────────────────────
    const parsed = parseRepoUrl(repoUrl);
    if (!parsed) {
      return NextResponse.json(
        { error: "Invalid GitHub URL. Please use https://github.com/owner/repo format." },
        { status: 400 }
      );
    }

    const { owner, repo } = parsed;

    // ── 2. Fetch repo metadata ────────────────────────────────────────────────
    let repoMeta;
    try {
      repoMeta = await fetchRepoMeta(owner, repo, token);
    } catch (err) {
      const messages = {
        REPO_NOT_FOUND: "Repository not found. If it's private, please provide a token.",
        BAD_TOKEN:      "Invalid token. Please check your GitHub Personal Access Token.",
        RATE_LIMITED:   "GitHub API rate limit reached. Please add a token to increase limits.",
      };
      return NextResponse.json(
        { error: messages[err.message] || "Failed to fetch repository." },
        { status: 400 }
      );
    }

    // ── 3. Fetch commits ──────────────────────────────────────────────────────
    const rawCommits = await fetchAllCommits(owner, repo, token);

    if (!rawCommits.length) {
      return NextResponse.json(
        { error: "No commits found in this repository." },
        { status: 400 }
      );
    }

    // ── 4. Fetch diffs + format commits ──────────────────────────────────────
    const DIFF_LIMIT = 50;

    const formattedCommits = await Promise.all(
      rawCommits.slice(0, DIFF_LIMIT).map(async (raw) => {
        const files = await fetchCommitDiff(owner, repo, raw.sha, token);
        return formatCommit(raw, files);
      })
    );

    const remainingCommits = rawCommits
      .slice(DIFF_LIMIT)
      .map((raw) => formatCommit(raw, []));

    const allCommits = [...formattedCommits, ...remainingCommits];

    // ── 5. AI Summarize first 50 commits ─────────────────────────────────────
    const SUMMARIZE_LIMIT = 20;

    const summarizedCommits = await Promise.all(
      allCommits.slice(0, SUMMARIZE_LIMIT).map(async (commit) => {
        const summary = await summarizeCommit(commit);
        return { ...commit, ai_summary: summary };
      })
    );

    const unsummarizedCommits = allCommits.slice(SUMMARIZE_LIMIT);

    const finalCommits = [...summarizedCommits, ...unsummarizedCommits];

    // ── 6. Return everything ──────────────────────────────────────────────────
    return NextResponse.json({
      repoMeta,
      commits: finalCommits,
      total: finalCommits.length,
      summarized: SUMMARIZE_LIMIT,
    });
  } catch (error) {
    console.error("Analyze route error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
