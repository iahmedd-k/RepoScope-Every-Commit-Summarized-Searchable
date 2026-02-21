import { NextResponse } from "next/server";
import { chatWithCommits } from "../../../lib/gemini.js";

export async function POST(request) {
  try {
    const { commits, question } = await request.json();

    if (!question?.trim()) {
      return NextResponse.json(
        { error: "Please ask a question." },
        { status: 400 }
      );
    }

    if (!commits?.length) {
      return NextResponse.json(
        { error: "No commits loaded. Please analyze a repository first." },
        { status: 400 }
      );
    }

    const answer = await chatWithCommits(commits, question);

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Chat route error:", error);
    return NextResponse.json(
      { error: "Failed to get answer. Please try again." },
      { status: 500 }
    );
  }
}