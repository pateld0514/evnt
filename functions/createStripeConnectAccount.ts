import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const vendor_id = payload?.vendor_id;

    // Find vendor owned by this user
    let vendors;
    if (vendor_id) {
      vendors = await base44.asServiceRole.entities.Vendor.filter({ id: vendor_id });
    } else {
      // No vendor_id provided, find vendor by created_by
      vendors = await base44.asServiceRole.entities.Vendor.filter({ created_by: user.email });
    }
    if (vendors.length === 0) {
      return Response.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const vendor = vendors[0];
    const actualVendorId = vendor.id;

    // Security: Verify ownership
    if (vendor.created_by !== user.email && user.email !== 'pateld0514@gmail.com') {
      return Response.json({ error: 'Unauthorized - not your vendor profile' }, { status: 403 });
    }

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
          vendor_id: actualVendorId,
          business_name: vendor.business_name,
        }
      });

      accountId = account.id;

      // Save account ID to vendor
      await base44.asServiceRole.entities.Vendor.update(actualVendorId, {
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
          await base44.asServiceRole.entities.Vendor.update(actualVendorId, {
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
            vendor_id: actualVendorId,
            business_name: vendor.business_name,
          }
        });

        accountId = account.id;

        await base44.asServiceRole.entities.Vendor.update(actualVendorId, {
          stripe_account_id: accountId,
          stripe_account_verified: false,
        });
      }
    }

    // Create account link for onboarding
    // Get the origin from referer or use a default
    const referer = req.headers.get('referer') || req.headers.get('origin') || '';
    const baseUrl = referer ? new URL(referer).origin : 'https://evnt.app';
    
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/VendorDashboard?refresh=true`,
      return_url: `${baseUrl}/VendorDashboard?success=true`,
      type: 'account_onboarding',
    });

    return Response.json({ 
      url: accountLink.url,
      account_id: accountId
    });

  } catch (error) {
    console.error('Stripe Connect error:', error);
    
    // Handle specific Stripe errors with helpful messages
    let errorMessage = error.message || 'Failed to create Stripe Connect account';
    
    if (error.message?.includes('platform-profile')) {
      errorMessage = 'Stripe Connect setup incomplete. The platform administrator needs to complete the platform profile setup at https://dashboard.stripe.com/settings/connect/platform-profile';
    } else if (error.type === 'StripeInvalidRequestError') {
      errorMessage = `Stripe configuration error: ${error.message}`;
    }
    
    return Response.json({ 
      error: errorMessage,
      stripe_error_type: error.type,
      needs_platform_setup: error.message?.includes('platform-profile') || false
    }, { status: 500 });
  }
});