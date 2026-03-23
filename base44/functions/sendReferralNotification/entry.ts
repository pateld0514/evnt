import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const payload = await req.json();

    // Internal automation endpoint - validate shared secret
    if (payload._secret !== Deno.env.get('INTERNAL_SECRET')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { referrer_email, referrer_type, referred_email, reward_type } = payload;
    
    if (!referrer_email || !referrer_type || !referred_email || !reward_type) {
      return Response.json({ 
        error: 'Missing required parameters' 
      }, { status: 400 });
    }

    const users = await base44.asServiceRole.entities.User.filter({ email: referrer_email });
    if (!users || users.length === 0) {
      return Response.json({ error: 'Referrer not found' }, { status: 404 });
    }

    const userName = users[0].full_name || referrer_email;
    const isVendor = referrer_type === 'vendor';
    
    // Determine reward message
    const rewardText = reward_type === 'earned' 
      ? (isVendor ? '1 commission-free booking' : '$25 credit')
      : 'pending';

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
    .content { padding: 40px 30px; text-align: center; }
    .title { font-size: 28px; font-weight: 900; color: #000000; margin: 0 0 20px 0; }
    .reward-badge { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px 32px; border-radius: 16px; font-weight: 900; font-size: 32px; margin: 24px 0; box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3); }
    .message { font-size: 16px; color: #4b5563; margin: 0 0 20px 0; line-height: 1.8; }
    .highlight-box { background: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: left; }
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
      <h1 class="title">🎉 Referral Reward ${reward_type === 'earned' ? 'Earned' : 'Pending'}!</h1>
      <p class="message">Hi ${userName},</p>
      
      ${reward_type === 'earned' ? `
        <p class="message">
          Congratulations! Your referral <strong>${referred_email}</strong> has completed their first booking.
        </p>
        <div class="reward-badge">
          ${isVendor ? '🎁 1 FREE BOOKING' : '💰 $25 CREDIT'}
        </div>
        <div class="highlight-box">
          <h3 style="margin: 0 0 12px 0; font-weight: 700; color: #166534;">Your Reward:</h3>
          <p style="margin: 0; font-size: 18px; font-weight: 600; color: #1f2937;">
            ${isVendor 
              ? '✅ Your next booking will be commission-free (0% platform fee)!'
              : '✅ $25 has been added to your account credit!'}
          </p>
          <p style="margin: 12px 0 0 0; font-size: 14px; color: #4b5563;">
            ${isVendor 
              ? 'The commission-free booking will be automatically applied to your next completed booking.'
              : 'Your credit will be automatically applied to your next booking payment.'}
          </p>
        </div>
        <p class="message">
          <strong>Keep Sharing!</strong> There's no limit to how many rewards you can earn. 
          ${isVendor 
            ? 'Every vendor you refer = another commission-free booking!'
            : 'Every friend you refer = another $25 credit!'}
        </p>
      ` : `
        <p class="message">
          Great news! <strong>${referred_email}</strong> has joined EVNT using your referral link.
        </p>
        <div class="highlight-box">
          <h3 style="margin: 0 0 12px 0; font-weight: 700; color: #ca8a04;">⏳ Next Step:</h3>
          <p style="margin: 0; font-size: 16px; color: #1f2937;">
            Once they complete their first booking, you'll both receive your rewards:
          </p>
          <p style="margin: 12px 0 0 0; font-size: 18px; font-weight: 700; color: #000;">
            ${isVendor 
              ? '🎁 1 commission-free booking for you both'
              : '💰 $25 credit for you both'}
          </p>
        </div>
        <p class="message">
          We'll notify you as soon as your reward is ready!
        </p>
      `}
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
      to: referrer_email,
      from_name: "EVNT Rewards",
      subject: reward_type === 'earned' 
        ? `🎉 Referral Reward Earned - ${isVendor ? 'Free Booking' : '$25 Credit'}!`
        : `🎊 New Referral - ${referred_email} Joined EVNT!`,
      body: emailContent
    });

    return Response.json({ 
      success: true,
      message: 'Referral notification sent' 
    });

  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});