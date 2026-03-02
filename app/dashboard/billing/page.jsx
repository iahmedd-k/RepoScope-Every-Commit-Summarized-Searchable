"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Sidebar from "../../../components/Sidebar";

// ── Icons ─────────────────────────────────────────────────────────────────────
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
  </svg>
);

const SpinIcon = () => (
  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

// ── Plans config ──────────────────────────────────────────────────────────────
const PLANS = [
  {
    id:          "free",
    name:        "Free",
    monthlyPrice: 0,
    yearlyPrice:  0,
    description: "Perfect for exploring RepoScope",
    color:       "border-[#1e2435]",
    badge:       null,
    features: [
      { text: "3 repo analyses per day",     included: true  },
      { text: "50 commits per repo",          included: true  },
      { text: "AI commit summaries",          included: true  },
      { text: "Public repos only",            included: true  },
      { text: "AI Chatbot",                   included: false },
      { text: "Private repo support",         included: false },
      { text: "500+ commits per repo",        included: false },
      { text: "Priority support",             included: false },
    ],
  },
  {
    id:           "pro",
    name:         "Pro",
    monthlyPrice: 9,
    yearlyPrice:  79,
    monthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID,
    yearlyPriceId:  process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID,
    description:  "For developers who ship regularly",
    color:        "border-violet-500/50",
    badge:        "Most Popular",
    features: [
      { text: "Unlimited repo analyses",      included: true },
      { text: "500 commits per repo",         included: true },
      { text: "AI commit summaries",          included: true },
      { text: "Public repos",                 included: true },
      { text: "AI Chatbot",                   included: true },
      { text: "Private repo support",         included: true },
      { text: "Priority support",             included: true },
      { text: "API access (coming soon)",     included: false },
    ],
  },
  {
    id:           "team",
    name:         "Team",
    monthlyPrice: 24,
    yearlyPrice:  199,
    monthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_TEAM_MONTHLY_PRICE_ID,
    yearlyPriceId:  process.env.NEXT_PUBLIC_STRIPE_TEAM_YEARLY_PRICE_ID,
    description:  "For teams collaborating on codebases",
    color:        "border-emerald-500/40",
    badge:        null,
    features: [
      { text: "Everything in Pro",            included: true },
      { text: "Up to 5 team members",         included: true },
      { text: "1000 commits per repo",        included: true },
      { text: "AI Chatbot",                   included: true },
      { text: "Private repo support",         included: true },
      { text: "Priority support",             included: true },
      { text: "API access (coming soon)",     included: true },
      { text: "Custom integrations",          included: false },
    ],
  },
];

// ── Main Billing Page ─────────────────────────────────────────────────────────
export default function BillingPage() {
  const { user, isSignedIn } = useUser();

  const [billing, setBilling]       = useState("monthly"); // "monthly" | "yearly"
  const [currentPlan, setCurrentPlan] = useState("free");
  const [usage, setUsage]           = useState({ analyses: 0 });
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [toast, setToast]           = useState(null);

  // Check URL params for success/canceled
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      showToast("🎉 Payment successful! Your plan has been upgraded.", "success");
      window.history.replaceState({}, "", "/dashboard/billing");
    }
    if (params.get("canceled") === "true") {
      showToast("Payment canceled. You have not been charged.", "info");
      window.history.replaceState({}, "", "/dashboard/billing");
    }
  }, []);

  // Fetch current plan + usage
  useEffect(() => {
    if (!isSignedIn) return;
    fetchPlanAndUsage();
  }, [isSignedIn]);

  const fetchPlanAndUsage = async () => {
    try {
      const res  = await fetch("/api/stripe/plan");
      const data = await res.json();
      setCurrentPlan(data.plan || "free");
      setUsage(data.usage || { analyses: 0 });
    } catch (e) {
      console.error("Failed to fetch plan:", e);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Handle upgrade ─────────────────────────────────────────────────────────
  const handleUpgrade = async (plan) => {
    if (!isSignedIn) { showToast("Please sign in first.", "error"); return; }
    if (plan.id === "free" || plan.id === currentPlan) return;

    const priceId = billing === "monthly" ? plan.monthlyPriceId : plan.yearlyPriceId;
    if (!priceId) {
      showToast("Price ID not configured. Add Stripe price IDs to .env.local", "error");
      return;
    }

    setLoadingPlan(plan.id);
    try {
      const res  = await fetch("/api/stripe/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ priceId, plan: plan.id }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else showToast(data.error || "Something went wrong.", "error");
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setLoadingPlan(null);
    }
  };

  // ── Handle manage subscription ─────────────────────────────────────────────
  const handleManage = async () => {
    setPortalLoading(true);
    try {
      const res  = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else showToast(data.error || "Could not open portal.", "error");
    } catch {
      showToast("Network error.", "error");
    } finally {
      setPortalLoading(false);
    }
  };

  const freeLimit   = 3;
  const usagePercent = Math.min((usage.analyses / freeLimit) * 100, 100);

  return (
    <div className="flex h-screen bg-[#07080c] overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="h-14 border-b border-[#1a1f30] flex items-center px-6 gap-4 flex-shrink-0">
          <h1 className="text-sm font-semibold text-slate-300 flex-1">Billing</h1>
          {currentPlan !== "free" && (
            <button
              onClick={handleManage}
              disabled={portalLoading}
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg transition-colors"
            >
              {portalLoading ? <SpinIcon /> : null}
              Manage Subscription
            </button>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-6">

          {/* Toast */}
          {toast && (
            <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-2xl border transition-all ${
              toast.type === "success"
                ? "bg-emerald-600/20 border-emerald-500/30 text-emerald-300"
                : toast.type === "error"
                ? "bg-red-600/20 border-red-500/30 text-red-300"
                : "bg-slate-700/80 border-slate-600/30 text-slate-200"
            }`}>
              {toast.message}
            </div>
          )}

          {/* Current Plan + Usage */}
          {isSignedIn && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-w-4xl">

              {/* Current Plan Card */}
              <div className="bg-[#0e1117] border border-[#1e2435] rounded-2xl p-5">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Current Plan</p>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`px-3 py-1 rounded-lg text-sm font-semibold capitalize ${
                    currentPlan === "free" ? "bg-slate-700/50 text-slate-300" :
                    currentPlan === "pro"  ? "bg-violet-600/20 text-violet-300 ring-1 ring-violet-500/30" :
                                             "bg-emerald-600/20 text-emerald-300 ring-1 ring-emerald-500/30"
                  }`}>
                    {currentPlan}
                  </div>
                  {currentPlan !== "free" && (
                    <span className="text-xs text-slate-500">Active subscription</span>
                  )}
                </div>
                {currentPlan === "free" ? (
                  <p className="text-xs text-slate-500">Upgrade to Pro to unlock unlimited analyses and AI Chat.</p>
                ) : (
                  <p className="text-xs text-slate-500">
                    Manage your subscription, update payment method, or cancel anytime.
                  </p>
                )}
              </div>

              {/* Usage Card — only for free users */}
              {currentPlan === "free" && (
                <div className="bg-[#0e1117] border border-[#1e2435] rounded-2xl p-5">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Today's Usage</p>
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-2xl font-bold text-slate-100">{usage.analyses}</span>
                    <span className="text-xs text-slate-500">/ {freeLimit} analyses</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all ${
                        usagePercent >= 100 ? "bg-red-500" :
                        usagePercent >= 66  ? "bg-amber-500" : "bg-violet-500"
                      }`}
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-600">
                    {usagePercent >= 100
                      ? "Daily limit reached. Resets at midnight or upgrade to Pro."
                      : `${freeLimit - usage.analyses} analyses remaining today`}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Billing Toggle */}
          <div className="flex items-center justify-between mb-6 max-w-4xl">
            <div>
              <h2 className="text-lg font-bold text-slate-100">Choose your plan</h2>
              <p className="text-sm text-slate-500">Upgrade anytime. Cancel anytime.</p>
            </div>
            <div className="flex items-center gap-1 bg-[#0e1117] border border-[#1e2435] rounded-xl p-1">
              <button
                onClick={() => setBilling("monthly")}
                className={`text-xs px-4 py-2 rounded-lg transition-all ${
                  billing === "monthly"
                    ? "bg-violet-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling("yearly")}
                className={`text-xs px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                  billing === "yearly"
                    ? "bg-violet-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Yearly
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                  billing === "yearly" ? "bg-white/20" : "bg-emerald-500/20 text-emerald-400"
                }`}>
                  Save 27%
                </span>
              </button>
            </div>
          </div>

          {/* Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
            {PLANS.map((plan) => {
              const price     = billing === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
              const isCurrent = currentPlan === plan.id;
              const isPopular = plan.badge === "Most Popular";

              return (
                <div
                  key={plan.id}
                  className={`relative bg-[#0e1117] border-2 rounded-2xl p-6 flex flex-col transition-all ${
                    plan.color
                  } ${isPopular ? "shadow-lg shadow-violet-900/20" : ""}`}
                >
                  {/* Popular badge */}
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      {plan.badge}
                    </div>
                  )}

                  {/* Plan name */}
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-slate-100 mb-1">{plan.name}</h3>
                    <p className="text-xs text-slate-500">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-bold text-slate-100">${price}</span>
                      {price > 0 && (
                        <span className="text-sm text-slate-500 mb-1">
                          /{billing === "monthly" ? "mo" : "yr"}
                        </span>
                      )}
                    </div>
                    {billing === "yearly" && price > 0 && (
                      <p className="text-xs text-emerald-400 mt-1">
                        ${(price / 12).toFixed(2)}/mo billed annually
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-6 flex-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className={`flex items-center gap-2.5 text-xs ${
                        f.included ? "text-slate-300" : "text-slate-600"
                      }`}>
                        <span className={`flex-shrink-0 ${
                          f.included ? "text-emerald-400" : "text-slate-700"
                        }`}>
                          {f.included ? <CheckIcon /> : <XIcon />}
                        </span>
                        {f.text}
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  {isCurrent ? (
                    <div className="w-full py-2.5 rounded-xl bg-white/5 border border-[#1e2435] text-center text-xs text-slate-500 font-medium">
                      Current Plan
                    </div>
                  ) : plan.id === "free" ? (
                    <div className="w-full py-2.5 rounded-xl bg-white/5 border border-[#1e2435] text-center text-xs text-slate-600 font-medium">
                      Default Plan
                    </div>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(plan)}
                      disabled={loadingPlan === plan.id}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        isPopular
                          ? "bg-violet-600 hover:bg-violet-500 text-white"
                          : "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {loadingPlan === plan.id ? (
                        <><SpinIcon /> Processing...</>
                      ) : (
                        `Upgrade to ${plan.name} →`
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Test mode notice */}
          <div className="mt-6 max-w-4xl flex items-center gap-2 text-xs text-slate-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 flex-shrink-0">
              <circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" strokeLinecap="round" />
            </svg>
            Test mode active — use card number <code className="font-mono text-slate-500 bg-slate-800/60 px-1.5 py-0.5 rounded">4242 4242 4242 4242</code> with any future expiry and any CVC to test payments.
          </div>
        </main>
      </div>
    </div>
  );
}