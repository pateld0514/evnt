import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

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
      // Check client tier - discount applies to TOTAL booking price, not platform fee
      const clientTiers = await base44.asServiceRole.entities.ClientTier.filter({ 
        client_email: user_email 
      });
      
      let tierDiscountAmount = 0;
      if (clientTiers.length > 0) {
        const tierDiscountPercent = clientTiers[0].discount_percent || 0;
        if (tierDiscountPercent > 0) {
          tierDiscountAmount = (bookingData.agreed_price || 0) * (tierDiscountPercent / 100);
          appliedDiscounts.push({ 
            type: 'tier_price_discount', 
            amount: tierDiscountAmount, 
            description: `${clientTiers[0].tier_level} tier (${tierDiscountPercent}% off total)` 
          });
        }
      }

      // Check for referral credit (informational only - actual deduction happens in calculateProposal)
      const users = await base44.asServiceRole.entities.User.filter({ email: user_email });
      if (users.length > 0 && users[0].referral_credit > 0) {
        const creditAmount = Math.min(users[0].referral_credit, bookingData.agreed_price || 0);
        appliedDiscounts.push({ type: 'credit', amount: creditAmount, description: 'Referral credit (applied at checkout)' });
        // NOTE: Do NOT deduct here - deduction is handled by calculateProposal/capturePayment
      }

      // Check birthday month discount (5% off platform fee only)
      const user = users[0];
      if (user && user.birthday) {
        const today = new Date();
        const birthday = new Date(user.birthday);
        if (today.getMonth() === birthday.getMonth()) {
          const birthdayDiscountPercent = 5;
          totalDiscount += birthdayDiscountPercent;
          appliedDiscounts.push({ type: 'birthday', amount: birthdayDiscountPercent, description: 'Birthday month 5% fee discount' });
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

    // Calculate final platform fee with discounts (vendor discounts only)
    const finalFeePercent = Math.max(0, platformFeePercent - totalDiscount);
    const platformFeeAmount = (bookingData.agreed_price || 0) * (finalFeePercent / 100);

    // Calculate total price reduction from client discounts
    const totalPriceDiscount = appliedDiscounts
      .filter(d => d.type === 'tier_price_discount' || d.type === 'credit')
      .reduce((sum, d) => sum + d.amount, 0);

    return Response.json({ 
      success: true,
      original_fee_percent: platformFeePercent,
      vendor_fee_discount: totalDiscount,
      final_fee_percent: finalFeePercent,
      platform_fee_amount: platformFeeAmount,
      client_price_discount: totalPriceDiscount,
      applied_discounts: appliedDiscounts
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});