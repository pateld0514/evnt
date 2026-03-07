import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // Internal automation endpoint - validate shared secret
    if (payload._secret !== Deno.env.get('INTERNAL_SECRET')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // When triggered from the Booking entity automation on update
    let bookingData = null;

    if (payload.event?.type === 'update') {
      // Only process when booking transitions to completed + paid
      const justCompleted = payload.data?.status === 'completed' && payload.old_data?.status !== 'completed';
      const justPaid = payload.data?.payment_status === 'paid' && payload.old_data?.payment_status !== 'paid';

      if (!justCompleted && !justPaid) {
        return Response.json({ success: true, message: 'Not a completion/payment event, skipped' });
      }
      bookingData = payload.data;
    } else if (!payload.event) {
      // Direct call - requires referred_email + referred_type
      if (payload.referred_email && payload.referred_type) {
        const result = await processForPerson(base44, payload.referred_email, payload.referred_type, null);
        return Response.json({ success: true, result });
      }
      return Response.json({ error: 'referred_email and referred_type are required for direct calls' }, { status: 400 });
    } else {
      return Response.json({ success: true, message: 'Not a relevant event, skipped' });
    }

    if (!bookingData) {
      return Response.json({ success: true, message: 'No booking data' });
    }

    const results = [];

    // Process client referral
    if (bookingData.client_email) {
      const clientResult = await processForPerson(base44, bookingData.client_email, 'client', bookingData.id);
      results.push({ type: 'client', result: clientResult });
    }

    // Process vendor referral - find vendor's email from the Vendor record (created_by field)
    if (bookingData.vendor_id) {
      const vendorRecords = await base44.asServiceRole.entities.Vendor.filter({ id: bookingData.vendor_id });
      if (vendorRecords.length > 0) {
        const vendorEmail = vendorRecords[0].created_by || vendorRecords[0].contact_email;
        if (vendorEmail) {
          const vendorResult = await processForPerson(base44, vendorEmail, 'vendor', bookingData.id);
          results.push({ type: 'vendor', result: vendorResult });
        }
      }
    }

    return Response.json({ success: true, results });

  } catch (error) {
    console.error('processReferral error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * Process referral for a person who just completed their first booking.
 * - Move their referral from "pending" → "earned"
 * - Reward both the referrer and the referred person based on referral type
 * - Ensure one-time use is enforced (marked on User record)
 */
async function processForPerson(base44, referred_email, referred_type, completionBookingId) {
  // Check if this person was referred and has pending rewards
  const pendingReferrals = await base44.asServiceRole.entities.ReferralReward.filter({
    referred_email,
    status: 'pending'
  });

  if (pendingReferrals.length === 0) {
    return { message: `No pending referrals for ${referred_email}` };
  }

  // Verify they've actually completed at least one booking
  let hasCompletedBooking = false;

  if (referred_type === 'vendor') {
    const users = await base44.asServiceRole.entities.User.filter({ email: referred_email });
    if (users.length > 0 && users[0].vendor_id) {
      const completedBookings = await base44.asServiceRole.entities.Booking.filter({
        vendor_id: users[0].vendor_id,
        status: 'completed',
        payment_status: 'paid'
      });
      hasCompletedBooking = completedBookings.length >= 1;
    }
  } else {
    const completedBookings = await base44.asServiceRole.entities.Booking.filter({
      client_email: referred_email,
      status: 'completed',
      payment_status: 'paid'
    });
    hasCompletedBooking = completedBookings.length >= 1;
  }

  if (!hasCompletedBooking) {
    return { message: `${referred_email} hasn't completed a paid booking yet` };
  }

  let rewardsProcessed = 0;

  for (const referral of pendingReferrals) {
    // SECURITY: Mark as "earned" (not "used" yet) — actual use happens during checkout
    await base44.asServiceRole.entities.ReferralReward.update(referral.id, {
      status: 'earned',
      completion_date: new Date().toISOString()
    });

    // Get the referrer's user record to determine their type
    const referrerUsers = await base44.asServiceRole.entities.User.filter({ email: referral.referrer_email });
    if (referrerUsers.length === 0) {
      console.warn(`[processReferral] Referrer user not found: ${referral.referrer_email}`);
      continue;
    }

    const referrer = referrerUsers[0];
    const referrerType = referrer.user_type;

    // Determine reward type based on referral combination
    // This was set when the referral was created (immutable)
    const rewardType = referral.reward_type;

    // Notify referrer
    try {
      const rewardText = rewardType === 'zero_percent_fee'
        ? '1 commission-free booking'
        : '$25 credit';

      await base44.asServiceRole.entities.Notification.create({
        recipient_email: referral.referrer_email,
        type: 'payment_received',
        title: 'Referral Reward Earned! 🎉',
        message: `Your referral ${referred_email} completed their first booking! You've earned ${rewardText}.`,
        read: false
      });

      // Email the referrer
      await base44.asServiceRole.functions.invoke('sendReferralNotification', {
        referrer_email: referral.referrer_email,
        referrer_type: referrerType,
        referred_email,
        reward_type: rewardType,
        status: 'earned',
        _secret: Deno.env.get('INTERNAL_SECRET')
      });
    } catch (e) {
      console.error('[processReferral] Failed to notify referrer:', e);
    }

    // Notify referred person
    try {
      const rewardText = referral.reward_type === 'zero_percent_fee'
        ? '1 commission-free booking'
        : '$25 credit';

      await base44.asServiceRole.entities.Notification.create({
        recipient_email: referred_email,
        type: 'payment_received',
        title: 'Welcome Bonus Unlocked! 🎁',
        message: `You've completed your first booking! You've earned ${rewardText} as a welcome bonus.`,
        read: false
      });

      // Email the referred person
      await base44.asServiceRole.functions.invoke('sendReferralNotification', {
        referrer_email: referral.referrer_email,
        referred_email,
        referred_type,
        reward_type: rewardType,
        status: 'earned',
        _secret: Deno.env.get('INTERNAL_SECRET')
      });
    } catch (e) {
      console.error('[processReferral] Failed to notify referred person:', e);
    }

    rewardsProcessed++;
  }

  return { message: `Processed ${rewardsProcessed} referral reward(s) for ${referred_email}` };
}