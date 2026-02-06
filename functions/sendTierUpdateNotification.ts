import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    const { user_email, user_type, old_tier, new_tier, benefits } = payload;
    
    if (!user_email || !user_type || !new_tier) {
      return Response.json({ 
        error: 'user_email, user_type, and new_tier are required' 
      }, { status: 400 });
    }

    const users = await base44.asServiceRole.entities.User.filter({ email: user_email });
    if (!users || users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const userName = users[0].full_name || user_email;
    const isVendor = user_type === 'vendor';
    const tierEmoji = new_tier === 'gold' || new_tier === 'vip' ? '🏆' : 
                      new_tier === 'silver' || new_tier === 'regular' ? '⭐' : '🎖️';

    const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); padding: 40px 30px; text-align: center; }
    .logo-icon { width: 48px; height: 48px; background: #ffffff; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 900; color: #000000; margin-bottom: 12px; }
    .logo-text { font-size: 40px; font-weight: 900; color: #ffffff; letter-spacing: -1px; }
    .content { padding: 40px 30px; }
    .title { font-size: 28px; font-weight: 900; color: #000000; margin: 0 0 20px 0; text-align: center; }
    .tier-badge { display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); color: white; padding: 12px 24px; border-radius: 12px; font-weight: 900; font-size: 20px; margin: 20px 0; text-transform: uppercase; }
    .benefits-box { background: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 24px; margin: 24px 0; }
    .benefit-item { background: white; border: 1px solid #d1fae5; padding: 12px; margin: 8px 0; border-radius: 8px; display: flex; align-items: center; gap: 12px; }
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
      <h1 class="title">${tierEmoji} Congratulations! You've Reached ${new_tier.toUpperCase()}!</h1>
      <p style="text-align: center; font-size: 18px; color: #4b5563;">Hi ${userName},</p>
      <p style="text-align: center; font-size: 16px; color: #6b7280; margin-bottom: 30px;">
        Great news! You've been upgraded to <strong style="color: #000;">${new_tier.toUpperCase()}</strong> tier based on your activity on EVNT.
      </p>
      
      <div style="text-align: center;">
        ${old_tier ? `
          <div style="display: inline-block; background: #f3f4f6; padding: 8px 16px; border-radius: 8px; margin-right: 12px; text-decoration: line-through; color: #9ca3af; font-weight: 600;">
            ${old_tier.toUpperCase()}
          </div>
          <span style="font-size: 24px;">→</span>
        ` : ''}
        <div class="tier-badge">
          ${tierEmoji} ${new_tier.toUpperCase()}
        </div>
      </div>

      <div class="benefits-box">
        <h3 style="margin: 0 0 16px 0; font-weight: 900; font-size: 18px; color: #166534;">🎁 Your New Benefits:</h3>
        ${benefits && benefits.length > 0 ? benefits.map(benefit => `
          <div class="benefit-item">
            <span style="font-size: 20px;">✓</span>
            <span style="font-weight: 600; color: #1f2937;">${benefit}</span>
          </div>
        `).join('') : `
          <div class="benefit-item">
            <span style="font-size: 20px;">✓</span>
            <span style="font-weight: 600; color: #1f2937;">
              ${isVendor 
                ? `${new_tier === 'gold' ? '2.5%' : new_tier === 'silver' ? '1.0%' : '0%'} platform fee discount`
                : `${new_tier === 'vip' ? '3%' : new_tier === 'regular' ? '1%' : '0%'} booking discount`}
            </span>
          </div>
        `}
      </div>

      <p style="text-align: center; font-size: 16px; color: #4b5563; margin-top: 30px;">
        ${isVendor 
          ? 'Keep delivering exceptional service to maintain your tier status and unlock even more benefits!'
          : 'Continue booking amazing vendors for your events to unlock even more savings!'}
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
      subject: `${tierEmoji} Congratulations! You've Reached ${new_tier.toUpperCase()} Tier!`,
      body: emailContent
    });

    return Response.json({ 
      success: true,
      message: 'Tier update notification sent' 
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});