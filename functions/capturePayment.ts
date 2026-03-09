import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe@17.5.0';

// Inlined from lib/bookingStateMachine.js — no local imports allowed in Deno Deploy
const VALID_TRANSITIONS = {
  pending: ['negotiating', 'declined', 'cancelled'],
  negotiating: ['payment_pending', 'pending', 'cancelled', 'declined'],
  payment_pending: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  declined: [],
};
function validateTransition(currentStatus, newStatus) {
  if (!VALID_TRANSITIONS[currentStatus]) throw new Error(`Invalid current status: ${currentStatus}`);
  if (!VALID_TRANSITIONS[currentStatus].includes(newStatus)) {
    throw new Error(`Invalid transition from ${currentStatus} to ${newStatus}`);
  }
  return true;
}

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] === CAPTURE PAYMENT REQUEST START ===`);
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId } = await req.json();
    
    if (!bookingId) {
      return Response.json({ error: 'Booking ID required' }, { status: 400 });
    }

    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
    const booking = bookings[0];

    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    // C-1 FIX: Verify caller is admin or the vendor who owns this booking
    const isAdmin = user.role === 'admin';
    if (!isAdmin) {
      const vendorRecords = await base44.asServiceRole.entities.Vendor.filter({ id: booking.vendor_id });
      const isVendorOwner = vendorRecords[0]?.created_by === user.email;
      if (!isVendorOwner) {
        return Response.json({ error: 'Forbidden: Only the vendor or admin can capture payment' }, { status: 403 });
      }
    }

    let idempotencyKey = booking.idempotency_key;
    if (!idempotencyKey) {
      idempotencyKey = requestId;
      await base44.asServiceRole.entities.Booking.update(bookingId, { idempotency_key: idempotencyKey });
    }

    if (booking.status !== 'completed') {
      return Response.json({ error: `Booking must be completed to capture payment. Current status: ${booking.status}` }, { status: 400 });
    }

    if (!booking.payment_intent_id) {
      return Response.json({ error: 'No payment intent found for this booking' }, { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(booking.payment_intent_id);

    if (paymentIntent.status === 'succeeded') {
      return Response.json({ success: true, message: 'Payment already captured', already_captured: true, idempotent: true });
    }

    if (paymentIntent.status !== 'requires_capture') {
      return Response.json({ error: `Payment cannot be captured. Status: ${paymentIntent.status}` }, { status: 400 });
    }

    const capturedIntent = await stripe.paymentIntents.capture(
      booking.payment_intent_id,
      { idempotency_key: idempotencyKey }
    );

    // Update booking payment status
    await base44.asServiceRole.entities.Booking.update(bookingId, {
      payment_status: 'paid',
      idempotency_key: idempotencyKey
    });

    // ======= MARK REFERRAL DISCOUNTS AS USED (ONE-TIME ENFORCEMENT) =======
    // After payment is successfully captured, lock in the one-time referral discounts
    
    // Mark client's referral discount as used (if applicable)
    if (booking.client_email) {
      const clientReferrals = await base44.asServiceRole.entities.ReferralReward.filter({
        referred_email: booking.client_email,
        status: 'earned'
      });
      for (const referral of clientReferrals) {
        // Update to "used" status and record when/where it was applied
        await base44.asServiceRole.entities.ReferralReward.update(referral.id, {
          status: 'used',
          discount_applied_date: new Date().toISOString(),
          discount_applied_booking_id: bookingId
        });
      }
      
      // Mark on User record that this client has used their one-time discount
      const clientUserRecords = await base44.asServiceRole.entities.User.filter({ email: booking.client_email });
      if (clientUserRecords.length > 0) {
        await base44.asServiceRole.entities.User.update(clientUserRecords[0].id, {
          referral_discount_used: true,
          referral_discount_booking_id: bookingId
        });
      }
    }

    // Mark vendor's referral discount as used (if applicable)
    if (booking.vendor_id) {
      const vendorRecords = await base44.asServiceRole.entities.Vendor.filter({ id: booking.vendor_id });
      if (vendorRecords.length > 0) {
        const vendorEmail = vendorRecords[0].created_by;
        if (vendorEmail) {
          const vendorReferrals = await base44.asServiceRole.entities.ReferralReward.filter({
            referred_email: vendorEmail,
            status: 'earned'
          });
          for (const referral of vendorReferrals) {
            await base44.asServiceRole.entities.ReferralReward.update(referral.id, {
              status: 'used',
              discount_applied_date: new Date().toISOString(),
              discount_applied_booking_id: bookingId
            });
          }
          
          // Mark on User record that this vendor has used their one-time discount
          const vendorUserRecords = await base44.asServiceRole.entities.User.filter({ email: vendorEmail });
          if (vendorUserRecords.length > 0) {
            await base44.asServiceRole.entities.User.update(vendorUserRecords[0].id, {
              referral_discount_used: true,
              referral_discount_booking_id: bookingId
            });
          }
        }
      }
    }

    console.log(`[${requestId}] === CAPTURE PAYMENT REQUEST SUCCESS ===`);
    return Response.json({ success: true, message: 'Payment captured successfully', amount: capturedIntent.amount / 100, idempotency_key: idempotencyKey });

  } catch (error) {
    console.error(`[${requestId}] CAPTURE PAYMENT FAILED:`, error?.message || String(error));
    return Response.json({ error: error?.message || 'Failed to capture payment', request_id: requestId }, { status: 500 });
  }
});