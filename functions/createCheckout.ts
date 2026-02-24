import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

// State sales tax rates for event services
const STATE_TAX_RATES = {
  'AL': 0.04, 'AK': 0, 'AZ': 0.056, 'AR': 0.065, 'CA': 0.0725,
  'CO': 0.029, 'CT': 0.0635, 'DE': 0, 'FL': 0.06, 'GA': 0.04,
  'HI': 0.04, 'ID': 0.06, 'IL': 0.0625, 'IN': 0.07, 'IA': 0.06,
  'KS': 0.065, 'KY': 0.06, 'LA': 0.0445, 'ME': 0.055, 'MD': 0.06,
  'MA': 0.0625, 'MI': 0.06, 'MN': 0.06875, 'MS': 0.07, 'MO': 0.04225,
  'MT': 0, 'NE': 0.055, 'NV': 0.0685, 'NH': 0, 'NJ': 0.06625,
  'NM': 0.05125, 'NY': 0.04, 'NC': 0.0475, 'ND': 0.05, 'OH': 0.0575,
  'OK': 0.045, 'OR': 0, 'PA': 0.06, 'RI': 0.07, 'SC': 0.06,
  'SD': 0.045, 'TN': 0.07, 'TX': 0.0625, 'UT': 0.0485, 'VT': 0.06,
  'VA': 0.053, 'WA': 0.065, 'WV': 0.06, 'WI': 0.05, 'WY': 0.04,
  'DC': 0.06
};

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

    // Extract state from location (expecting format like "City, ST" or "ST")
    const locationState = booking.location ? booking.location.split(',').pop().trim().toUpperCase() : null;
    const salesTaxRate = locationState && STATE_TAX_RATES[locationState] ? STATE_TAX_RATES[locationState] : 0;
    
    console.log(`[${requestId}] Tax calculation:`, {
      location: booking.location,
      extracted_state: locationState,
      tax_rate: salesTaxRate
    });

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
    const salesTaxAmount = booking.sales_tax_amount || booking.maryland_sales_tax_amount || 0;
    const taxCents = Math.round(salesTaxAmount * 100);
    const totalCents = Math.round(booking.total_amount_charged * 100);

    // Verification: ensure total matches agreed price (both fee and tax deducted FROM it)
    // Client only pays the agreed service price, nothing added
    const calculatedTotal = baseAmountCents;
    if (Math.abs(totalCents - calculatedTotal) > 1) { // Allow 1 cent rounding difference
      console.error(`[${requestId}] AMOUNT MISMATCH:`, {
        expected_total: totalCents,
        calculated_total: calculatedTotal,
        base: baseAmountCents,
        fee: platformFeeCents,
        tax: taxCents
      });
      return Response.json({ 
        error: 'Payment amount calculation error. Please contact support.' 
      }, { status: 500 });
    }

    // Use pre-calculated Stripe fee from negotiation to ensure consistency
    // If not available (legacy bookings), calculate it
    const stripeFeeAmount = booking.stripe_fee_amount || ((booking.total_amount_charged * 0.029) + 0.30);
    const stripeFeeCents = Math.round(stripeFeeAmount * 100);
    
    console.log(`[${requestId}] Payment breakdown (cents):`, {
      agreed_price: baseAmountCents,
      platform_fee: platformFeeCents,
      sales_tax: taxCents,
      stripe_fee: stripeFeeCents,
      total_client_pays: totalCents,
      total_evnt_keeps: platformFeeCents + taxCents + stripeFeeCents,
      vendor_receives: baseAmountCents - platformFeeCents - taxCents - stripeFeeCents
    });

    // Get redirect URLs
    const referer = req.headers.get('referer') || req.headers.get('origin') || '';
    const baseUrl = referer ? new URL(referer).origin : 'https://evnt.app';
    console.log(`[${requestId}] Redirect base URL:`, baseUrl);

    // Create Stripe Checkout Session with manual capture (escrow)
    console.log(`[${requestId}] Creating Stripe Checkout Session...`);
    
    // Build comprehensive line items breakdown
    const additionalFeesText = booking.additional_fees && booking.additional_fees.length > 0
      ? '\n\nADDITIONAL SERVICES:\n' + booking.additional_fees.map(fee => 
          `• ${fee.name}: $${parseFloat(fee.amount).toFixed(2)}${fee.description ? ' - ' + fee.description : ''}`
        ).join('\n')
      : '';

    const lineItems = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${booking.event_type} Event - ${booking.vendor_name}`,
            description: `EVNT MARKETPLACE BOOKING\n━━━━━━━━━━━━━━━━━━━━━━━━\n\nEVENT DETAILS:\n• Type: ${booking.event_type}\n• Date: ${booking.event_date}\n• Location: ${booking.location || 'To be determined'}\n• Client: ${booking.client_name || booking.client_email}\n\nSERVICE PROVIDER:\n• Vendor: ${booking.vendor_name}\n${booking.service_description ? '• Services: ' + booking.service_description : '• Professional event services'}${additionalFeesText}\n\nPAYMENT PROTECTION:\n• Secure escrow until event completion\n• Full refund protection per EVNT policies\n• 24/7 customer support`,
            images: [],
          },
          unit_amount: baseAmountCents,
        },
        quantity: 1,
      }
    ];
    
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
        metadata: {
          booking_id: bookingId,
          client_email: booking.client_email,
          vendor_id: booking.vendor_id,
          event_type: booking.event_type,
          event_date: booking.event_date,
          event_location: booking.location || '',
          base_event_amount: booking.base_event_amount.toString(),
          platform_fee_amount: booking.platform_fee_amount.toString(),
          platform_fee_percent: booking.platform_fee_percent.toString(),
          sales_tax_amount: (booking.sales_tax_amount || booking.maryland_sales_tax_amount || 0).toString(),
          total_amount: booking.total_amount_charged.toString(),
          vendor_payout: booking.vendor_payout.toString(),
          stripe_fee_calculated: stripeFeeAmount.toString(),
          stripe_fee_saved: (booking.stripe_fee_amount || 0).toString(),
          request_id: requestId
        },
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
          footer: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nPAYMENT BREAKDOWN\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nAgreed Service Price: $${booking.base_event_amount.toFixed(2)}\n${booking.additional_fees && booking.additional_fees.length > 0 ? '\nAdditional Services:\n' + booking.additional_fees.map(f => `  • ${f.name}: $${parseFloat(f.amount).toFixed(2)}`).join('\n') + '\n' : ''}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nTOTAL YOU PAY: $${booking.total_amount_charged.toFixed(2)}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nFEE ALLOCATION (Deducted from agreed price):\n  EVNT Platform Fee (${booking.platform_fee_percent.toFixed(1)}%): -$${booking.platform_fee_amount.toFixed(2)}${salesTaxAmount > 0 ? `\n  State Sales Tax: -$${salesTaxAmount.toFixed(2)}` : ''}\n  Payment Processing Fee: -$${(stripeFeeCents / 100).toFixed(2)}\n  ────────────────────────────────────\n  Vendor Receives: $${booking.vendor_payout.toFixed(2)}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nPAYMENT PROTECTION\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n✓ Funds held in secure escrow until event completion\n✓ Full refund protection per EVNT terms of service\n✓ Dispute resolution support included\n✓ 24/7 customer service available\n\nQuestions? Contact support@evnt.com\nTerms of Service: evnt.com/terms`,
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