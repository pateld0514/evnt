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

    // Get vendor tier discount
    const vendorTiers = await base44.asServiceRole.entities.VendorTier.filter({ vendor_id });
    const vendorDiscount = vendorTiers.length > 0 ? vendorTiers[0].fee_discount_percent : 0;

    // Get client tier discount
    const clientTiers = await base44.asServiceRole.entities.ClientTier.filter({ client_email });
    const clientDiscount = clientTiers.length > 0 ? clientTiers[0].discount_percent : 0;

    // Calculate final fee percentage
    const totalDiscount = vendorDiscount + clientDiscount;
    const finalFeePercent = Math.max(baseFeePercent - totalDiscount, 5); // Minimum 5% fee

    // Calculate amounts
    const platformFeeAmount = (booking_amount * finalFeePercent) / 100;
    const vendorPayout = booking_amount - platformFeeAmount;

    return Response.json({
      success: true,
      base_fee_percent: baseFeePercent,
      vendor_discount: vendorDiscount,
      client_discount: clientDiscount,
      final_fee_percent: parseFloat(finalFeePercent.toFixed(2)),
      booking_amount: booking_amount,
      platform_fee_amount: parseFloat(platformFeeAmount.toFixed(2)),
      vendor_payout: parseFloat(vendorPayout.toFixed(2))
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});