import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    const { vendor_email, vendor_name, status, rejection_reason } = payload;
    
    if (!vendor_email || !status) {
      return Response.json({ 
        error: 'vendor_email and status are required' 
      }, { status: 400 });
    }

    const isApproved = status === 'approved';

    const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: ${isApproved ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'}; padding: 40px 30px; text-align: center; }
    .logo-icon { width: 48px; height: 48px; background: #ffffff; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 900; color: #000000; margin-bottom: 12px; }
    .logo-text { font-size: 40px; font-weight: 900; color: #ffffff; letter-spacing: -1px; }
    .content { padding: 40px 30px; }
    .title { font-size: 28px; font-weight: 900; color: #000000; margin: 0 0 20px 0; text-align: center; }
    .message { font-size: 16px; color: #4b5563; margin: 0 0 20px 0; line-height: 1.8; }
    .highlight-box { background: ${isApproved ? '#f0fdf4' : '#fef2f2'}; border: 2px solid ${isApproved ? '#86efac' : '#fca5a5'}; border-radius: 12px; padding: 24px; margin: 24px 0; }
    .button { display: inline-block; padding: 16px 32px; background: #000000; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 2px solid #e5e7eb; color: #9ca3af; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-icon">E</div>
      <div class="logo-text">EVNT</div>
    </div>
    <div class="content">
      <h1 class="title">${isApproved ? '🎉' : '📋'} Vendor Application ${isApproved ? 'Approved' : 'Update'}</h1>
      <p class="message">Hi ${vendor_name || 'there'},</p>
      
      ${isApproved ? `
        <p class="message">
          Congratulations! Your vendor application has been <strong>approved</strong>. 
          You are now live on the EVNT platform and can start receiving booking requests from clients!
        </p>
        <div class="highlight-box">
          <h3 style="margin: 0 0 16px 0; font-weight: 700; color: #166534;">✅ You're All Set!</h3>
          <p style="margin: 0 0 12px 0; color: #1f2937;"><strong>What's Next:</strong></p>
          <ul style="margin: 0; padding-left: 20px; color: #1f2937;">
            <li style="margin: 8px 0;">Complete your Stripe Connect setup to receive payments</li>
            <li style="margin: 8px 0;">Add portfolio photos to showcase your work</li>
            <li style="margin: 8px 0;">Respond quickly to booking requests to increase conversions</li>
            <li style="margin: 8px 0;">Provide excellent service to earn 5-star reviews</li>
          </ul>
        </div>
        <div style="text-align: center;">
          <a href="${process.env.APP_URL || 'https://your-app.base44.com'}/VendorDashboard" class="button">
            Go to Dashboard
          </a>
        </div>
        <p class="message" style="margin-top: 24px;">
          <strong>🎯 Pro Tips:</strong> Vendors who respond within 2 hours get 5x more bookings. 
          Keep notifications on and your profile updated!
        </p>
      ` : `
        <p class="message">
          Thank you for your interest in joining EVNT as a vendor. 
          After careful review, we are unable to approve your application at this time.
        </p>
        ${rejection_reason ? `
          <div class="highlight-box">
            <h3 style="margin: 0 0 12px 0; font-weight: 700; color: #991b1b;">Reason:</h3>
            <p style="margin: 0; color: #1f2937;">${rejection_reason}</p>
          </div>
        ` : ''}
        <p class="message">
          You're welcome to reapply in the future. If you have questions about this decision, 
          please contact us at <a href="mailto:info@joinevnt.com" style="color: #000000; font-weight: 600;">info@joinevnt.com</a>.
        </p>
      `}
    </div>
    <div class="footer">
      <p style="margin: 8px 0;">© ${new Date().getFullYear()} EVNT. All rights reserved.</p>
      <p style="margin: 8px 0;">Questions? Email <a href="mailto:info@joinevnt.com" style="color: #000000; text-decoration: none; font-weight: 600;">info@joinevnt.com</a></p>
      <p style="margin: 12px 0 8px 0; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 11px;">
        <a href="https://evnt.com/unsubscribe" style="color: #0066cc; text-decoration: none;">Unsubscribe</a> | 
        <a href="https://evnt.com/privacy" style="color: #0066cc; text-decoration: none;">Privacy Policy</a> | 
        <a href="https://evnt.com/terms" style="color: #0066cc; text-decoration: none;">Terms of Service</a>
      </p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: vendor_email,
      from_name: "EVNT Team",
      subject: isApproved 
        ? `🎉 Welcome to EVNT - Your Vendor Application is Approved!`
        : `📋 Update on Your EVNT Vendor Application`,
      body: emailContent
    });

    // Create notification
    await base44.asServiceRole.entities.Notification.create({
      recipient_email: vendor_email,
      type: "booking_status",
      title: isApproved ? "🎉 Vendor Approved!" : "📋 Application Update",
      message: isApproved 
        ? "Your vendor application has been approved! You can now start receiving bookings."
        : `Your vendor application was not approved. ${rejection_reason || 'Contact support for details.'}`,
      link: isApproved ? "/VendorDashboard" : "/Profile",
      read: false
    });

    return Response.json({ 
      success: true,
      message: 'Vendor approval notification sent' 
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});