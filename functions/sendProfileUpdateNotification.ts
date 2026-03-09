import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const payload = await req.json();

    // Internal automation endpoint - validate shared secret
    if (payload._secret !== Deno.env.get('INTERNAL_SECRET')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { user_email, user_type, updated_fields } = payload;
    
    if (!user_email || !user_type) {
      return Response.json({ 
        error: 'user_email and user_type are required' 
      }, { status: 400 });
    }

    const users = await base44.asServiceRole.entities.User.filter({ email: user_email });
    if (!users || users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const userName = users[0].full_name || user_email;
    const isVendor = user_type === 'vendor';

    const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 30px; text-align: center; }
    .logo-icon { width: 48px; height: 48px; background: #ffffff; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 900; color: #000000; margin-bottom: 12px; }
    .logo-text { font-size: 40px; font-weight: 900; color: #ffffff; letter-spacing: -1px; }
    .content { padding: 40px 30px; }
    .title { font-size: 24px; font-weight: 900; color: #000000; margin: 0 0 20px 0; }
    .message { font-size: 16px; color: #4b5563; margin: 0 0 20px 0; line-height: 1.8; }
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
      <h1 class="title">✅ Profile Updated Successfully</h1>
      <p class="message">Hi ${userName},</p>
      <p class="message">
        Your ${isVendor ? 'vendor' : 'client'} profile has been updated successfully. All changes are now live across the EVNT platform.
      </p>
      ${isVendor ? `
        <div style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0; font-weight: 600; color: #166534;">
            💡 Your updated profile is now visible to clients browsing vendors. Make sure to keep your portfolio and pricing current!
          </p>
        </div>
      ` : ''}
      <p class="message">
        Thanks for keeping your information up to date!
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
      from_name: "EVNT",
      subject: "✅ Profile Updated Successfully",
      body: emailContent
    });

    return Response.json({ 
      success: true,
      message: 'Profile update notification sent' 
    });

  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});