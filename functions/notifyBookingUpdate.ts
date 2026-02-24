import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    // Extract booking data from event or direct call
    const booking = payload.data || payload.booking;
    const oldStatus = payload.old_data?.status || payload.old_status;
    const newStatus = booking?.status;
    
    if (!booking || !newStatus) {
      return Response.json({ 
        error: 'booking data and status are required' 
      }, { status: 400 });
    }

    // Only send notifications on status changes
    if (oldStatus === newStatus) {
      return Response.json({ 
        success: true, 
        message: 'No status change detected' 
      });
    }

    const vendors = await base44.asServiceRole.entities.Vendor.filter({ id: booking.vendor_id });
    if (!vendors || vendors.length === 0) {
      return Response.json({ error: 'Vendor not found' }, { status: 404 });
    }
    
    const vendor = vendors[0];
    const vendorUsers = await base44.asServiceRole.entities.User.filter({ vendor_id: booking.vendor_id });
    const vendorEmail = vendorUsers.length > 0 ? vendorUsers[0].email : vendor.contact_email;

    const eventDate = new Date(booking.event_date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    // Status-specific notifications
    const notifications = {
      negotiating: {
        client: {
          title: '💬 Price Proposal Received',
          message: `${vendor.business_name} has sent you a pricing proposal for your ${booking.event_type}. Review and respond in your bookings.`,
          emailSubject: '💬 New Pricing Proposal from ' + vendor.business_name
        },
        vendor: {
          title: '📤 Proposal Sent Successfully',
          message: `Your pricing proposal has been sent to ${booking.client_name}. You'll be notified when they respond.`,
          emailSubject: '✅ Proposal Sent to ' + booking.client_name
        }
      },
      payment_pending: {
        client: {
          title: '💳 Ready for Payment',
          message: `You've accepted the proposal from ${vendor.business_name}. Complete your payment to confirm the booking.`,
          emailSubject: '💳 Complete Your Payment - ' + vendor.business_name
        },
        vendor: {
          title: '🎯 Proposal Accepted!',
          message: `${booking.client_name} accepted your proposal! Waiting for payment to be processed.`,
          emailSubject: '🎯 ' + booking.client_name + ' Accepted Your Proposal'
        }
      },
      confirmed: {
        client: {
          title: '🎉 Booking Confirmed!',
          message: `Your booking with ${vendor.business_name} is confirmed for ${eventDate}. Payment secured successfully!`,
          emailSubject: '🎉 Booking Confirmed - ' + vendor.business_name
        },
        vendor: {
          title: '💰 New Confirmed Booking',
          message: `${booking.client_name} confirmed their booking for ${eventDate}. Payment is secured in escrow.`,
          emailSubject: '💰 New Booking Confirmed - ' + booking.client_name
        }
      },
      in_progress: {
        client: {
          title: '🎬 Event Day!',
          message: `Your event with ${vendor.business_name} is happening today! Have a wonderful celebration!`,
          emailSubject: '🎬 Your Event with ' + vendor.business_name + ' is Today'
        },
        vendor: {
          title: '🎬 Event Day!',
          message: `Event for ${booking.client_name} is today. Deliver amazing service!`,
          emailSubject: '🎬 Event Today - ' + booking.client_name
        }
      },
      completed: {
        client: {
          title: '⭐ Leave a Review',
          message: `Your event with ${vendor.business_name} is complete! Please share your experience by leaving a review.`,
          emailSubject: '⭐ How Was Your Event with ' + vendor.business_name + '?'
        },
        vendor: {
          title: '🎊 Payment Released!',
          message: `Event for ${booking.client_name} marked as complete. Payment released to your account!`,
          emailSubject: '🎊 Payment Released - $' + (booking.vendor_payout || booking.agreed_price || 0).toLocaleString()
        }
      },
      cancelled: {
        client: {
          title: '❌ Booking Cancelled',
          message: `Your booking with ${vendor.business_name} has been cancelled. ${booking.refund_amount ? 'Refund of $' + booking.refund_amount.toLocaleString() + ' processed.' : ''}`,
          emailSubject: '❌ Booking Cancelled - ' + vendor.business_name
        },
        vendor: {
          title: '❌ Booking Cancelled',
          message: `${booking.client_name} cancelled their booking for ${eventDate}. ${booking.cancellation_reason || ''}`,
          emailSubject: '❌ Booking Cancelled - ' + booking.client_name
        }
      },
      declined: {
        client: {
          title: '📋 Booking Declined',
          message: `${vendor.business_name} is unable to accept your booking request. ${booking.vendor_response || 'Please try other vendors.'}`,
          emailSubject: '📋 Update on Your Booking Request'
        },
        vendor: {
          title: '📋 Booking Declined',
          message: `You declined the booking request from ${booking.client_name}.`,
          emailSubject: '📋 Booking Request Declined'
        }
      }
    };

    const statusNotif = notifications[newStatus];
    if (!statusNotif) {
      return Response.json({ 
        success: true, 
        message: 'No notification configured for this status' 
      });
    }

    // Professional email template wrapper
    // Provide client/vendor email dynamically
    const getEmailLink = (recipientEmail) => {
     return `https://evnt.com/unsubscribe?email=${encodeURIComponent(recipientEmail || 'noreply@evnt.com')}`;
    };

    const wrapEmail = (content, preheader, recipientEmail) => `
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
    .logo-icon { width: 48px; height: 48px; background: #ffffff; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 900; color: #000000; margin-bottom: 12px; }
    .logo-text { font-size: 40px; font-weight: 900; color: #ffffff; letter-spacing: -1px; }
    .content { padding: 40px 30px; }
    .title { font-size: 24px; font-weight: 900; color: #000000; margin: 0 0 20px 0; }
    .message { font-size: 16px; color: #4b5563; margin: 0 0 20px 0; line-height: 1.8; }
    .highlight-box { background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; margin: 24px 0; }
    .button { display: inline-block; padding: 16px 32px; background: #000000; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 2px solid #e5e7eb; color: #9ca3af; font-size: 13px; }
    </style>
    </head>
    <body>
    <div class="preheader">${preheader}</div>
    <div class="container">
    <div class="header">
     <div class="logo-icon">E</div>
     <div class="logo-text">EVNT</div>
    </div>
    ${content}
    <div class="footer">
     <p style="margin: 8px 0;">© ${new Date().getFullYear()} EVNT. All rights reserved.</p>
     <p style="margin: 8px 0;">Questions? Email <a href="mailto:support@evnt.com" style="color: #000000; text-decoration: none; font-weight: 600;">support@evnt.com</a> or text <a href="tel:6094423524" style="color: #000000; text-decoration: none; font-weight: 600;">609-442-3524</a></p>
     <p style="margin: 12px 0 8px 0; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 11px;">
       <a href="${getEmailLink(recipientEmail)}" style="color: #0066cc; text-decoration: none;">Unsubscribe</a> | 
       <a href="https://evnt.com/privacy" style="color: #0066cc; text-decoration: none;">Privacy Policy</a> | 
       <a href="https://evnt.com/terms" style="color: #0066cc; text-decoration: none;">Terms of Service</a>
     </p>
    </div>
    </div>
    </body>
    </html>
    `;

    // Send to client
    const clientContent = `
      <div class="content">
        <h1 class="title">${statusNotif.client.title}</h1>
        <p class="message">${statusNotif.client.message}</p>
        <div class="highlight-box">
          <h3 style="margin: 0 0 12px 0; font-weight: 700;">Booking Details:</h3>
          <p style="margin: 0;"><strong>Vendor:</strong> ${vendor.business_name}</p>
          <p style="margin: 0;"><strong>Event:</strong> ${booking.event_type}</p>
          <p style="margin: 0;"><strong>Date:</strong> ${eventDate}</p>
          <p style="margin: 0;"><strong>Status:</strong> <span style="text-transform: capitalize;">${newStatus.replace(/_/g, ' ')}</span></p>
        </div>
      </div>
    `;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: booking.client_email,
      from_name: "EVNT",
      subject: statusNotif.client.emailSubject,
      body: wrapEmail(clientContent, statusNotif.client.message, booking.client_email)
    });

    await base44.asServiceRole.entities.Notification.create({
      recipient_email: booking.client_email,
      type: "booking_status",
      title: statusNotif.client.title,
      message: statusNotif.client.message,
      link: `/Bookings?id=${booking.id}`,
      read: false
    });

    // Send to vendor
    const vendorContent = `
      <div class="content">
        <h1 class="title">${statusNotif.vendor.title}</h1>
        <p class="message">${statusNotif.vendor.message}</p>
        <div class="highlight-box">
          <h3 style="margin: 0 0 12px 0; font-weight: 700;">Booking Details:</h3>
          <p style="margin: 0;"><strong>Client:</strong> ${booking.client_name}</p>
          <p style="margin: 0;"><strong>Event:</strong> ${booking.event_type}</p>
          <p style="margin: 0;"><strong>Date:</strong> ${eventDate}</p>
          <p style="margin: 0;"><strong>Status:</strong> <span style="text-transform: capitalize;">${newStatus.replace(/_/g, ' ')}</span></p>
        </div>
      </div>
    `;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: vendorEmail,
      from_name: "EVNT",
      subject: statusNotif.vendor.emailSubject,
      body: wrapEmail(vendorContent, statusNotif.vendor.message, vendorEmail)
    });

    await base44.asServiceRole.entities.Notification.create({
      recipient_email: vendorEmail,
      type: "booking_status",
      title: statusNotif.vendor.title,
      message: statusNotif.vendor.message,
      link: `/Bookings?id=${booking.id}`,
      read: false
    });

    return Response.json({ 
      success: true,
      message: 'Notifications sent to client and vendor' 
    });

  } catch (error) {
    console.error('Notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});