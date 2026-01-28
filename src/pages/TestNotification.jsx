import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function TestNotificationPage() {
  const [sending, setSending] = useState(false);

  const sendTestNotification = async () => {
    setSending(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: "pateld0514@gmail.com",
        from_name: "EVNT Notifications",
        subject: "🎉 Example Notification - New Booking Request",
        body: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #000; color: #fff; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .logo { font-size: 36px; font-weight: 900; margin-bottom: 10px; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .highlight { background: #fff; border-left: 4px solid #000; padding: 15px; margin: 20px 0; border-radius: 5px; }
    .button { display: inline-block; padding: 15px 30px; background: #000; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">EVNT</div>
      <p>Event Planning Made Simple</p>
    </div>
    <div class="content">
      <h1>📬 Sample Notification</h1>
      <p>Hi there!</p>
      <p>This is an example of how notifications will look when sent from EVNT. Here's a sample booking notification:</p>
      
      <div class="highlight">
        <p><strong>🎉 New Booking Request</strong></p>
        <p><strong>From:</strong> Sarah Johnson</p>
        <p><strong>Event:</strong> Sweet 16 Party</p>
        <p><strong>Date:</strong> March 15, 2026</p>
        <p><strong>Location:</strong> Washington, DC</p>
        <p><strong>Budget:</strong> $2,500</p>
        <p><strong>Message:</strong> Looking for an amazing DJ for my daughter's Sweet 16! Need someone experienced with teen parties.</p>
      </div>
      
      <a href="#" class="button">View Booking Request</a>
      
      <p><strong>Other notification types you'll receive:</strong></p>
      <ul>
        <li>✅ Booking status updates (confirmed, completed, etc.)</li>
        <li>💬 New messages from clients/vendors</li>
        <li>💰 Payment received confirmations</li>
        <li>⭐ New review notifications</li>
        <li>📝 Vendor response updates</li>
      </ul>
      
      <p>You can manage your notification preferences (email, SMS, or both) in your Profile settings.</p>
    </div>
    <div class="footer">
      <p>EVNT - Modern Event Planning Platform</p>
      <p>Questions? Reply to this email or text 609-442-3524</p>
    </div>
  </div>
</body>
</html>
        `
      });
      
      toast.success("Test notification sent to pateld0514@gmail.com!");
    } catch (error) {
      toast.error("Failed to send notification");
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Card className="border-2 border-black">
        <CardHeader className="bg-black text-white">
          <CardTitle className="flex items-center gap-2 font-black">
            <Bell className="w-6 h-6" />
            Test Notification System
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <p className="text-gray-700">
              Click the button below to send a sample notification email to pateld0514@gmail.com showing what booking notifications will look like.
            </p>
            
            <Button
              onClick={sendTestNotification}
              disabled={sending}
              className="w-full bg-black text-white hover:bg-gray-800 font-bold h-12"
            >
              {sending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Bell className="w-5 h-5 mr-2" />
                  Send Test Notification
                </>
              )}
            </Button>
            
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-sm">
              <p className="font-bold text-blue-900 mb-2">Note:</p>
              <p className="text-blue-800">
                SMS notifications to 609-442-3524 will be enabled once you integrate Twilio or a similar SMS service. The notification system is ready and will automatically send both email and SMS based on user preferences.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}