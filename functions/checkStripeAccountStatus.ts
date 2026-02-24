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

    // Check if vendor - use vendor's Stripe account ID
    let stripeAccountId = user.stripe_account_id;
    
    if (user.user_type === 'vendor' && user.vendor_id) {
      // Fetch vendor record to get Stripe account
      const vendors = await base44.asServiceRole.entities.Vendor.filter({ id: user.vendor_id });
      if (vendors.length > 0 && vendors[0].stripe_account_id) {
        stripeAccountId = vendors[0].stripe_account_id;
      }
    }

    if (!stripeAccountId) {
      return Response.json({ 
        connected: false,
        charges_enabled: false,
        payouts_enabled: false,
        details_submitted: false
      });
    }

    // Retrieve account details from Stripe
    const account = await stripe.accounts.retrieve(stripeAccountId);

    return Response.json({
      connected: true,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      account_id: stripeAccountId
    });

  } catch (error) {
    console.error('Stripe status check error:', error);
    return Response.json({ 
      connected: false,
      error: error.message 
    }, { status: 500 });
  }
});