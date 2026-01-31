import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 md:py-12 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        <Card className="border-4 border-black shadow-lg">
          <CardHeader className="bg-black text-white">
            <CardTitle className="text-4xl md:text-5xl font-black">Terms of Service</CardTitle>
            <p className="text-gray-300 mt-3 text-lg font-medium">Last Updated: January 28, 2026</p>
          </CardHeader>
          <CardContent className="p-8 md:p-12 space-y-8">
            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">1. Agreement to Terms</h2>
              <p className="text-gray-700 text-base md:text-lg leading-relaxed">
                By accessing and using EVNT ("the Platform"), you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">2. Platform Description</h2>
              <p className="text-gray-700 text-base md:text-lg leading-relaxed">
                EVNT is a marketplace connecting event service vendors with clients planning events. We facilitate 
                connections and bookings but are not directly involved in the provision of services between vendors and clients.
              </p>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">3. User Accounts</h2>
              <div className="space-y-3 text-gray-700">
                <p className="font-semibold">Client Accounts:</p>
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
              <h2 className="text-2xl font-bold mb-3">4. Payments and Fees</h2>
              <div className="space-y-3 text-gray-700">
                <ul className="list-disc pl-6 space-y-2">
                  <li>All payments are processed securely through Stripe</li>
                  <li>Client pays the agreed total booking price</li>
                  <li>EVNT retains a service fee percentage from each booking</li>
                  <li>Vendor receives the remaining balance after EVNT's service fee is deducted</li>
                  <li>Payments are held in escrow until the event is completed</li>
                  <li>Vendors receive payout within 24-48 hours of event completion</li>
                  <li>Refunds are subject to the cancellation policy agreed upon in the booking</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">5. Cancellations and Refunds</h2>
              <div className="space-y-3 text-gray-700">
                <ul className="list-disc pl-6 space-y-2">
                  <li>Cancellation policies are set by individual vendors</li>
                  <li>Clients may cancel bookings according to the vendor's policy</li>
                  <li>Refunds are processed according to the cancellation timeline</li>
                  <li>EVNT may charge a processing fee for cancelled bookings</li>
                  <li>Disputes should be reported to info@joinevnt.com within 48 hours</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">6. User Conduct</h2>
              <div className="space-y-3 text-gray-700">
                <p>Users agree not to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide false or misleading information</li>
                  <li>Engage in fraudulent activity</li>
                  <li>Harass or abuse other users</li>
                  <li>Circumvent the platform to avoid fees</li>
                  <li>Use the platform for illegal purposes</li>
                  <li>Share login credentials</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">7. Vendor Responsibilities</h2>
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
              <h2 className="text-2xl font-bold mb-3">8. Liability and Disclaimers</h2>
              <div className="space-y-3 text-gray-700">
                <ul className="list-disc pl-6 space-y-2">
                  <li>EVNT is a platform connecting vendors and clients; we do not provide event services directly</li>
                  <li>We are not responsible for the quality, safety, or legality of vendor services</li>
                  <li>Users assume all risks associated with using vendor services</li>
                  <li>EVNT is not liable for disputes between vendors and clients</li>
                  <li>Our total liability is limited to the platform fees paid</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">9. Intellectual Property</h2>
              <p className="text-gray-700 leading-relaxed">
                All content on EVNT, including logos, designs, and text, is owned by EVNT or licensed to us. 
                Users retain ownership of content they upload but grant EVNT a license to display it on the platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">10. Termination</h2>
              <p className="text-gray-700 leading-relaxed">
                EVNT reserves the right to suspend or terminate accounts that violate these terms. 
                Users may close their accounts at any time through their profile settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">11. Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update these terms from time to time. Continued use of the platform after changes 
                constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">12. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed">
                For questions about these terms, contact us at:
                <br />
                <strong>Email:</strong> info@joinevnt.com
              </p>
            </section>

            <div className="mt-10 p-6 bg-black text-white rounded-xl text-center">
              <p className="font-black text-lg md:text-xl">By using EVNT, you acknowledge that you have read, understood, and agree to these Terms of Service.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}