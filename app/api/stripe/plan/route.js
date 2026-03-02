import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserSubscription, getTodayUsage } from "../../../../lib/stripe";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ plan: "free", usage: { analyses: 0 } });
    }

    const [sub, analyses] = await Promise.all([
      getUserSubscription(userId),
      getTodayUsage(userId),
    ]);

    return NextResponse.json({
      plan:   sub.plan   || "free",
      status: sub.status || "active",
      usage:  { analyses },
    });
  } catch (error) {
    console.error("Plan route error:", error);
    return NextResponse.json({ plan: "free", usage: { analyses: 0 } });
  }
}