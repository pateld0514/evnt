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

    // Check if vendor - use vendor's Stripe account ID
    // vendor_id may be nested in user.data or at top level
    const vendorId = user.vendor_id || user.data?.vendor_id;
    const userType = user.user_type || user.data?.user_type;
    let stripeAccountId = user.stripe_account_id || user.data?.stripe_account_id;
    
    if (userType === 'vendor') {
      // Look up vendor by contact_email (most reliable — id filter doesn't work on top-level id)
      const vendors = await base44.asServiceRole.entities.Vendor.filter({ contact_email: user.email });
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

    // Short-circuit for test/demo accounts — never hit the real Stripe API
    if (stripeAccountId.startsWith('acct_test_')) {
      return Response.json({
        connected: true,
        charges_enabled: true,
        payouts_enabled: true,
        details_submitted: true,
        account_id: stripeAccountId,
        is_test_account: true
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
      error: error?.message || String(error)
    }, { status: 500 });
  }
});