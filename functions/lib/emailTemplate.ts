/**
 * Centralized Email Template
 * ALL platform emails MUST use this wrapper
 * Ensures unsubscribe links, branding, and compliance
 */

export const wrapEmailContent = (content, recipientEmail) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #000000 0%, #1f2937 100%); padding: 40px 30px; text-align: center; }
    .logo-icon { width: 48px; height: 48px; background: #ffffff; border-radius: 12px; display: inline-block; font-size: 32px; font-weight: 900; color: #000000; margin-bottom: 12px; text-align: center; line-height: 48px; vertical-align: middle; }
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
      <p style="margin: 20px 0;">Questions? Email <a href="mailto:support@evnt.com" style="color: #000000; font-weight: 600;">support@evnt.com</a> or text <a href="tel:6094423524" style="color: #000000; font-weight: 600;">609-442-3524</a></p>
      <p style="margin: 12px 0 8px 0; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 11px;">
        <a href="https://evnt.com/unsubscribe?email=${encodeURIComponent(recipientEmail)}" style="color: #0066cc; text-decoration: none;">Unsubscribe</a> | 
        <a href="https://evnt.com/privacy" style="color: #0066cc; text-decoration: none;">Privacy Policy</a> | 
        <a href="https://evnt.com/terms" style="color: #0066cc; text-decoration: none;">Terms of Service</a>
      </p>
    </div>
  </div>
</body>
</html>
`;

export async function sendPlatformEmail(base44, { to, subject, content }) {
  if (!to) {
    throw new Error('Email recipient required');
  }
  
  const wrappedContent = wrapEmailContent(content, to);
  
  return await base44.asServiceRole.integrations.Core.SendEmail({
    to,
    from_name: 'EVNT',
    subject,
    body: wrappedContent,
  });
}