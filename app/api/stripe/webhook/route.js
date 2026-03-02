import { NextResponse } from "next/server";
import { stripe } from "../../../../lib/stripe";
import { supabase } from "../../../../lib/supabase";

export async function POST(request) {
  const body      = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {

      // ── Payment succeeded — activate subscription ───────────────────────
      case "checkout.session.completed": {
        const session  = event.data.object;
        const userId   = session.metadata?.userId;
        const plan     = session.metadata?.plan;
        const subId    = session.subscription;
        const cusId    = session.customer;

        if (!userId) break;

        // Fetch subscription details for period end
        const subscription = await stripe.subscriptions.retrieve(subId);

        await supabase.from("subscriptions").upsert({
          user_id:                 userId,
          stripe_customer_id:      cusId,
          stripe_subscription_id:  subId,
          plan:                    plan || "pro",
          status:                  "active",
          current_period_end:      new Date(subscription.current_period_end * 1000).toISOString(),
        }, { onConflict: "user_id" });

        console.log(`✅ Subscription activated for user ${userId} — plan: ${plan}`);
        break;
      }

      // ── Subscription updated ────────────────────────────────────────────
      case "customer.subscription.updated": {
        const sub    = event.data.object;
        const cusId  = sub.customer;

        // Find user by customer ID
        const { data } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", cusId)
          .single();

        if (!data) break;

        await supabase.from("subscriptions").upsert({
          user_id:                data.user_id,
          stripe_subscription_id: sub.id,
          status:                 sub.status,
          current_period_end:     new Date(sub.current_period_end * 1000).toISOString(),
        }, { onConflict: "user_id" });

        console.log(`🔄 Subscription updated for customer ${cusId}`);
        break;
      }

      // ── Subscription canceled ────────────────────────────────────────────
      case "customer.subscription.deleted": {
        const sub   = event.data.object;
        const cusId = sub.customer;

        const { data } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", cusId)
          .single();

        if (!data) break;

        await supabase.from("subscriptions").upsert({
          user_id: data.user_id,
          plan:    "free",
          status:  "canceled",
        }, { onConflict: "user_id" });

        console.log(`❌ Subscription canceled for customer ${cusId}`);
        break;
      }

      // ── Payment failed ────────────────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const cusId   = invoice.customer;

        const { data } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", cusId)
          .single();

        if (!data) break;

        await supabase.from("subscriptions")
          .update({ status: "past_due" })
          .eq("user_id", data.user_id);

        console.log(`⚠️ Payment failed for customer ${cusId}`);
        break;
      }

      default:
        console.log(`Unhandled event: ${event.type}`);
    }
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}