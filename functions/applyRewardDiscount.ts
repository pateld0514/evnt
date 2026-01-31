import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { booking_id, user_email, user_type } = await req.json();

    if (!booking_id || !user_email || !user_type) {
      return Response.json({ error: 'booking_id, user_email, and user_type required' }, { status: 400 });
    }

    const booking = await base44.asServiceRole.entities.Booking.filter({ id: booking_id });
    if (booking.length === 0) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    const bookingData = booking[0];
    let totalDiscount = 0;
    const appliedDiscounts = [];

    // Get platform fee setting
    const feeSettings = await base44.asServiceRole.entities.PlatformSettings.filter({ 
      setting_key: 'platform_fee_percent' 
    });
    const platformFeePercent = feeSettings.length > 0 ? parseFloat(feeSettings[0].setting_value) : 3;

    if (user_type === 'client') {
      // Check client tier
      const clientTiers = await base44.asServiceRole.entities.ClientTier.filter({ 
        client_email: user_email 
      });
      
      if (clientTiers.length > 0) {
        const tierDiscount = clientTiers[0].discount_percent || 0;
        if (tierDiscount > 0) {
          totalDiscount += tierDiscount;
          appliedDiscounts.push({ type: 'tier', amount: tierDiscount, description: `${clientTiers[0].tier_level} tier` });
        }
      }

      // Check for referral credit
      const users = await base44.asServiceRole.entities.User.filter({ email: user_email });
      if (users.length > 0 && users[0].referral_credit > 0) {
        const creditAmount = Math.min(users[0].referral_credit, bookingData.agreed_price || 0);
        appliedDiscounts.push({ type: 'credit', amount: creditAmount, description: 'Referral credit' });
        
        // Deduct used credit
        await base44.asServiceRole.entities.User.update(users[0].id, {
          referral_credit: users[0].referral_credit - creditAmount
        });
      }

      // Check birthday month discount (assuming 5% discount)
      const user = users[0];
      if (user && user.birthday) {
        const today = new Date();
        const birthday = new Date(user.birthday);
        if (today.getMonth() === birthday.getMonth()) {
          totalDiscount += 5;
          appliedDiscounts.push({ type: 'birthday', amount: 5, description: 'Birthday month bonus' });
        }
      }
    } else if (user_type === 'vendor') {
      // Check vendor tier
      const vendor = await base44.asServiceRole.entities.Vendor.filter({ 
        contact_email: user_email 
      });
      
      if (vendor.length > 0) {
        const vendorTiers = await base44.asServiceRole.entities.VendorTier.filter({ 
          vendor_id: vendor[0].id 
        });
        
        if (vendorTiers.length > 0) {
          const tierDiscount = vendorTiers[0].fee_discount_percent || 0;
          if (tierDiscount > 0) {
            totalDiscount += tierDiscount;
            appliedDiscounts.push({ type: 'tier', amount: tierDiscount, description: `${vendorTiers[0].tier_level} tier` });
          }
        }
      }

      // Check commission-free bookings
      const users = await base44.asServiceRole.entities.User.filter({ email: user_email });
      if (users.length > 0 && users[0].commission_free_bookings > 0) {
        totalDiscount = platformFeePercent; // 100% platform fee waived
        appliedDiscounts.push({ 
          type: 'commission_free', 
          amount: platformFeePercent, 
          description: 'Commission-free booking voucher' 
        });
        
        // Deduct used voucher
        await base44.asServiceRole.entities.User.update(users[0].id, {
          commission_free_bookings: users[0].commission_free_bookings - 1
        });
      }
    }

    // Calculate final platform fee with discounts
    const finalFeePercent = Math.max(0, platformFeePercent - totalDiscount);
    const platformFeeAmount = (bookingData.agreed_price || 0) * (finalFeePercent / 100);

    return Response.json({ 
      success: true,
      original_fee_percent: platformFeePercent,
      total_discount: totalDiscount,
      final_fee_percent: finalFeePercent,
      platform_fee_amount: platformFeeAmount,
      applied_discounts: appliedDiscounts
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});