import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Save a repo to recent_repos ──────────────────────────────────────────────
export async function saveRecentRepo(userId, repoData) {
  const { error } = await supabase
    .from("recent_repos")
    .upsert(
      {
        user_id: userId,
        repo_full_name: repoData.full_name,
        repo_url: repoData.url,
        repo_description: repoData.description,
        repo_language: repoData.language,
        repo_stars: repoData.stars,
        last_viewed_at: new Date().toISOString(),
      },
      { onConflict: "user_id, repo_full_name" }
    );

  if (error) console.error("Error saving repo:", error);
}

// ── Get recent repos for a user ──────────────────────────────────────────────
export async function getRecentRepos(userId) {
  const { data, error } = await supabase
    .from("recent_repos")
    .select("*")
    .eq("user_id", userId)
    .order("last_viewed_at", { ascending: false })
    .limit(8);

  if (error) {
    console.error("Error fetching recent repos:", error);
    return [];
  }

  return data;
}

// ── Delete a recent repo ─────────────────────────────────────────────────────
export async function deleteRecentRepo(userId, repoFullName) {
  const { error } = await supabase
    .from("recent_repos")
    .delete()
    .eq("user_id", userId)
    .eq("repo_full_name", repoFullName);

  if (error) console.error("Error deleting repo:", error);
}