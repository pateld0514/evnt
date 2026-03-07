import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

// Inlined from lib/emailTemplate.js — no local imports allowed in Deno Deploy
async function sendPlatformEmail(base44, { to, subject, content }) {
  if (!to) return;
  const appUrl = Deno.env.get('APP_URL') || 'https://joinevnt.com';
  const supportEmail = Deno.env.get('SUPPORT_EMAIL') || 'support@joinevnt.com';
  const supportPhone = Deno.env.get('SUPPORT_PHONE') || '';
  const body = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    body{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#f3f4f6;color:#1f2937}
    .wrap{max-width:600px;margin:0 auto;background:#fff}
    .hdr{background:linear-gradient(135deg,#000 0%,#1f2937 100%);padding:40px 30px;text-align:center}
    .logo{font-size:40px;font-weight:900;color:#fff;letter-spacing:-1px}
    .content{padding:40px 30px}
    .highlight-box{background:#f9fafb;border:2px solid #e5e7eb;border-radius:12px;padding:24px;margin:24px 0}
    .banner{background:#f0fdf4;border:2px solid #bbf7d0;border-radius:12px;padding:20px;margin:20px 0}
    .ftr{background:#f9fafb;padding:30px;text-align:center;border-top:2px solid #e5e7eb;color:#9ca3af;font-size:13px}
  </style></head><body><div class="wrap">
  <div class="hdr"><div class="logo">EVNT</div></div>
  ${content}
  <div class="ftr">
    <p style="margin:8px 0">© ${new Date().getFullYear()} EVNT. All rights reserved.</p>
    <p style="margin:8px 0">Questions? <a href="mailto:${supportEmail}" style="color:#000;font-weight:600">${supportEmail}</a>${supportPhone ? ` or <a href="tel:${supportPhone}" style="color:#000;font-weight:600">${supportPhone}</a>` : ''}</p>
    <p style="margin:12px 0 8px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:11px">
      <a href="${appUrl}/unsubscribe?email=${encodeURIComponent(to)}" style="color:#0066cc">Unsubscribe</a> |
      <a href="${appUrl}/privacy" style="color:#0066cc">Privacy Policy</a> |
      <a href="${appUrl}/terms" style="color:#0066cc">Terms of Service</a>
    </p>
  </div></div></body></html>`;
  await base44.asServiceRole.integrations.Core.SendEmail({ to, from_name: 'EVNT', subject, body });
}

// Inlined from lib/bookingStateMachine.js
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

Deno.serve(async (req) => {
  const webhookId = crypto.randomUUID();
  
  if (req.method !== 'POST') {
    return Response.json({ error: 'Invalid method' }, { status: 405 });
  }

  if (!req.headers.get('content-type')?.includes('application/json')) {
    return Response.json({ error: 'Invalid content-type' }, { status: 400 });
  }

  if (!webhookSecret) {
    return Response.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    const body = await req.text();
    
    if (!body || body.length === 0) {
      return Response.json({ error: 'Empty body' }, { status: 400 });
    }

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return Response.json({ error: 'No signature' }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error(`[${webhookId}] WEBHOOK VERIFICATION FAILED:`, err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    if (!event || !event.id || !event.type) {
      return Response.json({ error: 'Invalid event' }, { status: 400 });
    }

    console.log(`[${webhookId}] Webhook received`, { event_id: event.id, event_type: event.type });

    // Idempotency check
    const existingEvents = await base44.asServiceRole.entities.ProcessedWebhookEvent.filter({ event_id: event.id });
    if (existingEvents.length > 0) {
      return Response.json({ received: true, already_processed: true }, { status: 200 });
    }

    await base44.asServiceRole.entities.ProcessedWebhookEvent.create({
      event_id: event.id,
      event_type: event.type,
      processed_at: new Date().toISOString()
    });

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const bookingId = session.metadata.booking_id || session.client_reference_id;
        const paymentIntentId = session.payment_intent;
        if (bookingId) {
          const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
          const booking = bookings[0];
          if (booking) {
            // H-7 FIX: Only update if transition is valid — don't overwrite confirmed/cancelled bookings
            try {
              validateTransition(booking.status, 'confirmed');
              await base44.asServiceRole.entities.Booking.update(bookingId, {
                payment_status: 'processing',
                status: 'confirmed',
                payment_intent_id: paymentIntentId,
                stripe_session_id: session.id,
              });
            } catch (e) {
              console.warn(`[${webhookId}] Skipping checkout.session.completed — invalid transition from ${booking.status}: ${e.message}`);
            }
          }
        }
        break;
      }

      case 'payment_intent.amount_capturable_updated': {
        const paymentIntent = event.data.object;
        const bookingId = paymentIntent.metadata.booking_id;
        if (bookingId) {
          const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
          const booking = bookings[0];
          if (booking) {
            // H-7 FIX: Guard transition
            try {
              validateTransition(booking.status, 'confirmed');
              await base44.asServiceRole.entities.Booking.update(bookingId, {
                payment_status: 'escrow',
                status: 'confirmed',
                payment_intent_id: paymentIntent.id,
              });
            } catch (e) {
              console.warn(`[${webhookId}] Skipping payment_intent.amount_capturable_updated — invalid transition from ${booking.status}: ${e.message}`);
            }
          }
          const bookings2 = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
          const booking2 = bookings2[0];
          if (booking2) {
            try {
              await sendPlatformEmail(base44, {
                to: booking2.client_email,
                subject: '✅ Payment Authorized - Booking Confirmed',
                content: `<div class="content">
                  <h2>✅ Payment Authorized!</h2>
                  <p>Hi ${booking2.client_name || 'there'},</p>
                  <p>Your payment for <strong>${booking2.vendor_name}</strong> is secured in escrow.</p>
                  <div class="highlight-box">
                    <p><strong>Event:</strong> ${booking2.event_type} · ${booking2.event_date}</p>
                    <p><strong>Amount:</strong> $${(booking2.total_amount_charged || 0).toFixed(2)}</p>
                  </div>
                  <p>Payment releases to the vendor after your event is completed.</p>
                </div>`,
              });
            } catch(e) { console.warn('Client email failed:', e.message); }
            const vendors = await base44.asServiceRole.entities.Vendor.filter({ id: booking2.vendor_id });
            const vendor = vendors[0];
            if (vendor) {
              const vendorUsers = await base44.asServiceRole.entities.User.filter({ vendor_id: vendor.id });
              const vendorEmail = vendorUsers.length > 0 ? vendorUsers[0].email : (vendor.contact_email || vendor.created_by);
              try {
                await sendPlatformEmail(base44, {
                  to: vendorEmail,
                  subject: '🎉 Booking Confirmed - Payment Secured',
                  content: `<div class="content">
                    <h2>🎉 Booking Confirmed!</h2>
                    <p>Payment for <strong>${booking2.client_name}</strong>'s ${booking2.event_type} is secured in escrow.</p>
                    <div class="highlight-box">
                      <p><strong>Date:</strong> ${booking2.event_date}</p>
                      <p><strong>Your Payout:</strong> $${(booking2.vendor_payout || 0).toFixed(2)}</p>
                    </div>
                    <p>Payment releases automatically after you mark the event completed.</p>
                  </div>`,
                });
              } catch(e) { console.warn('Vendor email failed:', e.message); }
            }
          }
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const bookingId = paymentIntent.metadata.booking_id;
        if (bookingId) {
          const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
          const booking = bookings[0];
          if (booking) {
            // H-7 FIX: Guard transition
            try {
              validateTransition(booking.status, 'confirmed');
              await base44.asServiceRole.entities.Booking.update(bookingId, { payment_status: 'paid', status: 'confirmed' });
            } catch (e) {
              console.warn(`[${webhookId}] Skipping payment_intent.succeeded status update — invalid transition from ${booking.status}: ${e.message}`);
              // Still update payment_status even if booking status transition is invalid
              await base44.asServiceRole.entities.Booking.update(bookingId, { payment_status: 'paid' });
            }
          }
          const bookings2 = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
          const booking2 = bookings2[0];
          if (booking2) {
            try {
              await sendPlatformEmail(base44, {
                to: booking2.client_email,
                subject: '🎉 Payment Receipt - Booking Confirmed',
                content: `<div class="content">
                  <h2>🎉 Payment Successful!</h2>
                  <p>Hi ${booking2.client_name || 'there'},</p>
                  <p>Your booking with <strong>${booking2.vendor_name}</strong> is confirmed.</p>
                  <div class="banner"><p><strong>Total Paid:</strong> $${(booking2.total_amount_charged || 0).toFixed(2)}</p></div>
                </div>`,
              });
            } catch(e) { console.warn('Client receipt email failed:', e.message); }
            const vendors = await base44.asServiceRole.entities.Vendor.filter({ id: booking2.vendor_id });
            const vendor = vendors[0];
            if (vendor) {
              const vendorUsers = await base44.asServiceRole.entities.User.filter({ vendor_id: vendor.id });
              const vendorEmail = vendorUsers.length > 0 ? vendorUsers[0].email : (vendor.contact_email || vendor.created_by);
              try {
                await sendPlatformEmail(base44, {
                  to: vendorEmail,
                  subject: '💰 Payment Received - Booking Confirmed',
                  content: `<div class="content">
                    <h2>💰 Payment Received!</h2>
                    <p>Payment for <strong>${booking2.client_name}</strong>'s ${booking2.event_type} processed.</p>
                    <div class="banner"><p><strong>Your Payout:</strong> $${(booking2.vendor_payout || 0).toFixed(2)}</p></div>
                  </div>`,
                });
              } catch(e) { console.warn('Vendor payment email failed:', e.message); }
            }
          }
        }
        break;
      }

      case 'payment_intent.processing': {
        const paymentIntent = event.data.object;
        const bookingId = paymentIntent.metadata.booking_id;
        if (bookingId) {
          await base44.asServiceRole.entities.Booking.update(bookingId, { payment_status: 'processing' });
        }
        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object;
        const bookingId = paymentIntent.metadata.booking_id;
        if (bookingId) {
          const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
          const booking = bookings[0];
          if (booking) {
            try { validateTransition(booking.status, 'cancelled'); } catch (e) { console.error(`[${webhookId}]`, e.message); }
            await base44.asServiceRole.entities.Booking.update(bookingId, { payment_status: 'cancelled', status: 'cancelled' });
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const bookingId = paymentIntent.metadata.booking_id;
        if (bookingId) {
          await base44.asServiceRole.entities.Booking.update(bookingId, { payment_status: 'failed' });
          const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
          const booking = bookings[0];
          if (booking) {
            try {
              await sendPlatformEmail(base44, {
                to: booking.client_email,
                subject: '❌ Payment Failed',
                content: `<div class="content">
                  <h2>❌ Payment Failed</h2>
                  <p>Hi ${booking.client_name || 'there'},</p>
                  <p>We couldn't process your payment for <strong>${booking.vendor_name}</strong>. Please check your payment method and try again.</p>
                </div>`,
              });
            } catch(e) { console.warn('Payment failed email error:', e.message); }
          }
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        const paymentIntentId = charge.payment_intent;
        // ISSUE 5 FIX: Use filter instead of list() to avoid fetching all bookings
        const bookings = await base44.asServiceRole.entities.Booking.filter({ payment_intent_id: paymentIntentId });
        const booking = bookings[0];
        if (booking) {
          const refundAmount = charge.amount_refunded / 100;
          const isFullRefund = charge.refunded;
          // H-7 FIX: Guard refund transition
          let newStatus = booking.status;
          if (isFullRefund) {
            try {
              validateTransition(booking.status, 'cancelled');
              newStatus = 'cancelled';
            } catch (e) {
              console.warn(`[${webhookId}] charge.refunded — cannot transition from ${booking.status} to cancelled: ${e.message}`);
            }
          }
          await base44.asServiceRole.entities.Booking.update(booking.id, {
            payment_status: isFullRefund ? 'refunded' : 'partially_refunded',
            status: newStatus,
            refund_amount: refundAmount,
          });
          try {
            await sendPlatformEmail(base44, {
              to: booking.client_email,
              subject: '💰 Refund Processed',
              content: `<div class="content">
                <h2>💰 Refund Processed</h2>
                <p>A refund of <strong>$${refundAmount.toFixed(2)}</strong> has been processed for your booking with ${booking.vendor_name}. Allow 5-10 business days.</p>
              </div>`,
            });
          } catch(e) { console.warn('Refund email failed:', e.message); }
        }
        break;
      }
    }

    console.log(`[${webhookId}] Webhook processing completed successfully`);
    return Response.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error(`[${webhookId}] WEBHOOK FAILED:`, error.message);
    return Response.json({ error: 'Webhook processing failed', webhook_id: webhookId }, { status: 500 });
  }
});