import React from "react";
import { Button } from "@/components/ui/button";

export default function EmailPreview() {
  const bookingConfirmationEmail = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background-color: #000000; padding: 40px 20px; text-align: center; }
          .logo { color: #ffffff; font-size: 48px; font-weight: 900; letter-spacing: -1px; margin: 0; }
          .tagline { color: #888888; font-size: 14px; margin-top: 8px; }
          .content { padding: 40px 20px; }
          .success-badge { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 24px; border-radius: 12px; text-align: center; margin-bottom: 32px; }
          .success-icon { font-size: 48px; margin-bottom: 8px; }
          .success-title { font-size: 24px; font-weight: bold; margin: 0; }
          .greeting { font-size: 18px; color: #333333; margin-bottom: 16px; }
          .message { font-size: 16px; line-height: 1.6; color: #666666; margin-bottom: 24px; }
          .booking-details { background-color: #f9fafb; border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; margin: 24px 0; }
          .booking-title { font-size: 20px; font-weight: bold; color: #000000; margin: 0 0 16px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-row:last-child { border-bottom: none; }
          .detail-label { font-weight: 600; color: #374151; }
          .detail-value { color: #6b7280; }
          .price-row { background-color: #000000; color: #ffffff; padding: 16px; border-radius: 8px; margin-top: 16px; }
          .cta-button { display: inline-block; background-color: #000000; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 24px 0; }
          .footer { background-color: #f9fafb; padding: 32px 20px; text-align: center; border-top: 2px solid #e5e7eb; }
          .footer-text { font-size: 14px; color: #6b7280; margin: 8px 0; }
          .footer-link { color: #000000; text-decoration: none; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="logo">EVNT</h1>
            <p class="tagline">Event Planning Simplified</p>
          </div>
          
          <div class="content">
            <div class="success-badge">
              <div class="success-icon">✓</div>
              <h2 class="success-title">Booking Confirmed!</h2>
            </div>
            
            <h2 class="greeting">Hi Sarah Johnson,</h2>
            
            <p class="message">
              Great news! Your booking with <strong>Elite Events DJ</strong> has been confirmed. 
              We're excited for your upcoming event!
            </p>
            
            <div class="booking-details">
              <h3 class="booking-title">Booking Details</h3>
              
              <div class="detail-row">
                <span class="detail-label">Vendor:</span>
                <span class="detail-value">Elite Events DJ</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Event Type:</span>
                <span class="detail-value">Wedding</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Event Date:</span>
                <span class="detail-value">June 15, 2026</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Location:</span>
                <span class="detail-value">The Grand Ballroom, New York</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Guest Count:</span>
                <span class="detail-value">150 guests</span>
              </div>
              
              <div class="price-row">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 18px; font-weight: bold;">Total Amount:</span>
                  <span style="font-size: 24px; font-weight: bold;">$2,500</span>
                </div>
              </div>
            </div>
            
            <p class="message">
              Your payment has been securely processed. The vendor will receive their payout 
              after your event is successfully completed.
            </p>
            
            <div style="text-align: center;">
              <a href="#" class="cta-button">View Booking Details</a>
            </div>
            
            <p class="message" style="font-size: 14px; color: #6b7280;">
              <strong>What's Next?</strong><br>
              • You can message your vendor directly through the EVNT platform<br>
              • Check your booking status anytime in your dashboard<br>
              • If you have any questions, we're here to help!
            </p>
          </div>
          
          <div class="footer">
            <p class="footer-text">
              <strong>Need Help?</strong><br>
              Contact us at <a href="mailto:info@joinevnt.com" class="footer-link">info@joinevnt.com</a>
            </p>
            <p class="footer-text">
              © 2026 EVNT. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-black mb-2">Email Template Preview</h1>
          <p className="text-gray-600 mb-4">Booking Confirmation Email</p>
          <Button
            onClick={() => {
              const win = window.open('', '_blank');
              win.document.write(bookingConfirmationEmail);
              win.document.close();
            }}
            className="bg-black text-white hover:bg-gray-800"
          >
            Open in New Window
          </Button>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <iframe
            srcDoc={bookingConfirmationEmail}
            className="w-full"
            style={{ height: '800px', border: 'none' }}
            title="Email Preview"
          />
        </div>
      </div>
    </div>
  );
}