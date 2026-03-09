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

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const payload = await req.json();
    
    let booking_id = payload.booking_id || payload.data?.id;
    const payment_status = payload.data?.payment_status;
    const booking_status = payload.data?.status;
    
    const isAutomationTrigger = payload.event?.type === 'update';
    
    // Entity automation triggers have no user token — skip auth check for them
    if (!isAutomationTrigger) {
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    }

    if (isAutomationTrigger) {
      // ISSUE 11 FIX: Handle payload_too_large — fetch booking directly if data was omitted
      if (payload.payload_too_large) {
        const entityId = payload.event?.entity_id;
        if (!entityId) {
          return Response.json({ success: true, message: 'payload_too_large and no entity_id — skipping' });
        }
        let fetchedBookings;
        try {
          fetchedBookings = await base44.asServiceRole.entities.Booking.filter({ id: entityId });
        } catch (e) {
          console.warn('[processVendorPayout] payload_too_large fetch failed:', e.message);
          return Response.json({ success: true, message: 'payload_too_large fetch failed — skipping' });
        }
        if (!fetchedBookings.length) {
          return Response.json({ success: true, message: 'Booking not found after payload_too_large fetch' });
        }
        const fetchedBooking = fetchedBookings[0];
        // Only trigger if status just became completed and payment is in escrow
        const wasJustCompleted = fetchedBooking.status === 'completed';
        const paymentInEscrow = fetchedBooking.payment_status === 'escrow';
        if (!wasJustCompleted || !paymentInEscrow) {
          return Response.json({ success: true, message: 'Not a payout trigger event (payload_too_large path)' });
        }
        booking_id = entityId;
      } else {
        const wasJustCompleted = booking_status === 'completed' && payload.old_data?.status !== 'completed';
        const paymentInEscrow = payment_status === 'escrow';
        if (!wasJustCompleted || !paymentInEscrow) {
          return Response.json({ success: true, message: 'Not a payout trigger event' });
        }
      }
    } else {
      if (!payload.booking_id) {
        return Response.json({ error: 'booking_id required' }, { status: 400 });
      }
    }

    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: booking_id });
    if (bookings.length === 0) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }
    
    const booking = bookings[0];

    // SECURITY: Re-verify booking status from DB (don't trust automation payload alone).
    // A concurrent status rollback (e.g. cancellation) could arrive between the automation
    // trigger and this DB read — re-validating here prevents payout on non-completed bookings.
    if (booking.status !== 'completed') {
      console.warn(`[processVendorPayout] Booking ${booking_id} is no longer completed (status: ${booking.status}) — skipping payout`);
      return Response.json({ success: true, message: `Booking not in completed state (${booking.status}), skipping payout` });
    }

    // Idempotency guard — handle gracefully if unique constraint fires on concurrent create
    const existingPayouts = await base44.asServiceRole.entities.VendorPayout.filter({ booking_id: booking.id });
    if (existingPayouts.length > 0) {
      return Response.json({ success: true, message: 'Payout already processed', idempotent: true });
    }

    if (booking.payment_status !== 'escrow') {
      return Response.json({ error: 'Payment not in escrow state' }, { status: 400 });
    }

    const vendors = await base44.asServiceRole.entities.Vendor.filter({ id: booking.vendor_id });
    if (vendors.length === 0 || !vendors[0].stripe_account_id) {
      return Response.json({ error: 'Vendor Stripe account not found' }, { status: 404 });
    }
    
    const vendor = vendors[0];
    
    if (!vendor.stripe_account_verified) {
      return Response.json({ error: 'Vendor Stripe account not verified' }, { status: 400 });
    }

    const grossAmount = booking.base_event_amount || booking.agreed_price || booking.total_amount_charged || 0;
    const platformFee = booking.platform_fee_amount || 0;
    const netAmount = booking.vendor_payout || (grossAmount - platformFee);
    
    if (netAmount <= 0) {
      return Response.json({ error: 'Invalid payout amount: net amount must be greater than 0' }, { status: 400 });
    }

    // C-4 FIX: Wrap create in try/catch to handle unique constraint violation from concurrent triggers
    let payoutRecord;
    try {
      payoutRecord = await base44.asServiceRole.entities.VendorPayout.create({
        vendor_id: booking.vendor_id,
        booking_id: booking.id,
        gross_amount: grossAmount,
        platform_fee: platformFee,
        net_amount: netAmount,
        status: 'processing'
      });
    } catch (dupError) {
      // Another concurrent request already created the payout record — treat as idempotent
      console.warn('[processVendorPayout] Duplicate payout create blocked (race condition):', dupError.message);
      return Response.json({ success: true, message: 'Payout already being processed (concurrent request)', idempotent: true });
    }

    try {
      const idempotencyKey = `payout-${booking.id}-${booking.payment_intent_id}`;
      const paymentIntent = await stripe.paymentIntents.capture(
        booking.payment_intent_id,
        { idempotency_key: idempotencyKey }
      );

      if (paymentIntent.status !== 'succeeded') {
        throw new Error('Payment capture failed');
      }

      const transfer = await stripe.transfers.create({
        amount: Math.round(netAmount * 100),
        currency: 'usd',
        destination: vendor.stripe_account_id,
        transfer_group: `payout-${booking.id}`,
        metadata: { booking_id: booking.id, client_email: booking.client_email, event_type: booking.event_type }
      });

      await base44.asServiceRole.entities.VendorPayout.update(payoutRecord.id, {
        stripe_transfer_id: transfer.id,
        status: 'completed',
        payout_date: new Date().toISOString()
      });

      await base44.asServiceRole.entities.Booking.update(booking.id, { payment_status: 'paid' });

      const vendorUsers = await base44.asServiceRole.entities.User.filter({ vendor_id: vendor.id });
      const vendorEmail = vendorUsers.length > 0 ? vendorUsers[0].email : vendor.contact_email;

      try {
        await sendPlatformEmail(base44, {
          to: vendorEmail,
          subject: '💰 Payment Released - Payout Processed',
          content: `<div style="padding:30px">
            <h2>💰 Payment Released!</h2>
            <p>The payment for your completed booking has been released.</p>
            <p><strong>Booking:</strong> ${booking.event_type} with ${booking.client_name}</p>
            <p><strong>Amount:</strong> $${netAmount.toFixed(2)}</p>
            <p>Funds will be in your bank account within 1-3 business days.</p>
          </div>`,
        });
      } catch(e) { console.warn('Payout email failed:', e.message); }

      return Response.json({ success: true, message: 'Payout processed successfully', payout_id: payoutRecord.id, amount: netAmount });

    } catch (stripeError) {
      await base44.asServiceRole.entities.VendorPayout.update(payoutRecord.id, {
        status: 'failed',
        failure_reason: stripeError.message
      });
      return Response.json({ error: 'Payment capture failed', details: stripeError.message }, { status: 500 });
    }

  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});