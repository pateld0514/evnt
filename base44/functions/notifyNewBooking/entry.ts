import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Triggered by Booking entity automation on CREATE
// Notifies vendor of a new incoming booking request

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const booking = payload.data || payload.booking;

    if (!booking || !booking.vendor_id) {
      return Response.json({ success: true, message: 'No booking data or vendor_id, skipping' });
    }

    // Only notify on new pending bookings
    if (booking.status && booking.status !== 'pending') {
      return Response.json({ success: true, message: 'Not a pending booking, skipping' });
    }

    // Get vendor info
    let vendor = null;
    try {
      const vendors = await base44.asServiceRole.entities.Vendor.filter({ id: booking.vendor_id });
      if (vendors.length === 0) {
        console.warn('[notifyNewBooking] Vendor not found:', booking.vendor_id);
        return Response.json({ success: true, message: 'Vendor not found, skipping' });
      }
      vendor = vendors[0];
    } catch (e) {
      console.warn('[notifyNewBooking] Vendor lookup failed:', e.message);
      return Response.json({ success: true, message: 'Vendor lookup failed, skipping' });
    }

    // Get vendor user email
    const vendorUsers = await base44.asServiceRole.entities.User.filter({ vendor_id: booking.vendor_id });
    const vendorEmail = vendorUsers.length > 0 ? vendorUsers[0].email : vendor.contact_email;

    if (!vendorEmail || !vendorEmail.includes('@')) {
      return Response.json({ success: true, message: 'No vendor email found, skipping' });
    }

    const eventDate = booking.event_date
      ? new Date(booking.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : 'TBD';

    const appUrl = Deno.env.get('APP_URL') || 'https://joinevnt.com';

    const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #000000 0%, #1f2937 100%); padding: 40px 30px; text-align: center; }
    .logo-text { font-size: 40px; font-weight: 900; color: #ffffff; letter-spacing: -1px; }
    .content { padding: 40px 30px; }
    .title { font-size: 24px; font-weight: 900; color: #000000; margin: 0 0 20px 0; }
    .highlight-box { background: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 24px; margin: 24px 0; }
    .button { display: inline-block; padding: 16px 32px; background: #000000; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 2px solid #e5e7eb; color: #9ca3af; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-text">EVNT</div>
    </div>
    <div class="content">
      <h1 class="title">🎉 New Booking Request!</h1>
      <p style="font-size: 16px; color: #4b5563;">Hi ${vendor.business_name},</p>
      <p style="font-size: 16px; color: #4b5563;">You have a new booking request from <strong>${booking.client_name || 'a client'}</strong>. Review and respond as soon as possible to secure this booking.</p>
      
      <div class="highlight-box">
        <h3 style="margin: 0 0 12px 0; font-weight: 700; color: #15803d;">Booking Details</h3>
        <p style="margin: 4px 0;"><strong>Client:</strong> ${booking.client_name || 'Unknown'}</p>
        <p style="margin: 4px 0;"><strong>Event Type:</strong> ${booking.event_type || 'Not specified'}</p>
        <p style="margin: 4px 0;"><strong>Event Date:</strong> ${eventDate}</p>
        <p style="margin: 4px 0;"><strong>Location:</strong> ${booking.location || 'Not specified'}</p>
        ${booking.guest_count ? `<p style="margin: 4px 0;"><strong>Guests:</strong> ${booking.guest_count}</p>` : ''}
        ${booking.budget ? `<p style="margin: 4px 0;"><strong>Budget:</strong> $${Number(booking.budget).toLocaleString()}</p>` : ''}
      </div>

      <p style="text-align: center;">
        <a href="${appUrl}/Bookings" class="button">View & Respond to Request</a>
      </p>

      <p style="font-size: 14px; color: #6b7280;">Tip: Vendors who respond quickly are more likely to secure bookings. Aim to respond within 24 hours.</p>
    </div>
    <div class="footer">
      <p style="margin: 8px 0;">© ${new Date().getFullYear()} EVNT. All rights reserved.</p>
      <p style="margin: 8px 0;">Questions? Email <a href="mailto:${Deno.env.get('SUPPORT_EMAIL') || 'support@joinevnt.com'}" style="color: #000000; font-weight: 600;">${Deno.env.get('SUPPORT_EMAIL') || 'support@joinevnt.com'}</a></p>
      <p style="margin: 12px 0 8px 0; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 11px;">
        <a href="${appUrl}/unsubscribe?email=${encodeURIComponent(vendorEmail)}" style="color: #0066cc;">Unsubscribe</a> |
        <a href="${appUrl}/privacy" style="color: #0066cc;">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>`;

    // Send email to vendor
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: vendorEmail,
        from_name: "EVNT Bookings",
        subject: `🎉 New Booking Request from ${booking.client_name || 'a client'} — ${booking.event_type || 'Event'}`,
        body: emailBody
      });
    } catch (emailErr) {
      console.warn('[notifyNewBooking] Email failed (non-fatal):', emailErr.message);
    }

    // In-app notification
    try {
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: vendorEmail,
        type: 'booking_status',
        title: '🎉 New Booking Request!',
        message: `${booking.client_name || 'A client'} sent a booking request for a ${booking.event_type || 'event'} on ${eventDate}. Review and respond now.`,
        link: `/Bookings`,
        read: false
      });
    } catch (notifErr) {
      console.warn('[notifyNewBooking] In-app notification failed (non-fatal):', notifErr.message);
    }

    // Also send confirmation to client
    if (booking.client_email && booking.client_email.includes('@')) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: booking.client_email,
          from_name: "EVNT Bookings",
          subject: `✅ Booking Request Submitted — ${vendor.business_name}`,
          body: `<!DOCTYPE html><html>
<head><style>
  body{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#f3f4f6;color:#1f2937}
  .wrap{max-width:600px;margin:0 auto;background:#fff}
  .hdr{background:linear-gradient(135deg,#000 0%,#1f2937 100%);padding:40px 30px;text-align:center}
  .logo{font-size:40px;font-weight:900;color:#fff;letter-spacing:-1px}
  .content{padding:40px 30px}
  .box{background:#f0fdf4;border:2px solid #86efac;border-radius:12px;padding:24px;margin:24px 0}
  .ftr{background:#f9fafb;padding:30px;text-align:center;border-top:2px solid #e5e7eb;color:#9ca3af;font-size:13px}
</style></head>
<body><div class="wrap">
  <div class="hdr"><div class="logo">EVNT</div></div>
  <div class="content">
    <h2 style="color:#000;font-weight:900;">✅ Booking Request Submitted!</h2>
    <p>Hi ${booking.client_name || 'there'},</p>
    <p>Your booking request for <strong>${vendor.business_name}</strong> has been received. The vendor will review and respond within 24-48 hours.</p>
    <div class="box">
      <h3 style="margin:0 0 12px 0;font-weight:700;color:#15803d;">Booking Summary</h3>
      <p style="margin:4px 0"><strong>Vendor:</strong> ${vendor.business_name}</p>
      <p style="margin:4px 0"><strong>Event Type:</strong> ${booking.event_type || 'Not specified'}</p>
      <p style="margin:4px 0"><strong>Event Date:</strong> ${eventDate}</p>
      ${booking.location ? `<p style="margin:4px 0"><strong>Location:</strong> ${booking.location}</p>` : ''}
      ${booking.guest_count ? `<p style="margin:4px 0"><strong>Guests:</strong> ${booking.guest_count}</p>` : ''}
      <p style="margin:4px 0"><strong>Status:</strong> Pending Vendor Response</p>
    </div>
    <p style="font-size:14px;color:#6b7280;">You'll be notified by email and in-app as soon as the vendor responds. You can track your booking at any time from your dashboard.</p>
  </div>
  <div class="ftr">
    <p>© ${new Date().getFullYear()} EVNT. <a href="mailto:${Deno.env.get('SUPPORT_EMAIL') || 'support@joinevnt.com'}" style="color:#000;font-weight:600">${Deno.env.get('SUPPORT_EMAIL') || 'support@joinevnt.com'}</a></p>
    <p style="font-size:11px"><a href="${appUrl}/unsubscribe?email=${encodeURIComponent(booking.client_email)}" style="color:#0066cc">Unsubscribe</a> | <a href="${appUrl}/terms" style="color:#0066cc">Terms</a></p>
  </div>
</div></body></html>`
        });
      } catch (clientEmailErr) {
        console.warn('[notifyNewBooking] Client confirmation email failed (non-fatal):', clientEmailErr.message);
      }

      // In-app notification for client
      try {
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: booking.client_email,
          type: 'booking_status',
          title: '✅ Booking Request Submitted',
          message: `Your booking request for ${vendor.business_name} (${booking.event_type} on ${eventDate}) has been submitted. Awaiting vendor response.`,
          link: `/Bookings`,
          read: false
        });
      } catch (notifErr) {
        console.warn('[notifyNewBooking] Client in-app notification failed (non-fatal):', notifErr.message);
      }
    }

    return Response.json({ success: true, message: 'New booking notification sent to vendor and client' });

  } catch (error) {
    console.error('[notifyNewBooking] Error:', error);
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});