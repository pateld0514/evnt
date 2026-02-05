import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
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

    // Fetch booking details
    const bookings = await base44.entities.Booking.filter({ id: bookingId });
    const booking = bookings[0];

    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify user is the client
    if (booking.client_email !== user.email) {
      return Response.json({ error: 'Unauthorized to pay for this booking' }, { status: 403 });
    }

    // Verify booking status
    if (booking.status !== 'payment_pending') {
      return Response.json({ error: 'Booking is not ready for payment' }, { status: 400 });
    }

    // Get vendor's Stripe account ID
    const vendors = await base44.asServiceRole.entities.Vendor.filter({ id: booking.vendor_id });
    if (vendors.length === 0) {
      return Response.json({ error: 'Vendor not found' }, { status: 404 });
    }
    
    const vendor = vendors[0];
    if (!vendor.stripe_account_id || !vendor.stripe_account_verified) {
      return Response.json({ 
        error: 'Vendor has not completed payment setup yet' 
      }, { status: 400 });
    }

    // Calculate amounts in cents
    const totalAmount = Math.round((booking.total_amount || booking.agreed_price) * 100);
    const platformFeeAmount = Math.round(booking.platform_fee_amount * 100);

    // Create Payment Intent with MANUAL CAPTURE for escrow
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'usd',
      capture_method: 'manual', // CRITICAL: This holds funds in escrow
      application_fee_amount: platformFeeAmount,
      transfer_data: {
        destination: vendor.stripe_account_id,
      },
      metadata: {
        booking_id: bookingId,
        client_email: booking.client_email,
        vendor_id: booking.vendor_id,
        event_type: booking.event_type,
        event_date: booking.event_date,
      },
      description: `${booking.vendor_name} - ${booking.event_type} on ${booking.event_date}`,
    });

    // Get origin for success/cancel URLs
    const referer = req.headers.get('referer') || req.headers.get('origin') || '';
    const baseUrl = referer ? new URL(referer).origin : 'https://evnt.app';

    // Create checkout session with payment intent
    const session = await stripe.checkout.sessions.create({
      payment_intent: paymentIntent.id, // Link existing payment intent
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${booking.vendor_name} - ${booking.event_type}`,
              description: booking.service_description || `Event services for ${booking.event_date}`,
            },
            unit_amount: totalAmount,
          },
          quantity: 1,
        }
      ],
      success_url: `${baseUrl}/Bookings?payment=success&booking=${bookingId}`,
      cancel_url: `${baseUrl}/Bookings?payment=cancelled&booking=${bookingId}`,
      client_reference_id: bookingId,
      metadata: {
        booking_id: bookingId,
        client_email: booking.client_email,
        vendor_id: booking.vendor_id,
        payment_intent_id: paymentIntent.id,
      },
    });

    // Update booking with payment intent and session
    await base44.asServiceRole.entities.Booking.update(bookingId, {
      payment_intent_id: paymentIntent.id,
      payment_status: 'processing',
      stripe_session_id: session.id,
    });

    return Response.json({ 
      sessionId: session.id,
      url: session.url,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return Response.json({ 
      error: error.message || 'Failed to create checkout session' 
    }, { status: 500 });
  }
});