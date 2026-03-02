import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Inline email wrapper to avoid import caching issues
const wrapEmailContent = (content, recipientEmail, preheader = '') => `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;line-height:1.6;color:#1f2937;background-color:#f3f4f6;}.email-container{max-width:600px;margin:0 auto;background-color:#ffffff;}.header{background:linear-gradient(135deg,#000000 0%,#1f2937 100%);padding:40px 30px;text-align:center;}.logo-text{font-size:40px;font-weight:900;color:#ffffff;letter-spacing:-1px;}.content{padding:40px 30px;}.title{font-size:28px;font-weight:900;color:#000000;margin:0 0 20px 0;}.message{font-size:16px;color:#4b5563;margin:0 0 20px 0;line-height:1.8;}.highlight-box{background:#f0fdf4;border:2px solid #86efac;border-radius:12px;padding:24px;margin:24px 0;}.banner{background:linear-gradient(135deg,#f3f4f6 0%,#e5e7eb 100%);border-left:4px solid #000000;padding:20px;margin:30px 0;border-radius:8px;}.footer{background:#f9fafb;padding:30px;text-align:center;border-top:2px solid #e5e7eb;color:#9ca3af;font-size:13px;}h2{font-size:20px;font-weight:700;color:#1f2937;margin:24px 0 12px 0;}h3{font-size:16px;font-weight:700;color:#1f2937;margin:0 0 12px 0;}ul{padding-left:20px;color:#4b5563;}li{margin-bottom:8px;}p{margin:0 0 12px 0;}</style></head><body><div class="email-container"><div class="header"><div class="logo-text">EVNT</div></div>${content}<div class="footer"><p style="margin:8px 0;">© ${new Date().getFullYear()} EVNT. All rights reserved.</p><p style="margin:8px 0;">Questions? Email <a href="mailto:support@evnt.com" style="color:#000000;font-weight:600;">support@evnt.com</a></p><p style="margin:12px 0 8px 0;padding-top:12px;border-top:1px solid #e5e7eb;font-size:11px;"><a href="https://evnt.com/unsubscribe?email=${encodeURIComponent(recipientEmail)}" style="color:#0066cc;text-decoration:none;">Unsubscribe</a> | <a href="https://evnt.com/privacy" style="color:#0066cc;text-decoration:none;">Privacy Policy</a> | <a href="https://evnt.com/terms" style="color:#0066cc;text-decoration:none;">Terms of Service</a></p></div></div></body></html>`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.email !== "pateld0514@gmail.com") {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const to = user.email;
    const wrap = (content, preheader = '') => wrapEmailContent(content, to, preheader);

    // Build emails array - 13 total
    const emailDefs = [
      {
        name: 'Booking Status: Negotiating (Client)',
        subject: '💬 Price Proposal Received from Sample Vendor',
        preheader: '💬 Price Proposal Received',
        content: `<div class="content"><h1 class="title">💬 Price Proposal Received</h1><p class="message">Sample Vendor has sent you a pricing proposal for your Wedding. Review and respond in your bookings.</p><div class="highlight-box"><h3>Booking Details:</h3><p><strong>Vendor:</strong> Sample Vendor</p><p><strong>Event:</strong> Wedding</p><p><strong>Date:</strong> June 15, 2026</p><p><strong>Status:</strong> Negotiating</p></div></div>`
      },
      {
        name: 'Booking Status: Negotiating (Vendor)',
        subject: '✅ Proposal Sent to Sample Client',
        preheader: '📤 Proposal Sent Successfully',
        content: `<div class="content"><h1 class="title">📤 Proposal Sent Successfully</h1><p class="message">Your pricing proposal has been sent to Sample Client. You will be notified when they respond.</p><div class="highlight-box"><h3>Booking Details:</h3><p><strong>Client:</strong> Sample Client</p><p><strong>Event:</strong> Wedding</p><p><strong>Date:</strong> June 15, 2026</p><p><strong>Status:</strong> Negotiating</p></div></div>`
      },
      {
        name: 'Booking Status: Payment Pending (Client)',
        subject: '💳 Complete Your Payment - Sample Vendor',
        preheader: '💳 Ready for Payment',
        content: `<div class="content"><h1 class="title">💳 Ready for Payment</h1><p class="message">You have accepted the proposal from Sample Vendor. Complete your payment to confirm the booking.</p><div class="highlight-box"><h3>Booking Details:</h3><p><strong>Vendor:</strong> Sample Vendor</p><p><strong>Event:</strong> Wedding</p><p><strong>Date:</strong> June 15, 2026</p><p><strong>Status:</strong> Payment Pending</p></div></div>`
      },
      {
        name: 'Booking Status: Confirmed (Client)',
        subject: '🎉 Booking Confirmed - Sample Vendor',
        preheader: '🎉 Booking Confirmed!',
        content: `<div class="content"><h1 class="title">🎉 Booking Confirmed!</h1><p class="message">Your booking with Sample Vendor is confirmed for June 15, 2026. Payment secured successfully!</p><div class="highlight-box"><h3>Booking Details:</h3><p><strong>Vendor:</strong> Sample Vendor</p><p><strong>Event:</strong> Wedding</p><p><strong>Date:</strong> June 15, 2026</p><p><strong>Status:</strong> Confirmed</p></div></div>`
      },
      {
        name: 'Booking Status: Confirmed (Vendor)',
        subject: '💰 New Booking Confirmed - Sample Client',
        preheader: '💰 New Booking Confirmed',
        content: `<div class="content"><h1 class="title">💰 New Confirmed Booking</h1><p class="message">Sample Client confirmed their booking for June 15, 2026. Payment is secured in escrow.</p><div class="highlight-box"><h3>Booking Details:</h3><p><strong>Client:</strong> Sample Client</p><p><strong>Event:</strong> Wedding</p><p><strong>Date:</strong> June 15, 2026</p><p><strong>Status:</strong> Confirmed</p></div></div>`
      },
      {
        name: 'Booking Status: In Progress (Client)',
        subject: '🎬 Your Event with Sample Vendor is Today',
        preheader: '🎬 Event Day!',
        content: `<div class="content"><h1 class="title">🎬 Event Day!</h1><p class="message">Your event with Sample Vendor is happening today! Have a wonderful celebration!</p><div class="highlight-box"><h3>Booking Details:</h3><p><strong>Vendor:</strong> Sample Vendor</p><p><strong>Event:</strong> Wedding</p><p><strong>Date:</strong> Today</p><p><strong>Status:</strong> In Progress</p></div></div>`
      },
      {
        name: 'Booking Status: Completed (Client)',
        subject: '⭐ How Was Your Event with Sample Vendor?',
        preheader: '⭐ Leave a Review',
        content: `<div class="content"><h1 class="title">⭐ Leave a Review</h1><p class="message">Your event with Sample Vendor is complete! Please share your experience by leaving a review.</p><div class="highlight-box"><h3>Booking Details:</h3><p><strong>Vendor:</strong> Sample Vendor</p><p><strong>Event:</strong> Wedding</p><p><strong>Date:</strong> June 15, 2026</p><p><strong>Status:</strong> Completed</p></div></div>`
      },
      {
        name: 'Booking Status: Completed (Vendor)',
        subject: '🎊 Payment Released - $1,840.00',
        preheader: '🎊 Payment Released',
        content: `<div class="content"><h1 class="title">🎊 Payment Released!</h1><p class="message">Event for Sample Client marked as complete. Payment released to your account!</p><div class="highlight-box"><h3>Booking Details:</h3><p><strong>Client:</strong> Sample Client</p><p><strong>Event:</strong> Wedding</p><p><strong>Date:</strong> June 15, 2026</p><p><strong>Status:</strong> Completed</p></div></div>`
      },
      {
        name: 'Booking Status: Cancelled (Client)',
        subject: '❌ Booking Cancelled - Sample Vendor',
        preheader: '❌ Booking Cancelled',
        content: `<div class="content"><h1 class="title">❌ Booking Cancelled</h1><p class="message">Your booking with Sample Vendor has been cancelled. Refund of $1,860.00 processed.</p><div class="highlight-box"><h3>Booking Details:</h3><p><strong>Vendor:</strong> Sample Vendor</p><p><strong>Event:</strong> Wedding</p><p><strong>Date:</strong> June 15, 2026</p><p><strong>Status:</strong> Cancelled</p></div></div>`
      },
      {
        name: 'Booking Status: Declined (Client)',
        subject: '📋 Update on Your Booking Request',
        preheader: '📋 Booking Declined',
        content: `<div class="content"><h1 class="title">📋 Booking Declined</h1><p class="message">Sample Vendor is unable to accept your booking request. Please try other vendors.</p><div class="highlight-box"><h3>Booking Details:</h3><p><strong>Vendor:</strong> Sample Vendor</p><p><strong>Event:</strong> Wedding</p><p><strong>Date:</strong> June 15, 2026</p><p><strong>Status:</strong> Declined</p></div></div>`
      },
      {
        name: 'Welcome Email: New Client',
        subject: 'Welcome to EVNT - Start Swiping!',
        preheader: 'Welcome to EVNT',
        content: `<div class="content"><h1 style="font-size:24px;font-weight:900;color:#000000;margin:0 0 20px 0;">Welcome to EVNT, Sample Client!</h1><p style="font-size:16px;color:#4b5563;margin:0 0 20px 0;line-height:1.8;">You are all set! EVNT is the easiest way to find and book top-rated vendors for your next event.</p><div style="background:#f9fafb;border:2px solid #e5e7eb;border-radius:12px;padding:24px;margin:24px 0;"><h3 style="font-size:16px;font-weight:700;color:#1f2937;margin:0 0 12px 0;">Here is how it works:</h3><p style="margin:0 0 8px 0;color:#4b5563;"><strong>Swipe</strong> through curated vendors tailored to your event type</p><p style="margin:0 0 8px 0;color:#4b5563;"><strong>Connect</strong> and negotiate directly with vendors</p><p style="margin:0 0 8px 0;color:#4b5563;"><strong>Pay securely</strong> - funds held in escrow until your event is done</p><p style="margin:0;color:#4b5563;"><strong>Review</strong> your vendors after every event</p></div><div style="text-align:center;margin:32px 0;"><a href="https://joinevnt.com" style="display:inline-block;padding:16px 40px;background:#000000;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;font-size:18px;">Start Swiping Now</a></div></div>`
      },
      {
        name: 'Vendor Approval Email',
        subject: 'Congratulations! Your Vendor Account is Approved',
        preheader: 'Your EVNT vendor account has been approved!',
        content: `<div class="content"><h1 class="title">Congratulations!</h1><p class="message">We are thrilled to inform you that <strong>Sample Event Business</strong> has been <strong>approved</strong> to join the EVNT platform!</p><div class="highlight-box"><h3>You are Now Live!</h3><p><strong>Your vendor profile is now visible to thousands of event planners.</strong></p></div><h2>What's Next?</h2><ul><li><strong>Complete Your Profile:</strong> Add stunning photos and detailed service descriptions</li><li><strong>Set Your Pricing:</strong> Configure packages and pricing to match your services</li><li><strong>Connect Stripe:</strong> Link your bank account to receive payments seamlessly</li><li><strong>Respond Quickly:</strong> Fast responses lead to more bookings!</li></ul></div>`
      },
      {
        name: 'Vendor Rejection Email',
        subject: 'Update on Your EVNT Vendor Application',
        preheader: 'Update on your EVNT vendor application',
        content: `<div class="content"><h1 class="title">Update on Your Application</h1><p class="message">Thank you for your interest in joining EVNT as a vendor for <strong>Sample Event Business</strong>.</p><p class="message">After careful review of your application, we are unable to approve your vendor account at this time.</p><div class="banner"><h3 style="margin-top: 0;">Reason for Decision:</h3><p style="margin: 0; color: #1f2937;">Incomplete business license documentation. Please resubmit with clear, legible copies of your license and insurance verification.</p></div><h2>What You Can Do</h2><ul><li><strong>Address the Concerns:</strong> Review the feedback above and make necessary updates</li><li><strong>Reapply:</strong> You are welcome to submit a new application once you have addressed the issues</li><li><strong>Contact Us:</strong> Have questions? We are happy to provide additional guidance</li></ul></div>`
      }
    ];

    console.log(`[INFO] Total emails to send: ${emailDefs.length}`);

    // Send all emails
    const results = [];
    for (const def of emailDefs) {
      try {
        const body = wrap(def.content, def.preheader);
        await base44.asServiceRole.integrations.Core.SendEmail({
          to,
          from_name: "EVNT",
          subject: def.subject,
          body
        });
        results.push({ name: def.name, status: 'sent' });
        console.log(`[INFO] Sent: ${def.name}`);
        await new Promise(resolve => setTimeout(resolve, 800));
      } catch (err) {
        console.error(`[ERROR] Failed: ${def.name} - ${err.message}`);
        results.push({ name: def.name, status: 'failed', error: err.message });
      }
    }

    return Response.json({
      success: true,
      message: `Sent ${results.filter(r => r.status === 'sent').length} of ${emailDefs.length} test emails to ${to}`,
      results
    });

  } catch (error) {
    console.error('Test email error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});