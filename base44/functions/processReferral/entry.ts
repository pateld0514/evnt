import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // Validate shared secret — only required for direct/external calls, not entity automation triggers
    const isEntityAutomation = !!payload.event;
    if (!isEntityAutomation && payload._secret !== Deno.env.get('INTERNAL_SECRET')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // When triggered from the Booking entity automation on update
    let bookingData = null;

    if (payload.event?.type === 'update') {
      // Handle payload_too_large: fetch booking data directly if omitted
      let data = payload.data;
      if (!data && payload.payload_too_large && payload.event?.entity_id) {
        try {
          const fetched = await base44.asServiceRole.entities.Booking.filter({ id: payload.event.entity_id });
          data = fetched[0] || null;
        } catch (e) {
          console.warn('[processReferral] payload_too_large fetch failed:', e.message);
          return Response.json({ success: true, message: 'payload_too_large and fetch failed — skipping' });
        }
      }

      if (!data) {
        return Response.json({ success: true, message: 'No booking data available, skipping' });
      }

      // Only process when booking transitions to completed + paid
      // Guard: if old_data is missing, only proceed if current status is already completed+paid
      // (avoids double-processing when payload_too_large forces a re-fetch)
      const oldStatus = payload.old_data?.status;
      const oldPaymentStatus = payload.old_data?.payment_status;
      
      const justCompleted = data.status === 'completed' && (oldStatus ? oldStatus !== 'completed' : false);
      const justPaid = data.payment_status === 'paid' && (oldPaymentStatus ? oldPaymentStatus !== 'paid' : false);
      
      // If old_data is fully absent (both null), we can't safely determine "just" transitions
      if (payload.old_data === null || payload.old_data === undefined) {
        return Response.json({ success: true, message: 'No old_data — cannot determine transition, skipping to avoid duplicates' });
      }

      if (!justCompleted && !justPaid) {
        return Response.json({ success: true, message: 'Not a completion/payment event, skipped' });
      }
      bookingData = data;
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
      let vendorRecords = [];
      try {
        vendorRecords = await base44.asServiceRole.entities.Vendor.filter({ id: bookingData.vendor_id });
      } catch (e) {
        console.warn('[processReferral] Vendor lookup failed:', e.message);
      }
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
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
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

  // Verify they've completed sign-up AND completed at least one paid booking
  let hasCompletedSignup = false;
  let hasCompletedBooking = false;

  if (referred_type === 'vendor') {
    // Check 1: Vendor profile must be complete
    const users = await base44.asServiceRole.entities.User.filter({ email: referred_email });
    if (users.length === 0) {
      return { message: `${referred_email} user record not found` };
    }
    
    const user = users[0];
    if (!user.vendor_id) {
      return { message: `${referred_email} is not set up as a vendor yet` };
    }

    // Check 2: Vendor profile_complete must be true
    const vendors = await base44.asServiceRole.entities.Vendor.filter({ id: user.vendor_id });
    if (vendors.length === 0) {
      return { message: `Vendor profile not found for ${referred_email}` };
    }

    if (!vendors[0].profile_complete) {
      return { message: `${referred_email} hasn't completed their vendor profile setup` };
    }

    // Check 3: Must have completed at least one paid booking
    const completedBookings = await base44.asServiceRole.entities.Booking.filter({
      vendor_id: user.vendor_id,
      status: 'completed',
      payment_status: 'paid'
    });
    hasCompletedBooking = completedBookings.length >= 1;
  } else {
    // CLIENT CHECKS
    // Check 1: Onboarding must be complete
    const users = await base44.asServiceRole.entities.User.filter({ email: referred_email });
    if (users.length === 0) {
      return { message: `${referred_email} user record not found` };
    }

    const user = users[0];
    if (!user.onboarding_complete) {
      return { message: `${referred_email} hasn't completed client onboarding yet` };
    }

    // Check 2: Must have completed at least one paid booking
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