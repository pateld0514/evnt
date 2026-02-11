import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-11-20.acacia',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.stripe_account_id) {
      return Response.json({ 
        connected: false,
        charges_enabled: false,
        payouts_enabled: false
      });
    }

    // Retrieve account details from Stripe
    const account = await stripe.accounts.retrieve(user.stripe_account_id);

    return Response.json({
      connected: true,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
    });

  } catch (error) {
    console.error('Stripe status check error:', error);
    return Response.json({ 
      connected: false,
      error: error.message 
    }, { status: 500 });
  }
});