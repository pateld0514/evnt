import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    const { user_email, user_type, changes } = payload;
    
    if (!user_email || !user_type) {
      return Response.json({ 
        error: 'user_email and user_type are required' 
      }, { status: 400 });
    }

    const user = await base44.asServiceRole.entities.User.filter({ email: user_email });
    if (!user || user.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const userName = user[0].full_name || user_email;

    // Professional email template
    const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #000000 0%, #1f2937 100%); padding: 40px 30px; text-align: center; }
    .logo-icon { width: 48px; height: 48px; background: #ffffff; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 900; color: #000000; margin-bottom: 12px; }
    .logo-text { font-size: 40px; font-weight: 900; color: #ffffff; letter-spacing: -1px; }
    .content { padding: 40px 30px; }
    .title { font-size: 24px; font-weight: 900; color: #000000; margin: 0 0 20px 0; }
    .message { font-size: 16px; color: #4b5563; margin: 0 0 24px 0; line-height: 1.8; }
    .highlight-box { background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; margin: 24px 0; }
    .success-badge { display: inline-block; background: #10b981; color: white; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 14px; margin-bottom: 16px; }
    .footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 2px solid #e5e7eb; color: #9ca3af; font-size: 13px; }
    ul { margin: 16px 0; padding-left: 24px; }
    li { margin: 8px 0; color: #4b5563; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-icon">E</div>
      <div class="logo-text">EVNT</div>
    </div>
    <div class="content">
      <div class="success-badge">✅ Profile Updated</div>
      <h1 class="title">Your ${user_type === 'vendor' ? 'Vendor' : 'Client'} Profile Has Been Updated</h1>
      <p class="message">Hi ${userName},</p>
      <p class="message">
        Your profile has been successfully updated and all changes are now live across the EVNT platform. 
        ${user_type === 'vendor' ? 'Clients can now see your updated business information.' : 'Vendors can now see your updated preferences.'}
      </p>
      ${changes ? `
      <div class="highlight-box">
        <h3 style="margin: 0 0 12px 0; font-weight: 700;">Changes Made:</h3>
        <ul style="margin: 0;">
          ${changes.map(change => `<li>${change}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
      <p class="message" style="margin-top: 24px;">
        <strong>What's Next?</strong><br/>
        ${user_type === 'vendor' 
          ? 'Continue receiving booking requests from clients looking for your services.'
          : 'Start browsing vendors and booking services for your next event!'}
      </p>
    </div>
    <div class="footer">
      <p style="margin: 8px 0;">© ${new Date().getFullYear()} EVNT. All rights reserved.</p>
      <p style="margin: 8px 0;">Questions? Email <a href="mailto:support@evnt.com" style="color: #000000; text-decoration: none; font-weight: 600;">support@evnt.com</a></p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: user_email,
      from_name: "EVNT Team",
      subject: `✅ Your ${user_type === 'vendor' ? 'Vendor' : 'Client'} Profile Has Been Updated`,
      body: emailContent
    });

    // Create notification
    await base44.asServiceRole.entities.Notification.create({
      recipient_email: user_email,
      type: "booking_status",
      title: "✅ Profile Updated",
      message: `Your ${user_type} profile has been updated successfully. All changes are now live.`,
      read: false
    });

    return Response.json({ 
      success: true,
      message: 'Profile update notification sent' 
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});