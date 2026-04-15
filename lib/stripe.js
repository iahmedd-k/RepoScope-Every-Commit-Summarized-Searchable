import Stripe from "stripe";
import { supabase } from "./supabase";

// ensure we have a secret key (not a publishable one)
const stripeSecret = process.env.STRIPE_SECRET_KEY;
if (!stripeSecret || !stripeSecret.startsWith("sk_")) {
  // throw at import-time so developers spot the misconfiguration immediately
  throw new Error(
    "Stripe secret key not configured or invalid. " +
    "Set STRIPE_SECRET_KEY to your secret key (sk_...) in your environment. " +
    "Do not use a publishable key."
  );
}

export const stripe = new Stripe(stripeSecret, {
  apiVersion: "2024-06-20",
});

// ── Plan limits ───────────────────────────────────────────────────────────────
export const PLAN_LIMITS = {
  free: {
    analysesPerDay:  3,
    commitsPerRepo:  50,
    chatbot:         false,
    privateRepos:    false,
  },
  pro: {
    analysesPerDay:  999, // unlimited
    commitsPerRepo:  500,
    chatbot:         true,
    privateRepos:    true,
  },
  team: {
    analysesPerDay:  999,
    commitsPerRepo:  1000,
    chatbot:         true,
    privateRepos:    true,
  },
};

// ── Get user subscription from Supabase ───────────────────────────────────────
export async function getUserSubscription(userId) {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return { plan: "free", status: "active" };
  }

  // Check if subscription is still active
  if (data.current_period_end) {
    const isExpired = new Date(data.current_period_end) < new Date();
    if (isExpired) return { plan: "free", status: "expired" };
  }

  return data;
}

// ── Get user plan ─────────────────────────────────────────────────────────────
export async function getUserPlan(userId) {
  const sub = await getUserSubscription(userId);
  return sub.plan || "free";
}

// ── Get today's usage count ───────────────────────────────────────────────────
export async function getTodayUsage(userId) {
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("usage")
    .select("analyses")
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  if (error || !data) return 0;
  return data.analyses;
}

// ── Increment usage count ─────────────────────────────────────────────────────
export async function incrementUsage(userId) {
  const today = new Date().toISOString().slice(0, 10);

  const { error } = await supabase.rpc("increment_usage", {
    p_user_id: userId,
    p_date:    today,
  });

  if (error) console.error("Usage increment error:", error);
}

// ── Check if user can analyze ─────────────────────────────────────────────────
export async function canUserAnalyze(userId) {
  const plan  = await getUserPlan(userId);
  const limit = PLAN_LIMITS[plan];

  if (limit.analysesPerDay >= 999) return { allowed: true };

  const usage = await getTodayUsage(userId);

  if (usage >= limit.analysesPerDay) {
    return {
      allowed: false,
      reason:  `You have used all ${limit.analysesPerDay} free analyses for today. Upgrade to Pro for unlimited analyses.`,
    };
  }

  return { allowed: true, remaining: limit.analysesPerDay - usage };
}

// ── Create Stripe checkout session ────────────────────────────────────────────
export async function createCheckoutSession(userId, userEmail, priceId, plan) {
  // Get or create Stripe customer
  let customerId;
  const sub = await getUserSubscription(userId);

  if (sub.stripe_customer_id) {
    customerId = sub.stripe_customer_id;
  } else {
    const customer = await stripe.customers.create({
      email:    userEmail,
      metadata: { userId },
    });
    customerId = customer.id;
  }

  // build callback URLs; fall back to localhost for local dev if not set
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    customer:             customerId,
    payment_method_types: ["card"],
    line_items:           [{ price: priceId, quantity: 1 }],
    mode:                 "subscription",
    success_url:          `${appUrl.replace(/\/$/,"")}/dashboard/billing?success=true`,
    cancel_url:           `${appUrl.replace(/\/$/,"")}/dashboard/billing?canceled=true`,
    metadata:             { userId, plan },
  });

  return session;
}

// ── Create Stripe customer portal session ─────────────────────────────────────
export async function createPortalSession(userId) {
  const sub = await getUserSubscription(userId);

  if (!sub.stripe_customer_id) {
    throw new Error("No Stripe customer found.");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer:   sub.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
  });

  return session;
}