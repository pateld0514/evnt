import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Internal automation endpoint - validate shared secret
    const secret = req.headers.get('x-internal-secret');
    if (secret !== Deno.env.get('INTERNAL_SECRET')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const payload = await req.json();
    const review = payload.data || payload.review;
    
    if (!review || !review.vendor_id) {
      return Response.json({ 
        error: 'review data required' 
      }, { status: 400 });
    }

    // Get vendor
    const vendor = await base44.asServiceRole.entities.Vendor.get(review.vendor_id);
    if (!vendor) {
      return Response.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Get vendor user email
    const vendorUsers = await base44.asServiceRole.entities.User.filter({ vendor_id: review.vendor_id });
    if (!vendorUsers || vendorUsers.length === 0) {
      return Response.json({ error: 'Vendor user not found' }, { status: 404 });
    }

    const vendorEmail = vendorUsers[0].email;
    const vendorName = vendorUsers[0].full_name || vendor.business_name;
    const stars = '⭐'.repeat(review.rating);

    const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 40px 30px; text-align: center; }
    .logo-icon { width: 48px; height: 48px; background: #ffffff; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 900; color: #000000; margin-bottom: 12px; }
    .logo-text { font-size: 40px; font-weight: 900; color: #ffffff; letter-spacing: -1px; }
    .content { padding: 40px 30px; }
    .title { font-size: 24px; font-weight: 900; color: #000000; margin: 0 0 20px 0; }
    .rating { font-size: 48px; text-align: center; margin: 20px 0; }
    .review-box { background: #fffbeb; border: 2px solid #fcd34d; border-radius: 12px; padding: 24px; margin: 24px 0; }
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
      <h1 class="title">⭐ New Review Received!</h1>
      <p style="font-size: 16px; color: #4b5563; margin: 0 0 20px 0;">
        Hi ${vendorName},
      </p>
      <p style="font-size: 16px; color: #4b5563; margin: 0 0 20px 0;">
        You've received a new <strong>${review.rating}-star review</strong> from <strong>${review.client_name}</strong>!
      </p>
      
      <div class="rating">${stars}</div>
      
      <div class="review-box">
        <p style="margin: 0; font-size: 16px; color: #1f2937; line-height: 1.8;">
          "${review.description}"
        </p>
        <p style="margin: 16px 0 0 0; font-size: 14px; color: #78716c; text-align: right;">
          — ${review.client_name}
        </p>
      </div>

      <p style="font-size: 16px; color: #4b5563; margin: 20px 0;">
        ${review.rating >= 4 
          ? 'Amazing work! Positive reviews like this help you attract more clients and build your reputation on EVNT.'
          : 'Thank you for your service. Use this feedback to continue improving your offerings.'}
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
      to: vendorEmail,
      from_name: "EVNT Reviews",
      subject: `⭐ New ${review.rating}-Star Review from ${review.client_name}`,
      body: emailContent
    });

    // Create in-app notification
    await base44.asServiceRole.entities.Notification.create({
      recipient_email: vendorEmail,
      type: "review_received",
      title: `⭐ New ${review.rating}-Star Review`,
      message: `${review.client_name} left you a review: "${review.description.substring(0, 100)}..."`,
      link: `/VendorDashboard`,
      read: false
    });

    return Response.json({ 
      success: true,
      message: 'Review notification sent' 
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});