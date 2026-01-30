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
        const session = event.data.object;
        const bookingId = session.metadata.booking_id;

        if (bookingId) {
          // Update booking status
          await base44.asServiceRole.entities.Booking.update(bookingId, {
            payment_status: 'paid',
            status: 'confirmed',
            payment_intent_id: session.payment_intent,
          });

          // Send notification emails
          const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
          const booking = bookings[0];

          if (booking) {
            // Notify client
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: booking.client_email,
              subject: '✅ Payment Confirmed - Booking Confirmed',
              body: `
                <h2>Payment Successful!</h2>
                <p>Your payment for ${booking.vendor_name} has been processed successfully.</p>
                <p><strong>Event:</strong> ${booking.event_type}</p>
                <p><strong>Date:</strong> ${booking.event_date}</p>
                <p><strong>Amount Paid:</strong> $${booking.total_amount.toFixed(2)}</p>
                <p>Your booking is now confirmed. The vendor will be in touch soon!</p>
                <p>View your booking details at: ${req.headers.get('origin')}/Bookings?id=${bookingId}</p>
                <br>
                <p>Best regards,<br>The Evnt Team</p>
                <p><a href="mailto:info@joinevnt.com">info@joinevnt.com</a></p>
              `,
            });

            // Notify vendor
            const vendors = await base44.asServiceRole.entities.Vendor.filter({ id: booking.vendor_id });
            const vendor = vendors[0];
            
            if (vendor) {
              await base44.asServiceRole.integrations.Core.SendEmail({
                to: vendor.contact_email,
                subject: '🎉 Payment Received - Booking Confirmed',
                body: `
                  <h2>Great News! Payment Received</h2>
                  <p>Payment for your booking with ${booking.client_name} has been received.</p>
                  <p><strong>Event:</strong> ${booking.event_type}</p>
                  <p><strong>Date:</strong> ${booking.event_date}</p>
                  <p><strong>Your Payout:</strong> $${booking.vendor_payout.toFixed(2)}</p>
                  <p>The booking is now confirmed. You can proceed with the event planning!</p>
                  <p>View booking details at: ${req.headers.get('origin')}/Bookings?id=${bookingId}</p>
                  <br>
                  <p>Best regards,<br>The Evnt Team</p>
                  <p><a href="mailto:info@joinevnt.com">info@joinevnt.com</a></p>
                `,
              });
            }
          }
        }
        break;
      }

      case 'checkout.session.expired':
      case 'payment_intent.payment_failed': {
        const session = event.data.object;
        const bookingId = session.metadata?.booking_id || session.client_reference_id;

        if (bookingId) {
          await base44.asServiceRole.entities.Booking.update(bookingId, {
            payment_status: 'failed',
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