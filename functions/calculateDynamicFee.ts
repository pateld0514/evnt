import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { vendor_id, client_email, booking_amount } = await req.json();

    if (!vendor_id || !client_email || !booking_amount) {
      return Response.json({ 
        error: 'vendor_id, client_email, and booking_amount are required' 
      }, { status: 400 });
    }

    // Get base platform fee (default 10% if not set)
    const feeSettings = await base44.asServiceRole.entities.PlatformSettings.filter({ 
      setting_key: 'platform_fee_percent' 
    });
    
    const baseFeePercent = feeSettings.length > 0 
      ? parseFloat(feeSettings[0].setting_value) 
      : 10;

    // Get vendor tier discount - Fix #11: add null checks and error handling
    let vendorDiscount = 0;
    try {
      const vendorTiers = await base44.asServiceRole.entities.VendorTier.filter({ vendor_id });
      vendorDiscount = vendorTiers && vendorTiers.length > 0 ? vendorTiers[0].fee_discount_percent : 0;
    } catch (error) {
      console.warn('[calculateDynamicFee] Failed to fetch vendor tier:', error);
    }

    // Get client tier discount - Fix #11: add null checks and error handling
    let clientDiscount = 0;
    try {
      const clientTiers = await base44.asServiceRole.entities.ClientTier.filter({ client_email });
      clientDiscount = clientTiers && clientTiers.length > 0 ? clientTiers[0].discount_percent : 0;
    } catch (error) {
      console.warn('[calculateDynamicFee] Failed to fetch client tier:', error);
    }

    // Calculate final fee percentage - apply HIGHER discount only (no stacking)
    // Business rule: Loyalty discounts don't stack; customer gets best discount available
    const higherDiscount = Math.max(vendorDiscount, clientDiscount);
    const finalFeePercent = Math.max(baseFeePercent - higherDiscount, 0); // Minimum 0% fee

    // Fix #6: Validate unusually high discounts
    if (higherDiscount > baseFeePercent * 1.5) {
      console.warn('[calculateDynamicFee] Unusually high discount applied', { 
        higherDiscount, 
        baseFeePercent,
        booking_amount 
      });
    }

    // Fix #17: Improve logging with discount source
    console.log(`[calculateDynamicFee] Fee calculation:`, {
      base_fee: baseFeePercent,
      vendor_discount: vendorDiscount,
      client_discount: clientDiscount,
      applied_discount: higherDiscount,
      discount_source: vendorDiscount >= clientDiscount ? 'vendor_tier' : (clientDiscount > 0 ? 'client_tier' : 'none'),
      final_fee: finalFeePercent,
      note: 'Using highest discount (no stacking)'
    });

    // Calculate amounts
    const platformFeeAmount = (booking_amount * finalFeePercent) / 100;
    const vendorPayout = booking_amount - platformFeeAmount;

    const correctFinalFee = Math.max(baseFeePercent - higherDiscount, 0);

    return Response.json({
      success: true,
      base_fee_percent: baseFeePercent,
      vendor_discount: vendorDiscount,
      client_discount: clientDiscount,
      final_fee_percent: parseFloat(correctFinalFee.toFixed(2)),
      booking_amount: booking_amount,
      platform_fee_amount: parseFloat(platformFeeAmount.toFixed(2)),
      vendor_payout: parseFloat(vendorPayout.toFixed(2))
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});