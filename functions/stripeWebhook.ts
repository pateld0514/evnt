import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return Response.json({ error: 'No signature' }, { status: 400 });
    }

    // Verify webhook signature
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        // Checkout session completed - payment authorized
        const session = event.data.object;
        const bookingId = session.metadata.booking_id || session.client_reference_id;
        const paymentIntentId = session.payment_intent;

        console.log('Checkout session completed:', { bookingId, paymentIntentId, session_id: session.id });

        if (bookingId) {
          await base44.asServiceRole.entities.Booking.update(bookingId, {
            payment_status: 'processing',
            payment_intent_id: paymentIntentId,
            stripe_session_id: session.id,
          });
        }
        break;
      }

      case 'payment_intent.amount_capturable_updated': {
        // Payment authorized, funds in escrow
        const paymentIntent = event.data.object;
        const bookingId = paymentIntent.metadata.booking_id;

        console.log('Payment authorized (escrow):', { bookingId, payment_intent: paymentIntent.id });

        if (bookingId) {
          await base44.asServiceRole.entities.Booking.update(bookingId, {
            payment_status: 'escrow',
            status: 'confirmed',
            payment_intent_id: paymentIntent.id,
          });

          // Send notifications
          const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
          const booking = bookings[0];

          if (booking) {
            // Notify client
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: booking.client_email,
              subject: '✅ Payment Authorized - Booking Confirmed',
              body: `
                <h2>Payment Authorized Successfully!</h2>
                <p>Your payment for ${booking.vendor_name} has been authorized and is being held securely.</p>
                <p><strong>Event:</strong> ${booking.event_type}</p>
                <p><strong>Date:</strong> ${booking.event_date}</p>
                <p><strong>Amount:</strong> $${booking.total_amount.toFixed(2)}</p>
                <p>Your booking is now confirmed. Payment will be released to the vendor after the event is completed.</p>
                <p>View your booking details at: ${req.headers.get('origin')}/Bookings</p>
                <br>
                <p>Best regards,<br>The EVNT Team</p>
              `,
            });

            // Notify vendor
            const vendors = await base44.asServiceRole.entities.Vendor.filter({ id: booking.vendor_id });
            const vendor = vendors[0];
            
            if (vendor) {
              await base44.asServiceRole.integrations.Core.SendEmail({
                to: vendor.contact_email,
                subject: '🎉 Booking Confirmed - Payment Secured',
                body: `
                  <h2>New Booking Confirmed!</h2>
                  <p>Payment for your booking with ${booking.client_name} has been secured in escrow.</p>
                  <p><strong>Event:</strong> ${booking.event_type}</p>
                  <p><strong>Date:</strong> ${booking.event_date}</p>
                  <p><strong>Your Payout:</strong> $${booking.vendor_payout.toFixed(2)}</p>
                  <p>Payment will be released to your account automatically after the event is marked as completed.</p>
                  <p>View booking details at: ${req.headers.get('origin')}/Bookings</p>
                  <br>
                  <p>Best regards,<br>The EVNT Team</p>
                `,
              });
            }
          }
        }
        break;
      }

      case 'payment_intent.succeeded': {
        // This happens AFTER manual capture
        const paymentIntent = event.data.object;
        const bookingId = paymentIntent.metadata.booking_id;

        console.log('Payment succeeded:', { bookingId, payment_intent: paymentIntent.id });

        if (bookingId) {
          await base44.asServiceRole.entities.Booking.update(bookingId, {
            payment_status: 'paid',
          });
        }
        break;
      }

      case 'payment_intent.processing': {
        const paymentIntent = event.data.object;
        const bookingId = paymentIntent.metadata.booking_id;

        console.log('Payment processing:', { bookingId, payment_intent: paymentIntent.id });

        if (bookingId) {
          await base44.asServiceRole.entities.Booking.update(bookingId, {
            payment_status: 'processing',
          });
        }
        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object;
        const bookingId = paymentIntent.metadata.booking_id;

        if (bookingId) {
          await base44.asServiceRole.entities.Booking.update(bookingId, {
            payment_status: 'cancelled',
            status: 'cancelled',
          });
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const bookingId = paymentIntent.metadata.booking_id;

        if (bookingId) {
          await base44.asServiceRole.entities.Booking.update(bookingId, {
            payment_status: 'failed',
          });

          const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
          const booking = bookings[0];
          
          if (booking) {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: booking.client_email,
              subject: '❌ Payment Failed',
              body: `
                <h2>Payment Failed</h2>
                <p>We were unable to process your payment for ${booking.vendor_name}.</p>
                <p>Please try again or contact us for assistance.</p>
                <p><a href="${req.headers.get('origin')}/Bookings">Retry Payment</a></p>
              `,
            });
          }
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        const paymentIntentId = charge.payment_intent;

        // Find booking by payment intent
        const bookings = await base44.asServiceRole.entities.Booking.list();
        const booking = bookings.find(b => b.payment_intent_id === paymentIntentId);

        if (booking) {
          const refundAmount = charge.amount_refunded / 100;
          const isFullRefund = charge.refunded;

          await base44.asServiceRole.entities.Booking.update(booking.id, {
            payment_status: isFullRefund ? 'refunded' : 'partially_refunded',
            status: isFullRefund ? 'cancelled' : booking.status,
            refund_amount: refundAmount,
          });

          // Notify client
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: booking.client_email,
            subject: '💰 Refund Processed',
            body: `
              <h2>Refund Issued</h2>
              <p>A refund of $${refundAmount.toFixed(2)} has been processed for your booking with ${booking.vendor_name}.</p>
              <p>The funds should appear in your account within 5-10 business days.</p>
              <p>Best regards,<br>The EVNT Team</p>
            `,
          });
        }
        break;
      }
    }

    return Response.json({ received: true });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});