import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user - required for service role operations
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, name, user_type } = await req.json();

    if (!email || !name || !user_type) {
      return Response.json({ 
        error: 'Missing required fields: email, name, user_type' 
      }, { status: 400 });
    }

    // Professional email template
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
    .logo-icon { width: 48px; height: 48px; background: #ffffff; border-radius: 12px; display: table; margin: 0 auto 12px; font-size: 32px; font-weight: 900; color: #000000; }
    .logo-icon-inner { display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; }
    .logo-text { font-size: 40px; font-weight: 900; color: #ffffff; letter-spacing: -1px; }
    .content { padding: 40px 30px; }
    .title { font-size: 24px; font-weight: 900; color: #000000; margin: 0 0 20px 0; }
    .message { font-size: 16px; color: #4b5563; margin: 0 0 20px 0; line-height: 1.8; }
    .highlight-box { background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; margin: 24px 0; }
    .banner { background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-left: 4px solid #000000; padding: 20px; margin: 30px 0; border-radius: 8px; }
    .button { display: inline-block; padding: 16px 32px; background: #000000; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 2px solid #e5e7eb; color: #9ca3af; font-size: 13px; }
    h2 { font-size: 20px; font-weight: 700; color: #000000; margin: 20px 0 12px 0; }
    h3 { font-size: 16px; font-weight: 700; color: #1f2937; margin: 16px 0 8px 0; }
    ul { margin: 12px 0; padding-left: 20px; }
    li { margin: 6px 0; color: #4b5563; }
  </style>
</head>
<body>
  <div class="preheader">${preheader}</div>
  <div class="container">
    <div class="header">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center">
        <div class="logo-icon"><span class="logo-icon-inner">E</span></div>
        <div class="logo-text">EVNT</div>
      </td></tr></table>
    </div>
    ${content}
    <div class="footer">
      <p style="margin: 8px 0;">© ${new Date().getFullYear()} EVNT. All rights reserved.</p>
      <p style="margin: 8px 0;">Questions? Email us at <a href="mailto:info@joinevnt.com" style="color: #000000; text-decoration: none; font-weight: 600;">info@joinevnt.com</a> or text <a href="tel:6094423524" style="color: #000000; text-decoration: none; font-weight: 600;">609-442-3524</a></p>
    </div>
  </div>
</body>
</html>
    `;

    // Client welcome email
    if (user_type === 'client') {
      const clientContent = `
        <div class="content">
          <h1 class="title">🎉 Welcome to EVNT, ${name}!</h1>
          <p class="message">We're thrilled to have you join our community! You're now part of the simplest way to plan unforgettable events.</p>
          
          <div class="highlight-box">
            <h3>Your Account is Ready!</h3>
            <p style="margin: 0;"><strong>What you can do now:</strong></p>
            <ul style="margin-top: 12px;">
              <li><strong>Browse Vendors:</strong> Swipe through curated event professionals</li>
              <li><strong>Save Favorites:</strong> Build your dream vendor team</li>
              <li><strong>Book Services:</strong> Send booking requests with one click</li>
              <li><strong>Message Vendors:</strong> Communicate directly and securely</li>
              <li><strong>Manage Everything:</strong> Track all your bookings in one place</li>
            </ul>
          </div>

          <div class="banner">
            <p style="margin: 0;"><strong>✨ Pro Tip:</strong> The best vendors book up fast! Start swiping now to find your perfect matches.</p>
          </div>

          <h2>How It Works:</h2>
          <p class="message">
            <strong>1. Swipe & Discover:</strong> Browse through top-rated vendors tailored to your event<br/>
            <strong>2. Connect & Book:</strong> Request bookings and negotiate directly<br/>
            <strong>3. Pay Securely:</strong> Your payment is protected until the event is complete<br/>
            <strong>4. Enjoy Your Event:</strong> We handle the logistics, you enjoy the celebration
          </p>

          <div class="highlight-box">
            <h3>🔒 Your Protection:</h3>
            <p style="margin: 0;">All payments are held securely in escrow until your event is successfully completed. Plus, every vendor is verified before joining EVNT.</p>
          </div>

          <p class="message">Ready to start planning? Your perfect event is just a swipe away!</p>
        </div>
      `;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        from_name: "EVNT",
        subject: "🎉 Welcome to EVNT - Start Swiping!",
        body: wrapEmail(clientContent, "Welcome to EVNT! Start discovering amazing vendors for your event.")
      });

    // Vendor welcome email (pending approval)
    } else if (user_type === 'vendor') {
      const vendorContent = `
        <div class="content">
          <h1 class="title">🎉 Welcome to EVNT, ${name}!</h1>
          <p class="message">Thank you for registering as a vendor! We're excited to help you grow your event business.</p>
          
          <div class="highlight-box">
            <h3>📋 Application Status: Under Review</h3>
            <p style="margin: 0;">Our admin team is currently reviewing your vendor application. You'll receive an email within <strong>24-48 hours</strong> with the approval decision.</p>
          </div>

          <h2>What Happens Next?</h2>
          <p class="message">
            <strong>1. Review Process:</strong> We verify your credentials and profile<br/>
            <strong>2. Approval Email:</strong> You'll be notified once approved<br/>
            <strong>3. Go Live:</strong> Start receiving booking requests immediately<br/>
            <strong>4. Get Paid:</strong> Payments are released after each successful event
          </p>

          <div class="banner">
            <p style="margin: 0;"><strong>💡 While You Wait:</strong> Make sure to complete your Stripe Connect setup so you're ready to receive payments as soon as you're approved!</p>
          </div>

          <h2>Why EVNT?</h2>
          <ul>
            <li><strong>Direct Exposure:</strong> Get discovered by thousands of event planners</li>
            <li><strong>No Upfront Costs:</strong> Only pay when you book</li>
            <li><strong>Secure Payments:</strong> Get paid reliably after every event</li>
            <li><strong>Easy Management:</strong> Handle bookings, contracts & invoices in one place</li>
            <li><strong>Build Your Brand:</strong> Showcase your portfolio and collect reviews</li>
          </ul>

          <div class="highlight-box">
            <h3>🚀 Success Tips:</h3>
            <p style="margin: 0;">Vendors who respond to booking requests within 2 hours are <strong>5x more likely to convert</strong>. Fast responses = more bookings!</p>
          </div>

          <p class="message">We'll notify you the moment your application is approved. Get ready to grow your business!</p>
        </div>
      `;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        from_name: "EVNT",
        subject: "🎉 Welcome to EVNT - Application Received!",
        body: wrapEmail(vendorContent, "Your EVNT vendor application is under review. You'll hear from us within 24-48 hours!")
      });
    }

    return Response.json({ 
      success: true,
      message: `Welcome email sent to ${email}` 
    });

  } catch (error) {
    console.error('Welcome email error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});