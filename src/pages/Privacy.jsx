import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="border-4 border-black shadow-lg">
          <CardHeader className="bg-black text-white">
            <CardTitle className="text-4xl md:text-5xl font-black">Privacy Policy</CardTitle>
            <p className="text-gray-300 mt-3 text-lg font-medium">Last Updated: March 1, 2026</p>
          </CardHeader>
          <CardContent className="p-8 md:p-12 space-y-8">

            <p className="text-gray-700 text-base md:text-lg leading-relaxed">
              EVNT ("EVNT," "we," "our," or "us") respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use the EVNT platform, including our website and mobile experience (collectively, the "Platform"). By using EVNT, you agree to the practices described in this Privacy Policy.
            </p>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">1. Information We Collect</h2>
              <p className="text-gray-700 mb-4">We collect information you provide directly, information collected automatically, and information from third-party services.</p>

              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-bold mb-2">A. Information You Provide</h3>
                  <p className="text-gray-700 mb-2">When you create an account or use EVNT, we may collect:</p>
                  <p className="font-semibold text-gray-800 mt-3 mb-1">Account Information:</p>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Name and display name</li>
                    <li>Email address</li>
                    <li>Phone number</li>
                    <li>Profile photo (optional)</li>
                    <li>Business information (for vendors)</li>
                  </ul>
                  <p className="font-semibold text-gray-800 mt-3 mb-1">Booking Information:</p>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Event details (date, location, type of event)</li>
                    <li>Messages between clients and vendors</li>
                    <li>Booking requests and agreements</li>
                  </ul>
                  <p className="font-semibold text-gray-800 mt-3 mb-1">Payment Information:</p>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Billing details</li>
                    <li>Transaction history</li>
                    <li>Payout information (vendors only)</li>
                  </ul>
                  <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-3 rounded-lg border border-gray-200">⚠️ Payment card information is processed securely by Stripe and is not stored directly by EVNT.</p>
                </div>

                <div>
                  <h3 className="text-lg font-bold mb-2">B. Information Collected Automatically</h3>
                  <p className="text-gray-700 mb-2">When you use the Platform, we may automatically collect:</p>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>IP address</li>
                    <li>Device type and browser information</li>
                    <li>Operating system</li>
                    <li>Usage activity and interactions</li>
                    <li>Pages viewed and features used</li>
                    <li>Log and diagnostic data</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-bold mb-2">C. Information from Third Parties</h3>
                  <p className="text-gray-700 mb-2">We may receive information from payment processors, identity verification providers (for vendors), and analytics providers. Payments are processed through Stripe, which may collect and process payment data according to its own privacy policies.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">2. How We Use Your Information</h2>
              <p className="text-gray-700 mb-3">We use collected information to:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Create and manage user accounts</li>
                <li>Facilitate bookings between clients and vendors</li>
                <li>Process payments and payouts</li>
                <li>Enable messaging and communication</li>
                <li>Verify vendor identities</li>
                <li>Provide customer support</li>
                <li>Improve platform functionality</li>
                <li>Prevent fraud and unauthorized activity</li>
                <li>Comply with legal obligations</li>
                <li>Send service-related notifications</li>
                <li>Use uploaded content for platform operation, promotion, and marketing purposes (per license granted in Terms of Service)</li>
              </ul>
              <p className="mt-4 font-semibold text-gray-900">We do not sell your personal information.</p>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">3. How Information Is Shared</h2>
              <p className="text-gray-700 mb-3">We share information only when necessary to operate the Platform.</p>
              
              <p className="font-semibold mb-1">With Other Users:</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-3">
                <li>Vendor profiles and business details</li>
                <li>Client name and event details shared during booking</li>
                <li>Messages exchanged through EVNT</li>
              </ul>

              <p className="font-semibold mb-1">With Service Providers:</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-3">
                <li>Payment processing providers (Stripe)</li>
                <li>Cloud hosting providers</li>
                <li>Analytics services</li>
                <li>Customer support tools</li>
              </ul>
              <p className="text-gray-700 mb-3">These providers may only use data to perform services for EVNT.</p>

              <p className="font-semibold mb-1">Legal Requirements:</p>
              <p className="text-gray-700">We may disclose information if required to comply with law or legal process, enforce our Terms of Service, or protect rights, safety, or security.</p>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">4. Payments and Financial Data</h2>
              <p className="text-gray-700 leading-relaxed">
                All payments are securely processed by Stripe. EVNT does not store full payment card numbers. Stripe may collect payment and identity verification information in accordance with its own privacy practices.
              </p>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">5. Data Retention</h2>
              <p className="text-gray-700 leading-relaxed">
                We retain personal information only as long as necessary to provide services, comply with legal obligations, resolve disputes, and enforce agreements. Account information may remain archived where legally required even after account deletion.
              </p>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">6. Cookies and Tracking Technologies</h2>
              <p className="text-gray-700 mb-3">EVNT uses cookies and similar technologies to:</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Keep users logged in</li>
                <li>Remember preferences</li>
                <li>Analyze usage trends</li>
                <li>Improve performance and security</li>
              </ul>
              <p className="mt-3 text-gray-700">You can control cookies through your browser settings, though some features may not function properly if disabled.</p>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">7. Your Privacy Rights</h2>
              <p className="text-gray-700 mb-3">Depending on your location, you may have rights to:</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Access your personal data</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your data</li>
                <li>Object to certain processing activities</li>
              </ul>
              <p className="mt-3 text-gray-700">You may request account deletion by contacting us at info@joinevnt.com.</p>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">8. Data Security</h2>
              <p className="text-gray-700 leading-relaxed">
                We implement reasonable administrative, technical, and organizational safeguards designed to protect your information. However, no online system can be guaranteed completely secure. Users are responsible for maintaining the confidentiality of their login credentials.
              </p>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">9. Children's Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                EVNT is intended for users who are at least 18 years old. We do not knowingly collect personal information from individuals under 18. If we learn that information has been collected from a minor, we will delete it promptly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">10. International Data Transfers</h2>
              <p className="text-gray-700 leading-relaxed">
                If you access EVNT from outside the United States, your information may be transferred to and processed in the United States where data protection laws may differ from those in your jurisdiction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">11. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy periodically. When changes are made, we will update the "Last Updated" date. Continued use of the Platform after updates constitutes acceptance of the revised policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl md:text-3xl font-black mb-4">12. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have questions about this Privacy Policy or your data:<br /><br />
                <strong>EVNT</strong><br />
                <strong>Email:</strong> info@joinevnt.com
              </p>
            </section>

            <div className="mt-8 p-6 bg-black text-white rounded-xl text-center">
              <p className="font-black text-lg">By using EVNT, you agree to the practices described in this Privacy Policy.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}