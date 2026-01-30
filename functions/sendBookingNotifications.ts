import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const EmailTemplate = {
  wrap: (content, preheader = "") => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>EVNT</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; }
    .preheader { display: none; max-height: 0; overflow: hidden; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #000000 0%, #1f2937 100%); padding: 40px 30px; text-align: center; }
    .logo { display: inline-flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .logo-icon { width: 48px; height: 48px; background: #ffffff; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 900; color: #000000; }
    .logo-text { font-size: 40px; font-weight: 900; color: #ffffff; letter-spacing: -1px; }
    .tagline { color: #9ca3af; font-size: 14px; margin: 0; font-weight: 500; }
    .content { padding: 40px 30px; background-color: #ffffff; }
    .banner { background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-left: 4px solid #000000; padding: 20px; margin: 30px 0; border-radius: 8px; }
    .highlight-box { background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; margin: 24px 0; }
    .button { display: inline-block; padding: 16px 32px; background: #000000; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 2px solid #e5e7eb; }
    .footer-text { color: #9ca3af; font-size: 13px; margin: 8px 0; }
    h1 { font-size: 28px; font-weight: 900; color: #000000; margin: 0 0 16px 0; line-height: 1.2; }
    h2 { font-size: 22px; font-weight: 700; color: #000000; margin: 24px 0 12px 0; }
    h3 { font-size: 18px; font-weight: 700; color: #1f2937; margin: 20px 0 10px 0; }
    p { margin: 0 0 16px 0; color: #4b5563; font-size: 15px; }
    ul { margin: 16px 0; padding-left: 24px; }
    li { margin: 8px 0; color: #4b5563; }
    strong { color: #000000; font-weight: 700; }
    .emoji { font-size: 24px; margin-right: 8px; }
    .divider { height: 2px; background: #e5e7eb; margin: 30px 0; }
  </style>
</head>
<body>
  <div class="preheader">${preheader}</div>
  <div class="email-container">
    <div class="header">
      <div class="logo">
        <div class="logo-icon">E</div>
        <div class="logo-text">EVNT</div>
      </div>
      <p class="tagline">Event Planning Made Simple</p>
    </div>
    ${content}
    <div class="footer">
      <p class="footer-text">© ${new Date().getFullYear()} EVNT. All rights reserved.</p>
      <p class="footer-text">Questions? Email us at <a href="mailto:support@evnt.com" style="color: #000000;">support@evnt.com</a> or text <a href="tel:6094423524" style="color: #000000;">609-442-3524</a></p>
    </div>
  </div>
</body>
</html>
  `,

  newBookingRequest: (vendorName, clientName, eventType, eventDate, location, budget, message) => EmailTemplate.wrap(`
    <div class="content">
      <h1><span class="emoji">🎉</span> New Booking Request!</h1>
      <p>Hi ${vendorName},</p>
      <p>Great news! You have a new booking request from <strong>${clientName}</strong>.</p>
      <div class="highlight-box">
        <h3>Event Details</h3>
        <p><strong>Event Type:</strong> ${eventType}<br/>
        <strong>Date:</strong> ${eventDate}<br/>
        <strong>Location:</strong> ${location}<br/>
        <strong>Budget:</strong> $${budget.toLocaleString()}</p>
        ${message ? `<div class="divider"></div><h3>Client's Message:</h3><p style="font-style: italic; color: #4b5563;">"${message}"</p>` : ''}
      </div>
      <div class="banner">
        <p style="margin: 0;"><strong>⚡ Quick Response Tip:</strong> Vendors who respond within 2 hours are 5x more likely to book!</p>
      </div>
    </div>
  `, `New booking request from ${clientName} for ${eventType}`),

  bookingConfirmation: (clientName, vendorName, eventType, eventDate, totalAmount) => EmailTemplate.wrap(`
    <div class="content">
      <h1><span class="emoji">✅</span> Booking Confirmed!</h1>
      <p>Hi ${clientName},</p>
      <p>Excellent news! Your booking with <strong>${vendorName}</strong> has been confirmed.</p>
      <div class="highlight-box">
        <h3>Booking Summary</h3>
        <p><strong>Vendor:</strong> ${vendorName}<br/>
        <strong>Event Type:</strong> ${eventType}<br/>
        <strong>Date:</strong> ${eventDate}<br/>
        <strong>Total Amount:</strong> $${totalAmount.toLocaleString()}</p>
      </div>
      <div class="banner">
        <p style="margin: 0;"><strong>📱 Keep in Touch:</strong> Use EVNT's messaging to coordinate all the details with your vendor!</p>
      </div>
    </div>
  `, `Your booking with ${vendorName} is confirmed!`),

  paymentReceived: (vendorName, clientName, amount, eventDate) => EmailTemplate.wrap(`
    <div class="content">
      <h1><span class="emoji">💰</span> Payment Received!</h1>
      <p>Hi ${vendorName},</p>
      <p>Great news! Payment has been secured for your upcoming event with <strong>${clientName}</strong>.</p>
      <div class="highlight-box">
        <h3>Payment Details</h3>
        <p><strong>Amount:</strong> $${amount.toLocaleString()}<br/>
        <strong>Client:</strong> ${clientName}<br/>
        <strong>Event Date:</strong> ${eventDate}<br/>
        <strong>Status:</strong> <span style="color: #059669; font-weight: 700;">Secured</span></p>
      </div>
      <div class="banner">
        <p style="margin: 0;"><strong>🔒 Secure & Protected:</strong> EVNT holds payment until you successfully complete the event.</p>
      </div>
    </div>
  `, `Payment of $${amount.toLocaleString()} secured for your upcoming event`),
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { bookingId, notificationType } = await req.json();

    if (!bookingId || !notificationType) {
      return Response.json({ 
        error: 'Missing bookingId or notificationType' 
      }, { status: 400 });
    }

    const booking = await base44.asServiceRole.entities.Booking.get(bookingId);
    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    const vendor = await base44.asServiceRole.entities.Vendor.get(booking.vendor_id);
    
    let emailContent = '';
    let subject = '';
    let recipient = '';

    switch (notificationType) {
      case 'new_booking':
        recipient = vendor.contact_email;
        subject = `🎉 New Booking Request from ${booking.client_name}`;
        emailContent = EmailTemplate.newBookingRequest(
          vendor.business_name,
          booking.client_name,
          booking.event_type,
          booking.event_date,
          booking.location,
          booking.budget,
          booking.notes
        );
        break;

      case 'booking_confirmed':
        recipient = booking.client_email;
        subject = `✅ Booking Confirmed with ${vendor.business_name}`;
        emailContent = EmailTemplate.bookingConfirmation(
          booking.client_name,
          vendor.business_name,
          booking.event_type,
          booking.event_date,
          booking.total_amount
        );
        break;

      case 'payment_received':
        recipient = vendor.contact_email;
        subject = `💰 Payment Received - $${booking.total_amount.toLocaleString()}`;
        emailContent = EmailTemplate.paymentReceived(
          vendor.business_name,
          booking.client_name,
          booking.total_amount,
          booking.event_date
        );
        break;

      default:
        return Response.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: recipient,
      from_name: "EVNT Team",
      subject: subject,
      body: emailContent
    });

    return Response.json({ 
      success: true,
      message: 'Notification sent successfully' 
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});