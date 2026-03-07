import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
// Inline tax rates to avoid import issues (no local imports in functions)
const STATE_TAX_RATES = {
  'AL': { rate: 0.0946 }, 'AK': { rate: 0.0182 }, 'AZ': { rate: 0.0852 }, 'AR': { rate: 0.0946 },
  'CA': { rate: 0.0899 }, 'CO': { rate: 0.0789 }, 'CT': { rate: 0.0635 }, 'DE': { rate: 0 },
  'FL': { rate: 0.0698 }, 'GA': { rate: 0.0749 }, 'HI': { rate: 0.0450 }, 'ID': { rate: 0.0603 },
  'IL': { rate: 0.0896 }, 'IN': { rate: 0.0700 }, 'IA': { rate: 0.0694 }, 'KS': { rate: 0.0869 },
  'KY': { rate: 0.0600 }, 'LA': { rate: 0.1011 }, 'ME': { rate: 0.0550 }, 'MD': { rate: 0.0600 },
  'MA': { rate: 0.0625 }, 'MI': { rate: 0.0600 }, 'MN': { rate: 0.0814 }, 'MS': { rate: 0.0706 },
  'MO': { rate: 0.0844 }, 'MT': { rate: 0 }, 'NE': { rate: 0.0698 }, 'NV': { rate: 0.0824 },
  'NH': { rate: 0 }, 'NJ': { rate: 0.0660 }, 'NM': { rate: 0.0767 }, 'NY': { rate: 0.0854 },
  'NC': { rate: 0.0700 }, 'ND': { rate: 0.0709 }, 'OH': { rate: 0.0729 }, 'OK': { rate: 0.0906 },
  'OR': { rate: 0 }, 'PA': { rate: 0.0634 }, 'RI': { rate: 0.0700 }, 'SC': { rate: 0.0749 },
  'SD': { rate: 0.0611 }, 'TN': { rate: 0.0961 }, 'TX': { rate: 0.0820 }, 'UT': { rate: 0.0742 },
  'VT': { rate: 0.0639 }, 'VA': { rate: 0.0577 }, 'WA': { rate: 0.0951 }, 'WV': { rate: 0.0659 },
  'WI': { rate: 0.0572 }, 'WY': { rate: 0.0556 }, 'DC': { rate: 0.0600 }
};
function getTaxLabel(stateAbbr, rate) {
  return stateAbbr ? `${stateAbbr} Sales Tax (${(rate * 100).toFixed(1)}%)` : '';
}

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

    // C-2 FIX: Cross-validate vendor ownership via Vendor.created_by, not user.vendor_id
    const vendorAuthRecords = await base44.asServiceRole.entities.Vendor.filter({ id: booking.vendor_id });
    const isVendor = vendorAuthRecords[0]?.created_by === user.email;
    const isClient = booking.client_email === user.email;
    const isAdmin = user.role === "admin";

    if (!isVendor && !isClient && !isAdmin) {
      return Response.json({ 
        error: 'Forbidden: Cannot modify this booking' 
      }, { status: 403 });
    }

    // M-1 FIX: Enforce minimum booking price of $1 to prevent negative payout edge cases
    const price = parseFloat(agreedPrice);
    if (price < 1) {
      return Response.json({ error: 'Minimum booking price is $1.00' }, { status: 400 });
    }
    
    const fees = additionalFees || [];
    const additionalTotal = fees.reduce((sum, fee) => {
      const amount = parseFloat(fee.amount) || 0;
      if (amount < 0) {
        throw new Error(`Fee "${fee.name}" has invalid negative amount: ${amount}`);
      }
      return sum + amount;
    }, 0);
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
    
    // SECURITY: If vendor has earned a 0% referral fee, override to zero
    // This referral discount will be marked as "used" only during payment capture
    if (vendorZeroFeeApplied) {
      finalFeePercent = 0;
    }

    // ======= REFERRAL DISCOUNT LOGIC =======
    // Check if client has earned a referral discount and hasn't used it yet
    let appliedDiscount = 0;
    let appliedDiscountInfo = null;
    
    const clientUserRecords = await base44.asServiceRole.entities.User.filter({ email: booking.client_email });
    const clientUserRecord = clientUserRecords[0] || null;
    
    // SECURITY: Only apply discount if:
    // 1. User has not already used their one-time referral discount
    // 2. They have an "earned" referral reward
    if (clientUserRecord && !clientUserRecord.referral_discount_used) {
      // Check for earned referral rewards (status "earned" means they completed their first booking)
      const earnedReferrals = await base44.asServiceRole.entities.ReferralReward.filter({
        referred_email: booking.client_email,
        status: 'earned'
      });
      
      if (earnedReferrals.length > 0) {
        // Client has earned a referral reward that hasn't been used yet
        // For clients, the reward is $25 credit (determined by referral type at creation)
        appliedDiscount = 25;
        appliedDiscountInfo = {
          referral_id: earnedReferrals[0].id,
          referral_type: earnedReferrals[0].referral_type,
          reward_type: earnedReferrals[0].reward_type // Should always be "twenty_five_dollar_credit" for clients
        };
      }
    }
    
    // Check if vendor has earned a commission-free booking and hasn't used it yet
    let vendorZeroFeeApplied = false;
    let vendorZeroFeeInfo = null;
    
    if (isVendor && booking.vendor_id) {
      const vendor = vendorAuthRecords[0];
      const vendorUserRecords = await base44.asServiceRole.entities.User.filter({ email: user.email });
      const vendorUserRecord = vendorUserRecords[0] || null;
      
      if (vendorUserRecord && !vendorUserRecord.referral_discount_used) {
        // Check for earned referral rewards for this vendor
        const earnedReferrals = await base44.asServiceRole.entities.ReferralReward.filter({
          referred_email: user.email,
          status: 'earned'
        });
        
        if (earnedReferrals.length > 0) {
          // Vendor has earned a 0% fee reward
          vendorZeroFeeApplied = true;
          vendorZeroFeeInfo = {
            referral_id: earnedReferrals[0].id,
            referral_type: earnedReferrals[0].referral_type,
            reward_type: earnedReferrals[0].reward_type // Should always be "zero_percent_fee" for vendors
          };
        }
      }
    }

    // Apply discount to agreed amount
    const discountedAmount = Math.max(0, agreedAmount - appliedDiscount);

    // Calculate platform fee on discounted amount
    const platformFeeAmount = (discountedAmount * finalFeePercent) / 100;

    // Get state for tax calculation - prioritize provided state, then booking location, then user profile
    let stateAbbr = clientState ? clientState.trim().toUpperCase() : null;
    
    if (!stateAbbr && booking.location) {
      // Extract state from "City, ST" format
      const match = booking.location.match(/,\s*([A-Z]{2})(?:\s|$)/);
      if (match) {
        stateAbbr = match[1];
      }
    }

    if (!stateAbbr && clientUserRecord?.state) {
      // Fallback to user's profile state — no extra DB query needed (reuse record fetched above)
      stateAbbr = clientUserRecord.state.trim().toUpperCase();
    }

    // Calculate sales tax
    let salesTaxRate = 0;
    let taxLabel = '';
    if (stateAbbr && STATE_TAX_RATES[stateAbbr]) {
      salesTaxRate = STATE_TAX_RATES[stateAbbr].rate;
      taxLabel = getTaxLabel(stateAbbr, salesTaxRate);
    }

    const salesTax = salesTaxRate > 0 ? discountedAmount * salesTaxRate : 0;

    // Calculate Stripe processing fee (2.9% + $0.30) - standardized field name - Fix #15: consistent rounding
    const stripeFeeAmount = Math.round((discountedAmount * 0.029 + 0.30) * 100) / 100;

    // Calculate vendor payout: discounted amount - all deductions
    const totalDeductions = platformFeeAmount + salesTax + stripeFeeAmount;
    const vendorPayout = discountedAmount - totalDeductions;
    
    // CRITICAL: Validate vendor payout is not negative
    if (vendorPayout < 0) {
      throw new Error(
        `Vendor payout cannot be negative ($${vendorPayout.toFixed(2)}). ` +
        `Reduce fees or increase agreed price. ` +
        `Breakdown: Agreed amount: $${discountedAmount.toFixed(2)}, ` +
        `Fees: $${platformFeeAmount.toFixed(2)}, ` +
        `Tax: $${salesTax.toFixed(2)}, ` +
        `Stripe: $${stripeFeeAmount.toFixed(2)}`
      );
    }
    
    const totalAmount = discountedAmount; // Client pays the discounted agreed price

    // Return validated financial breakdown with standardized field names
    // Include referral discount details so both client and vendor see applied benefits
    return Response.json({
      success: true,
      calculation: {
        base_price: price,
        additional_fees: fees,
        additional_total: additionalTotal,
        subtotal: agreedAmount,
        
        // Client-side referral discount (if any)
        client_referral_discount_applied: appliedDiscount,
        client_referral_info: appliedDiscountInfo,
        
        // Vendor-side referral discount (if any)
        vendor_referral_fee_waived: vendorZeroFeeApplied,
        vendor_referral_info: vendorZeroFeeInfo,
        
        base_event_amount: discountedAmount,
        agreed_price: discountedAmount,
        platform_fee_percent: finalFeePercent,
        platform_fee_amount: parseFloat(platformFeeAmount.toFixed(2)),
        sales_tax_rate: salesTaxRate,
        sales_tax_amount: parseFloat(salesTax.toFixed(2)),
        tax_label: taxLabel,
        state_abbreviation: stateAbbr || null,
        stripe_fee_amount: stripeFeeAmount,
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