import { NextResponse } from "next/server";
import {
  parseRepoUrl,
  fetchRepoMeta,
  fetchAllCommits,
  fetchCommitDiff,
  formatCommit,
} from "../../../lib/github.js";
import { summarizeCommit } from "../../../lib/gemini.js";

// ── Helper — wait ms milliseconds ─────────────────────────────────────────────
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

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
    // Only fetch diffs for first 30 commits to avoid GitHub rate limits
    const DIFF_LIMIT = 30;

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

    // ── 5. AI Summarize — ONE AT A TIME with delay ────────────────────────────
    // Gemini free tier = 15 requests/minute
    // We summarize sequentially with 2s gap = safe under the limit
    const SUMMARIZE_LIMIT = 10; // only first 10 on initial load
    const DELAY_BETWEEN   = 2000; // 2 seconds between each call

    const summarizedCommits = [];

    for (let i = 0; i < Math.min(SUMMARIZE_LIMIT, allCommits.length); i++) {
      const commit  = allCommits[i];
      const summary = await summarizeCommit(commit);
      summarizedCommits.push({ ...commit, ai_summary: summary });

      // Wait between calls — skip delay on last item
      if (i < SUMMARIZE_LIMIT - 1) {
        await wait(DELAY_BETWEEN);
      }
    }

    // Remaining commits have no summary yet — that's fine
    // chatbot still uses their commit messages as context
    const unsummarizedCommits = allCommits.slice(SUMMARIZE_LIMIT);
    const finalCommits        = [...summarizedCommits, ...unsummarizedCommits];

    // ── 6. Return everything ──────────────────────────────────────────────────
    return NextResponse.json({
      repoMeta,
      commits:    finalCommits,
      total:      finalCommits.length,
      summarized: summarizedCommits.length,
    });

  } catch (error) {
    console.error("Analyze route error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}