import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

// Inlined from stateTaxRates.js — no local imports allowed in Deno Deploy
const STATE_TAX_RATES = {
  'AL': { rate: 0.0946, name: 'Alabama' }, 'AK': { rate: 0.0182, name: 'Alaska' },
  'AZ': { rate: 0.0852, name: 'Arizona' }, 'AR': { rate: 0.0946, name: 'Arkansas' },
  'CA': { rate: 0.0899, name: 'California' }, 'CO': { rate: 0.0789, name: 'Colorado' },
  'CT': { rate: 0.0635, name: 'Connecticut' }, 'DE': { rate: 0, name: 'Delaware' },
  'FL': { rate: 0.0698, name: 'Florida' }, 'GA': { rate: 0.0749, name: 'Georgia' },
  'HI': { rate: 0.0450, name: 'Hawaii' }, 'ID': { rate: 0.0603, name: 'Idaho' },
  'IL': { rate: 0.0896, name: 'Illinois' }, 'IN': { rate: 0.0700, name: 'Indiana' },
  'IA': { rate: 0.0694, name: 'Iowa' }, 'KS': { rate: 0.0869, name: 'Kansas' },
  'KY': { rate: 0.0600, name: 'Kentucky' }, 'LA': { rate: 0.1011, name: 'Louisiana' },
  'ME': { rate: 0.0550, name: 'Maine' }, 'MD': { rate: 0.0600, name: 'Maryland' },
  'MA': { rate: 0.0625, name: 'Massachusetts' }, 'MI': { rate: 0.0600, name: 'Michigan' },
  'MN': { rate: 0.0814, name: 'Minnesota' }, 'MS': { rate: 0.0706, name: 'Mississippi' },
  'MO': { rate: 0.0844, name: 'Missouri' }, 'MT': { rate: 0, name: 'Montana' },
  'NE': { rate: 0.0698, name: 'Nebraska' }, 'NV': { rate: 0.0824, name: 'Nevada' },
  'NH': { rate: 0, name: 'New Hampshire' }, 'NJ': { rate: 0.0660, name: 'New Jersey' },
  'NM': { rate: 0.0767, name: 'New Mexico' }, 'NY': { rate: 0.0854, name: 'New York' },
  'NC': { rate: 0.0700, name: 'North Carolina' }, 'ND': { rate: 0.0709, name: 'North Dakota' },
  'OH': { rate: 0.0729, name: 'Ohio' }, 'OK': { rate: 0.0906, name: 'Oklahoma' },
  'OR': { rate: 0, name: 'Oregon' }, 'PA': { rate: 0.0634, name: 'Pennsylvania' },
  'RI': { rate: 0.0700, name: 'Rhode Island' }, 'SC': { rate: 0.0749, name: 'South Carolina' },
  'SD': { rate: 0.0611, name: 'South Dakota' }, 'TN': { rate: 0.0961, name: 'Tennessee' },
  'TX': { rate: 0.0820, name: 'Texas' }, 'UT': { rate: 0.0742, name: 'Utah' },
  'VT': { rate: 0.0639, name: 'Vermont' }, 'VA': { rate: 0.0577, name: 'Virginia' },
  'WA': { rate: 0.0951, name: 'Washington' }, 'WV': { rate: 0.0659, name: 'West Virginia' },
  'WI': { rate: 0.0572, name: 'Wisconsin' }, 'WY': { rate: 0.0556, name: 'Wyoming' },
  'DC': { rate: 0.0600, name: 'District of Columbia' }
};

