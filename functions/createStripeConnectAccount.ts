import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !user.vendor_id) {
      return Response.json({ error: 'Unauthorized - Vendor only' }, { status: 403 });
    }

    const { vendor_id } = await req.json();

    if (vendor_id !== user.vendor_id) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get vendor data
    const vendors = await base44.entities.Vendor.filter({ id: vendor_id });
    if (vendors.length === 0) {
      return Response.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const vendor = vendors[0];

    // Create or retrieve Stripe Connect account
    let accountId = vendor.stripe_account_id;
    let accountVerified = false;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: vendor.contact_email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        business_profile: {
          name: vendor.business_name,
          url: vendor.website || undefined,
        },
        metadata: {
          vendor_id: vendor_id,
          business_name: vendor.business_name,
        }
      });

      accountId = account.id;

      // Save account ID to vendor
      await base44.asServiceRole.entities.Vendor.update(vendor_id, {
        stripe_account_id: accountId,
        stripe_account_verified: false,
      });
    } else {
      // Verify existing account still exists and check verification status
      try {
        const account = await stripe.accounts.retrieve(accountId);
        accountVerified = account.charges_enabled && account.payouts_enabled;
        
        // Update verification status if changed
        if (vendor.stripe_account_verified !== accountVerified) {
          await base44.asServiceRole.entities.Vendor.update(vendor_id, {
            stripe_account_verified: accountVerified,
          });
        }
      } catch (stripeError) {
        // Account doesn't exist, create a new one
        console.log('Invalid account, creating new:', stripeError.message);
        const account = await stripe.accounts.create({
          type: 'express',
          email: vendor.contact_email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          business_type: 'individual',
          business_profile: {
            name: vendor.business_name,
            url: vendor.website || undefined,
          },
          metadata: {
            vendor_id: vendor_id,
            business_name: vendor.business_name,
          }
        });

        accountId = account.id;

        await base44.asServiceRole.entities.Vendor.update(vendor_id, {
          stripe_account_id: accountId,
          stripe_account_verified: false,
        });
      }
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${req.headers.get('origin')}/VendorProfile?refresh=true`,
      return_url: `${req.headers.get('origin')}/VendorProfile?success=true`,
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