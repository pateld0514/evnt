import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { STATE_TAX_RATES, getTaxLabel } from '../utils/stateTaxRates.js';

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
    const isAdmin = user.role === "admin";

    if (!isVendor && !isClient && !isAdmin) {
      console.error('Unauthorized calculateProposal call', { user_id: user.id, booking_id: bookingId });
      return Response.json({ 
        error: 'Forbidden: Cannot modify this booking' 
      }, { status: 403 });
    }

    // Calculate totals with validation
    const price = parseFloat(agreedPrice);
    if (price <= 0) {
      return Response.json({ error: 'Agreed price must be greater than 0' }, { status: 400 });
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
      taxLabel = getTaxLabel(stateAbbr, salesTaxRate);
    }

    const salesTax = salesTaxRate > 0 ? discountedAmount * salesTaxRate : 0;

    // Calculate Stripe processing fee (2.9% + $0.30) - standardized field name - Fix #15: consistent rounding
    const stripeFeeAmount = Math.round((discountedAmount * 0.029 + 0.30) * 100) / 100;

    // Calculate vendor payout: discounted amount - all deductions
    const totalDeductions = platformFeeAmount + salesTax + stripeFeeAmount;
    const vendorPayout = discountedAmount - totalDeductions;
    const totalAmount = discountedAmount; // Client pays the discounted agreed price

    // Return validated financial breakdown with standardized field names - Fix #1: ensure stripe_fee_amount returned
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
        stripe_fee_amount: stripeFeeAmount, // Fix #1: standardized name, no fallback needed
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