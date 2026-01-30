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

    // Create line items for the checkout
    const lineItems = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${booking.vendor_name} - ${booking.event_type}`,
            description: booking.service_description || `Event services for ${booking.event_date}`,
          },
          unit_amount: Math.round(booking.agreed_price * 100), // Stripe uses cents
        },
        quantity: 1,
      }
    ];

    // Add additional fees as separate line items
    if (booking.additional_fees && booking.additional_fees.length > 0) {
      booking.additional_fees.forEach(fee => {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: fee.name,
              description: fee.description || '',
            },
            unit_amount: Math.round(fee.amount * 100),
          },
          quantity: 1,
        });
      });
    }

    // Platform fee is deducted from vendor payout, not charged separately to client

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/Bookings?payment=success&booking=${bookingId}`,
      cancel_url: `${req.headers.get('origin')}/Bookings?payment=cancelled&booking=${bookingId}`,
      client_reference_id: bookingId,
      metadata: {
        booking_id: bookingId,
        client_email: booking.client_email,
        vendor_id: booking.vendor_id,
      },
    });

    // Update booking with payment intent
    await base44.entities.Booking.update(bookingId, {
      payment_intent_id: session.id,
      payment_status: 'processing',
    });

    return Response.json({ 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return Response.json({ 
      error: error.message || 'Failed to create checkout session' 
    }, { status: 500 });
  }
});