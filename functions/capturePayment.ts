import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] === CAPTURE PAYMENT REQUEST START ===`);
  
  // Add idempotency key from request headers to prevent double-charges
  const idempotencyKey = req.headers.get('Idempotency-Key') || requestId;
  console.log(`[${requestId}] Idempotency Key:`, idempotencyKey);
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      console.error(`[${requestId}] UNAUTHORIZED: No authenticated user`);
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[${requestId}] User authenticated:`, user.email);
    const { bookingId } = await req.json();
    console.log(`[${requestId}] Booking ID:`, bookingId);
    
    if (!bookingId) {
      console.error(`[${requestId}] VALIDATION ERROR: Missing booking ID`);
      return Response.json({ error: 'Booking ID required' }, { status: 400 });
    }

    // Fetch booking
    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
    const booking = bookings[0];

    if (!booking) {
      console.error(`[${requestId}] NOT FOUND: Booking ${bookingId} does not exist`);
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

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
      console.log(`[${requestId}] Payment already captured`);
      return Response.json({ 
        success: true,
        message: 'Payment already captured',
        already_captured: true
      });
    }

    if (paymentIntent.status !== 'requires_capture') {
      console.error(`[${requestId}] INVALID STATE: Payment intent status is ${paymentIntent.status}`);
      return Response.json({ 
        error: `Payment cannot be captured. Status: ${paymentIntent.status}` 
      }, { status: 400 });
    }

    // Capture the payment with idempotency
    console.log(`[${requestId}] Capturing payment...`);
    const capturedIntent = await stripe.paymentIntents.capture(
     booking.payment_intent_id,
     { idempotency_key: idempotencyKey }
    );
    
    console.log(`[${requestId}] Payment captured successfully:`, {
      amount: capturedIntent.amount / 100,
      status: capturedIntent.status
    });

    // Update booking payment status
    await base44.asServiceRole.entities.Booking.update(bookingId, {
      payment_status: 'paid',
    });

    console.log(`[${requestId}] === CAPTURE PAYMENT REQUEST SUCCESS ===`);

    return Response.json({ 
      success: true,
      message: 'Payment captured successfully',
      amount: capturedIntent.amount / 100
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