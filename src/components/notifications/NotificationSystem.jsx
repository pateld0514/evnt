import { base44 } from "@/api/base44Client";

export async function sendNotification({ recipientEmail, type, title, message, link }) {
  try {
    const users = await base44.entities.User.filter({ email: recipientEmail });
    if (!users || users.length === 0) return;

    const user = users[0];
    
    // Create notification record
    await base44.entities.Notification.create({
      recipient_email: recipientEmail,
      type,
      title,
      message,
      link,
      sent_via: "email",
      read: false
    });

    // Send via email only
    await base44.integrations.Core.SendEmail({
      to: recipientEmail,
      from_name: "EVNT",
      subject: `EVNT - ${title}`,
      body: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 500px; margin: 0 auto; }
    .header { background: #000; color: #fff; padding: 20px; text-align: center; }
    .logo { width: 40px; height: 40px; background: #fff; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 10px; }
    .logo-text { color: #000; font-size: 24px; font-weight: 900; }
    .brand { font-size: 28px; font-weight: 900; letter-spacing: -0.5px; }
    .content { padding: 30px 20px; background: #fff; }
    .title { font-size: 20px; font-weight: 900; margin: 0 0 15px 0; color: #000; }
    .message { font-size: 16px; color: #333; margin: 0 0 20px 0; line-height: 1.6; }
    .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo"><span class="logo-text">E</span></div>
      <div class="brand">EVNT</div>
    </div>
    <div class="content">
      <p class="title">${title}</p>
      <p class="message">${message}</p>
    </div>
    <div class="footer">
      <p>EVNT Management</p>
    </div>
  </div>
</body>
</html>
      `
    });

  } catch (error) {
    console.error("Failed to send notification:", error);
  }
}

export async function notifyBookingStatusChange(booking, oldStatus, newStatus) {
  const statusMessages = {
    negotiating: {
      client: {
        title: "🤝 Price Proposal Received",
        message: `${booking.vendor_name} has sent you a pricing proposal for your ${booking.event_type}. Review and accept to proceed to payment.`
      },
      vendor: {
        title: "📋 Proposal Sent",
        message: `Your pricing proposal has been sent to ${booking.client_name}. You'll be notified when they respond.`
      }
    },
    payment_pending: {
      client: {
        title: "💳 Payment Required",
        message: `Your booking with ${booking.vendor_name} is confirmed. Please complete payment to finalize.`
      },
      vendor: {
        title: "✅ Proposal Accepted",
        message: `${booking.client_name} accepted your proposal! Waiting for payment processing.`
      }
    },
    confirmed: {
      client: {
        title: "🎉 Booking Confirmed!",
        message: `Your booking with ${booking.vendor_name} is confirmed for ${new Date(booking.event_date).toLocaleDateString()}. Payment processed successfully.`
      },
      vendor: {
        title: "💰 New Booking Confirmed",
        message: `${booking.client_name} has confirmed their booking for ${new Date(booking.event_date).toLocaleDateString()}. Payment secured in escrow.`
      }
    },
    completed: {
      client: {
        title: "⭐ Please Review Your Experience",
        message: `Your event with ${booking.vendor_name} is complete! Please share your experience by leaving a review.`
      },
      vendor: {
        title: "🎊 Event Completed - Payment Released",
        message: `Event for ${booking.client_name} is marked as complete. Payment will be released to your account within 24 hours.`
      }
    },
    cancelled: {
      client: {
        title: "❌ Booking Cancelled",
        message: `Your booking with ${booking.vendor_name} has been cancelled. Refund will be processed according to the cancellation policy.`
      },
      vendor: {
        title: "❌ Booking Cancelled",
        message: `${booking.client_name} has cancelled their booking for ${new Date(booking.event_date).toLocaleDateString()}.`
      }
    }
  };

  if (statusMessages[newStatus]) {
    // Notify client
    await sendNotification({
      recipientEmail: booking.client_email,
      type: "booking_status",
      ...statusMessages[newStatus].client,
      link: `/bookings?id=${booking.id}`
    });

    // Get vendor email
    const vendors = await base44.entities.Vendor.filter({ id: booking.vendor_id });
    if (vendors && vendors.length > 0) {
      const vendorUsers = await base44.entities.User.filter({ vendor_id: booking.vendor_id });
      if (vendorUsers && vendorUsers.length > 0) {
        await sendNotification({
          recipientEmail: vendorUsers[0].email,
          type: "booking_status",
          ...statusMessages[newStatus].vendor,
          link: `/bookings?id=${booking.id}`
        });
      }
    }
  }
}

export async function notifyNewMessage(message, conversationId) {
  const { recipient_email, sender_name, vendor_name, created_date } = message;
  const messageDate = created_date ? new Date(created_date) : new Date();
  const timeStr = messageDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const dateStr = messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  
  await sendNotification({
    recipientEmail: recipient_email,
    type: "new_message",
    title: `Unread Message from ${sender_name || vendor_name}`,
    message: `You have an unread message from ${sender_name || vendor_name} sent on ${dateStr} at ${timeStr}.`,
    link: `/messages?conversation=${conversationId}`
  });
}

export async function notifyVendorResponse(booking) {
  await sendNotification({
    recipientEmail: booking.client_email,
    type: "vendor_response",
    title: "📝 Vendor Responded",
    message: `${booking.vendor_name} has responded to your booking request`,
    link: `/bookings?id=${booking.id}`
  });
}