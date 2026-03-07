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

    await base44.asServiceRole.entities.Booking.update(bookingId, {
      payment_status: 'paid',
      idempotency_key: idempotencyKey
    });

    console.log(`[${requestId}] === CAPTURE PAYMENT REQUEST SUCCESS ===`);
    return Response.json({ success: true, message: 'Payment captured successfully', amount: capturedIntent.amount / 100, idempotency_key: idempotencyKey });

  } catch (error) {
    console.error(`[${requestId}] CAPTURE PAYMENT FAILED:`, error.message);
    return Response.json({ error: error.message || 'Failed to capture payment', request_id: requestId }, { status: 500 });
  }
});