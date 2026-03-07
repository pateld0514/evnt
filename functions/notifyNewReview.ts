import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const payload = await req.json();

    // Entity automation payload: { event: { type, entity_name, entity_id }, data: {...} }
    const review = payload.data || payload.review;
    
    if (!review || !review.vendor_id) {
      return Response.json({ 
        error: 'review data required' 
      }, { status: 400 });
    }

    // Get vendor — ISSUE 2 FIX: non-fatal if vendor or user not found
    let vendor, vendorUsers;
    try {
      const vendorList = await base44.asServiceRole.entities.Vendor.filter({ id: review.vendor_id });
      if (!vendorList || vendorList.length === 0) {
        console.warn('Vendor not found for vendor_id:', review.vendor_id, '— skipping notification');
        return Response.json({ success: true, message: 'Vendor not found, skipping notification' });
      }
      vendor = vendorList[0];
    } catch(e) {
      console.warn('Vendor lookup failed:', e.message, '— skipping notification');
      return Response.json({ success: true, message: 'Vendor lookup failed, skipping notification' });
    }

    // Get vendor user email — fall back to vendor.contact_email
    vendorUsers = await base44.asServiceRole.entities.User.filter({ vendor_id: review.vendor_id });
    const vendorEmail = vendorUsers?.[0]?.email || vendor.contact_email;
    if (!vendorEmail) {
      console.warn('No email found for vendor_id:', review.vendor_id, '— skipping notification');
      return Response.json({ success: true, message: 'Vendor email not found, skipping notification' });
    }
    // FIX: Guard full_name access — vendorUsers may be empty, fall back to business_name
    const vendorName = vendorUsers?.[0]?.full_name || vendor.business_name;
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
      <p style="margin: 8px 0;">Questions? Email <a href="mailto:${Deno.env.get('SUPPORT_EMAIL') || 'support@joinevnt.com'}" style="color: #000000; text-decoration: none; font-weight: 600;">${Deno.env.get('SUPPORT_EMAIL') || 'support@joinevnt.com'}</a></p>
      <!-- ISSUE 20 FIX: Add required CAN-SPAM unsubscribe footer -->
      <p style="margin: 12px 0 8px 0; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 11px;">
        <a href="${Deno.env.get('APP_URL') || 'https://joinevnt.com'}/unsubscribe?email=${encodeURIComponent(vendorEmail)}" style="color: #0066cc; text-decoration: none;">Unsubscribe</a> |
        <a href="${Deno.env.get('APP_URL') || 'https://joinevnt.com'}/privacy" style="color: #0066cc; text-decoration: none;">Privacy Policy</a> |
        <a href="${Deno.env.get('APP_URL') || 'https://joinevnt.com'}/terms" style="color: #0066cc; text-decoration: none;">Terms of Service</a>
      </p>
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

    // ISSUE 5 FIX: Wrap Notification.create in try/catch so it doesn't crash the automation
    try {
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: vendorEmail,
        type: "review_received",
        title: `⭐ New ${review.rating}-Star Review`,
        message: `${review.client_name} left you a review: "${review.description.substring(0, 100)}${review.description.length > 100 ? '...' : ''}"`,
        link: `/VendorDashboard`,
        read: false
      });
    } catch (notifErr) {
      console.warn('Review notification create failed (non-fatal):', notifErr.message);
    }

    return Response.json({ 
      success: true,
      message: 'Review notification sent' 
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});