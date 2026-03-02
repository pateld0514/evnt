import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="border-4 border-black shadow-lg">
          <CardHeader className="bg-black text-white">
            <CardTitle className="text-4xl md:text-5xl font-black">Refund & Cancellation Policy</CardTitle>
            <p className="text-gray-300 mt-3 text-lg font-medium">Last Updated: March 1, 2026</p>
          </CardHeader>
          <CardContent className="p-8 md:p-12 space-y-8">

            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5 flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-bold mb-1">Important Notice</p>
                <p>EVNT is a marketplace platform connecting event clients with independent vendors. Service agreements are made directly between clients and vendors. EVNT does not provide event services and does not control vendor cancellation policies but facilitates payments and dispute resolution according to this policy.</p>
              </div>
            </div>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">1. Marketplace Role</h2>
              <p className="text-gray-700 leading-relaxed">
                EVNT is a platform that connects event clients with independent vendors. Service agreements are made directly between clients and vendors. EVNT does not provide event services and does not control vendor cancellation policies but facilitates payments and dispute resolution according to this policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">2. Vendor Cancellation Policies</h2>
              <div className="space-y-3 text-gray-700">
                <p>Each vendor sets their own cancellation and refund terms, which are displayed before booking confirmation. These policies may include:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Full refunds within a specified timeframe</li>
                  <li>Partial refunds depending on notice period</li>
                  <li>Non-refundable deposits</li>
                  <li>Rescheduling options</li>
                </ul>
                <p className="font-semibold mt-3">By completing a booking, the client agrees to the vendor's cancellation policy.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">3. Client Cancellations</h2>
              <div className="space-y-3 text-gray-700">
                <p>If a client cancels a booking:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Refund eligibility is determined by the vendor's stated cancellation policy</li>
                  <li>Refunds, if applicable, are issued to the original payment method</li>
                  <li>Processing times may vary depending on the payment provider</li>
                  <li>EVNT may deduct non-recoverable payment processing costs where permitted by law</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">4. Vendor Cancellations</h2>
              <div className="space-y-3 text-gray-700">
                <p>If a vendor cancels a confirmed booking:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>The client will receive a full refund of the amount paid</li>
                  <li>EVNT may assist the client in finding a replacement vendor when possible</li>
                  <li>Vendors who repeatedly cancel bookings may face account suspension or removal</li>
                </ul>
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mt-3">
                  <p className="font-semibold text-green-900">Client Protection: If a vendor cancels a confirmed booking, you are always entitled to a full refund.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">5. Rescheduling</h2>
              <p className="text-gray-700 leading-relaxed">
                Rescheduling requests must be mutually agreed upon by both client and vendor through the EVNT platform messaging system. Any pricing adjustments or new terms must be confirmed within the updated booking agreement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">6. Payment Protection & Escrow</h2>
              <div className="space-y-3 text-gray-700">
                <p>Payments made through EVNT are securely held until service completion. Funds are released to vendors after the event is completed unless:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>A cancellation occurs under an eligible refund condition, or</li>
                  <li>A dispute is opened within the allowed timeframe (48 hours after the event)</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">7. Disputes and Refund Requests</h2>
              <div className="space-y-3 text-gray-700">
                <p>If a problem occurs, clients must report disputes within <strong>48 hours</strong> after the scheduled event end time by contacting:</p>
                <p className="font-semibold">info@joinevnt.com</p>
                <p>Disputes may include:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Service not delivered</li>
                  <li>Significant deviation from agreed services</li>
                  <li>Vendor no-show</li>
                </ul>
                <p>EVNT may request supporting documentation such as messages, contracts, or event evidence.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">8. Dispute Review Process</h2>
              <div className="space-y-3 text-gray-700">
                <p>During review, EVNT may:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Temporarily hold payout funds</li>
                  <li>Request information from both parties</li>
                  <li>Evaluate booking details and communications</li>
                </ul>
                <p>EVNT will make a good-faith determination based on available evidence and platform policies. Decisions made by EVNT regarding platform payment releases are final to the extent permitted by law.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">9. Non-Refundable Situations</h2>
              <div className="space-y-3 text-gray-700">
                <p>Refunds may not be issued for:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Change of mind after booking</li>
                  <li>Dissatisfaction not related to agreed services</li>
                  <li>Issues outside vendor control (e.g., weather, venue problems)</li>
                  <li>Failure to read vendor listing details before booking</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">10. Chargebacks</h2>
              <p className="text-gray-700 leading-relaxed">
                Clients agree to contact EVNT before initiating a chargeback with their payment provider. If a chargeback is filed, EVNT may suspend accounts during investigation. Vendors agree to cooperate by providing documentation. Improper chargebacks may result in account termination.
              </p>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">11. Force Majeure (Unforeseeable Events)</h2>
              <div className="space-y-3 text-gray-700">
                <p>Neither EVNT, vendors, nor clients are liable for failure to perform due to events beyond reasonable control, including:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Natural disasters</li>
                  <li>Government restrictions</li>
                  <li>Public health emergencies</li>
                  <li>Severe weather</li>
                  <li>Venue closures</li>
                </ul>
                <p>Refunds or rescheduling under these circumstances are determined by the vendor's policy unless otherwise required by law.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">12. Processing Times</h2>
              <p className="text-gray-700 leading-relaxed">
                Approved refunds typically process within <strong>5–10 business days</strong> depending on the payment provider and financial institution.
              </p>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">13. Policy Updates</h2>
              <p className="text-gray-700 leading-relaxed">
                EVNT may update this policy periodically. Continued use of the platform after updates constitutes acceptance of the revised policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">14. Contact</h2>
              <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-5 text-gray-700">
                <p className="font-bold mb-2">EVNT Support</p>
                <p><strong>Email:</strong> info@joinevnt.com</p>
                <p><strong>Response Time:</strong> Within 48 hours</p>
              </div>
            </section>

            <div className="mt-8 p-6 bg-black text-white rounded-xl text-center">
              <p className="font-black text-lg">By making a booking on EVNT, you acknowledge and agree to this Refund & Cancellation Policy.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}