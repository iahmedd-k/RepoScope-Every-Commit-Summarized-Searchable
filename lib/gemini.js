import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Single generate helper ────────────────────────────────────────────────────
async function generate(prompt, maxTokens = 500) {
  const result = await groq.chat.completions.create({
    model:       "llama3-8b-8192", // free, fast, high limits
    messages:    [{ role: "user", content: prompt }],
    max_tokens:  maxTokens,
    temperature: 0.2,
  });
  return result.choices[0].message.content.trim();
}

// ── Summarize a single commit ─────────────────────────────────────────────────
export async function summarizeCommit(commit) {
  const filesText =
    commit.files
      ?.map((f) => `- ${f.status?.toUpperCase()}: ${f.filename} (+${f.additions} -${f.deletions})`)
      .join("\n") || "No file data";

  const patchText =
    commit.files
      ?.filter((f) => f.patch)
      .slice(0, 2)
      .map((f) => `File: ${f.filename}\n${f.patch?.slice(0, 300)}`)
      .join("\n\n") || "";

  const prompt = `You are a senior software engineer writing formal commit documentation.

Write a concise formal summary (2-3 sentences) of this Git commit.
Focus on WHAT changed and WHY it matters. Be specific. Do not start with "This commit". Use present tense.

Commit Message: ${commit.message}
Author: ${commit.author}
Date: ${commit.date}

Files Changed:
${filesText}
${patchText ? `\nCode Diff Sample:\n${patchText}` : ""}

Formal Summary:`;

  try {
    return await generate(prompt, 300);
  } catch (error) {
    console.error("Groq summarize error:", error.message);
    return `${commit.message} — modifications applied to ${
      commit.files?.map((f) => f.filename).join(", ") || "codebase"
    }.`;
  }
}

// ── Summarize commits sequentially with delay ─────────────────────────────────
export async function summarizeCommitsBatch(commits) {
  const BATCH_SIZE = 5;
  const DELAY_MS   = 1000; // 1 second between batches — Groq is generous
  const results    = [];

  for (let i = 0; i < commits.length; i += BATCH_SIZE) {
    const batch     = commits.slice(i, i + BATCH_SIZE);
    const summaries = await Promise.all(batch.map(summarizeCommit));
    results.push(...summaries);

    if (i + BATCH_SIZE < commits.length) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  return results;
}

// ── Chatbot — answer questions using commits as context ───────────────────────
export async function chatWithCommits(commits, question) {
  // Cap at 200 commits — Groq has 8192 token context
  // Each commit entry is ~100 tokens so 200 = ~20k tokens, fits fine
  const cappedCommits = commits.slice(0, 200);

  const context = cappedCommits
    .map(
      (c) =>
        `SHA:${c.shortSha} | Date:${c.date} | Author:${c.author} | Type:${c.type}
Message: ${c.message}
Files: ${c.files?.map((f) => f.filename).join(", ") || "N/A"}
File Links: ${c.files?.map((f) => `[${f.filename}](${f.blob_url})`).join(", ") || "N/A"}
Summary: ${c.ai_summary || c.message}`
    )
    .join("\n\n");

  const prompt = `You are an AI assistant helping a developer search through their GitHub commit history.

COMMIT HISTORY (${cappedCommits.length} commits):
${context}

DEVELOPER QUESTION: ${question}

ANSWER RULES:
- Be concise — 2 to 4 sentences max
- WHERE questions → show the exact filename as a markdown link [filename](blob_url)
- WHEN questions → show the date and short SHA
- WHO questions → show the author name
- If multiple commits match → list the top 3 most relevant ones
- Always format file paths as markdown links when available
- Be direct and developer-friendly

Answer:`;

  try {
    return await generate(prompt, 800);
  } catch (error) {
    console.error("Groq chat error:", {
      message: error.message,
      status:  error.status,
    });

    if (error.message?.includes("429"))
      return "Rate limit reached. Please wait a moment and try again.";
    if (error.message?.includes("401"))
      return "Invalid API key. Check GROQ_API_KEY in your .env.local file.";

    return `Error: ${error.message}`;
  }
}