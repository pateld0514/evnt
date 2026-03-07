import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const payload = await req.json();

    // Internal automation endpoint - validate shared secret
    if (payload._secret !== Deno.env.get('INTERNAL_SECRET')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // When triggered from the Booking entity automation on update
    // We need to determine who completed the booking (client or vendor)
    // and check if they were referred
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
        const result = await processForPerson(base44, payload.referred_email, payload.referred_type);
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

    // Process client referral - pass bookingData so vendor can be rewarded too
    if (bookingData.client_email) {
      const clientResult = await processForPerson(base44, bookingData.client_email, 'client', bookingData);
      results.push({ type: 'client', result: clientResult });
    }

    // Process vendor referral - find vendor's email from the Vendor record (created_by field)
    if (bookingData.vendor_id) {
      const vendorRecords = await base44.asServiceRole.entities.Vendor.filter({ id: bookingData.vendor_id });
      if (vendorRecords.length > 0) {
        const vendorEmail = vendorRecords[0].created_by || vendorRecords[0].contact_email;
        if (vendorEmail) {
          const vendorResult = await processForPerson(base44, vendorEmail, 'vendor', bookingData);
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

async function processForPerson(base44, referred_email, referred_type, bookingData = null) {
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
    // Mark referral as earned
    await base44.asServiceRole.entities.ReferralReward.update(referral.id, {
      status: 'earned',
      completion_date: new Date().toISOString()
    });

    // --- Reward the REFERRER ---
    const referrerUsers = await base44.asServiceRole.entities.User.filter({ email: referral.referrer_email });
    if (referrerUsers.length > 0) {
      const referrer = referrerUsers[0];
      const referrerType = referrer.user_type;

      if (referrerType === 'client') {
        // Give referrer $25 credit
        await base44.asServiceRole.entities.User.update(referrer.id, {
          referral_credit: (referrer.referral_credit || 0) + 25
        });
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: referral.referrer_email,
          type: 'payment_received',
          title: 'Referral Reward Earned! 🎉',
          message: `Your referral ${referred_email} completed their first booking! $25 credit has been added to your account.`,
          read: false
        });
      } else if (referrerType === 'vendor') {
        // Give referrer a commission-free booking
        await base44.asServiceRole.entities.User.update(referrer.id, {
          commission_free_bookings: (referrer.commission_free_bookings || 0) + 1
        });
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: referral.referrer_email,
          type: 'payment_received',
          title: 'Referral Reward Earned! 🎉',
          message: `Your referral ${referred_email} completed their first booking! You've earned 1 commission-free booking.`,
          read: false
        });
      }

      // Email the referrer
      try {
        await base44.asServiceRole.functions.invoke('sendReferralNotification', {
          referrer_email: referral.referrer_email,
          referrer_type: referrerType,
          referred_email,
          reward_type: 'earned',
          _secret: Deno.env.get('INTERNAL_SECRET')
        });
      } catch (e) {
        console.error('Failed to send referral email to referrer:', e);
      }
    }

    // --- Reward the REFERRED PERSON ---
    const referredUsers = await base44.asServiceRole.entities.User.filter({ email: referred_email });
    if (referredUsers.length > 0) {
      const referred = referredUsers[0];

      if (referred_type === 'client') {
        await base44.asServiceRole.entities.User.update(referred.id, {
          referral_credit: (referred.referral_credit || 0) + 25
        });
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: referred_email,
          type: 'payment_received',
          title: 'Welcome Bonus Unlocked! 🎁',
          message: `You've completed your first booking! $25 credit has been added to your account as a welcome bonus.`,
          read: false
        });
      } else if (referred_type === 'vendor') {
        await base44.asServiceRole.entities.User.update(referred.id, {
          commission_free_bookings: (referred.commission_free_bookings || 0) + 1
        });
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: referred_email,
          type: 'payment_received',
          title: 'Welcome Bonus Unlocked! 🎁',
          message: `You've completed your first booking! You've earned 1 commission-free booking as a welcome bonus.`,
          read: false
        });
      }
    }

    // --- If a CLIENT was referred, also reward the VENDOR they booked ---
    // The vendor who served the referred client's first booking earns a commission-free booking too
    if (referred_type === 'client' && bookingData?.vendor_id) {
      const bookedVendorRecords = await base44.asServiceRole.entities.Vendor.filter({ id: bookingData.vendor_id });
      if (bookedVendorRecords.length > 0) {
        const bookedVendorEmail = bookedVendorRecords[0].created_by || bookedVendorRecords[0].contact_email;
        if (bookedVendorEmail) {
          const bookedVendorUsers = await base44.asServiceRole.entities.User.filter({ email: bookedVendorEmail });
          if (bookedVendorUsers.length > 0) {
            const bookedVendorUser = bookedVendorUsers[0];
            await base44.asServiceRole.entities.User.update(bookedVendorUser.id, {
              commission_free_bookings: (bookedVendorUser.commission_free_bookings || 0) + 1
            });
            await base44.asServiceRole.entities.Notification.create({
              recipient_email: bookedVendorEmail,
              type: 'payment_received',
              title: 'Referral Reward: 0% EVNT Fee! 🎉',
              message: `A referred client completed their first booking with you! You've earned 1 commission-free (0% EVNT fee) booking as a thank-you.`,
              read: false
            });
          }
        }
      }
    }

    rewardsProcessed++;
  }

  return { message: `Processed ${rewardsProcessed} referral reward(s) for ${referred_email}` };
}