import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe@17.5.0';

// Inlined from lib/bookingStateMachine.js — no local imports allowed in Deno Deploy
const VALID_TRANSITIONS = {
  pending: ['negotiating', 'declined', 'cancelled'],
  negotiating: ['payment_pending', 'cancelled', 'declined'],
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
    throw new Error(`Invalid transition from ${currentStatus} to ${newStatus}. Valid: ${VALID_TRANSITIONS[currentStatus].join(', ')}`);
  }
  return true;
}

// Inlined sendPlatformEmail
async function sendPlatformEmail(base44, { to, subject, content }) {
  if (!to) return;
  const appUrl = Deno.env.get('APP_URL') || 'https://joinevnt.com';
  const supportEmail = Deno.env.get('SUPPORT_EMAIL') || 'support@joinevnt.com';
  const body = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f3f4f6;margin:0">
  <div style="max-width:600px;margin:0 auto;background:#fff">
  <div style="background:#000;padding:30px;text-align:center"><span style="font-size:36px;font-weight:900;color:#fff">EVNT</span></div>
  ${content}
  <div style="background:#f9fafb;padding:20px;text-align:center;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb">
    <p>© ${new Date().getFullYear()} EVNT. <a href="mailto:${supportEmail}" style="color:#000">${supportEmail}</a></p>
    <p><a href="${appUrl}/unsubscribe?email=${encodeURIComponent(to)}" style="color:#0066cc">Unsubscribe</a> | <a href="${appUrl}/privacy" style="color:#0066cc">Privacy</a></p>
  </div></div></body></html>`;
  await base44.asServiceRole.integrations.Core.SendEmail({ to, from_name: 'EVNT', subject, body });
}

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  // ISSUE 8 FIX: Declare variables before try block so catch can reference them
  let bookingId, user;

  try {
    const base44 = createClientFromRequest(req);
    user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    bookingId = body.bookingId;
    const reason = body.reason;

    if (!bookingId) {
      return Response.json({ error: 'Booking ID required' }, { status: 400 });
    }

    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
    const booking = bookings[0];

    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    const isAdmin = user?.role === 'admin';
    // H-4 FIX: Verify user_type is client (not just email match) to prevent dual-role bypass
    const isClient = booking.client_email === user.email && (user.user_type === 'client' || user.role === 'admin');
    
    if (!isAdmin && !isClient) {
      console.error('Unauthorized cancelBooking attempt', { email: user?.email, booking_id: bookingId });
      return Response.json({ error: 'Forbidden: Cannot cancel this booking' }, { status: 403 });
    }

    // ISSUE 10 FIX: Enforce 7-day cancellation policy server-side
    if (!isAdmin) {
      const eventDate = new Date(booking.event_date);
      const today = new Date();
      const daysUntilEvent = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
      if (daysUntilEvent < 7) {
        return Response.json({ error: 'Bookings cannot be cancelled within 7 days of the event' }, { status: 400 });
      }
    }

    if (booking.payment_status === 'paid') {
      return Response.json({ error: 'Cannot cancel - payment already captured. Please request a refund instead.' }, { status: 400 });
    }

    try {
      validateTransition(booking.status, 'cancelled');
    } catch (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    let cancellationResult = { cancelled: false };

    if (booking.payment_status === 'escrow') {
      if (!booking.payment_intent_id) {
        return Response.json({ error: 'Payment intent ID missing - cannot cancel escrow payment' }, { status: 400 });
      }
      // ISSUE 8 FIX: If Stripe cancel fails, do NOT mark booking as cancelled.
      // Return an error and direct to refund flow instead of silently swallowing.
      let paymentIntent;
      try {
        paymentIntent = await stripe.paymentIntents.cancel(booking.payment_intent_id);
        cancellationResult = { cancelled: true, paymentIntentId: paymentIntent.id };
      } catch (stripeError) {
        console.error('[cancelBooking] Stripe cancel failed:', stripeError.message);
        return Response.json({
          error: 'Payment is already captured and cannot be cancelled at this stage. Please request a refund instead.',
          stripe_error: stripeError.message,
          redirect_to_refund: true
        }, { status: 400 });
      }
    }

    await base44.asServiceRole.entities.Booking.update(bookingId, {
      status: 'cancelled',
      payment_status: booking.payment_status === 'escrow' ? 'cancelled' : booking.payment_status,
      cancellation_reason: reason || 'Cancelled by user',
      cancelled_date: new Date().toISOString(),
    });

    try {
      await sendPlatformEmail(base44, {
        to: booking.client_email,
        subject: '❌ Booking Cancelled',
        content: `<div style="padding:30px">
          <h2>Booking Cancelled</h2>
          <p>Your booking with <strong>${booking.vendor_name}</strong> has been cancelled.</p>
          <p><strong>Event:</strong> ${booking.event_type} · ${booking.event_date}</p>
          ${booking.payment_status === 'escrow' ? '<p>Any authorized payment has been released back to your card.</p>' : ''}
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        </div>`,
      });
    } catch (emailError) {
      console.error('[cancelBooking] Failed to send client email:', emailError);
    }

    const vendors = await base44.asServiceRole.entities.Vendor.filter({ id: booking.vendor_id });
    if (vendors.length > 0) {
      try {
        const vendorUsers = await base44.asServiceRole.entities.User.filter({ vendor_id: booking.vendor_id });
        const vendorEmail = vendorUsers.length > 0 ? vendorUsers[0].email : vendors[0].contact_email;
        if (vendorEmail) {
          await sendPlatformEmail(base44, {
            to: vendorEmail,
            subject: '❌ Booking Cancelled',
            content: `<div style="padding:30px">
              <h2>Booking Cancelled</h2>
              <p>The booking with <strong>${booking.client_name}</strong> has been cancelled.</p>
              <p><strong>Event:</strong> ${booking.event_type} · ${booking.event_date}</p>
              ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            </div>`,
          });
        }
      } catch (emailError) {
        console.error('[cancelBooking] Failed to send vendor email:', emailError);
      }
    }

    return Response.json({ success: true, message: 'Booking cancelled successfully', ...cancellationResult });

  } catch (error) {
    console.error('[cancelBooking] Error:', { message: error.message, booking_id: bookingId, user_email: user?.email?.replace(/@.*/, '@...') });
    return Response.json({ error: error.message || 'Failed to cancel booking' }, { status: 500 });
  }
});