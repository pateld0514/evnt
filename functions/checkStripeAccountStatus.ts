import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !user.vendor_id) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get vendor data
    const vendors = await base44.entities.Vendor.filter({ id: user.vendor_id });
    if (vendors.length === 0) {
      return Response.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const vendor = vendors[0];

    if (!vendor.stripe_account_id) {
      return Response.json({ 
        connected: false,
        charges_enabled: false,
        details_submitted: false
      });
    }

    // Check account status
    try {
      const account = await stripe.accounts.retrieve(vendor.stripe_account_id);
      
      return Response.json({ 
        connected: true,
        charges_enabled: account.charges_enabled,
        details_submitted: account.details_submitted,
        payouts_enabled: account.payouts_enabled,
      });
    } catch (stripeError) {
      // Account doesn't exist, clear it
      console.log('Invalid account, clearing:', stripeError.message);
      await base44.asServiceRole.entities.Vendor.update(user.vendor_id, {
        stripe_account_id: null,
      });
      
      return Response.json({ 
        connected: false,
        charges_enabled: false,
        details_submitted: false
      });
    }

  } catch (error) {
    console.error('Check account status error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});