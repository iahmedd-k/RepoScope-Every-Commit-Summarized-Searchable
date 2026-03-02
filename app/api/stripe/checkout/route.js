import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createCheckoutSession } from "../../../../lib/stripe";

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user              = await currentUser();
    const { priceId, plan } = await request.json();

    if (!priceId || !plan) {
      return NextResponse.json({ error: "Missing priceId or plan" }, { status: 400 });
    }

    const userEmail = user.emailAddresses[0]?.emailAddress;
    const session   = await createCheckoutSession(userId, userEmail, priceId, plan);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}