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
      <p class="footer-text">Questions? Email us at <a href="mailto:info@joinevnt.com" style="color: #000000;">info@joinevnt.com</a> or text <a href="tel:6094423524" style="color: #000000;">609-442-3524</a></p>
    </div>
  </div>
</body>
</html>
  `,

  bookingConfirmation: (clientName, vendorName, eventType, eventDate, location, totalAmount) => EmailTemplate.wrap(`
    <div class="content">
      <h1><span class="emoji">✅</span> Booking Confirmed!</h1>
      <p>Hi ${clientName},</p>
      <p>Excellent news! Your booking with <strong>${vendorName}</strong> has been confirmed.</p>
      <div class="highlight-box">
        <h3>Booking Summary</h3>
        <p><strong>Vendor:</strong> ${vendorName}<br/>
        <strong>Event Type:</strong> ${eventType}<br/>
        <strong>Date:</strong> ${eventDate}<br/>
        <strong>Location:</strong> ${location}<br/>
        <strong>Total Amount:</strong> $${totalAmount.toLocaleString()}</p>
      </div>
      <h2>What Happens Next?</h2>
      <ul>
        <li><strong>Payment Secured:</strong> Your payment is held securely by EVNT</li>
        <li><strong>Stay Connected:</strong> Message your vendor directly through EVNT</li>
        <li><strong>Event Day:</strong> Your vendor will provide their services as agreed</li>
        <li><strong>Payment Release:</strong> Funds are released to the vendor after successful completion</li>
      </ul>
      <div class="banner">
        <p style="margin: 0;"><strong>📱 Keep in Touch:</strong> Use EVNT's messaging to coordinate all the details with your vendor!</p>
      </div>
      <div class="divider"></div>
      <p>We're here to make your event amazing! If you need any assistance, just reach out.</p>
    </div>
  `, `Your booking with ${vendorName} is confirmed!`)
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });

    const emailContent = EmailTemplate.bookingConfirmation(
      "Sarah",
      "Elite Events DJ",
      "Wedding Reception",
      "June 15, 2026",
      "The Grand Ballroom, Washington DC",
      3500
    );

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: user.email,
      from_name: "EVNT Team",
      subject: "✅ Your Booking with Elite Events DJ is Confirmed!",
      body: emailContent
    });

    return Response.json({ 
      success: true,
      message: `Test email sent to ${user.email}` 
    });

  } catch (error) {
    console.error('Error sending test email:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});