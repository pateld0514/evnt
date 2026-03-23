import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-11-20.acacia',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Always create a new Stripe Connect account for vendors
    // (User record stripe_account_id is for users who are clients, not vendors)
    let accountId;
    const account = await stripe.accounts.create({
      type: 'express',
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    accountId = account.id;

    // Create account link for onboarding
    const baseUrl = Deno.env.get('APP_URL') || 'https://joinevnt.com';
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/VendorRegistration?refresh=true`,
      return_url: `${baseUrl}/VendorRegistration?stripe_success=true&stripe_account_id=${accountId}`,
      type: 'account_onboarding',
    });

    return Response.json({ 
      url: accountLink.url,
      account_id: accountId
    });

  } catch (error) {
    console.error('Stripe Connect error:', error);
    return Response.json({ 
      error: error.message || 'Failed to create Stripe Connect account' 
    }, { status: 500 });
  }
});