import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] === CAPTURE PAYMENT REQUEST START ===`);
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      console.error(`[${requestId}] UNAUTHORIZED: No authenticated user`);
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[${requestId}] User authenticated:`, user.email);

    // Retrieve booking FIRST to get persisted idempotency key
    const { bookingId } = await req.json();
    
    if (!bookingId) {
      console.error(`[${requestId}] VALIDATION ERROR: Missing booking ID`);
      return Response.json({ error: 'Booking ID required' }, { status: 400 });
    }

    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
    const booking = bookings[0];

    if (!booking) {
      console.error(`[${requestId}] NOT FOUND: Booking ${bookingId}`);
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Use persisted idempotency key from booking if available; if missing, generate and persist it
    let idempotencyKey = booking.idempotency_key;
    if (!idempotencyKey) {
      idempotencyKey = requestId;
      // Persist the idempotency key to prevent duplicate retries
      await base44.asServiceRole.entities.Booking.update(bookingId, {
        idempotency_key: idempotencyKey
      });
    }
    
    console.log(`[${requestId}] Idempotency Key:`, { persisted: idempotencyKey, request: requestId });

    console.log(`[${requestId}] Booking found:`, {
      status: booking.status,
      payment_status: booking.payment_status,
      payment_intent_id: booking.payment_intent_id
    });

    // Verify booking is completed
    if (booking.status !== 'completed') {
      console.error(`[${requestId}] INVALID STATE: Booking status is ${booking.status}, expected completed`);
      return Response.json({ 
        error: `Booking must be completed to capture payment. Current status: ${booking.status}` 
      }, { status: 400 });
    }

    // Check if payment intent exists
    if (!booking.payment_intent_id) {
      console.error(`[${requestId}] MISSING DATA: No payment intent ID`);
      return Response.json({ error: 'No payment intent found for this booking' }, { status: 400 });
    }

    // Retrieve payment intent to check if already captured
    const paymentIntent = await stripe.paymentIntents.retrieve(booking.payment_intent_id);
    
    console.log(`[${requestId}] Payment Intent status:`, {
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      captured: paymentIntent.status === 'succeeded'
    });

    if (paymentIntent.status === 'succeeded') {
      console.log(`[${requestId}] Payment already captured (idempotent response)`);
      return Response.json({ 
        success: true,
        message: 'Payment already captured',
        already_captured: true,
        idempotent: true
      });
    }

    if (paymentIntent.status !== 'requires_capture') {
      console.error(`[${requestId}] INVALID STATE: Payment intent status is ${paymentIntent.status}`);
      return Response.json({ 
        error: `Payment cannot be captured. Status: ${paymentIntent.status}` 
      }, { status: 400 });
    }

    // Capture the payment with persisted idempotency key
    console.log(`[${requestId}] Capturing payment with idempotency key:`, idempotencyKey);
    const capturedIntent = await stripe.paymentIntents.capture(
      booking.payment_intent_id,
      { idempotency_key: idempotencyKey }
    );
    
    console.log(`[${requestId}] Payment captured successfully:`, {
      amount: capturedIntent.amount / 100,
      status: capturedIntent.status
    });

    // Update booking payment status and confirm idempotency key is persisted
    await base44.asServiceRole.entities.Booking.update(bookingId, {
      payment_status: 'paid',
      idempotency_key: idempotencyKey // Ensure persisted
    });

    console.log(`[${requestId}] === CAPTURE PAYMENT REQUEST SUCCESS ===`);

    return Response.json({ 
      success: true,
      message: 'Payment captured successfully',
      amount: capturedIntent.amount / 100,
      idempotency_key: idempotencyKey
    });

  } catch (error) {
    console.error(`[${requestId}] === CAPTURE PAYMENT REQUEST FAILED ===`);
    console.error(`[${requestId}] Error:`, error.message);
    console.error(`[${requestId}] Stack:`, error.stack);
    
    return Response.json({ 
      error: error.message || 'Failed to capture payment',
      details: error.type || 'unknown_error',
      request_id: requestId
    }, { status: 500 });
  }
});