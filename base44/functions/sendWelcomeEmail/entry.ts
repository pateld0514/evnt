import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Inlined email wrapper — no local imports allowed in Deno Deploy
function wrapEmailContent(content, recipientEmail, preheader = '') {
  const supportEmail = Deno.env.get('SUPPORT_EMAIL') || 'support@joinevnt.com';
  const supportPhone = Deno.env.get('SUPPORT_PHONE') || '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #000000 0%, #1f2937 100%); padding: 40px 30px; text-align: center; }
    .logo-text { font-size: 40px; font-weight: 900; color: #ffffff; letter-spacing: -1px; }
    .content { padding: 40px 30px; }
    .footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 2px solid #e5e7eb; color: #9ca3af; font-size: 13px; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 12px auto;border-collapse:collapse;">
        <tr>
          <td>
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
      <p style="margin: 20px 0;">Questions? Email <a href="mailto:${supportEmail}" style="color: #000000; font-weight: 600;">${supportEmail}</a>${supportPhone ? ` or text <a href="tel:${supportPhone}" style="color: #000000; font-weight: 600;">${supportPhone}</a>` : ''}</p>
      <p style="margin: 12px 0 8px 0; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 11px;">
        <a href="https://evnt.com/unsubscribe?email=${encodeURIComponent(recipientEmail)}" style="color: #0066cc; text-decoration: none;">Unsubscribe</a> | 
        <a href="https://evnt.com/privacy" style="color: #0066cc; text-decoration: none;">Privacy Policy</a> | 
        <a href="https://evnt.com/terms" style="color: #0066cc; text-decoration: none;">Terms of Service</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

async function sendPlatformEmail(base44, { to, subject, content }) {
  if (!to) throw new Error('Email recipient required');
  return await base44.asServiceRole.integrations.Core.SendEmail({
    to,
    from_name: 'EVNT',
    subject,
    body: wrapEmailContent(content, to),
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me().catch(() => null);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, name, user_type } = await req.json();

    if (!email || !name || !user_type) {
      return Response.json({ error: 'Missing required fields: email, name, user_type' }, { status: 400 });
    }

    if (user_type === 'client') {
      await sendPlatformEmail(base44, {
        to: email,
        subject: "🎉 Welcome to EVNT - Start Swiping!",
        content: `
          <div class="content">
            <h1 style="font-size:24px;font-weight:900;color:#000000;margin:0 0 20px 0;">🎉 Welcome to EVNT, ${name}!</h1>
            <p style="font-size:16px;color:#4b5563;margin:0 0 20px 0;line-height:1.8;">You're all set! EVNT is the easiest way to find and book top-rated vendors for your next event. Thousands of verified professionals are waiting to make your vision a reality.</p>

            <div style="background:#f9fafb;border:2px solid #e5e7eb;border-radius:12px;padding:24px;margin:24px 0;">
              <h3 style="font-size:16px;font-weight:700;color:#1f2937;margin:0 0 12px 0;">Here's how it works:</h3>
              <p style="margin:0 0 8px 0;color:#4b5563;">✨ <strong>Swipe</strong> through curated vendors tailored to your event type</p>
              <p style="margin:0 0 8px 0;color:#4b5563;">💬 <strong>Connect</strong> and negotiate directly with vendors</p>
              <p style="margin:0 0 8px 0;color:#4b5563;">🔒 <strong>Pay securely</strong> — funds held in escrow until your event is done</p>
              <p style="margin:0;color:#4b5563;">⭐ <strong>Review</strong> your vendors after every event</p>
            </div>

            <div style="text-align:center;margin:32px 0;">
              <a href="https://joinevnt.com" style="display:inline-block;padding:16px 40px;background:#000000;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;font-size:18px;">Start Swiping Now →</a>
            </div>

            <div style="background:linear-gradient(135deg,#f3f4f6 0%,#e5e7eb 100%);border-left:4px solid #000000;padding:20px;margin:30px 0;border-radius:8px;">
              <p style="margin:0;"><strong>🔥 Pro Tip:</strong> The best vendors fill up fast — start browsing now before your date gets taken!</p>
            </div>
          </div>
        `
      });

    } else if (user_type === 'vendor') {
      await sendPlatformEmail(base44, {
        to: email,
        subject: "🎉 Welcome to EVNT - Application Received!",
        content: `
          <div class="content">
            <h1 style="font-size:24px;font-weight:900;color:#000000;margin:0 0 20px 0;">🎉 Welcome to EVNT, ${name}!</h1>
            <p style="font-size:16px;color:#4b5563;margin:0 0 20px 0;line-height:1.8;">Thank you for registering as a vendor! We're excited to help you grow your event business.</p>

            <div style="background:#f9fafb;border:2px solid #e5e7eb;border-radius:12px;padding:24px;margin:24px 0;">
              <h3 style="font-size:16px;font-weight:700;color:#1f2937;margin:0 0 8px 0;">📋 Application Status: Under Review</h3>
              <p style="margin:0;color:#4b5563;">Our admin team is reviewing your application. You'll hear back within <strong>24-48 hours</strong>.</p>
            </div>

            <p style="font-size:16px;color:#4b5563;margin:0 0 8px 0;line-height:1.8;"><strong>1. Review:</strong> We verify your credentials and profile</p>
            <p style="font-size:16px;color:#4b5563;margin:0 0 8px 0;line-height:1.8;"><strong>2. Approval:</strong> You'll be notified by email once approved</p>
            <p style="font-size:16px;color:#4b5563;margin:0 0 8px 0;line-height:1.8;"><strong>3. Go Live:</strong> Start receiving booking requests immediately</p>
            <p style="font-size:16px;color:#4b5563;margin:0 0 20px 0;line-height:1.8;"><strong>4. Get Paid:</strong> Payments released after each successful event</p>

            <div style="background:linear-gradient(135deg,#f3f4f6 0%,#e5e7eb 100%);border-left:4px solid #000000;padding:20px;margin:30px 0;border-radius:8px;">
              <p style="margin:0;"><strong>💡 While You Wait:</strong> Set up your Stripe Connect account so you're ready to receive payments the moment you're approved!</p>
            </div>
          </div>
        `
      });
    }

    return Response.json({ success: true, message: `Welcome email sent to ${email}` });

  } catch (error) {
    console.error('Welcome email error:', error);
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});