// Inlined from lib/stripeMetadata.js — no local imports allowed in Deno Deploy
function truncate(str, maxLength) {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

function buildStripeMetadata(booking, options = {}) {
  const metadata = {
    booking_id: booking.id,
    vendor_id: booking.vendor_id,
    client_email: booking.client_email,
    event_type: truncate(booking.event_type, 100),
    event_date: booking.event_date,
    event_location: truncate(booking.location || '', 200),
    base_event_amount: booking.base_event_amount?.toString() || '0',
    platform_fee_amount: booking.platform_fee_amount?.toString() || '0',
    platform_fee_percent: booking.platform_fee_percent?.toString() || '0',
    sales_tax_amount: booking.sales_tax_amount?.toString() || '0',
    stripe_fee_amount: booking.stripe_fee_amount?.toString() || '0',
    total_amount_charged: booking.total_amount_charged?.toString() || '0',
    vendor_payout: booking.vendor_payout?.toString() || '0',
    ...(options.requestId && { request_id: options.requestId }),
  };
  const metadataSize = JSON.stringify(metadata).length;
  if (metadataSize > 50000) {
    console.warn(`Metadata size exceeds safe limit: ${metadataSize} bytes`);
  }
  return metadata;
}

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

    // Verify amounts are set
    if (!booking.base_event_amount || booking.platform_fee_amount === undefined || booking.total_amount_charged === undefined) {
      console.error(`[${requestId}] INVALID DATA: Missing pricing fields`);
      return Response.json({ 
        error: 'Booking pricing not calculated. Please contact support.' 
      }, { status: 400 });
    }

    // CRITICAL: Validate vendor payout is positive
    if (booking.vendor_payout !== undefined && booking.vendor_payout < 0) {
      console.error(`[${requestId}] INVALID DATA: Negative vendor payout`);
      return Response.json({ 
        error: 'Invalid pricing calculation. Vendor payout cannot be negative.' 
      }, { status: 400 });
    }

    // Verify tax rate is pre-calculated
    if (!booking.sales_tax_rate && booking.sales_tax_rate !== 0) {
      console.error(`[${requestId}] CRITICAL: Missing sales_tax_rate.`);
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

    // Calculate amounts in cents
    const baseAmountCents = Math.round(booking.base_event_amount * 100);
    const platformFeeCents = Math.round(booking.platform_fee_amount * 100);
    const salesTaxAmount = booking.sales_tax_amount;
    if (salesTaxAmount === undefined || salesTaxAmount === null) {
      console.error(`[${requestId}] CRITICAL: sales_tax_amount is missing`);
      return Response.json({ error: 'Tax amount not calculated' }, { status: 400 });
    }
    const taxCents = Math.round(salesTaxAmount * 100);
    const totalCents = Math.round(booking.total_amount_charged * 100);

    const calculatedTotal = baseAmountCents;
    if (Math.abs(totalCents - calculatedTotal) > 1) {
      console.warn(`[${requestId}] AMOUNT NOTE: total_amount_charged ($${booking.total_amount_charged}) vs base_event_amount ($${booking.base_event_amount}). Proceeding.`);
    }

    // CRITICAL: Use only standardized stripe_fee_amount field
    if (!booking.stripe_fee_amount && booking.stripe_fee_amount !== 0) {
      console.error(`[${requestId}] CRITICAL: Missing stripe_fee_amount.`);
      return Response.json({ 
        error: 'Stripe fee not calculated. Please recalculate proposal.' 
      }, { status: 400 });
    }
    const stripeFeeAmount = booking.stripe_fee_amount;
    const stripeFeeCents = Math.round(stripeFeeAmount * 100);

    // Get redirect URLs
    const referer = req.headers.get('referer') || req.headers.get('origin') || '';
    const baseUrl = referer ? new URL(referer).origin : 'https://evnt.app';
    
    const additionalFeesTotal = (booking.additional_fees || []).reduce((sum, f) => sum + parseFloat(f.amount || 0), 0);
    const coreServiceCents = Math.round((booking.base_event_amount - additionalFeesTotal) * 100);

    const serviceTitle = booking.service_description
      ? `${booking.service_description} — ${booking.vendor_name}`
      : `${booking.event_type} Service — ${booking.vendor_name}`;

    const feeBreakdownNote = [
      `EVNT platform fee (${booking.platform_fee_percent?.toFixed(1) || '10'}%): $${booking.platform_fee_amount.toFixed(2)}`,
      ...(salesTaxAmount > 0 ? [`${booking.client_state || 'Sales'} tax: $${salesTaxAmount.toFixed(2)}`] : []),
      `Payment processing: $${stripeFeeAmount.toFixed(2)}`,
      `Vendor receives: $${booking.vendor_payout.toFixed(2)}`
    ].join(' · ');

    const lineItems = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: serviceTitle,
            description: `${booking.event_type} · ${booking.event_date}${booking.location ? ' · ' + booking.location : ''}${booking.guest_count ? ' · ' + booking.guest_count + ' guests' : ''} | ${feeBreakdownNote}`,
          },
          unit_amount: Math.max(coreServiceCents, 50),
        },
        quantity: 1,
      },
      ...(booking.additional_fees || [])
        .filter(fee => fee.name && parseFloat(fee.amount) > 0)
        .map(fee => ({
          price_data: {
            currency: 'usd',
            product_data: {
              name: fee.name,
              description: fee.description || `Additional fee from ${booking.vendor_name}`,
            },
            unit_amount: Math.round(parseFloat(fee.amount) * 100),
          },
          quantity: 1,
        })),
    ];

    const lineItemsSum = lineItems.reduce((sum, item) => sum + item.price_data.unit_amount * item.quantity, 0);
    console.log(`[${requestId}] Line items sum: $${(lineItemsSum/100).toFixed(2)}, expected base_event_amount: $${booking.base_event_amount}`);
    
    if (lineItemsSum !== baseAmountCents && Math.abs(lineItemsSum - baseAmountCents) <= 5) {
      lineItems[0].price_data.unit_amount += (baseAmountCents - lineItemsSum);
      console.log(`[${requestId}] Adjusted first item by ${baseAmountCents - lineItemsSum} cents for rounding`);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      payment_intent_data: {
        capture_method: 'manual',
        application_fee_amount: platformFeeCents + taxCents + stripeFeeCents,
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
          message: 'By completing this purchase, you agree to EVNT\'s Terms of Service (joinevnt.com/terms) and Privacy Policy (joinevnt.com/privacy). All bookings are subject to vendor availability and cancellation policies. Your payment is held securely in escrow and released only after your event is completed.',
        },
        after_submit: {
          message: '✅ Booking Confirmed — Your vendor has been notified. A confirmation email has been sent with your booking details.',
        },
      },
      invoice_creation: {
        enabled: true,
        invoice_data: {
          description: `EVNT Secure Checkout — ${serviceTitle}`,
          custom_fields: [
            { name: 'Booking Reference', value: `EVNT-${bookingId.substring(0, 8).toUpperCase()}` },
            { name: 'Service Provider', value: booking.vendor_name },
            { name: 'Client Name', value: booking.client_name || booking.client_email },
            { name: 'Event Date', value: booking.event_date },
            { name: 'Event Location', value: booking.location || 'To be determined' },
            { name: 'Guest Count', value: booking.guest_count ? `${booking.guest_count} guests` : 'Not specified' },
          ],
          footer: `EVNT Platform Fee (${booking.platform_fee_percent?.toFixed(1) || ''}%): $${booking.platform_fee_amount.toFixed(2)}${salesTaxAmount > 0 ? ` | ${booking.client_state || 'Sales'} Tax (${(booking.sales_tax_rate * 100).toFixed(2)}%): $${salesTaxAmount.toFixed(2)}` : ''} | Stripe Processing Fee: $${stripeFeeAmount.toFixed(2)} | Vendor Receives: $${booking.vendor_payout.toFixed(2)}\n\nFunds held in secure escrow until event completion. Questions? support@joinevnt.com | Terms: joinevnt.com/terms | Privacy: joinevnt.com/privacy`,
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