import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // Allow entity automation calls (no user token) OR authenticated users OR internal secret
    const isEntityAutomation = !!payload.event;
    const isAuthenticated = await base44.auth.isAuthenticated();
    const hasSecret = payload._secret === Deno.env.get('INTERNAL_SECRET');
    if (!isEntityAutomation && !isAuthenticated && !hasSecret) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const message = payload.data || payload.message;
    
    if (!message || !message.recipient_email) {
      return Response.json({ 
        error: 'message data with recipient_email required' 
      }, { status: 400 });
    }

    const senderName = message.sender_name || 'Someone';
    const messagePreview = message.message?.substring(0, 100) || '';

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
    .message-box { background: #f9fafb; border-left: 4px solid #000000; padding: 20px; margin: 24px 0; border-radius: 8px; }
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
      <h1 class="title">💬 New Message from ${senderName}</h1>
      <p style="font-size: 16px; color: #4b5563; margin: 0 0 20px 0;">
        You have a new message waiting for you on EVNT.
      </p>
      <div class="message-box">
        <p style="margin: 0; font-size: 14px; color: #6b7280; font-style: italic;">
          "${messagePreview}${message.message?.length > 100 ? '...' : ''}"
        </p>
      </div>
      <div style="text-align: center;">
        <a href="${Deno.env.get('APP_URL') || 'https://joinevnt.com'}/Messages?conversation=${message.conversation_id}" class="button">
          View Message
        </a>
      </div>
    </div>
    <div class="footer">
      <p style="margin: 8px 0;">© ${new Date().getFullYear()} EVNT. All rights reserved.</p>
      <p style="margin: 8px 0;">Questions? Email <a href="mailto:${Deno.env.get('SUPPORT_EMAIL') || 'support@joinevnt.com'}" style="color: #000000; text-decoration: none; font-weight: 600;">${Deno.env.get('SUPPORT_EMAIL') || 'support@joinevnt.com'}</a></p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email (non-fatal - in-app notification still gets created)
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: message.recipient_email,
        from_name: "EVNT Messages",
        subject: `💬 New Message from ${senderName}`,
        body: emailContent
      });
    } catch (emailErr) {
      console.warn('Message email failed (non-fatal):', emailErr.message);
    }

    // ISSUE 16 FIX: Wrap Notification.create in try/catch so it doesn't crash the automation
    try {
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: message.recipient_email,
        type: "new_message",
        title: `💬 New message from ${senderName}`,
        message: messagePreview,
        link: `/Messages?conversation=${message.conversation_id}`,
        read: false
      });
    } catch (notifErr) {
      console.warn('Message notification create failed (non-fatal):', notifErr.message);
    }

    return Response.json({ 
      success: true,
      message: 'Message notification sent' 
    });

  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});