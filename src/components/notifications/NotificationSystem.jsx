import { base44 } from "@/api/base44Client";

export async function sendNotification({ recipientEmail, type, title, message, link }) {
  try {
    const user = await base44.entities.User.filter({ email: recipientEmail });
    if (!user || user.length === 0) return;

    const notificationPref = user[0].notification_preference || "email";
    
    // Create notification record
    await base44.entities.Notification.create({
      recipient_email: recipientEmail,
      type,
      title,
      message,
      link,
      sent_via: notificationPref,
      read: false
    });

    // Send via email
    if (notificationPref === "email" || notificationPref === "both") {
      await base44.integrations.Core.SendEmail({
        to: recipientEmail,
        from_name: "EVNT Platform",
        subject: title,
        body: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #000; color: #fff; padding: 30px; text-center; border-radius: 8px 8px 0 0; }
    .logo { font-size: 36px; font-weight: 900; }
    .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">EVNT</div>
    </div>
    <div class="content">
      <h2>${title}</h2>
      <p>${message}</p>
      ${link ? `<a href="${link}" class="button">View Details</a>` : ''}
    </div>
    <div class="footer">
      <p>EVNT - Modern Event Planning Platform</p>
      <p>You're receiving this because of your notification preferences</p>
    </div>
  </div>
</body>
</html>
        `
      });
    }

    // SMS would be implemented here if sms or both
    // For now, we'll just log it
    if (notificationPref === "sms" || notificationPref === "both") {
      console.log(`SMS notification would be sent to user's phone`);
    }

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
  const { recipient_email, sender_name, vendor_name } = message;
  
  await sendNotification({
    recipientEmail: recipient_email,
    type: "new_message",
    title: "💬 New Message Received",
    message: `You have a new message from ${sender_name || vendor_name}`,
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