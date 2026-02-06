import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    const { vendor_id, base_fee_percent } = payload;
    
    if (!vendor_id || base_fee_percent === undefined) {
      return Response.json({ 
        error: 'vendor_id and base_fee_percent are required' 
      }, { status: 400 });
    }

    // Check for commission-free bookings
    const users = await base44.asServiceRole.entities.User.filter({ vendor_id });
    let hasCommissionFreeBooking = false;
    
    if (users.length > 0) {
      const commissionFreeCount = users[0].commission_free_bookings || 0;
      if (commissionFreeCount > 0) {
        hasCommissionFreeBooking = true;
        // Decrement commission-free booking
        await base44.asServiceRole.entities.User.update(users[0].id, {
          commission_free_bookings: commissionFreeCount - 1
        });
      }
    }

    // If using commission-free booking, return 0% fee
    if (hasCommissionFreeBooking) {
      return Response.json({ 
        success: true,
        tier_level: 'commission_free',
        fee_discount_percent: 100,
        original_fee_percent: base_fee_percent,
        final_fee_percent: 0,
        commission_free_used: true
      });
    }

    // Get vendor tier
    const vendorTiers = await base44.asServiceRole.entities.VendorTier.filter({ 
      vendor_id 
    });

    let feeDiscountPercent = 0;
    let tierLevel = 'bronze';
    
    if (vendorTiers.length > 0) {
      const tier = vendorTiers[0];
      feeDiscountPercent = tier.fee_discount_percent || 0;
      tierLevel = tier.tier_level;
    }

    // Apply discount to fee percentage
    const finalFeePercent = Math.max(0, base_fee_percent - feeDiscountPercent);

    return Response.json({ 
      success: true,
      tier_level: tierLevel,
      fee_discount_percent: feeDiscountPercent,
      original_fee_percent: base_fee_percent,
      final_fee_percent: parseFloat(finalFeePercent.toFixed(2)),
      commission_free_used: false
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});