import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// State sales tax rates for event services (2026 - combined state + avg local)
const STATE_TAX_RATES = {
  'AL': { rate: 0.0946, name: 'Alabama' },
  'AK': { rate: 0.0182, name: 'Alaska' },
  'AZ': { rate: 0.0852, name: 'Arizona' },
  'AR': { rate: 0.0946, name: 'Arkansas' },
  'CA': { rate: 0.0899, name: 'California' },
  'CO': { rate: 0.0789, name: 'Colorado' },
  'CT': { rate: 0.0635, name: 'Connecticut' },
  'DE': { rate: 0, name: 'Delaware' },
  'FL': { rate: 0.0698, name: 'Florida' },
  'GA': { rate: 0.0749, name: 'Georgia' },
  'HI': { rate: 0.0450, name: 'Hawaii' },
  'ID': { rate: 0.0603, name: 'Idaho' },
  'IL': { rate: 0.0896, name: 'Illinois' },
  'IN': { rate: 0.0700, name: 'Indiana' },
  'IA': { rate: 0.0694, name: 'Iowa' },
  'KS': { rate: 0.0869, name: 'Kansas' },
  'KY': { rate: 0.0600, name: 'Kentucky' },
  'LA': { rate: 0.1011, name: 'Louisiana' },
  'ME': { rate: 0.0550, name: 'Maine' },
  'MD': { rate: 0.0600, name: 'Maryland' },
  'MA': { rate: 0.0625, name: 'Massachusetts' },
  'MI': { rate: 0.0600, name: 'Michigan' },
  'MN': { rate: 0.0814, name: 'Minnesota' },
  'MS': { rate: 0.0706, name: 'Mississippi' },
  'MO': { rate: 0.0844, name: 'Missouri' },
  'MT': { rate: 0, name: 'Montana' },
  'NE': { rate: 0.0698, name: 'Nebraska' },
  'NV': { rate: 0.0824, name: 'Nevada' },
  'NH': { rate: 0, name: 'New Hampshire' },
  'NJ': { rate: 0.0660, name: 'New Jersey' },
  'NM': { rate: 0.0767, name: 'New Mexico' },
  'NY': { rate: 0.0854, name: 'New York' },
  'NC': { rate: 0.0700, name: 'North Carolina' },
  'ND': { rate: 0.0709, name: 'North Dakota' },
  'OH': { rate: 0.0729, name: 'Ohio' },
  'OK': { rate: 0.0906, name: 'Oklahoma' },
  'OR': { rate: 0, name: 'Oregon' },
  'PA': { rate: 0.0634, name: 'Pennsylvania' },
  'RI': { rate: 0.0700, name: 'Rhode Island' },
  'SC': { rate: 0.0749, name: 'South Carolina' },
  'SD': { rate: 0.0611, name: 'South Dakota' },
  'TN': { rate: 0.0961, name: 'Tennessee' },
  'TX': { rate: 0.0820, name: 'Texas' },
  'UT': { rate: 0.0742, name: 'Utah' },
  'VT': { rate: 0.0639, name: 'Vermont' },
  'VA': { rate: 0.0577, name: 'Virginia' },
  'WA': { rate: 0.0951, name: 'Washington' },
  'WV': { rate: 0.0659, name: 'West Virginia' },
  'WI': { rate: 0.0572, name: 'Wisconsin' },
  'WY': { rate: 0.0556, name: 'Wyoming' },
  'DC': { rate: 0.0600, name: 'District of Columbia' }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      bookingId, 
      agreedPrice, 
      additionalFees, 
      serviceDescription,
      clientState 
    } = await req.json();

    if (!bookingId || !agreedPrice) {
      return Response.json({ 
        error: 'bookingId and agreedPrice are required' 
      }, { status: 400 });
    }

    // Fetch booking to verify ownership and get details
    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
    const booking = bookings[0];

    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify user is authorized (vendor, client, or admin)
    const isVendor = user.vendor_id && booking.vendor_id === user.vendor_id;
    const isClient = booking.client_email === user.email;
    const isAdmin = user.email === "pateld0514@gmail.com" || user.role === "admin";

    if (!isVendor && !isClient && !isAdmin) {
      return Response.json({ 
        error: 'Forbidden: Cannot modify this booking' 
      }, { status: 403 });
    }

    // Calculate totals
    const price = parseFloat(agreedPrice);
    const fees = additionalFees || [];
    const additionalTotal = fees.reduce((sum, fee) => sum + (parseFloat(fee.amount) || 0), 0);
    const agreedAmount = price + additionalTotal;

    // Get platform fee settings
    const feeSettings = await base44.asServiceRole.entities.PlatformSettings.filter({ 
      setting_key: 'platform_fee_percent' 
    });
    const baseFeePercent = feeSettings.length > 0 ? parseFloat(feeSettings[0].setting_value) : 10;

    // Get dynamic fee with tier discounts
    let finalFeePercent = baseFeePercent;
    try {
      const feeCalc = await base44.asServiceRole.functions.invoke('calculateDynamicFee', {
        vendor_id: booking.vendor_id,
        client_email: booking.client_email,
        booking_amount: agreedAmount
      });
      if (feeCalc.data?.final_fee_percent !== undefined) {
        finalFeePercent = feeCalc.data.final_fee_percent;
      }
    } catch (error) {
      console.warn('Failed to calculate dynamic fee, using base:', error);
    }

    // Check for referral discounts
    let appliedDiscount = 0;
    const rewards = await base44.asServiceRole.entities.ReferralReward.filter({ 
      referrer_email: booking.client_email,
      status: 'earned'
    });
    if (rewards.length > 0) {
      appliedDiscount = rewards[0].reward_amount || 0;
    }

    // Apply discount to agreed amount
    const discountedAmount = Math.max(0, agreedAmount - appliedDiscount);

    // Calculate platform fee on discounted amount
    const platformFeeAmount = (discountedAmount * finalFeePercent) / 100;

    // Get state for tax calculation - prioritize provided state, then booking location, then user profile
    let stateAbbr = clientState;
    
    if (!stateAbbr && booking.location) {
      // Extract state from "City, ST" format
      const match = booking.location.match(/,\s*([A-Z]{2})(?:\s|$)/);
      if (match) {
        stateAbbr = match[1];
      }
    }

    if (!stateAbbr) {
      // Fallback to user's state
      const clientUsers = await base44.asServiceRole.entities.User.filter({ email: booking.client_email });
      if (clientUsers.length > 0 && clientUsers[0].state) {
        stateAbbr = clientUsers[0].state;
      }
    }

    // Calculate sales tax
    let salesTaxRate = 0;
    let taxLabel = '';
    if (stateAbbr && STATE_TAX_RATES[stateAbbr]) {
      salesTaxRate = STATE_TAX_RATES[stateAbbr].rate;
      taxLabel = `${STATE_TAX_RATES[stateAbbr].name} Sales Tax (${(salesTaxRate * 100).toFixed(1)}%)`;
    }

    const salesTax = salesTaxRate > 0 ? discountedAmount * salesTaxRate : 0;

    // Calculate Stripe processing fee (2.9% + $0.30)
    const stripeFee = (discountedAmount * 0.029) + 0.30;

    // Calculate vendor payout: discounted amount - all deductions
    const totalDeductions = platformFeeAmount + salesTax + stripeFee;
    const vendorPayout = discountedAmount - totalDeductions;
    const totalAmount = discountedAmount; // Client pays the discounted agreed price

    // Return validated financial breakdown
    return Response.json({
      success: true,
      calculation: {
        base_price: price,
        additional_fees: fees,
        additional_total: additionalTotal,
        subtotal: agreedAmount,
        discount_applied: appliedDiscount,
        base_event_amount: discountedAmount,
        agreed_price: discountedAmount,
        platform_fee_percent: finalFeePercent,
        platform_fee_amount: parseFloat(platformFeeAmount.toFixed(2)),
        sales_tax_rate: salesTaxRate,
        sales_tax_amount: parseFloat(salesTax.toFixed(2)),
        tax_label: taxLabel,
        state_abbreviation: stateAbbr || null,
        stripe_fee: parseFloat(stripeFee.toFixed(2)),
        total_amount_charged: parseFloat(totalAmount.toFixed(2)),
        vendor_payout: parseFloat(vendorPayout.toFixed(2)),
        service_description: serviceDescription || null
      }
    });

  } catch (error) {
    console.error('Calculate proposal error:', error);
    return Response.json({ 
      error: error.message || 'Failed to calculate proposal' 
    }, { status: 500 });
  }
});