// Professional email templates with EVNT branding

export const EmailTemplate = {
  // Base template wrapper
  wrap: (content, preheader = "") => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>EVNT</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: #f3f4f6;
    }
    .preheader {
      display: none;
      max-height: 0;
      overflow: hidden;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #000000 0%, #1f2937 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .logo {
      display: block;
      text-align: center;
      margin: 0 auto 16px;
    }
    .logo > * {
      display: inline-block;
      vertical-align: middle;
      margin: 0 6px;
    }
    .logo-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background: #ffffff;
      border-radius: 12px;
      font-size: 32px;
      font-weight: 900;
      color: #000000;
      line-height: 1;
      text-align: center;
    }
    .logo-text {
      font-size: 40px;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: -1px;
    }
    .tagline {
      color: #9ca3af;
      font-size: 14px;
      margin: 0;
      font-weight: 500;
    }
    .content {
      padding: 40px 30px;
      background-color: #ffffff;
    }
    .banner {
      background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
      border-left: 4px solid #000000;
      padding: 20px;
      margin: 30px 0;
      border-radius: 8px;
    }
    .highlight-box {
      background: #f9fafb;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
    }
    .button {
      display: inline-block;
      padding: 16px 32px;
      background: #000000;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 700;
      font-size: 16px;
      margin: 20px 0;
      transition: background 0.3s;
    }
    .button:hover {
      background: #1f2937;
    }
    .button-outline {
      display: inline-block;
      padding: 16px 32px;
      background: transparent;
      color: #000000 !important;
      text-decoration: none;
      border: 2px solid #000000;
      border-radius: 8px;
      font-weight: 700;
      font-size: 16px;
      margin: 20px 0;
    }
    .footer {
      background: #f9fafb;
      padding: 30px;
      text-align: center;
      border-top: 2px solid #e5e7eb;
    }
    .footer-links {
      margin: 20px 0;
    }
    .footer-link {
      color: #6b7280;
      text-decoration: none;
      margin: 0 12px;
      font-size: 14px;
    }
    .footer-text {
      color: #9ca3af;
      font-size: 13px;
      margin: 8px 0;
    }
    .divider {
      height: 2px;
      background: #e5e7eb;
      margin: 30px 0;
    }
    h1 {
      font-size: 28px;
      font-weight: 900;
      color: #000000;
      margin: 0 0 16px 0;
      line-height: 1.2;
    }
    h2 {
      font-size: 22px;
      font-weight: 700;
      color: #000000;
      margin: 24px 0 12px 0;
    }
    h3 {
      font-size: 18px;
      font-weight: 700;
      color: #1f2937;
      margin: 20px 0 10px 0;
    }
    p {
      margin: 0 0 16px 0;
      color: #4b5563;
      font-size: 15px;
    }
    ul {
      margin: 16px 0;
      padding-left: 24px;
    }
    li {
      margin: 8px 0;
      color: #4b5563;
    }
    strong {
      color: #000000;
      font-weight: 700;
    }
    .emoji {
      font-size: 24px;
      margin-right: 8px;
    }
    @media only screen and (max-width: 600px) {
      .content, .header, .footer {
        padding: 24px 20px !important;
      }
      h1 {
        font-size: 24px !important;
      }
      .button, .button-outline {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box;
      }
    }
  </style>
</head>
<body>
  <div class="preheader">${preheader}</div>
  <div class="email-container">
    <div class="header">
      <div class="logo">
        <div class="logo-icon">E</div>
        <div class="logo-text">EVNT</div>
      </div>
      <p class="tagline">Event Planning Made Simple</p>
    </div>
    ${content}
    <div class="footer">
      <div class="logo" style="margin: 0 auto 20px; display: block; text-align: center;">
        <div class="logo-icon" style="display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; font-size: 20px; line-height: 1;">E</div>
        <div class="logo-text" style="display: inline-block; font-size: 24px; color: #000000; vertical-align: middle;">EVNT</div>
      </div>
      <div class="footer-links">
        <a href="#" class="footer-link">About</a>
        <a href="#" class="footer-link">Help Center</a>
        <a href="#" class="footer-link">Contact</a>
      </div>
      <p class="footer-text">© ${new Date().getFullYear()} EVNT. All rights reserved.</p>
      <p class="footer-text">Making event planning simple and delightful.</p>
      <p class="footer-text" style="margin-top: 20px;">
        Questions? Email us at <a href="mailto:info@joinevnt.com" style="color: #000000;">info@joinevnt.com</a><br/>
        or text us at <a href="tel:6094423524" style="color: #000000;">609-442-3524</a>
      </p>
    </div>
  </div>
