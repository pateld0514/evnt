import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Legacy notification dispatcher — called internally with _secret
// Handles new_booking, booking_confirmed, payment_received notification types

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { bookingId, notificationType, _secret } = await req.json();

    // Internal endpoint — validate shared secret
    if (_secret !== Deno.env.get('INTERNAL_SECRET')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!bookingId || !notificationType) {
      return Response.json({ error: 'Missing bookingId or notificationType' }, { status: 400 });
    }

    let bookings;
    try {
      bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
    } catch (e) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }
    const booking = bookings[0];
    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    const vendors = await base44.asServiceRole.entities.Vendor.filter({ id: booking.vendor_id });
    const vendor = vendors[0];
    if (!vendor) {
      return Response.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Get vendor user email (prefer user record over contact_email)
    const vendorUsers = await base44.asServiceRole.entities.User.filter({ vendor_id: booking.vendor_id });
    const vendorEmail = vendorUsers[0]?.email || vendor.contact_email;

    const appUrl = Deno.env.get('APP_URL') || 'https://joinevnt.com';
    const supportEmail = Deno.env.get('SUPPORT_EMAIL') || 'support@joinevnt.com';

    function wrapEmail(content) {
      return `<!DOCTYPE html><html><head><style>
        body{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#f3f4f6;color:#1f2937}
        .wrap{max-width:600px;margin:0 auto;background:#fff}
        .hdr{background:#000;padding:30px;text-align:center}
        .logo{font-size:40px;font-weight:900;color:#fff;letter-spacing:-1px}
        .content{padding:30px}
        .box{background:#f9fafb;border:2px solid #e5e7eb;border-radius:12px;padding:20px;margin:20px 0}
        .ftr{background:#f9fafb;padding:20px;text-align:center;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb}
      </style></head><body><div class="wrap">
      <div class="hdr"><div class="logo">EVNT</div></div>
      ${content}
      <div class="ftr">
        <p>© ${new Date().getFullYear()} EVNT. <a href="mailto:${supportEmail}" style="color:#000">${supportEmail}</a></p>
        <p><a href="${appUrl}/privacy" style="color:#0066cc">Privacy</a> | <a href="${appUrl}/terms" style="color:#0066cc">Terms</a></p>
      </div></div></body></html>`;
    }

    const totalAmount = booking.total_amount_charged || booking.agreed_price || 0;
    const eventDate = booking.event_date
      ? new Date(booking.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : booking.event_date;

    let subject = '';
    let recipient = '';
    let emailBody = '';

    switch (notificationType) {
      case 'new_booking':
        recipient = vendorEmail;
        subject = `🎉 New Booking Request from ${booking.client_name}`;
        emailBody = wrapEmail(`<div class="content">
          <h2>🎉 New Booking Request!</h2>
          <p>Hi ${vendor.business_name},</p>
          <p>You have a new booking request from <strong>${booking.client_name}</strong>.</p>
          <div class="box">
            <p><strong>Event Type:</strong> ${booking.event_type}</p>
            <p><strong>Date:</strong> ${eventDate}</p>
            <p><strong>Location:</strong> ${booking.location || 'Not specified'}</p>
            ${booking.budget ? `<p><strong>Budget:</strong> $${Number(booking.budget).toLocaleString()}</p>` : ''}
            ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}
          </div>
          <p style="text-align:center"><a href="${appUrl}/Bookings" style="display:inline-block;padding:14px 28px;background:#000;color:#fff;text-decoration:none;border-radius:8px;font-weight:700">View & Respond</a></p>
        </div>`);
        break;

      case 'booking_confirmed':
        recipient = booking.client_email;
        subject = `✅ Booking Confirmed with ${vendor.business_name}`;
        emailBody = wrapEmail(`<div class="content">
          <h2>✅ Booking Confirmed!</h2>
          <p>Hi ${booking.client_name || 'there'},</p>
          <p>Your booking with <strong>${vendor.business_name}</strong> has been confirmed.</p>
          <div class="box">
            <p><strong>Vendor:</strong> ${vendor.business_name}</p>
            <p><strong>Event:</strong> ${booking.event_type}</p>
            <p><strong>Date:</strong> ${eventDate}</p>
            <p><strong>Total:</strong> $${Number(totalAmount).toLocaleString()}</p>
          </div>
        </div>`);
        break;

      case 'payment_received':
        recipient = vendorEmail;
        subject = `💰 Payment Received - $${Number(totalAmount).toLocaleString()}`;
        emailBody = wrapEmail(`<div class="content">
          <h2>💰 Payment Received!</h2>
          <p>Hi ${vendor.business_name},</p>
          <p>Payment has been secured for your upcoming event with <strong>${booking.client_name}</strong>.</p>
          <div class="box">
            <p><strong>Client:</strong> ${booking.client_name}</p>
            <p><strong>Event:</strong> ${booking.event_type} · ${eventDate}</p>
            <p><strong>Your Payout:</strong> $${Number(booking.vendor_payout || totalAmount).toLocaleString()}</p>
            <p><strong>Status:</strong> Secured in escrow</p>
          </div>
          <p>Payment releases automatically after you mark the event as completed.</p>
        </div>`);
        break;

      default:
        return Response.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    if (!recipient) {
      return Response.json({ error: 'No recipient email found' }, { status: 400 });
    }

    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: recipient,
        from_name: 'EVNT Team',
        subject,
        body: emailBody
      });
    } catch (emailErr) {
      console.warn('[sendBookingNotifications] Email failed (non-fatal):', emailErr.message);
    }

    return Response.json({ success: true, message: 'Notification sent successfully' });

  } catch (error) {
    console.error('[sendBookingNotifications] Error:', error);
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});