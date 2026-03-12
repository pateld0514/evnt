import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 md:py-12 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        <Card className="border-4 border-black shadow-lg">
          <CardHeader className="bg-black text-white">
            <CardTitle className="text-4xl md:text-5xl font-black">Terms of Service</CardTitle>
            <p className="text-gray-300 mt-3 text-lg font-medium">Last Updated: March 1, 2026</p>
          </CardHeader>
          <CardContent className="p-8 md:p-12 space-y-8">

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">1. Agreement to Terms</h2>
              <p className="text-gray-700 text-base md:text-lg leading-relaxed">
                By accessing and using EVNT ("the Platform"), you confirm that you are at least 18 years old and agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">2. Platform Description</h2>
              <p className="text-gray-700 text-base md:text-lg leading-relaxed">
                EVNT is a marketplace connecting event service vendors with clients planning events. We facilitate connections and bookings but are not directly involved in the provision of services between vendors and clients.
              </p>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">3. Marketplace Role</h2>
              <p className="text-gray-700 text-base md:text-lg leading-relaxed">
                EVNT is not a party to any agreement between clients and vendors. Any service agreement entered into is solely between the client and vendor. EVNT acts only as a technology platform facilitating introductions, communication, and payment processing. EVNT does not guarantee bookings, vendor availability, service quality, or event outcomes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">4. Eligibility & User Accounts</h2>
              <div className="space-y-3 text-gray-700">
                <p className="font-semibold">Age Requirement:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Users must be at least 18 years old to create an account or use the Platform.</li>
                </ul>

                <p className="font-semibold mt-4">Client Accounts:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Clients may browse vendors, save favorites, and book services</li>
                  <li>Payment information must be accurate and up-to-date</li>
                  <li>Clients are responsible for all bookings made through their account</li>
                </ul>

                <p className="font-semibold mt-4">Vendor Accounts:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Vendors must provide accurate business information and valid ID verification</li>
                  <li>All vendor accounts require admin approval before going live</li>
                  <li>Vendors must maintain active liability insurance</li>
                  <li>Banking information is required to receive payments</li>
                  <li>Vendors are responsible for all services provided to clients</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">5. Payments and Fees</h2>
              <div className="space-y-5 text-gray-700">
                <div>
                  <p className="font-semibold mb-2">Payment Processing:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>All payments are processed securely through Stripe</li>
                    <li>Client pays the agreed service price (no taxes or fees added on top)</li>
                    <li>EVNT service fee and applicable sales taxes are both deducted from the agreed service price</li>
                    <li>Vendor receives the agreed service price minus EVNT's fee, applicable taxes, and Stripe processing fees</li>
                    <li>Payments are held in escrow until the event is completed</li>
                    <li>Refunds are subject to the cancellation policy agreed upon in the booking</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold mb-2">Platform Fee:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>EVNT charges a 10% platform fee deducted from the vendor's payout after successful service completion</li>
                    <li>No upfront fees or monthly subscriptions are charged to vendors</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold mb-2">Taxes:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>EVNT collects applicable sales taxes where required and remits those taxes to the appropriate governmental authorities in accordance with applicable law</li>
                    <li>Tax rates are determined by the event location at time of booking</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold mb-2">Stripe Processing Fees:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Standard Stripe payment processing fees (approximately 2.9% + $0.30 per transaction) are deducted from the vendor's payout</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold mb-2">Escrow & Release:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Funds are held securely in escrow until both parties confirm the event is complete</li>
                    <li>A 24-hour dispute window is available after event completion before funds are released</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold mb-2">Vendor Payout Timeline:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>After booking completion:</strong> Vendors receive their payout within 5–7 business days following successful event completion</li>
                    <li><strong>Bank transfer timing:</strong> Once released by EVNT, funds typically appear in the vendor's bank account within 2–3 business days depending on their financial institution</li>
                    <li><strong>Payout tracking:</strong> Vendors can view all pending and completed payouts in their dashboard under Payout History</li>
                  </ul>
                </div>

                <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-5">
                  <p className="font-semibold mb-2">Example Breakdown (for illustration only):</p>
                  <p className="text-sm">$1,000 booking in Kentucky (6% sales tax): Client pays $1,000 total. EVNT deducts $100 platform fee (10%) + $60 tax (6%) = $160. Vendor receives approximately $840 before Stripe processing fees.</p>
                </div>

                <div>
                  <p className="font-semibold mb-2">Step-by-Step Payment Flow:</p>
                  <ol className="list-decimal pl-6 space-y-2">
                    <li>Client sends a booking request with event details and initial budget</li>
                    <li>Vendor reviews and submits a pricing proposal including any additional charges (travel, equipment, etc.)</li>
                    <li>Client accepts the proposal and pays the agreed total through Stripe; funds are held in escrow</li>
                    <li>Both parties digitally sign the service agreement; vendor delivers service on the event date</li>
                    <li>After event completion, vendor payout is released from escrow within 5–7 business days</li>
                  </ol>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">6. Cancellations and Refunds</h2>
              <div className="space-y-3 text-gray-700">
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Free cancellation:</strong> Clients may cancel any booking free of charge up to 7 days before the event date</li>
                  <li><strong>Within 7 days:</strong> Cancellations within 7 days of the event are not permitted without admin approval</li>
                  <li>If payment is in escrow at the time of cancellation, the authorized hold is released back to the client's payment method</li>
                  <li>Once payment is captured (after event completion), cancellations require a refund request — not a standard cancellation</li>
                  <li>EVNT may deduct non-recoverable payment processing costs where permitted by law</li>
                  <li>Disputes should be reported to info@joinevnt.com within 48 hours of the event</li>
                </ul>
                <p className="mt-2">
                  See our full <Link to={createPageUrl("Refund")} className="underline font-semibold text-black">Refund & Cancellation Policy</Link> for complete details.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">7. User Conduct</h2>
              <div className="space-y-3 text-gray-700">
                <p>Users agree not to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide false or misleading information</li>
                  <li>Engage in fraudulent activity</li>
                  <li>Harass or abuse other users</li>
                  <li>Use the platform for illegal purposes</li>
                  <li>Share login credentials</li>
                  <li>Solicit, arrange, or accept payments outside the EVNT platform for services first introduced through EVNT for a period of 12 months following initial contact</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">8. Vendor Responsibilities</h2>
              <div className="space-y-3 text-gray-700">
                <ul className="list-disc pl-6 space-y-2">
                  <li>Vendors are independent contractors, not EVNT employees</li>
                  <li>Vendors are responsible for their own taxes and insurance</li>
                  <li>Vendors must deliver services as described in their listings</li>
                  <li>Vendors must maintain professional conduct with clients</li>
                  <li>Vendors must respond to booking requests within 48 hours</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">9. Chargebacks</h2>
              <div className="space-y-3 text-gray-700">
                <p>If a client initiates a payment dispute or chargeback, EVNT may temporarily withhold vendor payouts while the dispute is investigated. Vendors agree to cooperate in resolving payment disputes and provide requested documentation. Clients agree to contact EVNT before initiating a chargeback with their payment provider. Improper chargebacks may result in account suspension or termination.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">10. Intellectual Property</h2>
              <div className="space-y-3 text-gray-700">
                <p>All content on EVNT, including logos, designs, and text, is owned by EVNT or licensed to us.</p>
                <p>Users retain ownership of content they upload but grant EVNT a non-exclusive, worldwide, royalty-free license to use uploaded content for platform operation, promotion, and marketing purposes.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">11. Liability and Disclaimers</h2>
              <div className="space-y-3 text-gray-700">
                <ul className="list-disc pl-6 space-y-2">
                  <li>EVNT is a platform connecting vendors and clients; we do not provide event services directly</li>
                  <li>EVNT does not guarantee bookings, vendor availability, service quality, or event outcomes</li>
                  <li>We are not responsible for the quality, safety, or legality of vendor services</li>
                  <li>Users assume all risks associated with using vendor services</li>
                  <li>EVNT is not liable for disputes between vendors and clients</li>
                  <li>Our total liability is limited to the platform fees paid</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">12. Force Majeure</h2>
              <p className="text-gray-700 text-base md:text-lg leading-relaxed">
                EVNT shall not be liable for failure or delay in performance resulting from events beyond reasonable control including natural disasters, government actions, labor disputes, internet outages, public health emergencies, severe weather, or venue closures.
              </p>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">13. Dispute Resolution & Governing Law</h2>
              <div className="space-y-3 text-gray-700">
                <p>These Terms shall be governed by the laws of the State of Maryland, United States, without regard to conflict of law principles.</p>
                <p>Any disputes arising from these Terms or use of the Platform shall first be attempted to be resolved informally by contacting EVNT at info@joinevnt.com. If unresolved within 30 days, disputes shall be resolved through binding arbitration on an individual basis and not as part of any class action.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">14. Termination</h2>
              <p className="text-gray-700 leading-relaxed">
                EVNT reserves the right to suspend or terminate accounts that violate these terms. Users may close their accounts at any time through their profile settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">15. Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">16. Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                Use of the Platform is also governed by our <Link to={createPageUrl("Privacy")} className="underline font-semibold text-black">Privacy Policy</Link>, which is incorporated into these Terms by reference.
              </p>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">17. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed">
                For questions about these terms, contact us at:<br />
                <strong>Email:</strong> info@joinevnt.com
              </p>
            </section>

            <div className="mt-10 p-6 bg-black text-white rounded-xl text-center">
              <p className="font-black text-lg md:text-xl">By creating an account, you confirm that you are at least 18 years old and agree to these Terms of Service and our Privacy Policy.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}