import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { referred_email, referred_type } = await req.json();

    if (!referred_email || !referred_type) {
      return Response.json({ error: 'referred_email and referred_type are required' }, { status: 400 });
    }

    // Check if this person was referred (look for referral code in User entity or query param)
    // For now, we'll look for pending referrals matching this email
    const pendingReferrals = await base44.asServiceRole.entities.ReferralReward.filter({ 
      referred_email,
      status: 'pending'
    });

    if (pendingReferrals.length === 0) {
      return Response.json({ success: true, message: 'No pending referrals found' });
    }

    // Check if referred person completed first booking
    let hasCompletedRequirement = false;

    if (referred_type === 'vendor') {
      const completedBookings = await base44.asServiceRole.entities.Booking.filter({ 
        vendor_id: referred_email, // This would need vendor_id, adjust logic as needed
        status: 'completed'
      });
      hasCompletedRequirement = completedBookings.length >= 1;
    } else if (referred_type === 'client') {
      const completedBookings = await base44.asServiceRole.entities.Booking.filter({ 
        client_email: referred_email,
        status: 'completed'
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

        // Send notification to referrer
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: referral.referrer_email,
          type: 'payment_received',
          title: 'Referral Reward Earned!',
          message: `Congratulations! You've earned a $${referral.reward_amount} credit for referring ${referred_email}.`,
          read: false
        });
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