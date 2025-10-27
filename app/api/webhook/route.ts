import { NextRequest, NextResponse } from 'next/server';
import { createOrUpdateProfile, getProfile } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('whop-signature');
    const body = await req.text();
    
    // Verify webhook signature (basic check)
    if (!signature) {
      console.error('Missing webhook signature');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const event = JSON.parse(body);

    // Handle different webhook events
    switch (event.type) {
      case 'checkout.completed':
        await handleCheckoutCompleted(event);
        break;
      
      case 'subscription.created':
      case 'subscription.updated':
        await handleSubscriptionUpdate(event);
        break;
      
      case 'subscription.cancelled':
      case 'subscription.expired':
        await handleSubscriptionCancelled(event);
        break;
      
      default:
        console.log('Unhandled webhook event:', event.type);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(event: any) {
  const userId = event.data.user_id;
  const productId = event.data.product_id;

  const profile = await getProfile(userId);
  if (!profile) return;

  // Check if it's a single match purchase or subscription
  if (productId.includes('single-match')) {
    // Grant one-time match
    await createOrUpdateProfile({
      ...profile,
      has_unlimited_matches: false,
    });
  } else if (productId.includes('subscription')) {
    // Grant unlimited matches via subscription
    await createOrUpdateProfile({
      ...profile,
      active_subscription: true,
      has_unlimited_matches: true,
    });
  }

  console.log(`Checkout completed for user ${userId}`);
}

async function handleSubscriptionUpdate(event: any) {
  const userId = event.data.user_id;

  const profile = await getProfile(userId);
  if (!profile) return;

  await createOrUpdateProfile({
    ...profile,
    active_subscription: true,
    has_unlimited_matches: true,
  });

  console.log(`Subscription activated for user ${userId}`);
}

async function handleSubscriptionCancelled(event: any) {
  const userId = event.data.user_id;

  const profile = await getProfile(userId);
  if (!profile) return;

  await createOrUpdateProfile({
    ...profile,
    active_subscription: false,
    has_unlimited_matches: false,
  });

  console.log(`Subscription cancelled for user ${userId}`);
}

