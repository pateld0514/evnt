import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { wrapEmailContent } from './lib/emailTemplate.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== "admin") {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const to = user.email;
    const wrap = (content, preheader = '') => wrapEmailContent(content, to, preheader);

    const emailDefs = [
      {
        name: 'Booking Status: Negotiating (Client)',
        subject: '💬 Price Proposal Received from Sample Vendor',
        content: `<div class="content"><h1 class="title">💬 Price Proposal Received</h1><p class="message">Sample Vendor has sent you a pricing proposal for your Wedding.</p><div class="highlight-box"><h3>Booking Details:</h3><p><strong>Vendor:</strong> Sample Vendor</p><p><strong>Event:</strong> Wedding</p><p><strong>Date:</strong> June 15, 2026</p><p><strong>Status:</strong> Negotiating</p></div></div>`
      },
      {
        name: 'Booking Status: Negotiating (Vendor)',
        subject: '✅ Proposal Sent to Sample Client',
        content: `<div class="content"><h1 class="title">📤 Proposal Sent Successfully</h1><p class="message">Your pricing proposal has been sent to Sample Client.</p><div class="highlight-box"><h3>Booking Details:</h3><p><strong>Client:</strong> Sample Client</p><p><strong>Event:</strong> Wedding</p><p><strong>Date:</strong> June 15, 2026</p><p><strong>Status:</strong> Negotiating</p></div></div>`
      },
      {
        name: 'Booking Status: Payment Pending (Client)',
        subject: '💳 Complete Your Payment - Sample Vendor',
        content: `<div class="content"><h1 class="title">💳 Ready for Payment</h1><p class="message">Complete your payment to confirm the booking with Sample Vendor.</p><div class="highlight-box"><h3>Booking Details:</h3><p><strong>Vendor:</strong> Sample Vendor</p><p><strong>Event:</strong> Wedding</p><p><strong>Date:</strong> June 15, 2026</p><p><strong>Status:</strong> Payment Pending</p></div></div>`
      },
      {
        name: 'Booking Status: Confirmed (Client)',
        subject: '🎉 Booking Confirmed - Sample Vendor',
        content: `<div class="content"><h1 class="title">🎉 Booking Confirmed!</h1><p class="message">Your booking with Sample Vendor is confirmed for June 15, 2026.</p><div class="highlight-box"><h3>Booking Details:</h3><p><strong>Vendor:</strong> Sample Vendor</p><p><strong>Event:</strong> Wedding</p><p><strong>Date:</strong> June 15, 2026</p><p><strong>Status:</strong> Confirmed</p></div></div>`
      },
      {
        name: 'Booking Status: Confirmed (Vendor)',
        subject: '💰 New Booking Confirmed - Sample Client',
        content: `<div class="content"><h1 class="title">💰 New Confirmed Booking</h1><p class="message">Sample Client confirmed their booking for June 15, 2026. Payment is in escrow.</p><div class="highlight-box"><h3>Booking Details:</h3><p><strong>Client:</strong> Sample Client</p><p><strong>Event:</strong> Wedding</p><p><strong>Date:</strong> June 15, 2026</p><p><strong>Status:</strong> Confirmed</p></div></div>`
      },
      {
        name: 'Booking Status: In Progress (Client)',
        subject: '🎬 Your Event with Sample Vendor is Today',
        content: `<div class="content"><h1 class="title">🎬 Event Day!</h1><p class="message">Your event with Sample Vendor is happening today! Have a wonderful celebration!</p><div class="highlight-box"><h3>Booking Details:</h3><p><strong>Vendor:</strong> Sample Vendor</p><p><strong>Event:</strong> Wedding</p><p><strong>Date:</strong> Today</p><p><strong>Status:</strong> In Progress</p></div></div>`
      },
      {
        name: 'Booking Status: Completed (Client)',
        subject: '⭐ How Was Your Event with Sample Vendor?',
        content: `<div class="content"><h1 class="title">⭐ Leave a Review</h1><p class="message">Your event with Sample Vendor is complete! Please share your experience.</p><div class="highlight-box"><h3>Booking Details:</h3><p><strong>Vendor:</strong> Sample Vendor</p><p><strong>Event:</strong> Wedding</p><p><strong>Date:</strong> June 15, 2026</p><p><strong>Status:</strong> Completed</p></div></div>`
      },
      {
        name: 'Booking Status: Completed (Vendor)',
        subject: '🎊 Payment Released - $1,840.00',
        content: `<div class="content"><h1 class="title">🎊 Payment Released!</h1><p class="message">Event for Sample Client marked as complete. Payment released to your account!</p><div class="highlight-box"><h3>Booking Details:</h3><p><strong>Client:</strong> Sample Client</p><p><strong>Event:</strong> Wedding</p><p><strong>Date:</strong> June 15, 2026</p><p><strong>Status:</strong> Completed</p></div></div>`
      },
      {
        name: 'Booking Status: Cancelled (Client)',
        subject: '❌ Booking Cancelled - Sample Vendor',
        content: `<div class="content"><h1 class="title">❌ Booking Cancelled</h1><p class="message">Your booking with Sample Vendor has been cancelled. Refund of $1,860.00 processed.</p><div class="highlight-box"><h3>Booking Details:</h3><p><strong>Vendor:</strong> Sample Vendor</p><p><strong>Event:</strong> Wedding</p><p><strong>Date:</strong> June 15, 2026</p><p><strong>Status:</strong> Cancelled</p></div></div>`
      },
      {
        name: 'Booking Status: Declined (Client)',
        subject: '📋 Update on Your Booking Request',
        content: `<div class="content"><h1 class="title">📋 Booking Declined</h1><p class="message">Sample Vendor is unable to accept your booking request. Please try other vendors.</p><div class="highlight-box"><h3>Booking Details:</h3><p><strong>Vendor:</strong> Sample Vendor</p><p><strong>Event:</strong> Wedding</p><p><strong>Date:</strong> June 15, 2026</p><p><strong>Status:</strong> Declined</p></div></div>`
      },
      {
        name: 'Welcome Email: New Client',
        subject: 'Welcome to EVNT - Start Planning Your Event!',
        content: `<div class="content"><h1 style="font-size:24px;font-weight:900;color:#000000;margin:0 0 20px 0;">Welcome to EVNT, Sample Client!</h1><p style="font-size:16px;color:#4b5563;margin:0 0 20px 0;line-height:1.8;">You are all set! EVNT is the easiest way to find and book top-rated vendors for your next event.</p><div style="background:#f9fafb;border:2px solid #e5e7eb;border-radius:12px;padding:24px;margin:24px 0;"><h3 style="font-size:16px;font-weight:700;color:#1f2937;margin:0 0 12px 0;">Here is how it works:</h3><p style="margin:0 0 8px 0;color:#4b5563;"><strong>Swipe</strong> through curated vendors tailored to your event type</p><p style="margin:0 0 8px 0;color:#4b5563;"><strong>Connect</strong> and negotiate directly with vendors</p><p style="margin:0 0 8px 0;color:#4b5563;"><strong>Pay securely</strong> - funds held in escrow until your event is done</p><p style="margin:0;color:#4b5563;"><strong>Review</strong> your vendors after every event</p></div><div style="text-align:center;margin:32px 0;"><a href="https://joinevnt.com" style="display:inline-block;padding:16px 40px;background:#000000;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;font-size:18px;">Start Swiping Now</a></div></div>`
      },
      {
        name: 'Vendor Approval Email',
        subject: 'Congratulations! Your Vendor Account is Approved',
        content: `<div class="content"><h1 class="title">Congratulations!</h1><p class="message">We are thrilled to inform you that <strong>Sample Event Business</strong> has been <strong>approved</strong> to join the EVNT platform!</p><div class="highlight-box"><h3>You are Now Live!</h3><p><strong>Your vendor profile is now visible to thousands of event planners.</strong></p></div><h2>What's Next?</h2><ul><li><strong>Complete Your Profile:</strong> Add stunning photos and detailed service descriptions</li><li><strong>Set Your Pricing:</strong> Configure packages and pricing to match your services</li><li><strong>Connect Stripe:</strong> Link your bank account to receive payments seamlessly</li><li><strong>Respond Quickly:</strong> Fast responses lead to more bookings!</li></ul></div>`
      },
      {
        name: 'Vendor Rejection Email',
        subject: 'Update on Your EVNT Vendor Application',
        content: `<div class="content"><h1 class="title">Update on Your Application</h1><p class="message">Thank you for your interest in joining EVNT as a vendor for <strong>Sample Event Business</strong>.</p><p class="message">After careful review, we are unable to approve your vendor account at this time.</p><div class="banner"><h3 style="margin-top: 0;">Reason for Decision:</h3><p style="margin: 0; color: #1f2937;">Incomplete business license documentation. Please resubmit with clear, legible copies.</p></div><h2>What You Can Do</h2><ul><li><strong>Address the Concerns:</strong> Review the feedback above</li><li><strong>Reapply:</strong> Submit a new application once you have addressed the issues</li><li><strong>Contact Us:</strong> Have questions? We are happy to help</li></ul></div>`
      }
    ];

    const results = [];
    for (const def of emailDefs) {
      try {
        const body = wrap(def.content, def.name);
        await base44.asServiceRole.integrations.Core.SendEmail({
          to,
          from_name: "EVNT",
          subject: def.subject,
          body
        });
        results.push({ name: def.name, status: 'sent' });
        await new Promise(resolve => setTimeout(resolve, 400));
      } catch (err) {
        results.push({ name: def.name, status: 'failed', error: err.message });
      }
    }

    return Response.json({
      success: true,
      message: `Sent ${results.filter(r => r.status === 'sent').length} of ${emailDefs.length} test emails to ${to}`,
      results
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});