import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] === CHECKOUT REQUEST START ===`);
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      console.error(`[${requestId}] UNAUTHORIZED: No authenticated user`);
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[${requestId}] User authenticated:`, user.email);
    const { bookingId } = await req.json();
    console.log(`[${requestId}] Booking ID:`, bookingId);
    
    if (!bookingId) {
      console.error(`[${requestId}] VALIDATION ERROR: Missing booking ID`);
      return Response.json({ error: 'Booking ID required' }, { status: 400 });
    }

    // Fetch booking with ownership verification
    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
    const booking = bookings[0];

    if (!booking) {
      console.error(`[${requestId}] NOT FOUND: Booking ${bookingId} does not exist`);
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    // CRITICAL: Verify user owns this booking
    if (booking.client_email !== user.email) {
      console.error(`[${requestId}] AUTHORIZATION FAILED: User ${user.email} attempted to pay for booking owned by ${booking.client_email}`);
      return Response.json({ error: 'Unauthorized to pay for this booking' }, { status: 403 });
    }

    // Verify booking status
    if (booking.status !== 'payment_pending') {
      console.error(`[${requestId}] INVALID STATE: Booking status is ${booking.status}, expected payment_pending`);
      return Response.json({ 
        error: `Booking is not ready for payment. Current status: ${booking.status}` 
      }, { status: 400 });
    }

    // Verify amounts are set
    if (!booking.base_event_amount || !booking.platform_fee_amount || booking.total_amount_charged === undefined) {
      console.error(`[${requestId}] INVALID DATA: Missing pricing fields`, {
        base_event_amount: booking.base_event_amount,
        platform_fee_amount: booking.platform_fee_amount,
        total_amount_charged: booking.total_amount_charged
      });
      return Response.json({ 
        error: 'Booking pricing not calculated. Please contact support.' 
      }, { status: 400 });
    }

    // Get vendor's Stripe account
    const vendors = await base44.asServiceRole.entities.Vendor.filter({ id: booking.vendor_id });
    
    if (vendors.length === 0) {
      console.error(`[${requestId}] NOT FOUND: Vendor ${booking.vendor_id} does not exist`);
      return Response.json({ error: 'Vendor not found' }, { status: 404 });
    }
    
    const vendor = vendors[0];
    console.log(`[${requestId}] Vendor Stripe status:`, {
      vendor_id: vendor.id,
      has_account: !!vendor.stripe_account_id,
      verified: vendor.stripe_account_verified
    });
    
    if (!vendor.stripe_account_id) {
      console.error(`[${requestId}] VENDOR ERROR: Missing Stripe account`);
      return Response.json({ 
        error: 'This vendor has not connected their Stripe account yet. Please contact them to complete payment setup.',
        vendor_not_connected: true
      }, { status: 400 });
    }
    
    // Verify Stripe account status
    let stripeAccount;
    try {
      stripeAccount = await stripe.accounts.retrieve(vendor.stripe_account_id);
      console.log(`[${requestId}] Stripe account retrieved:`, {
        charges_enabled: stripeAccount.charges_enabled,
        payouts_enabled: stripeAccount.payouts_enabled,
        details_submitted: stripeAccount.details_submitted
      });
    } catch (stripeError) {
      console.error(`[${requestId}] STRIPE ERROR: Failed to retrieve account`, stripeError);
      return Response.json({ 
        error: 'Unable to verify vendor payment setup. Please contact support.',
        stripe_error: true
      }, { status: 400 });
    }
    
    if (!stripeAccount.charges_enabled || !stripeAccount.details_submitted) {
      console.error(`[${requestId}] VENDOR ERROR: Stripe account not ready`);
      await base44.asServiceRole.entities.Vendor.update(booking.vendor_id, {
        stripe_account_verified: false
      });
      
      return Response.json({ 
        error: 'This vendor needs to complete their Stripe account setup before accepting payments. They will be notified.',
        vendor_setup_incomplete: true
      }, { status: 400 });
    }
    
    // Update vendor verification if needed
    if (!vendor.stripe_account_verified && stripeAccount.charges_enabled) {
      await base44.asServiceRole.entities.Vendor.update(booking.vendor_id, {
        stripe_account_verified: true
      });
    }

    // Calculate amounts in cents - must match booking record exactly
    const baseAmountCents = Math.round(booking.base_event_amount * 100);
    const platformFeeCents = Math.round(booking.platform_fee_amount * 100);
    const taxCents = Math.round((booking.maryland_sales_tax_amount || 0) * 100);
    const totalCents = Math.round(booking.total_amount_charged * 100);

    // Verification: ensure total matches agreed price + tax (EVNT fee comes FROM agreed price)
    const calculatedTotal = baseAmountCents + taxCents;
    if (Math.abs(totalCents - calculatedTotal) > 1) { // Allow 1 cent rounding difference
      console.error(`[${requestId}] AMOUNT MISMATCH:`, {
        expected_total: totalCents,
        calculated_total: calculatedTotal,
        base: baseAmountCents,
        tax: taxCents
      });
      return Response.json({ 
        error: 'Payment amount calculation error. Please contact support.' 
      }, { status: 500 });
    }

    console.log(`[${requestId}] Payment breakdown (cents):`, {
      agreed_price: baseAmountCents,
      platform_fee: platformFeeCents,
      md_tax: taxCents,
      total: totalCents,
      vendor_receives: baseAmountCents - platformFeeCents
    });

    // Get redirect URLs
    const referer = req.headers.get('referer') || req.headers.get('origin') || '';
    const baseUrl = referer ? new URL(referer).origin : 'https://evnt.app';
    console.log(`[${requestId}] Redirect base URL:`, baseUrl);

    // Create Stripe Checkout Session with manual capture (escrow)
    console.log(`[${requestId}] Creating Stripe Checkout Session...`);
    
    // Build line items with detailed breakdown
    const lineItems = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Event Services - ${booking.vendor_name}`,
            description: `${booking.event_type} on ${booking.event_date}${booking.service_description ? '\n' + booking.service_description : ''}\n\nBreakdown:\nService Price: $${booking.base_event_amount.toFixed(2)}\nEVNT Fee (${booking.platform_fee_percent}%): -$${booking.platform_fee_amount.toFixed(2)}\nVendor Receives: $${booking.vendor_payout.toFixed(2)}`,
          },
          unit_amount: baseAmountCents,
        },
        quantity: 1,
      }
    ];
    
    // Add sales tax if applicable
    if (taxCents > 0) {
      const taxPercent = booking.maryland_sales_tax_percent || 0;
      const stateName = booking.client_state ? `${booking.client_state} ` : '';
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${stateName}Sales Tax`,
            description: `${taxPercent.toFixed(1)}% sales tax on service price`,
          },
          unit_amount: taxCents,
        },
        quantity: 1,
      });
    }
    
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      payment_intent_data: {
        capture_method: 'manual', // ESCROW: Holds funds until manual capture
        application_fee_amount: platformFeeCents,
        transfer_data: {
          destination: vendor.stripe_account_id,
        },
        metadata: {
          booking_id: bookingId,
          client_email: booking.client_email,
          vendor_id: booking.vendor_id,
          event_type: booking.event_type,
          event_date: booking.event_date,
          base_event_amount: booking.base_event_amount.toString(),
          platform_fee_amount: booking.platform_fee_amount.toString(),
          maryland_tax_amount: (booking.maryland_sales_tax_amount || 0).toString(),
          total_amount: booking.total_amount_charged.toString(),
          request_id: requestId
        },
      },
      success_url: `${baseUrl}/Bookings?payment=success&booking=${bookingId}`,
      cancel_url: `${baseUrl}/Bookings?payment=cancelled&booking=${bookingId}`,
      client_reference_id: bookingId,
      metadata: {
        booking_id: bookingId,
        request_id: requestId
      },
    });
    
    console.log(`[${requestId}] Checkout Session created:`, {
      session_id: session.id,
      url: session.url
    });
    console.log(`[${requestId}] === CHECKOUT REQUEST SUCCESS ===`);

    return Response.json({ url: session.url });

  } catch (error) {
    console.error(`[${requestId}] === CHECKOUT REQUEST FAILED ===`);
    console.error(`[${requestId}] Error:`, error.message);
    console.error(`[${requestId}] Stack:`, error.stack);
    
    return Response.json({ 
      error: error.message || 'Failed to create checkout session',
      details: error.type || 'unknown_error',
      request_id: requestId
    }, { status: 500 });
  }
});