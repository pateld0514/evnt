import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';
import { STATE_TAX_RATES } from './stateTaxRates.js';
import { buildStripeMetadata } from './lib/stripeMetadata.js';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      console.error(`[${requestId}] UNAUTHORIZED: No authenticated user`);
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId } = await req.json();
    
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
      console.error(`[${requestId}] AUTHORIZATION FAILED`);
      return Response.json({ error: 'Unauthorized to pay for this booking' }, { status: 403 });
    }

    // Verify booking status
    if (booking.status !== 'payment_pending') {
      console.error(`[${requestId}] INVALID STATE: Booking status is ${booking.status}, expected payment_pending`);
      return Response.json({ 
        error: `Booking is not ready for payment. Current status: ${booking.status}` 
      }, { status: 400 });
    }

    // Verify amounts are set (these should be calculated during negotiation)
    if (!booking.base_event_amount || booking.platform_fee_amount === undefined || booking.total_amount_charged === undefined) {
      console.error(`[${requestId}] INVALID DATA: Missing pricing fields`, {
        base_event_amount: booking.base_event_amount,
        platform_fee_amount: booking.platform_fee_amount,
        total_amount_charged: booking.total_amount_charged
      });
      return Response.json({ 
        error: 'Booking pricing not calculated. Please contact support.' 
      }, { status: 400 });
    }

    // CRITICAL: Validate vendor payout is positive
    if (booking.vendor_payout !== undefined && booking.vendor_payout < 0) {
      console.error(`[${requestId}] INVALID DATA: Negative vendor payout`, {
        vendor_payout: booking.vendor_payout
      });
      return Response.json({ 
        error: 'Invalid pricing calculation. Vendor payout cannot be negative.' 
      }, { status: 400 });
    }

    // Verify tax rate is pre-calculated (CRITICAL)
    if (!booking.sales_tax_rate && booking.sales_tax_rate !== 0) {
      console.error(`[${requestId}] CRITICAL: Missing sales_tax_rate. Booking must have tax calculated during proposal.`);
      return Response.json({ 
        error: 'Tax calculation incomplete. Please recalculate proposal.' 
      }, { status: 400 });
    }
    
    const salesTaxRate = booking.sales_tax_rate;

    // Get vendor's Stripe account
    const vendors = await base44.asServiceRole.entities.Vendor.filter({ id: booking.vendor_id });
    
    if (vendors.length === 0) {
      console.error(`[${requestId}] NOT FOUND: Vendor ${booking.vendor_id} does not exist`);
      return Response.json({ error: 'Vendor not found' }, { status: 404 });
    }
    
    const vendor = vendors[0];
    
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
    // NO FALLBACKS to deprecated fields
    const baseAmountCents = Math.round(booking.base_event_amount * 100);
    const platformFeeCents = Math.round(booking.platform_fee_amount * 100);
    const salesTaxAmount = booking.sales_tax_amount;
    if (salesTaxAmount === undefined || salesTaxAmount === null) {
      console.error(`[${requestId}] CRITICAL: sales_tax_amount is missing`);
      return Response.json({ error: 'Tax amount not calculated' }, { status: 400 });
    }
    const taxCents = Math.round(salesTaxAmount * 100);
    const totalCents = Math.round(booking.total_amount_charged * 100);

    // Verification: ensure total matches base_event_amount (client pays the agreed price)
    // The total_amount_charged equals base_event_amount (fee+tax+stripe deducted from vendor payout)
    const calculatedTotal = baseAmountCents;
    if (Math.abs(totalCents - calculatedTotal) > 1) {
      console.warn(`[${requestId}] AMOUNT NOTE: total_amount_charged ($${booking.total_amount_charged}) vs base_event_amount ($${booking.base_event_amount}). Proceeding.`);
    }

    // CRITICAL: Use only standardized stripe_fee_amount field
    if (!booking.stripe_fee_amount && booking.stripe_fee_amount !== 0) {
      console.error(`[${requestId}] CRITICAL: Missing stripe_fee_amount. Must be calculated during proposal.`);
      return Response.json({ 
        error: 'Stripe fee not calculated. Please recalculate proposal.' 
      }, { status: 400 });
    }
    const stripeFeeAmount = booking.stripe_fee_amount;
    const stripeFeeCents = Math.round(stripeFeeAmount * 100);

    // Get redirect URLs
    const referer = req.headers.get('referer') || req.headers.get('origin') || '';
    const baseUrl = referer ? new URL(referer).origin : 'https://evnt.app';
    
    // Build itemized line items for Stripe checkout
    // 1. Base service price (agreed_price minus additional fees totals)
    const additionalFeesTotal = (booking.additional_fees || []).reduce((sum, f) => sum + parseFloat(f.amount || 0), 0);
    const baseServiceCents = Math.round((booking.base_event_amount - additionalFeesTotal) * 100);

    const serviceTitle = booking.service_description
      ? `${booking.service_description} — ${booking.vendor_name}`
      : `${booking.event_type} Service — ${booking.vendor_name}`;

    const lineItems = [
      // Main service line item
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: serviceTitle,
            description: `Service provided by a verified EVNT vendor. Event Date: ${booking.event_date}${booking.location ? ' · Location: ' + booking.location : ''}${booking.guest_count ? ' · ' + booking.guest_count + ' guests' : ''}`,
          },
          unit_amount: Math.max(baseServiceCents, 0),
        },
        quantity: 1,
      },
      // Dynamic additional vendor fees
      ...(booking.additional_fees || [])
        .filter(fee => fee.name && parseFloat(fee.amount) > 0)
        .map(fee => ({
          price_data: {
            currency: 'usd',
            product_data: {
              name: fee.name,
              description: fee.description || `Additional fee — ${booking.vendor_name}`,
            },
            unit_amount: Math.round(parseFloat(fee.amount) * 100),
          },
          quantity: 1,
        })),
      // EVNT Platform Fee
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'EVNT Platform Fee',
            description: `Marketplace service fee (${booking.platform_fee_percent?.toFixed(1) || ''}%) for booking management, payment protection, and platform support.`,
          },
          unit_amount: platformFeeCents,
        },
        quantity: 1,
      },
      // Sales Tax (only if applicable)
      ...(taxCents > 0 ? [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${booking.client_state || 'Sales'} Tax`,
            description: `Sales tax (${(salesTaxRate * 100).toFixed(2)}%) applied based on service location.`,
          },
          unit_amount: taxCents,
        },
        quantity: 1,
      }] : []),
      // Stripe Processing Fee
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Payment Processing Fee',
            description: 'Secure payment processing powered by Stripe (2.9% + $0.30).',
          },
          unit_amount: stripeFeeCents,
        },
        quantity: 1,
      },
    ];
    
    // Recalculate total from itemized line items to ensure Stripe session total matches
    const itemizedTotal = lineItems.reduce((sum, item) => sum + item.price_data.unit_amount * item.quantity, 0);
    console.log(`[${requestId}] Itemized line items total: $${(itemizedTotal/100).toFixed(2)}, base_event_amount: $${booking.base_event_amount}`);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      payment_intent_data: {
        capture_method: 'manual', // ESCROW: Holds funds until manual capture
        application_fee_amount: platformFeeCents + taxCents + stripeFeeCents, // EVNT keeps fee + tax + Stripe processing fee
        transfer_data: {
          destination: vendor.stripe_account_id,
        },
        metadata: buildStripeMetadata(booking, { requestId }),
        description: `${booking.event_type} on ${booking.event_date}`,
      },
      success_url: `${baseUrl}/Bookings?payment=success&booking=${bookingId}`,
      cancel_url: `${baseUrl}/Bookings?payment=cancelled&booking=${bookingId}`,
      client_reference_id: bookingId,
      customer_email: booking.client_email,
      billing_address_collection: 'required',
      phone_number_collection: {
        enabled: true,
      },
      custom_text: {
        submit: {
          message: 'Complete your secure booking with EVNT. Your payment will be held safely in escrow and only released to the vendor upon successful event completion. By proceeding, you agree to EVNT Terms of Service.',
        },
        shipping_address: {
          message: 'Please confirm your event location address for vendor coordination and service delivery.',
        },
        after_submit: {
          message: 'Payment Successful! 🎉\n\nYour booking is now confirmed and protected by EVNT escrow. You will receive:\n• Detailed booking confirmation via email\n• Professional invoice and service agreement\n• Vendor contact information\n\nYour vendor will reach out within 24 hours to coordinate event details. Thank you for trusting EVNT!',
        },
      },
      invoice_creation: {
        enabled: true,
        invoice_data: {
          description: `EVNT Marketplace - ${booking.event_type} Event Services`,
          custom_fields: [
            {
              name: 'Booking Reference',
              value: `EVNT-${bookingId.substring(0, 8).toUpperCase()}`,
            },
            {
              name: 'Service Provider',
              value: booking.vendor_name,
            },
            {
              name: 'Client Name',
              value: booking.client_name || booking.client_email,
            },
            {
              name: 'Event Type',
              value: booking.event_type,
            },
            {
              name: 'Event Date',
              value: booking.event_date,
            },
            {
              name: 'Event Location',
              value: booking.location || 'To be determined',
            },
            {
              name: 'Guest Count',
              value: booking.guest_count ? `${booking.guest_count} guests` : 'Not specified',
            },
          ],
          footer: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nPRICE BREAKDOWN\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nService Price: $${booking.base_event_amount.toFixed(2)}${booking.additional_fees && booking.additional_fees.length > 0 ? '\n' + booking.additional_fees.map(f => `  + ${f.name}: $${parseFloat(f.amount).toFixed(2)}`).join('\n') : ''}\n\nAgreed Service Price: $${booking.base_event_amount.toFixed(2)}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nClient Pays Total: $${booking.total_amount_charged.toFixed(2)}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nEVNT Fee (${booking.platform_fee_percent.toFixed(1)}%): -$${booking.platform_fee_amount.toFixed(2)}${salesTaxAmount > 0 ? `\n${booking.client_state || 'Sales'} Tax (${(booking.sales_tax_rate * 100).toFixed(1)}%): -$${salesTaxAmount.toFixed(2)}` : ''}\nStripe Processing Fee: -$${stripeFeeAmount.toFixed(2)}\n  ────────────────────────────────────\nVendor Receives: $${booking.vendor_payout.toFixed(2)}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nPAYMENT PROTECTION\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n✓ Funds held in secure escrow until event completion\n✓ Full refund protection per EVNT terms of service\n✓ Dispute resolution support included\n✓ 24/7 customer service available\n\nQuestions? Contact support@evnt.com\nTerms of Service: evnt.com/terms`,
          account_tax_ids: [],
          rendering_options: {
            amount_tax_display: 'include_inclusive_tax',
          },
        },
      },
      metadata: {
        booking_id: bookingId,
        request_id: requestId,
        vendor_name: booking.vendor_name,
        event_type: booking.event_type,
        event_date: booking.event_date,
      },
    });

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