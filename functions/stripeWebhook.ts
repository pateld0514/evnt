import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';
import { sendPlatformEmail } from './lib/emailTemplate.js';
import { validateTransition } from './lib/bookingStateMachine.js';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");



Deno.serve(async (req) => {
  const webhookId = crypto.randomUUID();
  
  // Validate request method and content type
  if (req.method !== 'POST') {
    console.error(`[${webhookId}] WEBHOOK ERROR: Invalid method ${req.method}`);
    return Response.json({ error: 'Invalid method' }, { status: 405 });
  }

  if (!req.headers.get('content-type')?.includes('application/json')) {
    console.error(`[${webhookId}] WEBHOOK ERROR: Invalid content-type`);
    return Response.json({ error: 'Invalid content-type' }, { status: 400 });
  }

  // Validate webhook secret is configured
  if (!webhookSecret) {
    console.error(`[${webhookId}] WEBHOOK ERROR: Webhook secret not configured`);
    return Response.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    const body = await req.text();
    
    // Validate request body
    if (!body || body.length === 0) {
      console.error(`[${webhookId}] WEBHOOK ERROR: Empty body`);
      return Response.json({ error: 'Empty body' }, { status: 400 });
    }

    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error(`[${webhookId}] WEBHOOK ERROR: Missing signature`);
      return Response.json({ error: 'No signature' }, { status: 401 });
    }

    // Initialize base44 AFTER signature verification (per CRITICAL security requirement)
    const base44 = createClientFromRequest(req);

    // Verify webhook signature
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error(`[${webhookId}] WEBHOOK VERIFICATION FAILED:`, err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Validate event structure
    if (!event || !event.id || !event.type) {
      console.error(`[${webhookId}] WEBHOOK ERROR: Invalid event structure`);
      return Response.json({ error: 'Invalid event' }, { status: 400 });
    }

    // CRITICAL: Idempotency check - prevent duplicate processing
    console.log(`[${webhookId}] Webhook received`, {
      event_id: event.id,
      event_type: event.type,
      timestamp: new Date().toISOString()
    });

    // Check if we've already processed this event
    const existingEvents = await base44.asServiceRole.entities.ProcessedWebhookEvent.filter({
      event_id: event.id
    });

    if (existingEvents.length > 0) {
      console.log(`[${webhookId}] Event ${event.id} already processed - returning success (idempotent)`);
      return Response.json({ received: true, already_processed: true }, { status: 200 });
    }

    // Record that we're processing this event
    await base44.asServiceRole.entities.ProcessedWebhookEvent.create({
      event_id: event.id,
      event_type: event.type,
      processed_at: new Date().toISOString()
    });

    console.log(`[${webhookId}] Event ${event.id} marked as processing`);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const bookingId = session.metadata.booking_id || session.client_reference_id;
        const paymentIntentId = session.payment_intent;

        console.log(`[${webhookId}] Checkout session completed:`, { bookingId, paymentIntentId });

        if (bookingId) {
          const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
          const booking = bookings[0];
          
          if (booking) {
            // CRITICAL: Validate state transition
            try {
              validateTransition(booking.status, 'confirmed');
            } catch (error) {
              console.error(`[${webhookId}] Invalid state transition:`, error.message);
              // Log but don't fail webhook - Stripe expects 200
            }
            
            await base44.asServiceRole.entities.Booking.update(bookingId, {
              payment_status: 'processing',
              status: 'confirmed',
              payment_intent_id: paymentIntentId,
              stripe_session_id: session.id,
            });
          }
        }
        break;
      }

      case 'payment_intent.amount_capturable_updated': {
        // Payment authorized, funds in escrow
        const paymentIntent = event.data.object;
        const bookingId = paymentIntent.metadata.booking_id;

        console.log(`[${webhookId}] Payment authorized (escrow):`, { 
          bookingId, 
          payment_intent: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          fee: paymentIntent.application_fee_amount / 100
        });

        if (bookingId) {
          const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
          const booking = bookings[0];
          
          if (booking) {
            // CRITICAL: Validate state transition
            try {
              validateTransition(booking.status, 'confirmed');
            } catch (error) {
              console.error(`[${webhookId}] Invalid state transition:`, error.message);
              // Log but don't fail webhook - Stripe expects 200
            }
            
            await base44.asServiceRole.entities.Booking.update(bookingId, {
              payment_status: 'escrow',
              status: 'confirmed',
              payment_intent_id: paymentIntent.id,
            });
          }

          // Send notifications
          const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
          const booking = bookings[0];

          if (booking) {
            // Notify client using centralized email
            await sendPlatformEmail(base44, {
              to: booking.client_email,
              subject: '✅ Payment Authorized - Booking Confirmed',
              content: `
                <div class="content">
                  <h1><span class="emoji">✅</span> Payment Authorized!</h1>
                  <p>Hi ${booking.client_name || 'there'},</p>
                  <p>Your payment for <strong>${booking.vendor_name}</strong> has been authorized and is being held securely in escrow.</p>
                  
                  <div class="highlight-box">
                    <h3>Booking Details</h3>
                    <p><strong>Event:</strong> ${booking.event_type}<br/>
                    <strong>Date:</strong> ${booking.event_date}<br/>
                    <strong>Location:</strong> ${booking.location || 'TBD'}</p>
                  </div>

                  <h2>Payment Summary</h2>
                  <div class="banner">
                    <p><strong>You Paid (Agreed Price):</strong> $${booking.total_amount_charged.toFixed(2)}</p>
                    <p style="margin-top: 12px; font-size: 14px; color: #666;">Deductions from this amount:</p>
                    <ul style="margin: 8px 0; padding-left: 20px; font-size: 14px; color: #666;">
                      <li>EVNT Fee (${booking.platform_fee_percent}%): $${booking.platform_fee_amount.toFixed(2)}</li>
                      ${booking.sales_tax_amount ? `<li>Sales Tax: $${booking.sales_tax_amount.toFixed(2)}</li>` : ''}
                      <li>Stripe Processing Fee: $${(booking.stripe_fee_amount || 0).toFixed(2)}</li>
                    </ul>
                  </div>

                  <p>Your booking is now <strong>confirmed</strong>. Payment will be released to the vendor after the event is completed.</p>
                  <p>Thank you for using EVNT to plan your special event!</p>
                </div>
              `,
            });

            // Notify vendor
            const vendors = await base44.asServiceRole.entities.Vendor.filter({ id: booking.vendor_id });
            const vendor = vendors[0];
            
            if (vendor) {
              // Get vendor's user email for reliable delivery
              const vendorUsers = await base44.asServiceRole.entities.User.filter({ vendor_id: vendor.id });
              const vendorEmail = vendorUsers.length > 0 ? vendorUsers[0].email : (vendor.contact_email || vendor.created_by);

              await sendPlatformEmail(base44, {
                to: vendorEmail,
                subject: '🎉 Booking Confirmed - Payment Secured',
                content: `
                  <div class="content">
                    <h1><span class="emoji">🎉</span> Booking Confirmed!</h1>
                    <p>Hi there,</p>
                    <p>Great news! Payment for your booking with <strong>${booking.client_name}</strong> has been secured in escrow.</p>
                    
                    <div class="highlight-box">
                      <h3>Booking Details</h3>
                      <p><strong>Client:</strong> ${booking.client_name}<br/>
                      <strong>Event:</strong> ${booking.event_type}<br/>
                      <strong>Date:</strong> ${booking.event_date}<br/>
                      <strong>Location:</strong> ${booking.location || 'TBD'}</p>
                    </div>

                    <h2>Payment Breakdown</h2>
                    <div class="banner">
                      <p><strong>Client Paid Total:</strong> $${booking.total_amount_charged.toFixed(2)}</p>
                      <p style="margin-top: 12px; font-size: 14px;"><strong>Your Payout:</strong> <span style="color: #059669; font-size: 18px; font-weight: 900;">$${(booking.vendor_payout || 0).toFixed(2)}</span></p>
                      <p style="margin-top: 8px; font-size: 13px; color: #666;">After platform fees, taxes, and processing costs</p>
                    </div>

                    <p>Payment will be released to your connected Stripe account automatically after you mark the event as completed.</p>
                    <p>Ready to deliver an amazing experience! Contact your client to finalize event details.</p>
                  </div>
                `,
              });
            }
          }
        }
        break;
      }

      case 'payment_intent.succeeded': {
        // Payment captured - funds released
        const paymentIntent = event.data.object;
        const bookingId = paymentIntent.metadata.booking_id;

        console.log(`[${webhookId}] Payment succeeded:`, { bookingId, payment_intent: paymentIntent.id });

        if (bookingId) {
          const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
          const booking = bookings[0];
          
          if (booking) {
            // CRITICAL: Validate state transition
            try {
              validateTransition(booking.status, 'confirmed');
            } catch (error) {
              console.error(`[${webhookId}] Invalid state transition:`, error.message);
              // Log but don't fail webhook
            }
            
            await base44.asServiceRole.entities.Booking.update(bookingId, {
              payment_status: 'paid',
              status: 'confirmed',
            });
          }

          const bookings2 = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
          const booking = bookings2[0];

          if (booking) {
            // Send receipt to client using centralized email
            await sendPlatformEmail(base44, {
              to: booking.client_email,
              subject: '🎉 Payment Receipt - Booking Confirmed',
              content: `
                <div class="content">
                  <h1><span class="emoji">🎉</span> Payment Successful!</h1>
                  <p>Hi ${booking.client_name || 'there'},</p>
                  <p>Thank you for your payment. Your booking with <strong>${booking.vendor_name}</strong> is now confirmed!</p>
                  
                  <div class="highlight-box">
                    <h3>Booking Details</h3>
                    <p><strong>Event:</strong> ${booking.event_type}<br/>
                    <strong>Date:</strong> ${booking.event_date}<br/>
                    <strong>Location:</strong> ${booking.location || 'TBD'}</p>
                  </div>

                  <h2>Payment Summary</h2>
                  <div class="banner">
                    <p style="margin-bottom: 12px;"><strong>Service Price:</strong> $${(booking.base_event_amount || 0).toFixed(2)}</p>
                     ${booking.platform_fee_amount ? `<p style="font-size: 14px; color: #666; margin: 4px 0;">EVNT Platform Fee (${booking.platform_fee_percent}%): $${booking.platform_fee_amount.toFixed(2)}</p>` : ''}
                      ${booking.sales_tax_amount ? `<p style="font-size: 14px; color: #666; margin: 4px 0;">Sales Tax: $${booking.sales_tax_amount.toFixed(2)}</p>` : ''}
                     <p style="margin-top: 12px; font-size: 18px;"><strong>Total Paid:</strong> $${(booking.total_amount_charged || 0).toFixed(2)}</p>
                  </div>

                  <p>Your vendor will contact you soon to finalize event details.</p>
                  <p>We're here to make your event amazing!</p>
                </div>
              `,
            });

            // Send notification to vendor using centralized email
            const vendors = await base44.asServiceRole.entities.Vendor.filter({ id: booking.vendor_id });
            const vendor = vendors[0];
            
            if (vendor) {
              const vendorUsers = await base44.asServiceRole.entities.User.filter({ vendor_id: vendor.id });
              const vendorEmail = vendorUsers.length > 0 ? vendorUsers[0].email : (vendor.contact_email || vendor.created_by);

              await sendPlatformEmail(base44, {
                to: vendorEmail,
                subject: '💰 Payment Received - Booking Confirmed',
                content: `
                  <div class="content">
                    <h1><span class="emoji">💰</span> Payment Received!</h1>
                    <p>Hi there,</p>
                    <p>Great news! Payment for your booking with <strong>${booking.client_name}</strong> has been processed successfully.</p>
                    
                    <div class="highlight-box">
                      <h3>Booking Details</h3>
                      <p><strong>Client:</strong> ${booking.client_name} (${booking.client_email})<br/>
                      <strong>Event:</strong> ${booking.event_type}<br/>
                      <strong>Date:</strong> ${booking.event_date}<br/>
                      <strong>Location:</strong> ${booking.location || 'TBD'}</p>
                    </div>

                    <h2>Payment Breakdown</h2>
                    <div class="banner">
                      <p><strong>Client Paid Total:</strong> $${(booking.total_amount_charged || 0).toFixed(2)}</p>
                       <p style="margin-top: 12px;"><strong>Your Payout:</strong> <span style="color: #059669; font-size: 20px; font-weight: 900;">$${(booking.vendor_payout || 0).toFixed(2)}</span></p>
                    </div>

                    <p>Funds will be transferred to your connected Stripe account after the event is marked as completed.</p>
                    <p>Please reach out to the client to coordinate event details and ensure an amazing experience!</p>
                    <p>Focus on delivering excellence - we've got the payment secured!</p>
                  </div>
                `,
              });
            }
          }
        }
        break;
      }

      case 'payment_intent.processing': {
        const paymentIntent = event.data.object;
        const bookingId = paymentIntent.metadata.booking_id;

        console.log(`[${webhookId}] Payment processing:`, { bookingId });

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

        console.log(`[${webhookId}] Payment canceled:`, { bookingId });

        if (bookingId) {
          const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
          const booking = bookings[0];
          
          if (booking) {
            // CRITICAL: Validate state transition
            try {
              validateTransition(booking.status, 'cancelled');
            } catch (error) {
              console.error(`[${webhookId}] Invalid state transition:`, error.message);
              // Log but don't fail webhook
            }
            
            await base44.asServiceRole.entities.Booking.update(bookingId, {
              payment_status: 'cancelled',
              status: 'cancelled',
            });
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const bookingId = paymentIntent.metadata.booking_id;

        console.error(`[${webhookId}] PAYMENT FAILED:`, { bookingId, error: paymentIntent.last_payment_error });

        if (bookingId) {
          await base44.asServiceRole.entities.Booking.update(bookingId, {
            payment_status: 'failed',
          });

          const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
          const booking = bookings[0];
          
          if (booking) {
            await sendPlatformEmail(base44, {
              to: booking.client_email,
              subject: '❌ Payment Failed',
              content: `
                <div class="content">
                  <h1><span class="emoji">❌</span> Payment Failed</h1>
                  <p>Hi ${booking.client_name || 'there'},</p>
                  <p>We were unable to process your payment for <strong>${booking.vendor_name}</strong>.</p>
                  
                  <div class="banner">
                    <p style="margin: 0;"><strong>What to do next:</strong></p>
                    <ul style="margin: 12px 0 0; padding-left: 20px;">
                      <li>Check your payment method details</li>
                      <li>Ensure sufficient funds are available</li>
                      <li>Try a different card if needed</li>
                    </ul>
                  </div>

                  <p>Need help? Contact us and we'll assist you right away.</p>
                </div>
              `,
            });
          }
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        const paymentIntentId = charge.payment_intent;

        console.log(`[${webhookId}] Charge refunded:`, { payment_intent: paymentIntentId, amount: charge.amount_refunded / 100 });

        // Find booking by payment intent
        const bookings = await base44.asServiceRole.entities.Booking.list();
        const booking = bookings.find(b => b.payment_intent_id === paymentIntentId);

        if (booking) {
          const refundAmount = charge.amount_refunded / 100;
          const isFullRefund = charge.refunded;

          // CRITICAL: Validate state transition if moving to cancelled
          if (isFullRefund) {
            try {
              validateTransition(booking.status, 'cancelled');
            } catch (error) {
              console.error(`[${webhookId}] Invalid state transition for refund:`, error.message);
              // Log but don't fail webhook
            }
          }

          await base44.asServiceRole.entities.Booking.update(booking.id, {
            payment_status: isFullRefund ? 'refunded' : 'partially_refunded',
            status: isFullRefund ? 'cancelled' : booking.status,
            refund_amount: refundAmount,
          });

          // Notify client using centralized email
          await sendPlatformEmail(base44, {
            to: booking.client_email,
            subject: '💰 Refund Processed',
            content: `
              <div class="content">
                <h1><span class="emoji">💰</span> Refund Processed</h1>
                <p>Hi ${booking.client_name || 'there'},</p>
                <p>A refund of <strong>$${refundAmount.toFixed(2)}</strong> has been processed for your booking with ${booking.vendor_name}.</p>
                
                <div class="highlight-box">
                  <h3>Refund Details</h3>
                  <p><strong>Amount Refunded:</strong> $${refundAmount.toFixed(2)}<br/>
                  <strong>Booking:</strong> ${booking.event_type}<br/>
                  <strong>Expected in Account:</strong> 5-10 business days</p>
                </div>

                <p>The funds will be returned to your original payment method.</p>
                <p>We hope to help you plan another event in the future!</p>
              </div>
            `,
          });
        }
        break;
      }
    }

    console.log(`[${webhookId}] Webhook processing completed successfully`);
    return Response.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error(`[${webhookId}] === WEBHOOK PROCESSING FAILED ===`);
    console.error(`[${webhookId}] Error Type:`, error.constructor.name);
    console.error(`[${webhookId}] Error Message:`, error.message);
    console.error(`[${webhookId}] Stack:`, error.stack);
    
    // Only expose generic error to Stripe (don't leak internals)
    // Return 500 so Stripe retries
    return Response.json({ 
      error: 'Webhook processing failed',
      webhook_id: webhookId 
    }, { status: 500 });
  }
});