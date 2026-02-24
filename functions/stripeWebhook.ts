import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

// Email template helper
const EmailTemplate = {
  wrap: (content, preheader = "") => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #000000 0%, #1f2937 100%); padding: 40px 30px; text-align: center; }
    .logo { display: table; margin: 0 auto 16px; }
    .logo-icon { display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: #ffffff; border-radius: 12px; font-size: 32px; font-weight: 900; color: #000000; margin: 0 6px; }
    .logo-text { display: inline-block; font-size: 40px; font-weight: 900; color: #ffffff; letter-spacing: -1px; margin: 0 6px; vertical-align: middle; }
    .content { padding: 40px 30px; }
    .highlight-box { background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; margin: 24px 0; }
    .banner { background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-left: 4px solid #000000; padding: 20px; margin: 30px 0; border-radius: 8px; }
    .button { display: inline-block; padding: 16px 32px; background: #000000; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 2px solid #e5e7eb; color: #9ca3af; font-size: 13px; }
    .divider { height: 2px; background: #e5e7eb; margin: 30px 0; }
    h1 { font-size: 28px; font-weight: 900; color: #000000; margin: 0 0 16px 0; }
    h2 { font-size: 22px; font-weight: 700; color: #000000; margin: 24px 0 12px 0; }
    h3 { font-size: 18px; font-weight: 700; color: #1f2937; margin: 20px 0 10px 0; }
    p { margin: 0 0 16px 0; color: #4b5563; font-size: 15px; }
    .emoji { font-size: 24px; margin-right: 8px; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="logo">
        <div class="logo-icon">E</div>
        <div class="logo-text">EVNT</div>
      </div>
    </div>
    ${content}
    <div class="footer">
      <p style="margin: 8px 0;">© ${new Date().getFullYear()} EVNT. All rights reserved.</p>
      <p style="margin: 20px 0;">Questions? Email <a href="mailto:info@joinevnt.com" style="color: #000000; font-weight: 600;">info@joinevnt.com</a> or text <a href="tel:6094423524" style="color: #000000; font-weight: 600;">609-442-3524</a></p>
    </div>
  </div>
</body>
</html>
  `
};

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

    // CRITICAL: Verify we haven't already processed this webhook event to prevent double-processing
    // For webhook idempotency, Stripe guarantees delivery but we must handle duplicates
    console.log(`[${webhookId}] Webhook verified and processing`, {
      event_id: event.id,
      event_type: event.type,
      timestamp: new Date().toISOString()
    });

    // NOTE: In production, implement ProcessedWebhookEvent entity to store processed event IDs
    // This prevents race conditions where rapid webhook delivery could cause double-processing
    // For now, relying on idempotency at the operation level (payment intent capture, etc.)

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const bookingId = session.metadata.booking_id || session.client_reference_id;
        const paymentIntentId = session.payment_intent;

        console.log(`[${webhookId}] Checkout session completed:`, { bookingId, paymentIntentId });

        if (bookingId) {
          await base44.asServiceRole.entities.Booking.update(bookingId, {
            payment_status: 'processing',
            status: 'confirmed',
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

        console.log(`[${webhookId}] Payment authorized (escrow):`, { 
          bookingId, 
          payment_intent: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          fee: paymentIntent.application_fee_amount / 100
        });

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
            const clientEmailContent = `
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
                
                <div class="divider"></div>
                <p>Thank you for using EVNT to plan your special event!</p>
              </div>
            `;

            await base44.asServiceRole.integrations.Core.SendEmail({
              to: booking.client_email,
              from_name: "EVNT",
              subject: '✅ Payment Authorized - Booking Confirmed',
              body: EmailTemplate.wrap(clientEmailContent, 'Your payment has been authorized and booking confirmed')
            });

            // Notify vendor
            const vendors = await base44.asServiceRole.entities.Vendor.filter({ id: booking.vendor_id });
            const vendor = vendors[0];
            
            if (vendor) {
              // Get vendor's user email for reliable delivery
              const vendorUsers = await base44.asServiceRole.entities.User.filter({ vendor_id: vendor.id });
              const vendorEmail = vendorUsers.length > 0 ? vendorUsers[0].email : vendor.contact_email || vendor.created_by;

              const vendorEmailContent = `
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
                  
                  <div class="divider"></div>
                  <p>Ready to deliver an amazing experience! Contact your client to finalize event details.</p>
                </div>
              `;

              await base44.asServiceRole.integrations.Core.SendEmail({
                to: vendorEmail,
                from_name: "EVNT",
                subject: '🎉 Booking Confirmed - Payment Secured',
                body: EmailTemplate.wrap(vendorEmailContent, `Payment secured for ${booking.event_type} on ${booking.event_date}`)
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
          await base44.asServiceRole.entities.Booking.update(bookingId, {
            payment_status: 'paid',
            status: 'confirmed',
          });

          // Send receipt emails
          const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
          const booking = bookings[0];

          if (booking) {
            // Send receipt to client
            const receiptContent = `
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
                
                <div class="divider"></div>
                <p>We're here to make your event amazing!</p>
              </div>
            `;

            await base44.asServiceRole.integrations.Core.SendEmail({
              to: booking.client_email,
              from_name: "EVNT",
              subject: '🎉 Payment Receipt - Booking Confirmed',
              body: EmailTemplate.wrap(receiptContent, 'Your payment was successful and booking is confirmed')
            });

            // Send notification to vendor
            const vendors = await base44.asServiceRole.entities.Vendor.filter({ id: booking.vendor_id });
            const vendor = vendors[0];
            
            if (vendor) {
              // Get vendor's user email for reliable delivery
              const vendorUsers = await base44.asServiceRole.entities.User.filter({ vendor_id: vendor.id });
              const vendorEmail = vendorUsers.length > 0 ? vendorUsers[0].email : vendor.contact_email || vendor.created_by;

              const vendorPaymentContent = `
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
                  
                  <div class="divider"></div>
                  <p>Focus on delivering excellence - we've got the payment secured!</p>
                </div>
              `;

              await base44.asServiceRole.integrations.Core.SendEmail({
                to: vendorEmail,
                from_name: "EVNT",
                subject: '💰 Payment Received - Booking Confirmed',
                body: EmailTemplate.wrap(vendorPaymentContent, `Payment received for ${booking.event_type}`)
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

        console.error(`[${webhookId}] PAYMENT FAILED:`, { bookingId, error: paymentIntent.last_payment_error });

        if (bookingId) {
          await base44.asServiceRole.entities.Booking.update(bookingId, {
            payment_status: 'failed',
          });

          const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
          const booking = bookings[0];
          
          if (booking) {
            const failedContent = `
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

                <a href="${req.headers.get('origin')}/Bookings" class="button">Retry Payment</a>
                
                <div class="divider"></div>
                <p>Need help? Contact us and we'll assist you right away.</p>
              </div>
            `;

            await base44.asServiceRole.integrations.Core.SendEmail({
              to: booking.client_email,
              from_name: "EVNT",
              subject: '❌ Payment Failed',
              body: EmailTemplate.wrap(failedContent, 'Your payment could not be processed')
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

          await base44.asServiceRole.entities.Booking.update(booking.id, {
            payment_status: isFullRefund ? 'refunded' : 'partially_refunded',
            status: isFullRefund ? 'cancelled' : booking.status,
            refund_amount: refundAmount,
          });

          // Notify client
          const refundContent = `
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
              
              <div class="divider"></div>
              <p>We hope to help you plan another event in the future!</p>
            </div>
          `;

          await base44.asServiceRole.integrations.Core.SendEmail({
            to: booking.client_email,
            from_name: "EVNT",
            subject: '💰 Refund Processed',
            body: EmailTemplate.wrap(refundContent, `Refund of $${refundAmount.toFixed(2)} has been processed`)
          });
        }
        break;
      }
    }

    return Response.json({ received: true });

  } catch (error) {
    console.error(`[${webhookId}] === WEBHOOK PROCESSING FAILED ===`);
    console.error(`[${webhookId}] Error Type:`, error.constructor.name);
    console.error(`[${webhookId}] Error Message:`, error.message);
    console.error(`[${webhookId}] Stack:`, error.stack);
    
    // Only expose generic error to Stripe (don't leak internals)
    return Response.json({ 
      error: 'Webhook processing failed',
      webhook_id: webhookId 
    }, { status: 500 });
  }
});