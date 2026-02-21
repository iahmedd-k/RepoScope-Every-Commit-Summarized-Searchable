// ── Build headers (with or without token) ────────────────────────────────────
function buildHeaders(token = null) {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const t = token || process.env.GITHUB_TOKEN;
  if (t) headers["Authorization"] = `Bearer ${t}`;
  return headers;
}

// ── Parse owner and repo from URL ────────────────────────────────────────────
export function parseRepoUrl(url) {
  const match = url.match(/github\.com\/([^/]+)\/([^/\s?#]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}

// ── Fetch repo metadata ───────────────────────────────────────────────────────
export async function fetchRepoMeta(owner, repo, token = null) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    { headers: buildHeaders(token) }
  );

  if (res.status === 404) throw new Error("REPO_NOT_FOUND");
  if (res.status === 401) throw new Error("BAD_TOKEN");
  if (res.status === 403) throw new Error("RATE_LIMITED");
  if (!res.ok) throw new Error(`GITHUB_ERROR_${res.status}`);

  const data = await res.json();

  return {
    full_name:   data.full_name,
    url:         data.html_url,
    description: data.description,
    language:    data.language,
    stars:       data.stargazers_count,
    forks:       data.forks_count,
    isPrivate:   data.private,
    owner:       data.owner.login,
    avatar:      data.owner.avatar_url,
    defaultBranch: data.default_branch,
  };
}

// ── Fetch all commits (paginated) ─────────────────────────────────────────────
export async function fetchAllCommits(owner, repo, token = null) {
  const headers = buildHeaders(token);
  let page = 1;
  let allCommits = [];
  const perPage = 100; // max allowed by GitHub

  while (true) {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?per_page=${perPage}&page=${page}`,
      { headers }
    );

    if (!res.ok) break;

    const data = await res.json();
    if (!data.length) break;

    allCommits = [...allCommits, ...data];

    // Stop if we got less than a full page (last page)
    if (data.length < perPage) break;

    // Cap at 500 commits so we don't overload context window
    if (allCommits.length >= 500) break;

    page++;
  }

  return allCommits;
}

// ── Fetch single commit diff (files changed) ──────────────────────────────────
export async function fetchCommitDiff(owner, repo, sha, token = null) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`,
    { headers: buildHeaders(token) }
  );

  if (!res.ok) return [];

  const data = await res.json();

  // Return simplified file list
  return (data.files || []).map((f) => ({
    filename:  f.filename,
    status:    f.status,       // added, modified, removed, renamed
    additions: f.additions,
    deletions: f.deletions,
    blob_url:  f.blob_url,     // direct link to file on GitHub
    patch:     f.patch || "",  // actual code diff
  }));
}

// ── Format commits into clean objects ─────────────────────────────────────────
export function formatCommit(rawCommit, files = []) {
  const TYPE_MAP = {
    feat:     "feature",
    fix:      "fix",
    refactor: "refactor",
    chore:    "chore",
    docs:     "docs",
    test:     "test",
    style:    "style",
    perf:     "perf",
  };

  const message = rawCommit.commit.message.split("\n")[0];
  const prefix  = message.split(":")[0].toLowerCase().trim();
  const type    = TYPE_MAP[prefix] || "other";

  return {
    sha:      rawCommit.sha,
    shortSha: rawCommit.sha.slice(0, 7),
    message,
    type,
    author:   rawCommit.commit.author.name,
    email:    rawCommit.commit.author.email,
    date:     rawCommit.commit.author.date.slice(0, 10),
    githubUrl: rawCommit.html_url,
    files,
    ai_summary: null, // filled in after Gemini call
  };
}