import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get vendor data - find vendor owned by this user
    const vendors = await base44.asServiceRole.entities.Vendor.filter({ 
      created_by: user.email 
    });
    
    if (vendors.length === 0) {
      return Response.json({ 
        connected: false,
        charges_enabled: false,
        details_submitted: false,
        message: 'No vendor profile found'
      });
    }

    const vendor = vendors[0];

    if (!vendor.stripe_account_id) {
      return Response.json({ 
        connected: false,
        charges_enabled: false,
        details_submitted: false
      });
    }

    // Check account status with Stripe
    try {
      const account = await stripe.accounts.retrieve(vendor.stripe_account_id);
      
      // Update verification status if changed
      const accountVerified = account.charges_enabled && account.payouts_enabled;
      if (vendor.stripe_account_verified !== accountVerified) {
        await base44.asServiceRole.entities.Vendor.update(vendor.id, {
          stripe_account_verified: accountVerified,
        });
      }
      
      return Response.json({ 
        connected: true,
        charges_enabled: account.charges_enabled,
        details_submitted: account.details_submitted,
        payouts_enabled: account.payouts_enabled,
      });
    } catch (stripeError) {
      // Account doesn't exist anymore, clear it
      console.log('Invalid Stripe account, clearing:', stripeError.message);
      await base44.asServiceRole.entities.Vendor.update(vendor.id, {
        stripe_account_id: null,
        stripe_account_verified: false,
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