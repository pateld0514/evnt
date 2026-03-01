import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin-only check
    if (user?.email !== "pateld0514@gmail.com") {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const adminEmail = user.email;

    // Email template wrapper (same as in notifyBookingUpdate)
    const wrapEmail = (content, preheader) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; }
    .preheader { display: none; max-height: 0; overflow: hidden; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #000000 0%, #1f2937 100%); padding: 40px 30px; text-align: center; }
    .logo-icon { width: 48px; height: 48px; background: #ffffff; border-radius: 12px; font-size: 32px; font-weight: 900; color: #000000; margin-bottom: 12px; }
    .logo-text { font-size: 40px; font-weight: 900; color: #ffffff; letter-spacing: -1px; }
    .content { padding: 40px 30px; }
    .title { font-size: 24px; font-weight: 900; color: #000000; margin: 0 0 20px 0; }
    .message { font-size: 16px; color: #4b5563; margin: 0 0 20px 0; line-height: 1.8; }
    .highlight-box { background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; margin: 24px 0; }
    .button { display: inline-block; padding: 16px 32px; background: #000000; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 2px solid #e5e7eb; color: #9ca3af; font-size: 13px; }
    .banner { background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-left: 4px solid #000000; padding: 20px; margin: 30px 0; border-radius: 8px; }
    h2 { font-size: 20px; font-weight: 700; color: #000000; margin: 20px 0 12px 0; }
    h3 { font-size: 16px; font-weight: 700; color: #1f2937; margin: 16px 0 8px 0; }
    p { margin: 0 0 12px 0; }
    ul { margin: 12px 0; padding-left: 20px; }
    li { margin: 6px 0; }
  </style>
</head>
<body>
  <div class="preheader">${preheader}</div>
  <div class="container">
    <div class="header">
      <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 12px auto;border-collapse:collapse;">
        <tr>
          <td style="padding:0;">
            <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border-radius:12px;overflow:hidden;background:#ffffff;width:48px;height:48px;">
              <tr>
                <td width="48" height="48" align="center" valign="middle" style="width:48px;height:48px;background:#ffffff;font-size:32px;font-weight:900;color:#000000;font-family:Arial,Helvetica,sans-serif;text-align:center;vertical-align:middle;padding:0;line-height:1;">E</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <div class="logo-text">EVNT</div>
    </div>
    ${content}
    <div class="footer">
      <p style="margin: 8px 0;">© ${new Date().getFullYear()} EVNT. All rights reserved.</p>
      <p style="margin: 8px 0;">Questions? Email <a href="mailto:info@joinevnt.com" style="color: #000000; text-decoration: none; font-weight: 600;">info@joinevnt.com</a> or text <a href="tel:6094423524" style="color: #000000; text-decoration: none; font-weight: 600;">609-442-3524</a></p>
    </div>
  </div>
</body>
</html>
    `;

    // All sample emails
    const emails = [
      // BOOKING STATUS NOTIFICATIONS
      {
        name: 'Booking Status: Negotiating (Client)',
        to: adminEmail,
        subject: '💬 Price Proposal Received from Sample Vendor',
        content: wrapEmail(`
          <div class="content">
            <h1 class="title">💬 Price Proposal Received</h1>
            <p class="message">Sample Vendor has sent you a pricing proposal for your Wedding. Review and respond in your bookings.</p>
            <div class="highlight-box">
              <h3>Booking Details:</h3>
              <p><strong>Vendor:</strong> Sample Vendor</p>
              <p><strong>Event:</strong> Wedding</p>
              <p><strong>Date:</strong> June 15, 2026</p>
              <p><strong>Status:</strong> Negotiating</p>
            </div>
          </div>
        `, '💬 Price Proposal Received')
      },
      {
        name: 'Booking Status: Negotiating (Vendor)',
        to: adminEmail,
        subject: '✅ Proposal Sent to Sample Client',
        content: wrapEmail(`
          <div class="content">
            <h1 class="title">📤 Proposal Sent Successfully</h1>
            <p class="message">Your pricing proposal has been sent to Sample Client. You'll be notified when they respond.</p>
            <div class="highlight-box">
              <h3>Booking Details:</h3>
              <p><strong>Client:</strong> Sample Client</p>
              <p><strong>Event:</strong> Wedding</p>
              <p><strong>Date:</strong> June 15, 2026</p>
              <p><strong>Status:</strong> Negotiating</p>
            </div>
          </div>
        `, '📤 Proposal Sent Successfully')
      },
      {
        name: 'Booking Status: Payment Pending (Client)',
        to: adminEmail,
        subject: '💳 Complete Your Payment - Sample Vendor',
        content: wrapEmail(`
          <div class="content">
            <h1 class="title">💳 Ready for Payment</h1>
            <p class="message">You've accepted the proposal from Sample Vendor. Complete your payment to confirm the booking.</p>
            <div class="highlight-box">
              <h3>Booking Details:</h3>
              <p><strong>Vendor:</strong> Sample Vendor</p>
              <p><strong>Event:</strong> Wedding</p>
              <p><strong>Date:</strong> June 15, 2026</p>
              <p><strong>Status:</strong> Payment Pending</p>
            </div>
          </div>
        `, '💳 Ready for Payment')
      },
      {
        name: 'Booking Status: Confirmed (Client)',
        to: adminEmail,
        subject: '🎉 Booking Confirmed - Sample Vendor',
        content: wrapEmail(`
          <div class="content">
            <h1 class="title">🎉 Booking Confirmed!</h1>
            <p class="message">Your booking with Sample Vendor is confirmed for June 15, 2026. Payment secured successfully!</p>
            <div class="highlight-box">
              <h3>Booking Details:</h3>
              <p><strong>Vendor:</strong> Sample Vendor</p>
              <p><strong>Event:</strong> Wedding</p>
              <p><strong>Date:</strong> June 15, 2026</p>
              <p><strong>Status:</strong> Confirmed</p>
            </div>
          </div>
        `, '🎉 Booking Confirmed!')
      },
      {
        name: 'Booking Status: Confirmed (Vendor)',
        to: adminEmail,
        subject: '💰 New Booking Confirmed - Sample Client',
        content: wrapEmail(`
          <div class="content">
            <h1 class="title">💰 New Confirmed Booking</h1>
            <p class="message">Sample Client confirmed their booking for June 15, 2026. Payment is secured in escrow.</p>
            <div class="highlight-box">
              <h3>Booking Details:</h3>
              <p><strong>Client:</strong> Sample Client</p>
              <p><strong>Event:</strong> Wedding</p>
              <p><strong>Date:</strong> June 15, 2026</p>
              <p><strong>Status:</strong> Confirmed</p>
            </div>
          </div>
        `, '💰 New Booking Confirmed')
      },
      {
        name: 'Booking Status: In Progress (Client)',
        to: adminEmail,
        subject: '🎬 Your Event with Sample Vendor is Today',
        content: wrapEmail(`
          <div class="content">
            <h1 class="title">🎬 Event Day!</h1>
            <p class="message">Your event with Sample Vendor is happening today! Have a wonderful celebration!</p>
            <div class="highlight-box">
              <h3>Booking Details:</h3>
              <p><strong>Vendor:</strong> Sample Vendor</p>
              <p><strong>Event:</strong> Wedding</p>
              <p><strong>Date:</strong> Today</p>
              <p><strong>Status:</strong> In Progress</p>
            </div>
          </div>
        `, '🎬 Event Day!')
      },
      {
        name: 'Booking Status: Completed (Client)',
        to: adminEmail,
        subject: '⭐ How Was Your Event with Sample Vendor?',
        content: wrapEmail(`
          <div class="content">
            <h1 class="title">⭐ Leave a Review</h1>
            <p class="message">Your event with Sample Vendor is complete! Please share your experience by leaving a review.</p>
            <div class="highlight-box">
              <h3>Booking Details:</h3>
              <p><strong>Vendor:</strong> Sample Vendor</p>
              <p><strong>Event:</strong> Wedding</p>
              <p><strong>Date:</strong> June 15, 2026</p>
              <p><strong>Status:</strong> Completed</p>
            </div>
          </div>
        `, '⭐ Leave a Review')
      },
      {
        name: 'Booking Status: Completed (Vendor)',
        to: adminEmail,
        subject: '🎊 Payment Released - $1,840.00',
        content: wrapEmail(`
          <div class="content">
            <h1 class="title">🎊 Payment Released!</h1>
            <p class="message">Event for Sample Client marked as complete. Payment released to your account!</p>
            <div class="highlight-box">
              <h3>Booking Details:</h3>
              <p><strong>Client:</strong> Sample Client</p>
              <p><strong>Event:</strong> Wedding</p>
              <p><strong>Date:</strong> June 15, 2026</p>
              <p><strong>Status:</strong> Completed</p>
            </div>
          </div>
        `, '🎊 Payment Released')
      },
      {
        name: 'Booking Status: Cancelled (Client)',
        to: adminEmail,
        subject: '❌ Booking Cancelled - Sample Vendor',
        content: wrapEmail(`
          <div class="content">
            <h1 class="title">❌ Booking Cancelled</h1>
            <p class="message">Your booking with Sample Vendor has been cancelled. Refund of $1,860.00 processed.</p>
            <div class="highlight-box">
              <h3>Booking Details:</h3>
              <p><strong>Vendor:</strong> Sample Vendor</p>
              <p><strong>Event:</strong> Wedding</p>
              <p><strong>Date:</strong> June 15, 2026</p>
              <p><strong>Status:</strong> Cancelled</p>
            </div>
          </div>
        `, '❌ Booking Cancelled')
      },
      {
        name: 'Booking Status: Declined (Client)',
        to: adminEmail,
        subject: '📋 Update on Your Booking Request',
        content: wrapEmail(`
          <div class="content">
            <h1 class="title">📋 Booking Declined</h1>
            <p class="message">Sample Vendor is unable to accept your booking request. Please try other vendors.</p>
            <div class="highlight-box">
              <h3>Booking Details:</h3>
              <p><strong>Vendor:</strong> Sample Vendor</p>
              <p><strong>Event:</strong> Wedding</p>
              <p><strong>Date:</strong> June 15, 2026</p>
              <p><strong>Status:</strong> Declined</p>
            </div>
          </div>
        `, '📋 Booking Declined')
      },
      // VENDOR APPROVAL EMAILS
      {
        name: 'Vendor Approval Email',
        to: adminEmail,
        subject: '🎉 Congratulations! Your Vendor Account is Approved',
        content: wrapEmail(`
          <div class="content">
            <h1 class="title">🎉 Congratulations!</h1>
            <p class="message">We're thrilled to inform you that <strong>Sample Event Business</strong> has been <strong>approved</strong> to join the EVNT platform!</p>
            <div class="highlight-box">
              <h3>🚀 You're Now Live!</h3>
              <p><strong>Your vendor profile is now visible to thousands of event planners.</strong></p>
            </div>
            <h2>What's Next?</h2>
            <ul>
              <li><strong>Complete Your Profile:</strong> Add stunning photos and detailed service descriptions</li>
              <li><strong>Set Your Pricing:</strong> Configure packages and pricing to match your services</li>
              <li><strong>Connect Stripe:</strong> Link your bank account to receive payments seamlessly</li>
              <li><strong>Respond Quickly:</strong> Fast responses lead to more bookings!</li>
            </ul>
            <div class="banner">
              <p style="margin: 0;"><strong>💡 Pro Tip:</strong> Vendors with complete profiles and portfolio photos get 3x more bookings!</p>
            </div>
          </div>
        `, 'Your EVNT vendor account has been approved!')
      },
      {
        name: 'Vendor Rejection Email',
        to: adminEmail,
        subject: '📋 Update on Your EVNT Vendor Application',
        content: wrapEmail(`
          <div class="content">
            <h1 class="title">Update on Your Application</h1>
            <p class="message">Thank you for your interest in joining EVNT as a vendor for <strong>Sample Event Business</strong>.</p>
            <p class="message">After careful review of your application, we're unable to approve your vendor account at this time.</p>
            <div class="banner">
              <h3 style="margin-top: 0;">Reason for Decision:</h3>
              <p style="margin: 0; color: #1f2937;">Incomplete business license documentation. Please resubmit with clear, legible copies of your license and insurance verification.</p>
            </div>
            <h2>What You Can Do</h2>
            <ul>
              <li><strong>Address the Concerns:</strong> Review the feedback above and make necessary updates</li>
              <li><strong>Reapply:</strong> You're welcome to submit a new application once you've addressed the issues</li>
              <li><strong>Contact Us:</strong> Have questions? We're happy to provide additional guidance</li>
            </ul>
          </div>
        `, 'Update on your EVNT vendor application')
      }
    ];

    // Send all emails
    const results = [];
    for (const email of emails) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: email.to,
          from_name: "EVNT",
          subject: email.subject,
          body: email.content
        });
        results.push({ name: email.name, status: 'sent' });
      } catch (err) {
        results.push({ name: email.name, status: 'failed', error: err.message });
      }
    }

    return Response.json({ 
      success: true,
      message: `Sent ${results.filter(r => r.status === 'sent').length} of ${results.length} test emails to ${adminEmail}`,
      results
    });

  } catch (error) {
    console.error('Test email error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});