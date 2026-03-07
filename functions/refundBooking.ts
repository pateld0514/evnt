import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe@17.5.0';

// Inlined from lib/auth.js — no local imports allowed
function requireAdmin(user) {
  if (!user || user.role !== 'admin') throw new Error('Forbidden: Admin access required');
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
  let bookingId, user;
  try {
    const base44 = createClientFromRequest(req);
    user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    bookingId = body.bookingId;
    const amount = body.amount;
    const reason = body.reason;

    if (!bookingId) {
      return Response.json({ error: 'Booking ID required' }, { status: 400 });
    }

    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
    const booking = bookings[0];

    // SECURITY FIX: Admin check BEFORE 404 to prevent booking ID enumeration by non-admins
    requireAdmin(user);

    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.payment_status !== 'paid' && booking.payment_status !== 'escrow') {
      return Response.json({ error: 'Cannot refund - payment not processed yet' }, { status: 400 });
    }

    if (!booking.payment_intent_id) {
      return Response.json({ error: 'Payment intent ID missing - cannot process refund' }, { status: 400 });
    }

    const refundAmount = amount || booking.total_amount_charged || booking.agreed_price;
    if (!refundAmount || refundAmount <= 0) {
      return Response.json({ error: 'Refund amount must be greater than 0' }, { status: 400 });
    }
    const refundInCents = Math.round(refundAmount * 100);

    if (booking.payment_status === 'escrow') {
      await stripe.paymentIntents.cancel(booking.payment_intent_id);
      await base44.asServiceRole.entities.Booking.update(bookingId, {
        status: 'cancelled',
        payment_status: 'cancelled',
        refund_reason: reason || 'Cancelled before capture',
        refund_approved_by: user.email
      });
      try {
        await sendPlatformEmail(base44, {
          to: booking.client_email,
          subject: '💰 Booking Cancelled - Authorization Released',
          content: `<div style="padding:30px">
            <h2>Booking Cancelled</h2>
            <p>Your booking with ${booking.vendor_name} has been cancelled. The payment authorization of <strong>$${refundAmount.toFixed(2)}</strong> has been released.</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          </div>`,
        });
      } catch(e) { console.error('[refundBooking] Cancellation email failed:', e); }
      return Response.json({ success: true, message: 'Escrow cancelled - funds released', amount: refundAmount });
    }

    const refund = await stripe.refunds.create({
      payment_intent: booking.payment_intent_id,
      amount: refundInCents,
      reason: reason ? 'other' : 'customer_request',
      metadata: { booking_id: bookingId, refund_reason: reason || 'Admin refund' }
    });

    const totalPaid = booking.total_amount_charged || booking.agreed_price;
    const isFullRefund = refundAmount >= totalPaid;

    await base44.asServiceRole.entities.Booking.update(bookingId, {
      payment_status: isFullRefund ? 'refunded' : 'partially_refunded',
      status: isFullRefund ? 'cancelled' : booking.status,
      refund_amount: refundAmount,
      refund_reason: reason || 'Admin refund',
      refund_date: new Date().toISOString(),
      refund_approved_by: user.email
    });

    const payouts = await base44.asServiceRole.entities.VendorPayout.filter({ booking_id: bookingId, status: 'completed' });
    if (payouts.length > 0) {
      try {
        await base44.asServiceRole.functions.invoke('reverseVendorTransfer', {
          payoutId: payouts[0].id,
          stripeTransferId: payouts[0].stripe_transfer_id,
          bookingId,
          refundAmount,
          reason: reason || 'Admin refund'
        });
      } catch (reversalError) {
        console.error('[refundBooking] Failed to reverse vendor transfer:', reversalError);
        console.warn(`[refundBooking] MANUAL FOLLOW-UP REQUIRED: Payout ID ${payouts[0].id}`);
      }
    }

    try {
      await sendPlatformEmail(base44, {
        to: booking.client_email,
        subject: '💰 Refund Processed',
        content: `<div style="padding:30px">
          <h2>Refund Issued</h2>
          <p>A <strong>${isFullRefund ? 'full' : 'partial'}</strong> refund of <strong>$${refundAmount.toFixed(2)}</strong> has been processed for your booking with ${booking.vendor_name}.</p>
          <p>Funds appear within 5-10 business days.</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        </div>`,
      });
    } catch(e) { console.error('[refundBooking] Client email failed:', e); }

    const vendors = await base44.asServiceRole.entities.Vendor.filter({ id: booking.vendor_id });
    if (vendors.length > 0) {
      try {
        const vendorUsers = await base44.asServiceRole.entities.User.filter({ vendor_id: booking.vendor_id });
        const vendorEmail = vendorUsers.length > 0 ? vendorUsers[0].email : vendors[0].contact_email;
        if (vendorEmail) {
          await sendPlatformEmail(base44, {
            to: vendorEmail,
            subject: '❌ Booking Refunded',
            content: `<div style="padding:30px">
              <h2>Booking Refund Issued</h2>
              <p>A <strong>${isFullRefund ? 'full' : 'partial'}</strong> refund of $${refundAmount.toFixed(2)} was issued for booking with <strong>${booking.client_name}</strong>.</p>
              ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            </div>`,
          });
        }
      } catch(e) { console.error('[refundBooking] Vendor email failed:', e); }
    }

    return Response.json({ success: true, message: `Refund of $${refundAmount.toFixed(2)} processed successfully`, refundId: refund.id, amount: refundAmount, isFullRefund });

  } catch (error) {
    console.error('[refundBooking] Error:', { message: error.message, booking_id: bookingId, admin: user?.email?.replace(/@.*/, '@...') });
    return Response.json({ error: error.message || 'Failed to process refund' }, { status: 500 });
  }
});