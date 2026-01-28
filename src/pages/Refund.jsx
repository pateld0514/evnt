import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="border-2 border-black">
          <CardHeader className="bg-black text-white">
            <CardTitle className="text-3xl font-black">Cancellation & Refund Policy</CardTitle>
            <p className="text-gray-300 mt-2">Last Updated: January 28, 2026</p>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-bold mb-1">Important Notice</p>
                <p>
                  EVNT is a marketplace platform. Cancellation and refund policies are set by individual vendors 
                  and agreed upon at the time of booking. This policy outlines the general framework and platform procedures.
                </p>
              </div>
            </div>

            <section>
              <h2 className="text-2xl font-bold mb-3">1. Vendor Cancellation Policies</h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  Each vendor on EVNT sets their own cancellation terms, which are presented to you before confirming a booking. 
                  Common policies include:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Flexible:</strong> Full refund if cancelled 7+ days before event</li>
                  <li><strong>Moderate:</strong> 50% refund if cancelled 14+ days before event</li>
                  <li><strong>Strict:</strong> No refund if cancelled less than 30 days before event</li>
                  <li><strong>Custom:</strong> Vendor-specific terms outlined in booking agreement</li>
                </ul>
                <p className="mt-3 font-semibold">
                  Always review the specific cancellation policy for your booking before confirming.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">2. Client-Initiated Cancellations</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold mb-2">Before Vendor Accepts:</h3>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Full refund of any deposits or fees paid</li>
                    <li>No penalty for cancelling pending bookings</li>
                    <li>Cancellation can be done through your bookings page</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-bold mb-2">After Vendor Accepts:</h3>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Cancellation terms as agreed in the booking contract</li>
                    <li>Refund amount depends on timing and vendor's policy</li>
                    <li>Platform fees (if applicable) may be non-refundable</li>
                    <li>Contact vendor directly to discuss potential flexibility</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-bold mb-2">How to Cancel:</h3>
                  <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                    <li>Log in to your EVNT account</li>
                    <li>Go to "My Bookings"</li>
                    <li>Select the booking you want to cancel</li>
                    <li>Click "Cancel Booking" and confirm</li>
                    <li>Refunds are processed within 5-7 business days</li>
                  </ol>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">3. Vendor-Initiated Cancellations</h2>
              <div className="space-y-3 text-gray-700">
                <p>If a vendor cancels a confirmed booking:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Client receives a <strong>full refund</strong> of all payments made</li>
                  <li>Refund is processed immediately (within 24 hours)</li>
                  <li>Vendor may face account penalties for excessive cancellations</li>
                  <li>EVNT will assist in finding alternative vendors when possible</li>
                </ul>
                <p className="mt-3 bg-green-50 border-2 border-green-200 rounded-lg p-3 font-semibold">
                  Client Protection: If a vendor cancels, you are always entitled to a full refund.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">4. Force Majeure & Unforeseen Circumstances</h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  In cases of events beyond reasonable control (severe weather, natural disasters, government restrictions, etc.):
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Standard cancellation policies may be waived</li>
                  <li>Clients and vendors should work together to reschedule or find solutions</li>
                  <li>Refunds or credits may be offered at vendor's discretion</li>
                  <li>EVNT will facilitate communication and resolution</li>
                  <li>Insurance coverage (if purchased) may apply</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">5. Refund Processing</h2>
              <div className="space-y-3 text-gray-700">
                <ul className="list-disc pl-6 space-y-2">
                  <li>Refunds are issued to the original payment method</li>
                  <li>Processing time: 5-7 business days after approval</li>
                  <li>Bank processing may take additional 3-5 business days</li>
                  <li>You'll receive an email confirmation when refund is initiated</li>
                  <li>Platform fees may be deducted from refund amount per vendor policy</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">6. Disputes and Resolution</h2>
              <div className="space-y-3 text-gray-700">
                <p>If you have a dispute about a cancellation or refund:</p>
                <ol className="list-decimal pl-6 space-y-2">
                  <li><strong>Contact the Vendor:</strong> Try to resolve directly with the vendor first</li>
                  <li><strong>Review Your Contract:</strong> Check the booking agreement and cancellation terms</li>
                  <li><strong>Contact EVNT Support:</strong> Email support@evnt.com with your booking details</li>
                  <li><strong>Provide Documentation:</strong> Include any relevant communications or evidence</li>
                  <li><strong>Mediation:</strong> EVNT may mediate disputes between clients and vendors</li>
                </ol>
                <p className="mt-3 font-semibold">
                  Response Time: We respond to all dispute inquiries within 48 hours.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">7. No-Show Policy</h2>
              <div className="space-y-3 text-gray-700">
                <p><strong>Client No-Show:</strong></p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>If client fails to be present at scheduled event time</li>
                  <li>No refund is provided</li>
                  <li>Vendor is entitled to full payment</li>
                </ul>

                <p><strong>Vendor No-Show:</strong></p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>If vendor fails to show up for booked event</li>
                  <li>Immediate full refund to client</li>
                  <li>Vendor account may be suspended</li>
                  <li>Additional compensation may be provided</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">8. Partial Services & Partial Refunds</h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  If a vendor provides partial services or there are issues with service quality:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Contact EVNT support within 48 hours of the event</li>
                  <li>Provide details and evidence of the issue</li>
                  <li>Partial refunds may be issued based on investigation</li>
                  <li>Vendor will have opportunity to respond and resolve</li>
                  <li>EVNT's decision on partial refunds is final</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">9. Event Postponement</h2>
              <div className="space-y-3 text-gray-700">
                <p>If you need to postpone (not cancel) your event:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Contact vendor as soon as possible</li>
                  <li>Subject to vendor's availability and policies</li>
                  <li>Payment may be transferred to new date</li>
                  <li>Price adjustments may apply for new date</li>
                  <li>Changes must be mutually agreed upon</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">10. EVNT Platform Fees</h2>
              <div className="space-y-3 text-gray-700">
                <ul className="list-disc pl-6 space-y-2">
                  <li>Platform fees are calculated as a percentage of booking total</li>
                  <li>In most cancellations, platform fees are non-refundable</li>
                  <li>Exception: Vendor-initiated cancellations result in full refund including fees</li>
                  <li>Platform fees cover payment processing, customer support, and platform services</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">11. Contact & Support</h2>
              <div className="text-gray-700">
                <p className="mb-3">For cancellation or refund questions:</p>
                <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
                  <p><strong>Email:</strong> support@evnt.com</p>
                  <p><strong>Cancellation Support:</strong> cancellations@evnt.com</p>
                  <p><strong>Response Time:</strong> Within 48 hours</p>
                  <p><strong>Phone Support:</strong> Available for urgent matters (provided in confirmation email)</p>
                </div>
              </div>
            </section>

            <div className="mt-8 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Important:</strong> This policy provides general guidelines. Specific cancellation terms 
                for your booking are outlined in your booking agreement and confirmation email. In case of conflict, 
                the specific booking terms take precedence.
              </p>
            </div>

            <div className="mt-4 p-4 bg-black text-white rounded-lg text-center">
              <p className="font-bold">By making a booking on EVNT, you acknowledge and agree to this Cancellation & Refund Policy.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}