</body>
</html>
  `,

  // Vendor Approval Email
  vendorApproval: (vendorName, businessName) => EmailTemplate.wrap(`
    <div class="content">
      <h1><span class="emoji">🎉</span> Congratulations!</h1>
      <p>Hi ${vendorName},</p>
      <p>We're thrilled to inform you that <strong>${businessName}</strong> has been <strong>approved</strong> to join the EVNT platform!</p>
      
      <div class="highlight-box">
        <h3>🚀 You're Now Live!</h3>
        <p><strong>Your vendor profile is now visible to thousands of event planners.</strong></p>
      </div>

      <h2>What's Next?</h2>
      <ul>
        <li><strong>Complete Your Profile:</strong> Add stunning photos of your work and detailed service descriptions</li>
        <li><strong>Set Your Pricing:</strong> Configure packages and pricing to match your services</li>
        <li><strong>Connect Stripe:</strong> Link your bank account to receive payments seamlessly</li>
        <li><strong>Respond Quickly:</strong> Fast responses lead to more bookings!</li>
      </ul>

      <a href="#" class="button">Complete Your Profile</a>

      <div class="banner">
        <p style="margin: 0;"><strong>💡 Pro Tip:</strong> Vendors with complete profiles and portfolio photos get 3x more bookings!</p>
      </div>

      <h2>How EVNT Works</h2>
      <p><strong>1. Get Discovered:</strong> Clients swipe through vendors and save their favorites<br/>
      <strong>2. Receive Bookings:</strong> Get notified instantly when clients request your services<br/>
      <strong>3. Negotiate & Confirm:</strong> Discuss details and finalize pricing<br/>
      <strong>4. Get Paid:</strong> Secure payment through Stripe, released after the event</p>

      <div class="divider"></div>

      <p><strong>Welcome to the EVNT family!</strong> We're excited to help you grow your business and connect with amazing clients.</p>
      <p>If you have any questions, our team is here to help.</p>
    </div>
  `, `Your EVNT vendor account has been approved! Start receiving bookings today.`),

  // Vendor Rejection Email
  vendorRejection: (vendorName, businessName, reason) => EmailTemplate.wrap(`
    <div class="content">
      <h1>Update on Your Application</h1>
      <p>Hi ${vendorName},</p>
      <p>Thank you for your interest in joining EVNT as a vendor for <strong>${businessName}</strong>.</p>
      
      <p>After careful review of your application, we're unable to approve your vendor account at this time.</p>

      <div class="banner">
        <h3 style="margin-top: 0;">Reason for Decision:</h3>
        <p style="margin: 0; color: #1f2937;">${reason}</p>
      </div>

      <h2>What You Can Do</h2>
      <ul>
        <li><strong>Address the Concerns:</strong> Review the feedback above and make necessary updates</li>
        <li><strong>Reapply:</strong> You're welcome to submit a new application once you've addressed the issues</li>
        <li><strong>Contact Us:</strong> Have questions? We're happy to provide additional guidance</li>
      </ul>

      <a href="mailto:support@evnt.com" class="button-outline">Contact Support</a>

      <div class="divider"></div>

      <p>We appreciate your interest in EVNT and wish you the best in your business endeavors.</p>
    </div>
  `, `Update on your EVNT vendor application`),

  // New Booking Request (to Vendor)
  newBookingRequest: (vendorName, clientName, eventType, eventDate, location, budget, message) => EmailTemplate.wrap(`
    <div class="content">
      <h1><span class="emoji">🎉</span> New Booking Request!</h1>
      <p>Hi ${vendorName},</p>
      <p>Great news! You have a new booking request from <strong>${clientName}</strong>.</p>

      <div class="highlight-box">
        <h3>Event Details</h3>
        <p><strong>Event Type:</strong> ${eventType}<br/>
        <strong>Date:</strong> ${eventDate}<br/>
        <strong>Location:</strong> ${location}<br/>
        <strong>Budget:</strong> $${budget.toLocaleString()}</p>
        
        ${message ? `
        <div class="divider"></div>
        <h3>Client's Message:</h3>
        <p style="font-style: italic; color: #4b5563;">"${message}"</p>
        ` : ''}
      </div>

      <a href="#" class="button">View Booking Request</a>

      <div class="banner">
        <p style="margin: 0;"><strong>⚡ Quick Response Tip:</strong> Vendors who respond within 2 hours are 5x more likely to book!</p>
      </div>

      <h2>Next Steps</h2>
      <ul>
        <li>Review the event details and client requirements</li>
        <li>Respond with your availability and any questions</li>
        <li>Provide a detailed quote if needed</li>
        <li>Once agreed, the client will proceed with payment</li>
      </ul>
    </div>
  `, `New booking request from ${clientName} for ${eventType}`),

  // Booking Confirmation (to Client)
  bookingConfirmation: (clientName, vendorName, eventType, eventDate, location, guestCount, totalAmount) => EmailTemplate.wrap(`
    <div class="content">
      <h1><span class="emoji">✅</span> Booking Confirmed!</h1>
      <p>Hi ${clientName},</p>
      <p>Excellent news! Your booking with <strong>${vendorName}</strong> has been confirmed.</p>

      <div class="highlight-box">
        <h3>Booking Summary</h3>
        <p><strong>Vendor:</strong> ${vendorName}<br/>
        <strong>Event Type:</strong> ${eventType}<br/>
        <strong>Date:</strong> ${eventDate}<br/>
        <strong>Location:</strong> ${location}<br/>
        <strong>Guest Count:</strong> ${guestCount}<br/>
        <strong>Total Amount:</strong> $${totalAmount.toLocaleString()}</p>
      </div>

      <a href="#" class="button">View Booking Details</a>

      <h2>What Happens Next?</h2>
      <ul>
        <li><strong>Payment Secured:</strong> Your payment is held securely by EVNT</li>
        <li><strong>Stay Connected:</strong> Message your vendor directly through EVNT</li>
        <li><strong>Event Day:</strong> Your vendor will provide their services as agreed</li>
        <li><strong>Payment Release:</strong> Funds are released to the vendor after successful completion</li>
      </ul>

      <div class="banner">
        <p style="margin: 0;"><strong>📱 Keep in Touch:</strong> Use EVNT's messaging to coordinate all the details with your vendor!</p>
      </div>

      <div class="divider"></div>

      <p>We're here to make your event amazing! If you need any assistance, just reach out.</p>
    </div>
  `, `Your booking with ${vendorName} is confirmed!`),

  // Payment Received (to Vendor)
  paymentReceived: (vendorName, clientName, amount, eventDate) => EmailTemplate.wrap(`
    <div class="content">
      <h1><span class="emoji">💰</span> Payment Received!</h1>
      <p>Hi ${vendorName},</p>
      <p>Great news! Payment has been secured for your upcoming event with <strong>${clientName}</strong>.</p>

      <div class="highlight-box">
        <h3>Payment Details</h3>
        <p><strong>Amount:</strong> $${amount.toLocaleString()}<br/>
        <strong>Client:</strong> ${clientName}<br/>
        <strong>Event Date:</strong> ${eventDate}<br/>
        <strong>Status:</strong> <span style="color: #059669; font-weight: 700;">Secured</span></p>
      </div>

      <h2>Payment Timeline</h2>
      <ul>
        <li><strong>Now:</strong> Payment is held securely by EVNT</li>
        <li><strong>After Event:</strong> Funds are automatically released to your account</li>
        <li><strong>Processing:</strong> Typically takes 2-3 business days to reach your bank</li>
      </ul>

      <div class="banner">
        <p style="margin: 0;"><strong>🔒 Secure & Protected:</strong> EVNT holds payment until you successfully complete the event.</p>
      </div>

      <a href="#" class="button">View Booking Details</a>

      <div class="divider"></div>

      <p>Focus on delivering an amazing experience - we've got the payment covered!</p>
    </div>
  `, `Payment of $${amount.toLocaleString()} secured for your upcoming event`),

  // New Message Notification
  newMessage: (recipientName, senderName, messagePreview) => EmailTemplate.wrap(`
    <div class="content">
      <h1><span class="emoji">💬</span> New Message</h1>
      <p>Hi ${recipientName},</p>
      <p>You have a new message from <strong>${senderName}</strong> on EVNT.</p>

      <div class="highlight-box">
        <h3>Message Preview</h3>
        <p style="font-style: italic; color: #4b5563;">"${messagePreview.substring(0, 150)}${messagePreview.length > 150 ? '...' : ''}"</p>
      </div>

      <a href="#" class="button">Read & Reply</a>

      <div class="banner">
        <p style="margin: 0;"><strong>⚡ Quick replies lead to better results!</strong> Respond promptly to keep the conversation flowing.</p>
      </div>
    </div>
  `, `New message from ${senderName}`),

  // Event Completion Request
  eventCompletion: (clientName, vendorName, eventType, eventDate) => EmailTemplate.wrap(`
    <div class="content">
      <h1><span class="emoji">🎊</span> How Was Your Event?</h1>
      <p>Hi ${clientName},</p>
      <p>We hope your <strong>${eventType}</strong> on ${eventDate} was absolutely amazing!</p>

      <div class="highlight-box">
        <h3>Event Summary</h3>
        <p><strong>Vendor:</strong> ${vendorName}<br/>
        <strong>Event Type:</strong> ${eventType}<br/>
        <strong>Date:</strong> ${eventDate}</p>
      </div>

      <h2>Share Your Experience</h2>
      <p>Your feedback helps other event planners make informed decisions and helps vendors improve their services.</p>

      <a href="#" class="button">Leave a Review</a>

      <div class="banner">
        <p style="margin: 0;"><strong>⭐ Reviews Matter:</strong> Your honest feedback helps build a better community!</p>
      </div>

      <h2>Payment Processed</h2>
      <p>The payment for this event has been released to the vendor. Thank you for using EVNT!</p>

      <div class="divider"></div>

      <p>Planning another event? We'd love to help you again!</p>
      <a href="#" class="button-outline">Start Planning</a>
    </div>
  `, `How was your ${eventType} with ${vendorName}?`),
};