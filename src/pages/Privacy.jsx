import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="border-2 border-black">
          <CardHeader className="bg-black text-white">
            <CardTitle className="text-3xl font-black">Privacy Policy</CardTitle>
            <p className="text-gray-300 mt-2">Last Updated: January 28, 2026</p>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <section>
              <h2 className="text-2xl font-bold mb-3">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                EVNT ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains 
                how we collect, use, disclose, and safeguard your information when you use our platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">2. Information We Collect</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold mb-2">Personal Information:</h3>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Name and contact information (email, phone number)</li>
                    <li>Account credentials (encrypted)</li>
                    <li>Profile information and preferences</li>
                    <li>Payment information (processed securely through Stripe)</li>
                    <li>Business information for vendors (business name, location, services)</li>
                    <li>Government-issued ID for vendor verification</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-bold mb-2">Usage Information:</h3>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Booking history and transaction records</li>
                    <li>Messages and communications on the platform</li>
                    <li>Reviews and ratings</li>
                    <li>Search queries and browsing activity</li>
                    <li>Device information and IP address</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">3. How We Use Your Information</h2>
              <div className="space-y-3 text-gray-700">
                <ul className="list-disc pl-6 space-y-2">
                  <li>To provide and maintain our platform services</li>
                  <li>To process bookings and payments</li>
                  <li>To facilitate communication between vendors and clients</li>
                  <li>To verify vendor identities and credentials</li>
                  <li>To send notifications about bookings, messages, and account activity</li>
                  <li>To improve our services and user experience</li>
                  <li>To detect and prevent fraud or abuse</li>
                  <li>To comply with legal obligations</li>
                  <li>To send marketing communications (with your consent)</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">4. Information Sharing and Disclosure</h2>
              <div className="space-y-4 text-gray-700">
                <p>We may share your information with:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Other Users:</strong> Profile information is visible to other users as needed for bookings</li>
                  <li><strong>Service Providers:</strong> Payment processors (Stripe), email services, hosting providers</li>
                  <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                  <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
                  <li><strong>With Your Consent:</strong> When you explicitly agree to share information</li>
                </ul>
                <p className="mt-3 font-semibold">We do NOT sell your personal information to third parties.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">5. Data Security</h2>
              <div className="space-y-3 text-gray-700">
                <p>We implement security measures to protect your information, including:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Encryption of sensitive data (passwords, payment information)</li>
                  <li>Secure HTTPS connections</li>
                  <li>Regular security audits and updates</li>
                  <li>Access controls and authentication</li>
                  <li>Secure payment processing through Stripe (PCI-DSS compliant)</li>
                </ul>
                <p className="mt-3">
                  However, no method of transmission over the Internet is 100% secure. 
                  While we strive to protect your data, we cannot guarantee absolute security.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">6. Your Privacy Rights</h2>
              <div className="space-y-3 text-gray-700">
                <p>Depending on your location, you may have the following rights:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                  <li><strong>Portability:</strong> Receive your data in a portable format</li>
                  <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
                  <li><strong>Objection:</strong> Object to certain data processing activities</li>
                </ul>
                <p className="mt-3">
                  To exercise these rights, contact us at <strong>privacy@evnt.com</strong>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">7. Cookies and Tracking</h2>
              <div className="space-y-3 text-gray-700">
                <p>We use cookies and similar technologies to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Keep you logged in</li>
                  <li>Remember your preferences</li>
                  <li>Analyze platform usage and performance</li>
                  <li>Personalize your experience</li>
                </ul>
                <p className="mt-3">
                  You can control cookies through your browser settings, but some features may not function properly if cookies are disabled.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">8. Data Retention</h2>
              <p className="text-gray-700 leading-relaxed">
                We retain your personal information for as long as necessary to provide our services, 
                comply with legal obligations, resolve disputes, and enforce our agreements. 
                When you close your account, we may retain certain information for legal and business purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">9. Children's Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                EVNT is not intended for users under the age of 18. We do not knowingly collect personal 
                information from children. If you believe we have collected information from a child, 
                please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">10. International Data Transfers</h2>
              <p className="text-gray-700 leading-relaxed">
                Your information may be transferred to and processed in countries other than your own. 
                We take steps to ensure your data is protected according to this Privacy Policy regardless of location.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">11. Changes to This Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of significant changes 
                via email or platform notification. Continued use of EVNT after changes constitutes acceptance 
                of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">12. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed">
                For questions or concerns about this Privacy Policy or our data practices:
                <br /><br />
                <strong>Email:</strong> privacy@evnt.com
                <br />
                <strong>Support:</strong> support@evnt.com
                <br />
                <strong>Data Protection Officer:</strong> dpo@evnt.com
              </p>
            </section>

            <div className="mt-8 p-4 bg-black text-white rounded-lg text-center">
              <p className="font-bold">Your privacy is important to us. By using EVNT, you consent to the collection and use of information as described in this Privacy Policy.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}