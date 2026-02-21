import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// ── Summarize a single commit ─────────────────────────────────────────────────
export async function summarizeCommit(commit) {
  const filesText = commit.files
    .map(
      (f) =>
        `- ${f.status.toUpperCase()}: ${f.filename} (+${f.additions} -${f.deletions})`
    )
    .join("\n");

  const patchText = commit.files
    .filter((f) => f.patch)
    .slice(0, 3) // only first 3 files patch to keep tokens low
    .map((f) => `File: ${f.filename}\n${f.patch}`)
    .join("\n\n");

  const prompt = `
You are a senior software engineer writing formal commit documentation.

Analyze this Git commit and write a concise, formal summary (2-3 sentences max).
Focus on WHAT changed and WHY it matters. Be specific, not generic.
Do not start with "This commit". Write in present tense.

Commit Message: ${commit.message}
Author: ${commit.author}
Date: ${commit.date}

Files Changed:
${filesText}

Code Diff (sample):
${patchText || "No patch available"}

Write the formal summary now:
`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error("Gemini summarize error:", error);
    return `Changes made to ${commit.files.map((f) => f.filename).join(", ")}.`;
  }
}

// ── Summarize multiple commits in one batch call (faster) ─────────────────────
export async function summarizeCommitsBatch(commits) {
  // Process in parallel batches of 5 to avoid rate limits
  const BATCH_SIZE = 5;
  const results = [];

  for (let i = 0; i < commits.length; i += BATCH_SIZE) {
    const batch = commits.slice(i, i + BATCH_SIZE);
    const summaries = await Promise.all(batch.map(summarizeCommit));
    results.push(...summaries);

    // Small delay between batches to respect rate limits
    if (i + BATCH_SIZE < commits.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return results;
}

// ── Chatbot — answer questions using commits as context ───────────────────────
export async function chatWithCommits(commits, question) {
  // Build context string from all commits
  const context = commits
    .map(
      (c) => `
SHA: ${c.shortSha} | Date: ${c.date} | Author: ${c.author}
Message: ${c.message}
Type: ${c.type}
Files: ${c.files.map((f) => f.filename).join(", ")}
Summary: ${c.ai_summary || "No summary available"}
GitHub URL: ${c.githubUrl}
File Links: ${c.files.map((f) => `${f.filename} → ${f.blob_url}`).join(" | ")}
`
    )
    .join("\n---\n");

  const prompt = `
You are an AI assistant helping a developer understand their GitHub repository history.

You have access to ALL commits in this repository. Answer the user's question by finding the most relevant commits and files.

COMMIT HISTORY:
${context}

USER QUESTION: ${question}

INSTRUCTIONS:
- Answer directly and specifically
- If the user asks WHERE something was changed → return the exact file path and its GitHub blob_url as a clickable link
- If the user asks WHEN → return the date and commit SHA
- If the user asks WHO → return the author name
- If the user asks WHAT → return the commit summary
- Always mention the commit SHA (short) and date
- If multiple commits are relevant, list them
- Format file links as: [filename](blob_url)
- Keep your answer concise and developer-friendly

Answer now:
`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error("Gemini chat error:", error);
    return "Sorry, I could not process your question. Please try again.";
  }
}
