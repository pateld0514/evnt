import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    // Extract from direct call or event
    const referred_email = payload.referred_email || payload.data?.client_email;
    const referred_type = payload.referred_type || (payload.data?.client_email ? 'client' : 'vendor');
    
    // Only process if booking was just completed
    if (payload.event?.type === 'update' && payload.data?.status === 'completed' && payload.old_data?.status !== 'completed') {
      // Continue with referral processing
    } else if (!payload.event) {
      // Direct call, process normally
    } else {
      // Not a completion event, skip
      return Response.json({ success: true, message: 'Not a completion event, skipped' });
    }

    if (!referred_email || !referred_type) {
      return Response.json({ error: 'referred_email and referred_type are required' }, { status: 400 });
    }

    // Check if this person was referred
    const pendingReferrals = await base44.asServiceRole.entities.ReferralReward.filter({ 
      referred_email,
      status: 'pending'
    });

    if (pendingReferrals.length === 0) {
      return Response.json({ success: true, message: 'No pending referrals found' });
    }

    // Check if referred person completed first booking
    let hasCompletedRequirement = false;
    let referredUserId = null;

    if (referred_type === 'vendor') {
      // Get user to find vendor_id
      const users = await base44.asServiceRole.entities.User.filter({ email: referred_email });
      if (users.length > 0 && users[0].vendor_id) {
        const completedBookings = await base44.asServiceRole.entities.Booking.filter({ 
          vendor_id: users[0].vendor_id,
          status: 'completed',
          payment_status: 'paid'
        });
        hasCompletedRequirement = completedBookings.length >= 1;
        referredUserId = users[0].vendor_id;
      }
    } else if (referred_type === 'client') {
      const completedBookings = await base44.asServiceRole.entities.Booking.filter({ 
        client_email: referred_email,
        status: 'completed',
        payment_status: 'paid'
      });
      hasCompletedRequirement = completedBookings.length >= 1;
    }

    if (hasCompletedRequirement) {
      // Update all pending referrals to earned
      for (const referral of pendingReferrals) {
        await base44.asServiceRole.entities.ReferralReward.update(referral.id, {
          status: 'earned',
          completion_date: new Date().toISOString()
        });

        // Get referrer info to determine their type
        const referrerUsers = await base44.asServiceRole.entities.User.filter({ 
          email: referral.referrer_email 
        });
        const referrerType = referrerUsers.length > 0 ? referrerUsers[0].user_type : null;

        // Update referrer user record with credit/voucher
        if (referrerType === 'client') {
          // Add $25 credit to client
          const referrer = referrerUsers[0];
          const currentCredit = referrer.referral_credit || 0;
          await base44.asServiceRole.entities.User.update(referrer.id, {
            referral_credit: currentCredit + 25
          });

          await base44.asServiceRole.entities.Notification.create({
            recipient_email: referral.referrer_email,
            type: 'payment_received',
            title: 'Referral Reward Earned!',
            message: `Congratulations! You've earned $25 credit for referring ${referred_email}. Use it on your next booking!`,
            read: false
          });
        } else if (referrerType === 'vendor') {
          // Track commission-free booking for vendor
          const referrer = referrerUsers[0];
          const currentFreebookings = referrer.commission_free_bookings || 0;
          await base44.asServiceRole.entities.User.update(referrer.id, {
            commission_free_bookings: currentFreebookings + 1
          });

          await base44.asServiceRole.entities.Notification.create({
            recipient_email: referral.referrer_email,
            type: 'payment_received',
            title: 'Referral Reward Earned!',
            message: `Congratulations! You've earned 1 commission-free booking for referring ${referred_email}!`,
            read: false
          });
        }

        // Reward the referred person too
        if (referred_type === 'client') {
          const referredUsers = await base44.asServiceRole.entities.User.filter({ 
            email: referred_email 
          });
          if (referredUsers.length > 0) {
            const currentCredit = referredUsers[0].referral_credit || 0;
            await base44.asServiceRole.entities.User.update(referredUsers[0].id, {
              referral_credit: currentCredit + 25
            });

            await base44.asServiceRole.entities.Notification.create({
              recipient_email: referred_email,
              type: 'payment_received',
              title: 'Welcome Bonus!',
              message: `Thanks for joining EVNT! You've earned $25 credit. Enjoy your first booking!`,
              read: false
            });
          }
        } else if (referred_type === 'vendor') {
          const referredUsers = await base44.asServiceRole.entities.User.filter({ 
            email: referred_email 
          });
          if (referredUsers.length > 0) {
            const currentFreeBookings = referredUsers[0].commission_free_bookings || 0;
            await base44.asServiceRole.entities.User.update(referredUsers[0].id, {
              commission_free_bookings: currentFreeBookings + 1
            });

            await base44.asServiceRole.entities.Notification.create({
              recipient_email: referred_email,
              type: 'payment_received',
              title: 'Welcome Bonus!',
              message: `Thanks for joining EVNT! You've earned 1 commission-free booking!`,
              read: false
            });
          }
        }
      }

      return Response.json({ 
        success: true, 
        message: 'Referral rewards processed',
        rewards_earned: pendingReferrals.length 
      });
    }

    return Response.json({ 
      success: true, 
      message: 'Referred person has not completed requirements yet' 
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});